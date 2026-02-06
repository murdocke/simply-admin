import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

type TeacherRecord = {
  id: string;
  company: string;
  username: string;
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
  password?: string;
};

type TeachersFile = {
  teachers: TeacherRecord[];
};

const dataFile = path.join(process.cwd(), 'data', 'teachers.json');
const accountsFile = path.join(process.cwd(), 'data', 'accounts.json');

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

type AccountRecord = {
  username: string;
  role: 'company' | 'teacher' | 'student';
  name: string;
  email: string;
  status: string;
  lastLogin: string | null;
  password?: string;
  teacherId?: string;
};

type AccountsFile = {
  accounts: AccountRecord[];
};

async function readAccountsFile(): Promise<AccountsFile> {
  try {
    const raw = await fs.readFile(accountsFile, 'utf-8');
    const parsed = JSON.parse(raw) as AccountsFile;
    if (!parsed.accounts) {
      return { accounts: [] };
    }
    return parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { accounts: [] };
    }
    throw error;
  }
}

async function writeAccountsFile(data: AccountsFile) {
  await fs.mkdir(path.dirname(accountsFile), { recursive: true });
  await fs.writeFile(accountsFile, JSON.stringify(data, null, 2), 'utf-8');
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
    username?: string;
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
    password?: string;
  };

  const normalizedUsername = body.username?.trim().toLowerCase() ?? '';

  if (!body.company || !body.name || !normalizedUsername) {
    return NextResponse.json(
      { error: 'Company, name, and username are required.' },
      { status: 400 },
    );
  }

  const data = await readTeachersFile();
  const usernameTaken = data.teachers.some(
    teacher =>
      teacher.company === body.company &&
      teacher.username?.trim().toLowerCase() === normalizedUsername,
  );
  const accountsData = await readAccountsFile();
  const accountConflict = accountsData.accounts.find(
    account => account.username.toLowerCase() === normalizedUsername,
  );
  if (accountConflict) {
    return NextResponse.json(
      { error: 'Username already in use.' },
      { status: 409 },
    );
  }
  if (usernameTaken) {
    return NextResponse.json(
      { error: 'Username already in use.' },
      { status: 409 },
    );
  }
  const now = new Date().toISOString();
  const record: TeacherRecord = {
    id: randomUUID(),
    company: body.company,
    username: normalizedUsername,
    name: body.name,
    email: body.email ?? '',
    region: body.region ?? 'Unassigned',
    status: normalizeStatus(body.status),
    createdAt: now,
    updatedAt: now,
    password: body.password?.trim() || '',
  };

  data.teachers.unshift(record);
  await writeTeachersFile(data);

  const accountIndex = accountsData.accounts.findIndex(
    account =>
      account.username.toLowerCase() === normalizedUsername &&
      account.role === 'teacher',
  );
  const nextAccount: AccountRecord = {
    username: normalizedUsername,
    role: 'teacher',
    name: record.name,
    email: record.email,
    status: record.status,
    lastLogin:
      accountIndex === -1 ? null : accountsData.accounts[accountIndex].lastLogin,
    password: body.password?.trim() || '',
    teacherId: record.id,
  };
  if (accountIndex === -1) {
    accountsData.accounts.push(nextAccount);
  } else {
    accountsData.accounts[accountIndex] = nextAccount;
  }
  await writeAccountsFile(accountsData);

  return NextResponse.json({ teacher: record }, { status: 201 });
}
