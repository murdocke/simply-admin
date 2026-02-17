import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

type ParentRecord = {
  id: string;
  username: string;
  name: string;
  email: string;
  phone?: string;
  preferredContact?: string;
  students: string[];
  billing?: {
    status?: string;
    nextPaymentDue?: string;
    monthlyTotal?: number;
    lastPaid?: string;
  };
};

export async function GET() {
  const db = getDb();
  const parentRows = db.prepare('SELECT * FROM parents').all() as Array<
    Record<string, string | number | null>
  >;
  const studentRows = db
    .prepare('SELECT parent_id, student_id FROM parent_students')
    .all() as Array<{ parent_id: string; student_id: string }>;

  const studentMap = new Map<string, string[]>();
  for (const row of studentRows) {
    const list = studentMap.get(row.parent_id) ?? [];
    list.push(row.student_id);
    studentMap.set(row.parent_id, list);
  }

  const parents: ParentRecord[] = parentRows.map(row => ({
    id: String(row.id ?? ''),
    username: String(row.username ?? ''),
    name: String(row.name ?? ''),
    email: String(row.email ?? ''),
    phone: row.phone ? String(row.phone) : undefined,
    preferredContact: row.preferred_contact
      ? String(row.preferred_contact)
      : undefined,
    students: studentMap.get(String(row.id)) ?? [],
    billing: {
      status: row.billing_status ? String(row.billing_status) : undefined,
      nextPaymentDue: row.billing_next_payment_due
        ? String(row.billing_next_payment_due)
        : undefined,
      monthlyTotal:
        typeof row.billing_monthly_total === 'number'
          ? row.billing_monthly_total
          : row.billing_monthly_total
            ? Number(row.billing_monthly_total)
            : undefined,
      lastPaid: row.billing_last_paid
        ? String(row.billing_last_paid)
        : undefined,
    },
  }));

  return NextResponse.json({ parents });
}
