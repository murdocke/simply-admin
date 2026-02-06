'use client';

import { useEffect, useState } from 'react';
import {
  VIEW_ROLE_STORAGE_KEY,
  VIEW_STUDENT_STORAGE_KEY,
} from '../../components/auth';

export default function StudentDashboardPage() {
  const [selectedStudent, setSelectedStudent] = useState<{
    id?: string;
    name?: string;
    email?: string;
  } | null>(null);
  const [isTeacherView, setIsTeacherView] = useState(false);

  useEffect(() => {
    const loadStudentSelection = () => {
      const stored = window.localStorage.getItem('sm_user');
      if (!stored) {
        setSelectedStudent(null);
        setIsTeacherView(false);
        return;
      }
      try {
        const parsed = JSON.parse(stored) as { username?: string; role?: string };
        if (parsed?.role === 'teacher') {
          const storedView = window.localStorage.getItem(VIEW_ROLE_STORAGE_KEY);
          const isStudentView = storedView === 'student';
          setIsTeacherView(isStudentView);

          const viewStudentKey = parsed?.username
            ? `${VIEW_STUDENT_STORAGE_KEY}:${parsed.username}`
            : VIEW_STUDENT_STORAGE_KEY;
          const storedStudent =
            window.localStorage.getItem(viewStudentKey) ??
            window.localStorage.getItem(VIEW_STUDENT_STORAGE_KEY);

          if (isStudentView && storedStudent) {
            try {
              const selected = JSON.parse(storedStudent) as {
                id?: string;
                name?: string;
                email?: string;
              };
              if (selected?.id) {
                setSelectedStudent(selected);
                window.localStorage.setItem(viewStudentKey, storedStudent);
                return;
              }
            } catch {
              setSelectedStudent(null);
            }
          }

          setSelectedStudent(null);
          return;
        }

        setSelectedStudent(null);
        setIsTeacherView(false);
      } catch {
        setSelectedStudent(null);
        setIsTeacherView(false);
      }
    };

    loadStudentSelection();
    const handleSelectionUpdate = () => loadStudentSelection();
    window.addEventListener('sm-view-student-updated', handleSelectionUpdate);
    window.addEventListener('sm-student-selection', handleSelectionUpdate);
    return () => {
      window.removeEventListener(
        'sm-view-student-updated',
        handleSelectionUpdate,
      );
      window.removeEventListener('sm-student-selection', handleSelectionUpdate);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <header>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
            Students
          </p>
          <h1 className="text-3xl font-semibold text-[var(--c-1f1f1d)] mt-2">
            Dashboard
          </h1>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            Your practice snapshot will live here.
          </p>
        </header>

        {isTeacherView ? (
          <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[linear-gradient(135deg,var(--c-ffffff),var(--c-f7f7f5))] p-5 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.45)] ring-1 ring-[var(--c-ecebe7)] lg:max-w-sm lg:flex-1">
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                Selected Student
              </p>
              <h2 className="text-xl font-semibold text-[var(--c-1f1f1d)]">
                {selectedStudent?.name ?? 'No student selected'}
              </h2>
              <p className="text-sm text-[var(--c-6f6c65)]">
                {selectedStudent?.name
                  ? 'You are viewing the student dashboard for this learner.'
                  : 'Choose a student in the sidebar to view their dashboard.'}
              </p>
            </div>
          </section>
        ) : null}
      </div>

      <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
        <p className="text-sm text-[var(--c-6f6c65)]">
          Add practice goals, lesson notes, and progress updates when ready.
        </p>
      </section>
    </div>
  );
}
