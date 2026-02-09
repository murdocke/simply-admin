'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  VIEW_ROLE_STORAGE_KEY,
  VIEW_TEACHER_STORAGE_KEY,
} from '../components/auth';
import lessonTypes from './students/lesson-data/lesson-types.json';
import lessonSections from './students/lesson-data/lesson-sections.json';
import LockedSectionCard from '../components/locked-section-card';
import LessonCartPurchaseButton from '../components/lesson-cart-actions';
import StudentPromoCard from '../components/student-promo-card';
import studentsData from '@/data/students.json';

type TeacherRecord = {
  id: string;
  company: string;
  name: string;
  email: string;
  region: string;
  status:
    | 'Licensed'
    | 'Certified'
    | 'Advanced'
    | 'Master'
    | 'Onboarding'
    | 'Inactive'
    | 'Active';
  createdAt: string;
  updatedAt: string;
};

type StudentRecord = {
  id: string;
  teacher: string;
  name: string;
  status: 'Active' | 'Paused' | 'Archived';
  lessonDay?: string;
  lessonTime?: string;
  lessonDuration?: '30M' | '45M' | '1HR';
};

const defaultForm = {
  name: '',
  email: '',
  region: 'Unassigned',
  status: 'Licensed' as const,
};

const normalizeTeacherStatus = (
  status:
    | 'Licensed'
    | 'Certified'
    | 'Advanced'
    | 'Master'
    | 'Onboarding'
    | 'Inactive'
    | 'Active',
) => (status === 'Active' ? 'Licensed' : status);

const statusStyles: Record<string, string> = {
  Licensed: 'bg-[var(--c-e7eddc)] text-[var(--c-3f4a2c)]',
  Certified: 'bg-[var(--c-e6eef8)] text-[var(--c-28527a)]',
  Advanced: 'bg-[var(--c-f4f0ff)] text-[var(--c-47308a)]',
  Master: 'bg-[var(--c-fff2d9)] text-[var(--c-7a4a17)]',
  Onboarding: 'bg-[var(--c-fff2d9)] text-[var(--c-8a5b2b)]',
  Inactive: 'bg-[var(--c-f3e5e5)] text-[var(--c-7a3b3b)]',
};

const toProgramSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

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

const durationToMinutes = (value?: StudentRecord['lessonDuration']) => {
  if (value === '45M') return 45;
  if (value === '1HR') return 60;
  return 30;
};

