'use client';

import { useEffect, useMemo, useState } from 'react';
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
  teacher?: string;
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

export default function StudentDashboardPage() {
  const students = useMemo(
    () => (studentsData.students as StudentRecord[]) ?? [],
    [],
  );
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(
    null,
  );
  const [isTeacherView, setIsTeacherView] = useState(false);
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [planWindow, setPlanWindow] = useState<{
    lessonDate: string;
    rangeStart: string;
    rangeEnd: string;
  } | null>(null);

  useEffect(() => {
    const loadStudentSelection = () => {
      const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (!stored) {
        setSelectedStudent(null);
        setIsTeacherView(false);
        return;
      }
      try {
        const parsed = JSON.parse(stored) as { username?: string; role?: string };
        if (parsed?.role === 'teacher') {
          const storedView = window.localStorage.getItem(VIEW_ROLE_STORAGE_KEY);
          const isStudentView = storedView === 'student';
          setIsTeacherView(isStudentView);

          const viewStudentKey = parsed?.username
            ? `${VIEW_STUDENT_STORAGE_KEY}:${parsed.username}`
            : VIEW_STUDENT_STORAGE_KEY;
          const storedStudent =
            window.localStorage.getItem(viewStudentKey) ??
            window.localStorage.getItem(VIEW_STUDENT_STORAGE_KEY);

          if (isStudentView && storedStudent) {
            try {
              const selected = JSON.parse(storedStudent) as {
                id?: string;
                name?: string;
                email?: string;
              };
              if (selected?.id) {
                const matched =
                  students.find(student => student.id === selected.id) ?? null;
                setSelectedStudent(matched);
                window.localStorage.setItem(viewStudentKey, storedStudent);
                return;
              }
            } catch {
              setSelectedStudent(null);
            }
          }

          setSelectedStudent(null);
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
          setSelectedStudent(match ?? null);
          setIsTeacherView(false);
          return;
        }

        setSelectedStudent(null);
        setIsTeacherView(false);
      } catch {
        setSelectedStudent(null);
        setIsTeacherView(false);
      }
    };

    loadStudentSelection();
    const handleSelectionUpdate = () => loadStudentSelection();
    window.addEventListener('sm-view-student-updated', handleSelectionUpdate);
    window.addEventListener('sm-student-selection', handleSelectionUpdate);
    return () => {
      window.removeEventListener(
        'sm-view-student-updated',
        handleSelectionUpdate,
      );
      window.removeEventListener('sm-student-selection', handleSelectionUpdate);
    };
  }, [students]);

  useEffect(() => {
    if (!selectedStudent) {
      setLessonPlan(null);
      setPlanWindow(null);
      return;
    }
    const lessonDate = getLessonDateForPlan(selectedStudent.lessonDay);
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
        selectedStudent.id,
      )}&lessonDate=${encodeURIComponent(lessonDateKey)}`,
    )
      .then(response => (response.ok ? response.json() : null))
      .then(data => {
        setLessonPlan(data?.plan ?? null);
      })
      .catch(() => {
        setLessonPlan(null);
      });
  }, [selectedStudent]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <header>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
            Students
          </p>
          <h1 className="text-3xl font-semibold text-[var(--c-1f1f1d)] mt-2">
            Dashboard
          </h1>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            Your practice snapshot will live here.
          </p>
        </header>

        {isTeacherView ? (
          <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[linear-gradient(135deg,var(--c-ffffff),var(--c-f7f7f5))] p-5 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.45)] ring-1 ring-[var(--c-ecebe7)] lg:max-w-sm lg:flex-1">
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                Selected Student
              </p>
              <h2 className="text-xl font-semibold text-[var(--c-1f1f1d)]">
                {selectedStudent?.name ?? 'No student selected'}
              </h2>
              <p className="text-sm text-[var(--c-6f6c65)]">
                {selectedStudent?.name
                  ? 'You are viewing the student dashboard for this learner.'
                  : 'Choose a student in the sidebar to view their dashboard.'}
              </p>
            </div>
          </section>
        ) : null}
      </div>

      <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
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
            Add practice goals, lesson notes, and progress updates when ready.
          </p>
        )}
      </section>
    </div>
  );
}
