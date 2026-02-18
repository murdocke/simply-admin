'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AUTH_STORAGE_KEY,
  VIEW_ROLE_STORAGE_KEY,
  VIEW_TEACHER_STORAGE_KEY,
  VIEW_STUDENT_STORAGE_KEY,
  roleHome,
  type AuthUser,
} from '../../(admin)/components/auth';
import { THEME_STORAGE_KEY, normalizeTheme } from '@/app/components/theme';
import teachersData from '@/data/teachers.json';
import studiosData from '@/data/studios.json';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = (searchParams.get('role') ?? '').toLowerCase();
  const welcomeParam = searchParams.get('welcome') === '1';
  const welcomeEmail = searchParams.get('email') ?? '';
  const defaultEmail = welcomeParam ? '' : 'ella@simplymusic.com';
  const welcomeName = searchParams.get('name') ?? '';
  const displayName = welcomeName || (welcomeParam ? 'New Teacher' : 'Ella');
  const isTeacherRole = roleParam === 'teacher';
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [showDemo, setShowDemo] = useState(false);
  const [showWelcomePanel, setShowWelcomePanel] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState<'lookup' | 'verify' | 'code'>(
    'lookup',
  );
  const [lookupValue, setLookupValue] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<
    'authenticator' | 'email' | 'sms'
  >('authenticator');
  const [forgotStatus, setForgotStatus] = useState('');
  const [demoAccounts, setDemoAccounts] = useState<
    {
      username: string;
      role: string;
      name: string;
      studio?: { name: string; isAdmin: boolean };
      autoLoginPassword?: string | null;
    }[]
  >([]);
  const [trainingDemo, setTrainingDemo] = useState<{
    username: string;
    role: string;
    name: string;
    autoLoginPassword?: string | null;
  } | null>(null);
  const groupedDemoAccounts = useMemo(
    () => [
      {
        key: 'company',
        label: 'Company Accounts',
        accounts: demoAccounts.filter(account => account.role === 'company'),
      },
      {
        key: 'studio',
        label: 'Studios',
        accounts: demoAccounts
          .filter(account => account.studio)
          .sort((a, b) =>
            (a.studio?.name ?? '').localeCompare(b.studio?.name ?? ''),
          ),
      },
      {
        key: 'teacher',
        label: 'Teachers',
        accounts: demoAccounts.filter(
          account => account.role === 'teacher' && !account.studio,
        ),
      },
      {
        key: 'training',
        label: 'Teachers In Training',
        accounts: trainingDemo ? [trainingDemo] : [],
      },
      {
        key: 'parent',
        label: 'Parents',
        accounts: demoAccounts.filter(account => account.role === 'parent'),
      },
      {
        key: 'student',
        label: 'Students',
        accounts: demoAccounts.filter(account => account.role === 'student'),
      },
    ],
    [demoAccounts, trainingDemo],
  );

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

  const resolveTeacherRoute = async (authUser: AuthUser) => {
    if (authUser.role !== 'teacher') return roleHome[authUser.role];
    try {
      const response = await fetch(
        `/api/account?username=${encodeURIComponent(
          authUser.username,
        )}&role=${encodeURIComponent(authUser.role)}`,
        { cache: 'no-store' },
      );
      if (!response.ok) return roleHome[authUser.role];
      const data = (await response.json()) as {
        account?: { status?: string | null };
      };
      const status = data.account?.status?.toLowerCase() ?? '';
      if (status === 'training') return '/ittp';
    } catch {
      // ignore
    }
    return roleHome[authUser.role];
  };

  useEffect(() => {
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AuthUser;
        if (parsed?.role) {
          resolveTeacherRoute(parsed).then(nextRoute => {
            router.replace(nextRoute);
          });
        }
      } catch {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
  }, [router]);

  useEffect(() => {
    if (welcomeParam) {
      try {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
        window.localStorage.removeItem(VIEW_ROLE_STORAGE_KEY);
        window.localStorage.removeItem(VIEW_TEACHER_STORAGE_KEY);
        window.localStorage.removeItem(VIEW_STUDENT_STORAGE_KEY);
      } catch {
        // ignore storage failures
      }
      setUser(welcomeEmail);
      setPass('');
      setShowDemo(false);
      setShowWelcomePanel(true);
      try {
        window.localStorage.setItem(
          'sm_teacher_welcome',
          JSON.stringify({ email: welcomeEmail, name: welcomeName }),
        );
      } catch {
        // ignore storage failures
      }
      return;
    }
    setUser(defaultEmail);
    setPass('');
    setShowWelcomePanel(false);
  }, [welcomeParam, welcomeEmail, welcomeName, defaultEmail]);

  useEffect(() => {
    if (roleParam === 'teacher' || roleParam === 'student') {
      document.documentElement.dataset.theme = 'light';
      return;
    }
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${THEME_STORAGE_KEY}=`))
      ?.split('=')[1];
    const nextTheme = normalizeTheme(cookieValue ?? null);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  }, [roleParam]);

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
      .then(async list => {
        const allowed = new Set([
          'neil',
          'brian',
          'jason',
          'nancy',
          'quinn',
          'kim',
          'jacksons',
          'kenzie',
          'keira',
        ]);
        const teachers = (teachersData.teachers as {
          id: string;
          username?: string;
          studioId?: string;
          studioRole?: string;
        }[]) ?? [];
        const studios = (studiosData.studios as { id: string; name: string }[]) ?? [];
        const studioById = new Map(studios.map(studio => [studio.id, studio]));
        const studioByUsername = new Map<
          string,
          { name: string; isAdmin: boolean }
        >();
        teachers.forEach(teacher => {
          if (!teacher.username || !teacher.studioId) return;
          const studio = studioById.get(teacher.studioId);
          if (!studio) return;
          studioByUsername.set(teacher.username.toLowerCase(), {
            name: studio.name,
            isAdmin: teacher.studioRole === 'Admin',
          });
        });
        const demoList = list
          .filter(account => allowed.has(account.username.toLowerCase()))
          .map(account => ({
            username: account.username,
            role: account.role,
            name: account.name ?? '',
            studio: studioByUsername.get(account.username.toLowerCase()),
            autoLoginPassword: 'Coffee@Sunrise@2026',
          }));
        setDemoAccounts(demoList);

        try {
          const teachersResponse = await fetch('/api/teachers', {
            cache: 'no-store',
          });
          if (!teachersResponse.ok) return;
          const teachersData = (await teachersResponse.json()) as {
            teachers?: { username?: string; name?: string; email?: string; status?: string; updatedAt?: string }[];
          };
          const trainingTeachers = (teachersData.teachers ?? []).filter(
            teacher => teacher.status === 'Training',
          );
          if (trainingTeachers.length === 0) return;
          const latestTraining = trainingTeachers.sort((a, b) => {
            const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            return bTime - aTime;
          })[0];
          const trainingPassword =
            (latestTraining as { password?: string }).password ?? '';
          const trainingAccount =
            list.find(
              account =>
                account.role === 'teacher' &&
                account.username?.toLowerCase() ===
                  (latestTraining.username ?? '').toLowerCase(),
            ) ??
            list.find(
              account =>
                account.role === 'teacher' &&
                account.email?.toLowerCase() ===
                  (latestTraining.email ?? '').toLowerCase(),
            );
          if (!trainingAccount) return;
          setTrainingDemo({
            username: trainingAccount.username,
            role: trainingAccount.role,
            name: trainingAccount.name ?? latestTraining.name ?? 'Training Teacher',
            autoLoginPassword: trainingPassword || null,
          });
        } catch {
          // ignore
        }
      })
      .catch(() => {
        setDemoAccounts([]);
        setTrainingDemo(null);
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
      const nextRoute = await resolveTeacherRoute(authUser);
      router.replace(nextRoute);
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
    <div className="min-h-screen flex items-center justify-center bg-white text-[var(--c-1f1f1d)] relative overflow-hidden [[data-theme=dark]_&]:bg-[var(--c-f7f7f5)] [[data-theme=dark]_&]:text-[var(--c-1f1f1d)]">
      <div className="absolute inset-0 z-0">
        {backgroundImages.map((src, index) => (
          <div
            key={src}
            className={`absolute left-1/2 top-1/2 hidden h-[520px] w-[520px] bg-contain bg-no-repeat transition-opacity duration-[2000ms] md:block ${
              showWelcomePanel
                ? '-translate-x-[calc(110%+100px)] -translate-y-[calc(100%+100px)]'
                : '-translate-x-[110%] -translate-y-[100%]'
            } ${
              index === bgIndex ? 'opacity-100' : 'opacity-0'
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
          error || showDemo || showWelcomePanel ? 'max-w-5xl' : 'max-w-md'
        }`}
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div
            className="relative w-full rounded-2xl border border-[var(--c-ecebe7)] bg-white/70 backdrop-blur-md p-8 shadow-sm select-none [[data-theme=dark]_&]:bg-[var(--c-efece6)]/90 [[data-theme=dark]_&]:border-[var(--c-e5e3dd)]"
            style={{ maxWidth: 460 }}
          >
            {!showWelcomePanel ? (
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
                className="absolute right-4 top-4 rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-fcfcfb)] p-2 text-[var(--c-6f6c65)] shadow-sm transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)] [[data-theme=dark]_&]:bg-[var(--c-f1f1ef)] [[data-theme=dark]_&]:border-[var(--c-ecebe7)]"
                aria-label="Demo accounts"
                title="Demo accounts"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21a8 8 0 0 0-16 0" />
                  <circle cx="12" cy="8" r="4" />
                </svg>
              </button>
            ) : null}
            <div className="mb-6 flex items-center justify-center gap-3">
              <img
                src="https://simplymusic.com/wp-content/uploads/2024/02/simply-music-logo.svg"
                alt="Simply Music"
                className="h-12 w-12"
                style={{ borderRadius: 12 }}
              />
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)] [[data-theme=dark]_&]:text-[var(--c-7a776f)]">
                  Login
                </p>
                <h1 className="text-xl font-semibold [[data-theme=dark]_&]:text-[var(--c-1f1f1d)]">
                  Simply Music
                </h1>
              </div>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                handleLogin();
              }}
              autoComplete="off"
            >
              <input
                className="w-full mb-3 px-4 py-2 text-base rounded-lg border border-[var(--c-e5e3dd)] bg-white/70 backdrop-blur-md outline-none focus:border-[var(--c-c8102e)] [[data-theme=dark]_&]:bg-[var(--c-f1f1ef)] [[data-theme=dark]_&]:border-[var(--c-ecebe7)] [[data-theme=dark]_&]:text-[var(--c-1f1f1d)]"
                placeholder="Username"
                name="sm-username"
                autoComplete="off"
                value={user}
                onChange={e => setUser(e.target.value)}
              />

              <div className="relative mb-5">
                <input
                  className="w-full px-4 py-2 pr-12 text-base rounded-lg border border-[var(--c-e5e3dd)] bg-white/70 backdrop-blur-md outline-none focus:border-[var(--c-c8102e)] [[data-theme=dark]_&]:bg-[var(--c-f1f1ef)] [[data-theme=dark]_&]:border-[var(--c-ecebe7)] [[data-theme=dark]_&]:text-[var(--c-1f1f1d)]"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  name="sm-password"
                  autoComplete="new-password"
                  value={pass}
                  onChange={e => setPass(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(current => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--c-6f6c65)] transition hover:text-[var(--c-1f1f1d)] [[data-theme=dark]_&]:text-[var(--c-7a776f)]"
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
                <div className="mb-4 rounded-lg border border-[var(--c-f2d7db)] bg-[var(--c-fff5f6)] px-3 py-2 text-sm text-[var(--c-8f2f3b)] [[data-theme=dark]_&]:bg-[var(--c-f2d7db)]/30">
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
                onClick={() => {
                  setShowForgot(true);
                  setForgotStep('lookup');
                  setForgotStatus('');
                  setLookupValue('');
                  setDeliveryMethod('authenticator');
                }}
                className="mt-3 w-full rounded-lg border border-[var(--c-e5e3dd)] bg-white px-4 py-2 text-sm font-medium text-[var(--c-2b2b27)] transition hover:border-[color:var(--c-c8102e)]/40 [[data-theme=dark]_&]:bg-[var(--c-f1f1ef)] [[data-theme=dark]_&]:border-[var(--c-ecebe7)] [[data-theme=dark]_&]:text-[var(--c-3a3935)]"
              >
                Forgot Password
              </button>

              {isTeacherRole ? (
                <div className="mt-6 rounded-2xl border border-[var(--c-e5e3dd)] bg-[var(--c-fcfcfb)] p-5 [[data-theme=dark]_&]:bg-[var(--c-f1f1ef)] [[data-theme=dark]_&]:border-[var(--c-ecebe7)]">
                  <p className="text-base font-semibold text-[var(--c-1f1f1d)]">
                    Inquire About Teaching
                  </p>
                  <p className="mt-2 text-sm text-[var(--c-6f6c65)] [[data-theme=dark]_&]:text-[var(--c-7a776f)]">
                    Curious about becoming a Simply Music Teacher?
                    <br />
                    We can help you explore the next steps.
                  </p>
                  <a
                    href="/embed/lead-form"
                    className="mt-4 inline-flex items-center justify-center rounded-lg border border-[var(--c-e5e3dd)] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-c8102e)] transition hover:border-[color:var(--c-c8102e)]/40 [[data-theme=dark]_&]:bg-[var(--c-f1f1ef)] [[data-theme=dark]_&]:border-[var(--c-ecebe7)]"
                  >
                    Learn More
                  </a>
                </div>
              ) : roleParam === 'student' ? (
                <div className="mt-6 rounded-2xl border border-[var(--c-e5e3dd)] bg-[var(--c-fcfcfb)] p-5 [[data-theme=dark]_&]:bg-[var(--c-f1f1ef)] [[data-theme=dark]_&]:border-[var(--c-ecebe7)]">
                  <p className="text-base font-semibold text-[var(--c-1f1f1d)]">
                    Create An Account
                  </p>
                  <p className="mt-2 text-sm text-[var(--c-6f6c65)] [[data-theme=dark]_&]:text-[var(--c-7a776f)]">
                    New to Simply Music?
                    <br />
                    Create your account to get started.
                  </p>
                  <a
                    href="/student-registration"
                    className="mt-4 inline-flex items-center justify-center rounded-lg border border-[var(--c-e5e3dd)] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-c8102e)] transition hover:border-[color:var(--c-c8102e)]/40 [[data-theme=dark]_&]:bg-[var(--c-f1f1ef)] [[data-theme=dark]_&]:border-[var(--c-ecebe7)]"
                  >
                    Create Account
                  </a>
                </div>
              ) : null}
            </form>
          </div>

          {showWelcomePanel ? (
            <div className="w-full max-w-2xl select-none rounded-2xl border border-[var(--c-c8102e)] bg-[var(--c-c8102e)] p-6 shadow-sm">
              <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-white p-6 [[data-theme=dark]_&]:bg-white">
                <p className="text-sm uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                  Congratulations
                </p>
                <h2 className="mt-3 text-[34px] font-semibold text-[var(--c-1f1f1d)]">
                  Welcome to Simply Music!
                </h2>
                <p className="mt-3 text-xl font-semibold text-[var(--c-3a3935)]">
                  {displayName}, your Simply Music Teaching Journey Starts Now.
                  We are super excited to have you as part of the Teaching Team!
                </p>
                <p className="mt-2 text-lg font-semibold text-[var(--c-3a3935)]">
                  Log in to set your username, access your training hub, and
                  begin your curriculum roadmap.
                </p>
                <div className="mt-6 flex flex-col gap-4">
                  <div className="rounded-xl border border-[var(--c-ecebe7)] bg-white p-5 shadow-sm">
                    <p className="text-sm uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                      Next Steps
                    </p>
                    <p className="mt-2 text-base text-[var(--c-6f6c65)]">
                      Log in now to explore your dashboard, start your training,
                      and get comfortable with the flow — you’ll be teaching in
                      no time.
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--c-ecebe7)] bg-white p-5 shadow-sm">
                    <p className="text-sm uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                      Need Help?
                    </p>
                    <p className="mt-2 text-base text-[var(--c-6f6c65)]">
                      Our Training Team &amp; Coaches are standing by to help guide
                      you through your first training steps. You can always reach
                      out from your dashboard.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : showDemo ? (
            <div className="w-full max-w-2xl rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm [[data-theme=dark]_&]:bg-[var(--c-f1f1ef)]">
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
                  className="rounded-full border border-[var(--c-e5e3dd)] px-3 py-1 text-xs text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)] [[data-theme=dark]_&]:border-[var(--c-ecebe7)] [[data-theme=dark]_&]:text-[var(--c-7a776f)]"
                  title="Copy password"
                >
                  Coffee@Sunrise@2026
                </button>
              </div>
              <div className="mt-4 overflow-hidden rounded-xl border border-[var(--c-ecebe7)]">
                <div className="grid grid-cols-[32px_1.2fr_0.8fr_1.2fr] gap-2 bg-[var(--c-f7f7f5)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] [[data-theme=dark]_&]:bg-[var(--c-efece6)] [[data-theme=dark]_&]:text-[var(--c-7a776f)]">
                  <div />
                  <div>Username</div>
                  <div>Role</div>
                  <div>Name</div>
                </div>
                <div className="divide-y divide-[var(--c-ecebe7)]">
                  {demoAccounts.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-[var(--c-6f6c65)] [[data-theme=dark]_&]:text-[var(--c-7a776f)]">
                      No demo accounts found.
                    </div>
                  ) : (
                    groupedDemoAccounts.map(group => {
                      let lastStudio: string | null = null;
                      return (
                        <div key={group.key}>
                          <div className="bg-[var(--c-f7f7f5)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] [[data-theme=dark]_&]:bg-[var(--c-efece6)] [[data-theme=dark]_&]:text-[var(--c-7a776f)]">
                            {group.label}
                          </div>
                          {group.accounts.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-[var(--c-6f6c65)] [[data-theme=dark]_&]:text-[var(--c-7a776f)]">
                              No demo accounts available.
                            </div>
                          ) : (
                            group.accounts.map(account => {
                              const studioName = account.studio?.name ?? null;
                              const showStudioHeader =
                                group.key === 'studio' &&
                                studioName &&
                                studioName !== lastStudio;
                              if (showStudioHeader) lastStudio = studioName;
                              return (
                                <div key={`${account.username}-${account.role}`}>
                                  {showStudioHeader ? (
                                    <div className="bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-9a9892)] [[data-theme=dark]_&]:bg-[var(--c-f1f1ef)] [[data-theme=dark]_&]:text-[var(--c-7a776f)]">
                                      {studioName}
                                    </div>
                                  ) : null}
                                  <div
                                    className="grid cursor-pointer grid-cols-[32px_1.2fr_0.8fr_1.2fr] items-center gap-2 px-4 py-3 text-sm transition hover:bg-[var(--c-f1f0ec)] hover:shadow-sm [[data-theme=dark]_&]:hover:bg-[var(--c-efece6)]"
                                    onClick={() => {
                                      setUser(account.username);
                                      if (account.autoLoginPassword) {
                                        setPass(account.autoLoginPassword);
                                        handleLogin(
                                          account.username,
                                          account.autoLoginPassword,
                                        );
                                      } else {
                                        setPass('');
                                      }
                                    }}
                                  >
                                    <div className="flex items-center gap-1 text-[var(--c-6f6c65)]">
                                      {account.studio ? (
                                        <span
                                          className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--c-f7f7f5)]"
                                          title={`Studio: ${account.studio.name}`}
                                          aria-label={`Studio: ${account.studio.name}`}
                                        >
                                          <svg
                                            aria-hidden="true"
                                            viewBox="0 0 24 24"
                                            className="h-3 w-3"
                                            fill="currentColor"
                                          >
                                            <path d="M3 10.5 12 4l9 6.5v8.5a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
                                          </svg>
                                        </span>
                                      ) : null}
                                      {account.studio?.isAdmin ? (
                                        <span
                                          className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--c-f7f7f5)]"
                                          title="Studio Admin"
                                          aria-label="Studio Admin"
                                        >
                                          <svg
                                            aria-hidden="true"
                                            viewBox="0 0 24 24"
                                            className="h-3 w-3"
                                            fill="currentColor"
                                          >
                                            <path d="M12 2 3 5v6c0 5.25 3.75 9.75 9 11 5.25-1.25 9-5.75 9-11V5l-9-3Zm0 5a2 2 0 0 1 2 2v1.2a1.8 1.8 0 1 1-3.6 0V9a2 2 0 0 1 2-2Zm0 11.2a3.3 3.3 0 1 0 0-6.6 3.3 3.3 0 0 0 0 6.6Z" />
                                          </svg>
                                        </span>
                                      ) : null}
                                    </div>
                                    <div className="font-medium text-[var(--c-1f1f1d)]">
                                      {account.username}
                                    </div>
                                    <div className="text-[var(--c-6f6c65)]">
                                      {account.studio?.isAdmin ? 'studio' : account.role}
                                    </div>
                                    <div className="text-[var(--c-6f6c65)]">
                                      {account.name || '—'}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {showForgot ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
          <div className="w-full max-w-3xl rounded-3xl border border-[var(--c-ecebe7)] bg-white/70 backdrop-blur-md p-8 shadow-xl">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h2 className="text-xl font-semibold text-[var(--c-1f1f1d)]">
                  Forgot Password
                </h2>
                <p className="mt-1 text-base text-[var(--c-6f6c65)]">
                  Find your account and choose how to receive a verification code.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowForgot(false)}
                className="rounded-full bg-white p-2 text-[var(--c-6f6c65)] transition hover:text-[var(--c-1f1f1d)]"
                aria-label="Close"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            {forgotStep === 'lookup' ? (
              <div className="mt-6 grid gap-8 grid-cols-[1.2fr_0.8fr] items-start">
                <div>
                  <label className="text-sm uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                    Username, Email, or Phone
                  </label>
                  <input
                    className="mt-2 w-full rounded-lg border border-[var(--c-e5e3dd)] bg-white/70 backdrop-blur-md px-4 py-2 outline-none focus:border-[var(--c-c8102e)]"
                    placeholder="Enter your username, email, or phone"
                    value={lookupValue}
                    onChange={event => setLookupValue(event.target.value)}
                  />
                  <button
                    type="button"
                    className="mt-4 w-full rounded-lg bg-[var(--c-c8102e)] py-2.5 text-sm font-medium text-white shadow-sm transition hover:brightness-105"
                    onClick={() => {
                      if (!lookupValue.trim()) {
                        setForgotStatus('Please enter your account details.');
                        return;
                      }
                      setForgotStatus('');
                      setForgotStep('verify');
                    }}
                  >
                    Find Account
                  </button>

                  {isTeacherRole ? (
                    <div className="mt-6 rounded-2xl border border-[var(--c-e5e3dd)] bg-[var(--c-fcfcfb)] p-4">
                      <p className="text-base font-semibold text-[var(--c-1f1f1d)]">
                        Inquire About Teaching
                      </p>
                      <p className="mt-1 text-sm text-[var(--c-6f6c65)]">
                        Curious about becoming a Simply Music Teacher?
                        <br />
                        We can help you explore the next steps.
                      </p>
                      <a
                        href="/embed/lead-form"
                        className="mt-3 inline-flex items-center justify-center rounded-lg border border-[var(--c-e5e3dd)] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-c8102e)] transition hover:border-[color:var(--c-c8102e)]/40"
                      >
                        Learn More
                      </a>
                    </div>
                  ) : roleParam === 'student' ? (
                    <div className="mt-6 rounded-2xl border border-[var(--c-e5e3dd)] bg-[var(--c-fcfcfb)] p-4">
                      <p className="text-base font-semibold text-[var(--c-1f1f1d)]">
                        Create An Account
                      </p>
                      <p className="mt-1 text-sm text-[var(--c-6f6c65)]">
                        New to Simply Music?
                        <br />
                        Create your account to get started.
                      </p>
                      <a
                        href="/student-registration"
                        className="mt-3 inline-flex items-center justify-center rounded-lg border border-[var(--c-e5e3dd)] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-c8102e)] transition hover:border-[color:var(--c-c8102e)]/40"
                      >
                        Create Account
                      </a>
                    </div>
                  ) : null}
                </div>

                <div className="flex h-full flex-col items-center justify-between gap-6 rounded-2xl border border-[var(--c-e5e3dd)] bg-white p-6">
                  <div className="flex h-64 w-64 items-center justify-center rounded-2xl bg-[var(--c-fcfcfb)]">
                    <img
                      src="https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=https://simplymusic.com"
                      alt="Simply Music QR code"
                      width={256}
                      height={256}
                      className="h-64 w-64"
                    />
                  </div>
                  <p className="text-center text-sm text-[var(--c-6f6c65)]">
                    Login Faster with your device on the Simply Music Mobile App
                  </p>
                </div>
              </div>
            ) : null}

            {forgotStep === 'verify' ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-4">
                  <p className="text-sm text-[var(--c-6f6c65)]">
                    We found an account for <span className="font-medium">{lookupValue}</span>.
                    Scan the QR code in the Simply Music app to confirm &ldquo;Is this you?&rdquo;
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-[1fr,220px]">
                  <div className="grid gap-3">
                    {[
                      {
                        id: 'authenticator',
                        title: 'Use authenticator app',
                        body: 'Approve the prompt in your app for instant access.',
                      },
                      {
                        id: 'email',
                        title: 'Email a code',
                        body: 'Send a one-time code to the email on file.',
                      },
                      {
                        id: 'sms',
                        title: 'Text a code',
                        body: 'Send a one-time code to the phone on file.',
                      },
                    ].map(option => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() =>
                          setDeliveryMethod(option.id as typeof deliveryMethod)
                        }
                        className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                          deliveryMethod === option.id
                            ? 'border-[var(--c-c8102e)] bg-[var(--c-fff5f6)]'
                            : 'border-[var(--c-e5e3dd)] bg-white hover:border-[var(--c-c8102e)]/40'
                        }`}
                      >
                        <p className="font-semibold text-[var(--c-1f1f1d)]">
                          {option.title}
                        </p>
                        <p className="mt-1 text-[var(--c-6f6c65)]">{option.body}</p>
                      </button>
                    ))}
                  </div>

                  <div className="flex h-full flex-col items-center justify-between gap-3 rounded-xl border border-[var(--c-e5e3dd)] bg-white p-4">
                    <div className="flex h-36 w-36 items-center justify-center rounded-lg border border-dashed border-[var(--c-e5e3dd)] bg-[var(--c-fcfcfb)] text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                      QR Code
                    </div>
                    <p className="text-center text-xs text-[var(--c-6f6c65)]">
                      Open the Simply Music app and approve the login request.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="w-full rounded-lg bg-[var(--c-c8102e)] py-2.5 text-sm font-medium text-white shadow-sm transition hover:brightness-105"
                  onClick={() => {
                    setForgotStep('code');
                    setForgotStatus(
                      deliveryMethod === 'authenticator'
                        ? 'Enter the code from your authenticator app.'
                        : 'We sent a code to your contact on file.',
                    );
                  }}
                >
                  Continue
                </button>

                <button
                  type="button"
                  className="w-full rounded-lg border border-[var(--c-e5e3dd)] bg-[var(--c-fcfcfb)] py-2 text-sm text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
                  onClick={() => setDeliveryMethod('email')}
                >
                  Try another way
                </button>
              </div>
            ) : null}

            {forgotStep === 'code' ? (
              <div className="mt-5">
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                  Verification Code
                </label>
                <input
                  className="mt-2 w-full rounded-lg border border-[var(--c-e5e3dd)] bg-white/70 backdrop-blur-md px-4 py-2 outline-none focus:border-[var(--c-c8102e)]"
                  placeholder="Enter the 6-digit code"
                />
                <button
                  type="button"
                  className="mt-4 w-full rounded-lg bg-[var(--c-c8102e)] py-2.5 text-sm font-medium text-white shadow-sm transition hover:brightness-105"
                  onClick={() => {
                    setForgotStatus(
                      'Verification submitted. We will wire up Plivo/Mailgun next.',
                    );
                  }}
                >
                  Verify Code
                </button>
              </div>
            ) : null}

            {forgotStatus ? (
              <div className="mt-4 rounded-lg border border-[var(--c-e5e3dd)] bg-[var(--c-f7f7f5)] px-3 py-2 text-sm text-[var(--c-6f6c65)]">
                {forgotStatus}
              </div>
            ) : null}


          </div>
        </div>
      ) : null}
    </div>
  );
}
