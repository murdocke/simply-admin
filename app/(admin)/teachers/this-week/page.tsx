'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
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

const dateKeyFromDate = (date: Date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value.toISOString().slice(0, 10);
};

const minutesToTimeLabel = (minutes: number) => {
  const hours24 = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hour = hours24 % 12 || 12;
  return `${hour}:${String(mins).padStart(2, '0')} ${period}`;
};

const timeLabelTo24 = (value: string) => {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return '12:00';
  let hour = Number(match[1]);
  const minute = match[2];
  const period = match[3].toUpperCase();
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  return `${String(hour).padStart(2, '0')}:${minute}`;
};

const time24ToLabel = (value: string) => {
  const [hoursRaw, minutesRaw] = value.split(':');
  const hours24 = Number(hoursRaw ?? 0);
  const mins = Number(minutesRaw ?? 0);
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hour = hours24 % 12 || 12;
  return `${hour}:${String(mins).padStart(2, '0')} ${period}`;
};

const dayFromDateKey = (dateKey: string) => {
  const date = new Date(`${dateKey}T00:00:00`);
  return WEEK_DAYS[date.getDay()] ?? 'Sunday';
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
      allowLessonSwap?: boolean;
      startWeek: string;
      dateKey?: string;
      skipDates?: string[];
    }[]
  >([]);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [lessonOverrides, setLessonOverrides] = useState<
    Array<{
      id: string;
      studentId: string;
      dateKey: string;
      day: WeekDay;
      time: string;
    }>
  >([]);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const [hoveredDropId, setHoveredDropId] = useState<string | null>(null);
  const [rescheduleForm, setRescheduleForm] = useState<{
    kind: 'lesson' | 'event';
    id: string;
    label: string;
    currentDateKey: string;
    currentTime: string;
    newDate: string;
    newTime: string;
    choice: 'single' | 'future';
    eventRecurring: boolean;
    durationMinutes: number;
    swap?: {
      kind: 'lesson' | 'event';
      id: string;
      label: string;
      dateKey: string;
      time: string;
      durationMinutes: number;
      recurring: boolean;
    } | null;
    swapPreference?: 'swap' | 'change';
  } | null>(null);
  const dayColumnRefs = useRef<Record<WeekDay, HTMLDivElement | null>>({
    Sunday: null,
    Monday: null,
    Tuesday: null,
    Wednesday: null,
    Thursday: null,
    Friday: null,
    Saturday: null,
  });
  const [eventForm, setEventForm] = useState({
    day: 'Sunday' as WeekDay,
    hour: '4',
    minute: '00',
    period: 'PM',
    duration: '30M' as '15M' | '30M' | '45M' | '1HR',
    color: 'sage' as 'sage' | 'sky' | 'lilac' | 'sand' | 'rose' | 'mint',
    label: '',
    recurring: false,
    allowLessonSwap: false,
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

  const loadPersonalEvents = useCallback(() => {
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
        let didUpdate = false;
        const next = parsed.map(event => {
          if (event.recurring || event.dateKey || !event.startWeek) return event;
          const startWeek = new Date(event.startWeek);
          if (Number.isNaN(startWeek.getTime())) return event;
          const startIndex = startWeek.getDay();
          const targetIndex = WEEK_DAYS.findIndex(
            day => day.toLowerCase() === event.day.toLowerCase(),
          );
          if (targetIndex < 0) return event;
          const offset = (targetIndex - startIndex + 7) % 7;
          const eventDate = new Date(startWeek);
          eventDate.setDate(startWeek.getDate() + offset);
          const dateKey = eventDate.toISOString().slice(0, 10);
          didUpdate = true;
          return { ...event, dateKey };
        });
        if (didUpdate) {
          window.localStorage.setItem(key, JSON.stringify(next));
        }
        setPersonalEvents(next);
      }
    } catch {
      setPersonalEvents([]);
    }
  }, [teacherName]);

  useEffect(() => {
    loadPersonalEvents();
  }, [loadPersonalEvents]);

  useEffect(() => {
    if (!teacherName) return;
    const key = `sm_week_overrides:${teacherName}`;
    const stored = window.localStorage.getItem(key);
    if (!stored) {
      setLessonOverrides([]);
      return;
    }
    try {
      const parsed = JSON.parse(stored) as typeof lessonOverrides;
      if (Array.isArray(parsed)) {
        setLessonOverrides(parsed);
      } else {
        setLessonOverrides([]);
      }
    } catch {
      setLessonOverrides([]);
    }
  }, [teacherName]);

  useEffect(() => {
    const handleSync = () => loadPersonalEvents();
    window.addEventListener('storage', handleSync);
    window.addEventListener('sm-personal-events-updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('sm-personal-events-updated', handleSync);
    };
  }, [loadPersonalEvents]);

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
  const weekStartDate = weekDates[0]?.date ?? new Date();
  const weekEndDate = weekDates[weekDates.length - 1]?.date ?? new Date();

  const currentWeekKey = useMemo(() => {
    const date = new Date(weekStart);
    date.setHours(0, 0, 0, 0);
    return date.toISOString().slice(0, 10);
  }, [weekStart]);

  const overridesThisWeek = useMemo(() => {
    return lessonOverrides.filter(override => {
      const overrideDate = new Date(`${override.dateKey}T00:00:00`);
      return overrideDate >= weekStartDate && overrideDate <= weekEndDate;
    });
  }, [lessonOverrides, weekEndDate, weekStartDate]);

  const overrideByStudent = useMemo(
    () => new Map(overridesThisWeek.map(override => [override.studentId, override])),
    [overridesThisWeek],
  );

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
      const override = overrideByStudent.get(student.id);
      if (override) {
        const current = map.get(override.day) ?? [];
        current.push({
          ...student,
          lessonDay: override.day,
          lessonTime: override.time,
          kind: 'lesson',
        });
        map.set(override.day, current);
        return;
      }
      const index = dayIndex(student.lessonDay);
      if (index < 0) return;
      const day = WEEK_DAYS[index];
      const current = map.get(day) ?? [];
      current.push({ ...student, kind: 'lesson' });
      map.set(day, current);
    });
    const weekDateMap = new Map(
      weekDates.map(entry => [
        entry.date.toISOString().slice(0, 10),
        entry.day,
      ]),
    );

    personalEvents.forEach(event => {
      if (event.recurring) {
        if (event.startWeek) {
          const eventStart = new Date(`${event.startWeek}T00:00:00`);
          if (weekStartDate < eventStart) return;
        }
        const occurrenceDate =
          weekDates.find(entry => entry.day === event.day)?.date ?? weekStartDate;
        const occurrenceKey = dateKeyFromDate(occurrenceDate);
        if (event.skipDates?.includes(occurrenceKey)) {
          return;
        }
        const current = map.get(event.day) ?? [];
        current.push({ ...event, kind: 'event' });
        map.set(event.day, current);
        return;
      }
      const eventDate = event.dateKey
        ? new Date(`${event.dateKey}T00:00:00`)
        : new Date(event.startWeek);
      if (!event.dateKey) {
        if (Number.isNaN(eventDate.getTime())) return;
        const startIndex = eventDate.getDay();
        const targetIndex = WEEK_DAYS.findIndex(
          day => day.toLowerCase() === event.day.toLowerCase(),
        );
        if (targetIndex < 0) return;
        const offset = (targetIndex - startIndex + 7) % 7;
        eventDate.setDate(eventDate.getDate() + offset);
      }
      if (eventDate < weekStartDate || eventDate > weekEndDate) return;
      const eventKey = eventDate.toISOString().slice(0, 10);
      const dayLabel = weekDateMap.get(eventKey);
      if (!dayLabel) return;
      const current = map.get(dayLabel) ?? [];
      current.push({ ...event, kind: 'event' });
      map.set(dayLabel, current);
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
  }, [currentWeekKey, overrideByStudent, personalEvents, students, weekDates, weekEndDate, weekStartDate]);

  const getDateKeyForDay = (day?: WeekDay) => {
    const matched = weekDates.find(entry => entry.day === day);
    if (!matched) return currentWeekKey;
    const date = new Date(matched.date);
    date.setHours(0, 0, 0, 0);
    return date.toISOString().slice(0, 10);
  };

  const savePersonalEvents = (nextEvents: typeof personalEvents) => {
    if (teacherName) {
      window.localStorage.setItem(
        `sm_personal_events:${teacherName}`,
        JSON.stringify(nextEvents),
      );
    }
    setPersonalEvents(nextEvents);
    window.dispatchEvent(new Event('sm-personal-events-updated'));
  };

  const saveLessonOverrides = (nextOverrides: typeof lessonOverrides) => {
    if (teacherName) {
      window.localStorage.setItem(
        `sm_week_overrides:${teacherName}`,
        JSON.stringify(nextOverrides),
      );
    }
    setLessonOverrides(nextOverrides);
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
      allowLessonSwap: false,
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
    allowLessonSwap?: boolean;
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
      allowLessonSwap: event.allowLessonSwap ?? false,
    });
    setIsEventModalOpen(true);
  };

  const closeEventModal = () => {
    setIsEventModalOpen(false);
  };

  const inferTimeFromDrop = (
    day: WeekDay,
    clientY: number,
    lessons: Array<
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
    >,
    duration: number,
    targetEl?: HTMLElement | null,
    fallbackTime?: string,
  ) => {
    if (lessons.length === 0 && fallbackTime) {
      return fallbackTime;
    }
    const dayStart = 8 * 60;
    const dayEnd = 20 * 60;
    const slots = lessons.map(item => {
      const start =
        item.kind === 'lesson'
          ? parseMinutes(item.lessonTime)
          : parseMinutes(item.time);
      const normalizedStart = Number.isFinite(start) ? start : dayStart;
      const end =
        normalizedStart +
        (item.kind === 'lesson'
          ? durationMinutes(item.lessonDuration)
          : durationMinutes(item.duration ?? '15M'));
      return {
        id: item.id,
        start: normalizedStart,
        end,
      };
    });
    slots.sort((a, b) => a.start - b.start);

    const clampToDay = (value: number) =>
      Math.min(Math.max(value, dayStart), dayEnd - duration);

    const first = slots[0];
    const last = slots[slots.length - 1];

    if (targetEl?.dataset?.slotType === 'gap') {
      const gapStart = Number(targetEl.dataset.gapstart ?? dayStart);
      const gapEnd = Number(targetEl.dataset.gapend ?? dayEnd);
      if (gapEnd - gapStart >= duration) {
        const rect = targetEl.getBoundingClientRect();
        const ratio =
          rect.height > 0 ? (clientY - rect.top) / rect.height : 0;
        if (ratio <= 0.5) {
          return minutesToTimeLabel(clampToDay(gapStart));
        }
        return minutesToTimeLabel(clampToDay(gapEnd - duration));
      }
    }

    if (targetEl?.dataset?.slotType === 'lesson') {
      const targetId = targetEl.dataset.id ?? '';
      const index = slots.findIndex(slot => slot.id === targetId);
      if (index >= 0) {
        const slot = slots[index];
        const prev = slots[index - 1];
        const next = slots[index + 1];
        const rect = targetEl.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        if (clientY <= mid) {
          const proposed = slot.start - duration;
          const minStart = prev ? prev.end : dayStart;
          const final = proposed < minStart ? minStart : proposed;
          return minutesToTimeLabel(clampToDay(final));
        }
        const proposed = slot.end;
        const maxEnd = next ? next.start : dayEnd;
        const final =
          proposed + duration > maxEnd ? maxEnd - duration : proposed;
        return minutesToTimeLabel(clampToDay(final));
      }
    }

    if (first) {
      const column = dayColumnRefs.current[day];
      if (column) {
        const rect = column.getBoundingClientRect();
        if (clientY <= rect.top + 20) {
          const proposed = first.start - duration;
          return minutesToTimeLabel(
            clampToDay(proposed < dayStart ? dayStart : proposed),
          );
        }
        if (clientY >= rect.bottom - 20 && last) {
          return minutesToTimeLabel(clampToDay(last.end));
        }
      }
    }

    if (last) {
      return minutesToTimeLabel(clampToDay(last.end));
    }
    return minutesToTimeLabel(dayStart);
  };

  const openRescheduleModal = (payload: {
    kind: 'lesson' | 'event';
    id: string;
    label: string;
    currentDateKey: string;
    currentTime: string;
    newDate: string;
    newTime: string;
    eventRecurring: boolean;
    durationMinutes: number;
    swap?: {
      kind: 'lesson' | 'event';
      id: string;
      label: string;
      dateKey: string;
      time: string;
      durationMinutes: number;
      recurring: boolean;
    } | null;
  }) => {
    setRescheduleForm({
      kind: payload.kind,
      id: payload.id,
      label: payload.label,
      currentDateKey: payload.currentDateKey,
      currentTime: payload.currentTime,
      newDate: payload.newDate,
      newTime: payload.newTime,
      choice: 'single',
      eventRecurring: payload.eventRecurring,
      durationMinutes: payload.durationMinutes,
      swap: payload.swap ?? null,
      swapPreference: payload.swap ? 'change' : 'change',
    });
    setRescheduleError(null);
    setIsRescheduleOpen(true);
  };

  const closeRescheduleModal = () => {
    setIsRescheduleOpen(false);
    setRescheduleError(null);
  };

  const handleRescheduleSave = async () => {
    if (!rescheduleForm) return;
    setRescheduleError(null);
    const nextDateKey = rescheduleForm.newDate;
    const nextDay = dayFromDateKey(nextDateKey);
    const nextTimeLabel = time24ToLabel(rescheduleForm.newTime);
    const nextStart = parseMinutes(nextTimeLabel);
    const nextEnd = nextStart + rescheduleForm.durationMinutes;

    const collectItemsForDate = (dateKey: string) => {
      const day = dayFromDateKey(dateKey);
      const items: Array<{ id: string; kind: 'lesson' | 'event'; start: number; end: number }> = [];
      students.forEach(student => {
        if (student.status !== 'Active') return;
        const override = lessonOverrides.find(
          item => item.studentId === student.id && item.dateKey === dateKey,
        );
        if (override) {
          items.push({
            id: student.id,
            kind: 'lesson',
            start: parseMinutes(override.time),
            end: parseMinutes(override.time) + durationMinutes(student.lessonDuration),
          });
          return;
        }
        if (student.lessonDay?.toLowerCase() !== day.toLowerCase()) return;
        if (!student.lessonTime) return;
        const start = parseMinutes(student.lessonTime);
        if (!Number.isFinite(start)) return;
        items.push({
          id: student.id,
          kind: 'lesson',
          start,
          end: start + durationMinutes(student.lessonDuration),
        });
      });

      personalEvents.forEach(event => {
        if (event.recurring) {
          if (event.startWeek) {
            const eventStart = new Date(`${event.startWeek}T00:00:00`);
            const targetDate = new Date(`${dateKey}T00:00:00`);
            if (targetDate < eventStart) return;
          }
          if (event.day.toLowerCase() !== day.toLowerCase()) return;
          if (event.skipDates?.includes(dateKey)) return;
          const start = parseMinutes(event.time);
          if (!Number.isFinite(start)) return;
          items.push({
            id: event.id,
            kind: 'event',
            start,
            end: start + durationMinutes(event.duration ?? '15M'),
          });
          return;
        }
        if (event.dateKey !== dateKey) return;
        const start = parseMinutes(event.time);
        if (!Number.isFinite(start)) return;
        items.push({
          id: event.id,
          kind: 'event',
          start,
          end: start + durationMinutes(event.duration ?? '15M'),
        });
      });
      return items;
    };

    const isOverlapping = (
      dateKey: string,
      ignoreIds: Array<{ id: string; kind: 'lesson' | 'event' }>,
    ) => {
      const items = collectItemsForDate(dateKey);
      return items.some(item => {
        if (
          ignoreIds.some(ignore => ignore.id === item.id && ignore.kind === item.kind)
        ) {
          return false;
        }
        return nextStart < item.end && nextEnd > item.start;
      });
    };

    if (rescheduleForm.kind === 'lesson') {
      const shouldSwap =
        Boolean(rescheduleForm.swap) &&
        rescheduleForm.swapPreference === 'swap';
      if (shouldSwap && rescheduleForm.swap) {
        const swap = rescheduleForm.swap;
        const swapStart = parseMinutes(swap.time);
        const swapEnd = swapStart + swap.durationMinutes;
        if (swap.durationMinutes !== rescheduleForm.durationMinutes) {
          setRescheduleError('Swap requires matching durations.');
          return;
        }
        if (swap.kind === 'event') {
          const swapEvent = personalEvents.find(item => item.id === swap.id);
          if (!swapEvent) {
            setIsRescheduleOpen(false);
            return;
          }
          const originalDateKey = rescheduleForm.currentDateKey;
          const createOneOff = (source: typeof swapEvent, dateKey: string, time: string) => ({
            ...source,
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            day: dayFromDateKey(dateKey),
            time,
            dateKey,
            recurring: false,
            startWeek: currentWeekKey,
            skipDates: undefined,
          });
          const nextEvents = personalEvents.flatMap(item => {
            if (item.id === swapEvent.id) {
              if (item.recurring) {
                return [
                  {
                    ...item,
                    skipDates: Array.from(
                      new Set([...(item.skipDates ?? []), originalDateKey]),
                    ),
                  },
                  createOneOff(item, originalDateKey, rescheduleForm.currentTime),
                ];
              }
              return [
                {
                  ...item,
                  day: dayFromDateKey(originalDateKey),
                  time: rescheduleForm.currentTime,
                  dateKey: originalDateKey,
                  recurring: false,
                },
              ];
            }
            return [item];
          });

          const swapConflict =
            collectItemsForDate(originalDateKey).some(item => {
              if (item.id === swapEvent.id && item.kind === 'event') return false;
              return (
                parseMinutes(rescheduleForm.currentTime) < item.end &&
                parseMinutes(rescheduleForm.currentTime) +
                  rescheduleForm.durationMinutes >
                  item.start
              );
            }) ||
            collectItemsForDate(nextDateKey).some(item => {
              if (item.id === rescheduleForm.id && item.kind === 'lesson') return false;
              return nextStart < item.end && nextEnd > item.start;
            });
          if (swapConflict) {
            setRescheduleError('That time slot is already taken.');
            return;
          }

          savePersonalEvents(nextEvents);
          const overrideId = `${rescheduleForm.id}:${nextDateKey}`;
          const nextOverrides = [
            ...lessonOverrides.filter(
              override =>
                !(override.studentId === rescheduleForm.id &&
                  override.dateKey === nextDateKey),
            ),
            {
              id: overrideId,
              studentId: rescheduleForm.id,
              dateKey: nextDateKey,
              day: nextDay,
              time: nextTimeLabel,
            },
          ];
          saveLessonOverrides(nextOverrides);
          setIsRescheduleOpen(false);
          return;
        }
        const swapDateKey = rescheduleForm.currentDateKey;
        if (
          isOverlapping(nextDateKey, [
            { id: rescheduleForm.id, kind: 'lesson' },
            { id: swap.id, kind: swap.kind },
          ]) ||
          (swapDateKey !== nextDateKey &&
            collectItemsForDate(swapDateKey).some(item => {
              if (item.id === swap.id && item.kind === swap.kind) {
                return false;
              }
              return swapStart < item.end && swapEnd > item.start;
            }))
        ) {
          setRescheduleError('That time slot is already taken.');
          return;
        }

        if (rescheduleForm.choice === 'future' && swap.kind === 'lesson') {
          try {
            await fetch(`/api/students/${rescheduleForm.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ lessonDay: nextDay, lessonTime: nextTimeLabel }),
            });
            await fetch(`/api/students/${swap.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                lessonDay: dayFromDateKey(rescheduleForm.currentDateKey),
                lessonTime: rescheduleForm.currentTime,
              }),
            });
          } catch {
            // ignore
          }
          setIsRescheduleOpen(false);
          return;
        }

        const nextOverrides = [
          ...lessonOverrides.filter(
            override =>
              !(
                (override.studentId === rescheduleForm.id &&
                  override.dateKey === nextDateKey) ||
                (override.studentId === swap.id &&
                  override.dateKey === rescheduleForm.currentDateKey)
              ),
          ),
          {
            id: `${rescheduleForm.id}:${nextDateKey}`,
            studentId: rescheduleForm.id,
            dateKey: nextDateKey,
            day: nextDay,
            time: nextTimeLabel,
          },
          swap.kind === 'lesson'
            ? {
                id: `${swap.id}:${rescheduleForm.currentDateKey}`,
                studentId: swap.id,
                dateKey: rescheduleForm.currentDateKey,
                day: dayFromDateKey(rescheduleForm.currentDateKey),
                time: rescheduleForm.currentTime,
              }
            : null,
        ].filter(Boolean) as typeof lessonOverrides;
        saveLessonOverrides(nextOverrides);
        setIsRescheduleOpen(false);
        return;
      }

      if (
        isOverlapping(nextDateKey, [{ id: rescheduleForm.id, kind: 'lesson' }])
      ) {
        setRescheduleError('That time slot is already taken.');
        return;
      }
      if (rescheduleForm.choice === 'future') {
        try {
          const response = await fetch(`/api/students/${rescheduleForm.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lessonDay: nextDay,
              lessonTime: nextTimeLabel,
            }),
          });
          if (response.ok) {
            const data = (await response.json()) as { student: StudentRecord };
            setStudents(current =>
              current.map(student =>
                student.id === data.student.id ? data.student : student,
              ),
            );
          }
        } catch {
          // ignore
        }
        const cleaned = lessonOverrides.filter(
          override =>
            override.studentId !== rescheduleForm.id ||
            override.dateKey < nextDateKey,
        );
        saveLessonOverrides(cleaned);
      } else {
        const overrideId = `${rescheduleForm.id}:${nextDateKey}`;
        const nextOverrides = [
          ...lessonOverrides.filter(
            override =>
              !(override.studentId === rescheduleForm.id &&
                override.dateKey === nextDateKey),
          ),
          {
            id: overrideId,
            studentId: rescheduleForm.id,
            dateKey: nextDateKey,
            day: nextDay,
            time: nextTimeLabel,
          },
        ];
        saveLessonOverrides(nextOverrides);
      }
      setIsRescheduleOpen(false);
      return;
    }

    const event = personalEvents.find(item => item.id === rescheduleForm.id);
    if (!event) {
      setIsRescheduleOpen(false);
      return;
    }
    const shouldSwap =
      Boolean(rescheduleForm.swap) &&
      rescheduleForm.swapPreference === 'swap';
    if (shouldSwap && rescheduleForm.swap) {
      const swap = rescheduleForm.swap;
      if (swap.durationMinutes !== rescheduleForm.durationMinutes) {
        setRescheduleError('Swap requires matching durations.');
        return;
      }
      if (swap.kind === 'lesson' && !event.allowLessonSwap) {
        setRescheduleError('This event is not enabled for lesson swaps.');
        return;
      }
      if (swap.kind === 'lesson') {
        const targetLesson = students.find(item => item.id === swap.id);
        if (!targetLesson) {
          setIsRescheduleOpen(false);
          return;
        }
        const originalDateKey = rescheduleForm.currentDateKey;
        const originalTime = rescheduleForm.currentTime;
        const swapConflict =
          collectItemsForDate(originalDateKey).some(item => {
            if (item.id === swap.id && item.kind === 'lesson') return false;
            return (
              parseMinutes(originalTime) < item.end &&
              parseMinutes(originalTime) +
                rescheduleForm.durationMinutes >
                item.start
            );
          }) ||
          collectItemsForDate(nextDateKey).some(item => {
            if (item.id === rescheduleForm.id && item.kind === 'event') return false;
            return nextStart < item.end && nextEnd > item.start;
          });
        if (swapConflict) {
          setRescheduleError('That time slot is already taken.');
          return;
        }

        const nextEvents = personalEvents.flatMap(item => {
          if (item.id === rescheduleForm.id) {
            if (item.recurring) {
              return [
                {
                  ...item,
                  skipDates: Array.from(
                    new Set([...(item.skipDates ?? []), originalDateKey]),
                  ),
                },
                {
                  ...item,
                  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                  day: dayFromDateKey(nextDateKey),
                  time: nextTimeLabel,
                  dateKey: nextDateKey,
                  recurring: false,
                  startWeek: currentWeekKey,
                  skipDates: undefined,
                },
              ];
            }
            return [
              {
                ...item,
                day: dayFromDateKey(nextDateKey),
                time: nextTimeLabel,
                dateKey: nextDateKey,
                recurring: false,
              },
            ];
          }
          return [item];
        });
        savePersonalEvents(nextEvents);

        const nextOverrides = [
          ...lessonOverrides.filter(
            override =>
              !(
                override.studentId === swap.id &&
                override.dateKey === originalDateKey
              ),
          ),
          {
            id: `${swap.id}:${originalDateKey}`,
            studentId: swap.id,
            dateKey: originalDateKey,
            day: dayFromDateKey(originalDateKey),
            time: originalTime,
          },
        ];
        saveLessonOverrides(nextOverrides);
        setIsRescheduleOpen(false);
        return;
      }
      if (swap.kind === 'event') {
        const swapEvent = personalEvents.find(item => item.id === swap.id);
        if (!swapEvent) {
          setIsRescheduleOpen(false);
          return;
        }
        const originalDateKey = rescheduleForm.currentDateKey;
        const createOneOff = (source: typeof event, dateKey: string, time: string) => ({
          ...source,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          day: dayFromDateKey(dateKey),
          time,
          dateKey,
          recurring: false,
          startWeek: currentWeekKey,
          skipDates: undefined,
        });

        const nextEvents = personalEvents.flatMap(item => {
          if (item.id === event.id) {
            if (item.recurring) {
              return [
                {
                  ...item,
                  skipDates: Array.from(
                    new Set([...(item.skipDates ?? []), originalDateKey]),
                  ),
                },
                createOneOff(item, nextDateKey, nextTimeLabel),
              ];
            }
            return [
              {
                ...item,
                day: nextDay,
                time: nextTimeLabel,
                dateKey: nextDateKey,
                recurring: false,
              },
            ];
          }
          if (item.id === swapEvent.id) {
            if (item.recurring) {
              return [
                {
                  ...item,
                  skipDates: Array.from(
                    new Set([...(item.skipDates ?? []), nextDateKey]),
                  ),
                },
                createOneOff(item, originalDateKey, rescheduleForm.currentTime),
              ];
            }
            return [
              {
                ...item,
                day: dayFromDateKey(originalDateKey),
                time: rescheduleForm.currentTime,
                dateKey: originalDateKey,
                recurring: false,
              },
            ];
          }
          return [item];
        });

        const hasSwapConflict =
          collectItemsForDate(originalDateKey).some(item => {
            if (item.id === swapEvent.id && item.kind === 'event') return false;
            return (
              parseMinutes(rescheduleForm.currentTime) < item.end &&
              parseMinutes(rescheduleForm.currentTime) +
                rescheduleForm.durationMinutes >
                item.start
            );
          }) ||
          collectItemsForDate(nextDateKey).some(item => {
            if (item.id === event.id && item.kind === 'event') return false;
            return nextStart < item.end && nextEnd > item.start;
          });
        if (hasSwapConflict) {
          setRescheduleError('That time slot is already taken.');
          return;
        }

        savePersonalEvents(nextEvents);
        setIsRescheduleOpen(false);
        return;
      }
      setRescheduleError('Swap with a lesson is only supported for lessons.');
      return;
    }

    if (
      isOverlapping(nextDateKey, [{ id: rescheduleForm.id, kind: 'event' }])
    ) {
      setRescheduleError('That time slot is already taken.');
      return;
    }

    if (event.recurring && rescheduleForm.choice === 'future') {
      const nextEvents = personalEvents.map(item =>
        item.id === event.id
          ? {
              ...item,
              day: nextDay,
              time: nextTimeLabel,
              startWeek: currentWeekKey,
            }
          : item,
      );
      savePersonalEvents(nextEvents);
      setIsRescheduleOpen(false);
      return;
    }

    if (event.recurring && rescheduleForm.choice === 'single') {
      const nextEvents = [
        ...personalEvents.map(item =>
          item.id === event.id
            ? {
                ...item,
                skipDates: Array.from(
                  new Set([...(item.skipDates ?? []), rescheduleForm.currentDateKey]),
                ),
              }
            : item,
        ),
        {
          ...event,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          day: nextDay,
          time: nextTimeLabel,
          recurring: false,
          dateKey: nextDateKey,
          startWeek: currentWeekKey,
          skipDates: undefined,
        },
      ];
      savePersonalEvents(nextEvents);
      setIsRescheduleOpen(false);
      return;
    }

    const nextEvents = personalEvents.map(item =>
      item.id === event.id
        ? {
            ...item,
            day: nextDay,
            time: nextTimeLabel,
            dateKey: nextDateKey,
          }
        : item,
    );
    savePersonalEvents(nextEvents);
    setIsRescheduleOpen(false);
  };

  useEffect(() => {
    if (!rescheduleForm) return;
    if (rescheduleForm.kind === 'event' && !rescheduleForm.eventRecurring) {
      if (rescheduleForm.choice !== 'single') {
        setRescheduleForm(current =>
          current ? { ...current, choice: 'single' } : current,
        );
      }
    }
    if (rescheduleForm.swap) {
      if (
        rescheduleForm.kind === 'event' ||
        rescheduleForm.swap.kind === 'event'
      ) {
        if (rescheduleForm.choice !== 'single') {
          setRescheduleForm(current =>
            current ? { ...current, choice: 'single' } : current,
          );
        }
      }
    }
  }, [rescheduleForm]);

  const handleDeleteEvent = () => {
    if (!editingEventId) return;
    const next = personalEvents.filter(event => event.id !== editingEventId);
    savePersonalEvents(next);
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
                allowLessonSwap: eventForm.allowLessonSwap,
                dateKey: eventForm.recurring
                  ? item.dateKey
                  : getDateKeyForDay(eventForm.day),
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
            allowLessonSwap: eventForm.allowLessonSwap,
            startWeek: currentWeekKey,
            dateKey: eventForm.recurring
              ? undefined
              : getDateKeyForDay(eventForm.day),
          },
          ...personalEvents,
        ];
    savePersonalEvents(next);
    setIsEventModalOpen(false);
  };

  const handleDropOnDay = (
    event: React.DragEvent<HTMLDivElement>,
    day: WeekDay,
    date: Date,
    lessons: Array<
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
    >,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const raw = event.dataTransfer.getData('text/plain');
    if (!raw) return;
    let payload: { kind: 'lesson' | 'event'; id: string } | null = null;
    try {
      payload = JSON.parse(raw) as { kind: 'lesson' | 'event'; id: string };
    } catch {
      payload = null;
    }
    if (!payload) return;
    const candidates = document
      .elementsFromPoint(event.clientX, event.clientY)
      .map(element =>
        (element as HTMLElement).closest?.('[data-slot]') as HTMLElement | null,
      )
      .filter(Boolean) as HTMLElement[];
    const resolvedTargetEl =
      candidates.find(
        element =>
          element.dataset.id !== payload?.id ||
          element.dataset.slotType !== payload?.kind,
      ) ?? candidates[0];
    const resolvedTargetId = resolvedTargetEl?.dataset?.id ?? null;
    setHoveredDropId(resolvedTargetId);
    window.setTimeout(() => setHoveredDropId(null), 900);
    const targetDateKey = dateKeyFromDate(date);

    if (payload.kind === 'lesson') {
      const student = students.find(item => item.id === payload!.id);
      if (!student) return;
      const override = overrideByStudent.get(student.id);
      const currentTime = override?.time ?? student.lessonTime ?? 'Time TBA';
      const dragDuration = durationMinutes(student.lessonDuration);
      const suggestedTimeLabel = inferTimeFromDrop(
        day,
        event.clientY,
        lessons,
        dragDuration,
        resolvedTargetEl,
        currentTime !== 'Time TBA' ? currentTime : undefined,
      );
      const targetSlotType = resolvedTargetEl?.dataset?.slotType;
      const targetId = resolvedTargetEl?.dataset?.id ?? '';
      let swap: {
        kind: 'lesson' | 'event';
        id: string;
        label: string;
        dateKey: string;
        time: string;
        durationMinutes: number;
        recurring: boolean;
      } | null = null;
      if (targetSlotType === 'lesson' && targetId && targetId !== student.id) {
        const targetLesson = students.find(item => item.id === targetId);
        if (targetLesson) {
          const rect = resolvedTargetEl?.getBoundingClientRect();
          const ratio =
            rect && rect.height
              ? Math.abs(event.clientY - (rect.top + rect.height / 2)) /
                rect.height
              : 1;
          const targetDuration = durationMinutes(targetLesson.lessonDuration);
          if (ratio <= 0.2 && targetDuration === dragDuration) {
            if (!Number.isFinite(parseMinutes(targetLesson.lessonTime))) {
              swap = null;
            } else {
              swap = {
                kind: 'lesson',
                id: targetLesson.id,
                label: targetLesson.name,
                dateKey: targetDateKey,
                time: targetLesson.lessonTime ?? 'Time TBA',
                durationMinutes: targetDuration,
                recurring: true,
              };
            }
          }
      }
      if (targetSlotType === 'event' && targetId) {
        const targetEvent = personalEvents.find(item => item.id === targetId);
        if (targetEvent?.allowLessonSwap) {
          const targetDuration = durationMinutes(targetEvent.duration ?? '15M');
          if (targetDuration === dragDuration) {
            swap = {
              kind: 'event',
              id: targetEvent.id,
              label: targetEvent.label,
              dateKey: targetDateKey,
              time: targetEvent.time,
              durationMinutes: targetDuration,
              recurring: targetEvent.recurring,
            };
          }
        }
      }
    }
      const suggestedTime24 = timeLabelTo24(suggestedTimeLabel);
      const currentDateKey =
        override?.dateKey ??
        getDateKeyForDay(student.lessonDay as WeekDay | undefined);
      openRescheduleModal({
        kind: 'lesson',
        id: student.id,
        label: student.name,
        currentDateKey,
        currentTime,
        newDate: targetDateKey,
        newTime: suggestedTime24,
        eventRecurring: true,
        durationMinutes: dragDuration,
        swap,
      });
      return;
    }

    const eventItem = personalEvents.find(item => item.id === payload!.id);
    if (!eventItem) return;
    const dragDuration = durationMinutes(eventItem.duration ?? '15M');
    const suggestedTimeLabel = inferTimeFromDrop(
      day,
      event.clientY,
      lessons,
      dragDuration,
      resolvedTargetEl,
      eventItem.time,
    );
    const targetSlotType = resolvedTargetEl?.dataset?.slotType;
    const targetId = resolvedTargetEl?.dataset?.id ?? '';
    let swap: {
      kind: 'lesson' | 'event';
      id: string;
      label: string;
      dateKey: string;
      time: string;
      durationMinutes: number;
      recurring: boolean;
    } | null = null;
    if (targetSlotType === 'event' && targetId && targetId !== eventItem.id) {
      const targetEvent = personalEvents.find(item => item.id === targetId);
      if (targetEvent) {
        const rect = resolvedTargetEl?.getBoundingClientRect();
        const ratio =
          rect && rect.height
            ? Math.abs(event.clientY - (rect.top + rect.height / 2)) /
              rect.height
            : 1;
        const targetDuration = durationMinutes(targetEvent.duration ?? '15M');
        if (ratio <= 0.2 && targetDuration === dragDuration) {
          if (!Number.isFinite(parseMinutes(targetEvent.time))) {
            swap = null;
          } else {
            swap = {
              kind: 'event',
              id: targetEvent.id,
              label: targetEvent.label,
              dateKey: targetDateKey,
              time: targetEvent.time,
              durationMinutes: targetDuration,
              recurring: targetEvent.recurring,
            };
          }
        }
      }
    }
    if (targetSlotType === 'lesson' && targetId && eventItem.allowLessonSwap) {
      const targetLesson = students.find(item => item.id === targetId);
      if (targetLesson) {
        const targetDuration = durationMinutes(targetLesson.lessonDuration);
        if (targetDuration === dragDuration) {
          swap = {
            kind: 'lesson',
            id: targetLesson.id,
            label: targetLesson.name,
            dateKey: targetDateKey,
            time: targetLesson.lessonTime ?? 'Time TBA',
            durationMinutes: targetDuration,
            recurring: true,
          };
        }
      }
    }
    const suggestedTime24 = timeLabelTo24(suggestedTimeLabel);
    const currentDateKey = eventItem.recurring
      ? getDateKeyForDay(eventItem.day)
      : eventItem.dateKey ?? targetDateKey;
    openRescheduleModal({
      kind: 'event',
      id: eventItem.id,
      label: eventItem.label,
      currentDateKey,
      currentTime: eventItem.time,
      newDate: targetDateKey,
      newTime: suggestedTime24,
      eventRecurring: eventItem.recurring,
      durationMinutes: dragDuration,
      swap,
    });
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
                <div
                  key={`${day}-${date.toDateString()}`}
                  className="space-y-3"
                  onDragOver={event => event.preventDefault()}
                  onDrop={event => handleDropOnDay(event, day, date, lessons)}
                >
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

                  <div
                    ref={node => {
                      dayColumnRefs.current[day] = node;
                    }}
                    onDragOver={event => event.preventDefault()}
                    onDrop={event => handleDropOnDay(event, day, date, lessons)}
                    className="space-y-3 min-h-[120px]"
                  >
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
                                  (durationMinutes(duration) / 30) *
                                    baseHeight30,
                                ),
                              )
                            : null;
                        return (
                          <div
                            key={lesson.id}
                            className="space-y-2"
                            data-slot
                            data-slot-type={lesson.kind}
                            data-id={lesson.id}
                          >
                            <button
                              type="button"
                              draggable
                              data-slot
                              data-slot-type={lesson.kind}
                              data-id={lesson.id}
                              onDragStart={event => {
                                event.dataTransfer.setData(
                                  'text/plain',
                                  JSON.stringify({
                                    kind: lesson.kind,
                                    id: lesson.id,
                                  }),
                                );
                                event.dataTransfer.effectAllowed = 'move';
                              }}
                              onClick={() =>
                                lesson.kind === 'event'
                                  ? openEditEventModal(lesson)
                                  : null
                              }
                              className={`w-full text-left rounded-2xl border px-4 py-4 shadow-sm transition ${
                                lesson.kind === 'event'
                                  ? 'border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] hover:border-[color:var(--c-c8102e)]/40'
                                  : 'border-[var(--c-e5e3dd)] bg-[var(--c-f7f7f5)]'
                              } ${
                                hoveredDropId === lesson.id
                                  ? 'ring-2 ring-[var(--c-c8102e)]/60 border-[color:var(--c-c8102e)]/60'
                                  : ''
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
                            >
                              <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                                {lesson.kind === 'lesson'
                                  ? lesson.name
                                  : lesson.label}
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
                                data-slot
                                data-slot-type="gap"
                                data-gapstart={currentEnd ?? undefined}
                                data-gapend={nextStart ?? undefined}
                              >
                                {gapLabel}
                              </div>
                            ) : null}
                          </div>
                        );
                      })
                    )}
                  </div>
                  {(() => {
                    const lessonItems = lessons.filter(
                      entry => entry.kind === 'lesson',
                    ) as Array<
                      StudentRecord & {
                        kind: 'lesson';
                        time?: string;
                      }
                    >;
                    if (lessonItems.length === 0) return null;
                    const sorted = [...lessonItems].sort((a, b) => {
                      return (
                        parseMinutes(a.lessonTime) -
                        parseMinutes(b.lessonTime)
                      );
                    });
                    const lastLesson = sorted[sorted.length - 1];
                    const endMinutes =
                      parseMinutes(lastLesson.lessonTime) +
                      durationMinutes(lastLesson.lessonDuration);
                    const hours24 = Math.floor(endMinutes / 60) % 24;
                    const minutes = endMinutes % 60;
                    const period = hours24 >= 12 ? 'PM' : 'AM';
                    const displayHour = hours24 % 12 || 12;
                    const displayTime = `${displayHour}:${String(
                      minutes,
                    ).padStart(2, '0')} ${period}`;
                    return (
                      <div
                        className="rounded-2xl border border-dashed border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]"
                        style={{ height: '30px' }}
                      >
                        Finished At {displayTime}
                      </div>
                    );
                  })()}
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

      {isRescheduleOpen && rescheduleForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeRescheduleModal}
          />
          <div className="relative w-full max-w-xl rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-8 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                  Reschedule
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                  {rescheduleForm.label}
                </h2>
                <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                  Current: {rescheduleForm.currentDateKey} ·{' '}
                  {rescheduleForm.currentTime}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                New Date
                <input
                  type="date"
                  value={rescheduleForm.newDate}
                  onChange={event =>
                    setRescheduleForm(current =>
                      current
                        ? { ...current, newDate: event.target.value }
                        : current,
                    )
                  }
                  className="mt-3 w-full rounded-2xl border border-[var(--c-ecebe7)] px-4 py-3 text-sm text-[var(--c-1f1f1d)]"
                />
              </label>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                New Time
                <input
                  type="time"
                  step={1800}
                  value={rescheduleForm.newTime}
                  onChange={event =>
                    setRescheduleForm(current =>
                      current
                        ? { ...current, newTime: event.target.value }
                        : current,
                    )
                  }
                  className="mt-3 w-full rounded-2xl border border-[var(--c-ecebe7)] px-4 py-3 text-sm text-[var(--c-1f1f1d)]"
                />
              </label>
            </div>

            {rescheduleForm.swap ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-[var(--c-e5e3dd)] bg-[var(--c-f7f7f5)] px-4 py-3 text-sm text-[var(--c-6f6c65)]">
                  Swap detected with {rescheduleForm.swap.label}.
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 rounded-2xl border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-3 text-sm text-[var(--c-1f1f1d)]">
                    <input
                      type="radio"
                      name="swap-mode"
                      checked={rescheduleForm.swapPreference === 'swap'}
                      onChange={() =>
                        setRescheduleForm(current =>
                          current ? { ...current, swapPreference: 'swap' } : current,
                        )
                      }
                    />
                    <span>Swap times with {rescheduleForm.swap.label}</span>
                  </label>
                  <label className="flex items-center gap-3 rounded-2xl border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-3 text-sm text-[var(--c-1f1f1d)]">
                    <input
                      type="radio"
                      name="swap-mode"
                      checked={rescheduleForm.swapPreference === 'change'}
                      onChange={() =>
                        setRescheduleForm(current =>
                          current ? { ...current, swapPreference: 'change' } : current,
                        )
                      }
                    />
                    <span>
                      Don&apos;t swap — keep {rescheduleForm.swap.label} as-is
                    </span>
                  </label>
                </div>
              </div>
            ) : null}

            <div className="mt-6 space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Update Scope
              </p>
              <label className="flex items-center gap-3 rounded-2xl border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-3 text-sm text-[var(--c-1f1f1d)]">
                <input
                  type="radio"
                  name="reschedule-scope"
                  checked={rescheduleForm.choice === 'single'}
                  onChange={() =>
                    setRescheduleForm(current =>
                      current ? { ...current, choice: 'single' } : current,
                    )
                  }
                />
                <span>
                  {rescheduleForm.kind === 'lesson'
                    ? 'Just this lesson'
                    : 'Just this event'}
                </span>
              </label>
              {rescheduleForm.kind === 'lesson' || rescheduleForm.eventRecurring ? (
                <label className="flex items-center gap-3 rounded-2xl border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-3 text-sm text-[var(--c-1f1f1d)]">
                  <input
                    type="radio"
                    name="reschedule-scope"
                    checked={rescheduleForm.choice === 'future'}
                    onChange={() =>
                      setRescheduleForm(current =>
                        current ? { ...current, choice: 'future' } : current,
                      )
                    }
                  />
                  <span>
                    {rescheduleForm.kind === 'lesson'
                      ? 'This and all future lessons'
                      : 'This and all future events'}
                  </span>
                </label>
              ) : null}
            </div>

            {rescheduleError ? (
              <div className="mt-5 rounded-2xl border border-[var(--c-f2d7db)] bg-[var(--c-fff5f6)] px-4 py-3 text-sm text-[var(--c-8f2f3b)]">
                {rescheduleError}
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeRescheduleModal}
                className="rounded-full border border-[var(--c-e5e3dd)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:text-[var(--c-1f1f1d)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRescheduleSave}
                className="rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-5 py-2 text-xs uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)] transition hover:brightness-110"
              >
                Save Update
              </button>
            </div>
          </div>
        </div>
      ) : null}

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

                <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  Recurring
                  <div className="mt-3 flex items-center gap-3 rounded-2xl border border-[var(--c-ecebe7)] px-4 py-3 text-sm text-[var(--c-1f1f1d)]">
                    <input
                      type="checkbox"
                      checked={eventForm.recurring}
                      onChange={event =>
                        setEventForm(current => ({
                          ...current,
                          recurring: event.target.checked,
                          allowLessonSwap: event.target.checked
                            ? current.allowLessonSwap
                            : false,
                        }))
                      }
                    />
                    <span>Repeats weekly</span>
                  </div>
                </label>

                {eventForm.recurring ? (
                  <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                    Lesson Swap
                    <div className="mt-3 flex items-center gap-3 rounded-2xl border border-[var(--c-ecebe7)] px-4 py-3 text-sm text-[var(--c-1f1f1d)]">
                      <input
                        type="checkbox"
                        checked={eventForm.allowLessonSwap}
                        onChange={event =>
                          setEventForm(current => ({
                            ...current,
                            allowLessonSwap: event.target.checked,
                          }))
                        }
                      />
                      <span>
                        Allow lesson swaps with this recurring event
                      </span>
                    </div>
                  </label>
                ) : null}

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

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                {editingEventId ? (
                  <button
                    type="button"
                    onClick={handleDeleteEvent}
                    className="rounded-full border border-[var(--c-f2d7db)] bg-[var(--c-fff5f6)] px-5 py-2.5 text-xs uppercase tracking-[0.2em] text-[var(--c-8f2f3b)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
                  >
                    Delete Event
                  </button>
                ) : (
                  <span />
                )}
                <div className="flex items-center gap-3">
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
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
