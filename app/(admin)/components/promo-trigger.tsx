'use client';

import { useEffect, useState } from 'react';

type PromoPayload = {
  title: string;
  body: string;
  cta?: string;
  trigger?: string;
  createdAt?: string;
};

type PromoTriggerProps = {
  audience: 'teacher' | 'student';
  trigger: 'lesson-library';
};

export default function PromoTrigger({ audience, trigger }: PromoTriggerProps) {
  const [promo, setPromo] = useState<PromoPayload | null>(null);

  useEffect(() => {
    let isActive = true;
    const loadPromo = async () => {
      try {
        const response = await fetch('/api/company-promos', { cache: 'no-store' });
        if (!response.ok) return;
        const data = (await response.json()) as {
          promos?: { active?: Record<string, PromoPayload | null> };
        };
        const payload = data.promos?.active?.[audience] ?? null;
        if (!payload && promo) {
          setPromo(null);
          return;
        }
        if (promo && payload && promo.id && payload.id && promo.id !== payload.id) {
          setPromo(null);
          return;
        }
        if (!payload || !isActive) return;
        const payloadTrigger = payload.trigger ?? 'dashboard';
        if (payloadTrigger !== 'instant' && payloadTrigger !== trigger) return;
        setPromo(payload);
        await fetch(`/api/company-promos?audience=${audience}`, { method: 'DELETE' });
      } catch {
        // ignore
      }
    };
    void loadPromo();
    const interval = window.setInterval(loadPromo, 2500);
    return () => {
      isActive = false;
      window.clearInterval(interval);
    };
  }, [audience, trigger]);

  if (!promo) return null;

  return (
    <div className="fixed inset-0 z-50 flex h-screen w-screen items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setPromo(null)}
      />
      <div className="relative w-full max-w-lg rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-xl">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
          Studio Update
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
          {promo.title}
        </h2>
        <p className="mt-3 text-sm text-[var(--c-6f6c65)]">
          {promo.body}
        </p>
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setPromo(null)}
            className="w-full rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)] transition hover:brightness-110"
          >
            {promo.cta ?? 'GOT IT'}
          </button>
        </div>
      </div>
    </div>
  );
}
