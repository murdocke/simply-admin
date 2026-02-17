import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  const db = getDb();
  const rows = db
    .prepare('SELECT name FROM lesson_types ORDER BY sort_order ASC')
    .all() as Array<{ name: string }>;
  const types = rows.map(row => row.name);
  return NextResponse.json({ types });
}

export async function PUT(request: Request) {
  const body = (await request.json()) as { types?: string[] };
  const types = Array.isArray(body.types) ? body.types : [];
  const db = getDb();
  const insert = db.prepare(
    'INSERT INTO lesson_types (name, sort_order) VALUES (?, ?)',
  );
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM lesson_types').run();
    types.forEach((name, index) => {
      insert.run(name, index);
    });
  });
  tx();
  return NextResponse.json({ types });
}
