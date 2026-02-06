'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AUTH_STORAGE_KEY, roleHome, type AuthUser } from '../../(admin)/components/auth';

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [bgIndex, setBgIndex] = useState(0);

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

  const handleLogin = () => {
    const normalized = user.trim().toLowerCase();
    const password = pass.trim();

    const users: Record<string, AuthUser> = {
      neil: { username: 'neil', role: 'company' },
      brian: { username: 'brian', role: 'teacher' },
      quinn: { username: 'quinn', role: 'student' },
    };

    if (password !== '123456' || !users[normalized]) {
      setError('Invalid username or password.');
      setUser('');
      setPass('');
      return;
    }

    const authUser = users[normalized];
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
    void fetch('/api/account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: authUser.username, role: authUser.role }),
    });
    router.replace(roleHome[authUser.role]);
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
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-8 shadow-sm">
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

          <input
            className="w-full mb-5 px-4 py-2 rounded-lg border border-[var(--c-e5e3dd)] bg-[var(--c-fcfcfb)] outline-none focus:border-[var(--c-c8102e)]"
            type="password"
            placeholder="Password"
            value={pass}
            onChange={e => setPass(e.target.value)}
          />

        {error ? (
          <div className="mb-4 rounded-lg border border-[var(--c-f2d7db)] bg-[var(--c-fff5f6)] px-3 py-2 text-sm text-[var(--c-8f2f3b)]">
            <p className="uppercase tracking-[0.2em]">{error}</p>
            <div className="mt-2 text-sm text-[color:var(--c-8f2f3b)]/80">
              <p>Demo users:</p>
              <p>
                <span className="font-semibold">neil</span> — company
              </p>
              <p>
                <span className="font-semibold">brian</span> — teacher
              </p>
              <p>
                <span className="font-semibold">quinn</span> — student
              </p>
              <p>
                Password: <span className="font-semibold">123456</span>
              </p>
            </div>
          </div>
        ) : null}

          <button
            className="w-full bg-[var(--c-c8102e)] text-white py-2.5 rounded-lg font-medium shadow-sm hover:brightness-105 transition"
            type="submit"
          >
            Sign In
          </button>

        </form>
      </div>
    </div>
  );
}
