'use client';

import { useEffect, useMemo, useState } from 'react';
import { AUTH_STORAGE_KEY } from '../../components/auth';

type ToggleState = {
  like: boolean;
  next: boolean;
  done: boolean;
};

type ToggleStore = Record<string, ToggleState>;
type CustomItemsStore = Record<string, string[]>;

const STORAGE_KEY = 'sm_company_whats_next_toggles';
const CUSTOM_ITEMS_KEY = 'sm_company_whats_next_custom_items';

const findSingleFallbackKey = (baseKey: string, scopedKey: string) => {
  if (scopedKey === baseKey) return null;
  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith(`${baseKey}:`)) {
      keys.push(key);
    }
  }
  if (keys.length === 1) return keys[0];
  return null;
};

const buildSections = () => [
  {
    title: 'Lesson Pack Build System',
    items: [
      'Define build steps and output artifacts',
      'Document inputs (content sources, templates, assets)',
      'Set ownership for approvals and updates',
    ],
  },
  {
    title: 'Company',
    items: [
      'Curriculum',
      'Subscriptions',
      'Royalties',
      'Site link',
      'Facebook group link',
      'Library',
      'Coaching (teacher dashboard)',
      'Support',
    ],
  },
  {
    title: 'Teacher',
    items: [
      'Training vs. Teaching mode',
      'Teacher Song “How To Teach This Better” ideas (vote up)',
    ],
  },
  {
    title: 'Company – Messaging & Promotions',
    items: [
      'Send notifications',
      'Add promo cards on each dashboard',
      'Post alerts',
      'Neil blog page',
      'Neil message to student or teacher',
    ],
  },
  {
    title: 'Research / Review',
    items: [
      'Watch videos and capture ideas',
      'Review corporate site',
      'Review student portal',
      'Review teacher portal',
    ],
  },
  {
    title: 'Ideas I Might Be Missing',
    description:
      'Add any overlooked opportunities, blockers, or quick wins you want surfaced here.',
    items: [
      'Pick one “most important” number to show on each dashboard',
      'Share a simple weekly summary on what moved forward',
      'Put all teacher onboarding links in one place',
      'Add a small “Recent Alerts” box with who owns each item',
      'Set a simple calendar for when curriculum updates go live',
      'Collect the top teacher/student questions in one list',
      'Create consistent promo card styles so they feel familiar',
      'Show when royalties were last paid and what’s next',
      'Highlight the most-loved lessons so we can learn from them',
      'Keep a simple log of lesson pack build issues',
      'Let teachers suggest improvements in a quick form',
      'List what kinds of notifications go out and why',
      'Write down support response expectations and who to escalate to',
      'Double-check who can see what across company/teacher/student',
      'Sketch the first 30 days for new teachers and students',
    ],
  },
];

