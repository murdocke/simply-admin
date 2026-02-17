import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

type StudentRecord = {
  id: string;
  teacher: string;
  name: string;
  email: string;
  level: string;
  status: 'Active' | 'Paused' | 'Archived';
  lessonFeeAmount?: string;
  lessonFeePeriod?: 'Per Mo' | 'Per Qtr' | 'Per Yr';
  lessonDay?: string;
  lessonTime?: string;
  lessonDuration?: '30M' | '45M' | '1HR';
  lessonType?: 'Individual' | 'Group';
  lessonLocation?: 'In-Person' | 'Virtual' | 'Home-Visit';
  lessonNotes?: string;
  studentAlert?: string;
  createdAt: string;
  updatedAt: string;
};

export const runtime = 'nodejs';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json()) as {
    teacher?: string;
    name?: string;
    email?: string;
    level?: string;
    status?: 'Active' | 'Paused' | 'Archived';
    lessonFeeAmount?: string;
    lessonFeePeriod?: 'Per Mo' | 'Per Qtr' | 'Per Yr';
    lessonDay?: string;
    lessonTime?: string;
    lessonDuration?: '30M' | '45M' | '1HR';
    lessonType?: 'Individual' | 'Group';
    lessonLocation?: 'In-Person' | 'Virtual' | 'Home-Visit';
    lessonNotes?: string;
    studentAlert?: string;
  };

  if (!body.teacher) {
    return NextResponse.json({ error: 'Teacher is required.' }, { status: 400 });
  }

  const db = getDb();
  const current = db
    .prepare('SELECT * FROM students WHERE id = ? AND teacher = ?')
    .get(id, body.teacher) as Record<string, string | null> | undefined;

  if (!current) {
    return NextResponse.json({ error: 'Student not found.' }, { status: 404 });
  }

  const updated: StudentRecord = {
    id: current.id ?? id,
    teacher: current.teacher ?? body.teacher,
    name: body.name ?? (current.name ?? ''),
    email: body.email ?? (current.email ?? ''),
    level: body.level ?? (current.level ?? ''),
    status: (body.status ?? current.status ?? 'Active') as StudentRecord['status'],
    lessonFeeAmount:
      body.lessonFeeAmount ?? (current.lesson_fee_amount ?? ''),
    lessonFeePeriod:
      body.lessonFeePeriod ??
      ((current.lesson_fee_period ?? 'Per Mo') as StudentRecord['lessonFeePeriod']),
    lessonDay: body.lessonDay ?? (current.lesson_day ?? ''),
    lessonTime: body.lessonTime ?? (current.lesson_time ?? ''),
    lessonDuration:
      body.lessonDuration ??
      ((current.lesson_duration ?? '30M') as StudentRecord['lessonDuration']),
    lessonType:
      body.lessonType ??
      ((current.lesson_type ?? 'Individual') as StudentRecord['lessonType']),
    lessonLocation:
      body.lessonLocation ??
      ((current.lesson_location ?? 'In-Person') as StudentRecord['lessonLocation']),
    lessonNotes: body.lessonNotes ?? (current.lesson_notes ?? ''),
    studentAlert: body.studentAlert ?? (current.student_alert ?? ''),
    createdAt: current.created_at ?? '',
    updatedAt: new Date().toISOString(),
  };

  db.prepare(
    `
      UPDATE students
      SET
        name = ?,
        email = ?,
        level = ?,
        status = ?,
        lesson_fee_amount = ?,
        lesson_fee_period = ?,
        lesson_day = ?,
        lesson_time = ?,
        lesson_duration = ?,
        lesson_type = ?,
        lesson_location = ?,
        lesson_notes = ?,
        student_alert = ?,
        updated_at = ?
      WHERE id = ? AND teacher = ?
    `,
  ).run(
    updated.name,
    updated.email,
    updated.level,
    updated.status,
    updated.lessonFeeAmount ?? '',
    updated.lessonFeePeriod ?? '',
    updated.lessonDay ?? '',
    updated.lessonTime ?? '',
    updated.lessonDuration ?? '',
    updated.lessonType ?? '',
    updated.lessonLocation ?? '',
    updated.lessonNotes ?? '',
    updated.studentAlert ?? '',
    updated.updatedAt,
    id,
    body.teacher,
  );

  return NextResponse.json({ student: updated });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const teacher = searchParams.get('teacher');

  if (!teacher) {
    return NextResponse.json({ error: 'Teacher is required.' }, { status: 400 });
  }

  const db = getDb();
  const current = db
    .prepare('SELECT * FROM students WHERE id = ? AND teacher = ?')
    .get(id, teacher) as Record<string, string | null> | undefined;

  if (!current) {
    return NextResponse.json({ error: 'Student not found.' }, { status: 404 });
  }

  db.prepare('DELETE FROM students WHERE id = ? AND teacher = ?').run(
    id,
    teacher,
  );
  const removed: StudentRecord = {
    id: current.id ?? id,
    teacher: current.teacher ?? teacher,
    name: current.name ?? '',
    email: current.email ?? '',
    level: current.level ?? '',
    status: (current.status ?? 'Active') as StudentRecord['status'],
    lessonFeeAmount: current.lesson_fee_amount ?? '',
    lessonFeePeriod:
      (current.lesson_fee_period ?? 'Per Mo') as StudentRecord['lessonFeePeriod'],
    lessonDay: current.lesson_day ?? '',
    lessonTime: current.lesson_time ?? '',
    lessonDuration:
      (current.lesson_duration ?? '30M') as StudentRecord['lessonDuration'],
    lessonType:
      (current.lesson_type ?? 'Individual') as StudentRecord['lessonType'],
    lessonLocation:
      (current.lesson_location ?? 'In-Person') as StudentRecord['lessonLocation'],
    lessonNotes: current.lesson_notes ?? '',
    studentAlert: current.student_alert ?? '',
    createdAt: current.created_at ?? '',
    updatedAt: current.updated_at ?? '',
  };

  return NextResponse.json({ student: removed });
}
