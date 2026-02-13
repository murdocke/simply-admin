'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import LessonPackRenderer from '../../../components/lesson-pack-renderer';
import type { LessonPack } from '../../../components/lesson-pack-types';
import { useLessonCart } from '../../../components/lesson-cart';
import { useLessonCartScope } from '../../../components/lesson-cart-scope';
import { formatCurrency } from '../../../components/lesson-pricing';
import { VIEW_ROLE_STORAGE_KEY } from '../../../components/auth';

export default function StudentLessonPackPage() {
  const params = useParams<{ id: string }>();
  const [packs, setPacks] = useState<LessonPack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [packNotes, setPackNotes] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const { scope } = useLessonCartScope();
  const { isPurchased, isInCart, toggleItem } = useLessonCart(scope);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const response = await fetch('/api/lesson-packs');
        const data = (await response.json()) as { lessonPacks?: LessonPack[] };
        if (!isMounted) return;
        setPacks(Array.isArray(data.lessonPacks) ? data.lessonPacks : []);
      } catch {
        if (!isMounted) return;
        setPacks([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('sm_user');
      if (!stored) return;
      const parsed = JSON.parse(stored) as { role?: string };
      if (parsed?.role === 'company') {
        const viewRole = window.localStorage.getItem(VIEW_ROLE_STORAGE_KEY);
        setRole(viewRole ?? parsed.role ?? null);
        return;
      }
      setRole(parsed?.role ?? null);
    } catch {
      setRole(null);
    }
  }, []);

  const pack = useMemo(
    () => packs.find(item => item.id === params?.id) ?? null,
    [packs, params?.id],
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-[var(--c-1f1f1d)]">
          Loading Lesson Pack
        </h1>
        <p className="text-sm text-[var(--c-6f6c65)]">One moment...</p>
      </div>
    );
  }

  if (!pack) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-[var(--c-1f1f1d)]">
          Lesson Pack Not Found
        </h1>
        <p className="text-sm text-[var(--c-6f6c65)]">
          We couldn&apos;t find that lesson pack.
        </p>
      </div>
    );
  }

  const cartId = `lesson-pack:${pack.id}`;
  const purchased = isPurchased(cartId);
  const inCart = isInCart(cartId);
  const price = role === 'teacher' ? pack.priceTeacher : pack.priceStudent;
  const priceLabel =
    typeof price === 'number' ? formatCurrency(price) : 'Set price';

  if (!purchased) {
    return (
      <div className="space-y-6">
        <header className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f1f1ef)] p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
            Lesson Pack Locked
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
            {pack.title}
          </h1>
          <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
            Unlock this lesson pack to view the full materials.
          </p>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() =>
              toggleItem({
                id: cartId,
                program: 'Lesson Pack',
                section: pack.title,
                price: typeof price === 'number' ? price : 0,
              })
            }
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
              inCart
                ? 'bg-[#2f8f5b] text-white'
                : 'border border-[var(--c-1f1f1d)] text-[var(--c-1f1f1d)] hover:border-[var(--c-c8102e)] hover:text-[var(--c-c8102e)]'
            }`}
          >
            {inCart ? 'Remove from cart' : 'Unlock this pack'}
          </button>
          <span className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-fcfcfb)] px-3.5 py-1.5 text-base font-semibold uppercase tracking-[0.2em] text-[var(--c-3a3935)]">
            {priceLabel}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
        <section className="min-w-0">
          <LessonPackRenderer lessonPack={pack} />
        </section>
        <aside className="space-y-4">
          <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
              Pack Notes
            </p>
            <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
              Keep personal notes about this pack.
            </p>
            <textarea
              value={packNotes}
              onChange={event => setPackNotes(event.target.value)}
              placeholder="Add your notes..."
              className="mt-4 min-h-[180px] w-full rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3 text-sm text-[var(--c-1f1f1d)]"
            />
          </section>
          <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
              Progress
            </p>
            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={() => setIsComplete(value => !value)}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                  isComplete
                    ? 'border-[#2f8f5b] bg-[#2f8f5b] text-white'
                    : 'border-[var(--c-ecebe7)] text-[var(--c-1f1f1d)] hover:border-[var(--c-c8102e)] hover:text-[var(--c-c8102e)]'
                }`}
              >
                <span>{isComplete ? 'Marked complete' : 'Mark as complete'}</span>
                <span>{isComplete ? '✓' : ''}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsFavorite(value => !value)}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                  isFavorite
                    ? 'border-[var(--c-c8102e)] bg-[var(--c-fff5f6)] text-[var(--c-c8102e)]'
                    : 'border-[var(--c-ecebe7)] text-[var(--c-1f1f1d)] hover:border-[var(--c-c8102e)] hover:text-[var(--c-c8102e)]'
                }`}
              >
                <span>{isFavorite ? 'Saved to favorites' : 'Save to favorites'}</span>
                <span>{isFavorite ? '★' : '☆'}</span>
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
