'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CartPanel from '../components/cart-panel';
import { VIEW_ROLE_STORAGE_KEY } from '../components/auth';

type TeacherRecord = {
  id: string;
  company: string;
  name: string;
  email: string;
  region: string;
  status: 'Active' | 'Onboarding' | 'Inactive';
  createdAt: string;
  updatedAt: string;
};

const defaultForm = {
  name: '',
  email: '',
  region: 'Unassigned',
  status: 'Onboarding' as const,
};

export default function TeachersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [viewRole, setViewRole] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<TeacherRecord | null>(null);
  const [formState, setFormState] = useState(defaultForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    } catch {
      setCompanyName(null);
      setRole(null);
      setViewRole(null);
    }
  }, []);

  const effectiveRole = role === 'company' && viewRole ? viewRole : role;

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
      status: teacher.status,
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
    } catch {
      setError('Unable to delete that teacher right now.');
    }
  };

  if (effectiveRole !== 'company') {
    return (
      <div className="space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#c8102e]">
              Teachers
            </p>
            <h1 className="text-3xl font-semibold text-[#1f1f1d] mt-2">
              Training + Teaching Hub
            </h1>
            <p className="text-sm text-[#6f6c65] mt-2">
              One place for curriculum, coaching, and studio resources.
            </p>
          </div>
          <div className="flex rounded-full border border-[#ecebe7] bg-white p-1 text-xs uppercase tracking-[0.2em] text-[#6f6c65] shadow-sm">
            <button className="rounded-full bg-[#c8102e] px-4 py-2 text-white">
              Training
            </button>
            <button className="rounded-full px-4 py-2">Teaching</button>
          </div>
        </header>

        <section
          id="students"
          className="rounded-2xl border border-[#ecebe7] bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-[#1f1f1d]">Students</h2>
          <p className="text-sm text-[#6f6c65] mt-2">
            Active student roster and progress highlights.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            {[
              'Active Students',
              'New Requests',
              'Lesson Notes',
              'Progress Snapshots',
            ].map(item => (
              <div
                key={item}
                className="rounded-xl border border-[#ecebe7] bg-[#fcfcfb] px-4 py-3 text-sm text-[#3a3935]"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section
            id="this-week"
            className="rounded-2xl border border-[#ecebe7] bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-[#1f1f1d]">This Week</h2>
            <p className="text-sm text-[#6f6c65] mt-2">
              Upcoming lessons, recitals, and studio moments.
            </p>
            <div className="mt-5 space-y-3">
              {[
                '12 lessons scheduled',
                '2 new student intakes',
                'Studio check-in on Friday',
              ].map(item => (
                <div
                  key={item}
                  className="rounded-xl border border-[#ecebe7] bg-[#fcfcfb] px-4 py-3 text-sm text-[#3a3935]"
                >
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section
            id="schedule"
            className="rounded-2xl border border-[#ecebe7] bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-[#1f1f1d]">Schedule</h2>
            <p className="text-sm text-[#6f6c65] mt-2">
              Manage weekly blocks and upcoming sessions.
            </p>
            <div className="mt-5 space-y-3">
              {[
                'Mon–Wed: Evening sessions',
                'Thu: Studio admin hours',
                'Sat: Group lesson block',
              ].map(item => (
                <div
                  key={item}
                  className="rounded-xl border border-[#ecebe7] bg-[#fcfcfb] px-4 py-3 text-sm text-[#3a3935]"
                >
                  {item}
                </div>
              ))}
            </div>
          </section>
        </div>

        <section
          id="lesson-fees"
          className="rounded-2xl border border-[#ecebe7] bg-white p-6 shadow-sm"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#1f1f1d]">
                Lesson Fees
              </h2>
              <p className="text-sm text-[#6f6c65] mt-2">
                Track billing, payments, and pricing tiers.
              </p>
            </div>
            <span className="rounded-full border border-[#ecebe7] bg-[#fcfcfb] px-3 py-1 text-xs text-[#6f6c65]">
              Next payout Feb 18
            </span>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            {[
              { label: 'Weekly Fees', value: '$2,140' },
              { label: 'Overdue', value: '$320' },
              { label: 'Avg. Lesson', value: '$48' },
            ].map(item => (
              <div
                key={item.label}
                className="rounded-xl border border-[#ecebe7] bg-[#fcfcfb] px-4 py-4"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-[#c8102e]">
                  {item.label}
                </p>
                <p className="text-2xl font-semibold text-[#1f1f1d] mt-2">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        <CartPanel context="teacher" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#c8102e]">
            Company
          </p>
          <h1 className="text-3xl font-semibold text-[#1f1f1d] mt-2">
            Teachers
          </h1>
          <p className="text-sm text-[#6f6c65] mt-2">
            Add new teachers, update status, and track studio coverage.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="rounded-full bg-[#c8102e] px-5 py-2 text-xs uppercase tracking-[0.2em] text-white transition hover:brightness-110"
        >
          Add Teacher
        </button>
      </header>

      <section className="rounded-2xl border border-[#ecebe7] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#1f1f1d]">
              Teacher Directory
            </p>
            <p className="text-xs uppercase tracking-[0.2em] text-[#9a9892]">
              {rosterCount} teachers
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
            <div className="col-span-4">Teacher</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-2">Region</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>
          <div className="divide-y divide-[#ecebe7]">
            {isLoading ? (
              <div className="px-4 py-6 text-sm text-[#6f6c65]">
                Loading teachers...
              </div>
            ) : teachers.length === 0 ? (
              <div className="px-4 py-6 text-sm text-[#6f6c65]">
                No teachers yet. Add your first teacher to get started.
              </div>
            ) : (
              teachers.map(teacher => (
                <div
                  key={teacher.id}
                  className="grid grid-cols-12 items-center gap-2 px-4 py-4 text-sm"
                >
                  <div className="col-span-4">
                    <p className="font-medium text-[#1f1f1d]">
                      {teacher.name}
                    </p>
                    <p className="text-xs text-[#9a9892]">
                      Added {new Date(teacher.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="col-span-3 text-[#6f6c65]">
                    {teacher.email || '—'}
                  </div>
                  <div className="col-span-2">
                    <span className="rounded-full border border-[#e5e3dd] px-3 py-1 text-xs text-[#6f6c65]">
                      {teacher.region}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        teacher.status === 'Active'
                          ? 'bg-[#e7eddc] text-[#3f4a2c]'
                          : teacher.status === 'Onboarding'
                            ? 'bg-[#fff2d9] text-[#8a5b2b]'
                            : 'bg-[#f3e5e5] text-[#7a3b3b]'
                      }`}
                    >
                      {teacher.status}
                    </span>
                  </div>
                  <div className="col-span-1 flex justify-end gap-2">
                    <button
                      className="rounded-full border border-[#e5e3dd] bg-white px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#6f6c65] transition hover:border-[#c8102e]/40 hover:text-[#c8102e]"
                      onClick={() => openEditModal(teacher)}
                    >
                      Edit
                    </button>
                    <button
                      className="rounded-full border border-[#f2d7db] bg-[#fff5f6] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#8f2f3b] transition hover:border-[#c8102e]/40 hover:text-[#c8102e]"
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
          <div className="relative w-full max-w-xl rounded-3xl border border-[#ecebe7] bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[#c8102e]">
                  Company
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[#1f1f1d]">
                  {editing ? 'Edit Teacher' : 'Add Teacher'}
                </h2>
                <p className="mt-2 text-sm text-[#6f6c65]">
                  {editing
                    ? 'Update roster details for this teacher.'
                    : 'Add a new teacher to the network.'}
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
                    placeholder="Teacher name"
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
                    placeholder="teacher@email.com"
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs uppercase tracking-[0.2em] text-[#6f6c65]">
                  Region
                  <select
                    value={formState.region}
                    onChange={event =>
                      setFormState(current => ({
                        ...current,
                        region: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-[#ecebe7] bg-white px-3 py-2 text-sm text-[#1f1f1d]"
                  >
                    <option value="Unassigned">Unassigned</option>
                    <option value="North">North</option>
                    <option value="South">South</option>
                    <option value="East">East</option>
                    <option value="West">West</option>
                  </select>
                </label>
                <label className="text-xs uppercase tracking-[0.2em] text-[#6f6c65]">
                  Status
                  <select
                    value={formState.status}
                    onChange={event =>
                      setFormState(current => ({
                        ...current,
                        status: event.target.value as
                          | 'Active'
                          | 'Onboarding'
                          | 'Inactive',
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-[#ecebe7] bg-white px-3 py-2 text-sm text-[#1f1f1d]"
                  >
                    <option value="Onboarding">Onboarding</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
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
