import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getDb } from '@/lib/db';

type StudentRecord = {
  id: string;
  teacher: string;
  name: string;
  email: string;
  level: string;
  status: 'Active' | 'Paused';
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teacher = searchParams.get('teacher');
  const db = getDb();
  const rows = teacher
    ? (db
        .prepare('SELECT * FROM students WHERE teacher = ?')
        .all(teacher) as Array<Record<string, string | null>>)
    : (db.prepare('SELECT * FROM students').all() as Array<
        Record<string, string | null>
      >);

  const students = rows.map(row => ({
    id: row.id ?? '',
    teacher: row.teacher ?? '',
    name: row.name ?? '',
    email: row.email ?? '',
    username: row.username ?? undefined,
    password: row.password ?? undefined,
    level: row.level ?? '',
    status: (row.status ?? 'Active') as StudentRecord['status'],
    lessonFeeAmount: row.lesson_fee_amount ?? '',
    lessonFeePeriod: row.lesson_fee_period as StudentRecord['lessonFeePeriod'],
    lessonDay: row.lesson_day ?? '',
    lessonTime: row.lesson_time ?? '',
    lessonDuration: row.lesson_duration as StudentRecord['lessonDuration'],
    lessonType: row.lesson_type as StudentRecord['lessonType'],
    lessonLocation: row.lesson_location as StudentRecord['lessonLocation'],
    lessonNotes: row.lesson_notes ?? '',
    studentAlert: row.student_alert ?? '',
    createdAt: row.created_at ?? '',
    updatedAt: row.updated_at ?? '',
  }));

  return NextResponse.json({ students });
}

export async function POST(request: Request) {
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

  if (!body.teacher || !body.name) {
    return NextResponse.json(
      { error: 'Teacher and name are required.' },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const record: StudentRecord = {
    id: randomUUID(),
    teacher: body.teacher,
    name: body.name,
    email: body.email ?? '',
    level: body.level ?? 'Beginner',
    status: body.status ?? 'Active',
    lessonFeeAmount: body.lessonFeeAmount ?? '',
    lessonFeePeriod: body.lessonFeePeriod ?? 'Per Mo',
    lessonDay: body.lessonDay ?? '',
    lessonTime: body.lessonTime ?? '',
    lessonDuration: body.lessonDuration ?? '30M',
    lessonType: body.lessonType ?? 'Individual',
    lessonLocation: body.lessonLocation ?? 'In-Person',
    lessonNotes: body.lessonNotes ?? '',
    studentAlert: body.studentAlert ?? '',
    createdAt: now,
    updatedAt: now,
  };

  const db = getDb();
  db.prepare(
    `
      INSERT INTO students (
        id,
        teacher,
        name,
        email,
        username,
        password,
        level,
        status,
        lesson_fee_amount,
        lesson_fee_period,
        lesson_day,
        lesson_time,
        lesson_duration,
        lesson_type,
        lesson_location,
        lesson_notes,
        student_alert,
        created_at,
        updated_at
      ) VALUES (
        @id,
        @teacher,
        @name,
        @email,
        @username,
        @password,
        @level,
        @status,
        @lessonFeeAmount,
        @lessonFeePeriod,
        @lessonDay,
        @lessonTime,
        @lessonDuration,
        @lessonType,
        @lessonLocation,
        @lessonNotes,
        @studentAlert,
        @createdAt,
        @updatedAt
      )
    `,
  ).run({
    id: record.id,
    teacher: record.teacher,
    name: record.name,
    email: record.email,
    username: (record as Record<string, string>).username ?? '',
    password: (record as Record<string, string>).password ?? '',
    level: record.level,
    status: record.status,
    lessonFeeAmount: record.lessonFeeAmount ?? '',
    lessonFeePeriod: record.lessonFeePeriod ?? '',
    lessonDay: record.lessonDay ?? '',
    lessonTime: record.lessonTime ?? '',
    lessonDuration: record.lessonDuration ?? '',
    lessonType: record.lessonType ?? '',
    lessonLocation: record.lessonLocation ?? '',
    lessonNotes: record.lessonNotes ?? '',
    studentAlert: record.studentAlert ?? '',
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });

  return NextResponse.json({ student: record }, { status: 201 });
}
