import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

type Message = {
  id: string;
  sender: 'teacher' | 'student' | 'corporate';
  text: string;
  timestamp: string;
  subject?: string;
};

export const runtime = 'nodejs';

export async function GET() {
  const db = getDb();
  const rows = db
    .prepare(
      `
        SELECT id, thread_id, sender, text, timestamp, subject
        FROM messages
        ORDER BY timestamp ASC
      `,
    )
    .all() as Array<{
    id: string;
    thread_id: string;
    sender: Message['sender'];
    text: string;
    timestamp: string;
    subject: string | null;
  }>;

  const threads: Record<string, Message[]> = {};
  rows.forEach(row => {
    if (!threads[row.thread_id]) threads[row.thread_id] = [];
    threads[row.thread_id].push({
      id: row.id,
      sender: row.sender,
      text: row.text,
      timestamp: row.timestamp,
      subject: row.subject ?? undefined,
    });
  });

  const subjectRows = db
    .prepare('SELECT thread_id, subject FROM message_threads')
    .all() as Array<{ thread_id: string; subject: string | null }>;
  const subjects: Record<string, string> = {};
  subjectRows.forEach(row => {
    if (row.subject) subjects[row.thread_id] = row.subject;
    if (!threads[row.thread_id]) {
      threads[row.thread_id] = [];
    }
  });

  return NextResponse.json({ threads, subjects });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    threadId?: string;
    message?: Message;
    subject?: string;
  };

  if (!body.threadId || !body.message) {
    return NextResponse.json(
      { error: 'threadId and message are required.' },
      { status: 400 },
    );
  }

  const db = getDb();
  const tx = db.transaction(() => {
    db.prepare(
      `
        INSERT INTO messages (
          id,
          thread_id,
          sender,
          text,
          timestamp,
          subject
        ) VALUES (?, ?, ?, ?, ?, ?)
      `,
    ).run(
      body.message.id,
      body.threadId,
      body.message.sender,
      body.message.text,
      body.message.timestamp,
      body.message.subject ?? null,
    );

    if (body.subject !== undefined) {
      if (body.subject && body.subject.trim()) {
        db.prepare(
          `
            INSERT INTO message_threads (thread_id, subject)
            VALUES (?, ?)
            ON CONFLICT(thread_id) DO UPDATE SET subject = excluded.subject
          `,
        ).run(body.threadId, body.subject.trim());
      } else {
        db.prepare(
          `
            UPDATE message_threads
            SET subject = NULL
            WHERE thread_id = ?
          `,
        ).run(body.threadId);
      }
    } else {
      db.prepare(
        `
          INSERT OR IGNORE INTO message_threads (thread_id, subject)
          VALUES (?, NULL)
        `,
      ).run(body.threadId);
    }
  });
  tx();

  return NextResponse.json({ ok: true });
}
