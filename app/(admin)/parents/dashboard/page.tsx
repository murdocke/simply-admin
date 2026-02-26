'use client';

import { useEffect, useMemo, useState } from 'react';
import { AUTH_STORAGE_KEY } from '../../components/auth';
import { useApiData } from '../../components/use-api-data';

type ParentRecord = {
  id: string;
  username: string;
  name: string;
  email: string;
  phone?: string;
  preferredContact?: string;
  students: string[];
  billing?: {
    status?: string;
    nextPaymentDue?: string;
    monthlyTotal?: number;
    lastPaid?: string;
  };
};

type StudentRecord = {
  id: string;
  teacher: string;
  name: string;
  email: string;
  level?: string;
  status?: string;
  lessonDay?: string;
  lessonTime?: string;
  lessonDuration?: string;
};

type TeacherRecord = {
  id: string;
  name: string;
  email: string;
  username?: string;
  goesBy?: string;
};

const QUICK_ACTIONS = [
  {
    title: 'Message Teacher',
    body: 'Send a quick note or ask a question about the week.',
    href: '/parents/messages',
  },
  {
    title: 'Request Reschedule',
    body: 'Pick new lesson times that work for your family.',
    href: '/parents/schedule',
  },
  {
    title: 'Update Payment',
    body: 'Keep billing and auto-pay details up to date.',
    href: '/parents/billing',
  },
];

const MESSAGE_HIGHLIGHTS = [
  {
    title: 'Lesson focus for next week',
    body: 'Kenzie is ready for the Level 3 milestone piece. Encourage slow practice.',
    author: 'Mr. Brian',
    time: '2 hrs ago',
  },
  {
    title: 'Great practice streak',
    body: 'Keira hit her goal three days in a row. Love the consistency!',
    author: 'Mr. Brian',
    time: 'Yesterday',
  },
];

const PRACTICE_SNAPSHOT = [
  { minutes: 95, goal: 120, streak: 4 },
  { minutes: 110, goal: 120, streak: 3 },
];

const getTeacherDisplay = (student: StudentRecord, teachers: TeacherRecord[]) => {
  const normalized = student.teacher?.toLowerCase();
  if (!normalized) return 'Teacher';
  const match =
    teachers.find(teacher => teacher.username?.toLowerCase() === normalized) ??
    teachers.find(teacher => teacher.email.toLowerCase() === normalized) ??
    teachers.find(teacher => teacher.name.toLowerCase() === normalized) ??
    teachers.find(teacher => teacher.name.toLowerCase().startsWith(normalized)) ??
    null;
  return match?.goesBy?.trim() || match?.name?.trim() || 'Teacher';
};

