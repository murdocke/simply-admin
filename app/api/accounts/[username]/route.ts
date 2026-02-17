import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

type AccountRecord = {
  username: string;
  role: 'company' | 'teacher' | 'student' | 'parent';
  name: string;
  email: string;
  goesBy?: string;
  status: string;
  lastLogin: string | null;
  password?: string;
  teacherId?: string;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const body = (await request.json()) as {
    role?: 'company' | 'teacher' | 'student' | 'parent';
    name?: string;
    email?: string;
    password?: string;
    goesBy?: string;
  };

  if (!body.role) {
    return NextResponse.json({ error: 'Role is required.' }, { status: 400 });
  }

  const normalized = username.trim().toLowerCase();
  const db = getDb();
  const existing = db
    .prepare(
      `
        SELECT
          username,
          role,
          name,
          email,
          status,
          goes_by,
          last_login,
          password,
          teacher_id
        FROM accounts
        WHERE LOWER(username) = ? AND role = ?
      `,
    )
    .get(normalized, body.role) as
    | {
        username: string;
        role: AccountRecord['role'];
        name: string;
        email: string;
        status: string | null;
        goes_by: string | null;
        last_login: string | null;
        password: string | null;
        teacher_id: string | null;
      }
    | undefined;

  if (!existing) {
    return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
  }

  const updated: AccountRecord = {
    username: existing.username,
    role: existing.role,
    name: body.name ?? existing.name,
    email: body.email ?? existing.email,
    goesBy: body.goesBy ?? existing.goes_by ?? '',
    status: existing.status ?? '',
    lastLogin: existing.last_login ?? null,
    password:
      body.password !== undefined
        ? body.password.trim()
        : existing.password ?? '',
    teacherId: existing.teacher_id ?? undefined,
  };

  db.prepare(
    `
      UPDATE accounts
      SET
        name = ?,
        email = ?,
        goes_by = ?,
        password = ?
      WHERE LOWER(username) = ? AND role = ?
    `,
  ).run(
    updated.name,
    updated.email,
    updated.goesBy ?? '',
    updated.password ?? '',
    normalized,
    body.role,
  );

  if (body.role === 'teacher') {
    db.prepare(
      `
        UPDATE teachers
        SET name = ?, email = ?, goes_by = ?, status = ?
        WHERE LOWER(username) = ? OR id = ?
      `,
    ).run(
      updated.name,
      updated.email,
      updated.goesBy ?? '',
      updated.status ?? '',
      normalized,
      updated.teacherId ?? '',
    );
  }

  if (body.role === 'company') {
    const company = db
      .prepare('SELECT username FROM companies WHERE LOWER(username) = ?')
      .get(normalized) as { username: string } | undefined;
    if (company) {
      db.prepare(
        `
          UPDATE companies
          SET name = ?, email = ?, status = ?, last_login = ?, password = ?
          WHERE LOWER(username) = ?
        `,
      ).run(
        updated.name,
        updated.email,
        updated.status ?? '',
        updated.lastLogin ?? null,
        updated.password ?? '',
        normalized,
      );
    } else {
      db.prepare(
        `
          INSERT INTO companies (username, name, email, status, last_login, password)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
      ).run(
        normalized,
        updated.name,
        updated.email,
        updated.status ?? '',
        updated.lastLogin ?? null,
        updated.password ?? '',
      );
    }
  }

  const { password: _password, ...safe } = updated;
  return NextResponse.json({ account: safe });
}
