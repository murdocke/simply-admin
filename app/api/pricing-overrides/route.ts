import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { slugifyLessonValue } from '@/app/(admin)/components/lesson-utils';

type PriceOverride = {
  student?: number;
  teacher?: number;
};

export const runtime = 'nodejs';

const normalizeSectionName = (value?: string | null) => {
  if (!value) return '';
  return value
    .replace(/\s*[-–—]\s*License$/i, '')
    .replace(/\s+License$/i, '')
    .replace(/^TWS:\s*/i, '')
    .replace(/\s*&\s*the\s+/i, ' & ')
    .trim();
};

const makeOverrideKey = (program?: string, section?: string) => {
  const programSlug = program ? slugifyLessonValue(program) : '';
  const sectionSlug = section
    ? slugifyLessonValue(normalizeSectionName(section))
    : '';
  return `${programSlug}::${sectionSlug}`;
};

export async function GET() {
  const db = getDb();
  const rows = db
    .prepare('SELECT scope, student_price, teacher_price FROM pricing_overrides')
    .all() as Array<{ scope: string; student_price: number | null; teacher_price: number | null }>;
  const overrides: Record<string, PriceOverride> = {};
  rows.forEach(row => {
    overrides[row.scope] = {
      student: row.student_price ?? undefined,
      teacher: row.teacher_price ?? undefined,
    };
  });
  return NextResponse.json({ overrides });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    program?: string;
    section?: string;
    student?: number;
    teacher?: number;
  };

  if (!body.program || !body.section) {
    return NextResponse.json(
      { error: 'program and section are required.' },
      { status: 400 },
    );
  }

  const key = makeOverrideKey(body.program, body.section);
  if (!key) {
    return NextResponse.json(
      { error: 'Unable to compute pricing key.' },
      { status: 400 },
    );
  }

  const db = getDb();
  db.prepare(
    `
      INSERT INTO pricing_overrides (scope, student_price, teacher_price)
      VALUES (?, ?, ?)
      ON CONFLICT(scope) DO UPDATE SET
        student_price = excluded.student_price,
        teacher_price = excluded.teacher_price
    `,
  ).run(
    key,
    Number.isFinite(body.student) ? body.student : null,
    Number.isFinite(body.teacher) ? body.teacher : null,
  );

  return NextResponse.json({ ok: true });
}
