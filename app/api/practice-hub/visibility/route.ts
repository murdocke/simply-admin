import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

type VisibilityState = {
  selectedIds: string[];
  focusIds: string[];
  practiceDays: Record<string, string[]>;
  helpFlags: Record<string, boolean>;
};

export const runtime = 'nodejs';

const emptyState = (): VisibilityState => ({
  selectedIds: [],
  focusIds: [],
  practiceDays: {},
  helpFlags: {},
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');
  if (!studentId) {
    return NextResponse.json(emptyState());
  }
  const db = getDb();
  const row = db
    .prepare(
      `
        SELECT selected_ids_json, focus_ids_json, practice_days_json, help_flags_json
        FROM practice_hub_visibility
        WHERE student_id = ?
      `,
    )
    .get(studentId) as
    | {
        selected_ids_json: string | null;
        focus_ids_json: string | null;
        practice_days_json: string | null;
        help_flags_json: string | null;
      }
    | undefined;
  if (!row) {
    return NextResponse.json(emptyState());
  }
  return NextResponse.json({
    selectedIds: row.selected_ids_json ? JSON.parse(row.selected_ids_json) : [],
    focusIds: row.focus_ids_json ? JSON.parse(row.focus_ids_json) : [],
    practiceDays: row.practice_days_json ? JSON.parse(row.practice_days_json) : {},
    helpFlags: row.help_flags_json ? JSON.parse(row.help_flags_json) : {},
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    studentId?: string;
    selectedIds?: string[];
    focusIds?: string[];
    practiceDays?: Record<string, string[]>;
    helpFlags?: Record<string, boolean>;
  };

  if (!body.studentId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const db = getDb();
  const existingRow = db
    .prepare(
      `
        SELECT selected_ids_json, focus_ids_json, practice_days_json, help_flags_json
        FROM practice_hub_visibility
        WHERE student_id = ?
      `,
    )
    .get(body.studentId) as
    | {
        selected_ids_json: string | null;
        focus_ids_json: string | null;
        practice_days_json: string | null;
        help_flags_json: string | null;
      }
    | undefined;
  const existing: VisibilityState = existingRow
    ? {
        selectedIds: existingRow.selected_ids_json
          ? JSON.parse(existingRow.selected_ids_json)
          : [],
        focusIds: existingRow.focus_ids_json
          ? JSON.parse(existingRow.focus_ids_json)
          : [],
        practiceDays: existingRow.practice_days_json
          ? JSON.parse(existingRow.practice_days_json)
          : {},
        helpFlags: existingRow.help_flags_json
          ? JSON.parse(existingRow.help_flags_json)
          : {},
      }
    : emptyState();
  const next: VisibilityState = {
    selectedIds:
      'selectedIds' in body && Array.isArray(body.selectedIds)
        ? body.selectedIds
        : existing.selectedIds,
    focusIds:
      'focusIds' in body && Array.isArray(body.focusIds)
        ? body.focusIds
        : existing.focusIds,
    practiceDays:
      'practiceDays' in body && body.practiceDays && typeof body.practiceDays === 'object'
        ? body.practiceDays
        : existing.practiceDays,
    helpFlags:
      'helpFlags' in body && body.helpFlags && typeof body.helpFlags === 'object'
        ? body.helpFlags
        : existing.helpFlags,
  };
  db.prepare(
    `
      INSERT INTO practice_hub_visibility (
        student_id,
        selected_ids_json,
        focus_ids_json,
        practice_days_json,
        help_flags_json
      ) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(student_id) DO UPDATE SET
        selected_ids_json = excluded.selected_ids_json,
        focus_ids_json = excluded.focus_ids_json,
        practice_days_json = excluded.practice_days_json,
        help_flags_json = excluded.help_flags_json
    `,
  ).run(
    body.studentId,
    JSON.stringify(next.selectedIds ?? []),
    JSON.stringify(next.focusIds ?? []),
    JSON.stringify(next.practiceDays ?? {}),
    JSON.stringify(next.helpFlags ?? {}),
  );

  return NextResponse.json({ ok: true });
}
