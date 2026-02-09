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

type Tier = {
  label: string;
  min: number;
  max: number | null;
  rate: number;
};

const tiers: Tier[] = [
  { label: 'Tier 1', min: 1, max: 15, rate: 3.0 },
  { label: 'Tier 2', min: 16, max: 25, rate: 2.75 },
  { label: 'Tier 3', min: 26, max: 35, rate: 2.5 },
  { label: 'Tier 4', min: 36, max: null, rate: 2.25 },
];

const flatRate = 9;
const lessonsPerStudent = 4;

function rateForStudents(students: number) {
  return (
    tiers.find(tier => students >= tier.min && (tier.max === null || students <= tier.max))
      ?.rate ?? 3
  );
}

function formatCurrency(value: number) {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

export default function RoyaltiesPage() {
  const rows = teacherRows as TeacherRow[];
  const pageSize = 8;
  const [upPage, setUpPage] = useState(1);
  const [downPage, setDownPage] = useState(1);
  const totals = rows.reduce(
    (acc, row) => {
      const tierRate = rateForStudents(row.currentStudents);
      const oldTotal = row.currentStudents * lessonsPerStudent * tierRate;
      const newTotal = row.currentStudents * flatRate;
      acc.oldTotal += oldTotal;
      acc.newTotal += newTotal;
      acc.students += row.currentStudents;
      acc.avgRate += tierRate;
      return acc;
    },
    { oldTotal: 0, newTotal: 0, students: 0, avgRate: 0 },
  );
  const averageRate = totals.avgRate / rows.length;
  const delta = totals.newTotal - totals.oldTotal;

  const tierSummary = tiers.map(tier => {
    const matching = rows.filter(row => {
      if (tier.max === null) return row.currentStudents >= tier.min;
      return row.currentStudents >= tier.min && row.currentStudents <= tier.max;
    });
    const students = matching.reduce((sum, row) => sum + row.currentStudents, 0);
    const oldTotal = matching.reduce(
      (sum, row) =>
        sum + row.currentStudents * lessonsPerStudent * rateForStudents(row.currentStudents),
      0,
    );
    return {
      ...tier,
      teachers: matching.length,
      students,
      oldTotal,
      newTotal: students * flatRate,
    };
  });

  const topIncrease = useMemo(
    () =>
      [...rows]
        .map(row => {
          const oldTotal =
            row.currentStudents *
            lessonsPerStudent *
            rateForStudents(row.currentStudents);
          const newTotal = row.currentStudents * flatRate;
          return {
            id: row.id,
            name: row.name,
            region: row.region,
            students: row.currentStudents,
            delta: newTotal - oldTotal,
          };
        })
        .sort((a, b) => b.delta - a.delta),
    [rows],
  );
  const topDecrease = useMemo(
    () =>
      [...rows]
        .map(row => {
          const oldTotal =
            row.currentStudents *
            lessonsPerStudent *
            rateForStudents(row.currentStudents);
          const newTotal = row.currentStudents * flatRate;
          return {
            id: row.id,
            name: row.name,
            region: row.region,
            students: row.currentStudents,
            delta: newTotal - oldTotal,
          };
        })
        .sort((a, b) => a.delta - b.delta),
    [rows],
  );
  const upTotalPages = Math.max(1, Math.ceil(topIncrease.length / pageSize));
  const downTotalPages = Math.max(1, Math.ceil(topDecrease.length / pageSize));

  const pagedIncrease = useMemo(() => {
    const start = (upPage - 1) * pageSize;
    return topIncrease.slice(start, start + pageSize);
  }, [pageSize, topIncrease, upPage]);

  const pagedDecrease = useMemo(() => {
    const start = (downPage - 1) * pageSize;
    return topDecrease.slice(start, start + pageSize);
  }, [pageSize, topDecrease, downPage]);

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
            Royalties
          </p>
          <h1 className="text-3xl font-semibold text-[var(--c-1f1f1d)] mt-2">
            Royalties Model Comparison
          </h1>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2 max-w-2xl">
            Side-by-side view of the honor-system lesson royalties versus the new
            flat monthly fee, based on current student counts.
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Assumptions Used
          </p>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            4 lessons per student · tiered royalty rate · $9 flat fee
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Old Model Total
          </p>
          <p className="text-4xl font-semibold mt-3 text-[var(--c-1f1f1d)]">
            {formatCurrency(totals.oldTotal)}
          </p>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            Based on tiered $/lesson rates
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            New Model Total
          </p>
          <p className="text-4xl font-semibold mt-3 text-[var(--c-1f1f1d)]">
            {formatCurrency(totals.newTotal)}
          </p>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            {totals.students.toLocaleString('en-US')} students billed at $9
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Net Change
          </p>
          <p className="text-4xl font-semibold mt-3 text-[var(--c-1f1f1d)]">
            {formatCurrency(delta)}
          </p>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            Avg tier rate: ${averageRate.toFixed(2)} per lesson
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
              Tier Assumptions
            </p>
            <h2 className="text-2xl font-semibold text-[var(--c-1f1f1d)] mt-2">
              Honor-System Lesson Rates (Estimated)
            </h2>
            <p className="text-sm text-[var(--c-6f6c65)] mt-2">
              Placeholder breakpoints to reflect lower $/lesson at higher student counts.
            </p>
          </div>
          <div className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-1 text-xs text-[var(--c-6f6c65)]">
            Replace with real rates anytime
          </div>
        </div>
        <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--c-ecebe7)]">
          <table className="w-full text-left text-base">
            <thead className="bg-[var(--c-fcfcfb)] text-sm uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
              <tr>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3">Student Range</th>
                <th className="px-4 py-3">$/Lesson</th>
                <th className="px-4 py-3">Teachers</th>
                <th className="px-4 py-3">Old Total</th>
                <th className="px-4 py-3">New Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--c-ecebe7)]">
              {tierSummary.map(tier => (
                <tr key={tier.label} className="bg-[var(--c-ffffff)]">
                  <td className="px-4 py-4 font-semibold text-[var(--c-1f1f1d)]">
                    {tier.label}
                  </td>
                  <td className="px-4 py-4 text-[var(--c-6f6c65)]">
                    {tier.max ? `${tier.min}-${tier.max}` : `${tier.min}+`}
                  </td>
                  <td className="px-4 py-4">${tier.rate.toFixed(2)}</td>
                  <td className="px-4 py-4">{tier.teachers}</td>
                  <td className="px-4 py-4">{formatCurrency(tier.oldTotal)}</td>
                  <td className="px-4 py-4">{formatCurrency(tier.newTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                Biggest Upside
              </p>
              <h2 className="text-2xl font-semibold text-[var(--c-1f1f1d)] mt-2">
                Teachers with Largest Monthly Lift
              </h2>
            </div>
          </div>
          <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--c-ecebe7)]">
            <table className="w-full text-left text-base">
              <thead className="bg-[var(--c-fcfcfb)] text-sm uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                <tr>
                  <th className="px-4 py-3">Teacher</th>
                  <th className="px-4 py-3">Students</th>
                  <th className="px-4 py-3">Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--c-ecebe7)]">
                {pagedIncrease.map(row => (
                  <tr key={`up-${row.id}`} className="bg-[var(--c-ffffff)]">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-[var(--c-1f1f1d)]">
                        {row.name}
                      </p>
                      <p className="text-xs text-[var(--c-6f6c65)]">
                        {row.region}
                      </p>
                    </td>
                    <td className="px-4 py-4">{row.students}</td>
                    <td className="px-4 py-4 text-emerald-600">
                      {formatCurrency(row.delta)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--c-6f6c65)]">
            <span>
              Showing {(upPage - 1) * pageSize + 1}-
              {Math.min(upPage * pageSize, topIncrease.length)} of{' '}
              {topIncrease.length}
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

        <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                Biggest Headwind
              </p>
              <h2 className="text-2xl font-semibold text-[var(--c-1f1f1d)] mt-2">
                Teachers with Largest Monthly Drop
              </h2>
            </div>
          </div>
          <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--c-ecebe7)]">
            <table className="w-full text-left text-base">
              <thead className="bg-[var(--c-fcfcfb)] text-sm uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                <tr>
                  <th className="px-4 py-3">Teacher</th>
                  <th className="px-4 py-3">Students</th>
                  <th className="px-4 py-3">Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--c-ecebe7)]">
                {pagedDecrease.map(row => (
                  <tr key={`down-${row.id}`} className="bg-[var(--c-ffffff)]">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-[var(--c-1f1f1d)]">
                        {row.name}
                      </p>
                      <p className="text-xs text-[var(--c-6f6c65)]">
                        {row.region}
                      </p>
                    </td>
                    <td className="px-4 py-4">{row.students}</td>
                    <td className="px-4 py-4 text-red-600">
                      {formatCurrency(row.delta)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--c-6f6c65)]">
            <span>
              Showing {(downPage - 1) * pageSize + 1}-
              {Math.min(downPage * pageSize, topDecrease.length)} of{' '}
              {topDecrease.length}
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
      </div>
    </div>
  );
}
