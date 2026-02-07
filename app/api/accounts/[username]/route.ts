import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

type AccountRecord = {
  username: string;
  role: 'company' | 'teacher' | 'student';
  name: string;
  email: string;
  goesBy?: string;
  status: string;
  lastLogin: string | null;
  password?: string;
  teacherId?: string;
};

type AccountsFile = {
  accounts: AccountRecord[];
};

type TeachersFile = {
  teachers: Array<{
    id: string;
    username?: string;
    name: string;
    email: string;
    status: string;
    goesBy?: string;
  }>;
};

type CompaniesFile = {
  companies: Array<{
    username: string;
    name: string;
    email: string;
    status: string;
    lastLogin: string | null;
    password?: string;
  }>;
};

const accountsFile = path.join(process.cwd(), 'data', 'accounts.json');
const teachersFile = path.join(process.cwd(), 'data', 'teachers.json');
const companiesFile = path.join(process.cwd(), 'data', 'companies.json');

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return fallback;
    }
    throw error;
  }
}

async function writeJson<T>(filePath: string, data: T) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const body = (await request.json()) as {
    role?: 'company' | 'teacher' | 'student';
    name?: string;
    email?: string;
    password?: string;
    goesBy?: string;
  };

  if (!body.role) {
    return NextResponse.json({ error: 'Role is required.' }, { status: 400 });
  }

  const normalized = username.trim().toLowerCase();
  const accountsData = await readJson<AccountsFile>(accountsFile, {
    accounts: [],
  });
  const index = accountsData.accounts.findIndex(
    account =>
      account.username.toLowerCase() === normalized &&
      account.role === body.role,
  );

  if (index === -1) {
    return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
  }

  const current = accountsData.accounts[index];
  const updated: AccountRecord = {
    ...current,
    name: body.name ?? current.name,
    email: body.email ?? current.email,
    goesBy: body.goesBy ?? current.goesBy ?? '',
    password:
      body.password !== undefined ? body.password.trim() : current.password ?? '',
  };

  accountsData.accounts[index] = updated;
  await writeJson(accountsFile, accountsData);

  if (body.role === 'teacher') {
    const teachersData = await readJson<TeachersFile>(teachersFile, {
      teachers: [],
    });
    const teacherIndex = teachersData.teachers.findIndex(
      teacher =>
        teacher.username?.trim().toLowerCase() === normalized ||
        teacher.id === updated.teacherId,
    );
    if (teacherIndex !== -1) {
      teachersData.teachers[teacherIndex] = {
        ...teachersData.teachers[teacherIndex],
        name: updated.name,
        email: updated.email,
        goesBy: updated.goesBy,
        status: updated.status,
      };
      await writeJson(teachersFile, teachersData);
    }
  }

  if (body.role === 'company') {
    const companiesData = await readJson<CompaniesFile>(companiesFile, {
      companies: [],
    });
    const companyIndex = companiesData.companies.findIndex(
      company => company.username.toLowerCase() === normalized,
    );
    const nextCompany = {
      username: normalized,
      name: updated.name,
      email: updated.email,
      status: updated.status,
      lastLogin: updated.lastLogin ?? null,
      password: updated.password ?? '',
    };
    if (companyIndex === -1) {
      companiesData.companies.push(nextCompany);
    } else {
      companiesData.companies[companyIndex] = nextCompany;
    }
    await writeJson(companiesFile, companiesData);
  }

  const { password: _password, ...safe } = updated;
  return NextResponse.json({ account: safe });
}
