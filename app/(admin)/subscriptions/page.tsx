'use client';

import { useMemo, useState } from 'react';

import teacherRows from '../../../data/teachers-subscriptions.json';

type TeacherRow = {
  id: string;
  name: string;
  region: string;
  lastStudents: number;
  currentStudents: number;
};

export default function SubscriptionsPage() {
  const lastBillingDate = 'Jan 1, 2026';
  const rows = teacherRows as TeacherRow[];
  const pageSize = 20;
  const [page, setPage] = useState(1);
  const watchlistPageSize = 8;
  const [downPage, setDownPage] = useState(1);
  const [upPage, setUpPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [page, rows]);

  const flatRate = 9;
  const totalTeachers = rows.length;
  const totalCurrentStudents = rows.reduce(
    (sum, row) => sum + row.currentStudents,
    0,
  );
  const totalNextBilling = totalCurrentStudents * flatRate;
  const spikeUpRows = rows.filter(
    row => (row.currentStudents - row.lastStudents) / row.lastStudents >= 0.2,
  );
  const spikeDownRows = rows.filter(
    row => (row.currentStudents - row.lastStudents) / row.lastStudents <= -0.2,
  );
  const downTotalPages = Math.max(
    1,
    Math.ceil(spikeDownRows.length / watchlistPageSize),
  );
  const upTotalPages = Math.max(
    1,
    Math.ceil(spikeUpRows.length / watchlistPageSize),
  );
  const pagedSpikeDownRows = useMemo(() => {
    const start = (downPage - 1) * watchlistPageSize;
    return spikeDownRows.slice(start, start + watchlistPageSize);
  }, [downPage, spikeDownRows]);
  const pagedSpikeUpRows = useMemo(() => {
    const start = (upPage - 1) * watchlistPageSize;
    return spikeUpRows.slice(start, start + watchlistPageSize);
  }, [upPage, spikeUpRows]);

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
            Subscriptions
          </p>
          <h1 className="text-3xl font-semibold text-[var(--c-1f1f1d)] mt-2">
            Teacher Subscription Billing
          </h1>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2 max-w-2xl">
            Move from honor-system lesson reporting to a predictable per-student
            monthly charge billed at the start of each month.
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            New Billing Rule
          </p>
          <p className="text-2xl font-semibold mt-2 text-[var(--c-1f1f1d)]">
            ${flatRate} per student
          </p>
          <p className="text-sm text-[var(--c-6f6c65)] mt-1">
            Charged on the 1st of every month
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Teachers Billed
          </p>
          <p className="text-4xl font-semibold mt-3 text-[var(--c-1f1f1d)]">
            {totalTeachers.toLocaleString('en-US')}
          </p>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            Active studios in the billing cycle
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Current Students
          </p>
          <p className="text-4xl font-semibold mt-3 text-[var(--c-1f1f1d)]">
            {totalCurrentStudents.toLocaleString('en-US')}
          </p>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            Counted for next monthly charge
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Next Billing Total
          </p>
          <p className="text-4xl font-semibold mt-3 text-[var(--c-1f1f1d)]">
            {totalNextBilling.toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD',
              maximumFractionDigits: 0,
            })}
          </p>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            Projected for Mar 1, 2026
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
              Billing Roster
            </p>
            <h2 className="text-2xl font-semibold text-[var(--c-1f1f1d)] mt-2">
              Teachers Scheduled for Billing
            </h2>
            <p className="text-sm text-[var(--c-6f6c65)] mt-2">
              Compare last month&apos;s billed count to the current student
              roster to preview the next charge.
            </p>
          </div>
          <div className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-1 text-xs text-[var(--c-6f6c65)]">
            Next run: Mar 1, 2026
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--c-ecebe7)]">
          <table className="w-full text-left text-base">
            <thead className="bg-[var(--c-fcfcfb)] text-sm uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
              <tr>
                <th className="px-4 py-3">Teacher</th>
                <th className="px-4 py-3">Last Billing</th>
                <th className="px-4 py-3">Last Students</th>
                <th className="px-4 py-3">Current Students</th>
                <th className="px-4 py-3">Next Billing</th>
                <th className="px-4 py-3">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--c-ecebe7)]">
              {pagedRows.map(row => {
                const lastBilled = row.lastStudents * flatRate;
                const nextBilling = row.currentStudents * flatRate;
                const status =
                  row.currentStudents > row.lastStudents
                    ? 'Growing'
                    : row.currentStudents < row.lastStudents
                      ? 'Declining'
                      : 'Stable';
                const trendStyles =
                  status === 'Growing'
                    ? 'bg-[color:var(--c-c8102e)]/10 text-[var(--c-c8102e)]'
                    : status === 'Declining'
                      ? 'bg-[color:var(--c-6f6c65)]/15 text-[var(--c-6f6c65)]'
                      : 'bg-[color:var(--c-1f1f1d)]/10 text-[var(--c-1f1f1d)]';

                return (
                  <tr key={row.id} className="bg-[var(--c-ffffff)]">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-[var(--c-1f1f1d)]">
                        {row.name}
                      </p>
                      <p className="text-xs text-[var(--c-6f6c65)]">
                        {row.region}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-[var(--c-1f1f1d)]">
                      <p className="font-semibold">
                        {lastBilled.toLocaleString('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          maximumFractionDigits: 0,
                        })}
                      </p>
                      <p className="text-xs text-[var(--c-6f6c65)]">
                        {lastBillingDate}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-[var(--c-1f1f1d)]">
                      {row.lastStudents}
                    </td>
                    <td className="px-4 py-4 text-[var(--c-1f1f1d)]">
                      {row.currentStudents}
                    </td>
                    <td className="px-4 py-4 text-[var(--c-1f1f1d)]">
                      {nextBilling.toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        maximumFractionDigits: 0,
                      })}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${trendStyles}`}
                      >
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--c-6f6c65)]">
          <span>
            Showing {(page - 1) * pageSize + 1}-
            {Math.min(page * pageSize, rows.length)} of {rows.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              First
            </button>
            <button
              type="button"
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
              className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
            <button
              type="button"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              Last
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                Watchlist
              </p>
              <h2 className="text-2xl font-semibold text-[var(--c-1f1f1d)] mt-2">
                Major Declines (≤ -20%)
              </h2>
              <p className="text-sm text-[var(--c-6f6c65)] mt-2">
                Teachers with sharp student drops since last billing.
              </p>
            </div>
            <div className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-1 text-xs text-[var(--c-6f6c65)]">
              {spikeDownRows.length} flagged
            </div>
          </div>
          <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--c-ecebe7)]">
            <table className="w-full text-left text-base">
              <thead className="bg-[var(--c-fcfcfb)] text-sm uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                <tr>
                  <th className="px-4 py-3">Teacher</th>
                  <th className="px-4 py-3">Last</th>
                  <th className="px-4 py-3">Current</th>
                  <th className="px-4 py-3">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--c-ecebe7)]">
                {pagedSpikeDownRows.map(row => {
                  const change =
                    (row.currentStudents - row.lastStudents) / row.lastStudents;
                  return (
                    <tr key={`down-${row.id}`} className="bg-[var(--c-ffffff)]">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-[var(--c-1f1f1d)]">
                          {row.name}
                        </p>
                        <p className="text-xs text-[var(--c-6f6c65)]">
                          {row.region}
                        </p>
                      </td>
                      <td className="px-4 py-4">{row.lastStudents}</td>
                      <td className="px-4 py-4">{row.currentStudents}</td>
                      <td className="px-4 py-4 text-red-600">
                        {(change * 100).toFixed(0)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--c-6f6c65)]">
            <span>
              Showing {(downPage - 1) * watchlistPageSize + 1}-
              {Math.min(downPage * watchlistPageSize, spikeDownRows.length)} of{' '}
              {spikeDownRows.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDownPage(1)}
                disabled={downPage === 1}
                className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                First
              </button>
              <button
                type="button"
                onClick={() => setDownPage(prev => Math.max(1, prev - 1))}
                disabled={downPage === 1}
                className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Page {downPage} of {downTotalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setDownPage(prev => Math.min(downTotalPages, prev + 1))
                }
                disabled={downPage === downTotalPages}
                className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
              <button
                type="button"
                onClick={() => setDownPage(downTotalPages)}
                disabled={downPage === downTotalPages}
                className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                Last
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                Watchlist
              </p>
              <h2 className="text-2xl font-semibold text-[var(--c-1f1f1d)] mt-2">
                Major Growth (≥ +20%)
              </h2>
              <p className="text-sm text-[var(--c-6f6c65)] mt-2">
                Teachers with big student gains since last billing.
              </p>
            </div>
            <div className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-1 text-xs text-[var(--c-6f6c65)]">
              {spikeUpRows.length} flagged
            </div>
          </div>
          <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--c-ecebe7)]">
            <table className="w-full text-left text-base">
              <thead className="bg-[var(--c-fcfcfb)] text-sm uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                <tr>
                  <th className="px-4 py-3">Teacher</th>
                  <th className="px-4 py-3">Last</th>
                  <th className="px-4 py-3">Current</th>
                  <th className="px-4 py-3">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--c-ecebe7)]">
                {pagedSpikeUpRows.map(row => {
                  const change =
                    (row.currentStudents - row.lastStudents) / row.lastStudents;
                  return (
                    <tr key={`up-${row.id}`} className="bg-[var(--c-ffffff)]">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-[var(--c-1f1f1d)]">
                          {row.name}
                        </p>
                        <p className="text-xs text-[var(--c-6f6c65)]">
                          {row.region}
                        </p>
                      </td>
                      <td className="px-4 py-4">{row.lastStudents}</td>
                      <td className="px-4 py-4">{row.currentStudents}</td>
                      <td className="px-4 py-4 text-emerald-600">
                        +{(change * 100).toFixed(0)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--c-6f6c65)]">
            <span>
              Showing {(upPage - 1) * watchlistPageSize + 1}-
              {Math.min(upPage * watchlistPageSize, spikeUpRows.length)} of{' '}
              {spikeUpRows.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setUpPage(1)}
                disabled={upPage === 1}
                className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                First
              </button>
              <button
                type="button"
                onClick={() => setUpPage(prev => Math.max(1, prev - 1))}
                disabled={upPage === 1}
                className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Page {upPage} of {upTotalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setUpPage(prev => Math.min(upTotalPages, prev + 1))
                }
                disabled={upPage === upTotalPages}
                className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
              <button
                type="button"
                onClick={() => setUpPage(upTotalPages)}
                disabled={upPage === upTotalPages}
                className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                Last
              </button>
            </div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Model Shift
          </p>
          <h2 className="text-2xl font-semibold text-[var(--c-1f1f1d)] mt-2">
            Honor System to Flat Fee
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-4">
            <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Old Model
              </p>
              <p className="mt-2 text-sm text-[var(--c-1f1f1d)]">
                Students &times; Lessons &times; $3 royalty
              </p>
              <p className="mt-2 text-xs text-[var(--c-6f6c65)]">
                Based on self-reported lesson counts each month.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                New Model
              </p>
              <p className="mt-2 text-sm text-[var(--c-1f1f1d)]">
                Students &times; $9 flat monthly fee
              </p>
              <p className="mt-2 text-xs text-[var(--c-6f6c65)]">
                Charged automatically on the first of each month.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Billing Rules
          </p>
          <h2 className="text-2xl font-semibold text-[var(--c-1f1f1d)] mt-2">
            Operational Guardrails
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-[var(--c-6f6c65)]">
            <li>
              Student counts lock at 11:59 PM on the last day of the month.
            </li>
            <li>
              New enrollments added after lock roll into the next cycle.
            </li>
            <li>
              Refunds applied as billing credits on the following month.
            </li>
            <li>Disputed charges flagged for manual review.</li>
          </ul>
          <div className="mt-6 flex flex-wrap gap-2 text-xs text-[var(--c-6f6c65)]">
            <span className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1">
              Automated invoicing
            </span>
            <span className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1">
              Rate locked at $9
            </span>
            <span className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1">
              Month start charge
            </span>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
              Scenario Planning
            </p>
            <h2 className="text-2xl font-semibold text-[var(--c-1f1f1d)] mt-2">
              Revenue Sensitivity
            </h2>
            <p className="text-sm text-[var(--c-6f6c65)] mt-2">
              Quick levers to estimate how growth or churn impacts monthly
              royalty totals.
            </p>
          </div>
          <div className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-1 text-xs text-[var(--c-6f6c65)]">
            Prototype controls
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
              Growth Lens
            </p>
            <p className="mt-3 text-sm text-[var(--c-1f1f1d)]">
              +10% student growth adds{' '}
              {(totalNextBilling * 0.1).toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0,
              })}{' '}
              per month.
            </p>
            <p className="mt-2 text-xs text-[var(--c-6f6c65)]">
              Based on current roster.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
              Churn Buffer
            </p>
            <p className="mt-3 text-sm text-[var(--c-1f1f1d)]">
              -5% student attrition reduces{' '}
              {(totalNextBilling * 0.05).toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0,
              })}{' '}
              per month.
            </p>
            <p className="mt-2 text-xs text-[var(--c-6f6c65)]">
              Use to plan retention outreach.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
              Cash Timing
            </p>
            <p className="mt-3 text-sm text-[var(--c-1f1f1d)]">
              95% of invoices collected by the 5th.
            </p>
            <p className="mt-2 text-xs text-[var(--c-6f6c65)]">
              Forecasts royalty cash flow.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
