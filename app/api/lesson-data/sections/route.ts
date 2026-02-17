import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  const db = getDb();
  const rows = db
    .prepare('SELECT program, sections_json FROM lesson_sections')
    .all() as Array<{ program: string; sections_json: string | null }>;
  const sections: Record<string, unknown> = {};
  rows.forEach(row => {
    sections[row.program] = row.sections_json
      ? (JSON.parse(row.sections_json) as unknown)
      : [];
  });
  return NextResponse.json({ sections });
}

export async function PUT(request: Request) {
  const body = (await request.json()) as { sections?: Record<string, unknown> };
  const sections = body.sections && typeof body.sections === 'object' ? body.sections : {};
  const db = getDb();
  const insert = db.prepare(
    'INSERT INTO lesson_sections (program, sections_json) VALUES (?, ?)',
  );
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM lesson_sections').run();
    Object.entries(sections).forEach(([program, value]) => {
      insert.run(program, JSON.stringify(value ?? []));
    });
  });
  tx();
  return NextResponse.json({ sections });
}
