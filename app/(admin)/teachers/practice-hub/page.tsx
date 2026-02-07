'use client';

import { useEffect, useMemo, useState } from 'react';
import studentsData from '@/data/students.json';
import {
  AUTH_STORAGE_KEY,
  VIEW_STUDENT_STORAGE_KEY,
} from '../../components/auth';
import lessonMaterials from '../students/lesson-data/lesson-materials.json';
import { useLessonCart } from '../../components/lesson-cart';
import {
  makeStudentScope,
  useLessonCartScope,
} from '../../components/lesson-cart-scope';
import { makePracticeMaterialId } from '../../components/practice-hub-utils';
import { makeLessonId } from '../../components/lesson-utils';

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

export default function TeacherPracticeHubPage() {
  const students = useMemo(
    () => (studentsData.students as StudentRecord[]) ?? [],
    [],
  );
  const [activeStudent, setActiveStudent] = useState<StudentRecord | null>(
    null,
  );
  const { scope: teacherScope, teacherUsername } = useLessonCartScope();
  const { purchasedItems: teacherPurchasedItems } = useLessonCart(teacherScope);
  const studentScope = activeStudent ? makeStudentScope(activeStudent.id) : null;
  const { purchasedItems: studentPurchasedItems } = useLessonCart(studentScope);
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [planWindow, setPlanWindow] = useState<{
    lessonDate: string;
    rangeStart: string;
    rangeEnd: string;
  } | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [focusIds, setFocusIds] = useState<string[]>([]);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [teacherServerUnlocks, setTeacherServerUnlocks] = useState<
    typeof teacherPurchasedItems
  >([]);
  const [studentServerUnlocks, setStudentServerUnlocks] = useState<
    typeof studentPurchasedItems
  >([]);

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

  const refreshFromServer = async () => {
    if (!studentScope || !teacherUsername) return;
    try {
      const [teacherRes, studentRes, visibilityRes] = await Promise.all([
        fetch(`/api/practice-hub/unlocks?role=teacher&teacherUsername=${encodeURIComponent(teacherUsername)}`),
        fetch(`/api/practice-hub/unlocks?role=student&studentId=${encodeURIComponent(studentScope.replace('student:', ''))}`),
        fetch(`/api/practice-hub/visibility?studentId=${encodeURIComponent(studentScope.replace('student:', ''))}`),
      ]);
      const teacherData = await teacherRes.json();
      const studentData = await studentRes.json();
      const visibilityData = await visibilityRes.json();
      setTeacherServerUnlocks(teacherData.items ?? []);
      setStudentServerUnlocks(studentData.items ?? []);
      setSelectedIds(Array.isArray(visibilityData.selectedIds) ? visibilityData.selectedIds : []);
      setFocusIds(Array.isArray(visibilityData.focusIds) ? visibilityData.focusIds : []);
    } catch {
      setSyncError('Unable to refresh from server.');
    }
  };

  useEffect(() => {
    if (!teacherUsername) return;
    fetch('/api/practice-hub/unlocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'teacher',
        teacherUsername,
        items: teacherPurchasedItems,
      }),
    }).catch(() => undefined);
  }, [teacherPurchasedItems, teacherUsername]);

  useEffect(() => {
    if (!studentScope) return;
    fetch('/api/practice-hub/unlocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'student',
        studentId: studentScope.replace('student:', ''),
        items: studentPurchasedItems,
      }),
    }).catch(() => undefined);
  }, [studentPurchasedItems, studentScope]);

  useEffect(() => {
    if (!studentScope || !teacherUsername) return;
    refreshFromServer();
    const timer = window.setInterval(() => {
      refreshFromServer();
    }, 2000);
    return () => window.clearInterval(timer);
  }, [studentScope, teacherUsername]);

  useEffect(() => {
    if (!studentScope) return;
    fetch('/api/practice-hub/visibility', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: studentScope.replace('student:', ''),
        selectedIds,
        focusIds,
      }),
    }).catch(() => undefined);
  }, [selectedIds, focusIds, studentScope]);

  const debugCounts = useMemo(() => {
    const effectiveTeacherItems = teacherServerUnlocks;
    const effectiveStudentItems = studentServerUnlocks;
    return {
      teacherCount: effectiveTeacherItems.length,
      studentCount: effectiveStudentItems.length,
      teacherSections: Array.from(
        new Set(
          effectiveTeacherItems.map(item => `${item.program} | ${item.section}`),
        ),
      ),
      studentSections: Array.from(
        new Set(
          effectiveStudentItems.map(item => `${item.program} | ${item.section}`),
        ),
      ),
    };
  }, [teacherServerUnlocks, studentServerUnlocks]);

  const unlockedSections = useMemo(() => {
    const effectiveTeacherItems = teacherServerUnlocks;
    const effectiveStudentItems = studentServerUnlocks;
    const studentSectionIds = new Set(
      effectiveStudentItems.map(item =>
        makeLessonId(item.program, item.section),
      ),
    );
    return effectiveTeacherItems
      .filter(item =>
        studentSectionIds.has(makeLessonId(item.program, item.section)),
      )
      .map(item => ({
      program: item.program,
      section: item.section,
      materials:
        lessonMaterials[
          `${item.program}|${item.section}` as keyof typeof lessonMaterials
        ] ?? [],
      }));
  }, [teacherServerUnlocks, studentServerUnlocks]);

  const handleSyncStudentUnlocks = () => {
    setSyncError(null);
    setSyncStatus('Refreshing from server...');
    refreshFromServer().finally(() => {
      setSyncStatus('Student unlocks synced.');
      window.setTimeout(() => setSyncStatus(null), 2000);
    });
  };

  const toggleSelected = (id: string) => {
    setSelectedIds(current =>
      current.includes(id)
        ? current.filter(item => item !== id)
        : [...current, id],
    );
  };

  const toggleFocus = (id: string) => {
    setFocusIds(current =>
      current.includes(id)
        ? current.filter(item => item !== id)
        : [...current, id],
    );
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
          Teachers
        </p>
        <h1 className="text-3xl font-semibold text-[var(--c-1f1f1d)] mt-2">
          Practice Hub
        </h1>
        <p className="text-base text-[var(--c-6f6c65)] mt-2">
          {activeStudent?.name ?? "Student"}&apos;s current playlist and open
          songs to play and practice. Help them keep their playlist alive!
        </p>
      </header>

      <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f1f1ef)] p-6 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.45)] ring-1 ring-[var(--c-ecebe7)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
              Student Visibility
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--c-1f1f1d)]">
              Sections &amp; Materials
            </h2>
            <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
              Toggle what appears on the student practice hub.
            </p>
          </div>
        </div>

        {unlockedSections.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-6 text-sm text-[var(--c-6f6c65)]">
            No unlocked sections yet. Purchase sections to start building a
            practice playlist.
            <div className="mt-3 text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
              Teacher unlocks: {debugCounts.teacherCount} · Student unlocks:{' '}
              {debugCounts.studentCount}
            </div>
            <div className="mt-2 text-[11px] text-[var(--c-9a9892)]">
              Teacher sections: {debugCounts.teacherSections.join(', ') || '—'}
            </div>
            <div className="mt-2 text-[11px] text-[var(--c-9a9892)]">
              Student sections: {debugCounts.studentSections.join(', ') || '—'}
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            {unlockedSections.map(section => (
              <div
                key={`${section.program}-${section.section}`}
                className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                      {section.program}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-[var(--c-1f1f1d)]">
                      {section.section}
                    </p>
                  </div>
                  <span className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                    Materials
                  </span>
                </div>
                {section.materials.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    {section.materials.map(material => {
                      const id = makePracticeMaterialId(
                        section.program,
                        section.section,
                        material,
                      );
                      const checked = selectedIds.includes(id);
                      const focused = focusIds.includes(id);
                      return (
                        <label
                          key={id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3 text-base text-[var(--c-1f1f1d)]"
                        >
                          <span className="text-[var(--c-1f1f1d)]">
                            {material}
                          </span>
                          <span className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                            <label className="flex items-center gap-2">
                              <span>Show</span>
                              <span className="relative inline-flex h-5 w-9 items-center rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] transition">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleSelected(id)}
                                  className="peer sr-only"
                                />
                                <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-[var(--c-ffffff)] transition peer-checked:translate-x-4 peer-checked:bg-[var(--c-c8102e)]" />
                              </span>
                            </label>
                            <label className="flex items-center gap-2">
                              <span>Focus</span>
                              <span className="relative inline-flex h-5 w-9 items-center rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] transition">
                                <input
                                  type="checkbox"
                                  checked={focused}
                                  onChange={() => toggleFocus(id)}
                                  className="peer sr-only"
                                />
                                <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-[var(--c-ffffff)] transition peer-checked:translate-x-4 peer-checked:bg-[var(--c-c8102e)]" />
                              </span>
                            </label>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-[var(--c-6f6c65)]">
                    No materials listed for this section yet.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
        {syncError || syncStatus ? (
          <div className="mt-5">
            {syncError ? (
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                {syncError}
              </p>
            ) : null}
            {syncStatus ? (
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                {syncStatus}
              </p>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}
