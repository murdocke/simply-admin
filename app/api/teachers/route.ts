import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const company = searchParams.get('company');
  const data = await readTeachersFile();
  const filtered = company
    ? data.teachers.filter(teacher => teacher.company === company)
    : data.teachers;
  const normalized = filtered.map(teacher => ({
    ...teacher,
    status: normalizeStatus(teacher.status),
  }));
  return NextResponse.json({ teachers: normalized });
}

export async function POST(request: Request) {
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

  if (!body.company || !body.name) {
    return NextResponse.json(
      { error: 'Company and name are required.' },
      { status: 400 },
    );
  }

  const data = await readTeachersFile();
  const now = new Date().toISOString();
  const record: TeacherRecord = {
    id: randomUUID(),
    company: body.company,
    name: body.name,
    email: body.email ?? '',
    region: body.region ?? 'Unassigned',
    status: normalizeStatus(body.status),
    createdAt: now,
    updatedAt: now,
  };

  data.teachers.unshift(record);
  await writeTeachersFile(data);

  return NextResponse.json({ teacher: record }, { status: 201 });
}
