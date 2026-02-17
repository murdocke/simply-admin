import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

type StudioRecord = {
  id: string;
  company: string;
  name: string;
  location: string;
  timeZone: string;
  status: string;
  createdAt: string;
  adminTeacherId?: string;
  teacherIds: string[];
};

export async function GET() {
  const db = getDb();
  const studiosRows = db.prepare('SELECT * FROM studios').all() as Array<
    Record<string, string | null>
  >;
  const teacherRows = db
    .prepare('SELECT studio_id, teacher_id FROM studio_teachers')
    .all() as Array<{ studio_id: string; teacher_id: string }>;

  const teacherMap = new Map<string, string[]>();
  for (const row of teacherRows) {
    const list = teacherMap.get(row.studio_id) ?? [];
    list.push(row.teacher_id);
    teacherMap.set(row.studio_id, list);
  }

  const studios: StudioRecord[] = studiosRows.map(row => ({
    id: row.id ?? '',
    company: row.company ?? '',
    name: row.name ?? '',
    location: row.location ?? '',
    timeZone: row.time_zone ?? '',
    status: row.status ?? '',
    createdAt: row.created_at ?? '',
    adminTeacherId: row.admin_teacher_id ?? '',
    teacherIds: teacherMap.get(row.id ?? '') ?? [],
  }));

  return NextResponse.json({ studios });
}
