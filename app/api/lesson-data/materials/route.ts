import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  const db = getDb();
  const rows = db
    .prepare(
      `
        SELECT program, section, material_order, title
        FROM lesson_materials
        ORDER BY program ASC, section ASC, material_order ASC
      `,
    )
    .all() as Array<{
    program: string;
    section: string;
    material_order: number;
    title: string | null;
  }>;
  const materials: Record<string, string[]> = {};
  rows.forEach(row => {
    const key = `${row.program}|${row.section}`;
    if (!materials[key]) materials[key] = [];
    materials[key][row.material_order] = row.title ?? '';
  });
  return NextResponse.json({ materials });
}

export async function PUT(request: Request) {
  const body = (await request.json()) as { materials?: Record<string, string[]> };
  const materials = body.materials && typeof body.materials === 'object' ? body.materials : {};
  const db = getDb();
  const insert = db.prepare(
    `
      INSERT INTO lesson_materials (program, section, material_order, title)
      VALUES (?, ?, ?, ?)
    `,
  );
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM lesson_materials').run();
    Object.entries(materials).forEach(([key, list]) => {
      const [program, section] = key.split('|');
      if (!program || !section || !Array.isArray(list)) return;
      list.forEach((title, index) => {
        insert.run(program, section, index, title);
      });
    });
  });
  tx();
  return NextResponse.json({ materials });
}
