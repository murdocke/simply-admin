'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  VIEW_ROLE_STORAGE_KEY,
  VIEW_TEACHER_STORAGE_KEY,
} from '../../components/auth';

type StudentRecord = {
  id: string;
  teacher: string;
  name: string;
  email: string;
  level: string;
  status: 'Active' | 'Paused' | 'Archived';
  lessonFeeAmount?: string;
  lessonFeePeriod?: 'Per Mo' | 'Per Qtr' | 'Per Yr';
  lessonDay?: string;
  lessonTime?: string;
  lessonDuration?: '30M' | '45M' | '1HR';
  lessonType?: 'Individual' | 'Group';
  lessonLocation?: 'In-Person' | 'Virtual' | 'Home-Visit';
  lessonNotes?: string;
  studentAlert?: string;
  createdAt: string;
  updatedAt: string;
};

type PaymentStatusMap = Record<string, boolean>;
type FeeOverrideMap = Record<string, { prorateAmount?: string; noFee?: boolean }>;

type StoredPaymentStatus = {
  updatedAt: string;
  paid: PaymentStatusMap;
};
type StoredFeeOverrides = {
  updatedAt: string;
  overrides: FeeOverrideMap;
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const monthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
});

const parseFeeAmount = (value?: string) => {
  if (!value) return 0;
  const parsed = Number(value.replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const getMonthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const getMonthOptions = () => {
  const today = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - index, 1);
    return {
      key: getMonthKey(date),
      label: monthFormatter.format(date),
    };
  });
};