function TogglePill({
  label,
  active,
  onClick,
  intent,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  intent: 'like' | 'next';
}) {
  const activeStyles =
    intent === 'like'
      ? 'border-emerald-200 bg-emerald-100 text-emerald-900'
      : 'border-sky-200 bg-sky-100 text-sky-900';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] transition ${
        active
          ? activeStyles
          : 'border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] text-[var(--c-6f6c65)] hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)]'
      }`}
    >
      {label}
    </button>
  );
}

export default function CompanyWhatsNextPage() {
  const [toggles, setToggles] = useState<ToggleStore>({});
  const [customItems, setCustomItems] = useState<CustomItemsStore>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [storageKeys, setStorageKeys] = useState(() => ({
    togglesKey: STORAGE_KEY,
    customItemsKey: CUSTOM_ITEMS_KEY,
  }));
  const sections = useMemo(() => buildSections(), []);

  useEffect(() => {
    try {
      const storedAuth = window.localStorage.getItem(AUTH_STORAGE_KEY);
      const parsedAuth = storedAuth
        ? (JSON.parse(storedAuth) as { username?: string })
        : null;
      const username = parsedAuth?.username?.trim().toLowerCase();
      if (username) {
        const nextKeys = {
          togglesKey: `${STORAGE_KEY}:${username}`,
          customItemsKey: `${CUSTOM_ITEMS_KEY}:${username}`,
        };
        setStorageKeys(nextKeys);
      }
    } catch {
      // ignore auth storage errors
    }
  }, []);

  useEffect(() => {
    try {
      const stored =
        window.localStorage.getItem(storageKeys.togglesKey) ??
        window.localStorage.getItem(STORAGE_KEY) ??
        null;
      const fallbackKey =
        stored ? null : findSingleFallbackKey(STORAGE_KEY, storageKeys.togglesKey);
      const fallbackStored = fallbackKey
        ? window.localStorage.getItem(fallbackKey)
        : null;
      const payload = stored ?? fallbackStored;
      if (!payload) return;
      const parsed = JSON.parse(payload) as ToggleStore;
      if (parsed && typeof parsed === 'object') {
        setToggles(parsed);
      }
    } catch {
      // ignore storage errors
    }
  }, [storageKeys.togglesKey]);

  useEffect(() => {
    try {
      const stored =
        window.localStorage.getItem(storageKeys.customItemsKey) ??
        window.localStorage.getItem(CUSTOM_ITEMS_KEY) ??
        null;
      const fallbackKey = stored
        ? null
        : findSingleFallbackKey(CUSTOM_ITEMS_KEY, storageKeys.customItemsKey);
      const fallbackStored = fallbackKey
        ? window.localStorage.getItem(fallbackKey)
        : null;
      const payload = stored ?? fallbackStored;
      if (!payload) return;
      const parsed = JSON.parse(payload) as CustomItemsStore;
      if (parsed && typeof parsed === 'object') {
        setCustomItems(parsed);
      }
    } catch {
      // ignore storage errors
    }
  }, [storageKeys.customItemsKey]);

  useEffect(() => {
    try {
      if (storageKeys.togglesKey === STORAGE_KEY) return;
      const existingScoped = window.localStorage.getItem(
        storageKeys.togglesKey,
      );
      if (existingScoped) return;
      const legacy = window.localStorage.getItem(STORAGE_KEY);
      if (!legacy) return;
      window.localStorage.setItem(storageKeys.togglesKey, legacy);
      const parsed = JSON.parse(legacy) as ToggleStore;
      if (parsed && typeof parsed === 'object') {
        setToggles(parsed);
      }
    } catch {
      // ignore storage errors
    }
  }, [storageKeys.togglesKey]);

  useEffect(() => {
    try {
      if (storageKeys.customItemsKey === CUSTOM_ITEMS_KEY) return;
      const existingScoped = window.localStorage.getItem(
        storageKeys.customItemsKey,
      );
      if (existingScoped) return;
      const legacy = window.localStorage.getItem(CUSTOM_ITEMS_KEY);
      if (!legacy) return;
      window.localStorage.setItem(storageKeys.customItemsKey, legacy);
      const parsed = JSON.parse(legacy) as CustomItemsStore;
      if (parsed && typeof parsed === 'object') {
        setCustomItems(parsed);
      }
    } catch {
      // ignore storage errors
    }
  }, [storageKeys.customItemsKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        storageKeys.togglesKey,
        JSON.stringify(toggles),
      );
    } catch {
      // ignore storage errors
    }
  }, [toggles, storageKeys.togglesKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        storageKeys.customItemsKey,
        JSON.stringify(customItems),
      );
    } catch {
      // ignore storage errors
    }
  }, [customItems, storageKeys.customItemsKey]);


  const getItemId = (sectionTitle: string, item: string) =>
    `${sectionTitle}::${item}`;

  const handleToggle = (id: string, key: keyof ToggleState) => {
    setToggles(current => {
      const currentState = current[id] ?? { like: false, next: false, done: false };
      const nextState = { ...currentState, [key]: !currentState[key] };
      return { ...current, [id]: nextState };
    });
  };

  const handleDraftChange = (sectionTitle: string, value: string) => {
    setDrafts(current => ({ ...current, [sectionTitle]: value }));
  };

  const handleAddItem = (sectionTitle: string) => {
    const value = (drafts[sectionTitle] ?? '').trim();
    if (!value) return;
    setCustomItems(current => {
      const existing = current[sectionTitle] ?? [];
      if (existing.some(item => item.toLowerCase() === value.toLowerCase())) {
        return current;
      }
      return { ...current, [sectionTitle]: [...existing, value] };
    });
    setDrafts(current => ({ ...current, [sectionTitle]: '' }));
  };

  const nextTodayItems = useMemo(() => {
    const collected: Array<{
      id: string;
      label: string;
      sectionTitle: string;
      liked: boolean;
    }> = [];
    sections.forEach(section => {
      const extraItems = customItems[section.title] ?? [];
      const allItems = [...section.items, ...extraItems];
      allItems.forEach(item => {
        const id = getItemId(section.title, item);
        const currentState = toggles[id];
        if (currentState?.next && !currentState?.done) {
          collected.push({
            id,
            label: item,
            sectionTitle: section.title,
            liked: Boolean(currentState?.like),
          });
        }
      });
    });
    return collected.sort((a, b) => {
      if (a.liked === b.liked) return 0;
      return a.liked ? -1 : 1;
    });
  }, [sections, customItems, toggles]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.35em] text-[var(--c-c8102e)]">
          Company
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-[var(--c-1f1f1d)]">
          What&#39;s Next
        </h1>
        <p className="mt-3 text-base text-[var(--c-6f6c65)]">
          Keep this list focused on the highest-impact next steps.
        </p>
      </div>

      {nextTodayItems.length > 0 ? (
        <section className="rounded-[28px] border border-[var(--c-e0dfd9)] bg-[var(--c-f7f6f2)] p-8 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.25)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--c-6f6c65)]">
                Focus Today
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-[var(--c-1f1f1d)]">
                Make These Happen Today!
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-[var(--c-6f6c65)]">
                Clear wins for today. Tap the check to move anything to Done.
              </p>
            </div>
            <span className="rounded-full border border-[var(--c-e0dfd9)] bg-[var(--c-ffffff)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--c-1f1f1d)] shadow-sm">
              Next Up
            </span>
          </div>
          <ul className="mt-6 space-y-3 text-base text-[var(--c-1f1f1d)]">
            {nextTodayItems.map(item => (
              <li
                key={item.id}
                className={`flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3 shadow-[0_12px_32px_-26px_rgba(15,23,42,0.2)] ${
                  item.liked
                    ? 'border-emerald-200 bg-[var(--c-ffffff)] ring-1 ring-emerald-200/40'
                    : 'border-[var(--c-e0dfd9)] bg-[var(--c-ffffff)]'
                }`}
              >
                {item.liked ? (
                  <span className="h-6 w-1 rounded-full bg-emerald-300" aria-hidden="true" />
                ) : null}
                <button
                  type="button"
                  onClick={() => handleToggle(item.id, 'done')}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border bg-[var(--c-ffffff)] text-sm font-semibold transition focus:outline-none focus-visible:ring-2 ${
                    item.liked
                      ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 focus-visible:ring-emerald-300'
                      : 'border-[var(--c-dad7d0)] text-[var(--c-6f6c65)] hover:bg-[var(--c-f1f1ef)] focus-visible:ring-[var(--c-c8102e)]'
                  }`}
                  aria-label="Mark done"
                >
                  ✓
                </button>
                <span className="flex-1 text-[15px]">
                  <span className="font-semibold text-[var(--c-1f1f1d)]">
                    {item.sectionTitle}
                  </span>
                  <span className="mx-2 text-[var(--c-9a9892)]">-</span>
                  <span className="text-[var(--c-6f6c65)]">{item.label}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-2">
        {sections.map((section, index) => {
          const isWide = index >= 4;
          const extraItems = customItems[section.title] ?? [];
          const allItems = [...section.items, ...extraItems];
          return (
            <section
              key={section.title}
              className={`rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-8 shadow-sm ${
                isWide ? 'lg:col-span-2' : ''
              }`}
            >
              <h2 className="text-xl font-semibold text-[var(--c-1f1f1d)]">
                {section.title}
              </h2>
              {section.description ? (
                <p className="mt-4 text-base text-[var(--c-6f6c65)]">
                  {section.description}
                </p>
              ) : null}
              <ul
                className={`mt-5 ${
                  section.title === 'Ideas I Might Be Missing'
                    ? 'grid gap-4 text-base text-[var(--c-6f6c65)] md:grid-cols-2'
                    : 'space-y-3 text-base text-[var(--c-6f6c65)]'
                }`}
              >
                {allItems.map(item => {
                  const id = getItemId(section.title, item);
                  const currentState = toggles[id] ?? {
                    like: false,
                    next: false,
                    done: false,
                  };
                  return (
                    <li
                      key={id}
                      className="flex flex-wrap items-center justify-between gap-3"
                    >
                      <span className="flex min-w-[220px] flex-1 items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggle(id, 'done')}
                          className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold transition ${
                            currentState.done
                              ? 'border-emerald-300 bg-emerald-100 text-emerald-700'
                              : 'border-[var(--c-e5e3dd)] text-[var(--c-9a9892)] hover:border-emerald-300'
                          }`}
                          aria-label={
                            currentState.done ? 'Mark not done' : 'Mark done'
                          }
                        >
                          {currentState.done ? '✓' : ''}
                        </button>
                        <span
                          className={`flex-1 ${
                            currentState.done
                              ? 'text-[var(--c-9a9892)] line-through'
                              : ''
                          }`}
                        >
                          {item}
                        </span>
                      </span>
                      <div className="flex items-center gap-2">
                        <TogglePill
                          label="Like"
                          active={currentState.like}
                          intent="like"
                          onClick={() => handleToggle(id, 'like')}
                        />
                        <TogglePill
                          label="Next"
                          active={currentState.next}
                          intent="next"
                          onClick={() => handleToggle(id, 'next')}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-6 border-t border-[var(--c-ecebe7)] pt-4">
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    value={drafts[section.title] ?? ''}
                    onChange={event =>
                      handleDraftChange(section.title, event.target.value)
                    }
                    placeholder="Add an idea"
                    className="min-w-[240px] flex-1 rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-fcfcfb)] px-4 py-2 text-sm text-[var(--c-1f1f1d)] outline-none transition focus:border-[var(--c-c8102e)]"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddItem(section.title)}
                    className="rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)] transition hover:brightness-110"
                  >
                    Add
                  </button>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
