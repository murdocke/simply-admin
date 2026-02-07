import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

type AccountRecord = {
  username: string;
  role: string;
  name: string;
  email: string;
  goesBy?: string;
  status: string;
  lastLogin: string | null;
  password?: string;
};

type AccountsFile = {
  accounts: AccountRecord[];
};

const dataFile = path.join(process.cwd(), 'data', 'accounts.json');

async function readAccountsFile(): Promise<AccountsFile> {
  try {
    const raw = await fs.readFile(dataFile, 'utf-8');
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
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  await fs.writeFile(dataFile, JSON.stringify(data, null, 2), 'utf-8');
}

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

  const data = await readAccountsFile();
  const account = data.accounts.find(
    record =>
      record.username.toLowerCase() === username.toLowerCase() &&
      record.role === role,
  );

  if (!account) {
    return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
  }

  const { password: _password, ...safe } = account;
  return NextResponse.json({ account: safe });
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

  const data = await readAccountsFile();
  const index = data.accounts.findIndex(
    record =>
      record.username.toLowerCase() === body.username!.toLowerCase() &&
      record.role === body.role,
  );

  if (index === -1) {
    return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
  }

  const updated: AccountRecord = {
    ...data.accounts[index],
    lastLogin: new Date().toISOString(),
  };

  data.accounts[index] = updated;
  await writeAccountsFile(data);

  return NextResponse.json({ account: updated });
}
