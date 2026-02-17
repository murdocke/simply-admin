import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import type { LessonPack } from '@/app/(admin)/components/lesson-pack-types';

export const runtime = 'nodejs';

export async function GET() {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM lesson_packs')
    .all() as Array<Record<string, string | number | null>>;
  const lessonPacks = rows.map(row => ({
    id: String(row.id ?? ''),
    title: String(row.title ?? ''),
    subtitle: String(row.subtitle ?? ''),
    description: String(row.description ?? ''),
    coverImage: String(row.cover_image ?? ''),
    tags: row.tags_json ? (JSON.parse(String(row.tags_json)) as string[]) : [],
    priceTeacher:
      typeof row.price_teacher === 'number'
        ? row.price_teacher
        : row.price_teacher
          ? Number(row.price_teacher)
          : 0,
    priceStudent:
      typeof row.price_student === 'number'
        ? row.price_student
        : row.price_student
          ? Number(row.price_student)
          : 0,
    subjectCount:
      typeof row.subject_count === 'number'
        ? row.subject_count
        : row.subject_count
          ? Number(row.subject_count)
          : 0,
    status: String(row.status ?? ''),
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
    subjects: row.subjects_json
      ? (JSON.parse(String(row.subjects_json)) as LessonPack['subjects'])
      : [],
  }));
  return NextResponse.json({ lessonPacks });
}

export async function PUT(request: Request) {
  const body = (await request.json()) as { lessonPacks?: LessonPack[] };
  const lessonPacks = Array.isArray(body.lessonPacks) ? body.lessonPacks : [];
  const db = getDb();
  const insert = db.prepare(`
    INSERT INTO lesson_packs (
      id,
      title,
      subtitle,
      description,
      cover_image,
      tags_json,
      price_teacher,
      price_student,
      subject_count,
      status,
      created_at,
      updated_at,
      subjects_json
    ) VALUES (
      @id,
      @title,
      @subtitle,
      @description,
      @coverImage,
      @tagsJson,
      @priceTeacher,
      @priceStudent,
      @subjectCount,
      @status,
      @createdAt,
      @updatedAt,
      @subjectsJson
    )
  `);
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM lesson_packs').run();
    for (const pack of lessonPacks) {
      insert.run({
        id: pack.id,
        title: pack.title ?? '',
        subtitle: pack.subtitle ?? '',
        description: pack.description ?? '',
        coverImage: pack.coverImage ?? '',
        tagsJson: JSON.stringify(pack.tags ?? []),
        priceTeacher: pack.priceTeacher ?? null,
        priceStudent: pack.priceStudent ?? null,
        subjectCount: pack.subjectCount ?? null,
        status: pack.status ?? '',
        createdAt: pack.createdAt ?? '',
        updatedAt: pack.updatedAt ?? '',
        subjectsJson: JSON.stringify(pack.subjects ?? []),
      });
    }
  });
  tx();
  return NextResponse.json({ lessonPacks });
}
