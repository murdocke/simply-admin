import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

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

export const runtime = 'nodejs';

type PromoStore = {
  active?: {
    teacher?: PromoPayload | null;
    student?: PromoPayload | null;
  };
  history?: PromoPayload[];
};

export async function GET() {
  const db = getDb();
  const historyRows = db
    .prepare(
      `
        SELECT id, title, body, cta, trigger, created_at, audience, status
        FROM company_promos
        ORDER BY created_at DESC
      `,
    )
    .all() as Array<Record<string, string | null>>;
  const history = historyRows.map(row => ({
    id: row.id ?? '',
    title: row.title ?? '',
    body: row.body ?? '',
    cta: row.cta ?? undefined,
    trigger: (row.trigger ?? 'dashboard') as PromoPayload['trigger'],
    createdAt: row.created_at ?? '',
    audience: (row.audience ?? 'both') as PromoPayload['audience'],
    status: (row.status ?? 'active') as PromoPayload['status'],
  }));

  const activeRows = db
    .prepare(
      `
        SELECT a.audience, p.id, p.title, p.body, p.cta, p.trigger, p.created_at, p.audience as promo_audience, p.status
        FROM company_promos_active a
        JOIN company_promos p ON p.id = a.promo_id
      `,
    )
    .all() as Array<Record<string, string | null>>;
  const active: PromoStore['active'] = { teacher: null, student: null };
  activeRows.forEach(row => {
    const payload: PromoPayload = {
      id: row.id ?? '',
      title: row.title ?? '',
      body: row.body ?? '',
      cta: row.cta ?? undefined,
      trigger: (row.trigger ?? 'dashboard') as PromoPayload['trigger'],
      createdAt: row.created_at ?? '',
      audience: (row.promo_audience ?? 'both') as PromoPayload['audience'],
      status: (row.status ?? 'active') as PromoPayload['status'],
    };
    if (row.audience === 'teacher') active.teacher = payload;
    if (row.audience === 'student') active.student = payload;
  });

  return NextResponse.json({ promos: { active, history } });
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
  const db = getDb();
  const payload: PromoPayload = {
    ...body.payload,
    audience: body.audience ?? body.payload.audience ?? 'both',
    status: 'active',
  };
  db.prepare(
    `
      INSERT INTO company_promos (
        id,
        title,
        body,
        cta,
        trigger,
        created_at,
        audience,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        body = excluded.body,
        cta = excluded.cta,
        trigger = excluded.trigger,
        created_at = excluded.created_at,
        audience = excluded.audience,
        status = excluded.status
    `,
  ).run(
    payload.id,
    payload.title,
    payload.body,
    payload.cta ?? '',
    payload.trigger,
    payload.createdAt,
    payload.audience,
    payload.status ?? 'active',
  );

  const updateActive = (audience: 'teacher' | 'student') => {
    db.prepare(
      `
        INSERT INTO company_promos_active (audience, promo_id, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(audience) DO UPDATE SET
          promo_id = excluded.promo_id,
          updated_at = excluded.updated_at
      `,
    ).run(audience, payload.id, payload.createdAt);
  };
  if (body.audience === 'teacher' || body.audience === 'both') {
    updateActive('teacher');
  }
  if (body.audience === 'student' || body.audience === 'both') {
    updateActive('student');
  }

  const historyRows = db
    .prepare(
      `
        SELECT id, title, body, cta, trigger, created_at, audience, status
        FROM company_promos
        ORDER BY created_at DESC
      `,
    )
    .all() as Array<Record<string, string | null>>;
  const history = historyRows.map(row => ({
    id: row.id ?? '',
    title: row.title ?? '',
    body: row.body ?? '',
    cta: row.cta ?? undefined,
    trigger: (row.trigger ?? 'dashboard') as PromoPayload['trigger'],
    createdAt: row.created_at ?? '',
    audience: (row.audience ?? 'both') as PromoPayload['audience'],
    status: (row.status ?? 'active') as PromoPayload['status'],
  }));

  const activeRows = db
    .prepare(
      `
        SELECT a.audience, p.id, p.title, p.body, p.cta, p.trigger, p.created_at, p.audience as promo_audience, p.status
        FROM company_promos_active a
        JOIN company_promos p ON p.id = a.promo_id
      `,
    )
    .all() as Array<Record<string, string | null>>;
  const active: PromoStore['active'] = { teacher: null, student: null };
  activeRows.forEach(row => {
    const nextPayload: PromoPayload = {
      id: row.id ?? '',
      title: row.title ?? '',
      body: row.body ?? '',
      cta: row.cta ?? undefined,
      trigger: (row.trigger ?? 'dashboard') as PromoPayload['trigger'],
      createdAt: row.created_at ?? '',
      audience: (row.promo_audience ?? 'both') as PromoPayload['audience'],
      status: (row.status ?? 'active') as PromoPayload['status'],
    };
    if (row.audience === 'teacher') active.teacher = nextPayload;
    if (row.audience === 'student') active.student = nextPayload;
  });

  return NextResponse.json({ promos: { active, history } });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const audience = searchParams.get('audience');
  const id = searchParams.get('id');
  const db = getDb();
  if (id) {
    const historyItem = db
      .prepare(
        `
          SELECT id, audience
          FROM company_promos
          WHERE id = ?
        `,
      )
      .get(id) as { id: string; audience: PromoPayload['audience'] } | undefined;
    db.prepare(
      `
        UPDATE company_promos
        SET status = 'removed'
        WHERE id = ?
      `,
    ).run(id);
    db.prepare(
      `
        DELETE FROM company_promos_active
        WHERE promo_id = ?
      `,
    ).run(id);
    if (historyItem?.audience === 'teacher' || historyItem?.audience === 'both') {
      db.prepare(`DELETE FROM company_promos_active WHERE audience = 'teacher' AND promo_id = ?`).run(id);
    }
    if (historyItem?.audience === 'student' || historyItem?.audience === 'both') {
      db.prepare(`DELETE FROM company_promos_active WHERE audience = 'student' AND promo_id = ?`).run(id);
    }
  } else if (audience) {
    if (audience === 'teacher') {
      db.prepare(`DELETE FROM company_promos_active WHERE audience = 'teacher'`).run();
    }
    if (audience === 'student') {
      db.prepare(`DELETE FROM company_promos_active WHERE audience = 'student'`).run();
    }
    if (audience === 'both') {
      db.prepare(`DELETE FROM company_promos_active WHERE audience IN ('teacher', 'student')`).run();
    }
  } else {
    return NextResponse.json({ error: 'audience or id required.' }, { status: 400 });
  }

  const historyRows = db
    .prepare(
      `
        SELECT id, title, body, cta, trigger, created_at, audience, status
        FROM company_promos
        ORDER BY created_at DESC
      `,
    )
    .all() as Array<Record<string, string | null>>;
  const history = historyRows.map(row => ({
    id: row.id ?? '',
    title: row.title ?? '',
    body: row.body ?? '',
    cta: row.cta ?? undefined,
    trigger: (row.trigger ?? 'dashboard') as PromoPayload['trigger'],
    createdAt: row.created_at ?? '',
    audience: (row.audience ?? 'both') as PromoPayload['audience'],
    status: (row.status ?? 'active') as PromoPayload['status'],
  }));
  const activeRows = db
    .prepare(
      `
        SELECT a.audience, p.id, p.title, p.body, p.cta, p.trigger, p.created_at, p.audience as promo_audience, p.status
        FROM company_promos_active a
        JOIN company_promos p ON p.id = a.promo_id
      `,
    )
    .all() as Array<Record<string, string | null>>;
  const active: PromoStore['active'] = { teacher: null, student: null };
  activeRows.forEach(row => {
    const nextPayload: PromoPayload = {
      id: row.id ?? '',
      title: row.title ?? '',
      body: row.body ?? '',
      cta: row.cta ?? undefined,
      trigger: (row.trigger ?? 'dashboard') as PromoPayload['trigger'],
      createdAt: row.created_at ?? '',
      audience: (row.promo_audience ?? 'both') as PromoPayload['audience'],
      status: (row.status ?? 'active') as PromoPayload['status'],
    };
    if (row.audience === 'teacher') active.teacher = nextPayload;
    if (row.audience === 'student') active.student = nextPayload;
  });

  return NextResponse.json({ promos: { active, history } });
}
