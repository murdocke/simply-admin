import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { LessonPack } from '@/app/(admin)/components/lesson-pack-types';

type LessonPacksFile = {
  lessonPacks: LessonPack[];
};

const dataFile = path.join(process.cwd(), 'data', 'lesson-packs.json');

async function readLessonPacksFile(): Promise<LessonPacksFile> {
  try {
    const raw = await fs.readFile(dataFile, 'utf-8');
    const parsed = JSON.parse(raw) as LessonPacksFile;
    if (!parsed.lessonPacks) {
      return { lessonPacks: [] };
    }
    return parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { lessonPacks: [] };
    }
    throw error;
  }
}

async function writeLessonPacksFile(data: LessonPacksFile) {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  await fs.writeFile(dataFile, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET() {
  const data = await readLessonPacksFile();
  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const body = (await request.json()) as { lessonPacks?: LessonPack[] };
  const lessonPacks = Array.isArray(body.lessonPacks) ? body.lessonPacks : [];
  await writeLessonPacksFile({ lessonPacks });
  return NextResponse.json({ lessonPacks });
}
