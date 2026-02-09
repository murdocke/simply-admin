import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { slugifyLessonValue } from '@/app/(admin)/components/lesson-utils';

type PriceOverride = {
  student?: number;
  teacher?: number;
};

type PricingStore = {
  overrides: Record<string, PriceOverride>;
};

const pricingFile = path.join(process.cwd(), 'data', 'pricing-overrides.json');

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

async function readStore(): Promise<PricingStore> {
  try {
    const raw = await fs.readFile(pricingFile, 'utf-8');
    const parsed = JSON.parse(raw) as PricingStore;
    return parsed?.overrides ? parsed : { overrides: {} };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { overrides: {} };
    }
    throw error;
  }
}

async function writeStore(data: PricingStore) {
  await fs.mkdir(path.dirname(pricingFile), { recursive: true });
  await fs.writeFile(pricingFile, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET() {
  const store = await readStore();
  return NextResponse.json({ overrides: store.overrides ?? {} });
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

  const store = await readStore();
  store.overrides = store.overrides ?? {};
  store.overrides[key] = {
    student: Number.isFinite(body.student) ? body.student : undefined,
    teacher: Number.isFinite(body.teacher) ? body.teacher : undefined,
  };
  await writeStore(store);

  return NextResponse.json({ ok: true });
}
