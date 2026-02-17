'use client';

import { useEffect, useMemo, useState } from 'react';
import { AUTH_STORAGE_KEY } from '../../components/auth';
import { useApiData } from '../../components/use-api-data';

type ParentRecord = {
  username: string;
  name: string;
  students: string[];
};

type StudentRecord = {
  id: string;
  teacher: string;
  name: string;
  email: string;
  level?: string;
  status?: string;
  lessonDay?: string;
  lessonTime?: string;
  lessonDuration?: string;
};

type TeacherRecord = {
  name: string;
  email: string;
  username?: string;
  goesBy?: string;
};

const getTeacherDisplay = (student: StudentRecord, teachers: TeacherRecord[]) => {
  const normalized = student.teacher?.toLowerCase();
  if (!normalized) return 'Teacher';
  const match =
    teachers.find(teacher => teacher.username?.toLowerCase() === normalized) ??
    teachers.find(teacher => teacher.email.toLowerCase() === normalized) ??
    teachers.find(teacher => teacher.name.toLowerCase() === normalized) ??
    teachers.find(teacher => teacher.name.toLowerCase().startsWith(normalized)) ??
    null;
  return match?.goesBy?.trim() || match?.name?.trim() || 'Teacher';
};

export default function ParentStudentsPage() {
  const { data: parentsData } = useApiData<{ parents: ParentRecord[] }>(
    '/api/parents',
    { parents: [] },
  );
  const { data: studentsData } = useApiData<{ students: StudentRecord[] }>(
    '/api/students',
    { students: [] },
  );
  const { data: teachersData } = useApiData<{ teachers: TeacherRecord[] }>(
    '/api/teachers',
    { teachers: [] },
  );
  const parents = useMemo(
    () => (parentsData.parents as ParentRecord[]) ?? [],
    [parentsData],
  );
  const students = useMemo(
    () => (studentsData.students as StudentRecord[]) ?? [],
    [studentsData],
  );
  const teachers = useMemo(
    () => (teachersData.teachers as TeacherRecord[]) ?? [],
    [teachersData],
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

  const familyStudents = useMemo(() => {
    if (!activeParent) return [] as StudentRecord[];
    return activeParent.students
      .map(id => students.find(student => student.id === id))
      .filter((student): student is StudentRecord => Boolean(student));
  }, [activeParent, students]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
          Parent Portal
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--c-1f1f1d)]">
          Students
        </h1>
        <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
          Review lesson details, progress level, and teacher contact info for each child.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        {familyStudents.map(student => (
          <div
            key={student.id}
            className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-[var(--c-1f1f1d)]">
                  {student.name}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  {student.level ?? 'Level'} · {student.status ?? 'Active'}
                </p>
                <p className="mt-2 text-xs text-[var(--c-6f6c65)]">
                  Teacher: {getTeacherDisplay(student, teachers)}
                </p>
              </div>
              <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                {student.lessonDay ?? 'Lesson day'}
              </span>
            </div>
            <div className="mt-4 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-4 text-sm text-[var(--c-6f6c65)]">
              <div className="flex items-center justify-between">
                <span>Lesson time</span>
                <span className="font-semibold text-[var(--c-1f1f1d)]">
                  {student.lessonTime ?? 'Time TBD'}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>Duration</span>
                <span className="font-semibold text-[var(--c-1f1f1d)]">
                  {student.lessonDuration ?? '45M'}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>Contact</span>
                <span className="font-semibold text-[var(--c-1f1f1d)]">
                  {student.email}
                </span>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
