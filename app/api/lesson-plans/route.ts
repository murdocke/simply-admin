import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

type LessonPlanItem = {
  title: string;
  section: string;
  material: string;
  part: string;
};

type LessonPlan = {
  id: string;
  studentId: string;
  studentName?: string;
  teacher?: string;
  lessonDate: string;
  rangeStart: string;
  rangeEnd: string;
  items: LessonPlanItem[];
  notes?: string;
  focus?: string;
  resources?: string;
  createdAt: string;
  updatedAt: string;
};

type LessonPlanStore = {
  plans: LessonPlan[];
};

const plansFile = path.join(process.cwd(), 'data', 'lesson-plans.json');

async function readStore(): Promise<LessonPlanStore> {
  try {
    const raw = await fs.readFile(plansFile, 'utf-8');
    const parsed = JSON.parse(raw) as LessonPlanStore;
    return Array.isArray(parsed?.plans) ? parsed : { plans: [] };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { plans: [] };
    }
    throw error;
  }
}

async function writeStore(data: LessonPlanStore) {
  await fs.mkdir(path.dirname(plansFile), { recursive: true });
  await fs.writeFile(plansFile, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const studentId = url.searchParams.get('studentId');
  const lessonDate = url.searchParams.get('lessonDate');
  const store = await readStore();

  if (studentId && lessonDate) {
    const plan = store.plans.find(
      entry => entry.studentId === studentId && entry.lessonDate === lessonDate,
    );
    return NextResponse.json({ plan: plan ?? null });
  }

  return NextResponse.json({ plans: store.plans });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { plan?: Partial<LessonPlan> };
  if (!body.plan?.studentId || !body.plan.lessonDate) {
    return NextResponse.json(
      { error: 'studentId and lessonDate are required.' },
      { status: 400 },
    );
  }

  const store = await readStore();
  const now = new Date().toISOString();
  const nextPlan: LessonPlan = {
    id:
      body.plan.id ??
      `${body.plan.studentId}-${body.plan.lessonDate}`.replace(/\s+/g, '-'),
    studentId: body.plan.studentId,
    studentName: body.plan.studentName,
    teacher: body.plan.teacher,
    lessonDate: body.plan.lessonDate,
    rangeStart: body.plan.rangeStart ?? body.plan.lessonDate,
    rangeEnd: body.plan.rangeEnd ?? body.plan.lessonDate,
    items: body.plan.items ?? [],
    notes: body.plan.notes ?? '',
    focus: body.plan.focus ?? '',
    resources: body.plan.resources ?? '',
    createdAt: body.plan.createdAt ?? now,
    updatedAt: now,
  };

  const existingIndex = store.plans.findIndex(
    entry =>
      entry.studentId === nextPlan.studentId &&
      entry.lessonDate === nextPlan.lessonDate,
  );

  if (existingIndex >= 0) {
    const existing = store.plans[existingIndex];
    store.plans[existingIndex] = {
      ...existing,
      ...nextPlan,
      createdAt: existing.createdAt ?? nextPlan.createdAt,
      updatedAt: now,
    };
  } else {
    store.plans.push(nextPlan);
  }

  await writeStore(store);

  return NextResponse.json({ plan: nextPlan });
}
