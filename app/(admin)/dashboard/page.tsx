'use client';

import { useEffect, useMemo, useState } from 'react';

function TimeBadge({ label, timeZone }: { label: string; timeZone: string }) {
  const [now, setNow] = useState(() => new Date());
  const formatted = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        timeZone,
        dateStyle: 'medium',
        timeStyle: 'medium',
      }).format(now),
    [now, timeZone],
  );

  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = window.setInterval(tick, 1_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-2 shadow-sm">
      {label} · {formatted}
    </div>
  );
}

export default function DashboardPage() {
  const activeTeachers = 845;
  const activeStudents = activeTeachers * 27;
  const monthlyRoyaltiesDue = activeStudents * 9;

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
            Overview
          </p>
          <h1 className="text-3xl font-semibold text-[var(--c-1f1f1d)] mt-2">
            Dashboard
          </h1>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            Choose a workspace to jump into a focused view.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
          <TimeBadge label="Melbourne" timeZone="Australia/Melbourne" />
          <TimeBadge label="Sacramento" timeZone="America/Los_Angeles" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <a
          href="/company/lesson-library"
          className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm transition hover:border-[color:var(--c-c8102e)]/40 hover:shadow-md"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Lesson Library
          </p>
          <p className="text-3xl font-semibold mt-3 text-[var(--c-1f1f1d)]">
            128 Packs
          </p>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            Refresh content, uploads, and releases.
          </p>
        </a>
        <a
          href="/subscriptions"
          className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm transition hover:border-[color:var(--c-c8102e)]/40 hover:shadow-md"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Subscriptions
          </p>
          <p className="text-3xl font-semibold mt-3 text-[var(--c-1f1f1d)]">
            {activeStudents.toLocaleString('en-US')}
          </p>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            Students billed at $9 per month.
          </p>
        </a>
        <a
          href="/accounts"
          className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm transition hover:border-[color:var(--c-c8102e)]/40 hover:shadow-md"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Accounts
          </p>
          <p className="text-3xl font-semibold mt-3 text-[var(--c-1f1f1d)]">
            {activeTeachers.toLocaleString('en-US')}
          </p>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            Active teachers across the network.
          </p>
        </a>
        <a
          href="/company/messages"
          className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm transition hover:border-[color:var(--c-c8102e)]/40 hover:shadow-md"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Messages
          </p>
          <p className="text-3xl font-semibold mt-3 text-[var(--c-1f1f1d)]">
            24 Threads
          </p>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            Active teacher conversations.
          </p>
        </a>
      </div>

      <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
              Company Workstreams
            </p>
            <h2 className="text-2xl font-semibold text-[var(--c-1f1f1d)] mt-2">
              Jump Back Into Key Areas
            </h2>
            <p className="text-sm text-[var(--c-6f6c65)] mt-2">
              Prioritize the next action across content, billing, accounts, and messaging.
            </p>
          </div>
          <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-1 text-xs text-[var(--c-6f6c65)]">
            Updated today
          </span>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              label: 'Lesson Library',
              note: 'Review new uploads and release dates.',
              href: '/company/lesson-library',
            },
            {
              label: 'Subscriptions',
              note: 'Monitor student counts and next billing.',
              href: '/subscriptions',
            },
            {
              label: 'Accounts',
              note: 'Teacher roster, statuses, and student lists.',
              href: '/accounts',
            },
            {
              label: 'Messages',
              note: 'Respond to teacher outreach.',
              href: '/company/messages',
            },
            {
              label: 'Message Review',
              note: 'Audit sentiment and response times.',
              href: '/company/messages',
            },
          ].map(card => (
            <a
              key={card.label}
              href={card.href}
              className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-5 text-left transition hover:border-[color:var(--c-c8102e)]/30 hover:bg-[var(--c-ffffff)]"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                {card.label}
              </p>
              <p className="mt-3 text-sm text-[var(--c-6f6c65)]">
                {card.note}
              </p>
            </a>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Billing Outlook
          </p>
          <h2 className="text-2xl font-semibold text-[var(--c-1f1f1d)] mt-2">
            Monthly Royalties Snapshot
          </h2>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            Estimated from current student counts under the new subscription model.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Total Due
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--c-1f1f1d)]">
                {monthlyRoyaltiesDue.toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Billing Date
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--c-1f1f1d)]">
                Mar 1, 2026
              </p>
            </div>
            <div className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Active Students
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--c-1f1f1d)]">
                {activeStudents.toLocaleString('en-US')}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                At-Risk Accounts
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--c-1f1f1d)]">
                14
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Communications
          </p>
          <h2 className="text-2xl font-semibold text-[var(--c-1f1f1d)] mt-2">
            Teacher Messaging Focus
          </h2>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            Keep tabs on response times and outbound reminders.
          </p>
          <div className="mt-6 space-y-3">
            {[
              '12 unresolved billing questions',
              '8 onboarding follow-ups needed',
              '6 lesson library updates to announce',
              '4 VIP teachers awaiting response',
            ].map(item => (
              <div
                key={item}
                className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3 text-sm text-[var(--c-3a3935)]"
              >
                {item}
              </div>
            ))}
          </div>
          <a
            href="/company/messages"
            className="mt-4 inline-flex rounded-full border border-[var(--c-ecebe7)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
          >
            Open Message Center
          </a>
        </section>
      </div>
    </div>
  );
}
