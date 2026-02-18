import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = (await request.json()) as {
    username?: string;
    moduleNumber?: number;
  };

  if (!body.username || !body.moduleNumber) {
    return NextResponse.json(
      { error: 'username and moduleNumber are required.' },
      { status: 400 },
    );
  }

  const db = getDb();
  const normalized = body.username.toLowerCase();
  const moduleNumber = Number(body.moduleNumber);

  const teacher = db
    .prepare(
      `
        SELECT name, username, company
        FROM teachers
        WHERE LOWER(username) = ?
      `,
    )
    .get(normalized) as { name?: string; username?: string; company?: string } | undefined;

  const teacherName = teacher?.name ?? teacher?.username ?? normalized;
  const company = teacher?.company ?? '';

  if (!company) {
    return NextResponse.json({ ok: true });
  }

  const event = {
    id: randomUUID(),
    type: 'push',
    to: company,
    source: 'ITTP Training',
    subject: '',
    title: 'Training Module Completed',
    body: `${teacherName} completed Module ${moduleNumber} in ITTP.`,
    data: {
      teacherUsername: teacher?.username ?? normalized,
      moduleNumber,
    },
    status: 'sent',
    createdAt: new Date().toISOString(),
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
  ).run({
    ...event,
    dataJson: JSON.stringify(event.data),
  });

  return NextResponse.json({ ok: true });
}