export default function TeachersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [viewRole, setViewRole] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [teacherName, setTeacherName] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [quickNote, setQuickNote] = useState('');
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
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<TeacherRecord | null>(null);
  const [formState, setFormState] = useState(defaultForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const notifyTeachersUpdated = () => {
    try {
      window.localStorage.setItem(
        'sm_teachers_updated',
        String(Date.now()),
      );
      window.dispatchEvent(new Event('sm-teachers-updated'));
    } catch {
      window.dispatchEvent(new Event('sm-teachers-updated'));
    }
  };

  useEffect(() => {
    const stored = window.localStorage.getItem('sm_user');
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as { username?: string; role?: string };
      if (parsed?.username) {
        setCompanyName(parsed.username);
      }
      if (parsed?.role) {
        setRole(parsed.role);
      }
      if (parsed?.role === 'company') {
        const storedView = window.localStorage.getItem(VIEW_ROLE_STORAGE_KEY);
        if (storedView) {
          setViewRole(storedView);
        }
      }
      if (parsed?.role === 'teacher' && parsed?.username) {
        setTeacherName(parsed.username);
      }
      if (parsed?.role === 'company') {
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
              };
              if (selected?.username) {
                setTeacherName(selected.username);
              }
            } catch {
              setTeacherName(null);
            }
          }
        }
      }
    } catch {
      setCompanyName(null);
      setRole(null);
      setViewRole(null);
      setTeacherName(null);
    }
  }, []);

  const effectiveRole = role === 'company' && viewRole ? viewRole : role;
  const hubMode = useMemo(
    () => (searchParams.get('mode') === 'teaching' ? 'teaching' : 'training'),
    [searchParams],
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
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

  const offsetNow = useMemo(() => new Date(now.getTime() + 70_000), [now]);
  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(now),
    [now],
  );
  const todayKey = useMemo(
    () => now.toISOString().slice(0, 10),
    [now],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const key = `sm_teacher_quick_note:${teacherName ?? 'default'}:${todayKey}`;
    try {
      const stored = window.localStorage.getItem(key);
      setQuickNote(stored ?? '');
    } catch {
      setQuickNote('');
    }
  }, [teacherName, todayKey]);

  const activeStudents = useMemo(() => {
    const students = studentsData.students as StudentRecord[];
    return students.filter(
      student =>
        student.status === 'Active' &&
        (!teacherName || student.teacher === teacherName),
    );
  }, [teacherName]);

  const todayLessons = useMemo(() => {
    return activeStudents
      .filter(
        student =>
          student.lessonDay?.toLowerCase() === todayLabel.toLowerCase(),
      )
      .slice()
      .sort((a, b) => {
        const aMinutes = parseTimeToMinutes(a.lessonTime) ?? 0;
        const bMinutes = parseTimeToMinutes(b.lessonTime) ?? 0;
        return aMinutes - bMinutes;
      });
  }, [activeStudents, todayLabel]);

  const currentLessonIndex = useMemo(() => {
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return todayLessons.findIndex(lesson => {
      const start = parseTimeToMinutes(lesson.lessonTime);
      if (start === null) return false;
      const duration = durationToMinutes(lesson.lessonDuration);
      return nowMinutes >= start && nowMinutes < start + duration;
    });
  }, [now, todayLessons]);

  const nextLessonIndex = useMemo(() => {
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return todayLessons.findIndex(lesson => {
      const start = parseTimeToMinutes(lesson.lessonTime);
      return start !== null && start >= nowMinutes;
    });
  }, [now, todayLessons]);

  const currentLesson =
    currentLessonIndex >= 0 ? todayLessons[currentLessonIndex] : null;
  const upcomingLesson =
    nextLessonIndex >= 0 ? todayLessons[nextLessonIndex] : null;
  const nextLesson =
    currentLessonIndex >= 0
      ? todayLessons[currentLessonIndex + 1] ?? null
      : upcomingLesson;
  const upcomingLessons = useMemo(() => {
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return todayLessons.filter(lesson => {
      const start = parseTimeToMinutes(lesson.lessonTime);
      if (start === null) return false;
      const duration = durationToMinutes(lesson.lessonDuration);
      return start + duration > nowMinutes;
    });
  }, [now, todayLessons]);
  const scheduleStartIndex =
    currentLessonIndex >= 0
      ? currentLessonIndex
      : nextLessonIndex >= 0
        ? nextLessonIndex
        : todayLessons.length;
  const schedulePreview = todayLessons.slice(
    scheduleStartIndex,
    scheduleStartIndex + 3,
  );

  const getPrepSummary = (student?: StudentRecord | null) => {
    if (!student) return [];
    const record = prepByStudent[student.id];
    if (!record || record.dateKey !== todayKey) return [];
    return [
      record.focus ? { label: 'Focus', value: record.focus } : null,
      record.materials ? { label: 'Materials', value: record.materials } : null,
      record.goal ? { label: 'Goal', value: record.goal } : null,
      record.warmup ? { label: 'Warm-up', value: record.warmup } : null,
      record.notes ? { label: 'Notes', value: record.notes } : null,
    ].filter(Boolean) as { label: string; value: string }[];
  };
  const getPrepNotes = (student?: StudentRecord | null) => {
    if (!student) return null;
    const record = prepByStudent[student.id];
    if (!record || record.dateKey !== todayKey) return null;
    return record.notes?.trim() ? record.notes.trim() : null;
  };

  const handleQuickNoteSave = () => {
    if (typeof window === 'undefined') return;
    const key = `sm_teacher_quick_note:${teacherName ?? 'default'}:${todayKey}`;
    try {
      window.localStorage.setItem(key, quickNote.trim());
    } catch {
      // ignore storage failures
    }
  };

  useEffect(() => {
    if (effectiveRole === 'company') {
      router.replace('/accounts');
    }
  }, [effectiveRole, router]);

  useEffect(() => {
    if (!companyName || effectiveRole !== 'company') return;
    let isActive = true;
    const fetchTeachers = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/teachers?company=${encodeURIComponent(companyName)}`,
        );
        const data = (await response.json()) as { teachers: TeacherRecord[] };
        if (isActive) {
          setTeachers(data.teachers ?? []);
        }
      } catch {
        if (isActive) setError('Unable to load teachers right now.');
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    fetchTeachers();
    return () => {
      isActive = false;
    };
  }, [companyName, effectiveRole]);

  useEffect(() => {
    if (effectiveRole !== 'company') return;
    if (searchParams.get('new') === '1') {
      openCreateModal();
      router.replace('/teachers', { scroll: false });
    }
  }, [searchParams, router, effectiveRole]);

  const rosterCount = useMemo(() => teachers.length, [teachers.length]);

  const handleHubModeChange = (nextMode: 'training' | 'teaching') => {
    router.push(`/teachers?mode=${nextMode}`, { scroll: false });
  };

  const openCreateModal = () => {
    setEditing(null);
    setFormState(defaultForm);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (teacher: TeacherRecord) => {
    setEditing(teacher);
    setFormState({
      name: teacher.name,
      email: teacher.email,
      region: teacher.region,
      status: normalizeTeacherStatus(teacher.status) as
        | 'Licensed'
        | 'Certified'
        | 'Advanced'
        | 'Master'
        | 'Onboarding'
        | 'Inactive',
    });
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setEditing(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!companyName) return;
    setIsSaving(true);
    setError(null);

    try {
      const payload = {
        company: companyName ?? editing?.company ?? 'company',
        name: formState.name.trim(),
        email: formState.email.trim(),
        region: formState.region,
        status: formState.status,
      };

      if (!payload.name) {
        setError('Teacher name is required.');
        setIsSaving(false);
        return;
      }

      const response = await fetch(
        editing ? `/api/teachers/${editing.id}` : '/api/teachers',
        {
          method: editing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        throw new Error('Request failed');
      }

      const data = (await response.json()) as { teacher: TeacherRecord };
      if (editing) {
        setTeachers(current =>
          current.map(teacher =>
            teacher.id === data.teacher.id ? data.teacher : teacher,
          ),
        );
      } else {
        setTeachers(current => [data.teacher, ...current]);
      }
      notifyTeachersUpdated();
      setIsModalOpen(false);
      setEditing(null);
      setFormState(defaultForm);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (teacher: TeacherRecord) => {
    const company = companyName ?? teacher.company;
    if (!company) return;
    const confirmed = window.confirm(`Remove ${teacher.name} from teachers?`);
    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/teachers/${teacher.id}?company=${encodeURIComponent(company)}`,
        {
          method: 'DELETE',
        },
      );

      if (!response.ok) {
        throw new Error('Request failed');
      }

      setTeachers(current =>
        current.filter(currentTeacher => currentTeacher.id !== teacher.id),
      );
      notifyTeachersUpdated();
    } catch {
      setError('Unable to delete that teacher right now.');
    }
  };

  if (effectiveRole !== 'company') {
    return (
      <div className="space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="md:max-w-[50%]">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
              Teachers
            </p>
            <h1 className="text-3xl font-semibold text-[var(--c-1f1f1d)] mt-2">
              {hubMode === 'teaching' ? 'Teaching Hub' : 'Training Hub'}
            </h1>
            <p className="text-sm text-[var(--c-6f6c65)] mt-2">
              {hubMode === 'teaching'
                ? 'Lesson delivery resources, coaching tools, and studio support.'
                : 'Curriculum paths, practice coaching, and studio readiness tools.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {hubMode === 'teaching' ? (
              <div className="text-right">
                <span className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--c-1f1f1d)]">
                  {new Intl.DateTimeFormat('en-US', {
                    month: 'short',
                    day: 'numeric',
                  }).format(offsetNow)}{' '}
                  ·{' '}
                  {new Intl.DateTimeFormat('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  }).format(offsetNow)}
                </span>
                <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                  Fast clock
                </p>
              </div>
            ) : null}
            <button
              className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] transition ${
                hubMode === 'training'
                  ? 'border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] text-[var(--sidebar-accent-text)]'
                  : 'border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] text-[var(--c-6f6c65)] hover:border-[var(--sidebar-accent-border)] hover:text-[var(--sidebar-accent-text)]'
              }`}
              onClick={() => handleHubModeChange('training')}
            >
              Training
            </button>
            <button
              className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] transition ${
                hubMode === 'teaching'
                  ? 'border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] text-[var(--sidebar-accent-text)]'
                  : 'border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] text-[var(--c-6f6c65)] hover:border-[var(--sidebar-accent-border)] hover:text-[var(--sidebar-accent-text)]'
              }`}
              onClick={() => handleHubModeChange('teaching')}
            >
              Teaching
            </button>
          </div>
        </header>

        {hubMode === 'training' ? (
          <>
            <div className="rounded-2xl border border-[var(--c-f2dac5)] bg-[var(--c-fff7e8)] px-5 py-4 text-sm text-[var(--c-7a4a17)] shadow-[0_12px_30px_-24px_rgba(0,0,0,0.35)]">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-7a4a17)]">
                Training Mode
              </p>
              <p className="mt-2 text-base font-semibold text-[var(--c-1f1f1d)]">
                If you&apos;re about to teach, switch to the Teaching Hub.
              </p>
              <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                Teaching mode shows today&apos;s schedule, prep notes, and next-student
                details at a glance.
              </p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => handleHubModeChange('teaching')}
                  className="rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)] transition hover:brightness-110"
                >
                  Switch to Teaching
                </button>
              </div>
            </div>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <StudentPromoCard
                title="Jazz Colors: Teacher Edition"
                body="Quick coaching ideas, voicing tips, and a groove-first approach to keep students smiling."
                ctaLabel="View Lesson Pack Details"
                ctaHref="/teachers?mode=training"
              />
              <StudentPromoCard
                title="Studio Warm-Ups Pack"
                body="Five-minute warmups, rhythm resets, and confidence builders you can drop into any lesson."
                imageSrc="/reference/SIGHT-READING.png"
                ctaLabel="View Lesson Pack Details"
                ctaHref="/teachers?mode=training"
              />
              <StudentPromoCard
                title="Sight-Reading Sprint"
                body="Fast drills and pacing notes to help students read with ease (and less hesitation)."
                imageSrc="/reference/WARM-UPS.png"
                ctaLabel="View Lesson Pack Details"
                ctaHref="/teachers?mode=training"
              />
            </section>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <StudentPromoCard
                title="Ivory League Coaching"
                eyebrowLabel="Coach Spotlight"
                pillLabel="Approved Coaching"
                body="Laurie Richards offers personalized coaching to sharpen teaching flow and studio leadership."
                imageSrc="/reference/SMDT-Coaching-Ivory-League.webp"
                imageFit="contain"
                imageFrame="white"
                ctaLabel="View Coaching Program"
                ctaHref="/teachers?mode=training"
              />
              <StudentPromoCard
                title="Music Teacher's Coach"
                eyebrowLabel="Coach Spotlight"
                pillLabel="Approved Coaching"
                body="Robin Quinn Keehn shares a mastermind approach to build sustainable studio habits."
                imageSrc="/reference/SMDT-Coaching-Quitting-Culture.webp"
                imageFit="contain"
                imageFrame="white"
                ctaLabel="View Coaching Program"
                ctaHref="/teachers?mode=training"
              />
              <StudentPromoCard
                title="Inspired Teacher Coaching"
                eyebrowLabel="Coach Spotlight"
                pillLabel="Approved Coaching"
                body="Bernadette Ashby delivers tailored coaching to re‑ignite your teaching energy."
                imageSrc="/reference/SMDT-Coaching-Inspired-Teacher.webp"
                imageFit="contain"
                imageFrame="white"
                ctaLabel="View Coaching Program"
                ctaHref="/teachers?mode=training"
              />
            </section>
          </>
        ) : null}

        {hubMode === 'teaching' ? (
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_0.6fr] lg:items-stretch">
            <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                Teaching Flow
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                {currentLesson ? 'Current Lesson' : 'Next Lesson'}
              </h2>
              <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                {currentLesson
                  ? `In progress right now.`
                  : `Up next for ${todayLabel}.`}
              </p>

              <div className="mt-4 rounded-2xl border border-[var(--c-dfe6d2)] bg-[var(--c-e7eddc)] p-4">
                {currentLesson || nextLesson ? (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <div>
                          <p className="text-lg font-semibold text-[var(--c-1f1f1d)]">
                            {(currentLesson ?? nextLesson)?.name}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                            {(currentLesson ?? nextLesson)?.lessonTime ?? 'Time TBD'}
                          </p>
                        </div>
                        {getPrepNotes(currentLesson ?? nextLesson) ? (
                          <span className="inline-flex flex-col self-center rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-1 text-left text-[13px] text-[var(--c-6f6c65)]">
                            <span className="uppercase tracking-[0.2em] text-[11px] text-[var(--c-9a9892)]">
                              Notes
                            </span>
                            <span className="text-[var(--c-1f1f1d)]">
                              {getPrepNotes(currentLesson ?? nextLesson)}
                            </span>
                          </span>
                        ) : null}
                      </div>
                      <span className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                        {currentLesson ? 'Now' : 'Next'}
                      </span>
                    </div>
                    {!getPrepNotes(currentLesson ?? nextLesson) ? (
                      <p className="mt-3 text-sm text-[var(--c-6f6c65)]">
                        No prep notes yet for this lesson.
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="text-sm text-[var(--c-6f6c65)]">
                    No lessons scheduled for today.
                  </p>
                )}
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                    ({upcomingLessons.length}) Lessons Upcoming Today
                  </p>
                </div>
                <div className="mt-2 space-y-2">
                  {schedulePreview.length > 0 ? (
                    schedulePreview.map(lesson => (
                      <div
                        key={lesson.id}
                        className="rounded-xl border border-[var(--c-dfe6d2)] bg-[var(--c-e7eddc)] px-3 py-2 text-sm text-[var(--c-6f6c65)] shadow-[0_10px_24px_-20px_rgba(15,15,15,0.35)]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="font-medium text-[var(--c-1f1f1d)]">
                              {lesson.name}
                            </span>
                            {getPrepNotes(lesson) ? (
                              <span className="inline-flex flex-col self-center rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-1 text-left text-[13px] text-[var(--c-6f6c65)]">
                                <span className="uppercase tracking-[0.2em] text-[11px] text-[var(--c-9a9892)]">
                                  Notes
                                </span>
                                <span className="text-[var(--c-1f1f1d)]">
                                  {getPrepNotes(lesson)}
                                </span>
                              </span>
                            ) : null}
                          </div>
                          <span className="uppercase tracking-[0.2em] text-[10px] text-[var(--c-9a9892)]">
                            {lesson.lessonTime ?? 'TBD'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[var(--c-6f6c65)]">
                      You&apos;re clear for the rest of today.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                  Next Student
                </p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--c-1f1f1d)]">
                  {nextLesson?.name ?? 'No one up next'}
                </h2>
                <p className="mt-2 text-[15px] text-[var(--c-6f6c65)]">
                  {nextLesson
                    ? `Lesson at ${nextLesson.lessonTime ?? 'TBD'}`
                    : 'No upcoming lessons scheduled for today.'}
                </p>
                {nextLesson ? (
                  <div className="mt-3">
                    {getPrepNotes(nextLesson) ? (
                      <span className="inline-flex flex-col self-center rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-1 text-left text-[14px] text-[var(--c-6f6c65)]">
                        <span className="uppercase tracking-[0.2em] text-[12px] text-[var(--c-9a9892)]">
                          Notes
                        </span>
                        <span className="text-[var(--c-1f1f1d)]">
                          {getPrepNotes(nextLesson)}
                        </span>
                      </span>
                    ) : (
                      <p className="text-[15px] text-[var(--c-6f6c65)]">
                        No prep notes yet for this student.
                      </p>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                  Quick Note
                </p>
                <h3 className="mt-2 text-lg font-semibold text-[var(--c-1f1f1d)]">
                  {currentLesson?.name
                    ? `${currentLesson.name} (Current Lesson)`
                    : nextLesson?.name
                      ? `${nextLesson.name} (Next Lesson)`
                      : 'Current Lesson'}
                </h3>
                <p className="mt-2 text-[15px] text-[var(--c-6f6c65)]">
                  Capture a quick reminder while the lesson is fresh.
                </p>
                <textarea
                  value={quickNote}
                  onChange={event => setQuickNote(event.target.value)}
                  placeholder="Add a quick note..."
                  className="mt-3 min-h-[90px] w-full resize-none rounded-xl border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                />
                <button
                  type="button"
                  onClick={handleQuickNoteSave}
                  className="mt-3 inline-flex items-center justify-center rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)] transition hover:brightness-110"
                >
                  Save Note
                </button>
              </div>
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                Curriculum
              </p>
              <h2 className="text-2xl font-semibold text-[var(--c-1f1f1d)] mt-2">
                Program Library
              </h2>
              <p className="text-sm text-[var(--c-6f6c65)] mt-2">
                Browse each program and open a section to see materials.
              </p>
            </div>
            <div className="md:pt-4">
              <LessonCartPurchaseButton />
            </div>
          </div>
          <div className="mt-6 space-y-6">
            {lessonTypes
              .filter(
                type =>
                  type !== 'Learn-at-Home' && type !== 'Simply Music Gateway',
              )
              .map(type => {
              const sectionData =
                lessonSections[type as keyof typeof lessonSections];
              const sections = Array.isArray(sectionData)
                ? sectionData
                : sectionData
                  ? Object.values(sectionData).flat()
                  : [];
              return (
              <div
                key={type}
                id={type === 'Development Program' ? 'development-program' : undefined}
                className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-5"
              >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="w-full">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                        {type}
                      </p>
                      <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                        {sections.length > 0
                          ? 'Choose a section to view materials.'
                          : 'No sections available yet.'}
                      </p>
                      {type === 'Extensions Program' ? (
                        <p className="mt-3 text-sm text-[var(--c-6f6c65)]">
                          The Extensions Program is a further collection of
                          pieces that provide additional source material for
                          both beginning or more advanced students. It consists
                          of new or re-purposed compositions and arrangements,
                          many of which have two or three presentation versions
                          provided, each pertaining to students who may be at
                          different stages of their learning.
                        </p>
                      ) : null}
                    </div>
                    <div className="sm:pt-1">
                      <Link
                        href={`/teachers/programs/${toProgramSlug(type)}?mode=${hubMode}`}
                        className="inline-flex items-center whitespace-nowrap rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-1.5 text-[12px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
                      >
                        View all
                      </Link>
                    </div>
                  </div>
                  {sections.length > 0 ? (
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                      {Array.isArray(sectionData) ? (
                        <>
                          <div className="min-w-0 space-y-4">
                            {sections
                              .slice(0, Math.ceil(sections.length / 2))
                              .map(section => (
                                <LockedSectionCard
                                  key={section}
                                  programName={type}
                                  sectionName={section}
                                  href={`/teachers/programs/${toProgramSlug(type)}/${toProgramSlug(section)}?mode=${hubMode}`}
                                />
                              ))}
                          </div>
                          <div className="min-w-0 space-y-4">
                            {sections
                              .slice(Math.ceil(sections.length / 2))
                              .map(section => (
                                <LockedSectionCard
                                  key={section}
                                  programName={type}
                                  sectionName={section}
                                  href={`/teachers/programs/${toProgramSlug(type)}/${toProgramSlug(section)}?mode=${hubMode}`}
                                />
                              ))}
                          </div>
                        </>
                      ) : (
                        <div className="col-span-full space-y-10">
                          {Object.entries(sectionData ?? {}).map(
                            ([group, groupSections]) => (
                              <div key={group} className="space-y-4">
                                <p className="text-sm font-semibold tracking-[0.2em] text-white">
                                  {group}
                                </p>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                  {groupSections.map(section => (
                                    <LockedSectionCard
                                      key={section}
                                      programName={type}
                                      sectionName={section}
                                      href={`/teachers/programs/${toProgramSlug(type)}/${toProgramSlug(section)}?mode=${hubMode}`}
                                    />
                                  ))}
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                Special Needs Program
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--c-1f1f1d)]">
                Simply Music Gateway
              </p>
              <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                The Simply Music Gateway Program is a playing-based piano
                method designed for anybody with special needs and learning
                differences, including those on the Autism spectrum, as well
                as those with learning disabilities, neurological
                dysfunction, developmental delays, and ADHD.
              </p>
              <div className="mt-4">
                <LockedSectionCard
                  programName="Simply Music Gateway"
                  sectionName="Materials"
                  href={`/teachers/programs/${toProgramSlug('Simply Music Gateway')}/${toProgramSlug('Materials')}?mode=${hubMode}`}
                />
              </div>
            </div>
              <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                  Self-Study Programs
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-1.5 text-xs font-semibold text-[var(--c-1f1f1d)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]">
                    Music &amp; Creativity
                  </button>
                  <Link
                    href={`/teachers/programs/${toProgramSlug('Learn-at-Home')}/${toProgramSlug('Materials')}?mode=${hubMode}`}
                    className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-1.5 text-xs font-semibold text-[var(--c-1f1f1d)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
                  >
                    Learn-at-Home
                  </Link>
                </div>
                <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                  Many students who complete our self-study programs continue
                  into lessons with a Simply Music Teacher. So you are aware of
                  the content provided, you may access these programs for
                  reference in case you acquire a self-study student.
                </p>
                <p className="mt-3 text-sm text-[var(--c-6f6c65)]">
                  We highly recommend that you create your own free Music &amp;
                  Creativity Program (MAC) account and familiarize yourself
                  with the contents. MAC replaces a prior self-study course,
                  the Learn-at-Home Program (LAH), that was produced and
                  released in 1999.
                </p>
                <p className="mt-3 text-sm text-[var(--c-6f6c65)]">
                  For more information on self-study programs please review the
                  Extras portion of Module 10 of the Initial Teacher Training
                  Program (ITTP).
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (effectiveRole === 'company') {
    return null;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
            Company
          </p>
          <h1 className="text-3xl font-semibold text-[var(--c-1f1f1d)] mt-2">
            Teachers
          </h1>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            Add new teachers, update status, and track studio coverage.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="rounded-full bg-[var(--c-c8102e)] px-5 py-2 text-xs uppercase tracking-[0.2em] text-white transition hover:brightness-110"
        >
          Add Teacher
        </button>
      </header>

      <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
              Teacher Directory
            </p>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
              {rosterCount} teachers
            </p>
          </div>
          {error ? (
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
              {error}
            </p>
          ) : null}
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--c-ecebe7)]">
          <div className="grid grid-cols-12 gap-2 bg-[var(--c-f7f7f5)] px-4 py-3 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
            <div className="col-span-4">Teacher</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-2">Region</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>
          <div className="divide-y divide-[var(--c-ecebe7)]">
            {isLoading ? (
              <div className="px-4 py-6 text-sm text-[var(--c-6f6c65)]">
                Loading teachers...
              </div>
            ) : teachers.length === 0 ? (
              <div className="px-4 py-6 text-sm text-[var(--c-6f6c65)]">
                No teachers yet. Add your first teacher to get started.
              </div>
            ) : (
              teachers.map(teacher => (
                <div
                  key={teacher.id}
                  className="grid grid-cols-12 items-center gap-2 px-4 py-4 text-sm"
                >
                  <div className="col-span-4">
                    <p className="font-medium text-[var(--c-1f1f1d)]">
                      {teacher.name}
                    </p>
                    <p className="text-xs text-[var(--c-9a9892)]">
                      Added {new Date(teacher.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="col-span-3 text-[var(--c-6f6c65)]">
                    {teacher.email || '—'}
                  </div>
                  <div className="col-span-2">
                    <span className="rounded-full border border-[var(--c-e5e3dd)] px-3 py-1 text-xs text-[var(--c-6f6c65)]">
                      {teacher.region}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        statusStyles[normalizeTeacherStatus(teacher.status)] ??
                        statusStyles.Inactive
                      }`}
                    >
                      {normalizeTeacherStatus(teacher.status)}
                    </span>
                  </div>
                  <div className="col-span-1 flex justify-end gap-2">
                    <button
                      className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
                      onClick={() => openEditModal(teacher)}
                    >
                      Edit
                    </button>
                    <button
                      className="rounded-full border border-[var(--c-f2d7db)] bg-[var(--c-fff5f6)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-8f2f3b)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
                      onClick={() => handleDelete(teacher)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative w-full max-w-xl rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                  Company
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                  {editing ? 'Edit Teacher' : 'Add Teacher'}
                </h2>
                <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                  {editing
                    ? 'Update roster details for this teacher.'
                    : 'Add a new teacher to the network.'}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="rounded-full border border-[var(--c-ecebe7)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
              >
                Close
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  Name
                  <input
                    type="text"
                    value={formState.name}
                    onChange={event =>
                      setFormState(current => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                    placeholder="Teacher name"
                  />
                </label>
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  Email
                  <input
                    type="email"
                    value={formState.email}
                    onChange={event =>
                      setFormState(current => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                    placeholder="teacher@email.com"
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  Region
                  <select
                    value={formState.region}
                    onChange={event =>
                      setFormState(current => ({
                        ...current,
                        region: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                  >
                    <option value="Unassigned">Unassigned</option>
                    <option value="North">North</option>
                    <option value="South">South</option>
                    <option value="East">East</option>
                    <option value="West">West</option>
                  </select>
                </label>
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  Status
                  <select
                    value={formState.status}
                    onChange={event =>
                      setFormState(current => ({
                        ...current,
                        status: event.target.value as
                          | 'Licensed'
                          | 'Certified'
                          | 'Advanced'
                          | 'Master'
                          | 'Onboarding'
                          | 'Inactive',
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                  >
                    <option value="Licensed">Licensed</option>
                    <option value="Certified">Certified</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Master">Master</option>
                    <option value="Onboarding">Onboarding</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </label>
              </div>

              {error ? (
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                  {error}
                </p>
              ) : null}

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full border border-[var(--c-ecebe7)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-full bg-[var(--c-c8102e)] px-5 py-2 text-xs uppercase tracking-[0.2em] text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving
                    ? 'Saving...'
                    : editing
                      ? 'Save Changes'
                      : 'Add Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
