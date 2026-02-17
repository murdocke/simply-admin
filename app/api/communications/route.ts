import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

type CommunicationEntry = {
  id: string;
  title: string;
  body: string;
  mediaType?: 'image' | 'video' | 'pdf' | 'none';
  mediaUrl?: string;
  createdAt: string;
  author?: string;
};

export const runtime = 'nodejs';

export async function GET() {
  const db = getDb();
  const rows = db
    .prepare(
      `
        SELECT id, title, body, media_type, media_url, created_at, author
        FROM communications
        ORDER BY created_at DESC
      `,
    )
    .all() as Array<{
    id: string;
    title: string;
    body: string;
    media_type: string | null;
    media_url: string | null;
    created_at: string | null;
    author: string | null;
  }>;
  const communications = rows.map(row => ({
    id: row.id,
    title: row.title,
    body: row.body,
    mediaType: row.media_type ?? 'none',
    mediaUrl: row.media_url ?? '',
    createdAt: row.created_at ?? '',
    author: row.author ?? '',
  }));
  return NextResponse.json({ communications });
}

export async function POST(request: Request) {
  const body = (await request.json()) as CommunicationEntry;
  if (!body?.title || !body?.body || !body?.createdAt || !body?.id) {
    return NextResponse.json(
      { error: 'Title, body, id, and createdAt are required.' },
      { status: 400 },
    );
  }

  const db = getDb();
  db.prepare(
    `
      INSERT INTO communications (
        id,
        title,
        body,
        media_type,
        media_url,
        created_at,
        author
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        body = excluded.body,
        media_type = excluded.media_type,
        media_url = excluded.media_url,
        created_at = excluded.created_at,
        author = excluded.author
    `,
  ).run(
    body.id,
    body.title,
    body.body,
    body.mediaType ?? 'none',
    body.mediaUrl ?? '',
    body.createdAt,
    body.author ?? '',
  );
  return NextResponse.json({ communication: body });
}

export async function DELETE(request: Request) {
  const contentType = request.headers.get('content-type') ?? '';
  let id = '';
  if (contentType.includes('application/json')) {
    try {
      const body = (await request.json()) as { id?: string };
      id = body?.id ?? '';
    } catch {
      id = '';
    }
  }
  if (!id) {
    const { searchParams } = new URL(request.url);
    id = searchParams.get('id') ?? '';
  }
  if (!id) {
    return NextResponse.json(
      { error: 'id is required.' },
      { status: 400 },
    );
  }

  const db = getDb();
  const match = db
    .prepare(
      `
        SELECT id, title, body, media_type, media_url, created_at, author
        FROM communications
        WHERE id = ?
      `,
    )
    .get(id) as
    | {
        id: string;
        title: string;
        body: string;
        media_type: string | null;
        media_url: string | null;
        created_at: string | null;
        author: string | null;
      }
    | undefined;
  db.prepare('DELETE FROM communications WHERE id = ?').run(id);
  const communication = match
    ? {
        id: match.id,
        title: match.title,
        body: match.body,
        mediaType: match.media_type ?? 'none',
        mediaUrl: match.media_url ?? '',
        createdAt: match.created_at ?? '',
        author: match.author ?? '',
      }
    : null;
  return NextResponse.json({ communication });
}
