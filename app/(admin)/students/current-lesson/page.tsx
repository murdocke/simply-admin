'use client';

import { useEffect, useMemo, useState } from 'react';
import studentsData from '@/data/students.json';
import teachersData from '@/data/teachers.json';
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

type TeacherRecord = {
  id: string;
  name: string;
  username?: string;
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
const WEEK_DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const buildThreadId = (studentId: string, teacherId: string) =>
  `student:${studentId}|teacher:${teacherId}`;

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
  const teachers = useMemo(
    () => (teachersData.teachers as TeacherRecord[]) ?? [],
    [],
  );
  const [activeStudent, setActiveStudent] = useState<StudentRecord | null>(null);
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [planWindow, setPlanWindow] = useState<{
    lessonDate: string;
    rangeStart: string;
    rangeEnd: string;
  } | null>(null);
  const [practiceChecks, setPracticeChecks] = useState<
    Record<string, boolean[]>
  >({});
  const [videoWatched, setVideoWatched] = useState<Record<string, boolean>>({});
  const [questionDrafts, setQuestionDrafts] = useState<Record<string, string>>(
    {},
  );
  const [questionStatus, setQuestionStatus] = useState<Record<string, string>>(
    {},
  );
  const [playedVideos, setPlayedVideos] = useState<Record<string, boolean>>({});
  const [activeVideoItem, setActiveVideoItem] = useState<LessonPlanItem | null>(
    null,
  );
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const playedStorageKey = 'sm-video-played';
  const buildPlayedKey = (material?: string, part?: string) =>
    `${material ?? ''}||${part ?? ''}`;

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

  const checklistStorageKey = useMemo(() => {
    if (!activeStudent || !planWindow) return null;
    return `sm-practice-checklist:${activeStudent.id}:${planWindow.lessonDate}`;
  }, [planWindow, activeStudent]);

  const watchedStorageKey = useMemo(() => {
    if (!activeStudent || !planWindow) return null;
    return `sm-video-watched:${activeStudent.id}:${planWindow.lessonDate}`;
  }, [planWindow, activeStudent]);

  const weekDates = useMemo(() => {
    if (!planWindow) return [];
    const lessonDate = new Date(`${planWindow.lessonDate}T00:00:00`);
    return Array.from({ length: 7 }, (_, index) =>
      addDays(lessonDate, index - 3),
    );
  }, [planWindow]);

  const groupedLessonItems = useMemo(() => {
    if (!lessonPlan?.items?.length) return [];
    type Group = {
      section: string;
      material: string;
      items: (LessonPlanItem & { index: number })[];
    };
    return lessonPlan.items.reduce<Group[]>((groups, item, index) => {
      const section = item.section || 'Lesson Section';
      const material = item.material || 'Lesson Material';
      const last = groups[groups.length - 1];
      if (!last || last.section !== section || last.material !== material) {
        groups.push({ section, material, items: [{ ...item, index }] });
      } else {
        last.items.push({ ...item, index });
      }
      return groups;
    }, []);
  }, [lessonPlan]);

  useEffect(() => {
    if (!lessonPlan || !checklistStorageKey) {
      setPracticeChecks({});
      return;
    }
    const groups = lessonPlan.items.reduce<string[]>((acc, item) => {
      const key = `${item.section}|${item.material}`;
      if (!acc.includes(key)) acc.push(key);
      return acc;
    }, []);
    try {
      const raw = window.localStorage.getItem(checklistStorageKey);
      const stored = raw ? (JSON.parse(raw) as Record<string, boolean[]>) : {};
      const normalized: Record<string, boolean[]> = {};
      groups.forEach(groupKey => {
        const existing = stored[groupKey];
        normalized[groupKey] =
          Array.isArray(existing) && existing.length === 7
            ? existing
            : Array.from({ length: 7 }, () => false);
      });
      setPracticeChecks(normalized);
    } catch {
      setPracticeChecks(
        Object.fromEntries(
          groups.map(groupKey => [
            groupKey,
            Array.from({ length: 7 }, () => false),
          ]),
        ),
      );
    }
  }, [checklistStorageKey, lessonPlan]);

  useEffect(() => {
    if (!lessonPlan || !watchedStorageKey) {
      setVideoWatched({});
      return;
    }
    try {
      const raw = window.localStorage.getItem(watchedStorageKey);
      const stored = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
      const normalized: Record<string, boolean> = {};
      lessonPlan.items.forEach((item, index) => {
        const itemKey = `${item.section}|${item.material}|${item.part ?? ''}|${index}`;
        normalized[itemKey] = Boolean(stored[itemKey]);
      });
      setVideoWatched(normalized);
    } catch {
      setVideoWatched(
        Object.fromEntries(
          lessonPlan.items.map((item, index) => [
            `${item.section}|${item.material}|${item.part ?? ''}|${index}`,
            false,
          ]),
        ),
      );
    }
  }, [lessonPlan, watchedStorageKey]);

  useEffect(() => {
    const loadPlayed = () => {
      try {
        const raw = window.localStorage.getItem(playedStorageKey);
        const stored = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
        setPlayedVideos(stored);
      } catch {
        setPlayedVideos({});
      }
    };
    loadPlayed();
    window.addEventListener('sm-video-played', loadPlayed);
    return () => window.removeEventListener('sm-video-played', loadPlayed);
  }, [playedStorageKey]);

  const togglePracticeCheck = (itemKey: string, dayIndex: number) => {
    setPracticeChecks(current => {
      const next = { ...current };
      const row = next[itemKey]
        ? [...next[itemKey]]
        : Array.from({ length: 7 }, () => false);
      row[dayIndex] = !row[dayIndex];
      next[itemKey] = row;
      if (checklistStorageKey) {
        window.localStorage.setItem(checklistStorageKey, JSON.stringify(next));
      }
      return next;
    });
  };

  const markVideoWatched = (itemKey: string) => {
    setVideoWatched(current => {
      const next = { ...current, [itemKey]: true };
      if (watchedStorageKey) {
        window.localStorage.setItem(watchedStorageKey, JSON.stringify(next));
      }
      return next;
    });
  };

  const markPlayedGlobal = (material?: string, part?: string) => {
    const key = buildPlayedKey(material, part);
    try {
      const raw = window.localStorage.getItem(playedStorageKey);
      const stored = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
      const next = { ...stored, [key]: true };
      window.localStorage.setItem(playedStorageKey, JSON.stringify(next));
      window.dispatchEvent(new Event('sm-video-played'));
    } catch {
      window.dispatchEvent(new Event('sm-video-played'));
    }
  };

  const updateQuestionDraft = (groupKey: string, value: string) => {
    setQuestionDrafts(current => ({ ...current, [groupKey]: value }));
  };

  const sendQuestion = async (groupKey: string, subject: string) => {
    if (!activeStudent) return;
    const messageText = (questionDrafts[groupKey] ?? '').trim();
    if (!messageText) return;
    const teacherId =
      teachers.find(
        teacher =>
          teacher.username?.toLowerCase() ===
          activeStudent.teacher?.toLowerCase(),
      )?.id ?? teachers[0]?.id;
    if (!teacherId) return;
    const threadId = buildThreadId(activeStudent.id, teacherId);
    setQuestionStatus(current => ({ ...current, [groupKey]: 'sending' }));
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId,
          subject,
          message: {
            id: crypto.randomUUID(),
            sender: 'student',
            text: messageText,
            timestamp: new Date().toISOString(),
            subject,
          },
        }),
      });
      setQuestionDrafts(current => ({ ...current, [groupKey]: '' }));
      setQuestionStatus(current => ({ ...current, [groupKey]: 'sent' }));
    } catch {
      setQuestionStatus(current => ({ ...current, [groupKey]: 'error' }));
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
          Students
        </p>
        <h1 className="text-3xl font-semibold text-[var(--c-1f1f1d)] mt-2">
          Current Lesson
        </h1>
        <p className="text-sm text-[var(--c-6f6c65)] mt-2">
          Everything you need to track this week’s lesson plan.
        </p>
      </header>

      <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
              This Week
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--c-1f1f1d)]">
              {activeStudent?.name
                ? `${activeStudent.name.split(' ')[0]}\u2019s Lesson Plan`
                : 'Lesson Plan'}
            </h2>
          </div>
          {planWindow ? (
            <div className="text-sm uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
              <p>{`Lesson Date ${planWindow.lessonDate}`}</p>
              <p>{`Applies ${planWindow.rangeStart} → ${planWindow.rangeEnd}`}</p>
            </div>
          ) : null}
        </div>
        {lessonPlan ? (
          <div className="mt-5 space-y-3">
            {lessonPlan.notes ? (
              <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-faf9f6)] p-4 text-base text-[var(--c-6f6c65)]">
                {lessonPlan.notes}
              </div>
            ) : null}
            {lessonPlan.items.length > 0 ? (
              <div className="space-y-4">
                {groupedLessonItems.map(group => {
                  const groupKey = `${group.section}|${group.material}`;
                  const materialLabel = (() => {
                    const raw = group.material || '';
                    const cleaned = raw.trim();
                    if (!cleaned) return 'Lesson';
                    const withoutNumber = cleaned.replace(
                      /^\s*[\d.]+\s*[–-]\s*/i,
                      '',
                    );
                    return (withoutNumber || cleaned)
                      .toLowerCase()
                      .replace(/\b\w/g, char => char.toUpperCase());
                  })();
                  const dayChecks =
                    practiceChecks[groupKey] ??
                    Array.from({ length: 7 }, () => false);
                  return (
                    <div
                      key={`${group.section}-${group.material}`}
                      className="rounded-2xl border border-[var(--c-ecebe7)] bg-[linear-gradient(135deg,var(--c-fcfcfb),var(--c-ffffff))] p-4 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.35)]"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="text-2xl font-semibold text-[var(--c-1f1f1d)]">
                            {`${group.section} - "${materialLabel}"`}
                          </h3>
                        </div>
                        <div />
                      </div>

                      <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.9fr)]">
                        <div className="space-y-3">
                          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--c-6f6c65)]">
                            Videos To Watch
                          </p>
                          <div className="space-y-2">
                            {group.items.map(item => {
                              const itemKey = `${item.section}|${item.material}|${item.part ?? ''}|${item.index}`;
                              const playedKey = buildPlayedKey(
                                item.material,
                                item.part,
                              );
                              const isWatched =
                                Boolean(videoWatched[itemKey]) ||
                                Boolean(playedVideos[playedKey]);
                              return (
                                <div
                                  key={itemKey}
                                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-faf9f6)] px-4 py-3"
                                >
                                  <div className="flex flex-col text-sm font-semibold uppercase tracking-[0.2em] text-[var(--c-1f1f1d)]">
                                    {(() => {
                                      const label = item.part || item.material;
                                      const match = label.match(
                                        /^\s*([\d.]+)\s*[–-]\s*(.+)$/,
                                      );
                                      if (match) {
                                        return (
                                          <>
                                            <span>{match[1]}</span>
                                            <span className="text-[12px] font-semibold text-[var(--c-6f6c65)]">
                                              {match[2]}
                                            </span>
                                          </>
                                        );
                                      }
                                      return <span>{label}</span>;
                                    })()}
                                  </div>
                                  <div className="inline-flex w-[260px] overflow-hidden rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] shadow-[0_12px_24px_-20px_rgba(0,0,0,0.45)]">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveVideoItem(item);
                                        setIsVideoModalOpen(true);
                                        markVideoWatched(itemKey);
                                        markPlayedGlobal(
                                          item.material,
                                          item.part,
                                        );
                                      }}
                                      className="flex w-1/2 items-center justify-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--c-1f1f1d)] transition hover:text-[var(--c-c8102e)]"
                                    >
                                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-[var(--c-1f1f1d)] bg-transparent text-[var(--c-1f1f1d)]">
                                        <svg
                                          viewBox="0 0 24 24"
                                          aria-hidden="true"
                                          className="h-3 w-3 fill-current"
                                        >
                                          <path
                                            d="M8 5l11 7-11 7V5z"
                                            fill="currentColor"
                                          />
                                        </svg>
                                      </span>
                                      Play
                                    </button>
                                    <span
                                      className={`flex w-1/2 items-center justify-center gap-2 border-l border-[var(--c-ecebe7)] px-6 py-2 text-xs font-semibold uppercase tracking-[0.22em] ${
                                        isWatched
                                          ? 'bg-[var(--c-e8efe9)] text-[var(--c-2d6a4f)]'
                                          : 'bg-[var(--c-fcfcfb)] text-[var(--c-9a9892)] opacity-35'
                                      }`}
                                    >
                                      <span
                                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                                          isWatched
                                            ? 'border-[var(--c-2d6a4f)] bg-[var(--c-2d6a4f)] text-white'
                                            : 'border-[var(--c-6f6c65)] bg-transparent text-[var(--c-6f6c65)]'
                                        }`}
                                      >
                                        <svg
                                          viewBox="0 0 24 24"
                                          aria-hidden="true"
                                          className="h-3 w-3"
                                        >
                                          <path
                                            d="M20 6L9 17l-5-5"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                        </svg>
                                      </span>
                                      Watched
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--c-6f6c65)]">
                            Mark Practice Days
                          </p>
                          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-faf9f6)] px-3 pb-4 pt-3 h-fit self-start">
                            <div className="grid grid-cols-4 gap-3">
                              {dayChecks.slice(0, 4).map((checked, idx) => {
                                const dayIndex = idx;
                                const labelDate =
                                  weekDates[dayIndex]?.toLocaleDateString(
                                    'en-US',
                                    {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric',
                                    },
                                  ) ?? WEEK_DAYS[dayIndex];
                                return (
                                  <button
                                    key={`${groupKey}-${dayIndex}`}
                                    type="button"
                                    aria-pressed={checked}
                                    title={`Mark practice for ${labelDate}`}
                                    onClick={() =>
                                      togglePracticeCheck(groupKey, dayIndex)
                                    }
                                    className={`flex flex-col items-center justify-center rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] transition shadow-sm ${
                                      checked
                                        ? 'border-[color:var(--c-c8102e)] bg-[var(--c-c8102e)] text-[var(--c-ffffff)] shadow-[0_10px_20px_-14px_rgba(200,16,46,0.9)]'
                                        : 'border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] text-[var(--c-9a9892)] hover:border-[color:var(--c-c8102e)]/50 hover:text-[var(--c-c8102e)] hover:shadow-md'
                                    }`}
                                  >
                                    <span>{WEEK_DAY_SHORT[dayIndex]}</span>
                                    <span className="text-[12px] normal-case">
                                      {weekDates[dayIndex]
                                        ? `${weekDates[dayIndex].getMonth() + 1}/${weekDates[dayIndex].getDate()}`
                                        : ''}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                            <div className="mt-2 grid grid-cols-3 gap-3">
                              {dayChecks.slice(4).map((checked, idx) => {
                                const dayIndex = idx + 4;
                                const labelDate =
                                  weekDates[dayIndex]?.toLocaleDateString(
                                    'en-US',
                                    {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric',
                                    },
                                  ) ?? WEEK_DAYS[dayIndex];
                                return (
                                  <button
                                    key={`${groupKey}-${dayIndex}`}
                                    type="button"
                                    aria-pressed={checked}
                                    title={`Mark practice for ${labelDate}`}
                                    onClick={() =>
                                      togglePracticeCheck(groupKey, dayIndex)
                                    }
                                    className={`flex flex-col items-center justify-center rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] transition shadow-sm ${
                                      checked
                                        ? 'border-[color:var(--c-c8102e)] bg-[var(--c-c8102e)] text-[var(--c-ffffff)] shadow-[0_10px_20px_-14px_rgba(200,16,46,0.9)]'
                                        : 'border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] text-[var(--c-9a9892)] hover:border-[color:var(--c-c8102e)]/50 hover:text-[var(--c-c8102e)] hover:shadow-md'
                                    }`}
                                  >
                                    <span>{WEEK_DAY_SHORT[dayIndex]}</span>
                                    <span className="text-[12px] normal-case">
                                      {weekDates[dayIndex]
                                        ? `${weekDates[dayIndex].getMonth() + 1}/${weekDates[dayIndex].getDate()}`
                                        : ''}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-faf9f6)] px-3 py-3">
                            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--c-6f6c65)]">
                              Ask A Question
                            </p>
                            <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                              Thread Subject: {materialLabel}
                            </p>
                            <textarea
                              value={questionDrafts[groupKey] ?? ''}
                              onChange={event =>
                                updateQuestionDraft(groupKey, event.target.value)
                              }
                              placeholder="Message your teacher about this lesson..."
                              className="mt-3 w-full rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-sm text-[var(--c-1f1f1d)] placeholder:text-[var(--c-9a9892)]"
                              rows={3}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                sendQuestion(groupKey, materialLabel)
                              }
                              disabled={
                                !questionDrafts[groupKey]?.trim() ||
                                questionStatus[groupKey] === 'sending'
                              }
                              className={`mt-3 inline-flex items-center justify-center rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                                questionDrafts[groupKey]?.trim()
                                  ? 'border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] text-[var(--c-1f1f1d)] hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]'
                                  : 'border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] text-[var(--c-9a9892)]'
                              }`}
                            >
                              {questionStatus[groupKey] === 'sending'
                                ? 'Sending...'
                                : questionStatus[groupKey] === 'sent'
                                  ? 'Sent'
                                  : questionStatus[groupKey] === 'error'
                                    ? 'Retry Send'
                                    : 'Send To Teacher'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[var(--c-6f6c65)]">
                No plan items saved yet.
              </p>
            )}
          </div>
        ) : (
          <p className="mt-4 text-sm text-[var(--c-6f6c65)]">
            Add practice goals, lesson notes, and progress updates when ready.
          </p>
        )}
      </section>
      {isVideoModalOpen && activeVideoItem ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsVideoModalOpen(false)}
          />
          <div className="relative w-full max-w-5xl rounded-3xl border border-white/10 bg-[#0b0b0b] p-6 text-white shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                  Viewing
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  {activeVideoItem.material}
                </h2>
                <p className="mt-2 text-sm text-white/70">
                  {activeVideoItem.part || 'Select a lesson part to begin.'}
                </p>
              </div>
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/70 transition hover:border-white/40 hover:text-white"
                aria-label="Close"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  className="h-4 w-4"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.22 5.22a.75.75 0 0 1 1.06 0L10 8.94l3.72-3.72a.75.75 0 1 1 1.06 1.06L11.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06L10 11.06l-3.72 3.72a.75.75 0 0 1-1.06-1.06L8.94 10 5.22 6.28a.75.75 0 0 1 0-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-[#070707]">
              <div className="relative flex aspect-video items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,6,6,0.65),rgba(3,3,3,0.95))]" />
                <div className="relative z-10 px-6 text-center">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/70">
                    Viewing
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold">
                    {activeVideoItem.material}
                  </h3>
                  <p className="mt-2 text-sm text-white/70">
                    {activeVideoItem.part || 'Select a lesson part to begin.'}
                  </p>
                </div>
                <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center gap-3 border-t border-white/10 bg-black/60 px-4 py-3 text-white">
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/15 text-sm text-white shadow-[0_8px_20px_rgba(0,0,0,0.35)] transition hover:border-white/40 hover:bg-white/25"
                    aria-label="Play"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-4 w-4 translate-x-[1px] fill-current"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                  <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold tracking-wide">
                    02:39
                  </span>
                  <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/20">
                    <div className="h-full w-[55%] rounded-full bg-white" />
                  </div>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/70">
                    <span>Vol</span>
                    <div className="h-1 w-12 rounded-full bg-white/20">
                      <div className="h-full w-[60%] rounded-full bg-white/70" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
