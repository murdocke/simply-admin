'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { VIEW_ROLE_STORAGE_KEY } from '../components/auth';
import lessonTypes from './students/lesson-data/lesson-types.json';
import lessonSections from './students/lesson-data/lesson-sections.json';
import LockedSectionCard from '../components/locked-section-card';
import LessonCartPurchaseButton from '../components/lesson-cart-actions';

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
    } catch {
      setCompanyName(null);
      setRole(null);
      setViewRole(null);
    }
  }, []);

  const effectiveRole = role === 'company' && viewRole ? viewRole : role;
  const hubMode = useMemo(
    () => (searchParams.get('mode') === 'teaching' ? 'teaching' : 'training'),
    [searchParams],
  );

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
              Training + Teaching Hub
            </h1>
            <p className="text-sm text-[var(--c-6f6c65)] mt-2">
              One place for curriculum, coaching, and studio resources.
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
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
