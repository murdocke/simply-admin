 'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AUTH_STORAGE_KEY, roleHome, type AuthUser } from '../../(admin)/components/auth';

const menuItems = [
  { label: 'Teachers', href: '/simplymusic/teachers', active: true },
  { label: 'Students', href: '/simplymusic/students' },
  { label: 'Self-study', href: 'https://simplymusic.com/self-study/' },
  { label: 'Special Needs', href: 'https://simplymusic.com/special-needs/' },
  { label: 'Locate', href: '/simplymusic/locator' },
  { label: 'About', href: 'https://simplymusic.com/about/' },
  { label: 'Blog', href: 'https://simplymusic.com/blog/' },
];

export default function TeachersPage() {
  const [accountHref, setAccountHref] = useState('/login');
  const [accountLabel, setAccountLabel] = useState('Login');

  useEffect(() => {
    document.title = 'Teachers | Simply Music';
  }, []);

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
      // Ignore invalid storage.
    }
  }, []);

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
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
                const color = item.active ? '#E31F26' : '#222';
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
      <section
        style={{
          maxWidth: 1170,
          margin: '0 auto',
          padding: '64px 24px 80px',
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 0.9fr) minmax(300px, 1.3fr)',
          alignItems: 'center',
          gap: 48,
        }}
      >
        <div style={{ position: 'relative' }}>
          <h1 style={{ margin: 0, fontSize: 56, fontWeight: 300, lineHeight: '1.15' }}>
            Being A Simply
            <br />
            Music Teacher
          </h1>
          <p style={{ marginTop: 36, fontSize: 24, lineHeight: '1.6', maxWidth: 420 }}>
            A revolutionary approach that
            <br />
            redefines music education
          </p>
          <img
            src="https://simplymusic.com/wp-content/uploads/2024/07/SM-teacher-bg.png"
            alt=""
            style={{
              position: 'absolute',
              left: 'calc(-1 * (100vw - 100%) / 2 + 346px)',
              bottom: -300,
              width: 'auto',
              maxWidth: 'none',
              pointerEvents: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <img
            src="https://simplymusic.com/wp-content/uploads/2024/07/Teacher-P-Banner.png"
            alt="Teacher Banner"
            style={{ width: '100%', maxWidth: 860 }}
          />
        </div>
      </section>

      <section
        style={{
          maxWidth: 1170,
          margin: '0 auto',
          padding: '215px 24px 80px',
          display: 'grid',
          gridTemplateColumns: 'minmax(300px, 1fr) minmax(320px, 1.1fr)',
          alignItems: 'center',
          gap: 48,
        }}
      >
        <div>
          <img
            src="/reference/teacher-training-card.png"
            alt="Teacher Training Program"
            style={{
              width: '100%',
              maxWidth: 520,
              borderRadius: 24,
              display: 'block',
            }}
          />
        </div>
        <div style={{ maxWidth: 560 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 46,
              fontWeight: 300,
              lineHeight: '1.3',
              whiteSpace: 'nowrap',
            }}
          >
            Teacher Training Program
          </h2>
          <p
            style={{
              marginTop: 18,
              fontSize: 26,
              lineHeight: '1.6',
              maxWidth: 560,
              whiteSpace: 'nowrap',
            }}
          >
            Join the global community of Simply Music Teachers
          </p>
          <p style={{ marginTop: 18, fontSize: 18, lineHeight: '1.8', maxWidth: 560 }}>
            Getting started as a Simply Music Teacher begins with successfully completing
            our Initial Teacher Training Program. We provide you with everything you need
            to get started and successfully teach our program. Our promise is to astound
            you with value that is far beyond the cost.
          </p>
          <p style={{ marginTop: 18, fontSize: 18, lineHeight: '1.8', maxWidth: 560 }}>
            Watch the video to hear Simply Music’s Founder, Neil Moore, talk about the
            Initial Teacher Training Program and what’s involved.
          </p>
        </div>
      </section>

      <section
        style={{
          maxWidth: 1170,
          margin: '0 auto',
          padding: '100px 24px 80px',
        }}
      >
        <div
          style={{
            background: '#9cad08',
            borderRadius: 18,
            display: 'grid',
            gridTemplateColumns: 'minmax(240px, 0.7fr) minmax(320px, 1.4fr) auto',
            alignItems: 'center',
            gap: 32,
            padding: '32px 36px 32px 260px',
            columnGap: 32,
            color: '#ffffff',
            position: 'relative',
            overflow: 'visible',
            minHeight: 250,
          }}
        >
          <img
            src="https://simplymusic.com/wp-content/uploads/2024/03/SM-Teacher-graphic.png"
            alt=""
            style={{
              position: 'absolute',
              left: -100,
              bottom: -88,
              width: 'auto',
              height: 'auto',
            }}
          />
          <div
            style={{
              marginLeft: 140,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: 28,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                textAlign: 'left',
              }}
            >
              Find out more about teaching Simply Music
            </h3>
            <a
              href="/embed/lead-form"
              style={{
                background: '#ffffff',
                color: '#6f7a12',
                borderRadius: 12,
                padding: '10px 16px',
                fontWeight: 600,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                width: 200,
                textAlign: 'center',
              }}
            >
              Set Up A Call
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
