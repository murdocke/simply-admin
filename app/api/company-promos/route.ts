import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

type PromoPayload = {
  id: string;
  title: string;
  body: string;
  cta?: string;
  trigger: 'dashboard' | 'lesson-library' | 'login' | 'instant';
  createdAt: string;
  audience: 'teacher' | 'student' | 'both';
  status?: 'active' | 'removed';
};

type PromoStore = {
  active?: {
    teacher?: PromoPayload | null;
    student?: PromoPayload | null;
  };
  history?: PromoPayload[];
};

const promosFile = path.join(process.cwd(), 'data', 'company-promos.json');

async function readPromos(): Promise<PromoStore> {
  try {
    const raw = await fs.readFile(promosFile, 'utf-8');
    const parsed = JSON.parse(raw) as PromoStore;
    if ('teacher' in (parsed as Record<string, unknown>)) {
      const legacy = parsed as { teacher?: PromoPayload | null; student?: PromoPayload | null };
      return {
        active: {
          teacher: legacy.teacher ?? null,
          student: legacy.student ?? null,
        },
        history: [],
      };
    }
    return parsed ?? {};
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {};
    }
    throw error;
  }
}

async function writePromos(payload: PromoStore) {
  await fs.writeFile(promosFile, JSON.stringify(payload, null, 2));
}

export async function GET() {
  const data = await readPromos();
  return NextResponse.json({ promos: data });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    audience?: 'teacher' | 'student' | 'both';
    payload?: PromoPayload;
  };
  if (
    !body?.payload?.id ||
    !body?.payload?.title ||
    !body?.payload?.body ||
    !body?.payload?.trigger ||
    !body?.payload?.createdAt
  ) {
    return NextResponse.json(
      { error: 'title, body, trigger, createdAt are required.' },
      { status: 400 },
    );
  }
  const data = await readPromos();
  const next: PromoStore = {
    active: { ...(data.active ?? {}) },
    history: [...(data.history ?? [])],
  };
  const payload: PromoPayload = {
    ...body.payload,
    audience: body.audience ?? body.payload.audience ?? 'both',
    status: 'active',
  };
  if (body.audience === 'teacher' || body.audience === 'both') {
    next.active = { ...(next.active ?? {}), teacher: payload };
  }
  if (body.audience === 'student' || body.audience === 'both') {
    next.active = { ...(next.active ?? {}), student: payload };
  }
  next.history = [{ ...payload }, ...(next.history ?? [])];
  await writePromos(next);
  return NextResponse.json({ promos: next });
}

export async function DELETE(request: Request) {
  const data = await readPromos();
  const { searchParams } = new URL(request.url);
  const audience = searchParams.get('audience');
  const id = searchParams.get('id');
  const next: PromoStore = {
    active: { ...(data.active ?? {}) },
    history: [...(data.history ?? [])],
  };
  if (id) {
    const historyItem = (next.history ?? []).find(item => item.id === id) ?? null;
    next.history = (next.history ?? []).map(item =>
      item.id === id ? { ...item, status: 'removed' } : item,
    );
    if (next.active?.teacher?.id === id) {
      next.active.teacher = null;
    }
    if (next.active?.student?.id === id) {
      next.active.student = null;
    }
    if (historyItem && historyItem.audience) {
      if (historyItem.audience === 'teacher' || historyItem.audience === 'both') {
        next.active = { ...(next.active ?? {}), teacher: null };
      }
      if (historyItem.audience === 'student' || historyItem.audience === 'both') {
        next.active = { ...(next.active ?? {}), student: null };
      }
    }
  } else if (audience) {
    if (audience === 'teacher') next.active = { ...(next.active ?? {}), teacher: null };
    if (audience === 'student') next.active = { ...(next.active ?? {}), student: null };
    if (audience === 'both') {
      next.active = { ...(next.active ?? {}), teacher: null, student: null };
    }
  } else {
    return NextResponse.json({ error: 'audience or id required.' }, { status: 400 });
  }
  await writePromos(next);
  return NextResponse.json({ promos: next });
}
