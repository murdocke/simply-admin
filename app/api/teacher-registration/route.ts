import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';
const CODE_TTL_MS = 10 * 60 * 1000;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  if (!token) {
    return NextResponse.json({ error: 'token is required.' }, { status: 400 });
  }
  const db = getDb();
  const alert = db
    .prepare(
      `
      SELECT
        id,
        interest_name,
        interest_email,
        interest_phone,
        interest_city,
        interest_region,
        interest_postal_code
      FROM company_alerts
      WHERE registration_token = ?
    `,
    )
    .get(token) as
    | {
        id?: string;
        interest_name?: string;
        interest_email?: string;
        interest_phone?: string;
        interest_city?: string;
        interest_region?: string;
        interest_postal_code?: string;
      }
    | undefined;
  const emailLower = alert?.interest_email?.trim().toLowerCase() ?? '';
  const existingTeacher =
    emailLower.length > 0
      ? (db
          .prepare(
            `
            SELECT id, name, email, status
            FROM teachers
            WHERE LOWER(email) = ?
          `,
          )
          .get(emailLower) as
          | { id?: string; name?: string; email?: string; status?: string }
          | undefined)
      : undefined;

  const now = new Date().toISOString();
  db.prepare(
    `
      UPDATE company_alerts
      SET
        registration_opened_at = ?,
        registration_active_at = ?,
        interest_stage = CASE
          WHEN interest_stage = 'qualified' THEN 'qualified'
          ELSE interest_stage
        END
      WHERE registration_token = ?
        AND (registration_completed_at IS NULL OR registration_completed_at = '')
    `,
  ).run(now, now, token);

  const full = alert?.interest_name ?? null;
  const firstName = full ? full.split(' ')[0] : null;
  const nowTimestamp = new Date().toISOString();
  const activeEmail = alert?.id
    ? (db
        .prepare(
          `
          SELECT expires_at
          FROM registration_verification_codes
          WHERE alert_id = ? AND channel = 'email' AND consumed_at IS NULL
            AND datetime(expires_at) > datetime(?)
          ORDER BY datetime(created_at) DESC
          LIMIT 1
        `,
        )
        .get(alert.id, nowTimestamp) as { expires_at?: string } | undefined)
    : undefined;
  const activeSms = alert?.id
    ? (db
        .prepare(
          `
          SELECT expires_at
          FROM registration_verification_codes
          WHERE alert_id = ? AND channel = 'sms' AND consumed_at IS NULL
            AND datetime(expires_at) > datetime(?)
          ORDER BY datetime(created_at) DESC
          LIMIT 1
        `,
        )
        .get(alert.id, nowTimestamp) as { expires_at?: string } | undefined)
    : undefined;
  return NextResponse.json({
    isRegisteredTraining: existingTeacher?.status === 'Training',
    teacherName: existingTeacher?.name ?? null,
    teacherEmail: existingTeacher?.email ?? null,
    name: firstName,
    fullName: full,
    alertId: alert?.id ?? null,
    email: alert?.interest_email ?? null,
    phone: alert?.interest_phone ?? null,
    city: alert?.interest_city ?? null,
    region: alert?.interest_region ?? null,
    postalCode: alert?.interest_postal_code ?? null,
    emailCodeExpiresAt: activeEmail?.expires_at ?? null,
    smsCodeExpiresAt: activeSms?.expires_at ?? null,
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    token?: string;
    action?: 'ping' | 'inactive' | 'complete' | 'send-code' | 'verify-code';
    channel?: 'email' | 'sms';
    code?: string;
    password?: string;
  };

  if (!body?.token || !body?.action) {
    return NextResponse.json(
      { error: 'token and action are required.' },
      { status: 400 },
    );
  }

  const db = getDb();
  const now = new Date().toISOString();

  if (body.action === 'send-code') {
    if (!body.channel) {
      return NextResponse.json(
        { error: 'channel is required.' },
        { status: 400 },
      );
    }
    const alert = db
      .prepare(
        `
        SELECT id, interest_email, interest_phone
        FROM company_alerts
        WHERE registration_token = ?
      `,
      )
      .get(body.token) as
      | { id?: string; interest_email?: string; interest_phone?: string }
      | undefined;
    if (!alert?.id) {
      return NextResponse.json({ error: 'Invalid token.' }, { status: 404 });
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + CODE_TTL_MS).toISOString();
    db.prepare(
      `
        DELETE FROM registration_verification_codes
        WHERE alert_id = ? AND channel = ?
      `,
    ).run(alert.id, body.channel);
    db.prepare(
      `
        INSERT INTO registration_verification_codes (
          id,
          alert_id,
          token,
          channel,
          code,
          created_at,
          expires_at
        ) VALUES (
          @id,
          @alertId,
          @token,
          @channel,
          @code,
          @createdAt,
          @expiresAt
        )
      `,
    ).run({
      id: randomUUID(),
      alertId: alert.id,
      token: body.token,
      channel: body.channel,
      code,
      createdAt: now,
      expiresAt,
    });
    const alertPattern = `%\"alertId\":\"${alert.id}\"%`;
    const channelPattern = `%\"verificationChannel\":\"${body.channel}\"%`;
    db.prepare(
      `
        DELETE FROM notification_events
        WHERE source = 'Teacher Registration'
          AND (subject = 'Verification Code' OR title = 'Verification Code')
          AND data_json LIKE ?
          AND data_json LIKE ?
      `,
    ).run(alertPattern, channelPattern);
    const event = {
      id: randomUUID(),
      type: body.channel === 'email' ? 'email' : 'push',
      to: body.channel === 'email' ? alert.interest_email ?? '' : alert.interest_phone ?? '',
      source: 'Teacher Registration',
      subject: body.channel === 'email' ? 'Verification Code' : '',
      title: body.channel === 'sms' ? 'Verification Code' : '',
      body:
        body.channel === 'email'
          ? `Your email verification code is ${code}. It expires in 10 minutes.`
          : `Your SMS verification code is ${code}. It expires in 10 minutes.`,
      status: 'sent',
      createdAt: now,
      dataJson: JSON.stringify({
        alertId: alert.id,
        registrationToken: body.token,
        verificationChannel: body.channel,
        expiresAt,
      }),
    };
    db.prepare(
      `
        INSERT INTO notification_events (
          id,
          type,
          to_value,
          source,
          subject,
          title,
          body,
          data_json,
          status,
          created_at
        ) VALUES (
          @id,
          @type,
          @to,
          @source,
          @subject,
          @title,
          @body,
          @dataJson,
          @status,
          @createdAt
        )
      `,
    ).run(event);
    return NextResponse.json({ ok: true, expiresAt, demoCode: code });
  }

  if (body.action === 'verify-code') {
    if (!body.channel || !body.code) {
      return NextResponse.json(
        { error: 'channel and code are required.' },
        { status: 400 },
      );
    }
    const alert = db
      .prepare(
        `
        SELECT id
        FROM company_alerts
        WHERE registration_token = ?
      `,
      )
      .get(body.token) as { id?: string } | undefined;
    if (!alert?.id) {
      return NextResponse.json({ error: 'Invalid token.' }, { status: 404 });
    }
    const record = db
      .prepare(
        `
        SELECT id, code, expires_at
        FROM registration_verification_codes
        WHERE alert_id = ? AND channel = ? AND consumed_at IS NULL
          AND datetime(expires_at) > datetime(?)
        ORDER BY datetime(created_at) DESC
        LIMIT 1
      `,
      )
      .get(alert.id, body.channel, now) as
      | { id?: string; code?: string; expires_at?: string }
      | undefined;
    if (!record?.id) {
      return NextResponse.json({ ok: false, error: 'expired' });
    }
    if ((record.code ?? '').trim() !== body.code.trim()) {
      return NextResponse.json({ ok: false, error: 'invalid' });
    }
    db.prepare(
      `
        UPDATE registration_verification_codes
        SET consumed_at = ?
        WHERE id = ?
      `,
    ).run(now, record.id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'inactive') {
    db.prepare(
      `
        UPDATE company_alerts
        SET
          registration_active_at = NULL
        WHERE registration_token = ?
      `,
    ).run(body.token);
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'ping') {
    db.prepare(
      `
        UPDATE company_alerts
        SET
          registration_active_at = ?,
          registration_opened_at = ?,
          interest_stage = CASE
            WHEN interest_stage = 'qualified' THEN 'qualified'
            ELSE interest_stage
          END
        WHERE registration_token = ?
          AND (registration_completed_at IS NULL OR registration_completed_at = '')
      `,
    ).run(now, now, body.token);
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'complete') {
    const alert = db
      .prepare(
        `
        SELECT
          id,
          username,
          interest_name,
          interest_email,
          interest_city,
          interest_region
        FROM company_alerts
        WHERE registration_token = ?
      `,
      )
      .get(body.token) as
      | {
          id?: string;
          username?: string;
          interest_name?: string;
          interest_email?: string;
          interest_city?: string;
          interest_region?: string;
        }
      | undefined;

    if (!alert?.id) {
      return NextResponse.json({ error: 'Invalid token.' }, { status: 404 });
    }

    const name = alert.interest_name ?? 'Teacher';
    const email = alert.interest_email ?? '';
    const emailLower = email.trim().toLowerCase();
    const company = alert.username ?? 'neil';
    const region = alert.interest_region ?? alert.interest_city ?? 'Unassigned';
    const password = body.password?.trim() ?? '';

    const existingTeacher = emailLower
      ? (db
          .prepare(
            `
            SELECT id, username
            FROM teachers
            WHERE LOWER(email) = ?
          `,
          )
          .get(emailLower) as { id?: string; username?: string } | undefined)
      : undefined;

    const baseUsername =
      emailLower.split('@')[0]?.replace(/[^a-z0-9]/g, '') || 'teacher';
    let username = existingTeacher?.username ?? baseUsername;
    let suffix = 1;
    while (true) {
      const conflict = db
        .prepare(
          `
          SELECT username
          FROM accounts
          WHERE LOWER(username) = ?
        `,
        )
        .get(username.toLowerCase());
      const teacherConflict = db
        .prepare(
          `
          SELECT username
          FROM teachers
          WHERE LOWER(username) = ?
        `,
        )
        .get(username.toLowerCase());
      if (!conflict && !teacherConflict) break;
      if (existingTeacher?.username) break;
      suffix += 1;
      username = `${baseUsername}${suffix}`;
    }

    const nowTimestamp = new Date().toISOString();
    const teacherId = existingTeacher?.id ?? randomUUID();
    if (existingTeacher?.id) {
      db.prepare(
        `
        UPDATE teachers
        SET
          name = ?,
          email = ?,
          region = ?,
          status = ?,
          password = CASE WHEN ? != '' THEN ? ELSE password END,
          updated_at = ?
        WHERE id = ?
      `,
      ).run(name, email, region, 'Training', password, password, nowTimestamp, teacherId);
    } else {
      db.prepare(
        `
        INSERT INTO teachers (
          id,
          company,
          username,
          name,
          email,
          region,
          status,
          created_at,
          updated_at,
          password,
          goes_by,
          studio_id,
          studio_role
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      ).run(
        teacherId,
        company,
        username,
        name,
        email,
        region,
        'Training',
        nowTimestamp,
        nowTimestamp,
        password,
        '',
        '',
        '',
      );
    }

    db.prepare(
      `
        INSERT INTO accounts (
          username,
          role,
          name,
          email,
          status,
          last_login,
          password,
          teacher_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(username, role) DO UPDATE SET
          name = excluded.name,
          email = excluded.email,
          status = excluded.status,
          teacher_id = excluded.teacher_id,
          password = CASE
            WHEN excluded.password != '' THEN excluded.password
            ELSE accounts.password
          END
      `,
    ).run(
      username.toLowerCase(),
      'teacher',
      name,
      email,
      'Training',
      null,
      password,
      teacherId,
    );

    db.prepare(
      `
        UPDATE company_alerts
        SET
          registration_completed_at = ?,
          registration_active_at = NULL,
          username = ?
        WHERE registration_token = ?
      `,
    ).run(now, username.toLowerCase(), body.token);
    const teacherSubject = 'Welcome to Simply Music Teacher Training';
    const teacherBody = `Hi ${name}, your Simply Music Teacher Training account is ready. You can log in to finish setting up your profile and start your training journey.`;
    const adminSubject = 'New Training Teacher Registration';
    const adminBody = `${name} just completed the training registration flow.`;

    const neilAccount = db
      .prepare(
        `
        SELECT email
        FROM accounts
        WHERE role = 'company' AND username = 'neil'
      `,
      )
      .get() as { email?: string } | undefined;
    const neilEmail = neilAccount?.email ?? 'neil@simplymusic.com';

    db.prepare(
      `
        INSERT INTO notification_events (
          id,
          type,
          to_value,
          source,
          subject,
          title,
          body,
          data_json,
          status,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    ).run(
      randomUUID(),
      'email',
      email,
      'Teacher Registration',
      teacherSubject,
      '',
      teacherBody,
      JSON.stringify({
        alertId: alert.id,
        teacherId,
        username,
        email,
      }),
      'sent',
      now,
    );

    db.prepare(
      `
        INSERT INTO notification_events (
          id,
          type,
          to_value,
          source,
          subject,
          title,
          body,
          data_json,
          status,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    ).run(
      randomUUID(),
      'email',
      neilEmail,
      'Teacher Registration',
      adminSubject,
      '',
      `${adminBody} (Email: ${email})`,
      JSON.stringify({
        alertId: alert.id,
        teacherId,
        username,
        email,
      }),
      'sent',
      now,
    );

    const adminAccounts = db
      .prepare(
        `
        SELECT username, email
        FROM accounts
        WHERE role = 'company'
      `,
      )
      .all() as Array<{ username?: string; email?: string }>;

    adminAccounts.forEach(admin => {
      const destination =
        admin.email?.trim() || admin.username?.trim() || neilEmail;
      if (!destination) return;
      db.prepare(
        `
          INSERT INTO notification_events (
            id,
            type,
            to_value,
            source,
            subject,
            title,
            body,
            data_json,
            status,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      ).run(
        randomUUID(),
        'push',
        destination,
        'Teacher Registration',
        '',
        adminSubject,
        adminBody,
        JSON.stringify({
          alertId: alert.id,
          teacherId,
          username,
          email,
        }),
        'sent',
        now,
      );
    });

    return NextResponse.json({
      ok: true,
      email,
      name,
      username,
    });
  }

  return NextResponse.json({ ok: false }, { status: 400 });
}
