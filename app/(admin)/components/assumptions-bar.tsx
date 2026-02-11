'use client';

import { useEffect, useState } from 'react';

export type Assumptions = {
  teacherCount: number;
  avgStudentsPerTeacher: number;
  lessonsPerStudent: number;
  teacherFee: number;
  studentFee: number;
};

type AssumptionsBarProps = {
  value: Assumptions;
  onChange: (next: Assumptions) => void;
  className?: string;
};

export default function AssumptionsBar({
  value,
  onChange,
  className,
}: AssumptionsBarProps) {
  const [draft, setDraft] = useState<Assumptions>(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <div
      className={`rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-5 py-3 shadow-sm ${className ?? ''}`}
    >
      <div className="flex flex-wrap items-center gap-5 text-sm uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
        <span className="text-xs font-semibold text-[var(--c-c8102e)]">
          Assumptions
        </span>
        <label className="flex items-center gap-2">
          Teachers
          <input
            type="number"
            min={0}
            className="w-24 rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-center text-sm uppercase tracking-[0.2em] text-[var(--c-1f1f1d)]"
            value={draft.teacherCount}
            onChange={event => {
              const next = {
                ...draft,
                teacherCount: Number(event.target.value),
              };
              setDraft(next);
              onChange(next);
            }}
          />
        </label>
        <label className="flex items-center gap-2">
          Avg Students
          <input
            type="number"
            step="0.1"
            min={0}
            className="w-24 rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-center text-sm uppercase tracking-[0.2em] text-[var(--c-1f1f1d)]"
            value={draft.avgStudentsPerTeacher}
            onChange={event => {
              const next = {
                ...draft,
                avgStudentsPerTeacher: Number(event.target.value),
              };
              setDraft(next);
              onChange(next);
            }}
          />
        </label>
        <label className="flex items-center gap-2">
          Lessons/Student
          <input
            type="number"
            min={0}
            className="w-24 rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-center text-sm uppercase tracking-[0.2em] text-[var(--c-1f1f1d)]"
            value={draft.lessonsPerStudent}
            onChange={event => {
              const next = {
                ...draft,
                lessonsPerStudent: Number(event.target.value),
              };
              setDraft(next);
              onChange(next);
            }}
          />
        </label>
        <label className="flex items-center gap-2">
          Teacher Fee
          <input
            type="number"
            min={0}
            className="w-24 rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-center text-sm uppercase tracking-[0.2em] text-[var(--c-1f1f1d)]"
            value={draft.teacherFee}
            onChange={event => {
              const next = {
                ...draft,
                teacherFee: Number(event.target.value),
              };
              setDraft(next);
              onChange(next);
            }}
          />
        </label>
        <label className="flex items-center gap-2">
          Student Fee
          <input
            type="number"
            min={0}
            className="w-24 rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-center text-sm uppercase tracking-[0.2em] text-[var(--c-1f1f1d)]"
            value={draft.studentFee}
            onChange={event => {
              const next = {
                ...draft,
                studentFee: Number(event.target.value),
              };
              setDraft(next);
              onChange(next);
            }}
          />
        </label>
      </div>
    </div>
  );
}
