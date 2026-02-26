'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createLessonCartItem, useLessonCart } from './lesson-cart';
import {
  formatCurrency,
  getSectionPriceForRole,
  isTeacherAutoUnlocked,
} from './lesson-pricing';
import { makeLessonId, slugifyLessonValue } from './lesson-utils';
import { VIEW_ROLE_STORAGE_KEY } from './auth';
import { useLessonCartScope } from './lesson-cart-scope';

type LockedSectionCardProps = {
  programName: string;
  sectionName: string;
  href: string;
  className?: string;
  hideWhenLocked?: boolean;
};

export default function LockedSectionCard({
  programName,
  sectionName,
  href,
  className = '',
  hideWhenLocked = false,
}: LockedSectionCardProps) {
  const { scope } = useLessonCartScope();
  const { isPurchased, isInCart, toggleItem, hasDevelopmentUnlock } =
    useLessonCart(scope);
  const [role, setRole] = useState<string | null>(null);
  const price = getSectionPriceForRole(role, programName, sectionName);

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
  const id = makeLessonId(programName, sectionName);
  const isExtensionsProgram =
    slugifyLessonValue(programName) ===
    slugifyLessonValue('Extensions Program');
  const autoUnlocked =
    role === 'teacher' && isTeacherAutoUnlocked(programName, sectionName);
  const purchased =
    isPurchased(id) || autoUnlocked || (isExtensionsProgram && hasDevelopmentUnlock);
  const inCart = isInCart(id);

  if (purchased) {
    return (
      <Link
        href={href}
        className={`block w-full rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4 text-left transition hover:border-white hover:bg-[var(--c-fcfcfb)] ${className}`}
      >
        <p className="text-sm font-medium text-[var(--c-1f1f1d)]">
          {sectionName}
        </p>
        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[var(--c-1f1f1d)]">
          View materials
        </p>
      </Link>
    );
  }

  if (hideWhenLocked) {
    return null;
  }

  if (isExtensionsProgram && !purchased) {
    return (
      <div
        className={`relative w-full overflow-hidden rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f1f1ef)] p-2.5 text-left text-[var(--c-9a9892)] shadow-[0_6px_16px_rgba(10,12,16,0.08)] ${className}`}
      >
        <div className="relative space-y-2">
          <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
            {sectionName}
          </p>
          <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
            Locked section
          </p>
        </div>
        <div className="relative mt-3 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              const target = document.getElementById('development-program');
              target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="z-10 inline-flex w-full min-h-9 items-center justify-center gap-2 rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)] sm:w-auto"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="4" y="11" width="16" height="9" rx="2" />
              <path d="M8 11V8a4 4 0 1 1 8 0v3" />
            </svg>
            Unlock this section with any Development purchase
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f1f1ef)] p-2.5 text-left text-[var(--c-9a9892)] shadow-[0_6px_16px_rgba(10,12,16,0.08)] ${className}`}
    >
      <div className="grid gap-2 sm:grid-cols-2 sm:items-center">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-[var(--c-c8102e)]">
            {sectionName}
          </p>
          <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
            Locked section
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-lg font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
            {formatCurrency(price)}
          </span>
          <button
            type="button"
            onClick={() =>
              toggleItem(createLessonCartItem(programName, sectionName, role))
            }
            className={`z-10 inline-flex w-full min-h-8 items-center justify-center gap-2 rounded-full px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] transition sm:w-auto ${
              inCart
                ? 'bg-[#2f8f5b] text-white'
                : 'border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] text-[var(--c-6f6c65)] hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]'
            }`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="4" y="11" width="16" height="9" rx="2" />
              <path d="M8 11V8a4 4 0 1 1 8 0v3" />
            </svg>
            {inCart ? 'Remove from cart' : 'Unlock this section'}
          </button>
        </div>
      </div>
    </div>
  );
}
