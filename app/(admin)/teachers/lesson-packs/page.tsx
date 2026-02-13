'use client';

import { useEffect, useMemo, useState } from 'react';
import LessonPackRenderer from '../../components/lesson-pack-renderer';
import type { LessonPack } from '../../components/lesson-pack-types';
import PromoTrigger from '../../components/promo-trigger';

export default function TeacherLessonPacksPage() {
  const [packs, setPacks] = useState<LessonPack[]>([]);
  const [activePackId, setActivePackId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPacks = async () => {
    try {
      setError(null);
      const response = await fetch('/api/lesson-packs');
      if (!response.ok) throw new Error('Failed to load lesson packs');
      const data = (await response.json()) as { lessonPacks?: LessonPack[] };
      const loaded = Array.isArray(data.lessonPacks) ? data.lessonPacks : [];
      setPacks(loaded);
      setActivePackId(loaded[0]?.id ?? null);
    } catch (fetchError) {
      setError('Unable to load lesson packs.');
      // eslint-disable-next-line no-console
      console.error(fetchError);
    }
  };

  useEffect(() => {
    void fetchPacks();
  }, []);

  const activePack = useMemo(
    () => packs.find(pack => pack.id === activePackId) ?? null,
    [packs, activePackId],
  );

  return (
    <div className="space-y-6">
      <PromoTrigger audience="teacher" trigger="lesson-library" />
      <header className="flex flex-col gap-4 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--c-1f1f1d)]">
            Teacher Lesson Packs
          </h1>
          <p className="mt-1 text-sm text-[var(--c-6f6c65)]">
            Preview lesson packs as they are built. Hit refresh to see updates.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={activePack?.id ?? ''}
            onChange={event => setActivePackId(event.target.value)}
            className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
          >
            {packs.map(pack => (
              <option key={pack.id} value={pack.id}>
                {pack.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void fetchPacks()}
            className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
          >
            Refresh
          </button>
        </div>
      </header>

      {error ? (
        <div className="rounded-2xl border border-[var(--c-c8102e)] bg-[var(--c-fff5f6)] px-4 py-3 text-sm text-[var(--c-1f1f1d)]">
          {error}
        </div>
      ) : null}

      {activePack ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-4 text-sm text-[var(--c-1f1f1d)]">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Teacher Price
              </p>
              <p className="mt-2 text-lg font-semibold">
                {activePack.priceTeacher ?? 'Not set'}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-4 text-sm text-[var(--c-1f1f1d)]">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Student Price
              </p>
              <p className="mt-2 text-lg font-semibold">
                {activePack.priceStudent ?? 'Not set'}
              </p>
            </div>
          </div>
          <LessonPackRenderer lessonPack={activePack} />
        </div>
      ) : (
        <p className="text-sm text-[var(--c-6f6c65)]">
          No lesson packs yet.
        </p>
      )}
    </div>
  );
}
