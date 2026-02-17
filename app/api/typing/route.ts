import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = (await request.json()) as { key?: string };
  if (!body?.key) {
    return NextResponse.json({ error: 'Key is required.' }, { status: 400 });
  }

  const db = getDb();
  const lastSeen = new Date().toISOString();
  db.prepare(
    `
      INSERT INTO typing (key, last_seen)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET last_seen = excluded.last_seen
    `,
  ).run(body.key, lastSeen);
  return NextResponse.json({ ok: true });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  if (!key) {
    return NextResponse.json({ error: 'Key is required.' }, { status: 400 });
  }

  const db = getDb();
  const row = db
    .prepare('SELECT last_seen FROM typing WHERE key = ?')
    .get(key) as { last_seen: string | null } | undefined;
  return NextResponse.json({ lastSeen: row?.last_seen ?? null });
}
