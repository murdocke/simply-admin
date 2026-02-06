import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

type TeacherRecord = {
  id: string;
  company: string;
  name: string;
  email: string;
  region: string;
  status:
    | 'Licensed'
    | 'Certified'
    | 'Advanced'
    | 'Master'
    | 'Onboarding'
    | 'Inactive'
    | 'Active';
  createdAt: string;
  updatedAt: string;
};

type TeachersFile = {
  teachers: TeacherRecord[];
};

const dataFile = path.join(process.cwd(), 'data', 'teachers.json');

const normalizeStatus = (
  status:
    | 'Licensed'
    | 'Certified'
    | 'Advanced'
    | 'Master'
    | 'Onboarding'
    | 'Inactive'
    | 'Active'
    | undefined,
) => (status === 'Active' || !status ? 'Licensed' : status);

async function readTeachersFile(): Promise<TeachersFile> {
  try {
    const raw = await fs.readFile(dataFile, 'utf-8');
    const parsed = JSON.parse(raw) as TeachersFile;
    if (!parsed.teachers) {
      return { teachers: [] };
    }
    return parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { teachers: [] };
    }
    throw error;
  }
}

async function writeTeachersFile(data: TeachersFile) {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  await fs.writeFile(dataFile, JSON.stringify(data, null, 2), 'utf-8');
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json()) as {
    company?: string;
    name?: string;
    email?: string;
    region?: string;
    status?:
      | 'Licensed'
      | 'Certified'
      | 'Advanced'
      | 'Master'
      | 'Onboarding'
      | 'Inactive'
      | 'Active';
  };

  if (!body.company) {
    return NextResponse.json({ error: 'Company is required.' }, { status: 400 });
  }

  const data = await readTeachersFile();
  const index = data.teachers.findIndex(
    teacher => teacher.id === id && teacher.company === body.company,
  );

  if (index === -1) {
    return NextResponse.json({ error: 'Teacher not found.' }, { status: 404 });
  }

  const current = data.teachers[index];
  const updated: TeacherRecord = {
    ...current,
    name: body.name ?? current.name,
    email: body.email ?? current.email,
    region: body.region ?? current.region,
    status: normalizeStatus(body.status ?? current.status),
    updatedAt: new Date().toISOString(),
  };

  data.teachers[index] = updated;
  await writeTeachersFile(data);

  return NextResponse.json({ teacher: updated });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const company = searchParams.get('company');

  if (!company) {
    return NextResponse.json({ error: 'Company is required.' }, { status: 400 });
  }

  const data = await readTeachersFile();
  const index = data.teachers.findIndex(
    teacher => teacher.id === id && teacher.company === company,
  );

  if (index === -1) {
    return NextResponse.json({ error: 'Teacher not found.' }, { status: 404 });
  }

  const [removed] = data.teachers.splice(index, 1);
  await writeTeachersFile(data);

  return NextResponse.json({ teacher: removed });
}
