'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AUTH_STORAGE_KEY,
  roleHome,
  type AuthUser,
} from '../../(admin)/components/auth';

const menuItems = [
  { label: 'Teachers', href: '/simplymusic/teachers' },
  { label: 'Students', href: '/simplymusic/students' },
  { label: 'Self-study', href: 'https://simplymusic.com/self-study/' },
  { label: 'Special Needs', href: 'https://simplymusic.com/special-needs/' },
  { label: 'Locate', href: '/simplymusic/locator' },
  { label: 'About', href: 'https://simplymusic.com/about/' },
  { label: 'Blog', href: 'https://simplymusic.com/blog/' },
];

type PublicTopNavProps = {
  activeHref: string;
};

export default function PublicTopNav({ activeHref }: PublicTopNavProps) {
  const [accountHref, setAccountHref] = useState('/login');
  const [accountLabel, setAccountLabel] = useState('Login');

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as AuthUser;
      if (parsed?.role && roleHome[parsed.role]) {
        setAccountHref(roleHome[parsed.role]);
        setAccountLabel('My Account');
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <header>
      <div
        style={{
          maxWidth: 1170,
          margin: '0 auto',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
        }}
      >
        <Link href="/simplymusic/teachers" aria-label="Simply Music">
          <img
            src="https://simplymusic.com/wp-content/uploads/2024/02/simply-music-logo.svg"
            alt="Simply Music"
            style={{ width: 70, height: 70, display: 'block', borderRadius: 12 }}
          />
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <nav style={{ display: 'flex', gap: 28, fontSize: 16 }}>
            {menuItems.map(item => {
              const isExternal = item.href.startsWith('http');
              const color = item.href === activeHref ? '#E31F26' : '#222';
              if (isExternal) {
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    style={{ color, textDecoration: 'none', fontWeight: 400 }}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {item.label}
                  </a>
                );
              }
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  style={{ color, textDecoration: 'none', fontWeight: 400 }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          {accountLabel === 'Login' ? (
            <details style={{ position: 'relative' }}>
              <summary
                style={{
                  listStyle: 'none',
                  background: '#E31F26',
                  color: '#fff',
                  padding: '10px 20px',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                Login
                <span style={{ fontSize: 10, lineHeight: 1 }}>▾</span>
              </summary>
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  minWidth: 200,
                  borderRadius: 12,
                  border: '1px solid #e5e3dd',
                  background: '#fff',
                  boxShadow: '0 14px 30px -18px rgba(0,0,0,0.35)',
                  padding: 8,
                  display: 'grid',
                  gap: 6,
                  zIndex: 10,
                }}
              >
                <Link
                  href="/login?role=teacher"
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    textDecoration: 'none',
                    color: '#1f1a17',
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  Teacher Login
                </Link>
                <Link
                  href="/login?role=student"
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    textDecoration: 'none',
                    color: '#1f1a17',
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  Student Login
                </Link>
              </div>
            </details>
          ) : (
            <Link
              href={accountHref}
              style={{
                background: '#E31F26',
                color: '#fff',
                padding: '10px 20px',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              {accountLabel}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
