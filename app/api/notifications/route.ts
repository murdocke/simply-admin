import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { promises as fs } from 'node:fs';
import path from 'node:path';

export const runtime = 'nodejs';

export async function GET() {
  const db = getDb();
  const ttlMs = 10 * 60 * 1000;
  const now = Date.now();
  const rows = db
    .prepare(
      `
      SELECT id, type, to_value, source, subject, title, body, data_json, status, created_at
      FROM notification_events
      ORDER BY datetime(created_at) DESC
      LIMIT 200
    `,
    )
    .all() as Array<Record<string, string | null>>;

  const events = rows.map(row => ({
    id: row.id ?? '',
    type: row.type ?? '',
    to: row.to_value ?? '',
    source: row.source ?? '',
    subject: row.subject ?? '',
    title: row.title ?? '',
    body: row.body ?? '',
    data: row.data_json ? JSON.parse(row.data_json) : null,
    status: row.status ?? '',
    createdAt: row.created_at ?? '',
  }));

  const filtered = events.filter(event => {
    const isVerification =
      event.source === 'Teacher Registration' &&
      (event.subject === 'Verification Code' ||
        event.title === 'Verification Code' ||
        (event.data as Record<string, unknown>)?.verificationChannel);
    if (!isVerification) return true;
    const createdAt = event.createdAt ? new Date(event.createdAt).getTime() : 0;
    if (!createdAt) return true;
    return now - createdAt <= ttlMs;
  });

  const latestVerification = new Map<string, typeof filtered[number]>();
  const otherEvents: typeof filtered = [];
  filtered.forEach(event => {
    const data = event.data as Record<string, unknown> | null;
    const channel = (data?.verificationChannel as string | undefined) ?? 'code';
    const alertId = (data?.alertId as string | undefined) ?? '';
    const isVerification =
      event.source === 'Teacher Registration' &&
      (event.subject === 'Verification Code' ||
        event.title === 'Verification Code' ||
        data?.verificationChannel);
    if (!isVerification || !alertId) {
      otherEvents.push(event);
      return;
    }
    const key = `${alertId}:${channel}`;
    const existing = latestVerification.get(key);
    if (!existing) {
      latestVerification.set(key, event);
      return;
    }
    const existingTime = existing.createdAt
      ? new Date(existing.createdAt).getTime()
      : 0;
    const nextTime = event.createdAt ? new Date(event.createdAt).getTime() : 0;
    if (nextTime >= existingTime) {
      latestVerification.set(key, event);
    }
  });

  const combined = [...otherEvents, ...Array.from(latestVerification.values())];
  combined.sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });

  return NextResponse.json({ events: combined });
}

export async function POST() {
  const db = getDb();
  db.prepare(
    `
      DELETE FROM company_alerts_active
      WHERE alert_id IN (
        SELECT id FROM company_alerts WHERE title = 'New Teacher Interest'
      )
    `,
  ).run();
  db.prepare(`DELETE FROM company_alerts WHERE title = 'New Teacher Interest'`).run();
  db.prepare(`DELETE FROM questionnaire_responses`).run();
  db.prepare(`DELETE FROM registration_verification_codes`).run();
  db.prepare(`DELETE FROM lead_verification_codes`).run();
  db.prepare(
    `DELETE FROM notification_events WHERE source IN ('Teacher Interest', 'Teacher Registration', 'Questionnaire', 'Lead Form', 'Registration')`,
  ).run();

  const alertsPath = path.join(process.cwd(), 'data', 'company-alerts.json');
  try {
    const raw = await fs.readFile(alertsPath, 'utf-8');
    const parsed = JSON.parse(raw) as {
      active?: { company?: Array<Record<string, unknown>> };
      history?: Array<Record<string, unknown>>;
    };
    if (parsed.active?.company) {
      parsed.active.company = parsed.active.company.filter(
        alert => alert?.title !== 'New Teacher Interest',
      );
    }
    if (parsed.history) {
      parsed.history = parsed.history.filter(
        alert => alert?.title !== 'New Teacher Interest',
      );
    }
    await fs.writeFile(alertsPath, `${JSON.stringify(parsed, null, 2)}\n`, 'utf-8');
  } catch {
    // ignore file failures
  }

  return NextResponse.json({ ok: true });
}
