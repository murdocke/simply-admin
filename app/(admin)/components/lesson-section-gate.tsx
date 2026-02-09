'use client';

import { ReactNode, useEffect, useState } from 'react';
import { createLessonCartItem, useLessonCart } from './lesson-cart';
import {
  formatCurrency,
  getSectionPriceForRole,
  isTeacherAutoUnlocked,
} from './lesson-pricing';
import { makeLessonId, slugifyLessonValue } from './lesson-utils';
import { VIEW_ROLE_STORAGE_KEY } from './auth';
import { useLessonCartScope } from './lesson-cart-scope';

type LessonSectionGateProps = {
  programName: string;
  sectionName: string;
  children: ReactNode;
};

export default function LessonSectionGate({
  programName,
  sectionName,
  children,
}: LessonSectionGateProps) {
  const { scope } = useLessonCartScope();
  const { isPurchased, isInCart, toggleItem, hasDevelopmentUnlock } =
    useLessonCart(scope);
  const [role, setRole] = useState<string | null>(null);
  const id = makeLessonId(programName, sectionName);
  const isExtensionsProgram =
    slugifyLessonValue(programName) ===
    slugifyLessonValue('Extensions Program');
  const autoUnlocked =
    role === 'teacher' && isTeacherAutoUnlocked(programName, sectionName);
  const purchased =
    isPurchased(id) || autoUnlocked || (isExtensionsProgram && hasDevelopmentUnlock);
  const inCart = isInCart(id);
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

  if (purchased) {
    return <>{children}</>;
  }

  return (
    <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
            Locked Section
          </p>
          <h2 className="text-2xl font-semibold text-[var(--c-1f1f1d)] opacity-70">
            {sectionName}
          </h2>
          <p className="text-sm text-[var(--c-6f6c65)] opacity-70">
            Purchase 4 Development sections to unlock Extensions materials.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3">
          <span className="text-sm font-semibold text-[var(--c-6f6c65)]">
            {formatCurrency(price)}
          </span>
          <button
            type="button"
            onClick={() =>
              toggleItem(createLessonCartItem(programName, sectionName, role))
            }
            className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
              inCart
                ? 'border-[var(--c-c8102e)] bg-[var(--c-c8102e)] text-white'
                : 'border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] text-[var(--c-6f6c65)] hover:border-[color:var(--c-c8102e)]/50 hover:text-[var(--c-c8102e)]'
            }`}
          >
            {inCart ? 'Remove from cart' : 'Unlock this section'}
          </button>
        </div>
      </div>
    </section>
  );
}
