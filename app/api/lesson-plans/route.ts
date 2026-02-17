import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

type LessonPlanItem = {
  title: string;
  section: string;
  material: string;
  part: string;
};

type LessonPlan = {
  id: string;
  studentId: string;
  studentName?: string;
  teacher?: string;
  lessonDate: string;
  rangeStart: string;
  rangeEnd: string;
  items: LessonPlanItem[];
  notes?: string;
  focus?: string;
  resources?: string;
  createdAt: string;
  updatedAt: string;
};

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const studentId = url.searchParams.get('studentId');
  const lessonDate = url.searchParams.get('lessonDate');
  const db = getDb();

  if (studentId && lessonDate) {
    const row = db
      .prepare(
        `
          SELECT *
          FROM lesson_plans
          WHERE student_id = ? AND lesson_date = ?
        `,
      )
      .get(studentId, lessonDate) as Record<string, string | null> | undefined;
    const plan = row
      ? {
          id: row.id ?? '',
          studentId: row.student_id ?? '',
          studentName: row.student_name ?? '',
          teacher: row.teacher ?? '',
          lessonDate: row.lesson_date ?? '',
          rangeStart: row.range_start ?? '',
          rangeEnd: row.range_end ?? '',
          items: row.items_json ? (JSON.parse(row.items_json) as LessonPlanItem[]) : [],
          notes: row.notes ?? '',
          focus: row.focus ?? '',
          resources: row.resources ?? '',
          createdAt: row.created_at ?? '',
          updatedAt: row.updated_at ?? '',
        }
      : null;
    return NextResponse.json({ plan });
  }

  const rows = db.prepare('SELECT * FROM lesson_plans').all() as Array<
    Record<string, string | null>
  >;
  const plans = rows.map(row => ({
    id: row.id ?? '',
    studentId: row.student_id ?? '',
    studentName: row.student_name ?? '',
    teacher: row.teacher ?? '',
    lessonDate: row.lesson_date ?? '',
    rangeStart: row.range_start ?? '',
    rangeEnd: row.range_end ?? '',
    items: row.items_json ? (JSON.parse(row.items_json) as LessonPlanItem[]) : [],
    notes: row.notes ?? '',
    focus: row.focus ?? '',
    resources: row.resources ?? '',
    createdAt: row.created_at ?? '',
    updatedAt: row.updated_at ?? '',
  }));
  return NextResponse.json({ plans });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { plan?: Partial<LessonPlan> };
  if (!body.plan?.studentId || !body.plan.lessonDate) {
    return NextResponse.json(
      { error: 'studentId and lessonDate are required.' },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const nextPlan: LessonPlan = {
    id:
      body.plan.id ??
      `${body.plan.studentId}-${body.plan.lessonDate}`.replace(/\s+/g, '-'),
    studentId: body.plan.studentId,
    studentName: body.plan.studentName,
    teacher: body.plan.teacher,
    lessonDate: body.plan.lessonDate,
    rangeStart: body.plan.rangeStart ?? body.plan.lessonDate,
    rangeEnd: body.plan.rangeEnd ?? body.plan.lessonDate,
    items: body.plan.items ?? [],
    notes: body.plan.notes ?? '',
    focus: body.plan.focus ?? '',
    resources: body.plan.resources ?? '',
    createdAt: body.plan.createdAt ?? now,
    updatedAt: now,
  };

  const db = getDb();
  const existing = db
    .prepare(
      `
        SELECT created_at
        FROM lesson_plans
        WHERE student_id = ? AND lesson_date = ?
      `,
    )
    .get(nextPlan.studentId, nextPlan.lessonDate) as
    | { created_at: string | null }
    | undefined;
  const createdAt = existing?.created_at ?? nextPlan.createdAt;
  nextPlan.createdAt = createdAt;
  nextPlan.updatedAt = now;
  db.prepare(
    `
      INSERT INTO lesson_plans (
        id,
        student_id,
        student_name,
        teacher,
        lesson_date,
        range_start,
        range_end,
        items_json,
        notes,
        focus,
        resources,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        student_name = excluded.student_name,
        teacher = excluded.teacher,
        range_start = excluded.range_start,
        range_end = excluded.range_end,
        items_json = excluded.items_json,
        notes = excluded.notes,
        focus = excluded.focus,
        resources = excluded.resources,
        updated_at = excluded.updated_at
    `,
  ).run(
    nextPlan.id,
    nextPlan.studentId,
    nextPlan.studentName ?? '',
    nextPlan.teacher ?? '',
    nextPlan.lessonDate,
    nextPlan.rangeStart,
    nextPlan.rangeEnd,
    JSON.stringify(nextPlan.items ?? []),
    nextPlan.notes ?? '',
    nextPlan.focus ?? '',
    nextPlan.resources ?? '',
    createdAt,
    now,
  );

  return NextResponse.json({ plan: nextPlan });
}