export default function ParentDashboardPage() {
  const { data: parentsData } = useApiData<{ parents: ParentRecord[] }>(
    '/api/parents',
    { parents: [] },
  );
  const { data: studentsData } = useApiData<{ students: StudentRecord[] }>(
    '/api/students',
    { students: [] },
  );
  const { data: teachersData } = useApiData<{ teachers: TeacherRecord[] }>(
    '/api/teachers',
    { teachers: [] },
  );
  const parents = useMemo(
    () => (parentsData.parents as ParentRecord[]) ?? [],
    [parentsData],
  );
  const students = useMemo(
    () => (studentsData.students as StudentRecord[]) ?? [],
    [studentsData],
  );
  const teachers = useMemo(
    () => (teachersData.teachers as TeacherRecord[]) ?? [],
    [teachersData],
  );
  const [activeParent, setActiveParent] = useState<ParentRecord | null>(null);

  useEffect(() => {
    if (parents.length === 0) {
      setActiveParent(null);
      return;
    }
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { username?: string };
        if (parsed?.username) {
          const matched = parents.find(
            parent => parent.username.toLowerCase() === parsed.username!.toLowerCase(),
          );
          if (matched) {
            setActiveParent(matched);
            return;
          }
        }
      } catch {
        // ignore
      }
    }
    setActiveParent(parents[0]);
  }, [parents]);

  const familyStudents = useMemo(() => {
    if (!activeParent) return [] as StudentRecord[];
    return activeParent.students
      .map(id => students.find(student => student.id === id))
      .filter((student): student is StudentRecord => Boolean(student));
  }, [activeParent, students]);

  const teacherNames = useMemo(() => {
    const names = new Set(
      familyStudents.map(student => getTeacherDisplay(student, teachers)),
    );
    return Array.from(names).join(', ');
  }, [familyStudents, teachers]);

  if (!activeParent) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
            Parent Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-[var(--c-1f1f1d)]">
            Family Overview
          </h1>
        </div>
        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 text-sm text-[var(--c-6f6c65)]">
          No parent records were found. Add a parent to see family data.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
          Parent Dashboard
        </p>
        <h1 className="text-3xl font-semibold text-[var(--c-1f1f1d)]">
          Welcome back, {activeParent.name.split(' ')[0]}
        </h1>
        <p className="text-sm text-[var(--c-6f6c65)]">
          Track lessons, progress, and communications for {familyStudents.length} student
          {familyStudents.length === 1 ? '' : 's'} in your family.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                Family Overview
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                {activeParent.name}
              </h2>
              <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                {activeParent.email} · {activeParent.phone ?? 'Contact on file'}
              </p>
            </div>
            <div className="rounded-full border border-[var(--c-e5e3dd)] px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
              {activeParent.preferredContact ?? 'Preferred contact'}
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                Students
              </p>
              <p className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                {familyStudents.length}
              </p>
              <p className="mt-1 text-xs text-[var(--c-6f6c65)]">
                Active enrollments
              </p>
            </div>
            <div className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                Teachers
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--c-1f1f1d)]">
                {teacherNames || 'Assigned soon'}
              </p>
              <p className="mt-1 text-xs text-[var(--c-6f6c65)]">
                Simply Music roster
              </p>
            </div>
            <div className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                Next payment
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--c-1f1f1d)]">
                {activeParent.billing?.nextPaymentDue ?? 'Not scheduled'}
              </p>
              <p className="mt-1 text-xs text-[var(--c-6f6c65)]">
                {activeParent.billing?.status ?? 'Billing status'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
            Quick Actions
          </p>
          <div className="mt-4 space-y-3">
            {QUICK_ACTIONS.map(action => (
              <a
                key={action.title}
                href={action.href}
                className="block rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-4 transition hover:border-[var(--sidebar-accent-border)] hover:bg-[var(--sidebar-accent-bg)]"
              >
                <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                  {action.title}
                </p>
                <p className="mt-1 text-xs text-[var(--c-6f6c65)]">
                  {action.body}
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                Upcoming Lessons
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                Weekly lesson plan
              </h2>
            </div>
            <a
              href="/parents/schedule"
              className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[var(--c-d6d3cd)] hover:bg-[var(--c-f1f1ef)]"
            >
              View schedule
            </a>
          </div>
          <div className="mt-6 grid gap-4">
            {familyStudents.map((student, index) => (
              <div
                key={student.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-4"
              >
                <div>
                  <p className="text-lg font-semibold text-[var(--c-1f1f1d)]">
                    {student.name}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                    {student.lessonDay ?? 'Lesson day'} · {student.lessonTime ?? 'Time TBD'}
                    {student.lessonDuration ? ` · ${student.lessonDuration}` : ''}
                  </p>
                  <p className="mt-2 text-xs text-[var(--c-6f6c65)]">
                    Teacher: {getTeacherDisplay(student, teachers)}
                  </p>
                </div>
                <div className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  {student.level ?? `Level ${index + 1}`}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
            Messages & Notes
          </p>
          <div className="mt-4 space-y-4">
            {MESSAGE_HIGHLIGHTS.map(message => (
              <div key={message.title} className="rounded-xl border border-[var(--c-ecebe7)] p-4">
                <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                  {message.title}
                </p>
                <p className="mt-2 text-xs text-[var(--c-6f6c65)]">
                  {message.body}
                </p>
                <div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                  <span>{message.author}</span>
                  <span>{message.time}</span>
                </div>
              </div>
            ))}
          </div>
          <a
            href="/parents/communications"
            className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)] transition hover:brightness-110"
          >
            Open communications
          </a>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                Practice Snapshot
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                Weekly momentum
              </h2>
            </div>
            <span className="rounded-full border border-[var(--c-ecebe7)] px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
              This week
            </span>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {familyStudents.map((student, index) => {
              const snapshot = PRACTICE_SNAPSHOT[index % PRACTICE_SNAPSHOT.length];
              const progress = Math.min(100, Math.round((snapshot.minutes / snapshot.goal) * 100));
              return (
                <div key={student.id} className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold text-[var(--c-1f1f1d)]">
                      {student.name}
                    </p>
                    <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                      {snapshot.streak} day streak
                    </span>
                  </div>
                  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[var(--c-f1f1ef)]">
                    <div
                      className="h-full rounded-full bg-[var(--c-3f4a2c)] transition-[width]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-[var(--c-6f6c65)]">
                    <span>{snapshot.minutes} min practiced</span>
                    <span>{snapshot.goal} min goal</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
            Billing Snapshot
          </p>
          <div className="mt-4 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
              Monthly total
            </p>
            <p className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
              ${activeParent.billing?.monthlyTotal ?? 0}
            </p>
            <p className="mt-1 text-xs text-[var(--c-6f6c65)]">
              Last paid {activeParent.billing?.lastPaid ?? 'recently'}
            </p>
          </div>
          <div className="mt-4 space-y-2 text-sm text-[var(--c-6f6c65)]">
            <div className="flex items-center justify-between">
              <span>Auto-pay</span>
              <span className="font-semibold text-[var(--c-1f1f1d)]">
                {activeParent.billing?.status ?? 'On file'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Next charge</span>
              <span className="font-semibold text-[var(--c-1f1f1d)]">
                {activeParent.billing?.nextPaymentDue ?? 'TBD'}
              </span>
            </div>
          </div>
          <a
            href="/parents/billing"
            className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)] transition hover:brightness-110"
          >
            Manage billing
          </a>
        </div>
      </section>
    </div>
  );
}
