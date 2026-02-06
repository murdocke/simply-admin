'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  AUTH_STORAGE_KEY,
  VIEW_TEACHER_STORAGE_KEY,
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

type SelectedTeacher = {
  id: string;
  name: string;
  username: string;
};

const RECENT_TEACHERS_KEY = 'sm_recent_teachers';
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
  const [accountInfo, setAccountInfo] = useState<{
    name: string;
    email: string;
    status: string;
    lastLogin: string | null;
  } | null>(null);
  const recentTeachersKey = useMemo(() => {
    if (!user?.username) return RECENT_TEACHERS_KEY;
    return `${RECENT_TEACHERS_KEY}:${user.username}`;
  }, [user?.username]);
  const viewTeacherKey = useMemo(() => {
    if (!user?.username) return VIEW_TEACHER_STORAGE_KEY;
    return `${VIEW_TEACHER_STORAGE_KEY}:${user.username}`;
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
      if (storedView && parsed.role === 'company') {
        setViewRole(storedView as UserRole);
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
    if (!role || !pathname) return;
    const allowed = allowedRoots[role];
    const isAllowed = allowed.some(root => pathname.startsWith(root));
    if (!isAllowed) {
      router.replace(roleHome[role]);
    }
  }, [pathname, role, router]);

  const effectiveRole = role === 'company' && viewRole ? viewRole : role;

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

  const accountDetailsHref = useMemo(() => {
    if (role === 'teacher') return '/teachers/students';
    if (role === 'student') return '/students/my-account';
    return '/company';
  }, [role]);

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
    if (role !== 'company') return;
    setViewRole(nextRole);
    window.localStorage.setItem(VIEW_ROLE_STORAGE_KEY, nextRole);
    router.replace(roleHome[nextRole]);
  };

  const toTeacherUsername = (teacher: TeacherRecord) => {
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
                onClick={() => router.push(accountDetailsHref)}
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
              onClick={() => router.push(accountDetailsHref)}
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
    </div>
  );
}
