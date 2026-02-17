'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  formatCurrency,
  formatTeacherPriceLabel,
  getSectionPriceForRole,
  hydrateSectionPriceOverrides,
  saveSectionPriceOverrides,
} from './lesson-pricing';
import { useLessonData } from './use-lesson-data';

const toProgramSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

type GroupedSections = Record<string, string[]>;

type DragState = {
  groupKey: string;
  index: number;
} | null;

type CompanyLessonLibraryProgramProps = {
  programSlug: string;
};

function SectionCard({
  programName,
  sectionName,
  href,
  sortable,
  pricingMode,
  isOver,
  onDragStart,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  onPricingClick,
}: {
  programName: string;
  sectionName: string;
  href: string;
  sortable: boolean;
  pricingMode: boolean;
  isOver: boolean;
  onDragStart: () => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnter: () => void;
  onDragLeave: () => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onPricingClick: () => void;
}) {
  const studentPrice = formatCurrency(
    getSectionPriceForRole('student', programName, sectionName),
  );
  const teacherPriceLabel = formatTeacherPriceLabel(programName, sectionName);
  const cardClasses =
    'block relative w-full rounded-2xl border border-[var(--c-e5e3dd)] bg-[var(--c-fcfcfb)] px-4 py-3 text-left shadow-sm transition';
  const content = (
    <>
      {sortable ? (
        <div className="absolute left-1 top-1/2 flex h-12 w-8 -translate-y-1/2 items-center justify-center text-[#9aa3ae]">
          <span className="text-xl leading-none">⋮⋮</span>
        </div>
      ) : null}
      <div className="flex items-start justify-between gap-4">
        <div className={`${sortable ? 'pl-8' : ''}`}>
          <p className="text-sm font-medium text-[var(--c-1f1f1d)]">
            {sectionName}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[var(--c-2d6a4f)]">
            View materials
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
          {pricingMode ? (
            <>
              <button
                type="button"
                onClick={event => {
                  event.preventDefault();
                  event.stopPropagation();
                  onPricingClick();
                }}
                className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-f3f4f6)] px-3.5 py-1.5 font-semibold text-[var(--c-3a3935)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
              >
                Student {studentPrice}
              </button>
              <button
                type="button"
                onClick={event => {
                  event.preventDefault();
                  event.stopPropagation();
                  onPricingClick();
                }}
                className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-f3f4f6)] px-3.5 py-1.5 font-semibold text-[var(--c-3a3935)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
              >
                Teacher {teacherPriceLabel}
              </button>
            </>
          ) : (
            <>
              <span className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-f3f4f6)] px-3.5 py-1.5 font-semibold text-[var(--c-3a3935)]">
                Student {studentPrice}
              </span>
              <span className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-f3f4f6)] px-3.5 py-1.5 font-semibold text-[var(--c-3a3935)]">
                Teacher {teacherPriceLabel}
              </span>
            </>
          )}
        </div>
      </div>
    </>
  );

  if (sortable) {
    return (
      <div
        className={`${cardClasses} cursor-grab hover:shadow-[0_6px_16px_rgba(15,23,42,0.12)] ${
          isOver
            ? 'border-[#7a8798] bg-[#dfe5ec] shadow-[0_18px_36px_rgba(15,23,42,0.2)] ring-2 ring-[#a7b0bc]'
            : ''
        }`}
        draggable
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={`${cardClasses} hover:border-white hover:bg-[var(--c-fcfcfb)]`}
    >
      {content}
    </Link>
  );
}

