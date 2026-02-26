'use client';

import { useEffect, useMemo, useState } from 'react';
import { AUTH_STORAGE_KEY } from '../../components/auth';

export default function TeacherSettingsPage() {
  const [passFeesToParents, setPassFeesToParents] = useState(true);
  const [autoProration, setAutoProration] = useState(true);
  const [allowOneOffCharges, setAllowOneOffCharges] = useState(true);
  const [allowPartialRefunds, setAllowPartialRefunds] = useState(true);
  const [teacherStudentNames, setTeacherStudentNames] = useState<string[]>([]);

  const fallbackNames = [
    'Ava Thompson',
    'Noah Patel',
    'Liam Garcia',
    'Emma Wilson',
    'Mason Lee',
    'Olivia Nguyen',
    'Ethan Davis',
    'Sophia Martinez',
    'Lucas Brown',
    'Mia Johnson',
    'James Anderson',
    'Harper Clark',
    'Benjamin Lewis',
    'Amelia Hall',
    'Elijah Young',
    'Evelyn Allen',
    'Logan Wright',
    'Charlotte King',
    'Alexander Scott',
    'Isabella Green',
    'Daniel Baker',
    'Abigail Adams',
    'Henry Nelson',
    'Emily Carter',
    'Jackson Mitchell',
    'Scarlett Perez',
    'Sebastian Roberts',
    'Grace Turner',
    'David Phillips',
    'Chloe Campbell',
  ];

  useEffect(() => {
    let isActive = true;

    const loadTeacherStudents = async () => {
      if (typeof window === 'undefined') return;
      const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (!stored) return;

      try {
        const parsed = JSON.parse(stored) as { username?: string; role?: string };
        if (parsed?.role !== 'teacher' || !parsed?.username) return;

        const response = await fetch(
          `/api/students?teacher=${encodeURIComponent(parsed.username)}`,
          { cache: 'no-store' }
        );
        if (!response.ok) return;

        const data = (await response.json()) as {
          students?: Array<{ name?: string; status?: string }>;
        };

        const names = Array.from(
          new Set(
            (data.students ?? [])
              .filter(student => (student.status ?? 'Active') !== 'Archived')
              .map(student => (student.name ?? '').trim())
              .filter(Boolean)
          )
        );

        if (isActive && names.length > 0) {
          setTeacherStudentNames(names);
        }
      } catch {
        // Keep fallback names if load fails.
      }
    };

    void loadTeacherStudents();
    return () => {
      isActive = false;
    };
  }, []);

  const namesForRows = useMemo(() => {
    const source = teacherStudentNames.length > 0 ? teacherStudentNames : fallbackNames;
    return Array.from({ length: 30 }, (_, index) => source[index % source.length]);
  }, [teacherStudentNames]);

  const lessonFeeRows = namesForRows.map((student, index) => {
    const day = (index % 28) + 1;
    const isMakeup = (index + 1) % 7 === 0;
    return {
      date: `Feb ${day}, 2026`,
      student,
      lessonType: isMakeup ? 'Makeup Lesson' : 'Monthly Lesson',
      amount: isMakeup ? '$40.00' : '$150.00',
      status: 'Paid',
    };
  });

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-6 py-8 shadow-sm md:px-10">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
          Settings
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--c-1f1f1d)] md:text-4xl">
          Stripe Facilitation
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-[var(--c-6f6c65)] md:text-base">
          Start UI for teacher billing controls. Configure recurring billing behavior,
          one-off charges, refunds, and fee-handling preferences.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm md:p-8">
          <h2 className="text-xl font-semibold text-[var(--c-1f1f1d)]">
            Billing Preferences
          </h2>
          <div className="mt-5 space-y-4">
            <label className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-4">
              <span className="text-sm text-[var(--c-3a3935)]">
                Pass Stripe &amp; processing fees to parents
              </span>
              <input
                type="checkbox"
                checked={passFeesToParents}
                onChange={event => setPassFeesToParents(event.target.checked)}
                className="h-4 w-4 accent-[var(--c-c8102e)]"
              />
            </label>
            <label className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-4">
              <span className="text-sm text-[var(--c-3a3935)]">
                Auto-prorate missed or adjusted lessons
              </span>
              <input
                type="checkbox"
                checked={autoProration}
                onChange={event => setAutoProration(event.target.checked)}
                className="h-4 w-4 accent-[var(--c-c8102e)]"
              />
            </label>
          </div>
        </article>

        <article className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm md:p-8">
          <h2 className="text-xl font-semibold text-[var(--c-1f1f1d)]">
            Charge &amp; Refund Controls
          </h2>
          <div className="mt-5 space-y-4">
            <label className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-4">
              <span className="text-sm text-[var(--c-3a3935)]">
                Allow one-off charges (events, materials, custom fees)
              </span>
              <input
                type="checkbox"
                checked={allowOneOffCharges}
                onChange={event => setAllowOneOffCharges(event.target.checked)}
                className="h-4 w-4 accent-[var(--c-c8102e)]"
              />
            </label>
            <label className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-4">
              <span className="text-sm text-[var(--c-3a3935)]">
                Allow full or partial refunds
              </span>
              <input
                type="checkbox"
                checked={allowPartialRefunds}
                onChange={event => setAllowPartialRefunds(event.target.checked)}
                className="h-4 w-4 accent-[var(--c-c8102e)]"
              />
            </label>
            <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
                Refund Note
              </p>
              <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                Start-state placeholder for refund policy text and reason presets.
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
              Stripe Onboarding
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--c-1f1f1d)]">
              Set Up Stripe Account
            </h2>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)] transition hover:brightness-110"
          >
            Start Setup
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] px-4 py-3 text-sm text-[var(--c-3a3935)]">
            Secure &amp; encrypted
          </div>
          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] px-4 py-3 text-sm text-[var(--c-3a3935)]">
            Funds deposited directly to your bank
          </div>
          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] px-4 py-3 text-sm text-[var(--c-3a3935)]">
            Takes 2-3 minutes
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-4">
          <div className="grid gap-3 text-sm text-[var(--c-3a3935)] md:grid-cols-2">
            <p>
              <span className="font-semibold text-[var(--c-1f1f1d)]">Stripe Account ID:</span>{' '}
              acct_1SMEXAMPLE89
            </p>
            <p>
              <span className="font-semibold text-[var(--c-1f1f1d)]">Status:</span> Pending
            </p>
            <p>
              <span className="font-semibold text-[var(--c-1f1f1d)]">Payouts enabled:</span> No
            </p>
            <p>
              <span className="font-semibold text-[var(--c-1f1f1d)]">Country:</span> US
            </p>
            <p className="md:col-span-2">
              <span className="font-semibold text-[var(--c-1f1f1d)]">Charges enabled:</span> No
            </p>
          </div>
        </div>

        <p className="mt-4 text-sm text-[var(--c-6f6c65)]">
          Simply Music securely processes payments through Stripe. Funds deposit directly to
          your connected bank account.
        </p>
      </section>

      <section className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
            This Month
          </p>
          <h2 className="text-xl font-semibold text-[var(--c-1f1f1d)]">
            Past Lesson Fees Collected
          </h2>
          <p className="text-sm text-[var(--c-6f6c65)]">
            Example reporting view for recently collected lesson fees.
          </p>
        </div>

        <div className="mt-5 overflow-x-auto rounded-2xl border border-[var(--c-ecebe7)]">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-[var(--c-fafafa)] text-xs uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
              <tr>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Student</th>
                <th className="px-4 py-3 font-semibold">Lesson Type</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {lessonFeeRows.map(row => (
                <tr
                  key={`${row.date}-${row.student}`}
                  className="border-t border-[var(--c-ecebe7)] text-[var(--c-3a3935)]"
                >
                  <td className="px-4 py-3">{row.date}</td>
                  <td className="px-4 py-3 font-medium">{row.student}</td>
                  <td className="px-4 py-3">{row.lessonType}</td>
                  <td className="px-4 py-3">{row.amount}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-fafafa)] px-2.5 py-1 text-[11px] uppercase tracking-[0.15em] text-[var(--c-6f6c65)]">
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
