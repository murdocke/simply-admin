'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AUTH_STORAGE_KEY,
  roleHome,
  type AuthUser,
} from '../../(admin)/components/auth';

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [showDemo, setShowDemo] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  const [demoAccounts, setDemoAccounts] = useState<
    { username: string; role: string; name: string }[]
  >([]);

  const backgroundImages = useMemo(
    () => [
      'https://simplymusic.com/wp-content/uploads/2024/07/Teacher-P-Banner.png',
      'https://simplymusic.com/wp-content/uploads/2024/07/two-person-playing-piano-on-ground.png',
      'https://simplymusic.com/wp-content/uploads/2024/07/self-study-banner.png',
      'https://simplymusic.com/wp-content/uploads/2024/07/SP-Banner.png',
      'https://simplymusic.com/wp-content/uploads/2024/04/locate-page-image.webp',
    ],
    [],
  );

  useEffect(() => {
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AuthUser;
        if (parsed?.role) {
          router.replace(roleHome[parsed.role]);
        }
      } catch {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
  }, [router]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setBgIndex(prev => (prev + 1) % backgroundImages.length);
    }, 12000);
    return () => window.clearInterval(interval);
  }, [backgroundImages.length]);

  useEffect(() => {
    void fetch('/api/accounts')
      .then(async response => {
        if (!response.ok) return [];
        const data = (await response.json()) as {
          accounts?: { username: string; role: string; name?: string }[];
        };
        return data.accounts ?? [];
      })
      .then(list => {
        const allowed = new Set(['neil', 'brian', 'quinn']);
        setDemoAccounts(
          list
            .filter(account => allowed.has(account.username.toLowerCase()))
            .map(account => ({
              username: account.username,
              role: account.role,
              name: account.name ?? '',
            })),
        );
      })
      .catch(() => {
        setDemoAccounts([]);
      });
  }, []);

  const handleLogin = async (nextUser?: string, nextPass?: string) => {
    const normalized = (nextUser ?? user).trim().toLowerCase();
    const password = (nextPass ?? pass).trim();

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: normalized, password }),
      });
      const data = (await response.json()) as {
        account?: AuthUser;
        error?: string;
      };
      if (!response.ok || !data.account) {
        throw new Error(data.error ?? 'Invalid username or password.');
      }

      const authUser = data.account;
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
      window.localStorage.setItem('sm_last_login_at', new Date().toISOString());
      void fetch('/api/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: authUser.username, role: authUser.role }),
      });
      router.replace(roleHome[authUser.role]);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Invalid username or password.',
      );
      setShowDemo(true);
      setUser('');
      setPass('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--c-f7f7f5)] text-[var(--c-1f1f1d)] relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        {backgroundImages.map((src, index) => (
          <div
            key={src}
            className={`absolute left-1/2 top-1/2 hidden h-[520px] w-[520px] -translate-x-[98%] -translate-y-[92%] bg-contain bg-no-repeat transition-opacity duration-[2000ms] md:block ${
              index === bgIndex ? 'opacity-70' : 'opacity-0'
            }`}
            style={{
              backgroundImage: `url(${src})`,
              backgroundPosition: 'center',
            }}
          />
        ))}
      </div>
      <div
        className={`relative z-10 w-full ${
          error || showDemo ? 'max-w-4xl' : 'max-w-sm'
        }`}
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[var(--c-c8102e)] text-white flex items-center justify-center font-semibold">
            SM
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
              Admin
            </p>
            <h1 className="text-xl font-semibold">Simply Music</h1>
          </div>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                handleLogin();
              }}
            >
              <input
                className="w-full mb-3 px-4 py-2 rounded-lg border border-[var(--c-e5e3dd)] bg-[var(--c-fcfcfb)] outline-none focus:border-[var(--c-c8102e)]"
                placeholder="Username"
                value={user}
                onChange={e => setUser(e.target.value)}
              />

              <div className="relative mb-5">
                <input
                  className="w-full px-4 py-2 pr-12 rounded-lg border border-[var(--c-e5e3dd)] bg-[var(--c-fcfcfb)] outline-none focus:border-[var(--c-c8102e)]"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={pass}
                  onChange={e => setPass(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(current => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--c-6f6c65)] transition hover:text-[var(--c-1f1f1d)]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                      <path d="M9.5 5.1A10.9 10.9 0 0 1 12 4c5 0 9.3 3.1 11 7.5a11.3 11.3 0 0 1-4.2 5.1" />
                      <path d="M6.1 6.1A11.1 11.1 0 0 0 1 11.5C2.7 15.9 7 19 12 19a10.9 10.9 0 0 0 3.4-.6" />
                    </svg>
                  ) : (
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
                      <circle cx="12" cy="12" r="3.2" />
                    </svg>
                  )}
                </button>
              </div>

              {error ? (
                <div className="mb-4 rounded-lg border border-[var(--c-f2d7db)] bg-[var(--c-fff5f6)] px-3 py-2 text-sm text-[var(--c-8f2f3b)]">
                  <p className="uppercase tracking-[0.2em]">{error}</p>
                </div>
              ) : null}

              <button
                className="w-full bg-[var(--c-c8102e)] text-white py-2.5 rounded-lg font-medium shadow-sm hover:brightness-105 transition"
                type="submit"
              >
                Sign In
              </button>

              <button
                type="button"
                onClick={() =>
                  setShowDemo(current => {
                    const next = !current;
                    if (!next) {
                      setError('');
                      setUser('');
                      setPass('');
                    }
                    return next;
                  })
                }
                className="mt-3 w-full rounded-lg border border-[var(--c-e5e3dd)] bg-[var(--c-fcfcfb)] py-2 text-sm text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
              >
                Demo Accounts
              </button>
            </form>
          </div>

          {showDemo ? (
            <div className="w-full max-w-lg rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-[var(--c-1f1f1d)]">
                    Available Logins
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const text = 'Coffee@Sunrise@2026';
                    const fallbackCopy = () => {
                      const textarea = document.createElement('textarea');
                      textarea.value = text;
                      textarea.setAttribute('readonly', '');
                      textarea.style.position = 'fixed';
                      textarea.style.opacity = '0';
                      document.body.appendChild(textarea);
                      textarea.select();
                      try {
                        document.execCommand('copy');
                      } catch {
                        // ignore
                      }
                      document.body.removeChild(textarea);
                    };

                    if (navigator.clipboard?.writeText) {
                      navigator.clipboard.writeText(text).catch(() => {
                        fallbackCopy();
                      });
                      return;
                    }
                    fallbackCopy();
                  }}
                  className="rounded-full border border-[var(--c-e5e3dd)] px-3 py-1 text-xs text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
                  title="Copy password"
                >
                  Coffee@Sunrise@2026
                </button>
              </div>
              <div className="mt-4 overflow-hidden rounded-xl border border-[var(--c-ecebe7)]">
                <div className="grid grid-cols-3 gap-2 bg-[var(--c-f7f7f5)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  <div>Username</div>
                  <div>Role</div>
                  <div>Name</div>
                </div>
                <div className="divide-y divide-[var(--c-ecebe7)]">
                  {demoAccounts.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-[var(--c-6f6c65)]">
                      No demo accounts found.
                    </div>
                  ) : (
                    demoAccounts.map(account => (
                      <div
                        key={`${account.username}-${account.role}`}
                        className="grid cursor-pointer grid-cols-3 gap-2 px-4 py-3 text-sm transition hover:bg-[var(--c-f1f0ec)] hover:shadow-sm"
                        onClick={() => {
                          setUser(account.username);
                          setPass('Coffee@Sunrise@2026');
                          handleLogin(account.username, 'Coffee@Sunrise@2026');
                        }}
                      >
                        <div className="font-medium text-[var(--c-1f1f1d)]">
                          {account.username}
                        </div>
                        <div className="text-[var(--c-6f6c65)]">
                          {account.role}
                        </div>
                        <div className="text-[var(--c-6f6c65)]">
                          {account.name || '—'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
