import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  const db = getDb();
  const rows = db
    .prepare(
      `
        SELECT
          username,
          role,
          name,
          email,
          status,
          membership_status,
          account_status,
          goes_by,
          last_login,
          teacher_id,
          password
        FROM accounts
        ORDER BY username ASC
      `,
    )
    .all() as Array<{
    username: string;
    role: string;
    name: string;
    email: string;
    status: string | null;
    membership_status: string | null;
    account_status: string | null;
    goes_by: string | null;
    last_login: string | null;
    teacher_id: string | null;
    password: string | null;
  }>;

  const safe = rows.map(
    ({
      password: _password,
      membership_status,
      account_status,
      goes_by,
      last_login,
      teacher_id,
      ...rest
    }) => ({
      ...rest,
      membershipStatus: membership_status ?? undefined,
      accountStatus: account_status ?? undefined,
      goesBy: goes_by ?? undefined,
      lastLogin: last_login ?? null,
      teacherId: teacher_id ?? undefined,
    }),
  );

  return NextResponse.json({ accounts: safe });
}
