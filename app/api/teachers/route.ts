import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getDb } from '@/lib/db';

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
    | 'Interested'
    | 'Inactive'
    | 'Active';
  createdAt: string;
  updatedAt: string;
  password?: string;
  goesBy?: string;
  studioId?: string;
  studioRole?: string;
};

export const runtime = 'nodejs';

const normalizeStatus = (
  status:
    | 'Licensed'
    | 'Certified'
    | 'Advanced'
    | 'Master'
    | 'Onboarding'
    | 'Interested'
    | 'Inactive'
    | 'Active'
    | undefined,
) => (status === 'Active' || !status ? 'Licensed' : status);

type AccountRecord = {
  username: string;
  role: 'company' | 'teacher' | 'student' | 'parent';
  name: string;
  email: string;
  status: string;
  lastLogin: string | null;
  password?: string;
  teacherId?: string;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const company = searchParams.get('company');
  const db = getDb();
  const rows = company
    ? (db
        .prepare('SELECT * FROM teachers WHERE company = ?')
        .all(company) as Array<Record<string, string | null>>)
    : (db.prepare('SELECT * FROM teachers').all() as Array<
        Record<string, string | null>
      >);

  const normalized = rows.map(row => ({
    id: row.id ?? '',
    company: row.company ?? '',
    username: row.username ?? '',
    name: row.name ?? '',
    email: row.email ?? '',
    region: row.region ?? '',
    status: normalizeStatus(row.status as TeacherRecord['status']),
    createdAt: row.created_at ?? '',
    updatedAt: row.updated_at ?? '',
    password: row.password ?? '',
    goesBy: row.goes_by ?? '',
    studioId: row.studio_id ?? '',
    studioRole: row.studio_role ?? '',
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
      | 'Interested'
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

  const db = getDb();
  const usernameTaken = db
    .prepare(
      `
        SELECT id
        FROM teachers
        WHERE company = ? AND LOWER(username) = ?
      `,
    )
    .get(body.company, normalizedUsername);
  const accountConflict = db
    .prepare('SELECT username FROM accounts WHERE LOWER(username) = ?')
    .get(normalizedUsername);
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

  db.prepare(
    `
      INSERT INTO teachers (
        id,
        company,
        username,
        name,
        email,
        region,
        status,
        created_at,
        updated_at,
        password,
        goes_by,
        studio_id,
        studio_role
      ) VALUES (
        @id,
        @company,
        @username,
        @name,
        @email,
        @region,
        @status,
        @createdAt,
        @updatedAt,
        @password,
        @goesBy,
        @studioId,
        @studioRole
      )
    `,
  ).run({
    id: record.id,
    company: record.company,
    username: record.username,
    name: record.name,
    email: record.email,
    region: record.region,
    status: record.status,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    password: record.password ?? '',
    goesBy: (record as Record<string, string>).goesBy ?? '',
    studioId: (record as Record<string, string>).studioId ?? '',
    studioRole: (record as Record<string, string>).studioRole ?? '',
  });

  const existingAccount = db
    .prepare(
      `
        SELECT last_login
        FROM accounts
        WHERE LOWER(username) = ? AND role = 'teacher'
      `,
    )
    .get(normalizedUsername) as { last_login: string | null } | undefined;
  const nextAccount: AccountRecord = {
    username: normalizedUsername,
    role: 'teacher',
    name: record.name,
    email: record.email,
    status: record.status,
    lastLogin: existingAccount?.last_login ?? null,
    password: body.password?.trim() || '',
    teacherId: record.id,
  };
  db.prepare(
    `
      INSERT INTO accounts (
        username,
        role,
        name,
        email,
        status,
        last_login,
        password,
        teacher_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(username, role) DO UPDATE SET
        name = excluded.name,
        email = excluded.email,
        status = excluded.status,
        last_login = excluded.last_login,
        password = excluded.password,
        teacher_id = excluded.teacher_id
    `,
  ).run(
    nextAccount.username,
    nextAccount.role,
    nextAccount.name,
    nextAccount.email,
    nextAccount.status,
    nextAccount.lastLogin,
    nextAccount.password ?? '',
    nextAccount.teacherId ?? '',
  );

  return NextResponse.json({ teacher: record }, { status: 201 });
}
