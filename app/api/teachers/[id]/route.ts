import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
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
  const normalizedUsername = body.username?.trim().toLowerCase();
  if (normalizedUsername) {
    const usernameTaken = data.teachers.some(
      teacher =>
        teacher.id !== id &&
        teacher.username?.trim().toLowerCase() === normalizedUsername,
    );
    if (usernameTaken) {
      return NextResponse.json(
        { error: 'Username already in use.' },
        { status: 409 },
      );
    }
    const accountsData = await readAccountsFile();
    const accountConflict = accountsData.accounts.some(
      account =>
        account.username.toLowerCase() === normalizedUsername &&
        account.teacherId !== id,
    );
    if (accountConflict) {
      return NextResponse.json(
        { error: 'Username already in use.' },
        { status: 409 },
      );
    }
  }
  const updated: TeacherRecord = {
    ...current,
    username: normalizedUsername ?? current.username ?? '',
    name: body.name ?? current.name,
    email: body.email ?? current.email,
    region: body.region ?? current.region,
    status: normalizeStatus(body.status ?? current.status),
    password:
      body.password !== undefined
        ? body.password.trim()
        : current.password ?? '',
    updatedAt: new Date().toISOString(),
  };

  data.teachers[index] = updated;
  await writeTeachersFile(data);

  const accountsData = await readAccountsFile();
  const accountIndex = accountsData.accounts.findIndex(
    account =>
      account.role === 'teacher' &&
      (account.teacherId === updated.id ||
        account.username.toLowerCase() === updated.username.toLowerCase()),
  );
  const nextAccount: AccountRecord = {
    username: updated.username,
    role: 'teacher',
    name: updated.name,
    email: updated.email,
    status: updated.status,
    lastLogin:
      accountIndex === -1 ? null : accountsData.accounts[accountIndex].lastLogin,
    password:
      body.password !== undefined
        ? body.password.trim()
        : accountsData.accounts[accountIndex]?.password ?? '',
    teacherId: updated.id,
  };
  if (accountIndex === -1) {
    accountsData.accounts.push(nextAccount);
  } else {
    accountsData.accounts[accountIndex] = nextAccount;
  }
  await writeAccountsFile(accountsData);

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

  const accountsData = await readAccountsFile();
  accountsData.accounts = accountsData.accounts.filter(
    account =>
      !(
        account.role === 'teacher' &&
        (account.teacherId === removed.id ||
          account.username.toLowerCase() === removed.username.toLowerCase())
      ),
  );
  await writeAccountsFile(accountsData);

  return NextResponse.json({ teacher: removed });
}
