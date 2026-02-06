'use client';

import { useEffect, useMemo, useState } from 'react';
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
  lessonType?: 'Individual' | 'Group';
};

type WeekDay = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

const WEEK_DAYS: WeekDay[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const dayIndex = (day?: string) => {
  if (!day) return -1;
  const normalized = day.trim().toLowerCase();
  return WEEK_DAYS.findIndex(item => item.toLowerCase() === normalized);
};

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

const durationMinutes = (value?: StudentRecord['lessonDuration'] | '15M') => {
  if (value === '15M') return 15;
  if (value === '45M') return 45;
  if (value === '1HR') return 60;
  return 30;
};

const formatGap = (minutes: number) => {
  if (minutes <= 0) return '';
  if (minutes < 60) return `${minutes} min gap`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder
    ? `${hours} hr ${remainder} min gap`
    : `${hours} hr gap`;
};

const formatDate = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const formatWeekRange = (start: Date, end: Date) =>
  `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

const formatDurationLabel = (value?: StudentRecord['lessonDuration'] | '15M') => {
  if (value === '1HR') return '1 hr';
  if (value === '45M') return '45 min';
  if (value === '30M') return '30 min';
  if (value === '15M') return '15 min';
  return '30 min';
};

export default function TeacherThisWeekPage() {
  const [teacherName, setTeacherName] = useState<string | null>(null);
  const [teacherLabel, setTeacherLabel] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [viewRole, setViewRole] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekStartDay, setWeekStartDay] = useState<WeekDay>('Sunday');
  const [weekOffset, setWeekOffset] = useState(0);
  const [personalEvents, setPersonalEvents] = useState<
    {
      id: string;
      label: string;
      day: WeekDay;
      time: string;
      duration: '15M' | '30M' | '45M' | '1HR';
      color: 'sage' | 'sky' | 'lilac' | 'sand' | 'rose' | 'mint';
      recurring: boolean;
      startWeek: string;
    }[]
  >([]);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState({
    day: 'Sunday' as WeekDay,
    hour: '4',
    minute: '00',
    period: 'PM',
    duration: '30M' as '15M' | '30M' | '45M' | '1HR',
    color: 'sage' as 'sage' | 'sky' | 'lilac' | 'sand' | 'rose' | 'mint',
    label: '',
    recurring: false,
  });

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
    const key = `sm_week_start_day:${teacherName}`;
    const stored = window.localStorage.getItem(key);
    if (stored && WEEK_DAYS.includes(stored as WeekDay)) {
      setWeekStartDay(stored as WeekDay);
    }
  }, [teacherName]);

  useEffect(() => {
    if (!teacherName) return;
    const key = `sm_personal_events:${teacherName}`;
    const stored = window.localStorage.getItem(key);
    if (!stored) {
      setPersonalEvents([]);
      return;
    }
    try {
      const parsed = JSON.parse(stored) as typeof personalEvents;
      if (Array.isArray(parsed)) {
        setPersonalEvents(parsed);
      }
    } catch {
      setPersonalEvents([]);
    }
  }, [teacherName]);

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

  useEffect(() => {
    if (!teacherName || role !== 'teacher') return;
    let isActive = true;
    const fetchTeacherName = async () => {
      try {
        const response = await fetch(
          `/api/account?username=${encodeURIComponent(teacherName)}&role=teacher`,
        );
        if (!response.ok) return;
        const data = (await response.json()) as {
          account?: { name?: string };
        };
        if (isActive && data.account?.name) {
          setTeacherLabel(data.account.name);
        }
      } catch {
        // ignore lookup errors
      }
    };
    fetchTeacherName();
    return () => {
      isActive = false;
    };
  }, [role, teacherName]);

  const needsTeacherSelection =
    role === 'company' && viewRole === 'teacher' && !teacherName;

  const orderedWeekDays = useMemo(() => {
    const startIndex = WEEK_DAYS.indexOf(weekStartDay);
    return WEEK_DAYS.slice(startIndex).concat(WEEK_DAYS.slice(0, startIndex));
  }, [weekStartDay]);

  const weekDates = useMemo(() => {
    const today = new Date();
    const base = new Date(today);
    base.setDate(today.getDate() + weekOffset * 7);
    const baseIndex = base.getDay();
    const startIndex = WEEK_DAYS.indexOf(weekStartDay);
    const offset = (baseIndex - startIndex + 7) % 7;
    const start = new Date(base);
    start.setDate(base.getDate() - offset);
    start.setHours(0, 0, 0, 0);
    return orderedWeekDays.map((day, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return { day, date };
    });
  }, [orderedWeekDays, weekOffset, weekStartDay]);

  const weekStart = weekDates[0]?.date ?? new Date();
  const weekEnd = weekDates[6]?.date ?? new Date();

  const currentWeekKey = useMemo(() => {
    const date = new Date(weekStart);
    date.setHours(0, 0, 0, 0);
    return date.toISOString().slice(0, 10);
  }, [weekStart]);

  const scheduleByDay = useMemo(() => {
    const map = new Map<
      WeekDay,
      Array<
        | (StudentRecord & { kind: 'lesson' })
        | {
            id: string;
            label: string;
            day: WeekDay;
            time: string;
            duration: '15M' | '30M' | '45M' | '1HR';
            color: 'sage' | 'sky' | 'lilac' | 'sand' | 'rose' | 'mint';
            recurring: boolean;
            startWeek: string;
            kind: 'event';
          }
      >
    >();
    WEEK_DAYS.forEach(day => map.set(day, []));
    students.forEach(student => {
      if (student.status !== 'Active') return;
      const index = dayIndex(student.lessonDay);
      if (index < 0) return;
      const day = WEEK_DAYS[index];
      const current = map.get(day) ?? [];
      current.push({ ...student, kind: 'lesson' });
      map.set(day, current);
    });
    personalEvents.forEach(event => {
      if (!event.recurring && event.startWeek !== currentWeekKey) return;
      const current = map.get(event.day) ?? [];
      current.push({ ...event, kind: 'event' });
      map.set(event.day, current);
    });
    map.forEach((list, day) => {
      map.set(
        day,
        [...list].sort(
          (a, b) =>
            parseMinutes(
              a.kind === 'lesson' ? a.lessonTime : a.time,
            ) -
            parseMinutes(b.kind === 'lesson' ? b.lessonTime : b.time),
        ),
      );
    });
    return map;
  }, [currentWeekKey, personalEvents, students]);

  const savePersonalEvents = (nextEvents: typeof personalEvents) => {
    if (teacherName) {
      window.localStorage.setItem(
        `sm_personal_events:${teacherName}`,
        JSON.stringify(nextEvents),
      );
    }
    setPersonalEvents(nextEvents);
  };

  const handleWeekStartChange = (value: WeekDay) => {
    setWeekStartDay(value);
    if (teacherName) {
      window.localStorage.setItem(`sm_week_start_day:${teacherName}`, value);
    }
  };

  const openEventModal = () => {
    setEditingEventId(null);
    setEventForm({
      day: weekStartDay,
      hour: '4',
      minute: '00',
      period: 'PM',
      duration: '30M',
      color: 'sage',
      label: '',
      recurring: false,
    });
    setIsEventModalOpen(true);
  };

  const openEditEventModal = (event: {
    id: string;
    label: string;
    day: WeekDay;
    time: string;
    duration: '15M' | '30M' | '45M' | '1HR';
    color: 'sage' | 'sky' | 'lilac' | 'sand' | 'rose' | 'mint';
    recurring: boolean;
  }) => {
    const match = event.time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    setEditingEventId(event.id);
    setEventForm({
      day: event.day,
      hour: match ? match[1] : '4',
      minute: match ? match[2] : '00',
      period: match ? match[3].toUpperCase() : 'PM',
      duration: event.duration,
      color: event.color,
      label: event.label,
      recurring: event.recurring,
    });
    setIsEventModalOpen(true);
  };

  const closeEventModal = () => {
    setIsEventModalOpen(false);
  };

  const handleAddEvent = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const label = eventForm.label.trim();
    if (!label) return;
    const time = `${eventForm.hour}:${eventForm.minute} ${eventForm.period}`;
    const next = editingEventId
      ? personalEvents.map(item =>
          item.id === editingEventId
            ? {
                ...item,
                label,
                day: eventForm.day,
                time,
                duration: eventForm.duration,
                color: eventForm.color,
                recurring: eventForm.recurring,
              }
            : item,
        )
      : [
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            label,
            day: eventForm.day,
            time,
            duration: eventForm.duration,
            color: eventForm.color,
            recurring: eventForm.recurring,
            startWeek: currentWeekKey,
          },
          ...personalEvents,
        ];
    savePersonalEvents(next);
    setIsEventModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
            Teachers
          </p>
          <h1 className="text-3xl font-semibold text-[var(--c-1f1f1d)] mt-2">
            This Week
          </h1>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            Weekly lesson view for {teacherLabel ?? 'your studio'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
            {formatWeekRange(weekStart, weekEnd)}
          </div>
          <div className="relative">
            <select
              value={weekStartDay}
              onChange={event => handleWeekStartChange(event.target.value as WeekDay)}
              className="appearance-none rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 pr-10 text-xs uppercase tracking-[0.2em] text-[var(--c-1f1f1d)]"
            >
              {WEEK_DAYS.map(day => (
                <option key={day} value={day}>
                  Week starts {day}
                </option>
              ))}
            </select>
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute right-[18px] top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--c-6f6c65)]"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setWeekOffset(current => current - 1)}
              className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
            >
              Prev Week
            </button>
            <button
              type="button"
              onClick={() => setWeekOffset(0)}
              className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
            >
              This Week
            </button>
            <button
              type="button"
              onClick={() => setWeekOffset(current => current + 1)}
              className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
            >
              Next Week
            </button>
          </div>
        </div>
      </header>

      {needsTeacherSelection ? (
        <div className="rounded-2xl border border-[var(--c-f2d7db)] bg-[var(--c-fff5f6)] px-4 py-3 text-sm text-[var(--c-8f2f3b)]">
          Choose a teacher in the sidebar to view the weekly schedule.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-[var(--c-f2d7db)] bg-[var(--c-fff5f6)] px-4 py-3 text-sm text-[var(--c-8f2f3b)]">
          {error}
        </div>
      ) : null}

      <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
        {isLoading ? (
          <div className="text-sm text-[var(--c-6f6c65)]">
            Loading weekly schedule...
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-7">
            {weekDates.map(({ day, date }) => {
              const lessons = scheduleByDay.get(day) ?? [];
              return (
                <div key={`${day}-${date.toDateString()}`} className="space-y-3">
                  <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-3 text-center">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                      {day.slice(0, 3)}
                    </p>
                    <p className="text-lg font-semibold text-[var(--c-1f1f1d)]">
                      {date.getDate()}
                    </p>
                    <p className="text-xs text-[var(--c-9a9892)]">
                      {formatDate(date)}
                    </p>
                  </div>

                  {lessons.length === 0 ? (
                    <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-4 text-xs text-[var(--c-9a9892)]">
                      No lessons
                    </div>
                  ) : (
                    lessons.map((lesson, index) => {
                      const currentStart =
                        lesson.kind === 'lesson'
                          ? parseMinutes(lesson.lessonTime)
                          : parseMinutes(lesson.time);
                      const currentEnd =
                        currentStart !== Number.POSITIVE_INFINITY
                          ? currentStart +
                            (lesson.kind === 'lesson'
                              ? durationMinutes(lesson.lessonDuration)
                              : durationMinutes(lesson.duration ?? '15M'))
                          : null;
                      const nextLesson = lessons[index + 1];
                      const nextStart = nextLesson
                        ? parseMinutes(
                            nextLesson.kind === 'lesson'
                              ? nextLesson.lessonTime
                              : nextLesson.time,
                          )
                        : null;
                      const gapMinutes =
                        currentEnd !== null &&
                        nextStart !== null &&
                        nextStart !== Number.POSITIVE_INFINITY
                          ? nextStart - currentEnd
                          : 0;
                      const gapLabel = formatGap(gapMinutes);
                      const gapHeight = Math.min(
                        Math.max(28, Math.round(gapMinutes * 1.1)),
                        180,
                      );
                      const duration = lesson.kind === 'lesson'
                        ? lesson.lessonDuration
                        : lesson.duration;
                      const durationLabel = formatDurationLabel(duration);
                      const baseHeight30 = 70;
                      const cardHeight =
                        lesson.kind === 'lesson'
                          ? Math.min(
                              210,
                              Math.round(
                                (durationMinutes(duration) / 30) * baseHeight30,
                              ),
                            )
                          : null;
                      return (
                        <div key={lesson.id} className="space-y-2">
                          <button
                            type="button"
                            onClick={() =>
                              lesson.kind === 'event'
                                ? openEditEventModal(lesson)
                                : null
                            }
                            className={`w-full text-left rounded-2xl border px-4 py-4 shadow-sm transition ${
                              lesson.kind === 'event'
                                ? 'border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] hover:border-[color:var(--c-c8102e)]/40'
                                : 'border-[var(--c-e5e3dd)] bg-[var(--c-f7f7f5)]'
                            }`}
                            aria-label={
                              lesson.kind === 'event'
                                ? `Edit ${lesson.label}`
                                : `${lesson.name} lesson`
                            }
                            style={
                              lesson.kind === 'lesson' && cardHeight
                                ? { height: `${cardHeight}px` }
                                : lesson.kind === 'event'
                                  ? {
                                      background:
                                        lesson.color === 'sage'
                                          ? 'rgba(164, 190, 172, 0.18)'
                                          : lesson.color === 'sky'
                                            ? 'rgba(140, 180, 212, 0.18)'
                                            : lesson.color === 'lilac'
                                              ? 'rgba(171, 163, 205, 0.18)'
                                              : lesson.color === 'sand'
                                                ? 'rgba(211, 197, 160, 0.2)'
                                                : lesson.color === 'rose'
                                                  ? 'rgba(209, 158, 166, 0.2)'
                                                  : 'rgba(160, 201, 187, 0.2)',
                                    }
                                  : undefined
                            }
                            disabled={lesson.kind !== 'event'}
                          >
                            <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                              {lesson.kind === 'lesson' ? lesson.name : lesson.label}
                            </p>
                            <p className="text-xs text-[var(--c-6f6c65)]">
                              {formatDate(date)} ·{' '}
                              {lesson.kind === 'lesson'
                                ? lesson.lessonTime ?? 'Time TBA'
                                : lesson.time}{' '}
                              · {durationLabel}
                            </p>
                          </button>
                          {gapLabel ? (
                            <div
                              className="rounded-2xl border border-dashed border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]"
                              style={{ height: `${gapHeight}px` }}
                            >
                              {gapLabel}
                            </div>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={openEventModal}
          className="rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-6 py-2 text-xs uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)] transition hover:brightness-110"
        >
          Add Personal Event
        </button>
      </div>

      {isEventModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeEventModal}
          />
          <div className="relative w-full max-w-xl rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-8 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                  Personal Event
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                  {editingEventId ? 'Edit Event' : 'Add Event'}
                </h2>
                <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                  This starts on {formatWeekRange(weekStart, weekEnd)}.
                </p>
              </div>
              <button
                type="button"
                onClick={closeEventModal}
                className="rounded-full border border-[var(--c-e5e3dd)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:text-[var(--c-1f1f1d)]"
              >
                Close
              </button>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleAddEvent}>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Label
                <input
                  type="text"
                  value={eventForm.label}
                  onChange={event =>
                    setEventForm(current => ({
                      ...current,
                      label: event.target.value,
                    }))
                  }
                  className="mt-3 w-full rounded-2xl border border-[var(--c-ecebe7)] px-4 py-3 text-sm text-[var(--c-1f1f1d)]"
                  placeholder="Personal event"
                />
              </label>

              <div className="grid gap-6 pt-4 sm:grid-cols-2">
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  Day
                  <div className="relative">
                    <select
                      value={eventForm.day}
                      onChange={event =>
                        setEventForm(current => ({
                          ...current,
                          day: event.target.value as WeekDay,
                        }))
                      }
                      className="mt-3 w-full appearance-none rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-3 pr-12 text-sm text-[var(--c-1f1f1d)]"
                    >
                      {WEEK_DAYS.map(day => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                    <svg
                      aria-hidden="true"
                      className="pointer-events-none absolute right-[18px] top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--c-6f6c65)]"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </label>

                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                    Time
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <select
                      value={eventForm.hour}
                      onChange={event =>
                        setEventForm(current => ({
                          ...current,
                          hour: event.target.value,
                        }))
                      }
                      className="w-full appearance-none rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-3 text-sm text-[var(--c-1f1f1d)]"
                    >
                      {Array.from({ length: 12 }, (_, index) => String(index + 1)).map(
                        hour => (
                          <option key={hour} value={hour}>
                            {hour}
                          </option>
                        ),
                      )}
                    </select>
                    <select
                      value={eventForm.minute}
                      onChange={event =>
                        setEventForm(current => ({
                          ...current,
                          minute: event.target.value,
                        }))
                      }
                      className="w-full appearance-none rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-3 text-sm text-[var(--c-1f1f1d)]"
                    >
                      {['00', '15', '30', '45'].map(minute => (
                        <option key={minute} value={minute}>
                          {minute}
                        </option>
                      ))}
                    </select>
                    <select
                      value={eventForm.period}
                      onChange={event =>
                        setEventForm(current => ({
                          ...current,
                          period: event.target.value,
                        }))
                      }
                      className="w-full appearance-none rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-3 text-sm text-[var(--c-1f1f1d)]"
                    >
                      {['AM', 'PM'].map(period => (
                        <option key={period} value={period}>
                          {period}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Duration
                <div className="relative">
                  <select
                    value={eventForm.duration}
                    onChange={event =>
                      setEventForm(current => ({
                        ...current,
                        duration: event.target.value as '15M' | '30M' | '45M' | '1HR',
                      }))
                    }
                    className="mt-3 w-full appearance-none rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-3 pr-12 text-sm text-[var(--c-1f1f1d)]"
                  >
                    <option value="15M">15 minutes</option>
                    <option value="30M">30 minutes</option>
                    <option value="45M">45 minutes</option>
                    <option value="1HR">1 hour</option>
                  </select>
                  <svg
                    aria-hidden="true"
                    className="pointer-events-none absolute right-[18px] top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--c-6f6c65)]"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </label>

              <div className="h-3" aria-hidden="true" />

              <div className="flex flex-col gap-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  Color
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'sage', label: 'Sage', swatch: '#A4BEAC' },
                    { value: 'sky', label: 'Sky', swatch: '#8CB4D4' },
                    { value: 'lilac', label: 'Lilac', swatch: '#ABA3CD' },
                    { value: 'sand', label: 'Sand', swatch: '#D3C5A0' },
                    { value: 'rose', label: 'Rose', swatch: '#D19EA6' },
                    { value: 'mint', label: 'Mint', swatch: '#A0C9BB' },
                  ].map(option => {
                    const selected = eventForm.color === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setEventForm(current => ({
                            ...current,
                            color: option.value as typeof eventForm.color,
                          }))
                        }
                        className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs uppercase tracking-[0.2em] transition ${
                          selected
                            ? 'border-[var(--c-c8102e)] bg-[var(--c-fff5f6)] text-[var(--c-c8102e)] ring-2 ring-[var(--c-c8102e)]/30'
                            : 'border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] text-[var(--c-6f6c65)] hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]'
                        }`}
                      >
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: option.swatch }}
                        />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="h-1" aria-hidden="true" />

              <label className="flex items-center gap-3 rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-fcfcfb)] px-5 py-3 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                <input
                  type="checkbox"
                  checked={eventForm.recurring}
                  onChange={event =>
                    setEventForm(current => ({
                      ...current,
                      recurring: event.target.checked,
                    }))
                  }
                />
                Recurring weekly
              </label>

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeEventModal}
                  className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-6 py-2.5 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-6 py-2.5 text-xs uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)] transition hover:brightness-110"
                >
                  {editingEventId ? 'Save Event' : 'Add Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
