import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

type AlertPayload = {
  id: string;
  title: string;
  body: string;
  color: string;
  persistence: string;
  createdAt: string;
  audience: 'teacher' | 'student' | 'both';
  status?: 'active' | 'removed';
};

type AlertStore = {
  active?: {
    teacher?: AlertPayload | null;
    student?: AlertPayload | null;
  };
  history?: AlertPayload[];
};

const alertsFile = path.join(process.cwd(), 'data', 'company-alerts.json');

async function readAlerts(): Promise<AlertStore> {
  try {
    const raw = await fs.readFile(alertsFile, 'utf-8');
    const parsed = JSON.parse(raw) as AlertStore;
    if ('teacher' in (parsed as Record<string, unknown>)) {
      const legacy = parsed as { teacher?: AlertPayload | null; student?: AlertPayload | null };
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

async function writeAlerts(payload: AlertStore) {
  await fs.writeFile(alertsFile, JSON.stringify(payload, null, 2));
}

export async function GET() {
  const data = await readAlerts();
  return NextResponse.json({ alerts: data });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    audience?: 'teacher' | 'student' | 'both';
    payload?: AlertPayload;
  };
  if (
    !body?.payload?.id ||
    !body?.payload?.title ||
    !body?.payload?.body ||
    !body?.payload?.color ||
    !body?.payload?.persistence ||
    !body?.payload?.createdAt
  ) {
    return NextResponse.json(
      { error: 'title, body, color, persistence, createdAt are required.' },
      { status: 400 },
    );
  }
  const data = await readAlerts();
  const next: AlertStore = {
    active: { ...(data.active ?? {}) },
    history: [...(data.history ?? [])],
  };
  const payload: AlertPayload = {
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
  await writeAlerts(next);
  return NextResponse.json({ alerts: next });
}

export async function DELETE(request: Request) {
  const data = await readAlerts();
  const { searchParams } = new URL(request.url);
  const audience = searchParams.get('audience');
  const id = searchParams.get('id');
  const next: AlertStore = {
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
  await writeAlerts(next);
  return NextResponse.json({ alerts: next });
}