export default function CompanyLessonLibraryProgram({
  programSlug,
}: CompanyLessonLibraryProgramProps) {
  const { lessonTypes, lessonSections } = useLessonData();
  const programName = useMemo(
    () => lessonTypes.find(type => toProgramSlug(type) === programSlug) ?? null,
    [lessonTypes, programSlug],
  );
  const rawSectionData = useMemo(() => {
    if (!programName) return [] as string[] | GroupedSections;
    const data = lessonSections[programName as keyof typeof lessonSections] as
      | string[]
      | GroupedSections
      | undefined;
    return data ?? [];
  }, [lessonSections, programName]);

  const isGrouped =
    programName && !Array.isArray(rawSectionData) && rawSectionData;

  const initialArray = useMemo(
    () => (Array.isArray(rawSectionData) ? rawSectionData : []),
    [rawSectionData],
  );

  const initialGroups = useMemo(() => {
    if (!rawSectionData || Array.isArray(rawSectionData)) return {};
    return Object.fromEntries(
      Object.entries(rawSectionData as GroupedSections).map(([key, value]) => [
        key,
        [...value],
      ]),
    );
  }, [rawSectionData]);

  const initialArrayRef = useRef<string[]>([...initialArray]);
  const initialGroupsRef = useRef<GroupedSections>({ ...initialGroups });

  const [sortMode, setSortMode] = useState(false);
  const [priceMode, setPriceMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sections, setSections] = useState<string[]>([...initialArray]);
  const [groupedSections, setGroupedSections] = useState<GroupedSections>({
    ...initialGroups,
  });
  const [dragging, setDragging] = useState<DragState>(null);
  const [dragOver, setDragOver] = useState<DragState>(null);
  const [saving, setSaving] = useState(false);
  const [priceSaving, setPriceSaving] = useState(false);
  const [, setPricingVersion] = useState(0);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [pricingTarget, setPricingTarget] = useState<{
    programName: string;
    sectionName: string;
  } | null>(null);
  const [studentPriceInput, setStudentPriceInput] = useState('');
  const [teacherPriceInput, setTeacherPriceInput] = useState('');
  const [pricingModalSaving, setPricingModalSaving] = useState(false);

  const basePath = '/company/lesson-library';

  useEffect(() => {
    const handlePricingUpdate = () => {
      setPricingVersion(version => version + 1);
    };
    window.addEventListener('sm-pricing-updated', handlePricingUpdate);
    void hydrateSectionPriceOverrides();
    return () => {
      window.removeEventListener('sm-pricing-updated', handlePricingUpdate);
    };
  }, []);

  const handleSwap = (groupKey: string, toIndex: number) => {
    if (!dragging || dragging.groupKey !== groupKey) return;
    if (dragging.index === toIndex) return;

    if (groupKey === 'default') {
      setSections(current => {
        const next = [...current];
        [next[dragging.index], next[toIndex]] = [
          next[toIndex],
          next[dragging.index],
        ];
        return next;
      });
    } else {
      setGroupedSections(current => {
        const nextGroup = [...(current[groupKey] ?? [])];
        [nextGroup[dragging.index], nextGroup[toIndex]] = [
          nextGroup[toIndex],
          nextGroup[dragging.index],
        ];
        return { ...current, [groupKey]: nextGroup };
      });
    }

    setDragging({ groupKey, index: toIndex });
    setDragOver(null);
  };

  const handleDragEnter = (groupKey: string, index: number) => {
    setDragOver({ groupKey, index });
  };

  const handleDragLeave = (groupKey: string, index: number) => {
    setDragOver(current => {
      if (current?.groupKey === groupKey && current.index === index) {
        return null;
      }
      return current;
    });
  };

  const handleCancel = () => {
    setSections([...initialArrayRef.current]);
    setGroupedSections({ ...initialGroupsRef.current });
    setSortMode(false);
    setDragging(null);
    setDragOver(null);
    setMenuOpen(false);
  };

  const handlePriceCancel = () => {
    setPriceMode(false);
    setMenuOpen(false);
  };

  const handlePriceSave = async () => {
    setPriceSaving(true);
    try {
      // Placeholder for pricing save workflow
      setPriceMode(false);
    } finally {
      setPriceSaving(false);
    }
  };

  const handleSave = async () => {
    if (!programName) return;
    setSaving(true);
    const payload = Array.isArray(rawSectionData)
      ? sections
      : groupedSections;

    try {
      const response = await fetch('/api/lesson-sections/sort', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programName, sections: payload }),
      });
      if (!response.ok) {
        throw new Error('Failed to save sort order.');
      }
      initialArrayRef.current = [...sections];
      initialGroupsRef.current = { ...groupedSections };
      setSortMode(false);
      setDragging(null);
      setDragOver(null);
      setMenuOpen(false);
    } catch {
      // noop - keep user in sort mode
    } finally {
      setSaving(false);
    }
  };

  const openPricingModal = (sectionName: string) => {
    if (!programName) return;
    const studentPrice = getSectionPriceForRole(
      'student',
      programName,
      sectionName,
    );
    const teacherPrice = getSectionPriceForRole(
      'teacher',
      programName,
      sectionName,
    );
    setPricingTarget({ programName, sectionName });
    setStudentPriceInput(String(studentPrice));
    setTeacherPriceInput(String(teacherPrice));
    setPricingModalOpen(true);
  };

  const closePricingModal = () => {
    setPricingModalOpen(false);
    setPricingTarget(null);
  };

  const adjustPrice = (
    setter: (value: string) => void,
    current: string,
    delta: number,
  ) => {
    const numeric = Number(current);
    const next = Number.isFinite(numeric) ? numeric + delta : delta;
    setter(String(Math.max(0, Math.round(next))));
  };

  const handlePricingSave = async () => {
    if (!pricingTarget) return;
    const studentValue = Number(studentPriceInput);
    const teacherValue = Number(teacherPriceInput);
    setPricingModalSaving(true);
    try {
      await saveSectionPriceOverrides(
        pricingTarget.programName,
        pricingTarget.sectionName,
        {
          student: Number.isFinite(studentValue) ? Math.max(0, studentValue) : 0,
          teacher: Number.isFinite(teacherValue) ? Math.max(0, teacherValue) : 0,
        },
      );
      closePricingModal();
    } finally {
      setPricingModalSaving(false);
    }
  };

  const renderArraySections = (items: string[], groupKey: string) => {
    const splitIndex = Math.ceil(items.length / 2);
    const columnOne = items.slice(0, splitIndex);
    const columnTwo = items.slice(splitIndex);
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-6">
        <div className="min-w-0 space-y-3">
          {columnOne.map((section, index) => (
            <SectionCard
              key={section}
              programName={programName ?? ''}
              sectionName={section}
              href={`${basePath}/${toProgramSlug(programName ?? '')}/${toProgramSlug(section)}`}
              sortable={sortMode}
              pricingMode={priceMode}
              isOver={
                sortMode &&
                dragOver?.groupKey === groupKey &&
                dragOver.index === index
              }
              onDragStart={() => setDragging({ groupKey, index })}
              onDragOver={event => {
                if (sortMode) event.preventDefault();
                if (sortMode) setDragOver({ groupKey, index });
              }}
              onDragEnter={() => handleDragEnter(groupKey, index)}
              onDragLeave={() => handleDragLeave(groupKey, index)}
              onDrop={event => {
                event.preventDefault();
                handleSwap(groupKey, index);
              }}
              onPricingClick={() => openPricingModal(section)}
            />
          ))}
        </div>
        <div className="min-w-0 space-y-3">
          {columnTwo.map((section, index) => (
            <SectionCard
              key={section}
              programName={programName ?? ''}
              sectionName={section}
              href={`${basePath}/${toProgramSlug(programName ?? '')}/${toProgramSlug(section)}`}
              sortable={sortMode}
              pricingMode={priceMode}
              isOver={
                sortMode &&
                dragOver?.groupKey === groupKey &&
                dragOver.index === index + columnOne.length
              }
              onDragStart={() =>
                setDragging({
                  groupKey,
                  index: index + columnOne.length,
                })
              }
              onDragOver={event => {
                if (sortMode) event.preventDefault();
                if (sortMode)
                  setDragOver({ groupKey, index: index + columnOne.length });
              }}
              onDragEnter={() =>
                handleDragEnter(groupKey, index + columnOne.length)
              }
              onDragLeave={() =>
                handleDragLeave(groupKey, index + columnOne.length)
              }
              onDrop={event => {
                event.preventDefault();
                handleSwap(groupKey, index + columnOne.length);
              }}
              onPricingClick={() => openPricingModal(section)}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="md:max-w-[50%]">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
            Program Library
          </p>
          <h1 className="text-3xl font-semibold text-[var(--c-1f1f1d)]">
            {programName ?? 'Program'}
          </h1>
          <p className="text-sm text-[var(--c-6f6c65)]">
            {programName
              ? 'Lesson sections available for this program.'
              : 'This program could not be found.'}
          </p>
        </div>
        <div className="flex items-center justify-end gap-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(open => !open)}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] shadow-sm transition hover:border-[var(--c-9aa6b2)] hover:text-[var(--c-1f1f1d)]"
          >
            Curriculum Options
            <span className="text-[10px]">▼</span>
          </button>
          {menuOpen ? (
            <div className="absolute right-0 top-full z-10 mt-2 w-56 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-2 shadow-lg">
              <button
                type="button"
                className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-[var(--c-3a3935)] transition hover:-translate-y-[1px] hover:bg-[#e3edf7] hover:text-[#0f172a] hover:shadow-[0_6px_16px_rgba(15,23,42,0.12)]"
              >
                Build New Lesson Pack
              </button>
              <button
                type="button"
                onClick={() => {
                  setSortMode(false);
                  setPriceMode(true);
                  setMenuOpen(false);
                }}
                className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-[var(--c-3a3935)] transition hover:-translate-y-[1px] hover:bg-[#e3edf7] hover:text-[#0f172a] hover:shadow-[0_6px_16px_rgba(15,23,42,0.12)]"
              >
                Section Pricing
              </button>
              <button
                type="button"
                onClick={() => {
                  setPriceMode(false);
                  setSortMode(true);
                  setMenuOpen(false);
                }}
                className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-[var(--c-3a3935)] transition hover:-translate-y-[1px] hover:bg-[#e3edf7] hover:text-[#0f172a] hover:shadow-[0_6px_16px_rgba(15,23,42,0.12)]"
              >
                Sort Content
              </button>
            </div>
          ) : null}
        </div>
        <Link
          href={basePath}
          className="inline-flex items-center justify-center rounded-full border border-[var(--c-ecebe7)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[var(--c-9aa6b2)] hover:text-[var(--c-1f1f1d)]"
        >
          Back
        </Link>
        </div>
      </header>

      {priceMode ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f6f2)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--c-6f6c65)]">
          <span>Price Updates</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePriceCancel}
              className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[var(--c-9aa6b2)] hover:text-[var(--c-1f1f1d)]"
            >
              Exit Pricing
            </button>
          </div>
        </div>
      ) : null}

      {sortMode ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f6f2)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--c-6f6c65)]">
          <span>Sorting</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[var(--c-9aa6b2)] hover:text-[var(--c-1f1f1d)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-full border border-[#1f2a44] bg-[#1f2a44] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      ) : null}

      <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
        {programName ? (
          Array.isArray(rawSectionData) ? (
            renderArraySections(sections, 'default')
          ) : (
            <div className="space-y-10">
              {Object.entries(groupedSections).map(([group, groupSections]) => (
                <div key={group} className="space-y-4">
                  <p className="text-sm font-semibold tracking-[0.2em] text-white">
                    {group}
                  </p>
                  {renderArraySections(groupSections, group)}
                </div>
              ))}
            </div>
          )
        ) : (
          <p className="text-sm text-[var(--c-6f6c65)]">
            Choose a program from the library to view its sections.
          </p>
        )}
      </section>

      {pricingModalOpen && pricingTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.3)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                  Pricing Update
                </p>
                <h3 className="mt-2 text-xl font-semibold text-[var(--c-1f1f1d)]">
                  {pricingTarget.programName} - {pricingTarget.sectionName}
                </h3>
              </div>
              <button
                type="button"
                onClick={closePricingModal}
                className="rounded-full border border-[var(--c-e5e3dd)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-5">
              <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                  Student Price
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      adjustPrice(setStudentPriceInput, studentPriceInput, -1)
                    }
                    className="h-9 w-9 rounded-full border border-[var(--c-e5e3dd)] text-sm font-semibold text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={studentPriceInput}
                    onChange={event => setStudentPriceInput(event.target.value)}
                    className="w-full rounded-xl border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-lg font-semibold text-[var(--c-1f1f1d)] outline-none transition focus:border-[color:var(--c-c8102e)]"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      adjustPrice(setStudentPriceInput, studentPriceInput, 1)
                    }
                    className="h-9 w-9 rounded-full border border-[var(--c-e5e3dd)] text-sm font-semibold text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                  Teacher Price
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      adjustPrice(setTeacherPriceInput, teacherPriceInput, -1)
                    }
                    className="h-9 w-9 rounded-full border border-[var(--c-e5e3dd)] text-sm font-semibold text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={teacherPriceInput}
                    onChange={event => setTeacherPriceInput(event.target.value)}
                    className="w-full rounded-xl border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-lg font-semibold text-[var(--c-1f1f1d)] outline-none transition focus:border-[color:var(--c-c8102e)]"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      adjustPrice(setTeacherPriceInput, teacherPriceInput, 1)
                    }
                    className="h-9 w-9 rounded-full border border-[var(--c-e5e3dd)] text-sm font-semibold text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={closePricingModal}
                className="rounded-full border border-[var(--c-e5e3dd)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePricingSave}
                disabled={pricingModalSaving}
                className="rounded-full border border-[#1f2a44] bg-[#1f2a44] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:brightness-110"
              >
                {pricingModalSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
