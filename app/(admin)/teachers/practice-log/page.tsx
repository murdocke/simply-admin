'use client';

import { useEffect, useMemo, useState } from 'react';
import studentsData from '@/data/students.json';
import {
  AUTH_STORAGE_KEY,
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

export default function TeacherPracticeLogPage() {
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
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) {
      setActiveStudent(null);
      return;
    }
    try {
      const parsed = JSON.parse(stored) as { username?: string; role?: string };
      if (parsed?.role === 'teacher' || parsed?.role === 'company') {
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
      }
      setActiveStudent(null);
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
    const baseDate = addDays(new Date(), weekOffset * 7);
    const lessonDate = getLessonDateForPlan(activeStudent.lessonDay, baseDate);
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
  }, [activeStudent, weekOffset]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
          Teachers
        </p>
        <h1 className="text-3xl font-semibold text-[var(--c-1f1f1d)] mt-2">
          Practice Log
        </h1>
        <p className="text-sm text-[var(--c-6f6c65)] mt-2">
          We&apos;ll build a detailed practice log here next. For now, this
          card shows the current week&apos;s lesson plan.
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {planWindow ? (
          <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-1 text-[10px] uppercase tracking-[0.3em] text-[var(--c-6f6c65)]">
            {`Week of ${planWindow.rangeStart}`}
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => setWeekOffset(current => current - 1)}
          className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => setWeekOffset(current => current + 1)}
          className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
        >
          Next
        </button>
      </div>

      <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
              Current Week
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--c-1f1f1d)]">
              {activeStudent?.name ? `${activeStudent.name} Lesson Plan` : 'Lesson Plan'}
            </h2>
          </div>
          {planWindow ? (
            <div className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
              <p>{`Lesson Date ${planWindow.lessonDate}`}</p>
              <p>{`Applies ${planWindow.rangeStart} → ${planWindow.rangeEnd}`}</p>
            </div>
          ) : null}
        </div>
        {activeStudent ? (
          lessonPlan ? (
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
              No lesson plan saved for this week yet.
            </p>
          )
        ) : (
          <p className="mt-4 text-sm text-[var(--c-6f6c65)]">
            Select a student in the sidebar to view their current lesson plan.
          </p>
        )}
      </section>
    </div>
  );
}
