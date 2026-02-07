import { NextResponse } from 'next/server';

type WatchedStore = Record<string, Record<string, boolean>>;

const getStore = () => {
  const globalStore = globalThis as typeof globalThis & {
    __smVideoWatched?: WatchedStore;
  };
  if (!globalStore.__smVideoWatched) {
    globalStore.__smVideoWatched = {};
  }
  return globalStore.__smVideoWatched;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId')?.trim();
  if (!studentId) {
    return NextResponse.json({ items: {} });
  }
  const store = getStore();
  return NextResponse.json({ items: store[studentId] ?? {} });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      studentId?: string;
      items?: Record<string, boolean>;
      itemKey?: string;
      watched?: boolean;
    };
    const studentId = body.studentId?.trim();
    if (!studentId) {
      return NextResponse.json({ ok: false });
    }
    const store = getStore();
    const current = store[studentId] ?? {};
    let next = { ...current };
    if (body.items && typeof body.items === 'object') {
      next = { ...next, ...body.items };
    }
    if (body.itemKey) {
      next[body.itemKey] = body.watched !== false;
    }
    store[studentId] = next;
    return NextResponse.json({ ok: true, items: next });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