export default function TeacherLessonFeesPage() {
  const [teacherName, setTeacherName] = useState<string | null>(null);
  const [teacherLabel, setTeacherLabel] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [viewRole, setViewRole] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusMap>({});
  const [feeOverrides, setFeeOverrides] = useState<FeeOverrideMap>({});
  const [selectedMonth, setSelectedMonth] = useState(getMonthKey(new Date()));
  const [studentSearch, setStudentSearch] = useState('');

  const monthOptions = useMemo(() => getMonthOptions(), []);

  const paymentStorageKey = useMemo(() => {
    if (!teacherName) return null;
    return `sm_lesson_fees:${teacherName}:${selectedMonth}`;
  }, [selectedMonth, teacherName]);
  const overrideStorageKey = useMemo(() => {
    if (!teacherName) return null;
    return `sm_lesson_fees_overrides:${teacherName}:${selectedMonth}`;
  }, [selectedMonth, teacherName]);

  const needsTeacherSelection =
    role === 'company' && viewRole === 'teacher' && !teacherName;

  useEffect(() => {
    const stored = window.localStorage.getItem('sm_user');
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as { username?: string; role?: string };
      if (parsed?.role) setRole(parsed.role);
      if (parsed?.role === 'company') {
        const storedView = window.localStorage.getItem(VIEW_ROLE_STORAGE_KEY);
        if (storedView) setViewRole(storedView);
        const viewTeacherKey = parsed?.username
          ? `${VIEW_TEACHER_STORAGE_KEY}:${parsed.username}`
          : VIEW_TEACHER_STORAGE_KEY;
        const storedTeacher =
          window.localStorage.getItem(viewTeacherKey) ??
          window.localStorage.getItem(VIEW_TEACHER_STORAGE_KEY);
        if (storedView === 'teacher' && storedTeacher) {
          try {
            const selected = JSON.parse(storedTeacher) as {
              username?: string;
              name?: string;
            };
            if (selected?.username) {
              setTeacherName(selected.username);
              setTeacherLabel(selected.name ?? selected.username);
              window.localStorage.setItem(viewTeacherKey, storedTeacher);
              return;
            }
          } catch {
            setTeacherName(null);
            setTeacherLabel(null);
          }
        }
      }
      if (parsed?.username) {
        setTeacherName(parsed.username);
        setTeacherLabel(parsed.username);
      }
    } catch {
      setTeacherName(null);
      setTeacherLabel(null);
      setRole(null);
      setViewRole(null);
    }
  }, []);

  useEffect(() => {
    if (!paymentStorageKey) {
      setPaymentStatus({});
      return;
    }
    const stored = window.localStorage.getItem(paymentStorageKey);
    if (!stored) {
      setPaymentStatus({});
      return;
    }
    try {
      const parsed = JSON.parse(stored) as StoredPaymentStatus;
      setPaymentStatus(parsed?.paid ?? {});
    } catch {
      setPaymentStatus({});
    }
  }, [paymentStorageKey]);

  useEffect(() => {
    if (!overrideStorageKey) {
      setFeeOverrides({});
      return;
    }
    const stored = window.localStorage.getItem(overrideStorageKey);
    if (!stored) {
      setFeeOverrides({});
      return;
    }
    try {
      const parsed = JSON.parse(stored) as StoredFeeOverrides;
      setFeeOverrides(parsed?.overrides ?? {});
    } catch {
      setFeeOverrides({});
    }
  }, [overrideStorageKey]);

  useEffect(() => {
    if (!teacherName) return;
    let isActive = true;
    const fetchStudents = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/students?teacher=${encodeURIComponent(teacherName)}`,
        );
        const data = (await response.json()) as { students: StudentRecord[] };
        if (isActive) {
          setStudents(data.students ?? []);
        }
      } catch {
        if (isActive) setError('Unable to load students right now.');
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    fetchStudents();
    return () => {
      isActive = false;
    };
  }, [teacherName]);

  const activeStudents = useMemo(
    () => students.filter(student => student.status === 'Active'),
    [students],
  );

  const filteredStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();
    if (!query) return activeStudents;
    return activeStudents.filter(student =>
      `${student.name} ${student.email}`.toLowerCase().includes(query),
    );
  }, [activeStudents, studentSearch]);

  const unpaidStudents = useMemo(
    () => filteredStudents.filter(student => !paymentStatus[student.id]),
    [filteredStudents, paymentStatus],
  );

  const paidStudents = useMemo(
    () => filteredStudents.filter(student => paymentStatus[student.id]),
    [filteredStudents, paymentStatus],
  );

  const totalDue = useMemo(
    () =>
      activeStudents.reduce(
        (sum, student) => {
          if (paymentStatus[student.id]) return sum;
          const override = feeOverrides[student.id];
          if (override?.noFee) return sum;
          if (override?.prorateAmount) {
            return sum + parseFeeAmount(override.prorateAmount);
          }
          return sum + parseFeeAmount(student.lessonFeeAmount);
        },
        0,
      ),
    [activeStudents, feeOverrides, paymentStatus],
  );

  const totalPaid = useMemo(
    () =>
      activeStudents.reduce((sum, student) => {
        if (!paymentStatus[student.id]) return sum;
        const override = feeOverrides[student.id];
        if (override?.noFee) return sum;
        if (override?.prorateAmount) {
          return sum + parseFeeAmount(override.prorateAmount);
        }
        return sum + parseFeeAmount(student.lessonFeeAmount);
      }, 0),
    [activeStudents, feeOverrides, paymentStatus],
  );

  const unpaidCount = useMemo(
    () =>
      activeStudents.filter(student => !paymentStatus[student.id]).length,
    [activeStudents, paymentStatus],
  );

  const markPayment = (studentId: string, isPaid: boolean) => {
    setPaymentStatus(current => {
      const next = { ...current, [studentId]: isPaid };
      if (paymentStorageKey) {
        const payload: StoredPaymentStatus = {
          updatedAt: new Date().toISOString(),
          paid: next,
        };
        window.localStorage.setItem(paymentStorageKey, JSON.stringify(payload));
      }
      return next;
    });
    if (!isPaid) {
      updateFeeOverride(studentId, current => ({
        ...current,
        noFee: false,
        prorateAmount: '',
      }));
    }
  };

  const updateFeeOverride = (
    studentId: string,
    updater: (current: FeeOverrideMap[string]) => FeeOverrideMap[string],
  ) => {
    setFeeOverrides(current => {
      const nextOverrides = { ...current, [studentId]: updater(current[studentId]) };
      if (overrideStorageKey) {
        const payload: StoredFeeOverrides = {
          updatedAt: new Date().toISOString(),
          overrides: nextOverrides,
        };
        window.localStorage.setItem(overrideStorageKey, JSON.stringify(payload));
      }
      return nextOverrides;
    });
  };

  const markAll = (isPaid: boolean) => {
    const next: PaymentStatusMap = {};
    activeStudents.forEach(student => {
      next[student.id] = isPaid;
    });
    setPaymentStatus(next);
    if (paymentStorageKey) {
      const payload: StoredPaymentStatus = {
        updatedAt: new Date().toISOString(),
        paid: next,
      };
      window.localStorage.setItem(paymentStorageKey, JSON.stringify(payload));
    }
  };

  const paymentProgress = totalDue
    ? Math.min(100, Math.round((totalPaid / totalDue) * 100))
    : 0;

      return (
        <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
            Teachers
          </p>
          <h1 className="text-3xl font-semibold text-[var(--c-1f1f1d)] mt-2">
            Lesson Fees
          </h1>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            Track each student payment status and close out the month faster.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
            {teacherLabel ? `Studio: ${teacherLabel}` : 'Studio roster'}
          </div>
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={event => setSelectedMonth(event.target.value)}
              className="appearance-none rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 pr-10 text-xs uppercase tracking-[0.2em] text-[var(--c-1f1f1d)]"
            >
              {monthOptions.map(option => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute right-[18px] top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--c-6f6c65)]"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </header>

      {needsTeacherSelection ? (
        <div className="rounded-2xl border border-[var(--c-f2d7db)] bg-[var(--c-fff5f6)] px-4 py-3 text-sm text-[var(--c-8f2f3b)]">
          Choose a teacher in the sidebar to view lesson fees.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-[var(--c-f2d7db)] bg-[var(--c-fff5f6)] px-4 py-3 text-sm text-[var(--c-8f2f3b)]">
          {error}
        </div>
      ) : null}

      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
            Amount Due
          </p>
          <p className="mt-3 text-3xl font-semibold text-[var(--c-1f1f1d)]">
            {currencyFormatter.format(totalDue)}
          </p>
          <p className="mt-1 text-xs text-[var(--c-6f6c65)]">
            {activeStudents.length} active students
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
            Amount Paid In
          </p>
          <p className="mt-3 text-3xl font-semibold text-[var(--c-1f1f1d)]">
            {currencyFormatter.format(totalPaid)}
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--c-f2f1ec)]">
            <div
              className="h-full rounded-full bg-[var(--c-c8102e)] transition-all"
              style={{ width: `${paymentProgress}%` }}
            />
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
            Students Unpaid
          </p>
          <p className="mt-3 text-3xl font-semibold text-[var(--c-1f1f1d)]">
            {unpaidCount}
          </p>
          <p className="mt-1 text-xs text-[var(--c-6f6c65)]">
            {unpaidCount === 0
              ? 'Everyone is caught up.'
              : 'Follow up before month-end.'}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
              Payment Tracker
            </p>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
              {monthOptions.find(option => option.key === selectedMonth)?.label ??
                selectedMonth}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => markAll(true)}
              className="rounded-full border border-[var(--c-e7eddc)] bg-[var(--c-e7eddc)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-3f4a2c)] transition hover:brightness-105"
            >
              Mark All Paid
            </button>
            <button
              type="button"
              onClick={() => markAll(false)}
              className="rounded-full border border-[var(--c-f2d7db)] bg-[var(--c-fff5f6)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-8f2f3b)] transition hover:brightness-105"
            >
              Mark All Unpaid
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
            Search Students
            <input
              value={studentSearch}
              onChange={event => setStudentSearch(event.target.value)}
              placeholder="Search by name or email..."
              className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-2 text-sm text-[var(--c-1f1f1d)] outline-none focus:border-[var(--c-c8102e)] sm:min-w-[280px]"
            />
          </label>
        </div>

        <div className="mt-6">
          {isLoading ? (
            <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-6 text-sm text-[var(--c-6f6c65)]">
              Loading lesson fees...
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-6 text-sm text-[var(--c-6f6c65)]">
              {studentSearch
                ? 'No students match this search.'
                : 'No active students yet. Add students to track fees.'}
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                  Needs Payment
                </p>
                <span className="rounded-full bg-[var(--c-c8102e)] px-4 py-2 text-sm uppercase tracking-[0.2em] text-white">
                  {unpaidStudents.length} unpaid
                </span>
              </div>
              {unpaidStudents.length === 0 ? (
                <div className="mt-3 rounded-2xl border border-[var(--c-e7eddc)] bg-[var(--c-f7fbf0)] px-4 py-4 text-sm text-[var(--c-3f4a2c)]">
                  Everyone is paid for this month.
                </div>
              ) : (
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {unpaidStudents.map(student => {
                    const isPaid = paymentStatus[student.id];
                    const override = feeOverrides[student.id];
                    const lessonFee = parseFeeAmount(student.lessonFeeAmount);
                    const hasBaseFee = lessonFee > 0;
                    const prorateValue = override?.prorateAmount ?? '';
                    const isNoFee = Boolean(override?.noFee);
                    const effectiveFee = isNoFee
                      ? 0
                      : prorateValue
                        ? parseFeeAmount(prorateValue)
                        : lessonFee;
                    return (
                      <div
                        key={student.id}
                        className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4 shadow-sm transition"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                              {student.name}
                            </p>
                            <p className="text-xs text-[var(--c-6f6c65)]">
                              {student.email || 'No email on file'}
                            </p>
                          </div>
                          <span className="rounded-full bg-[var(--c-fce8d6)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-8a5b2b)]">
                            Unpaid
                          </span>
                        </div>

                        <div className="mt-4 grid gap-2 text-xs text-[var(--c-6f6c65)]">
                          <div className="flex items-center justify-between">
                            <span className="uppercase tracking-[0.2em]">Day of Lesson</span>
                            <span className="font-semibold text-[var(--c-1f1f1d)]">
                              {student.lessonDay || '—'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="uppercase tracking-[0.2em]">Lesson Time</span>
                            <span className="font-semibold text-[var(--c-1f1f1d)]">
                              {student.lessonTime || '—'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="uppercase tracking-[0.2em]">Lesson Fee</span>
                            <span className="font-semibold text-[var(--c-1f1f1d)]">
                              {!hasBaseFee ? (
                                <Link
                                  href={`/teachers/students?edit=${student.id}`}
                                  className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
                                >
                                  Set Fee
                                </Link>
                              ) : isNoFee ? (
                                'No fee'
                              ) : effectiveFee ? (
                                `${currencyFormatter.format(effectiveFee)} ${
                                  student.lessonFeePeriod ?? 'Per Mo'
                                }`
                              ) : (
                                'Set fee'
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-3">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                            Monthly Overrides
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--c-6f6c65)]">
                            <label className="flex items-center gap-2 rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-1">
                              <input
                                type="checkbox"
                                checked={isNoFee}
                                onChange={event =>
                                  updateFeeOverride(student.id, current => ({
                                    ...current,
                                    noFee: event.target.checked,
                                    prorateAmount: event.target.checked
                                      ? ''
                                      : current?.prorateAmount ?? '',
                                  }))
                                }
                              />
                              <span className="uppercase tracking-[0.2em]">No Fee</span>
                            </label>
                            <div className="flex items-center gap-2 rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-1">
                              <span className="uppercase tracking-[0.2em]">Prorate</span>
                              <input
                                type="text"
                                value={prorateValue}
                                onChange={event =>
                                  updateFeeOverride(student.id, current => ({
                                    ...current,
                                    prorateAmount: event.target.value,
                                    noFee: false,
                                  }))
                                }
                                placeholder="$0"
                                className="w-20 border-none bg-transparent text-right text-xs text-[var(--c-1f1f1d)] outline-none"
                              />
                            </div>
                          </div>
                          {prorateValue ? (
                            <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                              Prorate applied for this month
                            </p>
                          ) : null}
                        </div>

                        {student.studentAlert ? (
                          <div className="mt-3 rounded-xl border border-[var(--c-f2d7db)] bg-[var(--c-fff5f6)] px-3 py-2 text-xs text-[var(--c-8f2f3b)]">
                            {student.studentAlert}
                          </div>
                        ) : null}

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => markPayment(student.id, true)}
                            className="rounded-full border border-[var(--c-e7eddc)] bg-[var(--c-f7fbf0)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-3f4a2c)] transition hover:brightness-105"
                          >
                            Mark Paid
                          </button>
                          <button
                            type="button"
                            onClick={() => markPayment(student.id, false)}
                            className="rounded-full border border-[var(--c-f2d7db)] bg-[var(--c-fff5f6)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-8f2f3b)] transition hover:brightness-105"
                          >
                            Mark Unpaid
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {!isLoading ? (
        <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
              Currently Paid Students
            </p>
            <span className="rounded-full bg-[var(--c-3f4a2c)] px-4 py-2 text-sm uppercase tracking-[0.2em] text-white">
              {paidStudents.length} paid
            </span>
          </div>
          {paidStudents.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-4 text-sm text-[var(--c-6f6c65)]">
              No paid students yet.
            </div>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {paidStudents.map(student => {
                const override = feeOverrides[student.id];
                const lessonFee = parseFeeAmount(student.lessonFeeAmount);
                const hasBaseFee = lessonFee > 0;
                const prorateValue = override?.prorateAmount ?? '';
                const isNoFee = Boolean(override?.noFee);
                const effectiveFee = isNoFee
                  ? 0
                  : prorateValue
                    ? parseFeeAmount(prorateValue)
                    : lessonFee;
                return (
                  <div
                    key={student.id}
                    className="rounded-2xl border border-[var(--c-e7eddc)] bg-[var(--c-f7fbf0)] p-4 shadow-sm transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                          {student.name}
                        </p>
                        <p className="text-xs text-[var(--c-6f6c65)]">
                          {student.email || 'No email on file'}
                        </p>
                      </div>
                      <span className="rounded-full bg-[var(--c-e7eddc)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-3f4a2c)]">
                        Paid
                      </span>
                    </div>

                    <div className="mt-4 grid gap-2 text-xs text-[var(--c-6f6c65)]">
                      <div className="flex items-center justify-between">
                        <span className="uppercase tracking-[0.2em]">Day of Lesson</span>
                        <span className="font-semibold text-[var(--c-1f1f1d)]">
                          {student.lessonDay || '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="uppercase tracking-[0.2em]">Lesson Time</span>
                        <span className="font-semibold text-[var(--c-1f1f1d)]">
                          {student.lessonTime || '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="uppercase tracking-[0.2em]">Lesson Fee</span>
                        <span className="font-semibold text-[var(--c-1f1f1d)]">
                          {!hasBaseFee ? (
                            <Link
                              href={`/teachers/students?edit=${student.id}`}
                              className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
                            >
                              Set Fee
                            </Link>
                          ) : isNoFee ? (
                            'No fee'
                          ) : effectiveFee ? (
                            `${currencyFormatter.format(effectiveFee)} ${
                              student.lessonFeePeriod ?? 'Per Mo'
                            }`
                          ) : (
                            'Set fee'
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-3">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                        Monthly Overrides
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--c-6f6c65)]">
                        <label className="flex items-center gap-2 rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-1">
                          <input
                            type="checkbox"
                            checked={isNoFee}
                            onChange={event =>
                              updateFeeOverride(student.id, current => ({
                                ...current,
                                noFee: event.target.checked,
                                prorateAmount: event.target.checked
                                  ? ''
                                  : current?.prorateAmount ?? '',
                              }))
                            }
                          />
                          <span className="uppercase tracking-[0.2em]">No Fee</span>
                        </label>
                        <div className="flex items-center gap-2 rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-1">
                          <span className="uppercase tracking-[0.2em]">Prorate</span>
                          <input
                            type="text"
                            value={prorateValue}
                            onChange={event =>
                              updateFeeOverride(student.id, current => ({
                                ...current,
                                prorateAmount: event.target.value,
                                noFee: false,
                              }))
                            }
                            placeholder="$0"
                            className="w-20 border-none bg-transparent text-right text-xs text-[var(--c-1f1f1d)] outline-none"
                          />
                        </div>
                      </div>
                      {prorateValue ? (
                        <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                          Prorate applied for this month
                        </p>
                      ) : null}
                    </div>

                    {student.studentAlert ? (
                      <div className="mt-3 rounded-xl border border-[var(--c-f2d7db)] bg-[var(--c-fff5f6)] px-3 py-2 text-xs text-[var(--c-8f2f3b)]">
                        {student.studentAlert}
                      </div>
                    ) : null}

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => markPayment(student.id, true)}
                        className="rounded-full border border-[var(--c-e7eddc)] bg-[var(--c-e7eddc)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-3f4a2c)] transition"
                      >
                        Mark Paid
                      </button>
                      <button
                        type="button"
                        onClick={() => markPayment(student.id, false)}
                        className="rounded-full border border-[var(--c-f2d7db)] bg-[var(--c-fff5f6)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-8f2f3b)] transition hover:brightness-105"
                      >
                        Mark Unpaid
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
