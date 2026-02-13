import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

type PresenceStore = {
  lastSeen: Record<string, string>;
  activity?: Record<
    string,
    {
      label: string;
      detail?: string;
      updatedAt: string;
    }
  >;
};

const presenceFile = path.join(process.cwd(), 'data', 'presence.json');

async function readPresence(): Promise<PresenceStore> {
  try {
    const raw = await fs.readFile(presenceFile, 'utf-8');
    const parsed = JSON.parse(raw) as PresenceStore;
    return parsed?.lastSeen ? parsed : { lastSeen: {}, activity: {} };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { lastSeen: {}, activity: {} };
    }
    throw error;
  }
}

async function writePresence(data: PresenceStore) {
  await fs.mkdir(path.dirname(presenceFile), { recursive: true });
  await fs.writeFile(presenceFile, JSON.stringify(data, null, 2), 'utf-8');
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    key?: string;
    activity?: { label?: string; detail?: string };
  };
  if (!body?.key) {
    return NextResponse.json({ error: 'Key is required.' }, { status: 400 });
  }

  const data = await readPresence();
  data.lastSeen[body.key] = new Date().toISOString();
  if (body.activity?.label) {
    data.activity = data.activity ?? {};
    data.activity[body.key] = {
      label: body.activity.label,
      detail: body.activity.detail,
      updatedAt: new Date().toISOString(),
    };
  }
  await writePresence(data);

  return NextResponse.json({ ok: true });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  if (!key) {
    return NextResponse.json({ error: 'Key is required.' }, { status: 400 });
  }

  const data = await readPresence();
  return NextResponse.json({
    lastSeen: data.lastSeen[key] ?? null,
    activity: data.activity?.[key] ?? null,
  });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  if (!key) {
    return NextResponse.json({ error: 'Key is required.' }, { status: 400 });
  }

  const data = await readPresence();
  if (data.lastSeen[key]) {
    delete data.lastSeen[key];
    if (data.activity?.[key]) {
      delete data.activity[key];
    }
    await writePresence(data);
  }

  return NextResponse.json({ ok: true });
}
