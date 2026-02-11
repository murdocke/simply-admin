'use client';

import { useEffect, useMemo, useState } from 'react';
import studentsData from '../../../../data/students.json';
import teachersData from '../../../../data/teachers.json';
import {
  VIEW_ROLE_STORAGE_KEY,
  VIEW_TEACHER_STORAGE_KEY,
} from '../../components/auth';
import LastViewedVideoCard from '../../components/last-viewed-video-card';
import StudentPromoCard from '../../components/student-promo-card';

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

type TeacherRecord = {
  id: string;
  name: string;
  email: string;
  username?: string;
};

type Message = {
  id: string;
  sender: 'teacher' | 'student' | 'corporate';
  text: string;
  timestamp: string;
};

type LastViewedVideo = {
  material: string;
  part?: string;
  materials?: string[];
  viewedAt?: string;
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

const getMonthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export default function TeacherDashboardPage() {
  const [now, setNow] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  });
  const [teacherName, setTeacherName] = useState<string | null>(null);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [viewingAs, setViewingAs] = useState<string | null>(null);
  const [isCompanyViewer, setIsCompanyViewer] = useState(false);
  const [isPrepOpen, setIsPrepOpen] = useState(false);
  const [prepStudent, setPrepStudent] = useState<StudentRecord | null>(null);
  const [prepForm, setPrepForm] = useState({
    focus: '',
    materials: '',
    goal: '',
    warmup: '',
    notes: '',
  });
  const [prepByStudent, setPrepByStudent] = useState<
    Record<
      string,
      {
        dateKey: string;
        focus: string;
        materials: string;
        goal: string;
        warmup: string;
        notes: string;
      }
    >
  >({});
  const [paymentStatus, setPaymentStatus] = useState<Record<string, boolean>>(
    {},
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentSenders, setRecentSenders] = useState<
    { id: string; label: string; threadId: string; unreadCount: number }[]
  >([]);
  const [lastViewedVideo, setLastViewedVideo] = useState<LastViewedVideo | null>(
    null,
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem('sm_user');
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as { username?: string; role?: string };
      if (parsed?.role === 'company') {
        setIsCompanyViewer(true);
        const storedView = window.localStorage.getItem(VIEW_ROLE_STORAGE_KEY);
        if (storedView === 'teacher') {
          const viewTeacherKey = parsed?.username
            ? `${VIEW_TEACHER_STORAGE_KEY}:${parsed.username}`
            : VIEW_TEACHER_STORAGE_KEY;
          const storedTeacher =
            window.localStorage.getItem(viewTeacherKey) ??
            window.localStorage.getItem(VIEW_TEACHER_STORAGE_KEY);
          if (storedTeacher) {
            try {
              const selected = JSON.parse(storedTeacher) as {
                username?: string;
                name?: string;
              };
              if (selected?.username) {
                setTeacherName(selected.username);
                setViewingAs(selected.name ?? selected.username);
                const teachers = (teachersData.teachers as TeacherRecord[]) ?? [];
                const match = teachers.find(
                  teacher => teacher.username === selected.username,
                );
                setTeacherId(match?.id ?? null);
                return;
              }
            } catch {
              setTeacherName(null);
              setTeacherId(null);
              setViewingAs(null);
            }
          }
        }
      }
      if (parsed?.role === 'teacher' && parsed?.username) {
        setIsCompanyViewer(false);
        setTeacherName(parsed.username);
        setViewingAs(null);
        const teachers = (teachersData.teachers as TeacherRecord[]) ?? [];
        const match = teachers.find(
          teacher => teacher.username === parsed.username,
        );
        setTeacherId(match?.id ?? null);
      }
    } catch {
      setTeacherName(null);
      setTeacherId(null);
      setViewingAs(null);
      setIsCompanyViewer(false);
    }
  }, []);

  useEffect(() => {
    const loadLastViewed = () => {
      try {
        const stored = window.localStorage.getItem('sm_last_viewed_video');
        if (!stored) {
          setLastViewedVideo(null);
          return;
        }
        setLastViewedVideo(JSON.parse(stored) as LastViewedVideo);
      } catch {
        setLastViewedVideo(null);
      }
    };
    loadLastViewed();
    window.addEventListener('sm-last-viewed-video', loadLastViewed);
    return () =>
      window.removeEventListener('sm-last-viewed-video', loadLastViewed);
  }, []);

  const selectedDayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(
        selectedDay,
      ),
    [selectedDay],
  );
  const selectedDayFullLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).format(selectedDay),
    [selectedDay],
  );
  const selectedDayFullSentence = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(selectedDay),
    [selectedDay],
  );
  const isSelectedDayToday = useMemo(
    () => selectedDay.toDateString() === new Date().toDateString(),
    [selectedDay],
  );
  const nextDay = useMemo(() => {
    const next = new Date(selectedDay);
    next.setDate(selectedDay.getDate() + 1);
    return next;
  }, [selectedDay]);
  const nextNextDay = useMemo(() => {
    const next = new Date(selectedDay);
    next.setDate(selectedDay.getDate() + 2);
    return next;
  }, [selectedDay]);
  const nextDayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(nextDay),
    [nextDay],
  );
  const nextNextDayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(nextNextDay),
    [nextNextDay],
  );
  const nextDayFullLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).format(nextDay),
    [nextDay],
  );
  const nextNextDayFullLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).format(nextNextDay),
    [nextNextDay],
  );
  const selectedDayLessons = useMemo(() => {
    const students = studentsData.students as StudentRecord[];
    return students.filter(
      student =>
        student.status === 'Active' &&
        student.lessonDay &&
        student.lessonDay.toLowerCase() === selectedDayLabel.toLowerCase(),
    );
  }, [selectedDayLabel]);
  const nextDayLessons = useMemo(() => {
    const students = studentsData.students as StudentRecord[];
    return students.filter(
      student =>
        student.status === 'Active' &&
        student.lessonDay &&
        student.lessonDay.toLowerCase() === nextDayLabel.toLowerCase(),
    );
  }, [nextDayLabel]);
  const nextNextDayLessons = useMemo(() => {
    const students = studentsData.students as StudentRecord[];
    return students.filter(
      student =>
        student.status === 'Active' &&
        student.lessonDay &&
        student.lessonDay.toLowerCase() === nextNextDayLabel.toLowerCase(),
    );
  }, [nextNextDayLabel]);
  const sortedNextDayLessons = useMemo(() => {
    return [...nextDayLessons].sort((a, b) => {
      const aMinutes = parseTimeToMinutes(a.lessonTime) ?? 0;
      const bMinutes = parseTimeToMinutes(b.lessonTime) ?? 0;
      return aMinutes - bMinutes;
    });
  }, [nextDayLessons]);
  const sortedNextNextDayLessons = useMemo(() => {
    return [...nextNextDayLessons].sort((a, b) => {
      const aMinutes = parseTimeToMinutes(a.lessonTime) ?? 0;
      const bMinutes = parseTimeToMinutes(b.lessonTime) ?? 0;
      return aMinutes - bMinutes;
    });
  }, [nextNextDayLessons]);
  const sortedSelectedLessons = useMemo(() => {
    return [...selectedDayLessons].sort((a, b) => {
      const aMinutes = parseTimeToMinutes(a.lessonTime) ?? 0;
      const bMinutes = parseTimeToMinutes(b.lessonTime) ?? 0;
      return aMinutes - bMinutes;
    });
  }, [selectedDayLessons]);
  const nextStudent = useMemo(() => {
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    if (!isSelectedDayToday) {
      return sortedSelectedLessons[0] ?? null;
    }
    const upcoming = sortedSelectedLessons.find(student => {
      const minutes = parseTimeToMinutes(student.lessonTime);
      return minutes !== null && minutes >= nowMinutes;
    });
    return upcoming ?? sortedSelectedLessons[0] ?? null;
  }, [isSelectedDayToday, now, sortedSelectedLessons]);

  const selectedDayKey = useMemo(
    () => selectedDay.toISOString().slice(0, 10),
    [selectedDay],
  );
  const monthKey = useMemo(() => getMonthKey(new Date()), []);

  const activeStudents = useMemo(() => {
    const students = studentsData.students as StudentRecord[];
    return students.filter(
      student =>
        student.status === 'Active' &&
        (!teacherName || student.teacher === teacherName),
    );
  }, [teacherName]);

  const unpaidCount = useMemo(
    () => activeStudents.filter(student => !paymentStatus[student.id]).length,
    [activeStudents, paymentStatus],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('sm_lesson_prep');
    if (!stored) {
      setPrepByStudent({});
      return;
    }
    try {
      const parsed = JSON.parse(stored) as typeof prepByStudent;
      setPrepByStudent(parsed ?? {});
    } catch {
      setPrepByStudent({});
    }
  }, []);

  useEffect(() => {
    if (!teacherName) return;
    const key = `sm_lesson_fees:${teacherName}:${monthKey}`;
    const stored = window.localStorage.getItem(key);
    if (!stored) {
      setPaymentStatus({});
      return;
    }
    try {
      const parsed = JSON.parse(stored) as { paid?: Record<string, boolean> };
      setPaymentStatus(parsed?.paid ?? {});
    } catch {
      setPaymentStatus({});
    }
  }, [monthKey, teacherName]);

  useEffect(() => {
    if (!teacherId) return;
    const READS_KEY = `sm_message_thread_reads:teacher:${teacherId}`;
    const LEGACY_READS_KEY = 'sm_message_thread_reads';
    const students = (studentsData.students as StudentRecord[]) ?? [];

    const computeUnread = async () => {
      const rawReads =
        window.localStorage.getItem(READS_KEY) ??
        window.localStorage.getItem(LEGACY_READS_KEY);
      const reads = rawReads
        ? (JSON.parse(rawReads) as Record<string, string>)
        : {};
      let threads: Record<string, Message[]> = {};
      try {
        const response = await fetch('/api/messages');
        if (response.ok) {
          const data = (await response.json()) as { threads?: Record<string, Message[]> };
          threads = data.threads ?? {};
        }
      } catch {
        threads = {};
      }

      const threadEntries = Object.entries(threads).filter(
        ([threadId, messages]) =>
          messages.length > 0 && threadId.endsWith(`teacher:${teacherId}`),
      );

      const unreadByThread = new Map<string, number>();
      const unreadMessages = threadEntries.reduce(
        (total, [threadId, messages]) => {
          const lastRead = reads[threadId];
          const threadUnread = messages.filter(message => {
            if (message.sender === 'teacher') return false;
            if (!lastRead) return true;
            return new Date(message.timestamp) > new Date(lastRead);
          }).length;
          unreadByThread.set(threadId, threadUnread);
          return total + threadUnread;
        },
        0,
      );

      setUnreadCount(unreadMessages);

      const sortedByRecent = [...threadEntries]
        .map(([threadId, messages]) => ({
          threadId,
          lastMessage: messages[messages.length - 1],
        }))
        .filter(item => item.lastMessage)
        .sort((a, b) => {
          const aTime = new Date(a.lastMessage!.timestamp).getTime();
          const bTime = new Date(b.lastMessage!.timestamp).getTime();
          return bTime - aTime;
        });

      const senders = sortedByRecent
        .map(item => {
          const unreadCountForThread = unreadByThread.get(item.threadId) ?? 0;
          if (item.threadId.startsWith('corporate|')) {
            return {
              id: item.threadId,
              label: 'Corporate',
              threadId: item.threadId,
              unreadCount: unreadCountForThread,
            };
          }
          const [studentPart] = item.threadId.split('|');
          const studentId = studentPart?.replace('student:', '');
          const student = students.find(s => s.id === studentId);
          return {
            id: studentId ?? item.threadId,
            label: student?.name ?? 'Student',
            threadId: item.threadId,
            unreadCount: unreadCountForThread,
          };
        })
        .filter((sender, index, self) => {
          return (
            self.findIndex(item => item.label === sender.label) === index
          );
        })
        .slice(0, 3);

      setRecentSenders(senders);
    };

    void computeUnread();
    const interval = window.setInterval(() => {
      void computeUnread();
    }, 5000);
    const handleUpdate = () => {
      void computeUnread();
    };
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.clearInterval(interval);
    };
  }, [teacherId]);

  const savePrepStore = (next: typeof prepByStudent) => {
    setPrepByStudent(next);
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('sm_lesson_prep', JSON.stringify(next));
  };

  const openPrepModal = (student: StudentRecord) => {
    setPrepStudent(student);
    const existing = prepByStudent[student.id];
    if (existing && existing.dateKey === selectedDayKey) {
      setPrepForm({
        focus: existing.focus,
        materials: existing.materials,
        goal: existing.goal,
        warmup: existing.warmup,
        notes: existing.notes,
      });
    } else {
      setPrepForm({
        focus: '',
        materials: '',
        goal: '',
        warmup: '',
        notes: '',
      });
    }
    setIsPrepOpen(true);
  };

  const closePrepModal = () => {
    setIsPrepOpen(false);
    setPrepStudent(null);
  };

  const handlePrepSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!prepStudent) return;
    const next = {
      ...prepByStudent,
      [prepStudent.id]: {
        dateKey: selectedDayKey,
        focus: prepForm.focus.trim(),
        materials: prepForm.materials.trim(),
        goal: prepForm.goal.trim(),
        warmup: prepForm.warmup.trim(),
        notes: prepForm.notes.trim(),
      },
    };
    savePrepStore(next);
    closePrepModal();
  };

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
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_0.6fr] lg:items-start">
        <div className="space-y-4">
          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
              Lessons
            </p>
            <p className="mt-3 text-3xl font-semibold text-[var(--c-1f1f1d)]">
              {sortedSelectedLessons.length}
            </p>
            <p className="mt-1 text-sm text-[var(--c-6f6c65)]">
              Scheduled for {selectedDayFullSentence}.
            </p>
            <div className="mt-4 space-y-2 text-sm text-[var(--c-3a3935)]">
              {sortedSelectedLessons.length > 0 ? (
                sortedSelectedLessons.map(student => {
                  const prepRecord = prepByStudent[student.id];
                  const isPrepared = prepRecord?.dateKey === selectedDayKey;
                  const isUnpaidForMonth = !paymentStatus[student.id];
                  return (
                    <div
                      key={student.id}
                      className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 shadow-[0_12px_24px_-18px_rgba(15,15,15,0.3)] ${
                        isPrepared
                          ? 'border-[color:var(--sidebar-accent-border)] bg-[var(--c-e7eddc)] ring-1 ring-[color:rgba(47,57,68,0.15)]'
                          : 'border-[var(--c-dfe6d2)] bg-[var(--c-e7eddc)]/75'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-full border shadow-sm ${
                            isPrepared
                              ? 'border-[color:rgba(31,41,55,0.2)] bg-[var(--c-1f1f1d)] text-[var(--c-ffffff)]'
                              : 'border-[var(--c-e5e3dd)] bg-[var(--c-f7f7f5)] text-[var(--c-9a9892)]'
                          }`}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                            className="h-4 w-4"
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
                        <div className="flex flex-col">
                          <span className="font-medium text-[var(--c-1f1f1d)]">
                            {student.name}
                          </span>
                          {isPrepared && prepRecord ? (
                            <div className="mt-2 space-y-2">
                              <div className="flex flex-wrap gap-2">
                                {[
                                  prepRecord.focus
                                    ? { label: 'Focus', value: prepRecord.focus }
                                    : null,
                                  prepRecord.materials
                                    ? {
                                        label: 'Materials',
                                        value: prepRecord.materials,
                                      }
                                    : null,
                                  prepRecord.goal
                                    ? { label: 'Goal', value: prepRecord.goal }
                                    : null,
                                  prepRecord.warmup
                                    ? {
                                        label: 'Warm-up',
                                        value: prepRecord.warmup,
                                      }
                                    : null,
                                ]
                                  .filter(Boolean)
                                  .map(item => (
                                    <span
                                      key={item?.label}
                                      className="inline-flex items-center gap-2 rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)]/90 px-3.5 py-2 text-[14px] shadow-sm"
                                    >
                                      <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                                        {item?.label}
                                      </span>
                                      <span className="text-[var(--c-1f1f1d)]">
                                        {item?.value}
                                      </span>
                                    </span>
                                  ))}
                              </div>
                              {prepRecord.notes ? (
                                <div className="flex flex-wrap gap-2">
                                  <span className="inline-flex items-center gap-2 rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)]/90 px-3.5 py-2 text-[14px] shadow-sm">
                                    <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                                      Notes
                                    </span>
                                    <span className="text-[var(--c-1f1f1d)]">
                                      {prepRecord.notes}
                                    </span>
                                  </span>
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {isUnpaidForMonth ? (
                          <span className="rounded-full bg-[var(--c-fce8d6)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-8a5b2b)]">
                            Unpaid
                          </span>
                        ) : null}
                        <span className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                          {student.lessonTime ?? 'TBD'}
                        </span>
                        <button
                          type="button"
                          onClick={() => openPrepModal(student)}
                          className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
                        >
                          Prep
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-[var(--c-6f6c65)]">
                  No lessons scheduled for {selectedDayLabel}.
                </p>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                Upcoming
              </p>
              <span className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                Next 2 days
              </span>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                  {nextDayFullLabel}
                </p>
                <p className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                  {sortedNextDayLessons.length}
                </p>
                <div className="mt-3 space-y-2">
                  {sortedNextDayLessons.length > 0 ? (
                    sortedNextDayLessons.slice(0, 4).map(student => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-xs text-[var(--c-6f6c65)]"
                      >
                        <span className="font-medium text-[var(--c-1f1f1d)]">
                          {student.name}
                        </span>
                        <span className="uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                          {student.lessonTime ?? 'TBD'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[var(--c-6f6c65)]">
                      No lessons scheduled.
                    </p>
                  )}
                </div>
              </div>
              <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                  {nextNextDayFullLabel}
                </p>
                <p className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                  {sortedNextNextDayLessons.length}
                </p>
                <div className="mt-3 space-y-2">
                  {sortedNextNextDayLessons.length > 0 ? (
                    sortedNextNextDayLessons.slice(0, 4).map(student => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-xs text-[var(--c-6f6c65)]"
                      >
                        <span className="font-medium text-[var(--c-1f1f1d)]">
                          {student.name}
                        </span>
                        <span className="uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                          {student.lessonTime ?? 'TBD'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[var(--c-6f6c65)]">
                      No lessons scheduled.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          {lastViewedVideo ? (
            <LastViewedVideoCard data={lastViewedVideo} />
          ) : null}
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-3 shadow-sm">
            <button
              type="button"
              onClick={() =>
                setSelectedDay(current => {
                  const next = new Date(current);
                  next.setDate(current.getDate() - 1);
                  return next;
                })
              }
              className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
            >
              Back
            </button>
            <span className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
              {selectedDayFullLabel}
            </span>
            <button
              type="button"
              onClick={() =>
                setSelectedDay(current => {
                  const next = new Date(current);
                  next.setDate(current.getDate() + 1);
                  return next;
                })
              }
              className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
            >
              Next
            </button>
          </div>
          {isCompanyViewer && viewingAs ? (
            <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                Viewing As
              </p>
              <p className="mt-3 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                {viewingAs}
              </p>
              <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                Company view of this teacher&apos;s dashboard.
              </p>
            </div>
          ) : null}
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
                  You&apos;re clear for {selectedDayLabel}.
                </p>
              </>
            )}
          </div>
          <StudentPromoCard
            title="Jazz Colors: Teacher Edition"
            body="Quick coaching ideas, voicing tips, and a groove-first approach to keep students smiling."
            ctaLabel="View Lesson Pack Details"
            ctaHref="/teachers?mode=training"
          />
          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                Messages
              </p>
              <a
                href="/teachers/messages"
                className="text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)] hover:text-[var(--c-c8102e)]"
              >
                View
              </a>
            </div>
            <a href="/teachers/messages" className="mt-3 block">
              <p className="text-2xl font-semibold text-[var(--c-1f1f1d)]">
                {unreadCount}
              </p>
              <p className="mt-1 text-sm text-[var(--c-6f6c65)]">
                Unread messages
              </p>
            </a>
            <div className="mt-4 flex flex-wrap gap-2">
              {recentSenders.length === 0 ? (
                <span className="text-xs text-[var(--c-9a9892)]">
                  No recent senders.
                </span>
              ) : (
                recentSenders.map(sender => (
                  <a
                    key={sender.threadId}
                    href={`/teachers/messages?thread=${encodeURIComponent(
                      sender.threadId,
                    )}`}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-fcfcfb)] px-4 py-2 text-sm text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
                  >
                    {sender.label}
                    {sender.unreadCount > 0 ? (
                      <span className="rounded-full bg-[var(--c-c8102e)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                        {sender.unreadCount}
                      </span>
                    ) : null}
                  </a>
                ))
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
              Students Unpaid
            </p>
            <p className="mt-3 text-2xl font-semibold text-[var(--c-1f1f1d)]">
              {unpaidCount}
            </p>
            <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
              {unpaidCount === 0
                ? 'Everyone is caught up.'
                : 'Follow up before month-end.'}
            </p>
          </div>
        </div>
      </section>

      {isPrepOpen && prepStudent ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closePrepModal}
          />
          <form
            className="relative w-full max-w-xl rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-xl"
            onSubmit={handlePrepSubmit}
            onKeyDown={event => {
              if (
                event.key === 'Enter' &&
                event.target instanceof HTMLTextAreaElement
              ) {
                return;
              }
              if (event.key === 'Enter') {
                event.preventDefault();
                handlePrepSubmit(event as unknown as React.FormEvent<HTMLFormElement>);
              }
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                  Lesson Prep
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                  <span className="block">Preparing for Today&apos;s Lesson</span>
                  <span className="block">
                    with {prepStudent.name.split(' ')[0] ?? prepStudent.name}
                  </span>
                </h2>
                <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                  Capture quick notes and plan the focus for this session.
                </p>
              </div>
              <button
                type="button"
                onClick={closePrepModal}
                className="rounded-full border border-[var(--c-ecebe7)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Lesson Focus
                <input
                  type="text"
                  value={prepForm.focus}
                  onChange={event =>
                    setPrepForm(current => ({
                      ...current,
                      focus: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                  placeholder="Technique, repertoire, theory"
                />
              </label>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Materials
                <input
                  type="text"
                  value={prepForm.materials}
                  onChange={event =>
                    setPrepForm(current => ({
                      ...current,
                      materials: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                  placeholder="Song, book, PDF"
                />
              </label>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Goal for Today
                <input
                  type="text"
                  value={prepForm.goal}
                  onChange={event =>
                    setPrepForm(current => ({
                      ...current,
                      goal: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                  placeholder="What success looks like"
                />
              </label>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Warm-up Plan
                <input
                  type="text"
                  value={prepForm.warmup}
                  onChange={event =>
                    setPrepForm(current => ({
                      ...current,
                      warmup: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                  placeholder="Scales, chords, drills"
                />
              </label>
            </div>
            <label className="mt-4 block text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
              Notes
              <textarea
                value={prepForm.notes}
                onChange={event =>
                  setPrepForm(current => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                className="mt-2 min-h-[120px] w-full resize-none rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                placeholder="Anything else to remember for today..."
              />
            </label>
            <button
              type="submit"
              className="mt-6 w-full rounded-2xl border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)] transition hover:brightness-110"
            >
              Submit Prep
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
