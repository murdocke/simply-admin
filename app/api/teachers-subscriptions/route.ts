import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  const db = getDb();
  const rows = db
    .prepare(
      `
        SELECT id, name, region, last_students, current_students
        FROM teachers_subscriptions
        ORDER BY id ASC
      `,
    )
    .all() as Array<{
    id: string;
    name: string;
    region: string;
    last_students: number | null;
    current_students: number | null;
  }>;
  const subscriptions = rows.map(row => ({
    id: row.id,
    name: row.name,
    region: row.region,
    lastStudents: row.last_students ?? 0,
    currentStudents: row.current_students ?? 0,
  }));
  return NextResponse.json({ subscriptions });
}
