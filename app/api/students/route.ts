import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

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

type StudentsFile = {
  students: StudentRecord[];
};

const dataFile = path.join(process.cwd(), 'data', 'students.json');

async function readStudentsFile(): Promise<StudentsFile> {
  try {
    const raw = await fs.readFile(dataFile, 'utf-8');
    const parsed = JSON.parse(raw) as StudentsFile;
    if (!parsed.students) {
      return { students: [] };
    }
    return parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { students: [] };
    }
    throw error;
  }
}

async function writeStudentsFile(data: StudentsFile) {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  await fs.writeFile(dataFile, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teacher = searchParams.get('teacher');
  const data = await readStudentsFile();
  const filtered = teacher
    ? data.students.filter(student => student.teacher === teacher)
    : data.students;
  return NextResponse.json({ students: filtered });
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

  const data = await readStudentsFile();
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

  data.students.unshift(record);
  await writeStudentsFile(data);

  return NextResponse.json({ student: record }, { status: 201 });
}
