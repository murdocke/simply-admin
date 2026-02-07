import { NextResponse } from 'next/server';

type UnlockItem = {
  id: string;
  program: string;
  section: string;
  price: number;
};

type UnlockStore = {
  students: Map<string, UnlockItem[]>;
  teachers: Map<string, UnlockItem[]>;
};

declare global {
  // eslint-disable-next-line no-var
  var __smPracticeHubUnlocks: UnlockStore | undefined;
}

const getStore = () => {
  if (!global.__smPracticeHubUnlocks) {
    global.__smPracticeHubUnlocks = {
      students: new Map(),
      teachers: new Map(),
    };
  }
  return global.__smPracticeHubUnlocks;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');
  const studentId = searchParams.get('studentId');
  const teacherUsername = searchParams.get('teacherUsername');
  const store = getStore();

  if (role === 'student' && studentId) {
    const items = store.students.get(studentId) ?? [];
    return NextResponse.json({ items });
  }

  if (role === 'teacher' && teacherUsername) {
    const items = store.teachers.get(teacherUsername) ?? [];
    return NextResponse.json({ items });
  }

  return NextResponse.json({ items: [] });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    role?: 'student' | 'teacher';
    studentId?: string;
    teacherUsername?: string;
    items?: UnlockItem[];
  };

  const store = getStore();
  const items = Array.isArray(body.items) ? body.items : [];

  if (body.role === 'student' && body.studentId) {
    store.students.set(body.studentId, items);
    return NextResponse.json({ ok: true });
  }

  if (body.role === 'teacher' && body.teacherUsername) {
    store.teachers.set(body.teacherUsername, items);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false }, { status: 400 });
}
