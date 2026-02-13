import fs from 'fs/promises';
import path from 'path';
import LessonLibraryView from '../../components/lesson-library-view';
import LessonPackPromoCard from '../../components/lesson-pack-promo-card';
import type { LessonPack } from '../../components/lesson-pack-types';
import LessonCartPurchaseButton from '../../components/lesson-cart-actions';
import PromoTrigger from '../../components/promo-trigger';

const loadLessonPacks = async (): Promise<LessonPack[]> => {
  try {
    const filePath = path.join(process.cwd(), 'data', 'lesson-packs.json');
    const raw = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as { lessonPacks?: LessonPack[] };
    return Array.isArray(parsed.lessonPacks) ? parsed.lessonPacks : [];
  } catch {
    return [];
  }
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
