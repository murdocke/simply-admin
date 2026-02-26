'use client';

import type React from 'react';
import { useMemo } from 'react';
import { useLessonData } from './use-lesson-data';

export type LessonPrepFormValues = {
  curriculumType: string;
  section: string;
  part: string;
  material: string;
  focus: string;
  materials: string;
  goal: string;
  warmup: string;
  notes: string;
};

type LessonPrepModalProps = {
  isOpen: boolean;
  studentName: string | null;
  prepForm: LessonPrepFormValues;
  setPrepForm: React.Dispatch<React.SetStateAction<LessonPrepFormValues>>;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  maxWidthClassName?: string;
};

export default function LessonPrepModal({
  isOpen,
  studentName,
  prepForm,
  setPrepForm,
  onClose,
  onSubmit,
  maxWidthClassName = 'max-w-3xl',
}: LessonPrepModalProps) {
  const { lessonTypes, lessonSections, lessonMaterials, lessonParts } = useLessonData();

  const normalizeStringList = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    return value.filter(item => typeof item === 'string') as string[];
  };
  const materialCodeFromTitle = (title: string): string | null => {
    const match = title.trim().match(/^(\d+(?:\.\d+)+|\d+)/);
    return match?.[1] ?? null;
  };

  const sectionOptions = useMemo(
    () => normalizeStringList(lessonSections[prepForm.curriculumType]),
    [lessonSections, prepForm.curriculumType],
  );

  const materialOptionsForSection = useMemo(() => {
    if (!prepForm.curriculumType || !prepForm.section) return [];
    const key = `${prepForm.curriculumType}|${prepForm.section}`;
    return normalizeStringList(lessonMaterials[key]);
  }, [lessonMaterials, prepForm.curriculumType, prepForm.section]);

  const materialOptions = materialOptionsForSection;

  const partOptions = useMemo(() => {
    if (!prepForm.material) return [];
    const partsMap = lessonParts as Record<string, string[]>;
    const codeFromTitle = materialCodeFromTitle(prepForm.material);
    if (codeFromTitle && partsMap[codeFromTitle]) {
      return normalizeStringList(partsMap[codeFromTitle]);
    }
    const matchedKey = Object.keys(partsMap).find(
      key =>
        prepForm.material.startsWith(key) ||
        (codeFromTitle ? key === codeFromTitle : false),
    );
    if (!matchedKey) return [];
    return normalizeStringList(partsMap[matchedKey]);
  }, [lessonParts, prepForm.material]);

  if (!isOpen || !studentName) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <form
        className={`relative w-full ${maxWidthClassName} rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-xl`}
        onSubmit={onSubmit}
        onKeyDown={event => {
          if (
            event.key === 'Enter' &&
            event.target instanceof HTMLTextAreaElement
          ) {
            return;
          }
          if (event.key === 'Enter') {
            event.preventDefault();
            onSubmit(event as unknown as React.FormEvent<HTMLFormElement>);
          }
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
              Lesson Prep
            </p>
            <h2 className="mt-2 whitespace-nowrap text-2xl font-semibold text-[var(--c-1f1f1d)]">
              Preparing for Today&apos;s Lesson with{' '}
              {studentName.split(' ')[0] ?? studentName}
            </h2>
            <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
              Capture quick notes and plan the focus for this session.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--c-ecebe7)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
          >
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
            Curriculum Type
            <select
              value={prepForm.curriculumType}
              onChange={event =>
                setPrepForm(current => ({
                  ...current,
                  curriculumType: event.target.value,
                  section: '',
                  part: '',
                  material: '',
                }))
              }
              className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
            >
              <option value="">Select type</option>
              {lessonTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
            Section
            <select
              value={prepForm.section}
              onChange={event =>
                setPrepForm(current => ({
                  ...current,
                  section: event.target.value,
                  part: '',
                  material: '',
                }))
              }
              className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
              disabled={!prepForm.curriculumType}
            >
              <option value="">Select section</option>
              {sectionOptions.map(section => (
                <option key={section} value={section}>
                  {section}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
            Material
            <select
              value={prepForm.material}
              onChange={event =>
                setPrepForm(current => ({
                  ...current,
                  material: event.target.value,
                  part: '',
                }))
              }
              className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
              disabled={!prepForm.section}
            >
              <option value="">Select material</option>
              {materialOptions.map(material => (
                <option key={material} value={material}>
                  {material}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
            Part
            <select
              value={prepForm.part}
              onChange={event =>
                setPrepForm(current => ({
                  ...current,
                  part: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
              disabled={!prepForm.material}
            >
              <option value="">Select part</option>
              {partOptions.map(part => (
                <option key={part} value={part}>
                  {part}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
            Lesson Focus
            <input
              type="text"
              value={prepForm.focus}
              onChange={event =>
                setPrepForm(current => ({
                  ...current,
                  focus: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
              placeholder="Technique, repertoire, theory"
            />
          </label>
          <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
            Materials
            <input
              type="text"
              value={prepForm.materials}
              onChange={event =>
                setPrepForm(current => ({
                  ...current,
                  materials: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
              placeholder="Song, book, PDF"
            />
          </label>
          <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
            Goal for Today
            <input
              type="text"
              value={prepForm.goal}
              onChange={event =>
                setPrepForm(current => ({
                  ...current,
                  goal: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
              placeholder="What success looks like"
            />
          </label>
          <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
            Warm-up Plan
            <input
              type="text"
              value={prepForm.warmup}
              onChange={event =>
                setPrepForm(current => ({
                  ...current,
                  warmup: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
              placeholder="Scales, chords, drills"
            />
          </label>
        </div>
        <label className="mt-4 block text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
          Notes
          <textarea
            value={prepForm.notes}
            onChange={event =>
              setPrepForm(current => ({
                ...current,
                notes: event.target.value,
              }))
            }
            className="mt-2 min-h-[120px] w-full resize-none rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
            placeholder="Anything else to remember for today..."
          />
        </label>
        <button
          type="submit"
          className="mt-6 w-full rounded-2xl border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)] transition hover:brightness-110"
        >
          Submit Prep
        </button>
      </form>
    </div>
  );
}
