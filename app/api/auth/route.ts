import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

type AccountRecord = {
  username: string;
  role: 'company' | 'teacher' | 'student';
  name: string;
  email: string;
  accountStatus?: string;
  membershipStatus?: string;
  lastLogin: string | null;
  password?: string;
};

type AccountsFile = {
  accounts: AccountRecord[];
};

const accountsFile = path.join(process.cwd(), 'data', 'accounts.json');

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

  const data = await readAccountsFile();
  const account = data.accounts.find(
    record => record.username.toLowerCase() === username,
  );

  if (!account || (account.password ?? '') !== password) {
    return NextResponse.json(
      { error: 'Invalid username or password.' },
      { status: 401 },
    );
  }

  if (account.accountStatus && account.accountStatus !== 'Active') {
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
