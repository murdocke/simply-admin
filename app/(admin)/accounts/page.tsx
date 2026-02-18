'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { VIEW_TEACHER_STORAGE_KEY } from '../components/auth';

type TeacherRecord = {
  id: string;
  company: string;
  username?: string;
  name: string;
  email: string;
  region: string;
  status:
    | 'Licensed'
    | 'Certified'
    | 'Advanced'
    | 'Master'
    | 'Training'
    | 'Onboarding'
    | 'Interested'
    | 'Inactive'
    | 'Active';
  createdAt: string;
  updatedAt: string;
  password?: string;
};

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

type SelectedTeacher = {
  id: string;
  name: string;
  username: string;
};

const defaultForm = {
  username: '',
  name: '',
  email: '',
  region: 'Unassigned',
  status: 'Licensed' as const,
  password: '',
};

const normalizeTeacherStatus = (
  status:
    | 'Licensed'
    | 'Certified'
    | 'Advanced'
    | 'Master'
    | 'Training'
    | 'Onboarding'
    | 'Interested'
    | 'Inactive'
    | 'Active',
) => (status === 'Active' ? 'Licensed' : status);

const statusStyles: Record<string, string> = {
  Licensed: 'bg-[var(--c-e7eddc)] text-[var(--c-3f4a2c)]',
  Certified: 'bg-[var(--c-e6eef8)] text-[var(--c-28527a)]',
  Advanced: 'bg-[var(--c-f4f0ff)] text-[var(--c-47308a)]',
  Master: 'bg-[var(--c-fff2d9)] text-[var(--c-7a4a17)]',
  Training: 'bg-emerald-100 text-emerald-800',
  Onboarding: 'bg-[var(--c-fff2d9)] text-[var(--c-8a5b2b)]',
  Interested: 'bg-[var(--c-e6f4ff)] text-[var(--c-28527a)]',
  Inactive: 'bg-[var(--c-f3e5e5)] text-[var(--c-7a3b3b)]',
};

