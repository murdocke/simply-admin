'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const studioLinks = [
  { label: 'Overview', href: '/studios/dashboard#overview' },
  { label: 'Teachers', href: '/studios/dashboard#teachers' },
  { label: 'Schedule', href: '/studios/dashboard#schedule' },
  { label: 'Parents', href: '/studios/dashboard#parents' },
  { label: 'Students', href: '/studios/dashboard#students' },
  { label: 'Billing', href: '/studios/dashboard#billing' },
  { label: 'Settings', href: '/studios/dashboard#settings' },
];

type StudioShellProps = {
  children: ReactNode;
};

export default function StudioShell({ children }: StudioShellProps) {
  const pathname = usePathname();
  const isStudio = pathname?.startsWith('/studios');

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-e7eddc)] p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
              Studio
            </p>
            <p className="mt-2 text-lg font-semibold text-[var(--c-1f1f1d)]">
              Command Center
            </p>
            <p className="mt-1 text-xs text-[var(--c-6f6c65)]">
              Overview and team signals.
            </p>
          </div>
          <span className="sr-only">Beta</span>
        </div>
        <div className="mt-5 space-y-2">
          {studioLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition ${
                isStudio
                  ? 'border-[var(--c-e5e3dd)] bg-[var(--c-fcfcfb)] text-[var(--c-3a3935)] hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]'
                  : 'border-transparent text-[var(--c-6f6c65)]'
              }`}
            >
              <span className="text-[13px] uppercase tracking-[0.2em]">
                {link.label}
              </span>
              <span className="text-xs text-[var(--c-9a9892)]">→</span>
            </Link>
          ))}
        </div>
        <div className="mt-6 rounded-2xl border border-[var(--c-e5e3dd)] bg-[var(--c-fcfcfb)] px-4 py-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
            Studio Rules
          </p>
          <p className="mt-2 text-sm text-[var(--c-3a3935)]">
            A studio activates once two or more teachers are grouped under the same
            owner.
          </p>
        </div>
      </aside>
      <main className="min-w-0">{children}</main>
    </div>
  );
}
