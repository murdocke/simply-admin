import { NextResponse } from 'next/server';

type VisibilityState = {
  selectedIds: string[];
  focusIds: string[];
};

type VisibilityStore = Map<string, VisibilityState>;

declare global {
  // eslint-disable-next-line no-var
  var __smPracticeHubVisibility: VisibilityStore | undefined;
}

const getStore = () => {
  if (!global.__smPracticeHubVisibility) {
    global.__smPracticeHubVisibility = new Map();
  }
  return global.__smPracticeHubVisibility;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');
  if (!studentId) {
    return NextResponse.json({ selectedIds: [], focusIds: [] });
  }
  const store = getStore();
  const state = store.get(studentId) ?? { selectedIds: [], focusIds: [] };
  return NextResponse.json(state);
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    studentId?: string;
    selectedIds?: string[];
    focusIds?: string[];
  };

  if (!body.studentId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const store = getStore();
  store.set(body.studentId, {
    selectedIds: Array.isArray(body.selectedIds) ? body.selectedIds : [],
    focusIds: Array.isArray(body.focusIds) ? body.focusIds : [],
  });

  return NextResponse.json({ ok: true });
}