export default function AccountsPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<TeacherRecord | null>(null);
  const [formState, setFormState] = useState(defaultForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedTeacher, setSelectedTeacher] =
    useState<SelectedTeacher | null>(null);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [unlinkedStudents, setUnlinkedStudents] = useState<StudentRecord[]>([]);
  const [unlinkedLoading, setUnlinkedLoading] = useState(false);
  const [teacherPage, setTeacherPage] = useState(1);
  const [studentPage, setStudentPage] = useState(1);
  const [unlinkedPage, setUnlinkedPage] = useState(1);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [teacherStatusFilter, setTeacherStatusFilter] = useState('All');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentStatusFilter, setStudentStatusFilter] = useState('All');
  const [unlinkedSearch, setUnlinkedSearch] = useState('');
  const [unlinkedStatusFilter, setUnlinkedStatusFilter] = useState('All');
  const teacherPageSize = 20;
  const studentPageSize = 10;
  const unlinkedPageSize = 10;
  const viewTeacherKey = useMemo(() => {
    if (!companyName) return VIEW_TEACHER_STORAGE_KEY;
    return `${VIEW_TEACHER_STORAGE_KEY}:${companyName}`;
  }, [companyName]);

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
        const viewTeacherKey = parsed.username
          ? `${VIEW_TEACHER_STORAGE_KEY}:${parsed.username}`
          : VIEW_TEACHER_STORAGE_KEY;
        const storedTeacher =
          window.localStorage.getItem(viewTeacherKey) ??
          window.localStorage.getItem(VIEW_TEACHER_STORAGE_KEY);
        if (storedTeacher) {
          try {
            const selected = JSON.parse(storedTeacher) as SelectedTeacher;
            if (selected?.id && selected?.username) {
              setSelectedTeacher(selected);
              window.localStorage.setItem(viewTeacherKey, storedTeacher);
            }
          } catch {
            setSelectedTeacher(null);
          }
        }
      }
    } catch {
      setCompanyName(null);
      setRole(null);
      setSelectedTeacher(null);
    }
  }, []);

  useEffect(() => {
    const handleSelectionUpdate = () => {
      if (role !== 'company') return;
      const storedTeacher =
        window.localStorage.getItem(viewTeacherKey) ??
        window.localStorage.getItem(VIEW_TEACHER_STORAGE_KEY);
      if (!storedTeacher) {
        setSelectedTeacher(null);
        return;
      }
      try {
        const selected = JSON.parse(storedTeacher) as SelectedTeacher;
        if (selected?.id && selected?.username) {
          setSelectedTeacher(selected);
          window.localStorage.setItem(viewTeacherKey, storedTeacher);
        } else {
          setSelectedTeacher(null);
        }
      } catch {
        setSelectedTeacher(null);
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (
        event.key === viewTeacherKey ||
        event.key === VIEW_TEACHER_STORAGE_KEY
      ) {
        handleSelectionUpdate();
      }
    };

    window.addEventListener('sm-view-teacher-updated', handleSelectionUpdate);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(
        'sm-view-teacher-updated',
        handleSelectionUpdate,
      );
      window.removeEventListener('storage', handleStorage);
    };
  }, [role, viewTeacherKey]);

  const notifyTeachersUpdated = () => {
    try {
      window.localStorage.setItem('sm_teachers_updated', String(Date.now()));
      window.dispatchEvent(new Event('sm-teachers-updated'));
    } catch {
      window.dispatchEvent(new Event('sm-teachers-updated'));
    }
  };

  useEffect(() => {
    if (!companyName || role !== 'company') return;
    let isActive = true;
    const fetchTeachers = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/teachers?company=${encodeURIComponent(companyName)}`,
        );
        const data = (await response.json()) as { teachers: TeacherRecord[] };
        if (isActive) {
          const filtered = (data.teachers ?? []).filter(
            teacher => teacher.status !== 'Interested',
          );
          setTeachers(filtered);
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
  }, [companyName, role]);

  useEffect(() => {
    if (!selectedTeacher?.username) {
      setStudents([]);
      return;
    }
    let isActive = true;
    const fetchStudents = async () => {
      try {
        setStudentsLoading(true);
        const response = await fetch(
          `/api/students?teacher=${encodeURIComponent(selectedTeacher.username)}`,
        );
        const data = (await response.json()) as { students: StudentRecord[] };
        if (isActive) {
          setStudents(data.students ?? []);
        }
      } catch {
        if (isActive) setStudents([]);
      } finally {
        if (isActive) setStudentsLoading(false);
      }
    };
    fetchStudents();
    return () => {
      isActive = false;
    };
  }, [selectedTeacher?.username]);

  useEffect(() => {
    let isActive = true;
    const fetchUnlinked = async () => {
      try {
        setUnlinkedLoading(true);
        const response = await fetch('/api/students?unlinked=true', {
          cache: 'no-store',
        });
        const data = (await response.json()) as { students: StudentRecord[] };
        if (isActive) {
          setUnlinkedStudents(data.students ?? []);
        }
      } catch {
        if (isActive) setUnlinkedStudents([]);
      } finally {
        if (isActive) setUnlinkedLoading(false);
      }
    };
    fetchUnlinked();
    const interval = window.setInterval(fetchUnlinked, 15000);
    return () => {
      isActive = false;
      window.clearInterval(interval);
    };
  }, []);

  const rosterCount = useMemo(() => teachers.length, [teachers.length]);
  const teacherStatusOptions = useMemo(() => {
    const values = teachers.map(teacher =>
      normalizeTeacherStatus(teacher.status),
    );
    return Array.from(new Set(values)).sort();
  }, [teachers]);
  const studentStatusOptions = useMemo(() => {
    const values = students.map(student => student.status);
    return Array.from(new Set(values)).sort();
  }, [students]);
  const unlinkedStatusOptions = useMemo(() => {
    const values = unlinkedStudents.map(student => student.status);
    return Array.from(new Set(values)).sort();
  }, [unlinkedStudents]);

  const filteredTeachers = useMemo(() => {
    const search = teacherSearch.trim().toLowerCase();
    return teachers.filter(teacher => {
      const normalizedStatus = normalizeTeacherStatus(teacher.status);
      if (teacherStatusFilter !== 'All' && normalizedStatus !== teacherStatusFilter) {
        return false;
      }
      if (!search) return true;
      return (
        teacher.name.toLowerCase().includes(search) ||
        (teacher.email ?? '').toLowerCase().includes(search) ||
        (teacher.username ?? '').toLowerCase().includes(search) ||
        (teacher.region ?? '').toLowerCase().includes(search)
      );
    });
  }, [teachers, teacherSearch, teacherStatusFilter]);

  const filteredStudents = useMemo(() => {
    const search = studentSearch.trim().toLowerCase();
    return students.filter(student => {
      if (studentStatusFilter !== 'All' && student.status !== studentStatusFilter) {
        return false;
      }
      if (!search) return true;
      return (
        student.name.toLowerCase().includes(search) ||
        (student.email ?? '').toLowerCase().includes(search)
      );
    });
  }, [students, studentSearch, studentStatusFilter]);

  const filteredUnlinked = useMemo(() => {
    const search = unlinkedSearch.trim().toLowerCase();
    return unlinkedStudents.filter(student => {
      if (unlinkedStatusFilter !== 'All' && student.status !== unlinkedStatusFilter) {
        return false;
      }
      if (!search) return true;
      return (
        student.name.toLowerCase().includes(search) ||
        (student.email ?? '').toLowerCase().includes(search)
      );
    });
  }, [unlinkedStudents, unlinkedSearch, unlinkedStatusFilter]);

  useEffect(() => {
    setTeacherPage(1);
  }, [teacherSearch, teacherStatusFilter]);

  useEffect(() => {
    setStudentPage(1);
  }, [studentSearch, studentStatusFilter]);

  useEffect(() => {
    setUnlinkedPage(1);
  }, [unlinkedSearch, unlinkedStatusFilter]);
  const statusCounts = useMemo(() => {
    return teachers.reduce(
      (acc, teacher) => {
        const status = normalizeTeacherStatus(teacher.status);
        if (status === 'Licensed') {
          acc.licensed += 1;
        }
        if (status === 'Certified') {
          acc.certified += 1;
        }
        if (status === 'Advanced') {
          acc.advanced += 1;
        }
        if (status === 'Master') {
          acc.master += 1;
        }
        return acc;
      },
      {
        total: teachers.length,
        licensed: 0,
        certified: 0,
        advanced: 0,
        master: 0,
      },
    );
  }, [teachers]);
  const teacherTotalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredTeachers.length / teacherPageSize)),
    [filteredTeachers.length],
  );
  const pagedTeachers = useMemo(() => {
    const start = (teacherPage - 1) * teacherPageSize;
    return filteredTeachers.slice(start, start + teacherPageSize);
  }, [teacherPage, teacherPageSize, filteredTeachers]);
  const selectedTeacherInfo = useMemo(() => {
    if (!selectedTeacher) return null;
    return (
      teachers.find(teacher => teacher.id === selectedTeacher.id) ?? null
    );
  }, [selectedTeacher, teachers]);
  const studentTotalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredStudents.length / studentPageSize)),
    [filteredStudents.length],
  );
  const pagedStudents = useMemo(() => {
    const start = (studentPage - 1) * studentPageSize;
    return filteredStudents.slice(start, start + studentPageSize);
  }, [studentPage, studentPageSize, filteredStudents]);
  const unlinkedTotalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredUnlinked.length / unlinkedPageSize)),
    [filteredUnlinked.length],
  );
  const pagedUnlinked = useMemo(() => {
    const start = (unlinkedPage - 1) * unlinkedPageSize;
    return filteredUnlinked.slice(start, start + unlinkedPageSize);
  }, [unlinkedPage, unlinkedPageSize, filteredUnlinked]);

  const openCreateModal = () => {
    setEditing(null);
    setFormState(defaultForm);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSelectTeacher = (teacher: TeacherRecord) => {
    if (!teacher.username) return;
    const nextSelection: SelectedTeacher = {
      id: teacher.id,
      name: teacher.name,
      username: teacher.username,
    };
    setSelectedTeacher(nextSelection);
    window.localStorage.setItem(viewTeacherKey, JSON.stringify(nextSelection));
    window.localStorage.setItem(
      VIEW_TEACHER_STORAGE_KEY,
      JSON.stringify(nextSelection),
    );
    window.dispatchEvent(new Event('sm-view-teacher-updated'));
    setStudentPage(1);
  };

  const openEditModal = (teacher: TeacherRecord) => {
    setEditing(teacher);
    setFormState({
      username: teacher.username ?? '',
      name: teacher.name,
      email: teacher.email,
      region: teacher.region,
      status: normalizeTeacherStatus(teacher.status) as
        | 'Licensed'
        | 'Certified'
        | 'Advanced'
        | 'Master'
        | 'Onboarding'
        | 'Interested'
        | 'Inactive',
      password: '',
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
        username: formState.username.trim().toLowerCase(),
        name: formState.name.trim(),
        email: formState.email.trim(),
        region: formState.region,
        status: formState.status,
        password: formState.password.trim() || undefined,
      };

      if (!payload.username) {
        setError('Username is required.');
        setIsSaving(false);
        return;
      }
      if (!payload.name) {
        setError('Teacher name is required.');
        setIsSaving(false);
        return;
      }
      const duplicateUsername = teachers.some(
        teacher =>
          teacher.id !== editing?.id &&
          teacher.username?.trim().toLowerCase() === payload.username,
      );
      if (duplicateUsername) {
        setError('That username is already in use.');
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

      const data = (await response.json()) as {
        teacher?: TeacherRecord;
        error?: string;
      };
      if (!response.ok || !data.teacher) {
        throw new Error(data.error ?? 'Request failed');
      }
      if (editing) {
        setTeachers(current =>
          current.map(teacher =>
            teacher.id === data.teacher.id ? data.teacher : teacher,
          ),
        );
        if (selectedTeacher?.id === data.teacher.id) {
          const nextSelection: SelectedTeacher = {
            id: data.teacher.id,
            name: data.teacher.name,
            username: data.teacher.username ?? selectedTeacher.username,
          };
          setSelectedTeacher(nextSelection);
          window.localStorage.setItem(
            viewTeacherKey,
            JSON.stringify(nextSelection),
          );
          window.dispatchEvent(new Event('sm-view-teacher-updated'));
        }
      } else {
        setTeachers(current => [data.teacher, ...current]);
      }
      notifyTeachersUpdated();
      setIsModalOpen(false);
      setEditing(null);
      setFormState(defaultForm);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Something went wrong. Please try again.',
      );
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

  if (role && role !== 'company') {
    return (
      <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 text-sm text-[var(--c-6f6c65)]">
        Accounts is available for company admins.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
            Company
          </p>
          <h1 className="text-3xl font-semibold text-[var(--c-1f1f1d)] mt-2">
            Accounts
          </h1>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            Manage teacher accounts and view roster details.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openCreateModal}
            className="rounded-full bg-[var(--c-c8102e)] px-5 py-2 text-xs uppercase tracking-[0.2em] text-white transition hover:brightness-110"
          >
            Add Teacher
          </button>
          <button
            onClick={() => router.push('/teacher-interest')}
            className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
          >
            Teacher Interest
          </button>
          <button
            className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
          >
            Comany Accounts
          </button>
          <button
            className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
          >
            My Acount
          </button>
          <button
            onClick={() => router.push('/account-permissions')}
            className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
          >
            Account Permissions
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Active Teachers
          </p>
          <p className="text-4xl font-semibold mt-3 text-[var(--c-1f1f1d)]">
            {statusCounts.total.toLocaleString('en-US')}
          </p>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            Licensed + Certified + Advanced + Master
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Licensed
          </p>
          <p className="text-4xl font-semibold mt-3 text-[var(--c-1f1f1d)]">
            {statusCounts.licensed.toLocaleString('en-US')}
          </p>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            Active baseline teachers
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Certified
          </p>
          <p className="text-4xl font-semibold mt-3 text-[var(--c-1f1f1d)]">
            {statusCounts.certified.toLocaleString('en-US')}
          </p>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            Fully certified studios
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Advanced + Master
          </p>
          <p className="text-4xl font-semibold mt-3 text-[var(--c-1f1f1d)]">
            {(statusCounts.advanced + statusCounts.master).toLocaleString(
              'en-US',
            )}
          </p>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            Senior-level instructors
          </p>
        </div>
      </div>

      {selectedTeacher ? (
        <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                Selected Teacher
              </p>
              <h2 className="text-2xl font-semibold text-[var(--c-1f1f1d)] mt-2">
                {selectedTeacher.name}
              </h2>
              <p className="text-sm text-[var(--c-6f6c65)] mt-1">
                {selectedTeacherInfo?.email ?? 'Email on file'}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                <span>{students.length} students</span>
                <span>•</span>
                <span>
                  {students.filter(student => student.status === 'Active').length} active
                </span>
                <span>•</span>
                <span>
                  {students.filter(student => student.status === 'Archived').length} archived
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
              {selectedTeacherInfo?.region ? (
                <span className="rounded-full border border-[var(--c-e5e3dd)] px-3 py-1">
                  {selectedTeacherInfo.region}
                </span>
              ) : null}
              {selectedTeacherInfo?.status ? (
                <span
                  className={`rounded-full px-3 py-1 ${
                    statusStyles[
                      normalizeTeacherStatus(selectedTeacherInfo.status)
                    ] ?? statusStyles.Inactive
                  }`}
                >
                  {normalizeTeacherStatus(selectedTeacherInfo.status)}
                </span>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
              Unlinked Student Accounts
            </p>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
              {unlinkedStudents.length} students
            </p>
          </div>
        </div>
        {unlinkedStudents.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              value={unlinkedSearch}
              onChange={event => {
                const nextValue = event.target.value;
                setUnlinkedSearch(nextValue);
                if (nextValue.trim()) {
                  setUnlinkedStatusFilter('All');
                }
              }}
              placeholder="Search unlinked students..."
              className="min-w-[220px] flex-1 rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-sm text-[var(--c-1f1f1d)] outline-none focus:border-[var(--c-c8102e)]"
            />
            <select
              value={unlinkedStatusFilter}
              onChange={event => setUnlinkedStatusFilter(event.target.value)}
              className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
            >
              <option value="All">All Statuses</option>
              {unlinkedStatusOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--c-ecebe7)]">
          <div className="grid grid-cols-12 gap-2 bg-[var(--c-f7f7f5)] px-4 py-3 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
            <div className="col-span-4">Student</div>
            <div className="col-span-4">Email</div>
            <div className="col-span-2">Level</div>
            <div className="col-span-2">Status</div>
          </div>
          <div className="divide-y divide-[var(--c-ecebe7)]">
            {unlinkedLoading ? (
              <div className="px-4 py-6 text-sm text-[var(--c-6f6c65)]">
                Loading unlinked students...
              </div>
            ) : unlinkedStudents.length === 0 ? (
              <div className="px-4 py-6 text-sm text-[var(--c-6f6c65)]">
                No unlinked students yet.
              </div>
            ) : filteredUnlinked.length === 0 ? (
              <div className="px-4 py-6 text-sm text-[var(--c-6f6c65)]">
                No students match this search.
              </div>
            ) : (
              pagedUnlinked.map(student => (
                <div
                  key={student.id}
                  className="grid grid-cols-12 items-center gap-2 px-4 py-4 text-sm"
                >
                  <div className="col-span-4">
                    <p className="font-medium text-[var(--c-1f1f1d)]">
                      {student.name}
                    </p>
                    <p className="text-xs text-[var(--c-9a9892)]">
                      Added {new Date(student.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="col-span-4 text-[var(--c-6f6c65)]">
                    {student.email || '—'}
                  </div>
                  <div className="col-span-2">
                    <span className="rounded-full border border-[var(--c-e5e3dd)] px-3 py-1 text-xs text-[var(--c-6f6c65)]">
                      {student.level}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="rounded-full border border-[var(--c-e5e3dd)] px-3 py-1 text-xs text-[var(--c-6f6c65)]">
                      {student.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        {filteredUnlinked.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--c-6f6c65)]">
            <span>
              Showing {(unlinkedPage - 1) * unlinkedPageSize + 1}-
              {Math.min(
                unlinkedPage * unlinkedPageSize,
                filteredUnlinked.length,
              )}{' '}
              of {filteredUnlinked.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setUnlinkedPage(1)}
                disabled={unlinkedPage === 1}
                className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                First
              </button>
              <button
                type="button"
                onClick={() => setUnlinkedPage(prev => Math.max(1, prev - 1))}
                disabled={unlinkedPage === 1}
                className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Page {unlinkedPage} of {unlinkedTotalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setUnlinkedPage(prev =>
                    Math.min(unlinkedTotalPages, prev + 1),
                  )
                }
                disabled={unlinkedPage === unlinkedTotalPages}
                className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
              <button
                type="button"
                onClick={() => setUnlinkedPage(unlinkedTotalPages)}
                disabled={unlinkedPage === unlinkedTotalPages}
                className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                Last
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-6">
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
        {teachers.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              value={teacherSearch}
              onChange={event => {
                const nextValue = event.target.value;
                setTeacherSearch(nextValue);
                if (nextValue.trim()) {
                  setTeacherStatusFilter('All');
                }
              }}
              placeholder="Search teachers..."
              className="min-w-[220px] flex-1 rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-sm text-[var(--c-1f1f1d)] outline-none focus:border-[var(--c-c8102e)]"
            />
            <select
              value={teacherStatusFilter}
              onChange={event => setTeacherStatusFilter(event.target.value)}
              className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
            >
              <option value="All">All Statuses</option>
              {teacherStatusOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        ) : null}

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
            ) : filteredTeachers.length === 0 ? (
              <div className="px-4 py-6 text-sm text-[var(--c-6f6c65)]">
                No teachers match this search.
              </div>
            ) : (
              pagedTeachers.map(teacher => (
                <div
                  key={teacher.id}
                  className={`grid cursor-pointer grid-cols-12 items-center gap-2 px-4 py-4 text-sm transition hover:bg-[var(--c-fcfcfb)] ${
                    selectedTeacher?.id === teacher.id
                      ? 'bg-[var(--c-f7f7f5)]'
                      : ''
                  }`}
                  onClick={() => handleSelectTeacher(teacher)}
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
                      onClick={event => {
                        event.stopPropagation();
                        openEditModal(teacher);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="rounded-full border border-[var(--c-f2d7db)] bg-[var(--c-fff5f6)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-8f2f3b)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
                      onClick={event => {
                        event.stopPropagation();
                        handleDelete(teacher);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        {filteredTeachers.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--c-6f6c65)]">
            <span>
              Showing {(teacherPage - 1) * teacherPageSize + 1}-
              {Math.min(teacherPage * teacherPageSize, filteredTeachers.length)} of{' '}
              {filteredTeachers.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTeacherPage(1)}
                disabled={teacherPage === 1}
                className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                First
              </button>
              <button
                type="button"
                onClick={() => setTeacherPage(prev => Math.max(1, prev - 1))}
                disabled={teacherPage === 1}
                className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Page {teacherPage} of {teacherTotalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setTeacherPage(prev =>
                    Math.min(teacherTotalPages, prev + 1),
                  )
                }
                disabled={teacherPage === teacherTotalPages}
                className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
              <button
                type="button"
                onClick={() => setTeacherPage(teacherTotalPages)}
                disabled={teacherPage === teacherTotalPages}
                className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                Last
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {selectedTeacher ? (
        <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                  Student Roster
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                  <span>{students.length} students</span>
                  <span>•</span>
                  <span>
                    {students.filter(student => student.status === 'Active').length} active
                  </span>
                  <span>•</span>
                  <span>
                    {students.filter(student => student.status === 'Archived').length} archived
                  </span>
                </div>
              </div>
            </div>
            {students.length > 0 ? (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <input
                  value={studentSearch}
                  onChange={event => {
                    const nextValue = event.target.value;
                    setStudentSearch(nextValue);
                    if (nextValue.trim()) {
                      setStudentStatusFilter('All');
                    }
                  }}
                  placeholder="Search students..."
                  className="min-w-[220px] flex-1 rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-sm text-[var(--c-1f1f1d)] outline-none focus:border-[var(--c-c8102e)]"
                />
                <select
                  value={studentStatusFilter}
                  onChange={event => setStudentStatusFilter(event.target.value)}
                  className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
                >
                  <option value="All">All Statuses</option>
                  {studentStatusOptions.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--c-ecebe7)]">
              <div className="grid grid-cols-12 gap-2 bg-[var(--c-f7f7f5)] px-4 py-3 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                <div className="col-span-4">Student</div>
                <div className="col-span-4">Email</div>
                <div className="col-span-2">Level</div>
                <div className="col-span-2">Status</div>
              </div>
              <div className="divide-y divide-[var(--c-ecebe7)]">
                {studentsLoading ? (
                  <div className="px-4 py-6 text-sm text-[var(--c-6f6c65)]">
                    Loading students...
                  </div>
                ) : students.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-[var(--c-6f6c65)]">
                    No students yet for this teacher.
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-[var(--c-6f6c65)]">
                    No students match this search.
                  </div>
                ) : (
                  pagedStudents.map(student => (
                    <div
                      key={student.id}
                      className="grid grid-cols-12 items-center gap-2 px-4 py-4 text-sm"
                    >
                      <div className="col-span-4">
                        <p className="font-medium text-[var(--c-1f1f1d)]">
                          {student.name}
                        </p>
                        <p className="text-xs text-[var(--c-9a9892)]">
                          Added{' '}
                          {new Date(student.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="col-span-4 text-[var(--c-6f6c65)]">
                        {student.email || '—'}
                      </div>
                      <div className="col-span-2">
                        <span className="rounded-full border border-[var(--c-e5e3dd)] px-3 py-1 text-xs text-[var(--c-6f6c65)]">
                          {student.level}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="rounded-full border border-[var(--c-e5e3dd)] px-3 py-1 text-xs text-[var(--c-6f6c65)]">
                          {student.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            {filteredStudents.length > 0 ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--c-6f6c65)]">
                <span>
                  Showing {(studentPage - 1) * studentPageSize + 1}-
                  {Math.min(studentPage * studentPageSize, filteredStudents.length)} of{' '}
                  {filteredStudents.length}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStudentPage(1)}
                    disabled={studentPage === 1}
                    className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    First
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setStudentPage(prev => Math.max(1, prev - 1))
                    }
                    disabled={studentPage === 1}
                    className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                    Page {studentPage} of {studentTotalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setStudentPage(prev =>
                        Math.min(studentTotalPages, prev + 1),
                      )
                    }
                    disabled={studentPage === studentTotalPages}
                    className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentPage(studentTotalPages)}
                    disabled={studentPage === studentTotalPages}
                    className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Last
                  </button>
                </div>
              </div>
            ) : null}
        </section>
      ) : null}

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
                    value={formState.name}
                    onChange={event =>
                      setFormState(current => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3 text-sm text-[var(--c-1f1f1d)] outline-none focus:border-[var(--c-c8102e)]"
                    placeholder="Teacher name"
                  />
                </label>
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  Email
                  <input
                    value={formState.email}
                    onChange={event =>
                      setFormState(current => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3 text-sm text-[var(--c-1f1f1d)] outline-none focus:border-[var(--c-c8102e)]"
                    placeholder="Email address"
                  />
                </label>
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  Username
                  <input
                    value={formState.username}
                    onChange={event =>
                      setFormState(current => ({
                        ...current,
                        username: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3 text-sm text-[var(--c-1f1f1d)] outline-none focus:border-[var(--c-c8102e)]"
                    placeholder="unique username"
                  />
                </label>
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  Password
                  <div className="relative mt-2">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formState.password}
                      onChange={event =>
                        setFormState(current => ({
                          ...current,
                          password: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3 pr-12 text-sm text-[var(--c-1f1f1d)] outline-none focus:border-[var(--c-c8102e)]"
                      placeholder={
                        editing ? 'Set new password' : 'Create password'
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(current => !current)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--c-6f6c65)] transition hover:text-[var(--c-1f1f1d)]"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-5 w-5"
                        >
                          <path d="M12 5c-5 0-9.27 3.11-11 7 1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                          <path d="M4.3 3.3a1 1 0 0 1 1.4 0l15 15a1 1 0 0 1-1.4 1.4l-2.06-2.06A12.6 12.6 0 0 1 12 19c-5 0-9.27-3.11-11-7a13.3 13.3 0 0 1 3.2-4.52L4.3 4.7a1 1 0 0 1 0-1.4Zm4.03 4.03 1.6 1.6A2.5 2.5 0 0 0 9.5 12a2.5 2.5 0 0 0 3.08 2.42l1.6 1.6A5 5 0 0 1 8.33 7.33ZM12 7a5 5 0 0 1 5 5c0 .52-.08 1.02-.22 1.5l-1.65-1.65a2.5 2.5 0 0 0-3.08-3.08L10.4 7.12c.5-.13 1.06-.12 1.6-.12Z" />
                        </svg>
                      ) : (
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-5 w-5"
                        >
                          <path d="M12 5c-5 0-9.27 3.11-11 7 1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </label>
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  Status
                  <select
                    value={formState.status}
                    onChange={event =>
                      setFormState(current => ({
                        ...current,
                        status: event.target.value as typeof formState.status,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3 text-sm text-[var(--c-1f1f1d)] outline-none focus:border-[var(--c-c8102e)]"
                  >
                    {[
                      'Licensed',
                      'Certified',
                      'Advanced',
                      'Master',
                      'Training',
                      'Onboarding',
                      'Interested',
                      'Inactive',
                    ].map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  Region
                  <input
                    value={formState.region}
                    onChange={event =>
                      setFormState(current => ({
                        ...current,
                        region: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3 text-sm text-[var(--c-1f1f1d)] outline-none focus:border-[var(--c-c8102e)]"
                    placeholder="Region"
                  />
                </label>
              </div>

              {error ? (
                <div className="rounded-xl border border-[var(--c-f2d7db)] bg-[var(--c-fff5f6)] px-4 py-3 text-sm text-[var(--c-8f2f3b)]">
                  {error}
                </div>
              ) : null}

              <div className="grid w-full gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full rounded-full border border-[var(--c-ecebe7)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full rounded-full bg-[var(--c-c8102e)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSaving ? 'Saving...' : editing ? 'Save Changes' : 'Add Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
