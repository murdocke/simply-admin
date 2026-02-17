import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = (await request.json()) as {
    to?: string;
    title?: string;
    body?: string;
    source?: string;
    data?: Record<string, unknown>;
  };

  if (!body?.to || !body?.title || !body?.body) {
    return NextResponse.json(
      { error: 'to, title, and body are required.' },
      { status: 400 },
    );
  }

  const event = {
    id: randomUUID(),
    type: 'push',
    to: body.to,
    source: body.source ?? '',
    subject: '',
    title: body.title,
    body: body.body,
    data: body.data ?? null,
    status: 'sent',
    createdAt: new Date().toISOString(),
  };

  const db = getDb();
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
    dataJson: event.data
      ? JSON.stringify({
          ...event.data,
          alertId: (event.data as Record<string, unknown>)?.alertId ?? null,
        })
      : null,
  });

  return NextResponse.json({ event });
}
