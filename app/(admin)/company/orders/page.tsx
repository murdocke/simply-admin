'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type OrderRow = {
  id: string;
  buyer: string;
  items: string;
  total: number;
  status: 'Paid' | 'Pending' | 'Refunded';
  date: string;
};

type SummaryResponse = {
  subscriptions: {
    teacherTotal: number;
    teacherCount: number;
    studentTotal: number;
    studentCount: number;
    pendingCount: number;
    pendingTotal: number;
  };
  curriculum: {
    total: number;
    count: number;
    avgOrderValue: number;
    refundRate: number;
    teacherTotal: number;
    teacherCount: number;
    studentTotal: number;
    studentCount: number;
  };
};

function StatusPill({ status }: { status: string }) {
  const styles =
    status === 'Paid'
      ? 'bg-[var(--c-e7eddc)] text-[var(--c-3f4f3b)]'
      : status === 'Pending'
        ? 'bg-[var(--c-fff7e8)] text-[var(--c-7a4a17)]'
        : 'bg-[var(--c-f7f7f5)] text-[var(--c-9a9892)]';
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${styles}`}>
      {status}
    </span>
  );
}

function OrdersTable({
  title,
  subtitle,
  kind,
}: {
  title: string;
  subtitle: string;
  kind: string;
}) {
  const pageSize = 25;
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<keyof OrderRow>('date');
  const [sortDir, setSortDir] = useState<'ASC' | 'DSC'>('DSC');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showLoading, setShowLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setShowLoading(false);
    const delay = window.setTimeout(() => {
      setShowLoading(true);
    }, 260);
    const params = new URLSearchParams({
      kind,
      page: String(page),
      pageSize: String(pageSize),
      sortKey,
      sortDir,
      query,
    });
    fetch(`/api/orders?${params.toString()}`, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async response => {
        if (!response.ok) throw new Error('Failed to load orders');
        return (await response.json()) as { rows: OrderRow[]; total: number };
      })
      .then(data => {
        setRows(data.rows);
        setTotal(data.total);
      })
      .catch(error => {
        if (error instanceof Error && error.name === 'AbortError') return;
      })
      .finally(() => {
        window.clearTimeout(delay);
        setShowLoading(false);
        setLoading(false);
      });
  }, [kind, page, pageSize, query, sortDir, sortKey]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const handleSort = (key: keyof OrderRow) => {
    if (key === sortKey) {
      setSortDir(current => (current === 'ASC' ? 'DSC' : 'ASC'));
    } else {
      setSortKey(key);
      setSortDir('ASC');
    }
    setPage(1);
  };

  return (
    <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
            {title}
          </p>
          <p className="mt-2 text-sm text-[var(--c-6f6c65)]">{subtitle}</p>
        </div>
        <input
          type="search"
          value={query}
          onChange={event => {
            setQuery(event.target.value);
            setPage(1);
          }}
          placeholder="Search orders..."
          className="w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)] sm:max-w-xs"
        />
      </div>
      <div className="relative mt-5 overflow-x-auto">
        <div className={`transition-opacity ${loading || showLoading ? 'opacity-35' : 'opacity-100'}`}>
          <table className="w-full min-w-[640px] table-fixed text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
            <tr>
              <th className="w-24 pb-3 font-semibold">
                <button
                  type="button"
                  onClick={() => handleSort('id')}
                  className="transition hover:text-[var(--c-1f1f1d)]"
                >
                  Order
                </button>
              </th>
              <th className="w-36 pb-3 font-semibold">
                <button
                  type="button"
                  onClick={() => handleSort('buyer')}
                  className="transition hover:text-[var(--c-1f1f1d)]"
                >
                  Buyer
                </button>
              </th>
              <th className="w-[26rem] pb-3 font-semibold">
                <button
                  type="button"
                  onClick={() => handleSort('items')}
                  className="transition hover:text-[var(--c-1f1f1d)]"
                >
                  Items
                </button>
              </th>
              <th className="w-24 pb-3 font-semibold">
                <button
                  type="button"
                  onClick={() => handleSort('total')}
                  className="transition hover:text-[var(--c-1f1f1d)]"
                >
                  Total
                </button>
              </th>
              <th className="w-28 pb-3 font-semibold">
                <button
                  type="button"
                  onClick={() => handleSort('status')}
                  className="transition hover:text-[var(--c-1f1f1d)]"
                >
                  Status
                </button>
              </th>
              <th className="w-32 pb-3 font-semibold">
                <button
                  type="button"
                  onClick={() => handleSort('date')}
                  className="transition hover:text-[var(--c-1f1f1d)]"
                >
                  Date
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="text-[var(--c-1f1f1d)]">
            {rows.map(row => (
              <tr key={row.id} className="border-t border-[var(--c-ecebe7)]">
                <td className="py-4 font-semibold">{row.id}</td>
                <td className="py-4">{row.buyer}</td>
                <td className="py-4 text-[var(--c-6f6c65)]">{row.items}</td>
                <td className="py-4">${row.total}</td>
                <td className="py-4">
                  <StatusPill status={row.status} />
                </td>
                <td className="py-4 text-[var(--c-6f6c65)]">{row.date}</td>
              </tr>
            ))}
            {!loading && rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-[var(--c-6f6c65)]">
                  No orders match this search.
                </td>
              </tr>
            ) : null}
          </tbody>
          </table>
        </div>
        {loading || showLoading ? (
          <>
            <div className="pointer-events-none absolute inset-x-0 top-4 z-10 flex items-start justify-center">
              <div className="flex items-center gap-3 rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)]/90 px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] shadow-sm backdrop-blur-sm">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--c-ecebe7)] border-t-[var(--c-c8102e)]" />
                Loading next page…
              </div>
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex items-end justify-center">
              <div className="flex items-center gap-3 rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)]/90 px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] shadow-sm backdrop-blur-sm">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--c-ecebe7)] border-t-[var(--c-c8102e)]" />
                Loading next page…
              </div>
            </div>
          </>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--c-6f6c65)]">
        <span>
          Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage(current => Math.max(1, current - 1))}
            disabled={page === 1}
            className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1 text-xs uppercase tracking-[0.2em] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-xs uppercase tracking-[0.2em]">
            Page {page} of {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage(current => Math.min(pageCount, current + 1))}
            disabled={page === pageCount}
            className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1 text-xs uppercase tracking-[0.2em] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}

export default function CompanyOrdersPage() {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setSummaryLoading(true);
    fetch('/api/orders?summary=1', { cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error('Failed to load summary');
        return (await response.json()) as SummaryResponse;
      })
      .then(data => {
        if (!active) return;
        setSummary(data);
      })
      .catch(() => {
        if (!active) return;
        setSummary(null);
      })
      .finally(() => {
        if (!active) return;
        setSummaryLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const summaryCards = useMemo(() => {
    if (!summary) return [];
    return [
      {
        label: 'Subscriptions Teacher',
        value: `$${summary.subscriptions.teacherTotal.toLocaleString()} · ${summary.subscriptions.teacherCount.toLocaleString()}`,
        note: 'Teachers billed this month',
      },
      {
        label: 'Subscriptions Student',
        value: `$${summary.subscriptions.studentTotal.toLocaleString()} · ${summary.subscriptions.studentCount.toLocaleString()}`,
        note: 'Student access billed',
      },
      {
        label: 'Subscriptions Pending',
        value: `${summary.subscriptions.pendingCount.toLocaleString()}`,
        note: `$${summary.subscriptions.pendingTotal.toLocaleString()} pending`,
      },
      {
        label: 'Total Orders (30 days)',
        value: summary.curriculum.count.toLocaleString(),
        note: 'Teacher + student curriculum',
      },
      {
        label: 'Avg Order Value',
        value: `$${Math.round(summary.curriculum.avgOrderValue).toLocaleString()}`,
        note: 'All curriculum orders',
      },
      {
        label: 'Refund Rate',
        value: `${(summary.curriculum.refundRate * 100).toFixed(1)}%`,
        note: 'Rolling 90 days',
      },
      {
        label: 'Curriculum Revenue',
        value: `$${summary.curriculum.total.toLocaleString()}`,
        note: 'Last 6 months',
      },
      {
        label: 'Teacher Orders (30 days)',
        value: summary.curriculum.teacherCount.toLocaleString(),
        note: `$${summary.curriculum.teacherTotal.toLocaleString()} total`,
      },
      {
        label: 'Student Orders (30 days)',
        value: summary.curriculum.studentCount.toLocaleString(),
        note: `$${summary.curriculum.studentTotal.toLocaleString()} total`,
      },
    ];
  }, [summary]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 rounded-3xl border border-[var(--c-ecebe7)] bg-[linear-gradient(135deg,var(--c-ffffff),var(--c-f7f7f5))] p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.4em] text-[var(--c-c8102e)]">
          Orders
        </p>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-[var(--c-1f1f1d)]">
              Curriculum Order Flow
            </h1>
            <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
              Teacher and student curriculum orders, refunds, and revenue signals.
            </p>
          </div>
          <div className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
            Last sync 15 minutes ago
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {summaryLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`summary-skeleton-${index}`}
                className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm"
              >
                <div className="h-3 w-28 rounded-full bg-[var(--c-ecebe7)]" />
                <div className="mt-4 h-6 w-32 rounded-full bg-[var(--c-ecebe7)]" />
                <div className="mt-3 h-3 w-40 rounded-full bg-[var(--c-ecebe7)]" />
              </div>
            ))
          ) : (
            summaryCards.map(card => (
              <div
                key={card.label}
                className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                  {card.label}
                </p>
                <p className="mt-3 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                  {card.value}
                </p>
                <p className="mt-2 text-xs text-[var(--c-6f6c65)]">{card.note}</p>
              </div>
            ))
          )}
        </div>
      </header>

      <div className="grid gap-6">
        <OrdersTable
          title="Teacher Subscription Orders"
          subtitle="Teachers billed on the 1st · $9 per student · 18-29 students each."
          kind="subscription-teacher"
        />
        <OrdersTable
          title="Student Subscription Orders"
          subtitle="Students billed monthly on signup date · $4 per student."
          kind="subscription-student"
        />
      </div>

      <div className="grid gap-6 [@media(min-width:3500px)]:grid-cols-2">
        <OrdersTable
          title="Teacher Orders"
          subtitle="Recent curriculum purchases from teachers."
          kind="curriculum-teacher"
        />
        <OrdersTable
          title="Student Orders"
          subtitle="Recent curriculum purchases from students."
          kind="curriculum-student"
        />
      </div>
    </div>
  );
}
