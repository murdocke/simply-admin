import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

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
    const db = getDb();
    db.prepare(
      `
        INSERT INTO lesson_sections (program, sections_json)
        VALUES (?, ?)
        ON CONFLICT(program) DO UPDATE SET sections_json = excluded.sections_json
      `,
    ).run(body.programName, JSON.stringify(body.sections));

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Save failed.' },
      { status: 500 },
    );
  }
}
