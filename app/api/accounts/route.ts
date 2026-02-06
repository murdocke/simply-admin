import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

type AccountRecord = {
  username: string;
  role: string;
  name: string;
  email: string;
  status: string;
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

export async function GET() {
  const data = await readAccountsFile();
  const safe = data.accounts.map(({ password: _password, ...rest }) => rest);
  return NextResponse.json({ accounts: safe });
}
