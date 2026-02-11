'use client';

import { useEffect, useMemo, useState } from 'react';

import teacherRows from '../../../data/teachers-subscriptions.json';
import AssumptionsBar, { type Assumptions } from '../components/assumptions-bar';

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

const defaultTiers: Tier[] = [
  { label: 'Tier 1', min: 1, max: 15, rate: 3.0 },
  { label: 'Tier 2', min: 16, max: 25, rate: 2.75 },
  { label: 'Tier 3', min: 26, max: 35, rate: 2.5 },
  { label: 'Tier 4', min: 36, max: null, rate: 2.25 },
];

const ASSUMPTIONS_KEY = 'sm_assumptions';

function formatCurrency(value: number) {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

export default function RoyaltiesPage() {
  const rows = teacherRows as TeacherRow[];
  const baseAvgStudents = useMemo(() => {
    if (rows.length === 0) return 0;
    const total = rows.reduce((sum, row) => sum + row.currentStudents, 0);
    return total / rows.length;
  }, [rows]);
  const pageSize = 8;
  const [upPage, setUpPage] = useState(1);
  const [downPage, setDownPage] = useState(1);
  const [assumptions, setAssumptions] = useState<Assumptions>(() => ({
    teacherCount: rows.length,
    avgStudentsPerTeacher: Number(baseAvgStudents.toFixed(1)),
    lessonsPerStudent: 4,
    teacherFee: 9,
    studentFee: 4,
  }));
  const [tiers, setTiers] = useState<Tier[]>(defaultTiers);
  const [tierDraft, setTierDraft] = useState<Tier[]>(defaultTiers);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(ASSUMPTIONS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<Assumptions>;
        setAssumptions(current => ({
          teacherCount: parsed.teacherCount ?? current.teacherCount,
          avgStudentsPerTeacher:
            parsed.avgStudentsPerTeacher ?? current.avgStudentsPerTeacher,
          lessonsPerStudent: parsed.lessonsPerStudent ?? current.lessonsPerStudent,
          teacherFee: parsed.teacherFee ?? current.teacherFee,
          studentFee: parsed.studentFee ?? current.studentFee,
        }));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    setTierDraft(tiers);
  }, [tiers]);

  const combinedScale =
    baseAvgStudents > 0 && rows.length > 0
      ? (assumptions.avgStudentsPerTeacher / baseAvgStudents) *
        (assumptions.teacherCount / rows.length)
      : 1;
  const scaledRows = useMemo(
    () =>
      rows.map(row => ({
        ...row,
        lastStudents: Math.max(0, Math.round(row.lastStudents * combinedScale)),
        currentStudents: Math.max(0, Math.round(row.currentStudents * combinedScale)),
      })),
    [rows, combinedScale],
  );

  const rateForStudents = (students: number) =>
    tiers.find(
      tier => students >= tier.min && (tier.max === null || students <= tier.max),
    )?.rate ?? 3;

  const totals = scaledRows.reduce(
    (acc, row) => {
      const tierRate = rateForStudents(row.currentStudents);
      const oldTotal = row.currentStudents * assumptions.lessonsPerStudent * tierRate;
      const newTotal = row.currentStudents * assumptions.teacherFee;
      const studentAccessTotal = row.currentStudents * assumptions.studentFee;
      acc.oldTotal += oldTotal;
      acc.newTotal += newTotal;
      acc.studentAccessTotal += studentAccessTotal;
      acc.students += row.currentStudents;
      acc.avgRate += tierRate;
      return acc;
    },
    { oldTotal: 0, newTotal: 0, studentAccessTotal: 0, students: 0, avgRate: 0 },
  );
  const averageRate = totals.avgRate / Math.max(1, scaledRows.length);
  const combinedNewTotal = totals.newTotal + totals.studentAccessTotal;
  const delta = combinedNewTotal - totals.oldTotal;

  const tierSummary = tiers.map(tier => {
    const matching = scaledRows.filter(row => {
      if (tier.max === null) return row.currentStudents >= tier.min;
      return row.currentStudents >= tier.min && row.currentStudents <= tier.max;
    });
    const students = matching.reduce((sum, row) => sum + row.currentStudents, 0);
    const oldTotal = matching.reduce(
      (sum, row) =>
        sum +
        row.currentStudents *
          assumptions.lessonsPerStudent *
          rateForStudents(row.currentStudents),
      0,
    );
    return {
      ...tier,
      teachers: matching.length,
      students,
      oldTotal,
      newTotal: students * assumptions.teacherFee,
      studentAccessTotal: students * assumptions.studentFee,
      combinedNewTotal: students * (assumptions.teacherFee + assumptions.studentFee),
    };
  });

  const topIncrease = useMemo(
    () =>
      [...scaledRows]
        .map(row => {
          const oldTotal =
            row.currentStudents *
            assumptions.lessonsPerStudent *
            rateForStudents(row.currentStudents);
          const newTotal = row.currentStudents * assumptions.teacherFee;
          return {
            id: row.id,
            name: row.name,
            region: row.region,
            students: row.currentStudents,
            delta: newTotal - oldTotal,
          };
        })
        .sort((a, b) => b.delta - a.delta),
    [scaledRows, assumptions, tiers],
  );
  const topDecrease = useMemo(
    () =>
      [...scaledRows]
        .map(row => {
          const oldTotal =
            row.currentStudents *
            assumptions.lessonsPerStudent *
            rateForStudents(row.currentStudents);
          const newTotal = row.currentStudents * assumptions.teacherFee;
          return {
            id: row.id,
            name: row.name,
            region: row.region,
            students: row.currentStudents,
            delta: newTotal - oldTotal,
          };
        })
        .sort((a, b) => a.delta - b.delta),
    [scaledRows, assumptions, tiers],
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

  const handleAssumptionsChange = (next: Assumptions) => {
    const normalized = {
      teacherCount: Math.max(0, Math.round(next.teacherCount)),
      avgStudentsPerTeacher: Math.max(0, Number(next.avgStudentsPerTeacher)),
      lessonsPerStudent: Math.max(0, Math.round(next.lessonsPerStudent)),
      teacherFee: Math.max(0, Number(next.teacherFee)),
      studentFee: Math.max(0, Number(next.studentFee)),
    };
    setAssumptions(normalized);
    try {
      window.localStorage.setItem(ASSUMPTIONS_KEY, JSON.stringify(normalized));
    } catch {
      // ignore
    }
  };

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
            Side-by-side view of the lesson royalties versus the new flat monthly
            fee plus student access subscription, based on current student counts.
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Assumptions Used
          </p>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            {assumptions.lessonsPerStudent} lessons per student · tiered royalty rate · ${assumptions.teacherFee} teacher fee · ${assumptions.studentFee} student access
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
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
            Teacher Fee Total
          </p>
          <p className="text-4xl font-semibold mt-3 text-[var(--c-1f1f1d)]">
            {formatCurrency(totals.newTotal)}
          </p>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            {totals.students.toLocaleString('en-US')} students billed at ${assumptions.teacherFee}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Student Access Total
          </p>
          <p className="text-4xl font-semibold mt-3 text-[var(--c-1f1f1d)]">
            {formatCurrency(totals.studentAccessTotal)}
          </p>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            {totals.students.toLocaleString('en-US')} students billed at ${assumptions.studentFee}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Combined Total
          </p>
          <p className="text-4xl font-semibold mt-3 text-[var(--c-1f1f1d)]">
            {formatCurrency(combinedNewTotal)}
          </p>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            Net change vs old model: {formatCurrency(delta)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Teachers
          </p>
          <p className="text-4xl font-semibold mt-3 text-[var(--c-1f1f1d)]">
            {assumptions.teacherCount.toLocaleString('en-US')}
          </p>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            Studios modeled in this scenario
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Students
          </p>
          <p className="text-4xl font-semibold mt-3 text-[var(--c-1f1f1d)]">
            {totals.students.toLocaleString('en-US')}
          </p>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            Based on teacher count and average roster
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Lessons
          </p>
          <p className="text-4xl font-semibold mt-3 text-[var(--c-1f1f1d)]">
            {(totals.students * assumptions.lessonsPerStudent).toLocaleString('en-US')}
          </p>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            Total lessons per month modeled
          </p>
        </div>
      </div>

      <AssumptionsBar value={assumptions} onChange={handleAssumptionsChange} />

      <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
              Tier Assumptions
            </p>
            <h2 className="text-2xl font-semibold text-[var(--c-1f1f1d)] mt-2">
              Royalty Lesson Rates (Estimated)
            </h2>
            <p className="text-sm text-[var(--c-6f6c65)] mt-2">
              Breakpoints to reflect lower $/lesson at higher student counts.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setTiers(tierDraft)}
            className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-1f1f1d)] transition hover:border-[var(--c-c8102e)] hover:text-[var(--c-c8102e)]"
          >
            Save
          </button>
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
                <th className="px-4 py-3">Teacher Fee</th>
                <th className="px-4 py-3">Student Access</th>
                <th className="px-4 py-3">Combined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--c-ecebe7)]">
              {tierSummary.map((tier, index) => (
                <tr key={tier.label} className="bg-[var(--c-ffffff)]">
                  <td className="px-4 py-4 font-semibold text-[var(--c-1f1f1d)]">
                    {tier.label}
                  </td>
                  <td className="px-4 py-4 text-[var(--c-6f6c65)]">
                    {tier.max ? `${tier.min}-${tier.max}` : `${tier.min}+`}
                  </td>
                  <td className="px-4 py-4">
                    <input
                      type="number"
                      step="0.05"
                      min={0}
                      className="w-20 rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-1 text-sm text-[var(--c-1f1f1d)]"
                      value={tierDraft[index]?.rate ?? tier.rate}
                      onChange={event => {
                        const next = [...tierDraft];
                        next[index] = {
                          ...next[index],
                          rate: Number(event.target.value),
                        };
                        setTierDraft(next);
                      }}
                    />
                  </td>
                  <td className="px-4 py-4">{tier.teachers}</td>
                  <td className="px-4 py-4">{formatCurrency(tier.oldTotal)}</td>
                  <td className="px-4 py-4">{formatCurrency(tier.newTotal)}</td>
                  <td className="px-4 py-4">
                    {formatCurrency(tier.studentAccessTotal)}
                  </td>
                  <td className="px-4 py-4">
                    {formatCurrency(tier.combinedNewTotal)}
                  </td>
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
