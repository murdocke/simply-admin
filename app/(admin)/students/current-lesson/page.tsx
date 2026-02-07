'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import studentsData from '@/data/students.json';
import {
  AUTH_STORAGE_KEY,
  VIEW_ROLE_STORAGE_KEY,
  VIEW_STUDENT_STORAGE_KEY,
} from '../../components/auth';

type StudentRecord = {
  id: string;
  name: string;
  email: string;
  username?: string;
  lessonDay?: string;
};

type LessonPlanItem = {
  title: string;
  section: string;
  material: string;
  part: string;
};

type LessonPlan = {
  studentId: string;
  lessonDate: string;
  rangeStart: string;
  rangeEnd: string;
  items: LessonPlanItem[];
  notes?: string;
};

const WEEK_DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(date.getDate() + days);
  return next;
};

const formatDateKey = (date: Date) => {
  const value = startOfDay(date);
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getLessonDateForPlan = (lessonDay?: string, baseDate = new Date()) => {
  if (!lessonDay) return startOfDay(baseDate);
  const dayIndex = WEEK_DAYS.findIndex(
    day => day.toLowerCase() === lessonDay.toLowerCase(),
  );
  if (dayIndex < 0) return startOfDay(baseDate);
  const today = startOfDay(baseDate);
  const diffPrev = (today.getDay() - dayIndex + 7) % 7;
  const prev = addDays(today, -diffPrev);
  const diffNext = (dayIndex - today.getDay() + 7) % 7;
  const next = addDays(today, diffNext);
  const daysSincePrev = (today.getTime() - prev.getTime()) / 86400000;
  const daysUntilNext = (next.getTime() - today.getTime()) / 86400000;
  if (daysSincePrev <= 3) return prev;
  if (daysUntilNext <= 3) return next;
  return next;
};

export default function StudentCurrentLessonPage() {
  const students = useMemo(
    () => (studentsData.students as StudentRecord[]) ?? [],
    [],
  );
  const [activeStudent, setActiveStudent] = useState<StudentRecord | null>(
    null,
  );
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [planWindow, setPlanWindow] = useState<{
    lessonDate: string;
    rangeStart: string;
    rangeEnd: string;
  } | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) {
      setActiveStudent(null);
      return;
    }
    try {
      const parsed = JSON.parse(stored) as { username?: string; role?: string };
      if (parsed?.role === 'teacher') {
        const storedView = window.localStorage.getItem(VIEW_ROLE_STORAGE_KEY);
        const isStudentView = storedView === 'student';
        if (!isStudentView) {
          setActiveStudent(null);
          return;
        }
        const viewStudentKey = parsed?.username
          ? `${VIEW_STUDENT_STORAGE_KEY}:${parsed.username}`
          : VIEW_STUDENT_STORAGE_KEY;
        const storedStudent =
          window.localStorage.getItem(viewStudentKey) ??
          window.localStorage.getItem(VIEW_STUDENT_STORAGE_KEY);
        if (storedStudent) {
          const selected = JSON.parse(storedStudent) as { id?: string };
          const matched =
            students.find(student => student.id === selected?.id) ?? null;
          setActiveStudent(matched);
          return;
        }
        setActiveStudent(null);
        return;
      }

      if (parsed?.role === 'student') {
        const normalized = parsed.username?.toLowerCase() ?? '';
        const match =
          students.find(student => student.email.toLowerCase() === normalized) ??
          students.find(
            student => student.username?.toLowerCase() === normalized,
          ) ??
          students.find(
            student => student.name.toLowerCase() === normalized,
          ) ??
          students.find(student =>
            student.name.toLowerCase().startsWith(normalized),
          ) ??
          null;
        setActiveStudent(match ?? null);
        return;
      }
    } catch {
      setActiveStudent(null);
    }
  }, [students]);

  useEffect(() => {
    if (!activeStudent) {
      setLessonPlan(null);
      setPlanWindow(null);
      return;
    }
    const lessonDate = getLessonDateForPlan(activeStudent.lessonDay);
    const lessonDateKey = formatDateKey(lessonDate);
    const rangeStartKey = formatDateKey(addDays(lessonDate, -3));
    const rangeEndKey = formatDateKey(addDays(lessonDate, 3));
    setPlanWindow({
      lessonDate: lessonDateKey,
      rangeStart: rangeStartKey,
      rangeEnd: rangeEndKey,
    });
    fetch(
      `/api/lesson-plans?studentId=${encodeURIComponent(
        activeStudent.id,
      )}&lessonDate=${encodeURIComponent(lessonDateKey)}`,
    )
      .then(response => (response.ok ? response.json() : null))
      .then(data => {
        setLessonPlan(data?.plan ?? null);
      })
      .catch(() => {
        setLessonPlan(null);
      });
  }, [activeStudent]);

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <Link
          href="/students/past-lessons"
          className="inline-flex items-center rounded-full bg-[var(--c-111111)] px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white"
        >
          Past Lessons
        </Link>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
          Students
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold text-[var(--c-1f1f1d)]">
            Current Lesson
          </h1>
          <span className="rounded-full border border-[var(--c-efe7d5)] bg-[var(--c-fff7e8)] px-3 py-1 text-xs font-semibold tracking-wide text-[var(--c-7a4a17)]">
            In Progress
          </span>
        </div>
        <p className="text-sm text-[var(--c-6f6c65)]">
          Capture the full piano lesson story with video, notes, and quick actions.
        </p>
      </header>

      <section className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
              This Week
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--c-1f1f1d)]">
              Lesson Plan
            </h2>
          </div>
          {planWindow ? (
            <div className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
              <p>{`Lesson Date ${planWindow.lessonDate}`}</p>
              <p>{`Applies ${planWindow.rangeStart} → ${planWindow.rangeEnd}`}</p>
            </div>
          ) : null}
        </div>
        {lessonPlan ? (
          <div className="mt-5 space-y-3">
            <div className="flex flex-wrap gap-2">
              {lessonPlan.items.length > 0 ? (
                lessonPlan.items.map((item, index) => (
                  <div
                    key={`${item.material}-${item.part}-${index}`}
                    className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-1f1f1d)]"
                  >
                    {item.section} • {item.material}
                    {item.part ? ` • ${item.part}` : ''}
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--c-6f6c65)]">
                  No plan items saved yet.
                </p>
              )}
            </div>
            {lessonPlan.notes ? (
              <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-faf9f6)] p-4 text-sm text-[var(--c-6f6c65)]">
                {lessonPlan.notes}
              </div>
            ) : null}
          </div>
        ) : (
          <p className="mt-4 text-sm text-[var(--c-6f6c65)]">
            Lesson plan details will appear once they are assigned for the week.
          </p>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] shadow-sm">
            <div className="relative aspect-video bg-[var(--c-111111)]">
              <iframe
                className="absolute inset-0 h-full w-full"
                src="https://player.vimeo.com/video/35117474?h=1&title=0&byline=0&portrait=0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title="Lesson Video"
              />
            </div>
            <div className="space-y-4 p-6">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[var(--c-c8102e)]">
                  Lesson Title
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                  Piano Foundations: Touch &amp; Dynamics
                </h2>
                <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                  Subtitle: Building expressive touch with a dynamic palette.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-[var(--c-efe7d5)] bg-[var(--c-fff7e8)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--c-7a4a17)]">
                    Date Added
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--c-1f1f1d)]">
                    Jan 22, 2026
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--c-e6eef8)] bg-[var(--c-f5f9ff)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--c-28527a)]">
                    Lesson Date
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--c-1f1f1d)]">
                    Feb 4, 2026
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--c-e8efe9)] bg-[var(--c-f6fbf7)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--c-2d6a4f)]">
                    Duration
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--c-1f1f1d)]">
                    42 min
                  </p>
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-faf9f6)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                      Progress
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[var(--c-1f1f1d)]">
                      65% watched
                    </p>
                  </div>
                  <span className="rounded-full border border-[var(--c-d9e2ef)] bg-[var(--c-ffffff)] px-3 py-1 text-xs font-semibold text-[var(--c-1f1f1d)]">
                    Next: Touch &amp; Dynamics Drill
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--c-ffffff)]">
                  <div className="h-full w-[65%] rounded-full bg-[var(--c-c8102e)]" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Completed
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                  Not yet
                </span>
                <button className="rounded-full border border-[var(--c-c8102e)] px-4 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--c-c8102e)]">
                  Mark Done
                </button>
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Add As Favorite
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                  No
                </span>
                <button className="rounded-full border border-[var(--c-111111)] px-4 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--c-111111)]">
                  Favorite
                </button>
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Ask For Help
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                  Message your teacher
                </span>
                <label
                  htmlFor="ask-for-help"
                  className="cursor-pointer rounded-full border border-[var(--c-1f1f1d)] px-4 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--c-1f1f1d)]"
                >
                  Ask
                </label>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.25em] text-[var(--c-c8102e)]">
              Lesson Snapshot
            </p>
            <h3 className="mt-3 text-lg font-semibold text-[var(--c-1f1f1d)]">
              Goals &amp; Focus Areas
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-[var(--c-6f6c65)]">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-[var(--c-c8102e)]" />
                Lock in 8th-note pulse at 90 BPM on piano.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-[var(--c-c8102e)]" />
                Shape dynamic swells on chorus accents.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-[var(--c-c8102e)]" />
                Prep for next week’s syncopation study on piano.
              </li>
            </ul>
          </div>

          <div className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.25em] text-[var(--c-6f6c65)]">
                Quick Notes
              </p>
              <span className="rounded-full border border-[var(--c-e8efe9)] bg-[var(--c-f6fbf7)] px-3 py-1 text-xs font-semibold text-[var(--c-2d6a4f)]">
                Draft
              </span>
            </div>
            <p className="mt-4 text-sm text-[var(--c-6f6c65)]">
              Student settled into a consistent hand position after the bridge.
              Needs a little more consistency on light touch notes — revisit with
              a slower tempo track.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-[var(--c-f4f0ff)] px-3 py-1 text-xs font-semibold text-[var(--c-47308a)]">
                Timing
              </span>
              <span className="rounded-full bg-[var(--c-fff1f3)] px-3 py-1 text-xs font-semibold text-[var(--c-b42318)]">
                Dynamics
              </span>
              <span className="rounded-full bg-[var(--c-e6f4ff)] px-3 py-1 text-xs font-semibold text-[var(--c-0b6aa2)]">
                Touch
              </span>
            </div>
            <button className="mt-6 w-full rounded-2xl border border-[var(--c-1f1f1d)] px-4 py-2 text-sm font-semibold text-[var(--c-1f1f1d)]">
              Add Lesson Note
            </button>
          </div>

          <div className="rounded-3xl border border-[var(--c-ecebe7)] bg-gradient-to-br from-[var(--c-111111)] via-[var(--c-1f1f1d)] to-[var(--c-2b2b27)] p-6 text-white shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-f8d58a)]">
              Next Up
            </p>
            <h3 className="mt-3 text-lg font-semibold">
              Syncopation &amp; Fills (Piano)
            </h3>
            <p className="mt-2 text-sm text-[var(--c-efece6)]">
              Projected for Feb 11, 2026. Build on today’s groove with polyrhythm
              fills and a guided metronome track on piano.
            </p>
            <button className="mt-5 w-full rounded-2xl bg-white/10 px-4 py-2 text-sm font-semibold text-white">
              Schedule Follow-up
            </button>
          </div>
        </aside>
      </section>

      <div className="relative">
        <input id="ask-for-help" type="checkbox" className="peer hidden" />
        <div className="pointer-events-none fixed inset-0 z-40 bg-black/40 opacity-0 transition peer-checked:pointer-events-auto peer-checked:opacity-100" />
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center px-4 opacity-0 transition peer-checked:pointer-events-auto peer-checked:opacity-100">
          <div className="w-full max-w-lg rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[var(--c-c8102e)]">
                  Ask For Help
                </p>
                <h3 className="mt-2 text-lg font-semibold text-[var(--c-1f1f1d)]">
                  Message Your Teacher
                </h3>
                <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                  Leave a quick note, and they’ll respond in your lesson inbox.
                </p>
              </div>
              <label
                htmlFor="ask-for-help"
                className="cursor-pointer rounded-full border border-[var(--c-1f1f1d)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--c-1f1f1d)]"
              >
                Close
              </label>
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-faf9f6)] p-3 text-xs text-[var(--c-6f6c65)]">
                Topic: Lesson question • Response time: under 24 hours
              </div>
              <textarea
                rows={5}
                placeholder="What do you want to ask about today?"
                className="w-full resize-none rounded-2xl border border-[var(--c-ecebe7)] px-4 py-3 text-sm text-[var(--c-1f1f1d)] placeholder:text-[var(--c-9c978f)]"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-[var(--c-6f6c65)]">
                  Your message will be saved with this lesson.
                </span>
                <button className="rounded-full bg-[var(--c-c8102e)] px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white">
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
