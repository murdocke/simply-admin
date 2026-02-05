'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type StudentRecord = {
  id: string;
  teacher: string;
  name: string;
  email: string;
  level: string;
  status: 'Active' | 'Paused';
  createdAt: string;
  updatedAt: string;
};

const defaultForm = {
  name: '',
  email: '',
  level: 'Beginner',
  status: 'Active' as const,
};

export default function TeacherStudentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [teacherName, setTeacherName] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<StudentRecord | null>(null);
  const [formState, setFormState] = useState(defaultForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem('sm_user');
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as { username?: string; role?: string };
      if (parsed?.username) {
        setTeacherName(parsed.username);
      }
    } catch {
      setTeacherName(null);
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
        if (isActive) setError('Unable to load students right now.');
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
    if (searchParams.get('new') === '1') {
      openCreateModal();
      router.replace('/teachers/students', { scroll: false });
    }
  }, [searchParams, router]);

  const rosterCount = useMemo(() => students.length, [students.length]);

  const openCreateModal = () => {
    setEditing(null);
    setFormState(defaultForm);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (student: StudentRecord) => {
    setEditing(student);
    setFormState({
      name: student.name,
      email: student.email,
      level: student.level,
      status: student.status,
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
    if (!teacherName) {
      setError('Please log in as a teacher to add or edit students.');
      return;
    }
    setIsSaving(true);
    setError(null);

    try {
      const payload = {
        teacher: teacherName,
        name: formState.name.trim(),
        email: formState.email.trim(),
        level: formState.level,
        status: formState.status,
      };

      if (!payload.name) {
        setError('Student name is required.');
        setIsSaving(false);
        return;
      }

      const response = await fetch(
        editing ? `/api/students/${editing.id}` : '/api/students',
        {
          method: editing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        throw new Error('Request failed');
      }

      const data = (await response.json()) as { student: StudentRecord };
      if (editing) {
        setStudents(current =>
          current.map(student =>
            student.id === data.student.id ? data.student : student,
          ),
        );
      } else {
        setStudents(current => [data.student, ...current]);
      }
      setIsModalOpen(false);
      setEditing(null);
      setFormState(defaultForm);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (student: StudentRecord) => {
    const teacher = teacherName ?? student.teacher;
    if (!teacher) return;
    const confirmed = window.confirm(
      `Remove ${student.name} from your roster?`,
    );
    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/students/${student.id}?teacher=${encodeURIComponent(teacher)}`,
        {
          method: 'DELETE',
        },
      );

      if (!response.ok) {
        throw new Error('Request failed');
      }

      setStudents(current =>
        current.filter(currentStudent => currentStudent.id !== student.id),
      );
    } catch {
      setError('Unable to delete that student right now.');
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#c8102e]">
            Teachers
          </p>
          <h1 className="text-3xl font-semibold text-[#1f1f1d] mt-2">
            Students
          </h1>
          <p className="text-sm text-[#6f6c65] mt-2">
            Manage your studio roster, lesson readiness, and status updates.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="rounded-full bg-[#c8102e] px-5 py-2 text-xs uppercase tracking-[0.2em] text-white transition hover:brightness-110"
        >
          Add Student
        </button>
      </header>

      <section className="rounded-2xl border border-[#ecebe7] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#1f1f1d]">
              Active Roster
            </p>
            <p className="text-xs uppercase tracking-[0.2em] text-[#9a9892]">
              {rosterCount} students
            </p>
          </div>
          {error ? (
            <p className="text-xs uppercase tracking-[0.2em] text-[#c8102e]">
              {error}
            </p>
          ) : null}
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-[#ecebe7]">
          <div className="grid grid-cols-12 gap-2 bg-[#f7f7f5] px-4 py-3 text-xs uppercase tracking-[0.2em] text-[#6f6c65]">
            <div className="col-span-4">Student</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-2">Level</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>
          <div className="divide-y divide-[#ecebe7]">
            {isLoading ? (
              <div className="px-4 py-6 text-sm text-[#6f6c65]">
                Loading roster...
              </div>
            ) : students.length === 0 ? (
              <div className="px-4 py-6 text-sm text-[#6f6c65]">
                No students yet. Add your first student to get started.
              </div>
            ) : (
              students.map(student => (
                <div
                  key={student.id}
                  className="grid grid-cols-12 items-center gap-2 px-4 py-4 text-sm"
                >
                  <div className="col-span-4">
                    <p className="font-medium text-[#1f1f1d]">
                      {student.name}
                    </p>
                    <p className="text-xs text-[#9a9892]">
                      Added {new Date(student.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="col-span-3 text-[#6f6c65]">
                    {student.email || '—'}
                  </div>
                  <div className="col-span-2">
                    <span className="rounded-full border border-[#e5e3dd] px-3 py-1 text-xs text-[#6f6c65]">
                      {student.level}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        student.status === 'Active'
                          ? 'bg-[#e7eddc] text-[#3f4a2c]'
                          : 'bg-[#fce8d6] text-[#8a5b2b]'
                      }`}
                    >
                      {student.status}
                    </span>
                  </div>
                  <div className="col-span-1 flex justify-end gap-2">
                    <button
                      className="rounded-full border border-[#e5e3dd] bg-white px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#6f6c65] transition hover:border-[#c8102e]/40 hover:text-[#c8102e]"
                      onClick={() => openEditModal(student)}
                    >
                      Edit
                    </button>
                    <button
                      className="rounded-full border border-[#f2d7db] bg-[#fff5f6] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#8f2f3b] transition hover:border-[#c8102e]/40 hover:text-[#c8102e]"
                      onClick={() => handleDelete(student)}
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
          <div className="relative w-full max-w-xl rounded-3xl border border-[#ecebe7] bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[#c8102e]">
                  Teachers
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[#1f1f1d]">
                  {editing ? 'Edit Student' : 'Add Student'}
                </h2>
                <p className="mt-2 text-sm text-[#6f6c65]">
                  {editing
                    ? 'Update roster details for this student.'
                    : 'Add a new student to your studio roster.'}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="rounded-full border border-[#ecebe7] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[#6f6c65]"
              >
                Close
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs uppercase tracking-[0.2em] text-[#6f6c65]">
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
                    className="mt-2 w-full rounded-2xl border border-[#ecebe7] px-3 py-2 text-sm text-[#1f1f1d]"
                    placeholder="Student name"
                  />
                </label>
                <label className="text-xs uppercase tracking-[0.2em] text-[#6f6c65]">
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
                    className="mt-2 w-full rounded-2xl border border-[#ecebe7] px-3 py-2 text-sm text-[#1f1f1d]"
                    placeholder="student@email.com"
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs uppercase tracking-[0.2em] text-[#6f6c65]">
                  Level
                  <select
                    value={formState.level}
                    onChange={event =>
                      setFormState(current => ({
                        ...current,
                        level: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-[#ecebe7] bg-white px-3 py-2 text-sm text-[#1f1f1d]"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </label>
                <label className="text-xs uppercase tracking-[0.2em] text-[#6f6c65]">
                  Status
                  <select
                    value={formState.status}
                    onChange={event =>
                      setFormState(current => ({
                        ...current,
                        status: event.target.value as 'Active' | 'Paused',
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-[#ecebe7] bg-white px-3 py-2 text-sm text-[#1f1f1d]"
                  >
                    <option value="Active">Active</option>
                    <option value="Paused">Paused</option>
                  </select>
                </label>
              </div>

              {error ? (
                <p className="text-xs uppercase tracking-[0.2em] text-[#c8102e]">
                  {error}
                </p>
              ) : null}

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full border border-[#ecebe7] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#6f6c65]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-full bg-[#c8102e] px-5 py-2 text-xs uppercase tracking-[0.2em] text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving
                    ? 'Saving...'
                    : editing
                      ? 'Save Changes'
                      : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
