import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');
  const role = searchParams.get('role');

  if (!username || !role) {
    return NextResponse.json(
      { error: 'Username and role are required.' },
      { status: 400 },
    );
  }

  const db = getDb();
  const account = db
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
          teacher_id,
          membership_status,
          account_status
        FROM accounts
        WHERE LOWER(username) = ? AND role = ?
      `,
    )
    .get(username.toLowerCase(), role) as
    | {
        username: string;
        role: string;
        name: string;
        email: string;
        status: string | null;
        goes_by: string | null;
        last_login: string | null;
        password: string | null;
        teacher_id: string | null;
        membership_status: string | null;
        account_status: string | null;
      }
    | undefined;

  if (!account) {
    return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
  }

  const { password: _password, ...safe } = account;
  return NextResponse.json({
    account: {
      ...safe,
      goesBy: account.goes_by ?? undefined,
      lastLogin: account.last_login ?? null,
      teacherId: account.teacher_id ?? undefined,
      membershipStatus: account.membership_status ?? undefined,
      accountStatus: account.account_status ?? undefined,
    },
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    username?: string;
    role?: string;
  };

  if (!body.username || !body.role) {
    return NextResponse.json(
      { error: 'Username and role are required.' },
      { status: 400 },
    );
  }

  const db = getDb();
  const existing = db
    .prepare(
      `
        SELECT username, role, name, email, status, goes_by, last_login, password
        FROM accounts
        WHERE LOWER(username) = ? AND role = ?
      `,
    )
    .get(body.username.toLowerCase(), body.role) as
    | {
        username: string;
        role: string;
        name: string;
        email: string;
        status: string | null;
        goes_by: string | null;
        last_login: string | null;
        password: string | null;
      }
    | undefined;

  if (!existing) {
    return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
  }

  const updatedLastLogin = new Date().toISOString();
  db.prepare(
    `
      UPDATE accounts
      SET last_login = ?
      WHERE LOWER(username) = ? AND role = ?
    `,
  ).run(updatedLastLogin, body.username.toLowerCase(), body.role);

  return NextResponse.json({
    account: {
      ...existing,
      goesBy: existing.goes_by ?? undefined,
      lastLogin: updatedLastLogin,
    },
  });
}
