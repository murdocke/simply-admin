'use client';

import { useEffect, useMemo, useState } from 'react';
import { AUTH_STORAGE_KEY } from '../../components/auth';
import { useApiData } from '../../components/use-api-data';

type ParentRecord = {
  username: string;
  students: string[];
};

type StudentRecord = {
  id: string;
  name: string;
  lessonDay?: string;
  lessonTime?: string;
  lessonDuration?: string;
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

const dayIndex = (day?: string) =>
  day ? WEEK_DAYS.findIndex(label => label.toLowerCase() === day.toLowerCase()) : -1;

const timeMinutes = (time?: string) => {
  if (!time) return 0;
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 0;
  const hours = Number(match[1]) % 12;
  const minutes = Number(match[2]);
  const period = match[3].toUpperCase();
  return hours * 60 + minutes + (period === 'PM' ? 12 * 60 : 0);
};

export default function ParentSchedulePage() {
  const { data: parentsData } = useApiData<{ parents: ParentRecord[] }>(
    '/api/parents',
    { parents: [] },
  );
  const { data: studentsData } = useApiData<{ students: StudentRecord[] }>(
    '/api/students',
    { students: [] },
  );
  const parents = useMemo(
    () => (parentsData.parents as ParentRecord[]) ?? [],
    [parentsData],
  );
  const students = useMemo(
    () => (studentsData.students as StudentRecord[]) ?? [],
    [studentsData],
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

  const familySchedule = useMemo(() => {
    if (!activeParent) return [] as StudentRecord[];
    return activeParent.students
      .map(id => students.find(student => student.id === id))
      .filter((student): student is StudentRecord => Boolean(student))
      .sort((a, b) => {
        const dayDiff = dayIndex(a.lessonDay) - dayIndex(b.lessonDay);
        if (dayDiff !== 0) return dayDiff;
        return timeMinutes(a.lessonTime) - timeMinutes(b.lessonTime);
      });
  }, [activeParent, students]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
          Parent Portal
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--c-1f1f1d)]">
          Schedule
        </h1>
        <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
          Keep track of weekly lessons and get ahead of any conflicts.
        </p>
      </header>

      <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
              Weekly Lessons
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
              Family lesson calendar
            </h2>
          </div>
          <span className="rounded-full border border-[var(--c-ecebe7)] px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
            {familySchedule.length} lessons
          </span>
        </div>
        <div className="mt-6 space-y-3">
          {familySchedule.map(lesson => (
            <div
              key={lesson.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                  {lesson.name}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  {lesson.lessonDay ?? 'Day'} · {lesson.lessonTime ?? 'Time TBD'}
                </p>
              </div>
              <span className="rounded-full border border-[var(--c-ecebe7)] bg-white px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                {lesson.lessonDuration ?? '45M'}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
