import { getDb } from '@/lib/db';
import LessonLibraryView from '../../components/lesson-library-view';
import LessonPackPromoCard from '../../components/lesson-pack-promo-card';
import type { LessonPack } from '../../components/lesson-pack-types';
import LessonCartPurchaseButton from '../../components/lesson-cart-actions';
import PromoTrigger from '../../components/promo-trigger';

const loadLessonPacks = async (): Promise<LessonPack[]> => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM lesson_packs').all() as Array<
    Record<string, string | number | null>
  >;
  return rows.map(row => ({
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
};

export default async function StudentLessonLibraryPage() {
  const packs = await loadLessonPacks();
  const featured = packs.slice(0, 3);

  return (
    <div className="space-y-6">
      <PromoTrigger audience="student" trigger="lesson-library" />
      <div className="fixed right-6 top-6 z-50">
        <LessonCartPurchaseButton />
      </div>

      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
          Students
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--c-1f1f1d)]">
          Lesson Library
        </h1>
        <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
          Explore the curriculum and open a section to start learning.
        </p>
      </header>

      {featured.length ? (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {featured.map(pack => (
            <LessonPackPromoCard
              key={pack.id}
              pack={pack}
              href={`/students/lesson-packs/${pack.id}`}
            />
          ))}
        </section>
      ) : null}

      <LessonLibraryView basePath="/students/lesson-library" />
    </div>
  );
}
