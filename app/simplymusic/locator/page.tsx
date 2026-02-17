'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AUTH_STORAGE_KEY, roleHome, type AuthUser } from '../../(admin)/components/auth';

const menuItems = [
  { label: 'Teachers', href: '/simplymusic/teachers' },
  { label: 'Students', href: '/simplymusic/students' },
  { label: 'Self-study', href: 'https://simplymusic.com/self-study/' },
  { label: 'Special Needs', href: 'https://simplymusic.com/special-needs/' },
  { label: 'Locate', href: '/simplymusic/locator', active: true },
  { label: 'About', href: 'https://simplymusic.com/about/' },
  { label: 'Blog', href: 'https://simplymusic.com/blog/' },
];

const statusOrder = ['Master', 'Advanced', 'Certified', 'Licensed'] as const;

type TeacherStatus = (typeof statusOrder)[number] | 'Trainee';

type Teacher = {
  id: string;
  name: string;
  status: TeacherStatus;
  distance: number;
  address: string;
  zip: string;
  online: boolean;
  specialNeeds: boolean;
  coordinates: { x: number; y: number };
};

const teachers: Teacher[] = [
  {
    id: 't1',
    name: 'Ava Bennett',
    status: 'Master',
    distance: 3.2,
    address: '3810 Laurel Heights Dr',
    zip: '75024',
    online: true,
    specialNeeds: false,
    coordinates: { x: 62, y: 42 },
  },
  {
    id: 't2',
    name: 'Brian Gray',
    status: 'Advanced',
    distance: 5.7,
    address: 'Riffs & Chops Studio',
    zip: '75075',
    online: false,
    specialNeeds: true,
    coordinates: { x: 54, y: 58 },
  },
  {
    id: 't3',
    name: 'Kim Nelson',
    status: 'Certified',
    distance: 8.9,
    address: '7309 Hillview Dr',
    zip: '75023',
    online: true,
    specialNeeds: true,
    coordinates: { x: 40, y: 64 },
  },
  {
    id: 't4',
    name: 'Lanette Saetre',
    status: 'Licensed',
    distance: 12.2,
    address: 'Sergey Synergy',
    zip: '75001',
    online: false,
    specialNeeds: false,
    coordinates: { x: 68, y: 70 },
  },
  {
    id: 't5',
    name: 'Tamar Milenewicz',
    status: 'Certified',
    distance: 14.6,
    address: 'Blue Jay Piano Academy',
    zip: '75013',
    online: true,
    specialNeeds: false,
    coordinates: { x: 74, y: 50 },
  },
  {
    id: 't6',
    name: 'Owen Carlisle',
    status: 'Trainee',
    distance: 1.9,
    address: 'Piano Launchpad',
    zip: '75024',
    online: true,
    specialNeeds: false,
    coordinates: { x: 36, y: 46 },
  },
];

