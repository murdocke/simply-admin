import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_PATH = path.join(
  process.cwd(),
  'app',
  '(admin)',
  'teachers',
  'students',
  'lesson-data',
  'lesson-sections.json',
);

type Body = {
  programName?: string;
  sections?: string[] | Record<string, string[]>;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    if (!body.programName || !body.sections) {
      return NextResponse.json(
        { error: 'Missing programName or sections.' },
        { status: 400 },
      );
    }

    const file = await fs.readFile(DATA_PATH, 'utf-8');
    const data = JSON.parse(file) as Record<string, unknown>;
    data[body.programName] = body.sections;

    await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2) + '\n', 'utf-8');

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Save failed.' },
      { status: 500 },
    );
  }
}
