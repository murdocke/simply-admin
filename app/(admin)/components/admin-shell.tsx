'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  AUTH_STORAGE_KEY,
  VIEW_TEACHER_STORAGE_KEY,
  VIEW_STUDENT_STORAGE_KEY,
  VIEW_ROLE_STORAGE_KEY,
  allowedRoots,
  navItems,
  roleHome,
  type AuthUser,
  type UserRole,
} from './auth';
import {
  normalizeTheme,
  THEME_STORAGE_KEY,
  type ThemeMode,
} from '../../components/theme';

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
    | 'Onboarding'
    | 'Inactive'
    | 'Active';
};

type StudentRecord = {
  id: string;
  teacher: string;
  name: string;
  email: string;
  status: 'Active' | 'Paused' | 'Archived';
};

type SelectedTeacher = {
  id: string;
  name: string;
  username: string;
};

type SelectedStudent = {
  id: string;
  name: string;
  email?: string;
};

const RECENT_TEACHERS_KEY = 'sm_recent_teachers';
const RECENT_STUDENTS_KEY = 'sm_recent_students';
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

type AdminShellProps = {
  children: React.ReactNode;
};

export default function AdminShell({ children }: AdminShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [viewRole, setViewRole] = useState<UserRole | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [selectedTeacher, setSelectedTeacher] =
    useState<SelectedTeacher | null>(null);
  const [recentTeachers, setRecentTeachers] = useState<SelectedTeacher[]>([]);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [selectedStudent, setSelectedStudent] =
    useState<SelectedStudent | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null,
  );
  const [recentStudentIds, setRecentStudentIds] = useState<string[]>([]);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [accountInfo, setAccountInfo] = useState<{
    name: string;
    email: string;
    goesBy?: string;
    status: string;
    lastLogin: string | null;
  } | null>(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountForm, setAccountForm] = useState({
    name: '',
    email: '',
    goesBy: '',
    password: '',
  });
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const recentTeachersKey = useMemo(() => {
    if (!user?.username) return RECENT_TEACHERS_KEY;
    return `${RECENT_TEACHERS_KEY}:${user.username}`;
  }, [user?.username]);
  const viewTeacherKey = useMemo(() => {
    if (!user?.username) return VIEW_TEACHER_STORAGE_KEY;
    return `${VIEW_TEACHER_STORAGE_KEY}:${user.username}`;
  }, [user?.username]);
  const viewStudentKey = useMemo(() => {
    if (!user?.username) return VIEW_STUDENT_STORAGE_KEY;
    return `${VIEW_STUDENT_STORAGE_KEY}:${user.username}`;
  }, [user?.username]);
  const selectedStudentKey = useMemo(() => {
    if (!user?.username) return null;
    return `sm_selected_student:${user.username}:${user.username}`;
  }, [user?.username]);
  const recentStudentsKey = useMemo(() => {
    if (!user?.username) return RECENT_STUDENTS_KEY;
    return `sm_recent_selected_students:${user.username}:${user.username}`;
  }, [user?.username]);

  useEffect(() => {
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) {
      router.replace('/login');
      return;
    }
    try {
      const parsed = JSON.parse(stored) as AuthUser;
      if (!parsed?.role) {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
        router.replace('/login');
        return;
      }
      setUser(parsed);
      setRole(parsed.role);
      setViewRole(parsed.role);
      void fetch(
        `/api/account?username=${encodeURIComponent(
          parsed.username,
        )}&role=${encodeURIComponent(parsed.role)}`,
      )
        .then(async response => {
          if (!response.ok) return null;
          const data = (await response.json()) as {
            account?: {
              name: string;
              email: string;
              goesBy?: string;
              status: string;
              lastLogin: string | null;
            };
          };
          return data.account ?? null;
        })
        .then(account => {
          if (account) setAccountInfo(account);
        })
        .catch(() => {
          setAccountInfo(null);
        });
      const storedView = window.localStorage.getItem(VIEW_ROLE_STORAGE_KEY);
      if (storedView) {
        if (
          parsed.role === 'company' &&
          (storedView === 'company' ||
            storedView === 'teacher' ||
            storedView === 'student')
        ) {
          setViewRole(storedView as UserRole);
        }
        if (
          parsed.role === 'teacher' &&
          (storedView === 'teacher' || storedView === 'student')
        ) {
          setViewRole(storedView as UserRole);
        }
      }
      setIsReady(true);
    } catch {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      router.replace('/login');
    }
  }, [router]);

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    const nextTheme = normalizeTheme(stored);
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  }, []);

  useEffect(() => {
    if (role !== 'company' || !user?.username) return;
    let isActive = true;
    const fetchTeachers = async () => {
      try {
        const response = await fetch(
          `/api/teachers?company=${encodeURIComponent(user.username)}`,
        );
        if (!response.ok) return;
        const data = (await response.json()) as { teachers: TeacherRecord[] };
        if (isActive) {
          setTeachers(data.teachers ?? []);
        }
      } catch {
        if (isActive) setTeachers([]);
      }
    };
    fetchTeachers();
    return () => {
      isActive = false;
    };
  }, [role, user?.username]);

  useEffect(() => {
    if (role !== 'teacher' || !user?.username) return;
    let isActive = true;
    const fetchStudents = async () => {
      try {
        const response = await fetch(
          `/api/students?teacher=${encodeURIComponent(user.username)}`,
        );
        if (!response.ok) return;
        const data = (await response.json()) as { students: StudentRecord[] };
        if (isActive) {
          setStudents(data.students ?? []);
        }
      } catch {
        if (isActive) setStudents([]);
      }
    };
    fetchStudents();
    return () => {
      isActive = false;
    };
  }, [role, user?.username]);

  const refreshTeachers = useCallback(() => {
    if (role !== 'company' || !user?.username) return;
    void fetch(`/api/teachers?company=${encodeURIComponent(user.username)}`)
      .then(async response => {
        if (!response.ok) return null;
        const data = (await response.json()) as { teachers: TeacherRecord[] };
        return data.teachers ?? [];
      })
      .then(list => {
        if (list) setTeachers(list);
      })
      .catch(() => {
        setTeachers([]);
      });
  }, [role, user?.username]);

  useEffect(() => {
    if (role !== 'company') return;
    const handleUpdate = () => refreshTeachers();
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'sm_teachers_updated') {
        refreshTeachers();
      }
    };
    window.addEventListener('sm-teachers-updated', handleUpdate);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('sm-teachers-updated', handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, [refreshTeachers, role]);

  useEffect(() => {
    if (role !== 'company') return;
    if (isTeacherModalOpen) {
      refreshTeachers();
    }
  }, [isTeacherModalOpen, refreshTeachers, role]);

  useEffect(() => {
    if (role !== 'company') return;
    const handleOpenTeacherLookup = () => setIsTeacherModalOpen(true);
    window.addEventListener('sm-open-teacher-lookup', handleOpenTeacherLookup);
    return () => {
      window.removeEventListener(
        'sm-open-teacher-lookup',
        handleOpenTeacherLookup,
      );
    };
  }, [role]);

  useEffect(() => {
    if (role !== 'teacher') return;
    const handleOpenStudentLookup = () => setIsStudentModalOpen(true);
    window.addEventListener('sm-open-student-lookup', handleOpenStudentLookup);
    return () => {
      window.removeEventListener(
        'sm-open-student-lookup',
        handleOpenStudentLookup,
      );
    };
  }, [role]);

  useEffect(() => {
    if (role !== 'company') return;
    const stored =
      window.localStorage.getItem(viewTeacherKey) ??
      window.localStorage.getItem(VIEW_TEACHER_STORAGE_KEY);
    if (!stored) {
      setSelectedTeacher(null);
      return;
    }
    try {
      const parsed = JSON.parse(stored) as SelectedTeacher;
      if (parsed?.id && parsed?.username) {
        setSelectedTeacher(parsed);
        window.localStorage.setItem(viewTeacherKey, stored);
      } else {
        setSelectedTeacher(null);
      }
    } catch {
      setSelectedTeacher(null);
    }
  }, [role, viewTeacherKey]);

  useEffect(() => {
    if (role !== 'company') return;
    const stored = window.localStorage.getItem(recentTeachersKey);
    if (!stored) {
      setRecentTeachers([]);
      return;
    }
    try {
      const parsed = JSON.parse(stored) as SelectedTeacher[];
      if (Array.isArray(parsed)) {
        setRecentTeachers(
          parsed.filter(item => item?.id && item?.name && item?.username),
        );
      } else {
        setRecentTeachers([]);
      }
    } catch {
      setRecentTeachers([]);
    }
  }, [recentTeachersKey, role]);

  useEffect(() => {
    if (role !== 'teacher') return;
    const stored = window.localStorage.getItem(recentStudentsKey);
    if (!stored) {
      setRecentStudentIds([]);
      return;
    }
    try {
      const parsed = JSON.parse(stored) as string[];
      if (Array.isArray(parsed)) {
        setRecentStudentIds(parsed.filter(Boolean));
      } else {
        setRecentStudentIds([]);
      }
    } catch {
      setRecentStudentIds([]);
    }
  }, [recentStudentsKey, role]);

  useEffect(() => {
    if (role !== 'teacher') return;
    if (!selectedStudentKey) return;
    const storedId = window.localStorage.getItem(selectedStudentKey);
    if (storedId) {
      setSelectedStudentId(storedId);
      return;
    }
    const storedView = window.localStorage.getItem(viewStudentKey);
    if (storedView) {
      try {
        const parsed = JSON.parse(storedView) as SelectedStudent;
        if (parsed?.id) {
          setSelectedStudentId(parsed.id);
          window.localStorage.setItem(selectedStudentKey, parsed.id);
          return;
        }
      } catch {
        // ignore parse errors
      }
    }
    setSelectedStudentId(null);
  }, [role, selectedStudentKey, viewStudentKey]);

  useEffect(() => {
    if (!selectedStudentId) {
      setSelectedStudent(null);
      return;
    }
    const record = students.find(student => student.id === selectedStudentId);
    if (!record) {
      setSelectedStudent(null);
      return;
    }
    setSelectedStudent({
      id: record.id,
      name: record.name,
      email: record.email,
    });
  }, [selectedStudentId, students]);

  useEffect(() => {
    if (role !== 'teacher') return;
    const handleStudentUpdate = (event?: Event) => {
      const detail =
        event && 'detail' in event
          ? (event as CustomEvent<{
              selectedId?: string | null;
              recentIds?: string[];
            }>).detail
          : undefined;
      if (detail?.selectedId !== undefined) {
        setSelectedStudentId(detail.selectedId ?? null);
      }
      if (detail?.recentIds) {
        setRecentStudentIds(detail.recentIds);
      }

      let nextSelectedId: string | null = null;
      if (selectedStudentKey) {
        nextSelectedId = window.localStorage.getItem(selectedStudentKey);
      }
      if (!nextSelectedId) {
        const storedView = window.localStorage.getItem(viewStudentKey);
        if (storedView) {
          try {
            const parsed = JSON.parse(storedView) as SelectedStudent;
            if (parsed?.id) {
              nextSelectedId = parsed.id;
              setSelectedStudent(parsed);
              if (selectedStudentKey) {
                window.localStorage.setItem(selectedStudentKey, parsed.id);
              }
            }
          } catch {
            // ignore parse errors
          }
        }
      }
      if (detail?.selectedId === undefined) {
        setSelectedStudentId(nextSelectedId ?? null);
      }

      const recentStored = window.localStorage.getItem(recentStudentsKey);
      if (!recentStored) {
        if (!detail?.recentIds) setRecentStudentIds([]);
        return;
      }
      try {
        const parsed = JSON.parse(recentStored) as string[];
        if (Array.isArray(parsed)) {
          if (!detail?.recentIds) setRecentStudentIds(parsed.filter(Boolean));
        } else {
          if (!detail?.recentIds) setRecentStudentIds([]);
        }
      } catch {
        if (!detail?.recentIds) setRecentStudentIds([]);
      }
    };
    window.addEventListener('sm-view-student-updated', handleStudentUpdate);
    window.addEventListener('sm-selected-student-updated', handleStudentUpdate);
    window.addEventListener(
      'sm-student-selection',
      handleStudentUpdate as EventListener,
    );
    return () => {
      window.removeEventListener('sm-view-student-updated', handleStudentUpdate);
      window.removeEventListener(
        'sm-selected-student-updated',
        handleStudentUpdate,
      );
      window.removeEventListener(
        'sm-student-selection',
        handleStudentUpdate as EventListener,
      );
    };
  }, [recentStudentsKey, role, selectedStudentKey, viewStudentKey]);

  const effectiveRole =
    role === 'company'
      ? viewRole ?? role
      : role === 'teacher'
        ? viewRole ?? role
        : role;

  useEffect(() => {
    if (!effectiveRole || !pathname) return;
    const allowed = allowedRoots[effectiveRole];
    const isAllowed = allowed.some(root => pathname.startsWith(root));
    if (!isAllowed) {
      router.replace(roleHome[effectiveRole]);
    }
  }, [pathname, effectiveRole, router]);

  const items = useMemo(() => {
    if (!effectiveRole) return [];
    return navItems[effectiveRole];
  }, [effectiveRole]);

  const sidebarStyles = useMemo(() => {
    if (effectiveRole === 'teacher') {
      return {
        bg: 'bg-[var(--c-e7eddc)]',
        border: 'border-[var(--c-dfe6d2)]',
      };
    }
    if (effectiveRole === 'student') {
      return {
        bg: 'bg-[var(--c-e6f4ff)]',
        border: 'border-[var(--c-d9e2ef)]',
      };
    }
    return {
      bg: 'bg-[var(--c-ffffff)]',
      border: 'border-[var(--c-ecebe7)]',
    };
  }, [effectiveRole]);

  const openAccountModal = () => {
    if (!user) return;
    setAccountForm({
      name: accountInfo?.name ?? '',
      email: accountInfo?.email ?? '',
      goesBy: accountInfo?.goesBy ?? '',
      password: '',
    });
    setAccountError(null);
    setIsAccountModalOpen(true);
  };

  const closeAccountModal = () => {
    if (accountSaving) return;
    setIsAccountModalOpen(false);
  };

  const handleAccountSave = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!user) return;
    setAccountSaving(true);
    setAccountError(null);
    try {
      const response = await fetch(
        `/api/accounts/${encodeURIComponent(user.username)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: user.role,
            name: accountForm.name.trim(),
            email: accountForm.email.trim(),
            goesBy: accountForm.goesBy.trim(),
            password: accountForm.password.trim() || undefined,
          }),
        },
      );
      const data = (await response.json()) as {
        account?: { name: string; email: string; status: string; goesBy?: string };
        error?: string;
      };
      if (!response.ok || !data.account) {
        throw new Error(data.error ?? 'Unable to update account.');
      }
      setAccountInfo(current => ({
        name: data.account?.name ?? current?.name ?? '',
        email: data.account?.email ?? current?.email ?? '',
        goesBy: data.account?.goesBy ?? current?.goesBy ?? '',
        status: data.account?.status ?? current?.status ?? 'Active',
        lastLogin: current?.lastLogin ?? null,
      }));
      setIsAccountModalOpen(false);
    } catch (caught) {
      setAccountError(
        caught instanceof Error
          ? caught.message
          : 'Unable to update account.',
      );
    } finally {
      setAccountSaving(false);
    }
  };

  const teacherMode = useMemo(() => {
    if (!pathname?.startsWith('/teachers')) return 'training';
    return searchParams.get('mode') === 'teaching' ? 'teaching' : 'training';
  }, [pathname, searchParams]);

  const handleLogout = () => {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.localStorage.removeItem(VIEW_ROLE_STORAGE_KEY);
    router.replace('/login');
  };

  const handleViewRoleChange = (nextRole: UserRole) => {
    if (role === 'company') {
      setViewRole(nextRole);
      window.localStorage.setItem(VIEW_ROLE_STORAGE_KEY, nextRole);
      router.replace(roleHome[nextRole]);
      return;
    }
    if (role === 'teacher' && (nextRole === 'teacher' || nextRole === 'student')) {
      setViewRole(nextRole);
      window.localStorage.setItem(VIEW_ROLE_STORAGE_KEY, nextRole);
      router.replace(roleHome[nextRole]);
    }
  };

  const toTeacherUsername = (teacher: TeacherRecord) => {
    const normalized = teacher.username?.trim().toLowerCase();
    if (normalized) return normalized;
    const first = teacher.name.split(' ')[0]?.trim().toLowerCase();
    return first || teacher.name.trim().toLowerCase();
  };

  const handleTeacherSelect = (teacher: TeacherRecord) => {
    const selection: SelectedTeacher = {
      id: teacher.id,
      name: teacher.name,
      username: toTeacherUsername(teacher),
    };
    handleTeacherChoice(selection);
  };

  const handleTeacherChoice = (selection: SelectedTeacher) => {
    setSelectedTeacher(selection);
    window.localStorage.setItem(viewTeacherKey, JSON.stringify(selection));
    window.dispatchEvent(new Event('sm-view-teacher-updated'));
    setRecentTeachers(current => {
      const next = [
        selection,
        ...current.filter(item => item.id !== selection.id),
      ].slice(0, 6);
      window.localStorage.setItem(recentTeachersKey, JSON.stringify(next));
      return next;
    });
    setIsTeacherModalOpen(false);
    setTeacherSearch('');
  };

  const handleTeacherClear = () => {
    setSelectedTeacher(null);
    window.localStorage.removeItem(viewTeacherKey);
    window.localStorage.removeItem(VIEW_TEACHER_STORAGE_KEY);
    window.dispatchEvent(new Event('sm-view-teacher-updated'));
  };

  const handleStudentSelect = (student: StudentRecord) => {
    const selection: SelectedStudent = {
      id: student.id,
      name: student.name,
      email: student.email,
    };
    handleStudentChoice(selection);
  };

  const handleStudentChoice = (selection: SelectedStudent) => {
    setSelectedStudent(selection);
    window.localStorage.setItem(viewStudentKey, JSON.stringify(selection));
    window.dispatchEvent(new Event('sm-view-student-updated'));
    window.dispatchEvent(new Event('sm-selected-student-updated'));
    const nextRecent = [selection.id, ...recentStudentIds.filter(id => id !== selection.id)].slice(
      0,
      6,
    );
    window.localStorage.setItem(recentStudentsKey, JSON.stringify(nextRecent));
    setRecentStudentIds(nextRecent);
    if (user?.username) {
      const selectedKey = `sm_selected_student:${user.username}:${user.username}`;
      window.localStorage.setItem(selectedKey, selection.id);
      setSelectedStudentId(selection.id);
    }
    setIsStudentModalOpen(false);
    setStudentSearch('');

    window.dispatchEvent(
      new CustomEvent('sm-student-selection', {
        detail: { selectedId: selection.id, recentIds: nextRecent },
      }),
    );
  };

  const handleStudentClear = () => {
    setSelectedStudent(null);
    window.localStorage.removeItem(viewStudentKey);
    window.localStorage.removeItem(VIEW_STUDENT_STORAGE_KEY);
    if (user?.username) {
      const selectedKey = `sm_selected_student:${user.username}:${user.username}`;
      window.localStorage.removeItem(selectedKey);
    }
    window.dispatchEvent(new Event('sm-view-student-updated'));
    window.dispatchEvent(new Event('sm-selected-student-updated'));
    setSelectedStudentId(null);
    window.dispatchEvent(
      new CustomEvent('sm-student-selection', {
        detail: { selectedId: null, recentIds: recentStudentIds },
      }),
    );
  };

  const handleThemeChange = (nextTheme: ThemeMode) => {
    setTheme(nextTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  };

  const handleNewStudent = () => {
    if (effectiveRole !== 'teacher') return;
    router.push('/teachers/students?new=1');
    setIsOpen(false);
  };

  const handleNewTeacher = () => {
    if (effectiveRole !== 'company') return;
    router.push('/teachers?new=1');
    setIsOpen(false);
  };

  const handleTeacherMode = (mode: 'training' | 'teaching') => {
    if (effectiveRole !== 'teacher') return;
    router.push(`/teachers?mode=${mode}`);
    setIsOpen(false);
  };

  const { displayName, roleBadge } = useMemo(() => {
    const fallback = user?.username ?? 'Account';
    const name = accountInfo?.name ?? fallback;
    const match = name.match(/\s*\(([^)]+)\)\s*$/);
    if (match) {
      return {
        displayName: name.replace(match[0], '').trim() || fallback,
        roleBadge: match[1],
      };
    }
    return { displayName: name, roleBadge: null as string | null };
  }, [accountInfo?.name, user?.username]);

  const recentThree = useMemo(
    () => recentTeachers.slice(0, 3),
    [recentTeachers],
  );
  const recentStudents = useMemo(() => {
    const byId = new Map(students.map(student => [student.id, student]));
    return recentStudentIds
      .map(id => byId.get(id))
      .filter((student): student is StudentRecord => Boolean(student))
      .map(student => ({
        id: student.id,
        name: student.name,
        email: student.email,
      }));
  }, [recentStudentIds, students]);

  const recentStudentThree = useMemo(
    () => recentStudents.slice(0, 3),
    [recentStudents],
  );

  const modalTeachers = useMemo(() => {
    const query = teacherSearch.trim().toLowerCase();
    if (!query) {
      return recentTeachers.slice(0, 6).map(teacher => ({
        id: teacher.id,
        name: teacher.name,
        username: teacher.username,
        label: 'Recent',
      }));
    }
    return teachers
      .filter(teacher =>
        [teacher.name, teacher.email, teacher.region, teacher.status]
          .join(' ')
          .toLowerCase()
          .includes(query),
      )
      .slice(0, 6)
      .map(teacher => ({
        id: teacher.id,
        name: teacher.name,
        username: toTeacherUsername(teacher),
        label: `${teacher.region} • ${normalizeTeacherStatus(teacher.status)}`,
      }));
  }, [recentTeachers, teacherSearch, teachers]);

  const modalStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();
    const candidates = students.filter(student => student.status !== 'Archived');
    if (!query) {
      return recentStudents.slice(0, 6).map(student => ({
        id: student.id,
        name: student.name,
        email: student.email ?? '',
        label: 'Recent',
      }));
    }
    return candidates
      .filter(student =>
        [student.name, student.email].join(' ').toLowerCase().includes(query),
      )
      .slice(0, 6)
      .map(student => ({
        id: student.id,
        name: student.name,
        email: student.email ?? '',
        label: student.email ? 'Match' : 'Student',
      }));
  }, [recentStudents, studentSearch, students]);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-[var(--c-f7f7f5)] text-[var(--c-1f1f1d)] flex items-center justify-center">
        <div className="text-sm uppercase tracking-[0.3em] text-[var(--c-6f6c65)]">
          Loading
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell-bg min-h-screen text-[var(--c-1f1f1d)]">
      <div className="flex min-h-screen">
        <aside
          className={`hidden w-72 border-r px-6 py-8 lg:block ${sidebarStyles.bg} ${sidebarStyles.border}`}
        >
          <div className="mb-10 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[var(--c-c8102e)] text-white flex items-center justify-center font-semibold">
              SM
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                Admin
              </p>
              <h2 className="text-xl font-semibold">Simply Music</h2>
            </div>
          </div>
          <nav className="space-y-2 text-sm">
            {items.map(item => {
              if (effectiveRole === 'teacher' && item.label === 'Dashboard') {
                return (
                  <div key={item.label} className="space-y-2">
                    <a
                      href={item.href}
                      className="block rounded-lg px-3 py-2 font-medium text-[var(--c-3a3935)] transition hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)] hover:ring-1 hover:ring-[var(--sidebar-accent-border)]"
                    >
                      {item.label}
                    </a>
                    <a
                      href="/teachers?mode=training"
                      className="block rounded-lg px-3 py-2 font-medium text-[var(--c-3a3935)] transition hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)] hover:ring-1 hover:ring-[var(--sidebar-accent-border)]"
                    >
                      Training
                    </a>
                    <a
                      href="/teachers?mode=teaching"
                      className="block rounded-lg px-3 py-2 font-medium text-[var(--c-3a3935)] transition hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)] hover:ring-1 hover:ring-[var(--sidebar-accent-border)]"
                    >
                      Teaching
                    </a>
                  </div>
                );
              }
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className="block rounded-lg px-3 py-2 font-medium text-[var(--c-3a3935)] transition hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)] hover:ring-1 hover:ring-[var(--sidebar-accent-border)]"
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
          {user ? (
            <div className="mt-4 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4 text-xs text-[var(--c-7a776f)]">
              <p className="mt-2 text-sm font-semibold text-[var(--c-1f1f1d)]">
                {displayName}
              </p>
              <p className="mt-1 text-xs text-[var(--c-9a9892)]">
                {accountInfo?.email ?? `${user.username}@simplymusic.com`}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                {roleBadge ? (
                  <span className="rounded-full border border-[var(--c-e5e3dd)] px-2 py-1">
                    {roleBadge}
                  </span>
                ) : null}
                <span className="rounded-full border border-[var(--c-e5e3dd)] px-2 py-1">
                  {accountInfo?.status ?? 'Active'}
                </span>
                <span className="rounded-full border border-[var(--c-e5e3dd)] px-2 py-1">
                  Last login:{' '}
                  {accountInfo?.lastLogin
                    ? new Date(accountInfo.lastLogin).toLocaleDateString()
                    : 'Today'}
                </span>
              </div>
              <button
                onClick={openAccountModal}
                className="mt-4 w-full rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--c-fafafa)] px-4 py-2.5 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)]"
              >
                Account Details
              </button>
              <div className="mt-4 border-t border-[var(--c-ecebe7)] pt-3 text-[10px] uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
                Account
              </div>
            </div>
          ) : null}
          {role === 'company' ? (
            <div className="mt-4 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-4 text-xs text-[var(--c-7a776f)]">
            <button
              onClick={() => setIsTeacherModalOpen(true)}
              className="w-full rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-4 py-2.5 text-xs uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)] transition hover:brightness-110"
            >
              Browse
            </button>
              <div className="mt-4 space-y-2">
                {recentThree.length === 0 ? (
                  <div className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-[11px] text-[var(--c-6f6c65)]">
                    No recent teachers yet. Open browse to pick one.
                  </div>
                ) : (
                  recentThree.map((teacher, index) => {
                    const isSelected = selectedTeacher?.id === teacher.id;
                  return (
                    <button
                      key={teacher.id}
                      onClick={() =>
                        isSelected
                          ? handleTeacherClear()
                          : handleTeacherChoice(teacher)
                      }
                      className={`flex w-full items-center rounded-xl border px-3 py-2 text-left transition min-h-[72px] ${
                        isSelected
                          ? 'border-[var(--sidebar-selected-border)] bg-[var(--sidebar-selected-bg)] shadow-sm'
                          : 'border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] hover:border-[var(--sidebar-accent-border)]'
                        }`}
                      >
                        <div className="flex w-full items-center justify-between gap-2">
                          <div>
                            <p
                              className={`text-sm font-semibold ${
                                isSelected
                                  ? 'text-[var(--sidebar-selected-text)]'
                                  : 'text-[var(--c-1f1f1d)]'
                              }`}
                            >
                              {teacher.name}
                            </p>
                            <p
                              className={`text-[10px] uppercase tracking-[0.2em] ${
                                isSelected
                                  ? 'text-[var(--sidebar-selected-text)]/80'
                                  : 'text-[var(--c-6f6c65)]'
                              }`}
                            >
                              {index === 0 ? 'Last used' : 'Recent'}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${
                              isSelected
                                ? 'border border-white/25 bg-white/10 text-[var(--sidebar-selected-text)]'
                                : 'border border-[var(--c-e5e3dd)] text-[var(--c-6f6c65)]'
                            }`}
                          >
                            {isSelected ? 'Selected' : 'Select'}
                          </span>
                        </div>
                      </button>
                  );
                })
              )}
            </div>
            <div className="mt-4 border-t border-[var(--c-ecebe7)] pt-3 text-[10px] uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
              Choose A Teacher
            </div>
          </div>
        ) : null}
          {role === 'teacher' ? (
            <div className="mt-4 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-4 text-xs text-[var(--c-7a776f)]">
              <button
                onClick={() => setIsStudentModalOpen(true)}
                className="w-full rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-4 py-2.5 text-xs uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)] transition hover:brightness-110"
              >
                Browse Students
              </button>
              <div className="mt-4 space-y-2">
                {recentStudentThree.length === 0 ? (
                  <div className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-[11px] text-[var(--c-6f6c65)]">
                    No recent students yet. Open browse to pick one.
                  </div>
                ) : (
                  recentStudentThree.map((student, index) => {
                    const isSelected = selectedStudent?.id === student.id;
                    return (
                      <button
                        key={student.id}
                        onClick={() =>
                          isSelected
                            ? handleStudentClear()
                            : handleStudentChoice(student)
                        }
                        className={`flex w-full items-center rounded-xl border px-3 py-2 text-left transition min-h-[72px] ${
                          isSelected
                            ? 'border-[var(--sidebar-selected-border)] bg-[var(--sidebar-selected-bg)]/85 shadow-sm'
                            : 'border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] hover:border-[var(--sidebar-accent-border)]'
                        }`}
                      >
                        <div className="flex w-full items-center justify-between gap-2">
                          <div>
                            <p
                              className={`text-sm font-semibold ${
                                isSelected
                                  ? 'text-[var(--sidebar-selected-text)]'
                                  : 'text-[var(--c-1f1f1d)]'
                              }`}
                            >
                              {student.name}
                            </p>
                            <p
                              className={`text-[10px] uppercase tracking-[0.2em] ${
                                isSelected
                                  ? 'text-[var(--sidebar-selected-text)]/80'
                                  : 'text-[var(--c-6f6c65)]'
                              }`}
                            >
                              {index === 0 ? 'Last used' : 'Recent'}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${
                              isSelected
                                ? 'border border-white/25 bg-white/10 text-[var(--sidebar-selected-text)]'
                                : 'border border-[var(--c-e5e3dd)] text-[var(--c-6f6c65)]'
                            }`}
                          >
                            {isSelected ? 'Selected' : 'Select'}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
              <div className="mt-4 border-t border-[var(--c-ecebe7)] pt-3 text-[10px] uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
                Choose A Student
              </div>
            </div>
          ) : null}
          {effectiveRole === 'company' ? null : null}
        {role === 'company' ? (
          <div className="mt-4 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-4 text-xs text-[var(--c-7a776f)]">
            <div className="mt-3 flex flex-col gap-2">
              {(['company', 'teacher', 'student'] as UserRole[]).map(option => (
                <button
                  key={option}
                  onClick={() => handleViewRoleChange(option)}
                  className={`rounded-full px-4 py-2.5 text-xs uppercase tracking-[0.2em] transition ${
                    effectiveRole === option
                      ? 'bg-[var(--sidebar-selected-bg)] text-[var(--sidebar-selected-text)] border-[var(--sidebar-selected-border)]'
                      : 'border border-[var(--sidebar-accent-border)] text-[var(--c-6f6c65)] hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)]'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="mt-4 border-t border-[var(--c-ecebe7)] pt-3 text-[10px] uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
              View As
            </div>
          </div>
        ) : null}
        {role === 'teacher' ? (
          <div className="mt-4 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-4 text-xs text-[var(--c-7a776f)]">
            <div className="mt-3 flex flex-col gap-2">
              {(['teacher', 'student'] as UserRole[]).map(option => (
                <button
                  key={option}
                  onClick={() => handleViewRoleChange(option)}
                  className={`rounded-full px-4 py-2.5 text-xs uppercase tracking-[0.2em] transition ${
                    effectiveRole === option
                      ? 'bg-[var(--sidebar-selected-bg)] text-[var(--sidebar-selected-text)] border-[var(--sidebar-selected-border)]'
                      : 'border border-[var(--sidebar-accent-border)] text-[var(--c-6f6c65)] hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)]'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="mt-4 border-t border-[var(--c-ecebe7)] pt-3 text-[10px] uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
              View As
            </div>
          </div>
        ) : null}
        <div className="mt-4 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-4 text-xs text-[var(--c-7a776f)]">
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => handleThemeChange('light')}
              className={`rounded-full px-3 py-2 text-[10px] uppercase tracking-[0.2em] transition ${
                theme === 'light'
                  ? 'bg-[var(--sidebar-selected-bg)] text-[var(--sidebar-selected-text)] border-[var(--sidebar-selected-border)]'
                  : 'border border-[var(--sidebar-accent-border)] text-[var(--c-6f6c65)] hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)]'
              }`}
            >
              Light
            </button>
            <button
              onClick={() => handleThemeChange('dark')}
              className={`rounded-full px-3 py-2 text-[10px] uppercase tracking-[0.2em] transition ${
                theme === 'dark'
                  ? 'bg-[var(--sidebar-selected-bg)] text-[var(--sidebar-selected-text)] border-[var(--sidebar-selected-border)]'
                  : 'border border-[var(--sidebar-accent-border)] text-[var(--c-6f6c65)] hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)]'
              }`}
            >
              Dark
            </button>
          </div>
          <div className="mt-4 border-t border-[var(--c-ecebe7)] pt-3 text-[10px] uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
            Theme
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-6 w-full rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--c-ffffff)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)]"
        >
          Log Out
        </button>
      </aside>

        <div className="flex-1">
        <div className="flex items-center justify-between border-b border-[var(--c-ecebe7)] bg-[color:var(--c-ffffff)]/70 px-6 py-4 backdrop-blur lg:hidden">
            <button
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--c-c8102e)] text-white shadow-sm transition hover:brightness-110"
              onClick={() => setIsOpen(true)}
              aria-label="Open menu"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          <div className="text-sm uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
            {user ? `${user.username} • ${user.role}` : 'Simply Music'}
          </div>
        </div>
        <main className="p-6 md:p-10">{children}</main>
      </div>
    </div>

    {isAccountModalOpen ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={closeAccountModal}
        />
        <div className="relative w-full max-w-xl rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                Account
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                Account Details
              </h2>
              <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                Update your profile details. Role and username are locked.
              </p>
            </div>
          </div>

          <form
            className="mt-6 space-y-4"
            onSubmit={handleAccountSave}
            autoComplete="off"
            onKeyDown={event => {
              if (
                event.key === 'Enter' &&
                event.target instanceof HTMLTextAreaElement
              ) {
                return;
              }
              if (event.key === 'Enter') {
                event.preventDefault();
                handleAccountSave(event as React.FormEvent<HTMLFormElement>);
              }
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Name
                <input
                  autoComplete="name"
                  value={accountForm.name}
                  onChange={event =>
                    setAccountForm(current => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3 text-sm text-[var(--c-1f1f1d)] outline-none focus:border-[var(--c-c8102e)]"
                  placeholder="Full name"
                />
              </label>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Email
                <input
                  autoComplete="email"
                  value={accountForm.email}
                  onChange={event =>
                    setAccountForm(current => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3 text-sm text-[var(--c-1f1f1d)] outline-none focus:border-[var(--c-c8102e)]"
                  placeholder="Email address"
                />
              </label>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Goes By
                <input
                  autoComplete="nickname"
                  value={accountForm.goesBy}
                  onChange={event =>
                    setAccountForm(current => ({
                      ...current,
                      goesBy: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3 text-sm text-[var(--c-1f1f1d)] outline-none focus:border-[var(--c-c8102e)]"
                  placeholder="e.g., Mr. Neil"
                />
              </label>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Username
                <input
                  value={user?.username ?? ''}
                  disabled
                  autoComplete="username"
                  className="mt-2 w-full rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-f1f0ec)] px-4 py-3 text-sm text-[var(--c-6f6c65)]"
                />
              </label>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Role
                <input
                  value={user?.role ?? ''}
                  disabled
                  autoComplete="organization"
                  className="mt-2 w-full rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-f1f0ec)] px-4 py-3 text-sm text-[var(--c-6f6c65)]"
                />
              </label>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] sm:col-span-2">
                Password
                <input
                  type="password"
                  autoComplete="new-password"
                  value={accountForm.password}
                  onChange={event =>
                    setAccountForm(current => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3 text-sm text-[var(--c-1f1f1d)] outline-none focus:border-[var(--c-c8102e)]"
                  placeholder="Set new password"
                />
              </label>
            </div>

            {accountError ? (
              <div className="rounded-xl border border-[var(--c-f2d7db)] bg-[var(--c-fff5f6)] px-4 py-3 text-sm text-[var(--c-8f2f3b)]">
                {accountError}
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={closeAccountModal}
                className="w-full rounded-full border border-[var(--c-ecebe7)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={accountSaving}
                className="w-full rounded-full bg-[var(--c-c8102e)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {accountSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    ) : null}

      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setIsOpen(false)}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform border-r px-6 py-8 shadow-xl backdrop-blur-xl transition-transform ${
          sidebarStyles.bg
        } ${sidebarStyles.border} ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[var(--c-c8102e)] text-white flex items-center justify-center font-semibold">
              SM
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                Admin
              </p>
              <h2 className="text-xl font-semibold">Simply Music</h2>
            </div>
          </div>
          <button
            className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
            onClick={() => setIsOpen(false)}
          >
            Close
          </button>
        </div>
        <nav className="space-y-2 text-sm">
          {items.map(item => {
            if (effectiveRole === 'teacher' && item.label === 'Dashboard') {
              return (
                <div key={item.label} className="space-y-2">
                  <a
                    href={item.href}
                    className="block rounded-lg px-3 py-2 font-medium text-[var(--c-3a3935)] transition hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)] hover:ring-1 hover:ring-[var(--sidebar-accent-border)]"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </a>
                  <a
                    href="/teachers?mode=training"
                    className="block rounded-lg px-3 py-2 font-medium text-[var(--c-3a3935)] transition hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)] hover:ring-1 hover:ring-[var(--sidebar-accent-border)]"
                    onClick={() => setIsOpen(false)}
                  >
                    Training
                  </a>
                  <a
                    href="/teachers?mode=teaching"
                    className="block rounded-lg px-3 py-2 font-medium text-[var(--c-3a3935)] transition hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)] hover:ring-1 hover:ring-[var(--sidebar-accent-border)]"
                    onClick={() => setIsOpen(false)}
                  >
                    Teaching
                  </a>
                </div>
              );
            }
            return (
              <a
                key={item.label}
                href={item.href}
                className="block rounded-lg px-3 py-2 font-medium text-[var(--c-3a3935)] transition hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)] hover:ring-1 hover:ring-[var(--sidebar-accent-border)]"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
        {user ? (
          <div className="mt-4 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4 text-xs text-[var(--c-7a776f)]">
            <p className="mt-2 text-sm font-semibold text-[var(--c-1f1f1d)]">
              {displayName}
            </p>
            <p className="mt-1 text-xs text-[var(--c-9a9892)]">
              {accountInfo?.email ?? `${user.username}@simplymusic.com`}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
              {roleBadge ? (
                <span className="rounded-full border border-[var(--c-e5e3dd)] px-2 py-1">
                  {roleBadge}
                </span>
              ) : null}
              <span className="rounded-full border border-[var(--c-e5e3dd)] px-2 py-1">
                {accountInfo?.status ?? 'Active'}
              </span>
              <span className="rounded-full border border-[var(--c-e5e3dd)] px-2 py-1">
                Last login:{' '}
                {accountInfo?.lastLogin
                  ? new Date(accountInfo.lastLogin).toLocaleDateString()
                  : 'Today'}
              </span>
            </div>
            <button
              onClick={openAccountModal}
              className="mt-4 w-full rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--c-ffffff)] px-4 py-2.5 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)]"
            >
              Account Details
            </button>
            <div className="mt-4 border-t border-[var(--c-ecebe7)] pt-3 text-[10px] uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
              Account
            </div>
          </div>
        ) : null}
        {role === 'company' ? (
          <div className="mt-4 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-4 text-xs text-[var(--c-7a776f)]">
            <button
              onClick={() => setIsTeacherModalOpen(true)}
              className="w-full rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-4 py-2.5 text-xs uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)] transition hover:brightness-110"
            >
              Browse
            </button>
            <div className="mt-4 space-y-2">
              {recentThree.length === 0 ? (
                <div className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-[11px] text-[var(--c-6f6c65)]">
                  No recent teachers yet. Open browse to pick one.
                </div>
              ) : (
                recentThree.map((teacher, index) => {
                  const isSelected = selectedTeacher?.id === teacher.id;
                  return (
                    <button
                      key={teacher.id}
                      onClick={() =>
                        isSelected
                          ? handleTeacherClear()
                          : handleTeacherChoice(teacher)
                      }
                      className={`flex w-full items-center rounded-xl border px-3 py-2 text-left transition min-h-[72px] ${
                        isSelected
                          ? 'border-[var(--sidebar-selected-border)] bg-[var(--sidebar-selected-bg)] shadow-sm'
                          : 'border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] hover:border-[var(--sidebar-accent-border)]'
                      }`}
                    >
                      <div className="flex w-full items-center justify-between gap-2">
                        <div>
                          <p
                            className={`text-sm font-semibold ${
                              isSelected
                                ? 'text-[var(--sidebar-selected-text)]'
                                : 'text-[var(--c-1f1f1d)]'
                            }`}
                          >
                            {teacher.name}
                          </p>
                          <p
                            className={`text-[10px] uppercase tracking-[0.2em] ${
                              isSelected
                                ? 'text-[var(--sidebar-selected-text)]/80'
                                : 'text-[var(--c-6f6c65)]'
                            }`}
                          >
                            {index === 0 ? 'Last used' : 'Recent'}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${
                            isSelected
                              ? 'bg-[var(--sidebar-selected-bg)] text-[var(--sidebar-selected-text)] border-[var(--sidebar-selected-border)]'
                              : 'border border-[var(--c-e5e3dd)] text-[var(--c-6f6c65)]'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Select'}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            <div className="mt-4 border-t border-[var(--c-ecebe7)] pt-3 text-[10px] uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
              Choose A Teacher
            </div>
          </div>
        ) : null}
        {effectiveRole === 'company' ? null : null}
        {role === 'company' ? (
          <div className="mt-4 rounded-xl border border-[var(--c-ecebe7)] bg-[color:var(--c-ffffff)]/80 p-4 text-xs text-[var(--c-7a776f)]">
            <div className="mt-3 flex flex-col gap-2">
              {(['company', 'teacher', 'student'] as UserRole[]).map(option => (
                <button
                  key={option}
                  onClick={() => handleViewRoleChange(option)}
                  className={`rounded-full px-4 py-2.5 text-xs uppercase tracking-[0.2em] transition ${
                    effectiveRole === option
                      ? 'bg-[var(--sidebar-selected-bg)] text-[var(--sidebar-selected-text)] border-[var(--sidebar-selected-border)]'
                      : 'border border-[var(--sidebar-accent-border)] text-[var(--c-6f6c65)] hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)]'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="mt-4 border-t border-[var(--c-ecebe7)] pt-3 text-[10px] uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
              View As
            </div>
          </div>
        ) : null}
        {role === 'teacher' ? (
          <div className="mt-4 rounded-xl border border-[var(--c-ecebe7)] bg-[color:var(--c-ffffff)]/80 p-4 text-xs text-[var(--c-7a776f)]">
            <div className="mt-3 flex flex-col gap-2">
              {(['teacher', 'student'] as UserRole[]).map(option => (
                <button
                  key={option}
                  onClick={() => handleViewRoleChange(option)}
                  className={`rounded-full px-4 py-2.5 text-xs uppercase tracking-[0.2em] transition ${
                    effectiveRole === option
                      ? 'bg-[var(--sidebar-selected-bg)] text-[var(--sidebar-selected-text)] border-[var(--sidebar-selected-border)]'
                      : 'border border-[var(--sidebar-accent-border)] text-[var(--c-6f6c65)] hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)]'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="mt-4 border-t border-[var(--c-ecebe7)] pt-3 text-[10px] uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
              View As
            </div>
          </div>
        ) : null}
        <div className="mt-4 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-4 text-xs text-[var(--c-7a776f)]">
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => handleThemeChange('light')}
              className={`rounded-full px-3 py-2 text-[10px] uppercase tracking-[0.2em] transition ${
                theme === 'light'
                  ? 'bg-[var(--sidebar-selected-bg)] text-[var(--sidebar-selected-text)] border-[var(--sidebar-selected-border)]'
                  : 'border border-[var(--sidebar-accent-border)] text-[var(--c-6f6c65)] hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)]'
              }`}
            >
              Light
            </button>
            <button
              onClick={() => handleThemeChange('dark')}
              className={`rounded-full px-3 py-2 text-[10px] uppercase tracking-[0.2em] transition ${
                theme === 'dark'
                  ? 'bg-[var(--sidebar-selected-bg)] text-[var(--sidebar-selected-text)] border-[var(--sidebar-selected-border)]'
                  : 'border border-[var(--sidebar-accent-border)] text-[var(--c-6f6c65)] hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)]'
              }`}
            >
              Dark
            </button>
          </div>
          <div className="mt-4 border-t border-[var(--c-ecebe7)] pt-3 text-[10px] uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
            Theme
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-6 w-full rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--c-ffffff)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)]"
        >
          Log Out
        </button>
      </aside>

      {role === 'company' ? (
        <div
          className={`fixed inset-0 z-[60] ${
            isTeacherModalOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
          } transition-opacity`}
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsTeacherModalOpen(false)}
          />
          <div className="absolute inset-x-4 top-16 mx-auto max-w-2xl rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                  Teacher Directory
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                  Choose A Teacher
                </h2>
                <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                  Search by name, region, status, or email to switch context.
                </p>
              </div>
              <button
                onClick={() => setIsTeacherModalOpen(false)}
                className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-fafafa)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
              >
                Close
              </button>
            </div>

            <div className="mt-6">
              <input
                value={teacherSearch}
                onChange={event => setTeacherSearch(event.target.value)}
                list="teacher-directory"
                placeholder="Search teachers..."
                className="w-full rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3 text-sm text-[var(--c-1f1f1d)] outline-none focus:border-[var(--c-c8102e)]"
              />
              <datalist id="teacher-directory">
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.name} />
                ))}
              </datalist>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {modalTeachers.length === 0 ? (
                <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-6 text-sm text-[var(--c-6f6c65)] sm:col-span-2">
                  {teacherSearch
                    ? 'No matches yet. Try a different search.'
                    : 'No recent teachers yet. Start by searching the directory.'}
                </div>
              ) : (
                modalTeachers.map(teacher => {
                  const isSelected = selectedTeacher?.id === teacher.id;
                  return (
                    <button
                      key={teacher.id}
                      onClick={() =>
                        handleTeacherChoice({
                          id: teacher.id,
                          name: teacher.name,
                          username: teacher.username,
                        })
                      }
                      className={`rounded-2xl border px-4 py-4 text-left transition ${
                        isSelected
                          ? 'border-[var(--sidebar-selected-border)] bg-[var(--sidebar-selected-bg)] shadow-sm'
                          : 'border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] hover:border-[var(--c-c8102e)]/40'
                      }`}
                    >
                      <p
                        className={`text-sm font-semibold ${
                          isSelected
                            ? 'text-[var(--sidebar-selected-text)]'
                            : 'text-[var(--c-1f1f1d)]'
                        }`}
                      >
                        {teacher.name}
                      </p>
                      <p
                        className={`mt-2 text-[10px] uppercase tracking-[0.2em] ${
                          isSelected
                            ? 'text-[var(--sidebar-selected-text)]/80'
                            : 'text-[var(--c-6f6c65)]'
                        }`}
                      >
                        {isSelected ? 'Last used' : 'Recent'}
                      </p>
                      <div className="mt-3">
                        <span
                          className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em] ${
                            isSelected
                              ? 'border border-white/25 bg-white/10 text-[var(--sidebar-selected-text)]'
                              : 'border border-[var(--c-e5e3dd)] text-[var(--c-6f6c65)]'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Select'}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : null}

      {role === 'teacher' ? (
        <div
          className={`fixed inset-0 z-[60] ${
            isStudentModalOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
          } transition-opacity`}
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsStudentModalOpen(false)}
          />
          <div className="absolute inset-x-4 top-16 mx-auto max-w-2xl rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                  Student Directory
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                  Choose A Student
                </h2>
                <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                  Search by name or email to set the student for view-as.
                </p>
              </div>
              <button
                onClick={() => setIsStudentModalOpen(false)}
                className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-fafafa)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
              >
                Close
              </button>
            </div>

            <div className="mt-6">
              <input
                value={studentSearch}
                onChange={event => setStudentSearch(event.target.value)}
                list="student-directory"
                placeholder="Search students..."
                className="w-full rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3 text-sm text-[var(--c-1f1f1d)] outline-none focus:border-[var(--c-c8102e)]"
              />
              <datalist id="student-directory">
                {students.map(student => (
                  <option key={student.id} value={student.name} />
                ))}
              </datalist>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {modalStudents.length === 0 ? (
                <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-6 text-sm text-[var(--c-6f6c65)] sm:col-span-2">
                  {studentSearch
                    ? 'No matches yet. Try a different search.'
                    : 'No recent students yet. Start by searching your roster.'}
                </div>
              ) : (
                modalStudents.map(student => {
                  const isSelected = selectedStudent?.id === student.id;
                  return (
                    <button
                      key={student.id}
                      onClick={() =>
                        handleStudentChoice({
                          id: student.id,
                          name: student.name,
                          email: student.email,
                        })
                      }
                      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                        isSelected
                          ? 'border-[var(--sidebar-selected-border)] bg-[var(--sidebar-selected-bg)]'
                          : 'border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] hover:border-[var(--sidebar-accent-border)]'
                      }`}
                    >
                      <div>
                        <p
                          className={`text-sm font-semibold ${
                            isSelected
                              ? 'text-[var(--sidebar-selected-text)]'
                              : 'text-[var(--c-1f1f1d)]'
                          }`}
                        >
                          {student.name}
                        </p>
                        <p
                          className={`text-[10px] uppercase tracking-[0.2em] ${
                            isSelected
                              ? 'text-[var(--sidebar-selected-text)]/80'
                              : 'text-[var(--c-6f6c65)]'
                          }`}
                        >
                          {student.label}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${
                          isSelected
                            ? 'border border-white/25 bg-white/10 text-[var(--sidebar-selected-text)]'
                            : 'border border-[var(--c-e5e3dd)] text-[var(--c-6f6c65)]'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Select'}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