export default function LocatorPage() {
  const [accountHref, setAccountHref] = useState('/login');
  const [accountLabel, setAccountLabel] = useState('Login');

  const [locationQuery, setLocationQuery] = useState('');
  const [zipQuery, setZipQuery] = useState('');
  const [distance, setDistance] = useState('10');
  const [nameQuery, setNameQuery] = useState('');
  const [filterOnline, setFilterOnline] = useState(false);
  const [filterSpecialNeeds, setFilterSpecialNeeds] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [sortOption, setSortOption] = useState<'Any' | 'Relevance' | 'Distance'>('Any');

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

  const filteredTeachers = useMemo(() => {
    if (!hasSearched) return [] as Teacher[];

    const maxDistance = distance === 'any' ? Infinity : Number(distance || '0');
    const normalizedName = nameQuery.trim().toLowerCase();
    const normalizedZip = zipQuery.trim();

    return teachers
      .filter(t => t.status !== 'Trainee')
      .filter(t => t.distance <= maxDistance)
      .filter(t => (normalizedZip ? t.zip.startsWith(normalizedZip) : true))
      .filter(t => (normalizedName ? t.name.toLowerCase().includes(normalizedName) : true))
      .filter(t => (filterOnline ? t.online : true))
      .filter(t => (filterSpecialNeeds ? t.specialNeeds : true))
      .sort((a, b) => {
        const aRank = statusOrder.indexOf(a.status as (typeof statusOrder)[number]);
        const bRank = statusOrder.indexOf(b.status as (typeof statusOrder)[number]);
        if (aRank !== bRank) return aRank - bRank;
        if (sortOption === 'Distance') return a.distance - b.distance;
        return a.distance - b.distance;
      });
  }, [
    distance,
    filterOnline,
    filterSpecialNeeds,
    hasSearched,
    nameQuery,
    zipQuery,
    sortOption,
  ]);

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
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1170, margin: '0 auto', padding: '40px 24px 90px' }}>
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(320px, 1.1fr) minmax(280px, 0.9fr)',
            gap: 36,
            alignItems: 'center',
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 44, fontWeight: 300 }}>
              Simply Music Locator Map
            </h1>
            <p style={{ marginTop: 16, fontSize: 18, color: '#4b4b4b' }}>
              Find Simply Music Teachers near you
            </p>

            <div
              style={{
                marginTop: 28,
                borderRadius: 999,
                border: '1px solid #e5e3dd',
                background: '#fff',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                boxShadow: '0 16px 24px -20px rgba(0,0,0,0.18)',
              }}
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="#888"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 22s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11z" />
                <circle cx="12" cy="11" r="2.5" />
              </svg>
              <input
                placeholder="Enter city, state, or address"
                value={locationQuery}
                onChange={event => setLocationQuery(event.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  flex: 1,
                  fontSize: 16,
                }}
              />
              <button
                type="button"
                onClick={() => setLocationQuery('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: 18,
                  color: '#9b9b9b',
                  cursor: 'pointer',
                }}
                aria-label="Clear"
              >
                ×
              </button>
              <button
                type="button"
                onClick={() => setHasSearched(true)}
                style={{
                  background: '#E31F26',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '999px',
                  width: 44,
                  height: 44,
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                }}
                aria-label="Search"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3.5-3.5" />
                </svg>
              </button>
            </div>

            <div
              style={{
                marginTop: 18,
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 12,
              }}
            >
              <input
                placeholder="ZIP code"
                value={zipQuery}
                onChange={event => setZipQuery(event.target.value)}
                style={{
                  borderRadius: 12,
                  border: '1px solid #e5e3dd',
                  padding: '10px 12px',
                  fontSize: 14,
                }}
              />
              <select
                value={distance}
                onChange={event => setDistance(event.target.value)}
                style={{
                  borderRadius: 12,
                  border: '1px solid #e5e3dd',
                  padding: '10px 12px',
                  fontSize: 14,
                }}
              >
                <option value="any">Any distance</option>
                <option value="5">Within 5 miles</option>
                <option value="10">Within 10 miles</option>
                <option value="25">Within 25 miles</option>
                <option value="50">Within 50 miles</option>
              </select>
              <input
                placeholder="Teacher name"
                value={nameQuery}
                onChange={event => setNameQuery(event.target.value)}
                style={{
                  borderRadius: 12,
                  border: '1px solid #e5e3dd',
                  padding: '10px 12px',
                  fontSize: 14,
                }}
              />
            </div>

            <div style={{ marginTop: 8 }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <img
              src="https://simplymusic.com/wp-content/uploads/2024/04/locate-page-image.webp"
              alt="Locator Illustration"
              style={{ width: '100%', maxWidth: 360 }}
            />
          </div>
        </section>

        <section style={{ marginTop: 50 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 18,
              color: '#6d6d6d',
              fontSize: 14,
            }}
          >
            <span>
              {hasSearched
                ? `Showing 1 - ${filteredTeachers.length} of ${filteredTeachers.length} locations`
                : 'Click the search icon to see results'}
            </span>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowFilterMenu(!showFilterMenu);
                    setShowSortMenu(false);
                  }}
                  style={{
                    borderRadius: 999,
                    border: '1px solid #e5e3dd',
                    padding: '9px 16px',
                    background: '#fff',
                    fontSize: 13,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M3 5h18l-7 8v5l-4 2v-7L3 5z" />
                  </svg>
                  Filter
                </button>
                {showFilterMenu ? (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      background: '#fff',
                      borderRadius: 14,
                      boxShadow: '0 14px 30px -18px rgba(0,0,0,0.35)',
                      border: '1px solid #eee6dc',
                      padding: 14,
                      minWidth: 190,
                      zIndex: 10,
                    }}
                  >
                    <label
                      style={{
                        display: 'flex',
                        gap: 10,
                        alignItems: 'center',
                        fontSize: 13,
                        marginBottom: 10,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={filterOnline}
                        onChange={event => setFilterOnline(event.target.checked)}
                        style={{ width: 16, height: 16, accentColor: '#E31F26' }}
                      />
                      Online lessons
                    </label>
                    <label
                      style={{
                        display: 'flex',
                        gap: 10,
                        alignItems: 'center',
                        fontSize: 13,
                        marginBottom: 14,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={filterSpecialNeeds}
                        onChange={event => setFilterSpecialNeeds(event.target.checked)}
                        style={{ width: 16, height: 16, accentColor: '#E31F26' }}
                      />
                      Special Needs
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowFilterMenu(false)}
                      style={{
                        width: '100%',
                        borderRadius: 12,
                        border: '1px solid #E31F26',
                        background: '#fff',
                        color: '#E31F26',
                        fontWeight: 600,
                        padding: '8px 12px',
                      }}
                    >
                      Apply
                    </button>
                  </div>
                ) : null}
              </div>

              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowSortMenu(!showSortMenu);
                    setShowFilterMenu(false);
                  }}
                  style={{
                    borderRadius: 999,
                    border: '1px solid #e5e3dd',
                    padding: '9px 16px',
                    background: '#fff',
                    fontSize: 13,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M7 4v16" />
                    <path d="M7 4l-3 3" />
                    <path d="M7 4l3 3" />
                    <path d="M17 20V4" />
                    <path d="M17 20l-3-3" />
                    <path d="M17 20l3-3" />
                  </svg>
                  Sort
                </button>
                {showSortMenu ? (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      background: '#fff',
                      borderRadius: 14,
                      boxShadow: '0 14px 30px -18px rgba(0,0,0,0.35)',
                      border: '1px solid #eee6dc',
                      padding: 10,
                      minWidth: 160,
                      zIndex: 10,
                    }}
                  >
                    {(['Any', 'Relevance', 'Distance'] as const).map(option => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setSortOption(option);
                          setShowSortMenu(false);
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          borderRadius: 10,
                          border: 'none',
                          background: option === sortOption ? '#f7e9e6' : 'transparent',
                          padding: '8px 10px',
                          fontSize: 13,
                          color: '#3b3b3b',
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 0.8fr) minmax(0, 1.2fr)',
              gap: 24,
              alignItems: 'start',
            }}
          >
            <div style={{ display: 'grid', gap: 18 }}>
              {hasSearched && filteredTeachers.length === 0 ? (
                <div
                  style={{
                    padding: '20px 24px',
                    borderRadius: 16,
                    border: '1px solid #ece8e1',
                    background: '#faf7f1',
                    color: '#6d6d6d',
                  }}
                >
                  No teachers found. Try expanding your search area.
                </div>
              ) : null}

              {filteredTeachers.map((teacher, index) => (
                <div
                  key={teacher.id}
                  style={{
                    borderRadius: 18,
                    border: '1px solid #e5e3dd',
                    padding: 18,
                    background: '#fff',
                    boxShadow: '0 18px 30px -28px rgba(0,0,0,0.25)',
                    display: 'grid',
                    gridTemplateColumns: '64px 1fr auto',
                    gap: 14,
                    alignItems: 'start',
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 16,
                      background: '#E31F26',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 22,
                      color: '#fff',
                      fontWeight: 600,
                    }}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          textTransform: 'uppercase',
                          letterSpacing: '0.12em',
                          fontWeight: 600,
                          color:
                            teacher.status === 'Master'
                              ? '#7a1b69'
                              : teacher.status === 'Advanced'
                                ? '#d2642c'
                                : teacher.status === 'Certified'
                                  ? '#7ca83d'
                                  : '#338cad',
                          border: `1px solid currentColor`,
                          borderRadius: 999,
                          padding: '3px 8px',
                        }}
                      >
                        {teacher.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{teacher.name}</div>
                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 13,
                        color: '#6d6d6d',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M12 22s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11z" />
                        <circle cx="12" cy="11" r="2.5" />
                      </svg>
                      <span>{teacher.address}</span>
                    </div>
                    {(teacher.online || teacher.specialNeeds) && (
                      <div
                        style={{
                          marginTop: 8,
                          display: 'flex',
                          gap: 8,
                          flexWrap: 'wrap',
                        }}
                      >
                        {teacher.online ? (
                          <span
                            style={{
                              fontSize: 12,
                              borderRadius: 999,
                              background: '#f0f5ff',
                              color: '#2a6edc',
                              padding: '5px 12px',
                              fontWeight: 600,
                            }}
                          >
                            Online Lessons
                          </span>
                        ) : null}
                        {teacher.specialNeeds ? (
                          <span
                            style={{
                              fontSize: 12,
                              borderRadius: 999,
                              background: '#fff5e8',
                              color: '#b26b2c',
                              padding: '5px 12px',
                              fontWeight: 600,
                            }}
                          >
                            Special Needs
                          </span>
                        ) : null}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: '#6d6d6d' }}>
                    {teacher.distance.toFixed(1)} mi
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                borderRadius: 20,
                border: '1px solid #e5e3dd',
                background: '#f8f6f2',
                aspectRatio: '1 / 1',
                minHeight: 360,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 12,
                  left: 12,
                  background: '#fff',
                  borderRadius: 999,
                  padding: '6px 12px',
                  fontSize: 12,
                  boxShadow: '0 8px 18px -14px rgba(0,0,0,0.3)',
                }}
              >
                Results on map
              </div>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: 'url(/reference/locator-map.png)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: 0.75,
                }}
              />
              {filteredTeachers.map((teacher, index) => (
                <div
                  key={teacher.id}
                  style={{
                    position: 'absolute',
                    left: `${teacher.coordinates.x}%`,
                    top: `${teacher.coordinates.y}%`,
                    transform: 'translate(-50%, -50%)',
                    width: 46,
                    height: 46,
                    borderRadius: '50%',
                    background: '#E31F26',
                    border: '2px solid #E31F26',
                    display: 'grid',
                    placeItems: 'center',
                    boxShadow: '0 14px 28px -12px rgba(0,0,0,0.7)',
                    zIndex: 2,
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: 16,
                  }}
                >
                  {index + 1}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: -7,
                      left: '50%',
                      width: 16,
                      height: 16,
                      background: '#E31F26',
                      transform: 'translateX(-50%) rotate(45deg)',
                      borderRadius: 3,
                      zIndex: -1,
                      boxShadow: '0 10px 20px -12px rgba(0,0,0,0.6)',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
