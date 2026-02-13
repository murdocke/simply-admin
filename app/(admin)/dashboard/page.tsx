'use client';

import { useEffect, useMemo, useState } from 'react';

function TimeBadge({ label, timeZone }: { label: string; timeZone: string }) {
  const [now, setNow] = useState(() => new Date());
  const formatted = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        timeZone,
        dateStyle: 'medium',
        timeStyle: 'medium',
      }).format(now),
    [now, timeZone],
  );

  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = window.setInterval(tick, 1_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-2 shadow-sm">
      {label} · {formatted}
    </div>
  );
}

export default function DashboardPage() {
  const activeTeachers = 845;
  const activeStudents = activeTeachers * 27;
  const monthlyRoyaltiesDue = activeStudents * 9;
  const [isPromoOpen, setIsPromoOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [promoTitle, setPromoTitle] = useState('Quick Studio Update');
  const [promoBody, setPromoBody] = useState(
    'New practice tips are live in your dashboard. Check them out before your next lesson.',
  );
  const [promoCta, setPromoCta] = useState('GOT IT');
  const [promoAudience, setPromoAudience] = useState('both');
  const [promoTrigger, setPromoTrigger] = useState('dashboard');
  const [alertTitle, setAlertTitle] = useState('Important Reminder');
  const [alertBody, setAlertBody] = useState(
    'Please review the latest studio update before your next lesson.',
  );
  const [alertAudience, setAlertAudience] = useState('both');
  const [alertColor, setAlertColor] = useState('amber');
  const [alertPersistence, setAlertPersistence] = useState('persist');
  const [isPromoHistoryOpen, setIsPromoHistoryOpen] = useState(false);
  const [isAlertHistoryOpen, setIsAlertHistoryOpen] = useState(false);
  const [promoHistory, setPromoHistory] = useState<
    {
      id: string;
      title: string;
      body: string;
      cta?: string;
      trigger: string;
      createdAt: string;
      audience: string;
      status?: string;
    }[]
  >([]);
  const [alertHistory, setAlertHistory] = useState<
    {
      id: string;
      title: string;
      body: string;
      color: string;
      persistence: string;
      createdAt: string;
      audience: string;
      status?: string;
    }[]
  >([]);
  const [promoSearch, setPromoSearch] = useState('');
  const [alertSearch, setAlertSearch] = useState('');

  const writePromoPayload = () => {
    const payload = {
      id: crypto.randomUUID(),
      title: promoTitle.trim(),
      body: promoBody.trim(),
      cta: promoCta.trim() || 'GOT IT',
      trigger: promoTrigger,
      createdAt: new Date().toISOString(),
      audience: promoAudience,
    };
    if (!payload.title || !payload.body) return;
    if (promoAudience === 'teacher' || promoAudience === 'both') {
      window.localStorage.setItem('sm_company_promo_teacher', JSON.stringify(payload));
    }
    if (promoAudience === 'student' || promoAudience === 'both') {
      window.localStorage.setItem('sm_company_promo_student', JSON.stringify(payload));
    }
    void fetch('/api/company-promos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audience: promoAudience, payload }),
    });
    setIsPromoOpen(false);
  };

  const writeAlertPayload = () => {
    const payload = {
      id: crypto.randomUUID(),
      title: alertTitle.trim(),
      body: alertBody.trim(),
      color: alertColor,
      persistence: alertPersistence,
      createdAt: new Date().toISOString(),
      audience: alertAudience,
    };
    if (!payload.title || !payload.body) return;
    if (alertAudience === 'teacher' || alertAudience === 'both') {
      window.localStorage.setItem('sm_company_alert_teacher', JSON.stringify(payload));
    }
    if (alertAudience === 'student' || alertAudience === 'both') {
      window.localStorage.setItem('sm_company_alert_student', JSON.stringify(payload));
    }
    void fetch('/api/company-alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audience: alertAudience, payload }),
    });
    setIsAlertOpen(false);
  };

  const loadPromoHistory = async () => {
    try {
      const response = await fetch('/api/company-promos', { cache: 'no-store' });
      if (!response.ok) return;
      const data = (await response.json()) as {
        promos?: { history?: typeof promoHistory };
      };
      setPromoHistory(data.promos?.history ?? []);
    } catch {
      setPromoHistory([]);
    }
  };

  const loadAlertHistory = async () => {
    try {
      const response = await fetch('/api/company-alerts', { cache: 'no-store' });
      if (!response.ok) return;
      const data = (await response.json()) as {
        alerts?: { history?: typeof alertHistory };
      };
      setAlertHistory(data.alerts?.history ?? []);
    } catch {
      setAlertHistory([]);
    }
  };

  const handleRemovePromo = async (id: string) => {
    await fetch(`/api/company-promos?id=${id}`, { method: 'DELETE' });
    await loadPromoHistory();
    try {
      const channel = new BroadcastChannel('sm-company-promos');
      channel.postMessage({ type: 'promo-removed', id });
      channel.close();
    } catch {
      // ignore
    }
  };

  const handleRemoveAlert = async (id: string) => {
    await fetch(`/api/company-alerts?id=${id}`, { method: 'DELETE' });
    await loadAlertHistory();
    try {
      const channel = new BroadcastChannel('sm-company-alerts');
      channel.postMessage({ type: 'alert-removed', id });
      channel.close();
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
            Overview
          </p>
          <h1 className="text-3xl font-semibold text-[var(--c-1f1f1d)] mt-2">
            Dashboard
          </h1>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            Choose a workspace to jump into a focused view.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
          <TimeBadge label="Melbourne" timeZone="Australia/Melbourne" />
          <TimeBadge label="Sacramento" timeZone="America/Los_Angeles" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <a
          href="/company/lesson-library"
          className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm transition hover:border-[color:var(--c-c8102e)]/40 hover:shadow-md"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Lesson Library
          </p>
          <p className="text-3xl font-semibold mt-3 text-[var(--c-1f1f1d)]">
            128 Packs
          </p>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            Refresh content, uploads, and releases.
          </p>
        </a>
        <a
          href="/subscriptions"
          className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm transition hover:border-[color:var(--c-c8102e)]/40 hover:shadow-md"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Subscriptions
          </p>
          <p className="text-3xl font-semibold mt-3 text-[var(--c-1f1f1d)]">
            {activeStudents.toLocaleString('en-US')}
          </p>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            Students billed at $9 per month.
          </p>
        </a>
        <a
          href="/accounts"
          className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm transition hover:border-[color:var(--c-c8102e)]/40 hover:shadow-md"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Accounts
          </p>
          <p className="text-3xl font-semibold mt-3 text-[var(--c-1f1f1d)]">
            {activeTeachers.toLocaleString('en-US')}
          </p>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            Active teachers across the network.
          </p>
        </a>
        <a
          href="/company/messages"
          className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm transition hover:border-[color:var(--c-c8102e)]/40 hover:shadow-md"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Messages
          </p>
          <p className="text-3xl font-semibold mt-3 text-[var(--c-1f1f1d)]">
            24 Threads
          </p>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            Active teacher conversations.
          </p>
        </a>
      </div>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Quick Promo
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
            Send a quick promo message
          </h2>
          <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
            Opens a modal for teachers or students when they are in their account.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPromoOpen(true)}
              className="rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)] transition hover:brightness-110"
            >
              Create Promo
            </button>
            <button
              type="button"
              onClick={() => {
                setIsPromoHistoryOpen(true);
                void loadPromoHistory();
              }}
              className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
            >
              View History
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Dashboard Alert
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
            Add an alert to dashboards
          </h2>
          <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
            Pick the color and choose if it persists until dismissed.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsAlertOpen(true)}
              className="rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)] transition hover:brightness-110"
            >
              Create Alert
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAlertHistoryOpen(true);
                void loadAlertHistory();
              }}
              className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
            >
              View History
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
              Company Workstreams
            </p>
            <h2 className="text-2xl font-semibold text-[var(--c-1f1f1d)] mt-2">
              Jump Back Into Key Areas
            </h2>
            <p className="text-sm text-[var(--c-6f6c65)] mt-2">
              Prioritize the next action across content, billing, accounts, and messaging.
            </p>
          </div>
          <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-1 text-xs text-[var(--c-6f6c65)]">
            Updated today
          </span>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              label: 'Lesson Library',
              note: 'Review new uploads and release dates.',
              href: '/company/lesson-library',
            },
            {
              label: 'Subscriptions',
              note: 'Monitor student counts and next billing.',
              href: '/subscriptions',
            },
            {
              label: 'Accounts',
              note: 'Teacher roster, statuses, and student lists.',
              href: '/accounts',
            },
            {
              label: 'Messages',
              note: 'Respond to teacher outreach.',
              href: '/company/messages',
            },
            {
              label: 'Message Review',
              note: 'Audit sentiment and response times.',
              href: '/company/messages',
            },
          ].map(card => (
            <a
              key={card.label}
              href={card.href}
              className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-5 text-left transition hover:border-[color:var(--c-c8102e)]/30 hover:bg-[var(--c-ffffff)]"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                {card.label}
              </p>
              <p className="mt-3 text-sm text-[var(--c-6f6c65)]">
                {card.note}
              </p>
            </a>
          ))}
        </div>
      </section>

      {isPromoOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsPromoOpen(false)}
          />
          <div className="relative w-full max-w-xl rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-xl">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
              Quick Promo Message
            </p>
            <h3 className="mt-2 text-xl font-semibold text-[var(--c-1f1f1d)]">
              Deliver a message on next sign-in
            </h3>
            <div className="mt-5 grid gap-4">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Title
                <input
                  type="text"
                  value={promoTitle}
                  onChange={event => setPromoTitle(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                />
              </label>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Message
                <textarea
                  value={promoBody}
                  onChange={event => setPromoBody(event.target.value)}
                  className="mt-2 min-h-[120px] w-full resize-none rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                />
              </label>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Promo Image
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Upload image"
                    className="w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                  />
                  <button
                    type="button"
                    className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[var(--c-c8102e)] hover:text-[var(--c-c8102e)]"
                  >
                    Upload
                  </button>
                </div>
              </label>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Button Text
                <input
                  type="text"
                  value={promoCta}
                  onChange={event => setPromoCta(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                />
              </label>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Audience
                <select
                  value={promoAudience}
                  onChange={event => setPromoAudience(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                >
                  <option value="teacher">Teachers</option>
                  <option value="student">Students</option>
                  <option value="both">Teacher + Student</option>
                </select>
              </label>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Show
                <select
                  value={promoTrigger}
                  onChange={event => setPromoTrigger(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                >
                  <option value="dashboard">Next dashboard visit</option>
                  <option value="lesson-library">On lesson library visit</option>
                  <option value="login">On next login</option>
                  <option value="instant">Instant</option>
                </select>
              </label>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setIsPromoOpen(false)}
                className="w-full rounded-full border border-[var(--c-ecebe7)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={writePromoPayload}
                className="w-full rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)] transition hover:brightness-110"
              >
                Send Promo
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isAlertOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsAlertOpen(false)}
          />
          <div className="relative w-full max-w-xl rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-xl">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
              Dashboard Alert
            </p>
            <h3 className="mt-2 text-xl font-semibold text-[var(--c-1f1f1d)]">
              Create a themed alert
            </h3>
            <div className="mt-5 grid gap-4">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Title
                <input
                  type="text"
                  value={alertTitle}
                  onChange={event => setAlertTitle(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                />
              </label>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Message
                <textarea
                  value={alertBody}
                  onChange={event => setAlertBody(event.target.value)}
                  className="mt-2 min-h-[120px] w-full resize-none rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  Audience
                  <select
                    value={alertAudience}
                    onChange={event => setAlertAudience(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                  >
                    <option value="teacher">Teachers</option>
                    <option value="student">Students</option>
                    <option value="both">Teacher + Student</option>
                  </select>
                </label>
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  Background
                  <select
                    value={alertColor}
                    onChange={event => setAlertColor(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                  >
                    <option value="amber">Warm Amber</option>
                    <option value="blue">Soft Blue</option>
                    <option value="sage">Sage</option>
                  </select>
                </label>
              </div>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Visibility
                <select
                  value={alertPersistence}
                  onChange={event => setAlertPersistence(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                >
                  <option value="once">Next visit only</option>
                  <option value="persist">Persist until dismissed</option>
                </select>
              </label>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setIsAlertOpen(false)}
                className="w-full rounded-full border border-[var(--c-ecebe7)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={writeAlertPayload}
                className="w-full rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)] transition hover:brightness-110"
              >
                Add Alert
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isPromoHistoryOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsPromoHistoryOpen(false)}
          />
          <div className="relative w-full max-w-2xl rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-xl">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
              Promo History
            </p>
            <div className="mt-4">
              <input
                type="text"
                placeholder="Search promos..."
                value={promoSearch}
                onChange={event => setPromoSearch(event.target.value)}
                className="w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
              />
            </div>
            <div className="mt-4 max-h-[360px] space-y-3 overflow-y-auto">
              {promoHistory
                .filter(item =>
                  `${item.title} ${item.body}`.toLowerCase().includes(promoSearch.toLowerCase()),
                )
                .map(item => (
                  <div
                    key={item.id}
                    className={`rounded-2xl border px-4 py-3 ${item.status === 'removed' ? 'border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] text-[var(--c-9a9892)]' : 'border-[var(--c-ecebe7)] bg-[var(--c-ffffff)]'}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold">
                        {item.title}
                      </p>
                      <span className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                        {item.status === 'removed' ? 'REMOVED' : item.trigger}
                      </span>
                    </div>
                    <p className="mt-2 text-sm">{item.body}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                      <span>{item.audience}</span>
                      <span>{item.cta ?? 'GOT IT'}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleRemovePromo(item.id)}
                        disabled={item.status === 'removed'}
                        className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1 text-xs uppercase tracking-[0.2em] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Remove
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1 text-xs uppercase tracking-[0.2em]"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : null}

      {isAlertHistoryOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsAlertHistoryOpen(false)}
          />
          <div className="relative w-full max-w-2xl rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-xl">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
              Alert History
            </p>
            <div className="mt-4">
              <input
                type="text"
                placeholder="Search alerts..."
                value={alertSearch}
                onChange={event => setAlertSearch(event.target.value)}
                className="w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
              />
            </div>
            <div className="mt-4 max-h-[360px] space-y-3 overflow-y-auto">
              {alertHistory
                .filter(item =>
                  `${item.title} ${item.body}`.toLowerCase().includes(alertSearch.toLowerCase()),
                )
                .map(item => (
                  <div
                    key={item.id}
                    className={`rounded-2xl border px-4 py-3 ${item.status === 'removed' ? 'border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] text-[var(--c-9a9892)]' : 'border-[var(--c-ecebe7)] bg-[var(--c-ffffff)]'}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold">
                        {item.title}
                      </p>
                      <span className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                        {item.status === 'removed' ? 'REMOVED' : item.persistence}
                      </span>
                    </div>
                    <p className="mt-2 text-sm">{item.body}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                      <span>{item.audience}</span>
                      <span>{item.color}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleRemoveAlert(item.id)}
                        disabled={item.status === 'removed'}
                        className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1 text-xs uppercase tracking-[0.2em] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Remove
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1 text-xs uppercase tracking-[0.2em]"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Billing Outlook
          </p>
          <h2 className="text-2xl font-semibold text-[var(--c-1f1f1d)] mt-2">
            Monthly Royalties Snapshot
          </h2>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            Estimated from current student counts under the new subscription model.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Total Due
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--c-1f1f1d)]">
                {monthlyRoyaltiesDue.toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Billing Date
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--c-1f1f1d)]">
                Mar 1, 2026
              </p>
            </div>
            <div className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Active Students
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--c-1f1f1d)]">
                {activeStudents.toLocaleString('en-US')}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                At-Risk Accounts
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--c-1f1f1d)]">
                14
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Communications
          </p>
          <h2 className="text-2xl font-semibold text-[var(--c-1f1f1d)] mt-2">
            Teacher Messaging Focus
          </h2>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            Keep tabs on response times and outbound reminders.
          </p>
          <div className="mt-6 space-y-3">
            {[
              '12 unresolved billing questions',
              '8 onboarding follow-ups needed',
              '6 lesson library updates to announce',
              '4 VIP teachers awaiting response',
            ].map(item => (
              <div
                key={item}
                className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3 text-sm text-[var(--c-3a3935)]"
              >
                {item}
              </div>
            ))}
          </div>
          <a
            href="/company/messages"
            className="mt-4 inline-flex rounded-full border border-[var(--c-ecebe7)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
          >
            Open Message Center
          </a>
        </section>
      </div>
    </div>
  );
}
