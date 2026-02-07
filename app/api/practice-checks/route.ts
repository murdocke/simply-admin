import { NextResponse } from 'next/server';

type PracticeStore = Record<string, Record<string, boolean[]>>;

const getStore = () => {
  const globalStore = globalThis as typeof globalThis & {
    __smPracticeChecks?: PracticeStore;
  };
  if (!globalStore.__smPracticeChecks) {
    globalStore.__smPracticeChecks = {};
  }
  return globalStore.__smPracticeChecks;
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
      items?: Record<string, boolean[]>;
      itemKey?: string;
      dayIndex?: number;
      checked?: boolean;
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
    if (body.itemKey && typeof body.dayIndex === 'number') {
      const row = Array.isArray(next[body.itemKey])
        ? [...next[body.itemKey]]
        : Array.from({ length: 7 }, () => false);
      row[body.dayIndex] = body.checked !== false;
      next[body.itemKey] = row;
    }
    store[studentId] = next;
    return NextResponse.json({ ok: true, items: next });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
