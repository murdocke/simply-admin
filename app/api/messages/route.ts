import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

type Message = {
  id: string;
  sender: 'teacher' | 'student' | 'corporate';
  text: string;
  timestamp: string;
};

type MessageStore = {
  threads: Record<string, Message[]>;
};

const messagesFile = path.join(process.cwd(), 'data', 'messages.json');

async function readStore(): Promise<MessageStore> {
  try {
    const raw = await fs.readFile(messagesFile, 'utf-8');
    const parsed = JSON.parse(raw) as MessageStore;
    return parsed?.threads ? parsed : { threads: {} };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { threads: {} };
    }
    throw error;
  }
}

async function writeStore(data: MessageStore) {
  await fs.mkdir(path.dirname(messagesFile), { recursive: true });
  await fs.writeFile(messagesFile, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET() {
  const store = await readStore();
  return NextResponse.json({ threads: store.threads ?? {} });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    threadId?: string;
    message?: Message;
  };

  if (!body.threadId || !body.message) {
    return NextResponse.json(
      { error: 'threadId and message are required.' },
      { status: 400 },
    );
  }

  const store = await readStore();
  const current = store.threads[body.threadId] ?? [];
  store.threads[body.threadId] = [...current, body.message];
  await writeStore(store);

  return NextResponse.json({ ok: true });
}
