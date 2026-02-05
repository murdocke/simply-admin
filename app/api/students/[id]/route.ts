import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

type StudentRecord = {
  id: string;
  teacher: string;
  name: string;
  email: string;
  level: string;
  status: 'Active' | 'Paused';
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
    status?: 'Active' | 'Paused';
  };

  if (!body.teacher) {
    return NextResponse.json({ error: 'Teacher is required.' }, { status: 400 });
  }

  const data = await readStudentsFile();
  const index = data.students.findIndex(
    student => student.id === id && student.teacher === body.teacher,
  );

  if (index === -1) {
    return NextResponse.json({ error: 'Student not found.' }, { status: 404 });
  }

  const current = data.students[index];
  const updated: StudentRecord = {
    ...current,
    name: body.name ?? current.name,
    email: body.email ?? current.email,
    level: body.level ?? current.level,
    status: body.status ?? current.status,
    updatedAt: new Date().toISOString(),
  };

  data.students[index] = updated;
  await writeStudentsFile(data);

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

  const data = await readStudentsFile();
  const index = data.students.findIndex(
    student => student.id === id && student.teacher === teacher,
  );

  if (index === -1) {
    return NextResponse.json({ error: 'Student not found.' }, { status: 404 });
  }

  const [removed] = data.students.splice(index, 1);
  await writeStudentsFile(data);

  return NextResponse.json({ student: removed });
}
