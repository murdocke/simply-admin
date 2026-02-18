import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const alertId = searchParams.get('alertId');
  if (alertId) {
    const db = getDb();
    const row = db
      .prepare(
        `
        SELECT payload_json, submitted_at
        FROM questionnaire_responses
        WHERE alert_id = ?
        ORDER BY submitted_at DESC
        LIMIT 1
      `,
      )
      .get(alertId) as { payload_json?: string; submitted_at?: string } | undefined;
    return NextResponse.json({
      payload: row?.payload_json ? JSON.parse(row.payload_json) : null,
      submittedAt: row?.submitted_at ?? null,
    });
  }
  if (!token) {
    return NextResponse.json({ error: 'token is required.' }, { status: 400 });
  }
  const db = getDb();
  const alert = db
    .prepare(
      `
      SELECT id, interest_name, interest_email
      FROM company_alerts
      WHERE questionnaire_token = ?
    `,
    )
    .get(token) as
    | { id?: string; interest_name?: string; interest_email?: string }
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
        questionnaire_opened_at = ?,
        interest_stage = CASE
          WHEN interest_stage = 'questionnaire_sent' THEN 'questionnaire_opened'
          WHEN interest_stage = 'questionnaire_opened' THEN 'questionnaire_opened'
          ELSE interest_stage
        END
      WHERE questionnaire_token = ?
        AND (questionnaire_completed_at IS NULL OR questionnaire_completed_at = '')
    `,
  ).run(now, token);

  const full = alert?.interest_name ?? null;
  const firstName = full ? full.split(' ')[0] : null;
  return NextResponse.json({
    isRegisteredTraining: existingTeacher?.status === 'Training',
    teacherName: existingTeacher?.name ?? null,
    teacherEmail: existingTeacher?.email ?? null,
    name: firstName,
    alertId: alert?.id ?? null,
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    token?: string;
    payload?: Record<string, unknown>;
    action?: 'ping' | 'inactive';
  };

  if (body?.action === 'inactive') {
    if (!body?.token) {
      return NextResponse.json({ error: 'token is required.' }, { status: 400 });
    }
    const db = getDb();
    db.prepare(
      `
        UPDATE company_alerts
        SET
          questionnaire_active_at = NULL
        WHERE questionnaire_token = ?
      `,
    ).run(body.token);
    return NextResponse.json({ ok: true });
  }

  if (body?.action === 'ping') {
    if (!body?.token) {
      return NextResponse.json({ error: 'token is required.' }, { status: 400 });
    }
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(
      `
        UPDATE company_alerts
        SET
          questionnaire_active_at = ?,
          questionnaire_opened_at = COALESCE(NULLIF(questionnaire_opened_at, ''), ?),
          interest_stage = CASE
            WHEN interest_stage = 'questionnaire_sent' THEN 'questionnaire_opened'
            WHEN interest_stage = 'questionnaire_opened' THEN 'questionnaire_opened'
            ELSE interest_stage
          END
        WHERE questionnaire_token = ?
          AND (questionnaire_completed_at IS NULL OR questionnaire_completed_at = '')
      `,
    ).run(now, now, body.token);
    return NextResponse.json({ ok: true });
  }

  if (!body?.token || !body?.payload) {
    return NextResponse.json(
      { error: 'token and payload are required.' },
      { status: 400 },
    );
  }

  const db = getDb();
  const alert = db
    .prepare(
      `
      SELECT id, interest_name, interest_email
      FROM company_alerts
      WHERE questionnaire_token = ?
    `,
    )
    .get(body.token) as
    | { id: string; interest_name?: string; interest_email?: string }
    | undefined;

  if (!alert?.id) {
    return NextResponse.json({ error: 'Invalid token.' }, { status: 404 });
  }

  const now = new Date().toISOString();
  db.prepare(
    `
      INSERT INTO questionnaire_responses (
        id,
        alert_id,
        token,
        payload_json,
        submitted_at
      ) VALUES (?, ?, ?, ?, ?)
    `,
  ).run(
    randomUUID(),
    alert.id,
    body.token,
    JSON.stringify(body.payload),
    now,
  );

  db.prepare(
    `
      UPDATE company_alerts
      SET
        interest_stage = 'questionnaire_completed',
        questionnaire_completed_at = ?,
        questionnaire_active_at = NULL
      WHERE id = ?
    `,
  ).run(now, alert.id);

  const company = db
    .prepare(
      `
      SELECT email
      FROM accounts
      WHERE role = 'company' AND username = 'neil'
    `,
    )
    .get() as { email?: string } | undefined;
  const companyEmail = company?.email ?? 'neil@simplymusic.com';

  const completedBy = alert.interest_name ?? alert.interest_email ?? 'A teacher';
  const subject = 'Teacher Questionnaire Completed';
  const bodyText = `${completedBy} has completed the teacher questionnaire.`;

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
    companyEmail,
    'Questionnaire',
    subject,
    '',
    bodyText,
    JSON.stringify({ alertId: alert.id }),
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
    'push',
    companyEmail,
    'Teacher Interest',
    '',
    subject,
    bodyText,
    JSON.stringify({ alertId: alert.id }),
    'sent',
    now,
  );

  return NextResponse.json({ ok: true });
}
