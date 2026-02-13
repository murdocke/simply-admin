import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

type CommunicationEntry = {
  id: string;
  title: string;
  body: string;
  mediaType?: 'image' | 'video' | 'pdf' | 'none';
  mediaUrl?: string;
  createdAt: string;
  author?: string;
};

type CommunicationsFile = {
  communications: CommunicationEntry[];
};

const communicationsFile = path.join(
  process.cwd(),
  'data',
  'communications.json',
);

async function readCommunicationsFile(): Promise<CommunicationsFile> {
  try {
    const raw = await fs.readFile(communicationsFile, 'utf-8');
    const parsed = JSON.parse(raw) as CommunicationsFile;
    if (!Array.isArray(parsed.communications)) {
      return { communications: [] };
    }
    return parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { communications: [] };
    }
    throw error;
  }
}

async function writeCommunicationsFile(payload: CommunicationsFile) {
  await fs.writeFile(communicationsFile, JSON.stringify(payload, null, 2));
}

export async function GET() {
  const data = await readCommunicationsFile();
  return NextResponse.json({ communications: data.communications ?? [] });
}

export async function POST(request: Request) {
  const body = (await request.json()) as CommunicationEntry;
  if (!body?.title || !body?.body || !body?.createdAt || !body?.id) {
    return NextResponse.json(
      { error: 'Title, body, id, and createdAt are required.' },
      { status: 400 },
    );
  }

  const data = await readCommunicationsFile();
  const next = [body, ...(data.communications ?? [])];
  await writeCommunicationsFile({ communications: next });
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

  const data = await readCommunicationsFile();
  const existing = data.communications ?? [];
  const match = existing.find(entry => entry.id === id) ?? null;
  const next = existing.filter(entry => entry.id !== id);
  await writeCommunicationsFile({ communications: next });
  return NextResponse.json({ communication: match });
}
