'use client';

import { useMemo, useState } from 'react';

type OrderRow = {
  id: string;
  buyer: string;
  items: string;
  total: number;
  status: 'Paid' | 'Pending' | 'Refunded';
  date: string;
};

const teacherItems = [
  'Foundation Level 1',
  'Foundation Level 2',
  'Development Level 1',
  'Development Level 2',
  'Curriculum Guide Bundle',
  'Supplemental: Chord Sheets',
  'Supplemental: Rhythm Studies',
  'Lesson Pack: Teaching Toolkit',
];

const studentItems = [
  'Lesson Pack: Rhythm Lab',
  'Lesson Pack: Sight Reading',
  'Curriculum Guide: Prep',
  'Supplemental: Ear Training',
  'Lesson Pack: Practice Sprint',
  'Lesson Pack: Melody Builder',
  'Supplemental: Theory Basics',
  'Lesson Pack: Performance Set',
];

const teacherBuyers = [
  'S. Hayes',
  'M. Lin',
  'E. Grant',
  'J. Ortiz',
  'T. Moss',
  'R. Patel',
  'K. Boyd',
  'D. Nguyen',
];

const studentBuyers = [
  'A. Keller',
  'N. Brooks',
  'L. Park',
  'R. Cruz',
  'S. Reed',
  'C. Walsh',
  'M. Tran',
  'I. Young',
];

const statusPool: OrderRow['status'][] = ['Paid', 'Paid', 'Paid', 'Pending', 'Refunded'];

function makeOrders(
  prefix: string,
  startId: number,
  buyers: string[],
  items: string[],
  baseTotal: number,
): OrderRow[] {
  return Array.from({ length: 40 }, (_, index) => {
    const total =
      baseTotal +
      ((index * 9) % 5) * 15 +
      (index % 3) * 10;
    const day = 10 - (index % 10);
    const month = index < 20 ? 'Feb' : 'Jan';
    const status = statusPool[index % statusPool.length];
    return {
      id: `${prefix}-${startId - index}`,
      buyer: buyers[index % buyers.length],
      items: items[index % items.length],
      total,
      status,
      date: `${month} ${String(day).padStart(2, '0')}, 2026`,
    };
  });
}

const teacherOrders = makeOrders('T', 10492, teacherBuyers, teacherItems, 180);
const studentOrders = makeOrders('S', 23891, studentBuyers, studentItems, 35);

const summaryCards = [
  {
    label: 'Total Orders (30 days)',
    value: '312',
    note: 'Teacher + student curriculum',
  },
  {
    label: 'Avg Order Value',
    value: '$68',
    note: 'All curriculum orders',
  },
  {
    label: 'Refund Rate',
    value: '1.8%',
    note: 'Rolling 90 days',
  },
  {
    label: 'Curriculum Revenue',
    value: '$128,430',
    note: 'Last 6 months',
  },
  {
    label: 'Teacher Orders (30 days)',
    value: '186',
    note: '$78,240 total',
  },
  {
    label: 'Student Orders (30 days)',
    value: '126',
    note: '$25,980 total',
  },
];

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
  rows,
}: {
  title: string;
  subtitle: string;
  rows: OrderRow[];
}) {
  const pageSize = 15;
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<keyof OrderRow>('date');
  const [sortDir, setSortDir] = useState<'ASC' | 'DSC'>('DSC');
  const [page, setPage] = useState(1);
  const filteredRows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(row =>
      `${row.id} ${row.buyer} ${row.items} ${row.status} ${row.date}`
        .toLowerCase()
        .includes(needle),
    );
  }, [query, rows]);
  const sortedRows = useMemo(() => {
    const next = [...filteredRows];
    next.sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];
      const direction = sortDir === 'ASC' ? 1 : -1;
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return direction * (aValue - bValue);
      }
      return direction * String(aValue).localeCompare(String(bValue));
    });
    return next;
  }, [filteredRows, sortDir, sortKey]);
  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [page, sortedRows]);

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
        <button
          type="button"
          className="rounded-full border border-[var(--c-ecebe7)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
        >
          Export CSV
        </button>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
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
        <div className="rounded-full border border-[var(--c-ecebe7)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
          Sort: {sortKey}
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
            <tr>
              <th className="pb-3 font-semibold">
                <button type="button" onClick={() => handleSort('id')}>
                  Order
                </button>
              </th>
              <th className="pb-3 font-semibold">
                <button type="button" onClick={() => handleSort('buyer')}>
                  Buyer
                </button>
              </th>
              <th className="pb-3 font-semibold">
                <button type="button" onClick={() => handleSort('items')}>
                  Items
                </button>
              </th>
              <th className="pb-3 font-semibold">
                <button type="button" onClick={() => handleSort('total')}>
                  Total
                </button>
              </th>
              <th className="pb-3 font-semibold">
                <button type="button" onClick={() => handleSort('status')}>
                  Status
                </button>
              </th>
              <th className="pb-3 font-semibold">
                <button type="button" onClick={() => handleSort('date')}>
                  Date
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="text-[var(--c-1f1f1d)]">
            {pagedRows.map(row => (
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
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--c-6f6c65)]">
        <span>
          Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sortedRows.length)} of{' '}
          {sortedRows.length}
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
          {summaryCards.map(card => (
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
          ))}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <OrdersTable
          title="Teacher Orders"
          subtitle="Recent curriculum purchases from teachers."
          rows={teacherOrders}
        />
        <OrdersTable
          title="Student Orders"
          subtitle="Recent curriculum purchases from students."
          rows={studentOrders}
        />
      </div>
    </div>
  );
}
