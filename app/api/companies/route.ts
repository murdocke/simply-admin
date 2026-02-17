import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

type CompanyRecord = {
  username: string;
  name: string;
  email: string;
  status: string;
  lastLogin: string | null;
};

export async function GET() {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM companies').all() as Array<
    Record<string, string | null>
  >;
  const companies: CompanyRecord[] = rows.map(row => ({
    username: row.username ?? '',
    name: row.name ?? '',
    email: row.email ?? '',
    status: row.status ?? '',
    lastLogin: row.last_login ?? null,
  }));
  return NextResponse.json({ companies });
}
