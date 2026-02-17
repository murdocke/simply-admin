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
      SELECT id, interest_name, interest_email, interest_phone, interest_city, interest_region
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
      }
    | undefined;

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
    name: firstName,
    alertId: alert?.id ?? null,
    email: alert?.interest_email ?? null,
    phone: alert?.interest_phone ?? null,
    city: alert?.interest_city ?? null,
    region: alert?.interest_region ?? null,
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
    return NextResponse.json({ ok: true, expiresAt });
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
    db.prepare(
      `
        UPDATE company_alerts
        SET
          registration_completed_at = ?,
          registration_active_at = NULL
        WHERE registration_token = ?
      `,
    ).run(now, body.token);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false }, { status: 400 });
}
