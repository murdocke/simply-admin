'use client';

import { useEffect, useMemo, useState } from 'react';
import studentsData from '../../../../data/students.json';

type StudentRecord = {
  id: string;
  teacher: string;
  name: string;
  email: string;
  level: string;
  status: 'Active' | 'Paused' | 'Archived';
  lessonFeeAmount?: string;
  lessonFeePeriod?: 'Per Mo' | 'Per Qtr' | 'Per Yr';
  lessonDay?: string;
  lessonTime?: string;
  lessonDuration?: '30M' | '45M' | '1HR';
  lessonType?: 'Individual' | 'Group';
  lessonLocation?: 'In-Person' | 'Virtual' | 'Home-Visit';
  lessonNotes?: string;
  studentAlert?: string;
  createdAt: string;
  updatedAt: string;
};

const parseTimeToMinutes = (value?: string) => {
  if (!value) return null;
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3].toUpperCase();
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  const normalizedHours = hours % 12;
  const offset = period === 'PM' ? 12 * 60 : 0;
  return normalizedHours * 60 + minutes + offset;
};

export default function TeacherDashboardPage() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(now),
    [now],
  );
  const todayLessons = useMemo(() => {
    const students = studentsData.students as StudentRecord[];
    return students.filter(
      student =>
        student.status === 'Active' &&
        student.lessonDay &&
        student.lessonDay.toLowerCase() === todayLabel.toLowerCase(),
    );
  }, [todayLabel]);
  const sortedTodayLessons = useMemo(() => {
    return [...todayLessons].sort((a, b) => {
      const aMinutes = parseTimeToMinutes(a.lessonTime) ?? 0;
      const bMinutes = parseTimeToMinutes(b.lessonTime) ?? 0;
      return aMinutes - bMinutes;
    });
  }, [todayLessons]);
  const nextStudent = useMemo(() => {
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const upcoming = sortedTodayLessons.find(student => {
      const minutes = parseTimeToMinutes(student.lessonTime);
      return minutes !== null && minutes >= nowMinutes;
    });
    return upcoming ?? null;
  }, [now, sortedTodayLessons]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <header>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
            Teachers
          </p>
          <h1 className="text-3xl font-semibold text-[var(--c-1f1f1d)] mt-2">
            Dashboard
          </h1>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            Your studio snapshot, schedule, and fees in one place.
          </p>
        </header>
      </div>
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Today&apos;s Lessons
          </p>
          <p className="mt-3 text-3xl font-semibold text-[var(--c-1f1f1d)]">
            {sortedTodayLessons.length}
          </p>
          <p className="mt-1 text-sm text-[var(--c-6f6c65)]">
            Scheduled for {todayLabel}.
          </p>
          <div className="mt-4 space-y-2 text-sm text-[var(--c-3a3935)]">
            {sortedTodayLessons.length > 0 ? (
              sortedTodayLessons.slice(0, 3).map(student => (
                <div
                  key={student.id}
                  className="flex items-center justify-between rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2"
                >
                  <span className="font-medium">{student.name}</span>
                  <span className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                    {student.lessonTime ?? 'TBD'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--c-6f6c65)]">
                No lessons scheduled today.
              </p>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Next Student
          </p>
          {nextStudent ? (
            <>
              <p className="mt-3 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                {nextStudent.name}
              </p>
              <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                {nextStudent.lessonTime ?? 'Time TBD'} ·{' '}
                {nextStudent.lessonType ?? 'Lesson'} ·{' '}
                {nextStudent.level ?? 'Level'}
              </p>
            </>
          ) : (
            <>
              <p className="mt-3 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                No upcoming lesson
              </p>
              <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                You&apos;re clear for the rest of {todayLabel}.
              </p>
            </>
          )}
        </div>
        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Current Date/Time
          </p>
          <p className="mt-3 text-2xl font-semibold text-[var(--c-1f1f1d)]">
            {new Intl.DateTimeFormat('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            }).format(now)}
          </p>
          <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
            {new Intl.DateTimeFormat('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            }).format(now)}
          </p>
        </div>
      </section>
    </div>
  );
}
