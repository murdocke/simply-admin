import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = (await request.json()) as {
    username?: string;
    action?: 'open' | 'close';
    durationSeconds?: number;
  };

  if (!body.username || !body.action) {
    return NextResponse.json(
      { error: 'username and action are required.' },
      { status: 400 },
    );
  }

  const db = getDb();
  const now = new Date().toISOString();
  const normalized = body.username.toLowerCase();

  const existing = db
    .prepare(
      `
        SELECT username, first_opened_at
        FROM teacher_training_activity
        WHERE LOWER(username) = ?
      `,
    )
    .get(normalized) as { username?: string; first_opened_at?: string | null } | undefined;

  if (body.action === 'open') {
    const firstOpened = existing?.first_opened_at ?? now;
    db.prepare(
      `
        INSERT INTO teacher_training_activity (
          username,
          first_opened_at,
          last_opened_at,
          last_session_seconds,
          updated_at
        ) VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(username) DO UPDATE SET
          first_opened_at = COALESCE(teacher_training_activity.first_opened_at, excluded.first_opened_at),
          last_opened_at = excluded.last_opened_at,
          updated_at = excluded.updated_at
      `,
    ).run(normalized, firstOpened, now, null, now);
  } else {
    const duration = Number.isFinite(body.durationSeconds)
      ? Math.max(0, Math.round(body.durationSeconds as number))
      : null;
    db.prepare(
      `
        INSERT INTO teacher_training_activity (
          username,
          first_opened_at,
          last_opened_at,
          last_session_seconds,
          updated_at
        ) VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(username) DO UPDATE SET
          last_opened_at = excluded.last_opened_at,
          last_session_seconds = excluded.last_session_seconds,
          updated_at = excluded.updated_at
      `,
    ).run(
      normalized,
      existing?.first_opened_at ?? now,
      now,
      duration,
      now,
    );
  }

  return NextResponse.json({ ok: true });
}
