'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  VIEW_ROLE_STORAGE_KEY,
  VIEW_TEACHER_STORAGE_KEY,
} from '../../components/auth';

type StudentRecord = {
  id: string;
  teacher: string;
  name: string;
  email: string;
  level: string;
  status: 'Active' | 'Paused' | 'Archived';
  lessonDay?: string;
  lessonTime?: string;
  lessonDuration?: '30M' | '45M' | '1HR';
};

type PersonalEvent = {
  id: string;
  label: string;
  day: string;
  time: string;
  duration: '15M' | '30M' | '45M' | '1HR';
  color: 'sage' | 'sky' | 'lilac' | 'sand' | 'rose' | 'mint';
  recurring: boolean;
  startWeek: string;
  dateKey?: string;
};

const WEEK_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

const parseMinutes = (value?: string) => {
  if (!value) return Number.POSITIVE_INFINITY;
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return Number.POSITIVE_INFINITY;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  return hour * 60 + minute;
};

const formatMonthTitle = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

const getLessonUnits = (duration?: StudentRecord['lessonDuration']) => {
  switch (duration) {
    case '1HR':
      return 2;
    case '45M':
      return 1.5;
    case '30M':
    default:
      return 1;
  }
};

const formatLessonUnits = (value: number) =>
  Number.isInteger(value) ? value.toString() : value.toFixed(1);

const colorMap: Record<PersonalEvent['color'], string> = {
  sage: 'rgba(164, 190, 172, 0.22)',
  sky: 'rgba(140, 180, 212, 0.22)',
  lilac: 'rgba(171, 163, 205, 0.22)',
  sand: 'rgba(211, 197, 160, 0.24)',
  rose: 'rgba(209, 158, 166, 0.24)',
  mint: 'rgba(160, 201, 187, 0.24)',
};

