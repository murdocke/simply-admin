import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

type VisibilityState = {
  selectedIds: string[];
  focusIds: string[];
  practiceDays: Record<string, string[]>;
  helpFlags: Record<string, boolean>;
};

type VisibilityStore = Record<string, VisibilityState>;

const filePath = path.join(process.cwd(), 'data', 'practice-hub-visibility.json');

const emptyState = (): VisibilityState => ({
  selectedIds: [],
  focusIds: [],
  practiceDays: {},
  helpFlags: {},
});

const readStore = async (): Promise<VisibilityStore> => {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as VisibilityStore;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeStore = async (store: VisibilityStore) => {
  await fs.writeFile(filePath, JSON.stringify(store, null, 2));
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');
  if (!studentId) {
    return NextResponse.json(emptyState());
  }
  const store = await readStore();
  const state = store[studentId] ?? emptyState();
  return NextResponse.json(state);
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

  const store = await readStore();
  const existing = store[body.studentId] ?? emptyState();
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
  store[body.studentId] = next;
  await writeStore(store);

  return NextResponse.json({ ok: true });
}
