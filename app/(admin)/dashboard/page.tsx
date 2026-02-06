'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  OpenStudentRequestsTable,
  OpenTeacherRequestsTable,
  UnpaidRoyaltiesTable,
} from '../components/dashboard-tables';

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
      <div className="flex items-center justify-between">
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Active Teachers
            </p>
            <p className="text-4xl font-semibold mt-3 text-[var(--c-1f1f1d)]">
            {activeTeachers.toLocaleString('en-US')}
            </p>
            <p className="text-sm text-[var(--c-6f6c65)] mt-2">
              Nationwide instructor coverage
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Active Students
            </p>
            <p className="text-4xl font-semibold mt-3 text-[var(--c-1f1f1d)]">
            {activeStudents.toLocaleString('en-US')}
            </p>
            <p className="text-sm text-[var(--c-6f6c65)] mt-2">
              Healthy teacher-to-student mix
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Monthly Royalties Due
            </p>
            <p className="text-4xl font-semibold mt-3 text-[var(--c-1f1f1d)]">
            {monthlyRoyaltiesDue.toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD',
              maximumFractionDigits: 0,
            })}
            </p>
            <p className="text-sm text-[var(--c-6f6c65)] mt-2">
              Projected from active student count
            </p>
          </div>
        </div>

      <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
              Curriculum
            </p>
            <h2 className="text-2xl font-semibold text-[var(--c-1f1f1d)] mt-2">
              Program Library
            </h2>
            <p className="text-sm text-[var(--c-6f6c65)] mt-2">
              Jump into a specific pathway or program set.
            </p>
          </div>
          <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-1 text-xs text-[var(--c-6f6c65)]">
            Updated weekly
          </span>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <a
            href="/curriculum/foundation"
            className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-5 text-left transition hover:border-[color:var(--c-c8102e)]/30 hover:bg-[var(--c-ffffff)]"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
              Foundation Program
            </p>
            <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
              Levels 1-9
            </p>
          </a>
          <a
            href="/curriculum/development"
            className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-5 text-left transition hover:border-[color:var(--c-c8102e)]/30 hover:bg-[var(--c-ffffff)]"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
              Development Program
            </p>
            <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
              Levels 10-18
            </p>
          </a>
          <a
            href="/curriculum/special"
            className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-5 text-left transition hover:border-[color:var(--c-c8102e)]/30 hover:bg-[var(--c-ffffff)]"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
              Special Programs
            </p>
            <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
              Masterclasses + Intensives
            </p>
          </a>
          <a
            href="/curriculum/supplemental"
            className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-5 text-left transition hover:border-[color:var(--c-c8102e)]/30 hover:bg-[var(--c-ffffff)]"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
              Supplemental Programs
            </p>
            <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
              Teacher Created Programs
            </p>
          </a>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <a
          href="/teachers"
          className="group overflow-hidden rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] shadow-sm transition hover:border-[color:var(--c-c8102e)]/30 hover:shadow-md"
        >
          <div
            className="h-64 w-full bg-[var(--c-f1f1ef)] bg-cover bg-center"
            style={{
              backgroundImage:
                'url(https://simplymusic.com/wp-content/uploads/2024/02/Teach_Simply_Music.png)',
            }}
          />
          <div className="p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
              Teachers
            </p>
            <h2 className="text-xl font-semibold mt-3 text-[var(--c-1f1f1d)]">
              Training + Teaching
            </h2>
            <p className="text-sm text-[var(--c-6f6c65)] mt-2">
              Curriculum, coaching, and studio resources for instructors.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs text-[var(--c-6f6c65)]">
              <span className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1">
                Curriculum
              </span>
              <span className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1">
                Training &amp; Coaching
              </span>
              <span className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1">
                Library
              </span>
              <span className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1">
                Store
              </span>
            </div>
          </div>
        </a>

        <a
          href="/students"
          className="group overflow-hidden rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] shadow-sm transition hover:border-[color:var(--c-c8102e)]/30 hover:shadow-md"
        >
          <div
            className="h-64 w-full bg-[var(--c-f1f1ef)] bg-cover bg-center"
            style={{
              backgroundImage:
                'url(https://simplymusic.com/wp-content/uploads/2024/02/Learn-Piano-with-a-Simply-Music-Teacher.png)',
              backgroundPosition: 'center 30%',
            }}
          />
          <div className="p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
              Students
            </p>
            <h2 className="text-xl font-semibold mt-3 text-[var(--c-1f1f1d)]">
              Learning + Practicing
            </h2>
            <p className="text-sm text-[var(--c-6f6c65)] mt-2">
              Guided progression and practice flow across levels.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs text-[var(--c-6f6c65)]">
              <span className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1">
                Curriculum
              </span>
              <span className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1">
                Practice Mode
              </span>
            </div>
          </div>
        </a>

        <a
          href="/company"
          className="group overflow-hidden rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] shadow-sm transition hover:border-[color:var(--c-c8102e)]/30 hover:shadow-md"
        >
          <div
            className="h-64 w-full bg-[var(--c-f1f1ef)] bg-cover bg-center"
            style={{
              backgroundImage:
                'url(https://simplymusic.com/wp-content/uploads/2024/02/Learn-with-Simply-Music-Self-Study-Program.png)',
              backgroundPosition: 'center 40%',
            }}
          />
          <div className="p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
              Company
            </p>
            <h2 className="text-xl font-semibold mt-3 text-[var(--c-1f1f1d)]">
              Internal Operations
            </h2>
            <p className="text-sm text-[var(--c-6f6c65)] mt-2">
              Teachers, students, commerce, royalties, and support tools.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs text-[var(--c-6f6c65)]">
              <span className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1">
                Orders
              </span>
              <span className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1">
                Royalty Hub
              </span>
              <span className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1">
                Lesson Packs
              </span>
            </div>
          </div>
        </a>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <OpenTeacherRequestsTable />
        <OpenStudentRequestsTable />
      </div>

      <div>
        <UnpaidRoyaltiesTable />
      </div>
    </div>
  );
}