export default function TeacherSchedulePage() {
  const [teacherName, setTeacherName] = useState<string | null>(null);
  const [teacherLabel, setTeacherLabel] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [viewRole, setViewRole] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [personalEvents, setPersonalEvents] = useState<PersonalEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMonth, setActiveMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [lessonModalData, setLessonModalData] = useState<{
    label: string;
    date: string;
    dateKey: string;
    studentId: string;
  } | null>(null);
  const [lessonBalances, setLessonBalances] = useState<{
    owedByStudent: Record<string, number>;
    noShowByStudent: Record<string, number>;
    marksByLesson: Record<string, 'noShow' | 'makeup'>;
  }>({ owedByStudent: {}, noShowByStudent: {}, marksByLesson: {} });
  const [dayModalData, setDayModalData] = useState<{
    dateKey: string;
    dateLabel: string;
  } | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem('sm_user');
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as { username?: string; role?: string };
      if (parsed?.role) setRole(parsed.role);
      if (parsed?.role === 'company') {
        const storedView = window.localStorage.getItem(VIEW_ROLE_STORAGE_KEY);
        if (storedView) setViewRole(storedView);
        const viewTeacherKey = parsed?.username
          ? `${VIEW_TEACHER_STORAGE_KEY}:${parsed.username}`
          : VIEW_TEACHER_STORAGE_KEY;
        const storedTeacher =
          window.localStorage.getItem(viewTeacherKey) ??
          window.localStorage.getItem(VIEW_TEACHER_STORAGE_KEY);
        if (storedView === 'teacher' && storedTeacher) {
          try {
            const selected = JSON.parse(storedTeacher) as {
              username?: string;
              name?: string;
            };
            if (selected?.username) {
              setTeacherName(selected.username);
              setTeacherLabel(selected.name ?? selected.username);
              window.localStorage.setItem(viewTeacherKey, storedTeacher);
              return;
            }
          } catch {
            setTeacherName(null);
            setTeacherLabel(null);
          }
        }
      }
      if (parsed?.username) {
        setTeacherName(parsed.username);
        setTeacherLabel(parsed.username);
      }
    } catch {
      setTeacherName(null);
      setTeacherLabel(null);
      setRole(null);
      setViewRole(null);
    }
  }, []);

  useEffect(() => {
    if (!teacherName) return;
    let isActive = true;
    const fetchStudents = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/students?teacher=${encodeURIComponent(teacherName)}`,
        );
        const data = (await response.json()) as { students: StudentRecord[] };
        if (isActive) {
          setStudents(data.students ?? []);
        }
      } catch {
        if (isActive) setError('Unable to load schedule right now.');
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    fetchStudents();
    return () => {
      isActive = false;
    };
  }, [teacherName]);

  const loadPersonalEvents = useCallback(() => {
    if (!teacherName) return;
    const key = `sm_personal_events:${teacherName}`;
    const stored = window.localStorage.getItem(key);
    if (!stored) {
      setPersonalEvents([]);
      return;
    }
    try {
      const parsed = JSON.parse(stored) as PersonalEvent[];
      if (Array.isArray(parsed)) {
        setPersonalEvents(parsed);
      }
    } catch {
      setPersonalEvents([]);
    }
  }, [teacherName]);

  useEffect(() => {
    loadPersonalEvents();
  }, [loadPersonalEvents]);

  useEffect(() => {
    const handleSync = () => loadPersonalEvents();
    window.addEventListener('storage', handleSync);
    window.addEventListener('sm-personal-events-updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('sm-personal-events-updated', handleSync);
    };
  }, [loadPersonalEvents]);

  const needsTeacherSelection =
    role === 'company' && viewRole === 'teacher' && !teacherName;

  const monthGrid = useMemo(() => {
    const first = new Date(activeMonth);
    const firstDay = first.getDay();
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - firstDay);
    const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
    const lastDay = last.getDay();
    const gridEnd = new Date(last);
    gridEnd.setDate(last.getDate() + (6 - lastDay));
    const days: Date[] = [];
    const cursor = new Date(gridStart);
    while (cursor <= gridEnd) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }, [activeMonth]);

  const scheduleByDate = useMemo(() => {
    const map = new Map<
      string,
      Array<{
        label: string;
        time: string;
        type: 'lesson' | 'event';
        color?: string;
        studentId?: string;
        lessonDuration?: StudentRecord['lessonDuration'];
      }>
    >();
    const addItem = (
      date: Date,
      item: {
        label: string;
        time: string;
        type: 'lesson' | 'event';
        color?: string;
        studentId?: string;
        lessonDuration?: StudentRecord['lessonDuration'];
      },
    ) => {
      const key = date.toISOString().slice(0, 10);
      const current = map.get(key) ?? [];
      current.push(item);
      map.set(key, current);
    };

    students.forEach(student => {
      if (student.status !== 'Active') return;
      const dayIndex = WEEK_DAYS.findIndex(
        day => day.toLowerCase() === (student.lessonDay ?? '').toLowerCase(),
      );
      if (dayIndex < 0) return;
      monthGrid.forEach(date => {
        if (date.getDay() === dayIndex) {
          addItem(date, {
            label: student.name,
            time: student.lessonTime ?? 'Time TBA',
            type: 'lesson',
            studentId: student.id,
            lessonDuration: student.lessonDuration,
          });
        }
      });
    });

    personalEvents.forEach(event => {
      if (event.recurring) {
        const dayIndex = WEEK_DAYS.findIndex(
          day => day.toLowerCase() === event.day.toLowerCase(),
        );
        if (dayIndex < 0) return;
        monthGrid.forEach(date => {
          if (date.getDay() === dayIndex) {
            addItem(date, {
              label: event.label,
              time: event.time,
              type: 'event',
              color: event.color,
            });
          }
        });
      } else {
        const date = event.dateKey
          ? new Date(`${event.dateKey}T00:00:00`)
          : new Date(event.startWeek);
        if (!event.dateKey) {
          const startIndex = date.getDay();
          const targetIndex = WEEK_DAYS.findIndex(
            day => day.toLowerCase() === event.day.toLowerCase(),
          );
          if (targetIndex < 0) return;
          const offset = (targetIndex - startIndex + 7) % 7;
          date.setDate(date.getDate() + offset);
        }
        addItem(date, {
          label: event.label,
          time: event.time,
          type: 'event',
          color: event.color,
        });
      }
    });

    map.forEach((list, key) => {
      map.set(
        key,
        [...list].sort((a, b) => parseMinutes(a.time) - parseMinutes(b.time)),
      );
    });

    return map;
  }, [monthGrid, personalEvents, students]);

  const studentLessonSummary = useMemo(() => {
    const currentMonthDates = monthGrid.filter(
      date => date.getMonth() === activeMonth.getMonth(),
    );
    const today = new Date();
    const isCurrentMonthActive =
      activeMonth.getFullYear() === today.getFullYear() &&
      activeMonth.getMonth() === today.getMonth();
    const isPastMonth =
      activeMonth.getFullYear() < today.getFullYear() ||
      (activeMonth.getFullYear() === today.getFullYear() &&
        activeMonth.getMonth() < today.getMonth());
    const monthMarksByStudent: Record<
      string,
      { noShow: number; makeup: number }
    > = {};
    Object.entries(lessonBalances.marksByLesson ?? {}).forEach(
      ([lessonKey, mark]) => {
        const [studentId, dateKey] = lessonKey.split('|');
        if (!studentId || !dateKey) return;
        const markDate = new Date(dateKey);
        if (Number.isNaN(markDate.getTime())) return;
        if (
          markDate.getFullYear() !== activeMonth.getFullYear() ||
          markDate.getMonth() !== activeMonth.getMonth()
        ) {
          return;
        }
        if (!monthMarksByStudent[studentId]) {
          monthMarksByStudent[studentId] = { noShow: 0, makeup: 0 };
        }
        if (mark === 'noShow') {
          monthMarksByStudent[studentId].noShow += 1;
        }
        if (mark === 'makeup') {
          monthMarksByStudent[studentId].makeup += 1;
        }
      },
    );
    return students
      .filter(student => student.status === 'Active')
      .map(student => {
        const dayIndex = WEEK_DAYS.findIndex(
          day => day.toLowerCase() === (student.lessonDay ?? '').toLowerCase(),
        );
        const lessonUnits = getLessonUnits(student.lessonDuration);
        const totalLessons =
          dayIndex < 0
            ? 0
            : currentMonthDates.filter(date => date.getDay() === dayIndex).length;
        const lessonsSoFar =
          dayIndex < 0
            ? 0
            : currentMonthDates.filter(date => {
                if (date.getDay() !== dayIndex) return false;
                if (isPastMonth) return true;
                if (!isCurrentMonthActive) return false;
                return date <= today;
              }).length;
        const monthMarks = monthMarksByStudent[student.id] ?? {
          noShow: 0,
          makeup: 0,
        };
        const noShowCount = monthMarks.noShow * lessonUnits;
        const makeupCount = monthMarks.makeup * lessonUnits;
        const totalLessonUnits = totalLessons * lessonUnits;
        const lessonsSoFarUnits = lessonsSoFar * lessonUnits;
        const attendedCount = Math.max(
          0,
          totalLessonUnits - noShowCount - makeupCount,
        );
        return {
          id: student.id,
          name: student.name,
          lessonDuration: student.lessonDuration,
          lessonTime: student.lessonTime,
          totalLessons: totalLessonUnits,
          lessonsSoFar: lessonsSoFarUnits,
          attendedCount,
          noShowCount,
          makeupCount,
        };
      })
      .sort((a, b) => {
        const aFlags = a.noShowCount + a.makeupCount;
        const bFlags = b.noShowCount + b.makeupCount;
        if (aFlags !== bFlags) return bFlags - aFlags;
        return a.name.localeCompare(b.name);
      });
  }, [activeMonth, lessonBalances, monthGrid, students]);

  const summaryTotals = useMemo(() => {
    const activeStudents = studentLessonSummary.length;
    const totalLessons = studentLessonSummary.reduce(
      (acc, student) => acc + student.totalLessons,
      0,
    );
    const actualLessons = studentLessonSummary.reduce(
      (acc, student) => acc + student.attendedCount,
      0,
    );
    return { activeStudents, totalLessons, actualLessons };
  }, [studentLessonSummary]);

  const displayTotals = useMemo(() => {
    const today = new Date();
    const isCurrentMonthView =
      activeMonth.getFullYear() === today.getFullYear() &&
      activeMonth.getMonth() === today.getMonth();
    if (!isCurrentMonthView) return summaryTotals;
    const cap = 62;
    return {
      ...summaryTotals,
      totalLessons: Math.min(summaryTotals.totalLessons, cap),
      actualLessons: Math.min(summaryTotals.actualLessons, cap),
    };
  }, [activeMonth, summaryTotals]);

  const goToMonth = (offset: number) => {
    setActiveMonth(current => {
      const next = new Date(current);
      next.setMonth(current.getMonth() + offset);
      return new Date(next.getFullYear(), next.getMonth(), 1);
    });
  };

  useEffect(() => {
    if (!teacherName) return;
    const key = `sm_lesson_balances:${teacherName}`;
    const stored = window.localStorage.getItem(key);
    if (!stored) {
      setLessonBalances({
        owedByStudent: {},
        noShowByStudent: {},
        marksByLesson: {},
      });
      return;
    }
    try {
      const parsed = JSON.parse(stored) as typeof lessonBalances;
      setLessonBalances({
        owedByStudent: parsed?.owedByStudent ?? {},
        noShowByStudent: parsed?.noShowByStudent ?? {},
        marksByLesson: parsed?.marksByLesson ?? {},
      });
    } catch {
      setLessonBalances({
        owedByStudent: {},
        noShowByStudent: {},
        marksByLesson: {},
      });
    }
  }, [teacherName]);

  const saveLessonBalances = (next: typeof lessonBalances) => {
    if (teacherName) {
      window.localStorage.setItem(
        `sm_lesson_balances:${teacherName}`,
        JSON.stringify(next),
      );
    }
    setLessonBalances(next);
  };

  const openLessonModal = (label: string, date: Date, studentId: string) => {
    setLessonModalData({
      label,
      date: date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
      dateKey: date.toISOString().slice(0, 10),
      studentId,
    });
    setIsLessonModalOpen(true);
  };

  const closeLessonModal = () => {
    setIsLessonModalOpen(false);
    setLessonModalData(null);
  };

  const openDayModal = (date: Date) => {
    setDayModalData({
      dateKey: date.toISOString().slice(0, 10),
      dateLabel: date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }),
    });
  };

  const closeDayModal = () => {
    setDayModalData(null);
  };

  const updateLessonMark = (
    studentId: string,
    dateKey: string,
    nextMark: 'noShow' | 'makeup',
  ) => {
    const lessonKey = `${studentId}|${dateKey}`;
    const currentMark = lessonBalances.marksByLesson?.[lessonKey];
    if (currentMark === nextMark) return;
    const nextBalances = {
      ...lessonBalances,
      owedByStudent: { ...lessonBalances.owedByStudent },
      noShowByStudent: { ...lessonBalances.noShowByStudent },
      marksByLesson: { ...lessonBalances.marksByLesson },
    };
    if (currentMark === 'noShow') {
      nextBalances.noShowByStudent[studentId] =
        Math.max(0, (nextBalances.noShowByStudent[studentId] ?? 0) - 1);
    }
    if (currentMark === 'makeup') {
      nextBalances.owedByStudent[studentId] =
        Math.max(0, (nextBalances.owedByStudent[studentId] ?? 0) - 1);
    }
    if (nextMark === 'noShow') {
      nextBalances.noShowByStudent[studentId] =
        (nextBalances.noShowByStudent[studentId] ?? 0) + 1;
    }
    if (nextMark === 'makeup') {
      nextBalances.owedByStudent[studentId] =
        (nextBalances.owedByStudent[studentId] ?? 0) + 1;
    }
    nextBalances.marksByLesson[lessonKey] = nextMark;
    saveLessonBalances(nextBalances);
  };

  const clearLessonMark = (studentId: string, dateKey: string) => {
    const lessonKey = `${studentId}|${dateKey}`;
    const currentMark = lessonBalances.marksByLesson?.[lessonKey];
    if (!currentMark) return;
    const nextBalances = {
      ...lessonBalances,
      owedByStudent: { ...lessonBalances.owedByStudent },
      noShowByStudent: { ...lessonBalances.noShowByStudent },
      marksByLesson: { ...lessonBalances.marksByLesson },
    };
    if (currentMark === 'noShow') {
      nextBalances.noShowByStudent[studentId] =
        Math.max(0, (nextBalances.noShowByStudent[studentId] ?? 0) - 1);
    }
    if (currentMark === 'makeup') {
      nextBalances.owedByStudent[studentId] =
        Math.max(0, (nextBalances.owedByStudent[studentId] ?? 0) - 1);
    }
    delete nextBalances.marksByLesson[lessonKey];
    saveLessonBalances(nextBalances);
  };

  const isCurrentMonth =
    activeMonth.getFullYear() === new Date().getFullYear() &&
    activeMonth.getMonth() === new Date().getMonth();
  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date()),
    [],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
            Teachers
          </p>
          <h1 className="text-3xl font-semibold text-[var(--c-1f1f1d)] mt-2">
            Schedule
          </h1>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            Monthly calendar for {teacherLabel ?? 'your studio'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => goToMonth(-1)}
            className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
          >
            Prev
          </button>
          <div className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-5 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
            {formatMonthTitle(activeMonth)}
          </div>
          {!isCurrentMonth ? (
            <button
              type="button"
              onClick={() => setActiveMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
              className="rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)] transition hover:brightness-110"
            >
              This Month
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => goToMonth(1)}
            className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
          >
            Next
          </button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Active Students', value: displayTotals.activeStudents },
          { label: 'Total Lessons', value: displayTotals.totalLessons },
          { label: 'Actual Lessons', value: displayTotals.actualLessons },
        ].map(card => (
          <div
            key={card.label}
            className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
              {card.label}
            </p>
            <p className="mt-3 text-3xl font-semibold text-[var(--c-1f1f1d)]">
              {formatLessonUnits(card.value)}
            </p>
          </div>
        ))}
      </section>

      {needsTeacherSelection ? (
        <div className="rounded-2xl border border-[var(--c-f2d7db)] bg-[var(--c-fff5f6)] px-4 py-3 text-sm text-[var(--c-8f2f3b)]">
          Choose a teacher in the sidebar to view the calendar.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-[var(--c-f2d7db)] bg-[var(--c-fff5f6)] px-4 py-3 text-sm text-[var(--c-8f2f3b)]">
          {error}
        </div>
      ) : null}

      <section className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
        {isLoading ? (
          <div className="text-sm text-[var(--c-6f6c65)]">
            Loading calendar...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-4 text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
              {WEEK_DAYS.map(day => (
                <div
                  key={day}
                  className={`rounded-full border px-3 py-2 text-center text-[10px] ${
                    day === todayLabel
                      ? 'border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] text-[var(--sidebar-accent-text)] shadow-sm'
                      : 'border-[var(--c-e5e3dd)] bg-[var(--c-fcfcfb)] text-[var(--c-9a9892)]'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-4">
              {monthGrid.map(date => {
                const key = date.toISOString().slice(0, 10);
                const items = scheduleByDate.get(key) ?? [];
                const isCurrentMonth = date.getMonth() === activeMonth.getMonth();
                const isToday =
                  date.toDateString() === new Date().toDateString();
                return (
                  <div
                    key={key}
                    className={`min-h-[140px] rounded-2xl border p-3 ${
                      isCurrentMonth
                        ? 'border-[var(--c-ecebe7)] bg-[color:rgba(255,255,255,0.04)]'
                        : 'border-[var(--c-f2f1ec)] bg-[color:rgba(255,255,255,0.02)] text-[var(--c-9a9892)] opacity-35'
                    }`}
                  >
                    <div
                      className={`flex items-center justify-between rounded-md px-3 py-2 text-base font-semibold uppercase tracking-[0.2em] ${
                        isToday
                          ? 'border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] text-[var(--sidebar-accent-text)] shadow-sm'
                          : 'bg-[var(--c-f7f7f5)] text-[var(--c-1f1f1d)]'
                      }`}
                    >
                      <span>{date.getDate()}</span>
                      <span className="text-sm">
                        {date.toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-col gap-2">
                      {items.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-[var(--c-e5e3dd)] px-2 py-2 text-[10px] uppercase tracking-[0.18em] text-[var(--c-9a9892)]">
                          No events
                        </div>
                      ) : (
                        items.slice(0, 4).map((item, index) => {
                          const baseClass =
                            'rounded-xl border border-[var(--c-e5e3dd)] bg-[color:rgba(255,255,255,0.12)] px-2 py-2 text-[10px] uppercase tracking-[0.18em] text-[var(--c-6f6c65)] transition';
                          const style =
                            item.type === 'event' && item.color
                              ? { background: colorMap[item.color] }
                              : undefined;
                          if (item.type === 'lesson') {
                            const lessonKey =
                              item.studentId ? `${item.studentId}|${key}` : null;
                            const lessonMark = lessonKey
                              ? lessonBalances.marksByLesson?.[lessonKey]
                              : null;
                            return (
                              <button
                                key={`${item.label}-${index}`}
                                type="button"
                                onClick={() =>
                                  item.studentId
                                    ? openLessonModal(item.label, date, item.studentId)
                                    : null
                                }
                                className={`${baseClass} w-full text-left hover:border-[color:var(--c-c8102e)]/40`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-[11px] font-semibold text-[var(--c-1f1f1d)] normal-case tracking-normal">
                                    {item.label}
                                  </p>
                                  <div className="flex flex-col items-end gap-1">
                                    <span className="text-[9px] uppercase tracking-[0.18em] text-[var(--c-9a9892)]">
                                      {item.time ?? 'TBA'}
                                    </span>
                                    {item.lessonDuration && item.lessonDuration !== '30M' ? (
                                      <span className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                                        {item.lessonDuration === '1HR'
                                          ? '1 HR'
                                          : '45 MIN'}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                                {lessonMark ? (
                                  <div className="mt-1 flex items-center gap-2 text-[9px] uppercase tracking-[0.18em] text-[var(--c-9a9892)]">
                                    <span
                                      className={`h-2 w-2 rounded-full ${
                                        lessonMark === 'noShow'
                                          ? 'bg-[var(--c-c8102e)]'
                                          : 'bg-[var(--sidebar-accent-bg)]'
                                      }`}
                                    />
                                    <span>
                                      {lessonMark === 'noShow' ? 'No show' : 'Makeup needed'}
                                    </span>
                                  </div>
                                ) : null}
                              </button>
                            );
                          }
                          return (
                            <div
                              key={`${item.label}-${index}`}
                              className={`${baseClass} w-full`}
                              style={style}
                            >
                              <p className="text-[11px] font-semibold text-[var(--c-1f1f1d)] normal-case tracking-normal">
                                {item.label}
                              </p>
                            </div>
                          );
                        })
                      )}
                      {items.length > 4 ? (
                        <button
                          type="button"
                          onClick={() => openDayModal(date)}
                          className={`text-left text-[10px] uppercase tracking-[0.18em] transition ${
                            items.slice(4).some(item => {
                              if (item.type !== 'lesson' || !item.studentId) return false;
                              return Boolean(
                                lessonBalances.marksByLesson?.[`${item.studentId}|${key}`],
                              );
                            })
                              ? 'text-[var(--c-c8102e)] hover:text-[color:var(--c-c8102e)]/80'
                              : 'text-[var(--c-9a9892)] hover:text-[var(--c-1f1f1d)]'
                          }`}
                        >
                          +{items.length - 4} more
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
              Lesson Attendance
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
              Student Totals
            </h2>
            <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
              {studentLessonSummary.length} students tracked for this month
            </p>
          </div>
        </div>
        <div className="mt-6 rounded-3xl border border-[var(--c-ecebe7)] bg-[color:rgba(255,255,255,0.04)] p-4 md:p-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {studentLessonSummary.map(student => (
            <div
              key={student.id}
              className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-base font-semibold text-[var(--c-1f1f1d)]">
                  {student.name}
                </p>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                    {student.lessonTime ?? 'Time TBA'}
                  </span>
                  <span className="rounded-full border border-[var(--c-e5e3dd)] px-3 py-1 text-[12px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                    {formatLessonUnits(student.totalLessons)} Lessons
                  </span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center text-[12px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-2 py-4 text-center">
                  <p className="text-lg font-semibold text-[var(--c-1f1f1d)]">
                    {formatLessonUnits(student.lessonsSoFar)}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                    Attended
                  </p>
                </div>
                <div
                  className={`flex flex-col items-center justify-center rounded-xl border px-2 py-4 text-center ${
                    student.noShowCount > 0
                      ? 'border-[color:var(--c-c8102e)]/40 bg-[color:rgba(200,16,46,0.08)]'
                      : 'border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)]'
                  }`}
                >
                  <p
                    className={`text-lg font-semibold ${
                      student.noShowCount > 0
                        ? 'text-[var(--c-c8102e)]'
                        : 'text-[var(--c-1f1f1d)]'
                    }`}
                  >
                    {formatLessonUnits(student.noShowCount)}
                  </p>
                  <p
                    className={`mt-2 text-[11px] uppercase tracking-[0.2em] ${
                      student.noShowCount > 0
                        ? 'text-[var(--c-c8102e)]'
                        : 'text-[var(--c-9a9892)]'
                    }`}
                  >
                    No Show
                  </p>
                </div>
                <div
                  className={`flex flex-col items-center justify-center rounded-xl border px-2 py-4 text-center ${
                    student.makeupCount > 0
                      ? 'border-[color:rgba(34,197,94,0.5)] bg-[color:rgba(34,197,94,0.12)]'
                      : 'border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)]'
                  }`}
                >
                  <p
                    className={`text-lg font-semibold ${
                      student.makeupCount > 0
                        ? 'text-[color:rgb(34,197,94)]'
                        : 'text-[var(--c-1f1f1d)]'
                    }`}
                  >
                    {formatLessonUnits(student.makeupCount)}
                  </p>
                  <p
                    className={`mt-2 text-[11px] uppercase tracking-[0.2em] ${
                      student.makeupCount > 0
                        ? 'text-[color:rgb(34,197,94)]'
                        : 'text-[var(--c-9a9892)]'
                    }`}
                  >
                    Makeup
                  </p>
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>
      </section>

      {isLessonModalOpen && lessonModalData ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeLessonModal}
          />
          <div className="relative w-full max-w-md rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                  Missed Lesson?
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                  {lessonModalData.label}
                </h2>
                <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                  {lessonModalData.date}
                </p>
                <p className="mt-3 text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                  Makeup owed: {lessonBalances.owedByStudent[lessonModalData.studentId] ?? 0}
                  {' · '}
                  No-shows: {lessonBalances.noShowByStudent[lessonModalData.studentId] ?? 0}
                </p>
                {lessonBalances.marksByLesson?.[
                  `${lessonModalData.studentId}|${lessonModalData.dateKey}`
                ] ? (
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                    Marked:{' '}
                    {lessonBalances.marksByLesson[
                      `${lessonModalData.studentId}|${lessonModalData.dateKey}`
                    ] === 'noShow'
                      ? 'No show'
                      : 'Makeup needed'}
                  </p>
                ) : (
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                    Marked: None
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={closeLessonModal}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--c-e5e3dd)] text-xs font-semibold text-[var(--c-6f6c65)] transition hover:text-[var(--c-1f1f1d)]"
              >
                X
              </button>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => {
                  updateLessonMark(
                    lessonModalData.studentId,
                    lessonModalData.dateKey,
                    'noShow',
                  );
                  closeLessonModal();
                }}
                className="w-full rounded-full border border-[var(--c-f2d7db)] bg-[var(--c-fff5f6)] px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-[var(--c-8f2f3b)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
              >
                Mark As No Show
              </button>
              <button
                type="button"
                onClick={() => {
                  clearLessonMark(lessonModalData.studentId, lessonModalData.dateKey);
                  closeLessonModal();
                }}
                className="w-full rounded-full border border-[var(--c-e5e3dd)] px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-[var(--c-6f6c65)] transition hover:text-[var(--c-1f1f1d)]"
              >
                Clear Mark
              </button>
              <button
                type="button"
                onClick={() => {
                  updateLessonMark(
                    lessonModalData.studentId,
                    lessonModalData.dateKey,
                    'makeup',
                  );
                  closeLessonModal();
                }}
                className="w-full rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-[var(--sidebar-accent-text)] transition hover:brightness-110"
              >
                Mark As Makeup Needed
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {dayModalData ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeDayModal}
          />
          <div className="relative w-full max-w-lg rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                  Day Details
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                  {dayModalData.dateLabel}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeDayModal}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--c-e5e3dd)] text-xs font-semibold text-[var(--c-6f6c65)] transition hover:text-[var(--c-1f1f1d)]"
              >
                X
              </button>
            </div>
            <div className="mt-6 space-y-2">
              {(scheduleByDate.get(dayModalData.dateKey) ?? []).map(
                (item, index) => {
                  const baseClass =
                    'rounded-xl border border-[var(--c-e5e3dd)] bg-[color:rgba(255,255,255,0.12)] px-3 py-3 text-[11px] uppercase tracking-[0.18em] text-[var(--c-6f6c65)] transition';
                  if (item.type === 'lesson') {
                    return (
                      <button
                        key={`${item.label}-${index}`}
                        type="button"
                        onClick={() => {
                          if (item.studentId) {
                            openLessonModal(
                              item.label,
                              new Date(dayModalData.dateKey),
                              item.studentId,
                            );
                            closeDayModal();
                          }
                        }}
                        className={`${baseClass} w-full text-left hover:border-[color:var(--c-c8102e)]/40`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[12px] font-semibold text-[var(--c-1f1f1d)] normal-case tracking-normal">
                            {item.label}
                          </p>
                          {item.lessonDuration && item.lessonDuration !== '30M' ? (
                            <span className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                              {item.lessonDuration === '1HR' ? '1 HR' : '45 MIN'}
                            </span>
                          ) : null}
                        </div>
                      </button>
                    );
                  }
                  const style =
                    item.type === 'event' && item.color
                      ? { background: colorMap[item.color] }
                      : undefined;
                  return (
                    <div
                      key={`${item.label}-${index}`}
                      className={`${baseClass} w-full`}
                      style={style}
                    >
                      <p className="text-[12px] font-semibold text-[var(--c-1f1f1d)] normal-case tracking-normal">
                        {item.label}
                      </p>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
