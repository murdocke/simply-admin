import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

type AccountRecord = {
  username: string;
  role: 'company' | 'teacher' | 'student' | 'parent';
  name: string;
  email: string;
  accountStatus?: string;
  membershipStatus?: string;
  lastLogin: string | null;
  password?: string;
};

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = (await request.json()) as {
    username?: string;
    password?: string;
  };
  const username = body.username?.trim().toLowerCase() ?? '';
  const password = body.password?.trim() ?? '';

  if (!username || !password) {
    return NextResponse.json(
      { error: 'Username and password are required.' },
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
          account_status,
          password
        FROM accounts
        WHERE LOWER(username) = ?
      `,
    )
    .get(username) as
    | {
        username: string;
        role: AccountRecord['role'];
        account_status: string | null;
        password: string | null;
      }
    | undefined;

  if (!account || (account.password ?? '') !== password) {
    return NextResponse.json(
      { error: 'Invalid username or password.' },
      { status: 401 },
    );
  }

  if (account.account_status && account.account_status !== 'Active') {
    return NextResponse.json(
      { error: 'Account is not active.' },
      { status: 403 },
    );
  }

  return NextResponse.json({
    account: {
      username: account.username,
      role: account.role,
    },
  });
}
