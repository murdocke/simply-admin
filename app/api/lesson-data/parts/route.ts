import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  const db = getDb();
  const rows = db
    .prepare(
      `
        SELECT material_code, part_order, title
        FROM lesson_parts
        ORDER BY material_code ASC, part_order ASC
      `,
    )
    .all() as Array<{ material_code: string; part_order: number; title: string | null }>;
  const parts: Record<string, string[]> = {};
  rows.forEach(row => {
    if (!parts[row.material_code]) parts[row.material_code] = [];
    parts[row.material_code][row.part_order] = row.title ?? '';
  });
  return NextResponse.json({ parts });
}

export async function PUT(request: Request) {
  const body = (await request.json()) as { parts?: Record<string, string[]> };
  const parts = body.parts && typeof body.parts === 'object' ? body.parts : {};
  const db = getDb();
  const insert = db.prepare(
    `
      INSERT INTO lesson_parts (material_code, part_order, title)
      VALUES (?, ?, ?)
    `,
  );
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM lesson_parts').run();
    Object.entries(parts).forEach(([materialCode, list]) => {
      if (!Array.isArray(list)) return;
      list.forEach((title, index) => {
        insert.run(materialCode, index, title);
      });
    });
  });
  tx();
  return NextResponse.json({ parts });
}
