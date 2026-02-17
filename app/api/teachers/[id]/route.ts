import { NextResponse } from 'next/server';
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
      | 'Interested'
      | 'Inactive'
      | 'Active';
    password?: string;
  };

  if (!body.company) {
    return NextResponse.json({ error: 'Company is required.' }, { status: 400 });
  }

  const db = getDb();
  const current = db
    .prepare('SELECT * FROM teachers WHERE id = ? AND company = ?')
    .get(id, body.company) as Record<string, string | null> | undefined;

  if (!current) {
    return NextResponse.json({ error: 'Teacher not found.' }, { status: 404 });
  }

  const normalizedUsername = body.username?.trim().toLowerCase();
  if (normalizedUsername) {
    const usernameTaken = db
      .prepare(
        `
          SELECT id FROM teachers
          WHERE id != ? AND LOWER(username) = ?
        `,
      )
      .get(id, normalizedUsername);
    if (usernameTaken) {
      return NextResponse.json(
        { error: 'Username already in use.' },
        { status: 409 },
      );
    }
    const accountConflict = db
      .prepare(
        `
          SELECT username
          FROM accounts
          WHERE LOWER(username) = ? AND (teacher_id IS NULL OR teacher_id != ?)
        `,
      )
      .get(normalizedUsername, id);
    if (accountConflict) {
      return NextResponse.json(
        { error: 'Username already in use.' },
        { status: 409 },
      );
    }
  }
  const updated: TeacherRecord = {
    id: current.id ?? id,
    company: current.company ?? body.company,
    username: normalizedUsername ?? current.username ?? '',
    name: body.name ?? (current.name ?? ''),
    email: body.email ?? (current.email ?? ''),
    region: body.region ?? (current.region ?? ''),
    status: normalizeStatus(
      body.status ?? (current.status as TeacherRecord['status']),
    ),
    password:
      body.password !== undefined
        ? body.password.trim()
        : current.password ?? '',
    updatedAt: new Date().toISOString(),
    createdAt: current.created_at ?? '',
  };

  db.prepare(
    `
      UPDATE teachers
      SET
        username = ?,
        name = ?,
        email = ?,
        region = ?,
        status = ?,
        password = ?,
        updated_at = ?
      WHERE id = ? AND company = ?
    `,
  ).run(
    updated.username,
    updated.name,
    updated.email,
    updated.region,
    updated.status,
    updated.password ?? '',
    updated.updatedAt,
    updated.id,
    body.company,
  );

  const existingAccount = db
    .prepare(
      `
        SELECT username, last_login, password
        FROM accounts
        WHERE role = 'teacher' AND teacher_id = ?
      `,
    )
    .get(updated.id) as
    | { username: string; last_login: string | null; password: string | null }
    | undefined;
  const nextAccount: AccountRecord = {
    username: updated.username,
    role: 'teacher',
    name: updated.name,
    email: updated.email,
    status: updated.status,
    lastLogin: existingAccount?.last_login ?? null,
    password:
      body.password !== undefined
        ? body.password.trim()
        : existingAccount?.password ?? '',
    teacherId: updated.id,
  };
  if (existingAccount) {
    db.prepare(
      `
        UPDATE accounts
        SET
          username = ?,
          name = ?,
          email = ?,
          status = ?,
          last_login = ?,
          password = ?
        WHERE role = 'teacher' AND teacher_id = ?
      `,
    ).run(
      nextAccount.username,
      nextAccount.name,
      nextAccount.email,
      nextAccount.status,
      nextAccount.lastLogin,
      nextAccount.password ?? '',
      nextAccount.teacherId ?? '',
    );
  } else {
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
  }

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

  const db = getDb();
  const current = db
    .prepare('SELECT * FROM teachers WHERE id = ? AND company = ?')
    .get(id, company) as Record<string, string | null> | undefined;

  if (!current) {
    return NextResponse.json({ error: 'Teacher not found.' }, { status: 404 });
  }

  db.prepare('DELETE FROM teachers WHERE id = ? AND company = ?').run(id, company);
  db.prepare(
    `
      DELETE FROM accounts
      WHERE role = 'teacher' AND (teacher_id = ? OR LOWER(username) = ?)
    `,
  ).run(current.id ?? id, (current.username ?? '').toLowerCase());

  const removed: TeacherRecord = {
    id: current.id ?? id,
    company: current.company ?? company,
    username: current.username ?? '',
    name: current.name ?? '',
    email: current.email ?? '',
    region: current.region ?? '',
    status: normalizeStatus(
      current.status as TeacherRecord['status'] | undefined,
    ),
    createdAt: current.created_at ?? '',
    updatedAt: current.updated_at ?? '',
    password: current.password ?? '',
  };

  return NextResponse.json({ teacher: removed });
}
