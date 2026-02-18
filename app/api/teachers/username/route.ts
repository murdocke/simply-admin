import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

const normalizeUsername = (value: string) =>
  value.trim().toLowerCase().replace(/[^a-z0-9.]/g, '');

export async function POST(request: Request) {
  const body = (await request.json()) as {
    action?: 'check' | 'update';
    currentUsername?: string;
    nextUsername?: string;
    email?: string;
  };

  const action = body.action ?? 'check';
  const nextUsername = body.nextUsername
    ? normalizeUsername(body.nextUsername)
    : '';

  if (!nextUsername) {
    return NextResponse.json(
      { error: 'Next username is required.' },
      { status: 400 },
    );
  }

  const db = getDb();
  const accountConflict = db
    .prepare('SELECT username FROM accounts WHERE LOWER(username) = ?')
    .get(nextUsername);
  const teacherConflict = db
    .prepare('SELECT id FROM teachers WHERE LOWER(username) = ?')
    .get(nextUsername);
  const available = !accountConflict && !teacherConflict;

  if (action === 'check') {
    return NextResponse.json({ available });
  }

  if (!available) {
    return NextResponse.json(
      { error: 'Username already in use.' },
      { status: 409 },
    );
  }

  const currentUsername = body.currentUsername
    ? normalizeUsername(body.currentUsername)
    : '';
  const email = body.email?.trim().toLowerCase() ?? '';

  if (!currentUsername && !email) {
    return NextResponse.json(
      { error: 'Current username or email is required.' },
      { status: 400 },
    );
  }

  const account = currentUsername
    ? (db
        .prepare(
          `
          SELECT username, teacher_id
          FROM accounts
          WHERE role = 'teacher' AND LOWER(username) = ?
        `,
        )
        .get(currentUsername) as
        | { username?: string; teacher_id?: string }
        | undefined)
    : undefined;

  const accountByEmail = !account && email
    ? (db
        .prepare(
          `
          SELECT username, teacher_id
          FROM accounts
          WHERE role = 'teacher' AND LOWER(email) = ?
        `,
        )
        .get(email) as { username?: string; teacher_id?: string } | undefined)
    : undefined;

  const resolvedAccount = account ?? accountByEmail;
  const teacherId = resolvedAccount?.teacher_id ?? '';

  let teacher =
    teacherId
      ? (db
          .prepare('SELECT id FROM teachers WHERE id = ?')
          .get(teacherId) as { id?: string } | undefined)
      : undefined;

  if (!teacher && currentUsername) {
    teacher = db
      .prepare('SELECT id FROM teachers WHERE LOWER(username) = ?')
      .get(currentUsername) as { id?: string } | undefined;
  }

  if (!teacher && email) {
    teacher = db
      .prepare('SELECT id FROM teachers WHERE LOWER(email) = ?')
      .get(email) as { id?: string } | undefined;
  }

  if (!teacher?.id) {
    return NextResponse.json({ error: 'Teacher not found.' }, { status: 404 });
  }

  db.prepare(
    `
      UPDATE teachers
      SET username = ?, updated_at = ?
      WHERE id = ?
    `,
  ).run(nextUsername, new Date().toISOString(), teacher.id);

  db.prepare(
    `
      UPDATE accounts
      SET username = ?
      WHERE role = 'teacher' AND (teacher_id = ? OR LOWER(username) = ?)
    `,
  ).run(nextUsername, teacher.id, currentUsername || resolvedAccount?.username || '');

  return NextResponse.json({ ok: true, username: nextUsername });
}
