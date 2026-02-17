'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type NotificationEvent = {
  id: string;
  type: 'email' | 'push';
  to: string;
  source?: string;
  subject?: string;
  title?: string;
  body: string;
  data?: Record<string, unknown> | null;
  status?: string;
  createdAt: string;
};

const formatTimestamp = (value: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export default function NotificationsPage() {
  const [events, setEvents] = useState<NotificationEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'email' | 'push'>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [sourceFilter, setSourceFilter] = useState('all');
  const initialLoadRef = useRef(true);
  const [isClearing, setIsClearing] = useState(false);
  const [clearError, setClearError] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const load = useCallback(async () => {
    if (initialLoadRef.current) {
      setIsLoading(true);
    }
    try {
      const response = await fetch('/api/notifications', { cache: 'no-store' });
      if (!response.ok) return;
      const data = (await response.json()) as { events?: NotificationEvent[] };
      setEvents(data.events ?? []);
    } catch {
      setEvents([]);
    } finally {
      if (initialLoadRef.current) {
        initialLoadRef.current = false;
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = window.setInterval(load, 8000);
    return () => window.clearInterval(interval);
  }, [load]);

  const clearTeacherInterest = useCallback(async () => {
    if (isClearing) return;
    setIsClearing(true);
    setClearError(null);
    try {
      const response = await fetch('/api/notifications', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Failed to clear');
      }
      await load();
      setIsConfirmOpen(false);
    } catch {
      setClearError('Unable to clear teacher interest data.');
    } finally {
      setIsClearing(false);
    }
  }, [isClearing, load]);

  const visible = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    const byType =
      filter === 'all' ? events : events.filter(event => event.type === filter);
    const bySource =
      sourceFilter === 'all'
        ? byType
        : byType.filter(event => (event.source ?? '') === sourceFilter);
    const bySearch = normalized
      ? bySource.filter(event => {
          const haystack = [
            event.to,
            event.subject,
            event.title,
            event.body,
            event.source,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          return haystack.includes(normalized);
        })
      : bySource;
    const sorted = [...bySearch].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sort === 'newest' ? bTime - aTime : aTime - bTime;
    });
    return sorted;
  }, [events, filter, search, sort, sourceFilter]);

  const sourceOptions = useMemo(() => {
    const sources = Array.from(
      new Set(
        events
          .map(event => event.source ?? '')
          .filter(value => value.trim().length > 0),
      ),
    );
    const defaults = ['Teacher Interest'];
    const merged = Array.from(new Set(['all', ...defaults, ...sources]));
    return merged.sort((a, b) => {
      if (a === 'all') return -1;
      if (b === 'all') return 1;
      return a.localeCompare(b);
    });
  }, [events]);

  const renderLinkedText = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={`${part}-${index}`}
            href={part}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-[var(--c-c8102e)] underline decoration-[var(--c-c8102e)]/50 underline-offset-4 transition hover:text-[var(--c-8f0f23)]"
          >
            {part}
          </a>
        );
      }
      return <span key={`${part}-${index}`}>{part}</span>;
    });
  };

  const extractVerificationCode = (text: string) => {
    if (!text) return null;
    const match = text.match(/\b(\d{4,8})\b/);
    return match ? match[1] : null;
  };

  const handleCopyCode = async (code: string) => {
    const fallbackCopy = () => {
      const textarea = document.createElement('textarea');
      textarea.value = code;
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
      try {
        await navigator.clipboard.writeText(code);
        return;
      } catch {
        fallbackCopy();
        return;
      }
    }
    fallbackCopy();
  };

  const isVerificationEvent = (event: NotificationEvent) => {
    const subject = (event.subject ?? '').toLowerCase();
    const title = (event.title ?? '').toLowerCase();
    const body = (event.body ?? '').toLowerCase();
    const hasVerificationWord =
      subject.includes('verification') ||
      title.includes('verification') ||
      body.includes('verification code') ||
      body.includes('sms verification');
    const hasCode = Boolean(extractVerificationCode(event.body ?? ''));
    return (
      hasVerificationWord ||
      hasCode ||
      Boolean(event.data?.verificationChannel)
    );
  };

  const CODE_TTL_MS = 10 * 60 * 1000;

  const getVerificationKey = (event: NotificationEvent) => {
    const channel =
      (event.data?.verificationChannel as string | undefined) ?? event.type;
    const label =
      (event.subject ?? event.title ?? 'verification').toLowerCase();
    const recipient = (event.to ?? '').toLowerCase();
    return `${recipient}::${channel}::${label}`;
  };

  const isExpiredVerification = (event: NotificationEvent) => {
    if (!event.createdAt) return false;
    const created = new Date(event.createdAt).getTime();
    if (Number.isNaN(created)) return false;
    return Date.now() - created > CODE_TTL_MS;
  };

  const importantEvents = useMemo(
    () => visible.filter(event => !isVerificationEvent(event)),
    [visible],
  );

  const verificationEvents = useMemo(
    () => {
      const filtered = visible.filter(
        event => isVerificationEvent(event) && !isExpiredVerification(event),
      );
      const latestByKey = new Map<string, NotificationEvent>();
      for (const event of filtered) {
        const key = getVerificationKey(event);
        const nextTime = event.createdAt
          ? new Date(event.createdAt).getTime()
          : 0;
        const existing = latestByKey.get(key);
        const existingTime = existing?.createdAt
          ? new Date(existing.createdAt).getTime()
          : 0;
        if (!existing || nextTime >= existingTime) {
          latestByKey.set(key, event);
        }
      }
      return Array.from(latestByKey.values());
    },
    [visible],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
            Admin
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-[var(--c-1f1f1d)]">
            Notifications
          </h1>
          <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
            Outbox for email and push notifications, with filters and search.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsConfirmOpen(true)}
            disabled={isClearing}
            className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
              isClearing
                ? 'cursor-not-allowed border-[var(--c-ecebe7)] bg-[var(--c-f5f4f1)] text-[var(--c-9a9892)]'
                : 'border-[var(--c-1f1f1d)] bg-[var(--c-ffffff)] text-[var(--c-1f1f1d)] hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]'
            }`}
          >
            {isClearing ? 'Clearing…' : 'Clear Teacher Interest Data'}
          </button>
          {[
            { id: 'all', label: 'All' },
            { id: 'email', label: 'Email' },
            { id: 'push', label: 'Push' },
          ].map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id as typeof filter)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                filter === item.id
                  ? 'border-[var(--c-c8102e)] bg-[var(--c-c8102e)] text-white'
                  : 'border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] text-[var(--c-6f6c65)] hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="relative">
            <select
              value={sourceFilter}
              onChange={event => setSourceFilter(event.target.value)}
              className="appearance-none rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 pr-8 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
            >
              {sourceOptions.map(option => (
                <option key={option} value={option}>
                  {option === 'all' ? 'All Sources' : option}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--c-6f6c65)]">
              ▾
            </span>
          </div>
          <div className="relative">
            <select
              value={sort}
              onChange={event => setSort(event.target.value as typeof sort)}
              className="appearance-none rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 pr-8 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--c-6f6c65)]">
              ▾
            </span>
          </div>
        </div>
      </header>

      <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4 shadow-sm">
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
          Search by subject, recipient, body, or source
        </label>
        <input
          value={search}
          onChange={event => setSearch(event.target.value)}
          className="mt-2 w-full rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3 text-sm text-[var(--c-1f1f1d)] outline-none focus:border-[var(--c-c8102e)]"
          placeholder="Search notifications..."
        />
      </div>

      <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
        {clearError ? (
          <p className="mb-4 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3 text-sm text-[var(--c-6f6c65)]">
            {clearError}
          </p>
        ) : null}
        {isLoading ? (
          <p className="text-sm text-[var(--c-6f6c65)]">Loading notifications...</p>
        ) : visible.length === 0 ? (
          <p className="text-sm text-[var(--c-6f6c65)]">No notifications yet.</p>
        ) : (
          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="lg:basis-[70%]">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  Important Events
                </h2>
                <span className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                  {importantEvents.length} items
                </span>
              </div>
              {importantEvents.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-5 py-4 text-sm text-[var(--c-6f6c65)]">
                  No important notifications yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {importantEvents.map(event => (
                    <div
                      key={event.id}
                      className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-5 py-4"
                    >
                      {(() => {
                        const code = extractVerificationCode(event.body ?? '');
                        return (
                          <>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                            <span>{event.type}</span>
                          </div>
                          <p className="mt-2 text-base font-semibold text-[var(--c-1f1f1d)]">
                            {event.type === 'email'
                              ? event.subject || 'Untitled Email'
                              : event.title || 'Untitled Push'}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                          <span>{formatTimestamp(event.createdAt)}</span>
                          {code ? (
                            <button
                              type="button"
                              onClick={() => handleCopyCode(code)}
                              className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
                            >
                              Copy Code
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-[var(--c-6f6c65)]">
                        <p className="text-base">
                          <span className="font-semibold text-[var(--c-1f1f1d)]">
                            To:
                          </span>{' '}
                          {event.to}
                        </p>
                        <p className="mt-2">{renderLinkedText(event.body)}</p>
                        {event.source ? (
                          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                            Source:{' '}
                            <span className="font-semibold">{event.source}</span>
                          </p>
                        ) : null}
                      </div>
                          </>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:basis-[30%]">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  Verification Codes
                </h2>
                <span className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                  {verificationEvents.length} items
                </span>
              </div>
              {verificationEvents.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3 text-sm text-[var(--c-6f6c65)]">
                  No verification codes yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {verificationEvents.map(event => (
                    <div
                      key={event.id}
                      className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3"
                    >
                      {(() => {
                        const code = extractVerificationCode(event.body ?? '');
                        return (
                          <>
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                            {event.type}
                          </p>
                          <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                            {event.type === 'email'
                              ? event.subject || 'Verification Code'
                              : event.title || 'Verification Code'}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                            {formatTimestamp(event.createdAt)}
                          </span>
                          {code ? (
                            <button
                              type="button"
                              onClick={() => handleCopyCode(code)}
                              className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
                            >
                              Copy Code
                            </button>
                          ) : null}
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                        <span className="font-semibold text-[var(--c-1f1f1d)]">To:</span>{' '}
                        {event.to}
                      </p>
                      <p className="mt-2 text-xs text-[var(--c-6f6c65)]">
                        {renderLinkedText(event.body)}
                      </p>
                          </>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <div
        className={`fixed inset-0 z-[60] ${
          isConfirmOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        } transition-opacity`}
      >
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsConfirmOpen(false)}
        />
        <div className="absolute inset-x-4 top-24 mx-auto max-w-xl rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                Confirm Clear
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                Clear Teacher Interest Data?
              </h2>
              <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                This will remove all lead-form entries, questionnaire responses,
                teacher-registration verification data, and related notifications.
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-start gap-3">
            <button
              type="button"
              onClick={() => setIsConfirmOpen(false)}
              className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/30 hover:text-[var(--c-c8102e)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={clearTeacherInterest}
              disabled={isClearing}
              className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                isClearing
                  ? 'cursor-not-allowed border-[var(--c-ecebe7)] bg-[var(--c-f5f4f1)] text-[var(--c-9a9892)]'
                  : 'border-[var(--c-1f1f1d)] bg-[var(--c-1f1f1d)] text-[var(--c-ffffff)] hover:opacity-90'
              }`}
            >
              {isClearing ? 'Clearing…' : 'Yes, Clear Data'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
