import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

type TypingStore = {
  lastSeen: Record<string, string>;
};

const typingFile = path.join(process.cwd(), 'data', 'typing.json');

async function readStore(): Promise<TypingStore> {
  try {
    const raw = await fs.readFile(typingFile, 'utf-8');
    const parsed = JSON.parse(raw) as TypingStore;
    return parsed?.lastSeen ? parsed : { lastSeen: {} };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { lastSeen: {} };
    }
    throw error;
  }
}

async function writeStore(data: TypingStore) {
  await fs.mkdir(path.dirname(typingFile), { recursive: true });
  await fs.writeFile(typingFile, JSON.stringify(data, null, 2), 'utf-8');
}

export async function POST(request: Request) {
  const body = (await request.json()) as { key?: string };
  if (!body?.key) {
    return NextResponse.json({ error: 'Key is required.' }, { status: 400 });
  }

  const store = await readStore();
  store.lastSeen[body.key] = new Date().toISOString();
  await writeStore(store);
  return NextResponse.json({ ok: true });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  if (!key) {
    return NextResponse.json({ error: 'Key is required.' }, { status: 400 });
  }

  const store = await readStore();
  return NextResponse.json({ lastSeen: store.lastSeen[key] ?? null });
}
