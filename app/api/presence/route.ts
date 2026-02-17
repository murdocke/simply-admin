import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = (await request.json()) as {
    key?: string;
    activity?: { label?: string; detail?: string };
  };
  if (!body?.key) {
    return NextResponse.json({ error: 'Key is required.' }, { status: 400 });
  }

  const db = getDb();
  const lastSeen = new Date().toISOString();
  const activityLabel = body.activity?.label ?? null;
  const activityDetail = body.activity?.detail ?? null;
  const activityUpdatedAt = body.activity?.label ? lastSeen : null;
  db.prepare(
    `
      INSERT INTO presence (
        key,
        last_seen,
        activity_label,
        activity_detail,
        activity_updated_at
      ) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        last_seen = excluded.last_seen,
        activity_label = CASE
          WHEN excluded.activity_label IS NOT NULL THEN excluded.activity_label
          ELSE activity_label
        END,
        activity_detail = CASE
          WHEN excluded.activity_label IS NOT NULL THEN excluded.activity_detail
          ELSE activity_detail
        END,
        activity_updated_at = CASE
          WHEN excluded.activity_label IS NOT NULL THEN excluded.activity_updated_at
          ELSE activity_updated_at
        END
    `,
  ).run(body.key, lastSeen, activityLabel, activityDetail, activityUpdatedAt);

  return NextResponse.json({ ok: true });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  if (!key) {
    return NextResponse.json({ error: 'Key is required.' }, { status: 400 });
  }

  const db = getDb();
  const row = db
    .prepare(
      `
        SELECT last_seen, activity_label, activity_detail, activity_updated_at
        FROM presence
        WHERE key = ?
      `,
    )
    .get(key) as
    | {
        last_seen: string | null;
        activity_label: string | null;
        activity_detail: string | null;
        activity_updated_at: string | null;
      }
    | undefined;
  return NextResponse.json({
    lastSeen: row?.last_seen ?? null,
    activity: row?.activity_label
      ? {
          label: row.activity_label,
          detail: row.activity_detail ?? undefined,
          updatedAt: row.activity_updated_at ?? row.last_seen ?? '',
        }
      : null,
  });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  if (!key) {
    return NextResponse.json({ error: 'Key is required.' }, { status: 400 });
  }

  const db = getDb();
  db.prepare('DELETE FROM presence WHERE key = ?').run(key);

  return NextResponse.json({ ok: true });
}
