import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

type TrainingRecord = {
  username: string;
  itemKey: string;
  itemType: string;
  status: string;
  progress?: number | null;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json(
      { error: 'Username is required.' },
      { status: 400 },
    );
  }

  const db = getDb();
  const records = db
    .prepare(
      `
        SELECT username, item_key, item_type, status, progress, updated_at
        FROM teacher_training_progress
        WHERE LOWER(username) = ?
        ORDER BY updated_at DESC
      `,
    )
    .all(username.toLowerCase()) as Array<{
      username: string;
      item_key: string;
      item_type: string;
      status: string;
      progress: number | null;
      updated_at: string | null;
    }>;

  return NextResponse.json({
    records: records.map(record => ({
      username: record.username,
      itemKey: record.item_key,
      itemType: record.item_type,
      status: record.status,
      progress: record.progress,
      updatedAt: record.updated_at,
    })),
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<TrainingRecord>;

  if (!body.username || !body.itemKey || !body.itemType || !body.status) {
    return NextResponse.json(
      { error: 'username, itemKey, itemType, and status are required.' },
      { status: 400 },
    );
  }

  const db = getDb();
  const now = new Date().toISOString();

  db.prepare(
    `
      INSERT INTO teacher_training_progress (
        username,
        item_key,
        item_type,
        status,
        progress,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(username, item_key) DO UPDATE SET
        item_type = excluded.item_type,
        status = excluded.status,
        progress = excluded.progress,
        updated_at = excluded.updated_at
    `,
  ).run(
    body.username.toLowerCase(),
    body.itemKey,
    body.itemType,
    body.status,
    body.progress ?? null,
    now,
    now,
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const body = (await request.json()) as { username?: string };

  if (!body.username) {
    return NextResponse.json(
      { error: 'Username is required.' },
      { status: 400 },
    );
  }

  const db = getDb();
  db.prepare(
    `
      DELETE FROM teacher_training_progress
      WHERE LOWER(username) = ?
    `,
  ).run(body.username.toLowerCase());

  return NextResponse.json({ ok: true });
}
