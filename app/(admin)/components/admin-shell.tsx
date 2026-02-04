'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  AUTH_STORAGE_KEY,
  VIEW_ROLE_STORAGE_KEY,
  allowedRoots,
  navItems,
  roleHome,
  type AuthUser,
  type UserRole,
} from './auth';

type AdminShellProps = {
  children: React.ReactNode;
};

export default function AdminShell({ children }: AdminShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [viewRole, setViewRole] = useState<UserRole | null>(null);
  const [isReady, setIsReady] = useState(false);

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
        bg: 'bg-[#f3f6ec]',
        border: 'border-[#dfe6d2]',
      };
    }
    if (effectiveRole === 'student') {
      return {
        bg: 'bg-[#fff4ea]',
        border: 'border-[#f2dac5]',
      };
    }
    return {
      bg: 'bg-white',
      border: 'border-[#ecebe7]',
    };
  }, [effectiveRole]);

  const handleLogout = () => {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.localStorage.removeItem(VIEW_ROLE_STORAGE_KEY);
    router.replace('/login');
  };

  const handleViewRoleChange = (nextRole: UserRole) => {
    if (role !== 'company') return;
    setViewRole(nextRole);
    window.localStorage.setItem(VIEW_ROLE_STORAGE_KEY, nextRole);
  };

  if (!isReady) {
    return (
      <div className="min-h-screen bg-[#f7f7f5] text-[#1f1f1d] flex items-center justify-center">
        <div className="text-sm uppercase tracking-[0.3em] text-[#6f6c65]">
          Loading
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#1f1f1d]">
      <div className="flex min-h-screen">
        <aside
          className={`hidden w-72 border-r px-6 py-8 lg:block ${sidebarStyles.bg} ${sidebarStyles.border}`}
        >
          <div className="mb-10 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#c8102e] text-white flex items-center justify-center font-semibold">
              SM
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#9a9892]">
                Admin
              </p>
              <h2 className="text-xl font-semibold">Simply Music</h2>
            </div>
          </div>
          <nav className="space-y-2 text-sm">
            {items.map(item => (
              <a
                key={item.label}
                href={item.href}
                className="block rounded-lg px-3 py-2 font-medium text-[#3a3935] transition hover:bg-[#f1f1ef] hover:text-[#c8102e]"
              >
                {item.label}
              </a>
            ))}
          </nav>
          {role === 'company' ? (
            <div className="mt-10 rounded-xl border border-[#ecebe7] bg-[#fafafa] p-4 text-xs text-[#7a776f]">
              <p className="uppercase tracking-[0.2em]">View As</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(['company', 'teacher', 'student'] as UserRole[]).map(
                  option => (
                    <button
                      key={option}
                      onClick={() => handleViewRoleChange(option)}
                      className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] transition ${
                        effectiveRole === option
                          ? 'bg-[#c8102e] text-white'
                          : 'border border-[#e5e3dd] text-[#6f6c65] hover:text-[#c8102e]'
                      }`}
                    >
                      {option}
                    </button>
                  ),
                )}
              </div>
            </div>
          ) : null}
        <div className="mt-12 rounded-xl border border-[#ecebe7] bg-[#fafafa] p-4 text-xs text-[#7a776f]">
          <p className="uppercase tracking-[0.2em]">Clean, modern</p>
          <p className="mt-2 text-sm text-[#4a4740]">
            Simple, readable, calm.
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="mt-6 w-full rounded-full border border-[#ecebe7] bg-white px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#6f6c65] transition hover:border-[#c8102e]/40 hover:text-[#c8102e]"
        >
          Log Out
        </button>
      </aside>

        <div className="flex-1">
        <div className="flex items-center justify-between border-b border-[#ecebe7] bg-white/70 px-6 py-4 backdrop-blur lg:hidden">
            <button
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#c8102e] text-white shadow-sm transition hover:brightness-110"
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
          <div className="text-sm uppercase tracking-[0.2em] text-[#6f6c65]">
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
            <div className="h-10 w-10 rounded-lg bg-[#c8102e] text-white flex items-center justify-center font-semibold">
              SM
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#9a9892]">
                Admin
              </p>
              <h2 className="text-xl font-semibold">Simply Music</h2>
            </div>
          </div>
          <button
            className="rounded-full border border-[#ecebe7] bg-white px-3 py-2 text-xs uppercase tracking-[0.2em] text-[#6f6c65]"
            onClick={() => setIsOpen(false)}
          >
            Close
          </button>
        </div>
        <nav className="space-y-2 text-sm">
          {items.map(item => (
            <a
              key={item.label}
              href={item.href}
              className="block rounded-lg px-3 py-2 font-medium text-[#3a3935] transition hover:bg-[#f1f1ef] hover:text-[#c8102e]"
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </nav>
        {role === 'company' ? (
          <div className="mt-10 rounded-xl border border-[#ecebe7] bg-white/80 p-4 text-xs text-[#7a776f]">
            <p className="uppercase tracking-[0.2em]">View As</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(['company', 'teacher', 'student'] as UserRole[]).map(option => (
                <button
                  key={option}
                  onClick={() => handleViewRoleChange(option)}
                  className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] transition ${
                    effectiveRole === option
                      ? 'bg-[#c8102e] text-white'
                      : 'border border-[#e5e3dd] text-[#6f6c65] hover:text-[#c8102e]'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <div className="mt-12 rounded-xl border border-[#ecebe7] bg-white/80 p-4 text-xs text-[#7a776f]">
          <p className="uppercase tracking-[0.2em]">Clean, modern</p>
          <p className="mt-2 text-sm text-[#4a4740]">
            Simple, readable, calm.
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="mt-6 w-full rounded-full border border-[#ecebe7] bg-white px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#6f6c65] transition hover:border-[#c8102e]/40 hover:text-[#c8102e]"
        >
          Log Out
        </button>
      </aside>
    </div>
  );
}
