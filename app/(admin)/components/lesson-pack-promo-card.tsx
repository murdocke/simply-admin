'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { LessonPack } from './lesson-pack-types';
import { useLessonCart } from './lesson-cart';
import { useLessonCartScope } from './lesson-cart-scope';
import { formatCurrency } from './lesson-pricing';
import { VIEW_ROLE_STORAGE_KEY } from './auth';

const getPackCartId = (id: string) => `lesson-pack:${id}`;

type LessonPackPromoCardProps = {
  pack: LessonPack;
  href: string;
  pillLabel?: string;
  eyebrowLabel?: string;
  ctaLabel?: string;
};

export default function LessonPackPromoCard({
  pack,
  href,
  pillLabel = 'New Pack',
  eyebrowLabel = 'Lesson Added',
  ctaLabel = 'View Lesson Pack Details',
}: LessonPackPromoCardProps) {
  const { scope } = useLessonCartScope();
  const { isPurchased, isInCart, toggleItem } = useLessonCart(scope);
  const [role, setRole] = useState<string | null>(null);

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

  const price = useMemo(() => {
    if (role === 'teacher') return pack.priceTeacher;
    return pack.priceStudent;
  }, [pack.priceStudent, pack.priceTeacher, role]);

  const priceLabel =
    typeof price === 'number' ? formatCurrency(price) : 'Set price';

  const cartId = getPackCartId(pack.id);
  const purchased = isPurchased(cartId);
  const inCart = isInCart(cartId);

  const handleToggle = () => {
    toggleItem({
      id: cartId,
      program: 'Lesson Pack',
      section: pack.title,
      price: typeof price === 'number' ? price : 0,
    });
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f1f1ef)] shadow-[0_18px_40px_-28px_rgba(0,0,0,0.45)] ring-1 ring-[var(--c-ecebe7)]">
      <div className="relative h-36 overflow-hidden">
        <img
          src={pack.coverImage || '/reference/JAZZ-COLORS.png'}
          alt={pack.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute bottom-3 left-4 rounded-full border border-white/50 bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white">
          {pillLabel}
        </div>
      </div>
      <div className="p-5">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
          {eyebrowLabel}
        </p>
        <h3 className="mt-2 text-xl font-semibold text-[var(--c-1f1f1d)]">
          {pack.title}
        </h3>
        <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
          {pack.description || pack.subtitle || ''}
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          {purchased ? (
            <Link
              href={href}
              className="inline-flex items-center justify-center rounded-full border border-[var(--c-1f1f1d)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--c-1f1f1d)] transition hover:border-[var(--c-c8102e)] hover:text-[var(--c-c8102e)]"
            >
              {ctaLabel}
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleToggle}
              className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                inCart
                  ? 'bg-[#2f8f5b] text-white'
                  : 'border border-[var(--c-1f1f1d)] text-[var(--c-1f1f1d)] hover:border-[var(--c-c8102e)] hover:text-[var(--c-c8102e)]'
              }`}
            >
              {inCart ? 'Remove from cart' : 'Unlock this pack'}
            </button>
          )}
          {purchased ? null : (
            <span className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-fcfcfb)] px-3.5 py-1.5 text-base font-semibold uppercase tracking-[0.2em] text-[var(--c-3a3935)]">
              {priceLabel}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
