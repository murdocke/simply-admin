'use client';

import { useEffect, useMemo, useState } from 'react';
import LessonPackRenderer from '../components/lesson-pack-renderer';
import {
  createLessonSubject,
  emptyLessonPack,
  type LessonPack,
  type LessonPackSubject,
} from '../components/lesson-pack-types';

const updateSubjectOrder = (subjects: LessonPackSubject[]) =>
  subjects.map((subject, index) => ({ ...subject, order: index }));

const getNextSubjectNumber = (subjects: LessonPackSubject[]) => {
  const maxNumber = subjects.reduce(
    (max, subject) =>
      Math.max(max, Number.isFinite(subject.subjectNumber) ? subject.subjectNumber : 0),
    0,
  );
  return maxNumber + 1;
};

const normalizeSubjectCount = (pack: LessonPack, count: number) => {
  const nextCount = Math.max(0, count);
  const nextSubjects = [...pack.subjects].sort((a, b) => a.order - b.order);
  if (nextSubjects.length < nextCount) {
    let nextNumber = getNextSubjectNumber(nextSubjects);
    const additions = Array.from({ length: nextCount - nextSubjects.length }).map(
      (_, index) => {
        const subject = createLessonSubject(
          nextSubjects.length + index,
          nextNumber,
        );
        nextNumber += 1;
        return subject;
      },
    );
    return {
      ...pack,
      subjectCount: nextCount,
      subjects: updateSubjectOrder([...nextSubjects, ...additions]),
    };
  }
  return {
    ...pack,
    subjectCount: nextCount,
    subjects: updateSubjectOrder(nextSubjects),
  };
};

export default function LessonPackBuilderPage() {
  const [packs, setPacks] = useState<LessonPack[]>([]);
  const [activePackId, setActivePackId] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draggingSubjectId, setDraggingSubjectId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const normalizePackSubjects = (pack: LessonPack) => {
    let didUpdate = false;
    const sorted = [...pack.subjects].sort((a, b) => a.order - b.order);
    let nextNumber = sorted.reduce(
      (max, subject) =>
        Math.max(max, Number.isFinite(subject.subjectNumber) ? subject.subjectNumber : 0),
      0,
    );
    const subjects = sorted.map((subject, index) => {
      if (Number.isFinite(subject.subjectNumber)) {
        return subject;
      }
      didUpdate = true;
      nextNumber += 1;
      return { ...subject, subjectNumber: nextNumber, order: index };
    });

    const subjectCount =
      typeof pack.subjectCount === 'number'
        ? pack.subjectCount
        : pack.subjects.length;
    if (pack.subjectCount !== subjectCount) {
      didUpdate = true;
    }

    return {
      pack: {
        ...pack,
        subjectCount,
        subjects: updateSubjectOrder(subjects),
      },
      didUpdate,
    };
  };

  const fetchPacks = async () => {
    try {
      setLoadError(null);
      const response = await fetch('/api/lesson-packs');
      if (!response.ok) throw new Error('Failed to load lesson packs');
      const data = (await response.json()) as { lessonPacks?: LessonPack[] };
      const loaded = Array.isArray(data.lessonPacks) ? data.lessonPacks : [];
      let didUpdate = false;
      const normalized = loaded.map(pack => {
        const result = normalizePackSubjects(pack);
        if (result.didUpdate) {
          didUpdate = true;
        }
        return result.pack;
      });
      if (loaded.length > 0) {
        setPacks(normalized);
        setActivePackId(normalized[0].id);
        setSelectedSubjectId(normalized[0].subjects[0]?.id ?? null);
        if (didUpdate) {
          await persistPacks(normalized);
        }
        return;
      }
      const starter = normalizeSubjectCount(emptyLessonPack(), 1);
      setPacks([starter]);
      setActivePackId(starter.id);
      setSelectedSubjectId(starter.subjects[0]?.id ?? null);
      await persistPacks([starter]);
    } catch (error) {
      setLoadError('Unable to load lesson packs.');
      // eslint-disable-next-line no-console
      console.error(error);
    }
  };

  const persistPacks = async (nextPacks: LessonPack[]) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/lesson-packs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonPacks: nextPacks }),
      });
      if (!response.ok) throw new Error('Failed to save lesson packs');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      setLoadError('Unable to save lesson packs.');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    void fetchPacks();
  }, []);

  const activePack = useMemo(
    () => packs.find(pack => pack.id === activePackId) ?? null,
    [packs, activePackId],
  );

  useEffect(() => {
    if (!activePack) return;
    const subjectCount =
      activePack.subjectCount ?? activePack.subjects.length ?? 0;
    const visible = [...activePack.subjects]
      .sort((a, b) => a.order - b.order)
      .slice(0, subjectCount);

    if (selectedSubjectId) {
      const stillVisible = visible.some(
        subject => subject.id === selectedSubjectId,
      );
      if (stillVisible) return;
    }
    setSelectedSubjectId(visible[0]?.id ?? null);
  }, [activePackId, activePack, selectedSubjectId]);

  const updatePacks = (nextPacks: LessonPack[]) => {
    setPacks(nextPacks);
    void persistPacks(nextPacks);
  };

  const updateActivePack = (updater: (pack: LessonPack) => LessonPack) => {
    if (!activePack) return;
    const nextPacks = packs.map(pack =>
      pack.id === activePack.id ? updater(pack) : pack,
    );
    updatePacks(nextPacks);
  };

  const handleMetaChange = (field: keyof LessonPack, value: string) => {
    updateActivePack(pack => ({
      ...pack,
      [field]: value,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handlePriceChange = (field: 'priceTeacher' | 'priceStudent', value: string) => {
    const nextValue = value.trim() === '' ? undefined : Number(value);
    updateActivePack(pack => ({
      ...pack,
      [field]: Number.isNaN(nextValue) ? undefined : nextValue,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleSaveStatus = (status: LessonPack['status']) => {
    updateActivePack(pack => ({
      ...pack,
      status,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleSubjectCountChange = (value: number) => {
    if (Number.isNaN(value)) return;
    updateActivePack(pack => ({
      ...normalizeSubjectCount(pack, value),
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleSubjectUpdate = (
    subjectId: string,
    data: Partial<LessonPackSubject>,
  ) => {
    updateActivePack(pack => ({
      ...pack,
      subjects: updateSubjectOrder(
        pack.subjects.map(subject =>
          subject.id === subjectId ? { ...subject, ...data } : subject,
        ),
      ),
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleRemoveSubject = (subjectId: string) => {
    updateActivePack(pack => {
      const currentCount = pack.subjectCount ?? pack.subjects.length;
      const ordered = [...pack.subjects].sort((a, b) => a.order - b.order);
      const removedIndex = ordered.findIndex(subject => subject.id === subjectId);
      const remaining = ordered.filter(subject => subject.id !== subjectId);
      const nextCount =
        removedIndex > -1 && removedIndex < currentCount
          ? Math.max(0, currentCount - 1)
          : currentCount;
      const cappedCount = Math.min(nextCount, remaining.length);
      return {
        ...pack,
        subjectCount: cappedCount,
        subjects: updateSubjectOrder(remaining),
        updatedAt: new Date().toISOString(),
      };
    });
    if (selectedSubjectId === subjectId) {
      setSelectedSubjectId(null);
    }
  };

  const handleDragStart = (subjectId: string) => {
    setDraggingSubjectId(subjectId);
  };

  const handleDragEnd = () => {
    setDraggingSubjectId(null);
    setDropTargetId(null);
  };

  const handleDropOnSubject = (targetId: string) => {
    if (!draggingSubjectId || !activePack) return;
    if (draggingSubjectId === targetId) return;
    setDropTargetId(null);
    updateActivePack(pack => {
      const ordered = [...pack.subjects].sort((a, b) => a.order - b.order);
      const sourceIndex = ordered.findIndex(subject => subject.id === draggingSubjectId);
      const targetIndex = ordered.findIndex(subject => subject.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0) return pack;
      const next = [...ordered];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return {
        ...pack,
        subjects: updateSubjectOrder(next),
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const handleNewPack = () => {
    const next = normalizeSubjectCount(emptyLessonPack(), 1);
    updatePacks([next, ...packs]);
    setActivePackId(next.id);
    setSelectedSubjectId(next.subjects[0]?.id ?? null);
  };

  const handleDuplicatePack = () => {
    if (!activePack) return;
    const now = new Date().toISOString();
    const duplicate: LessonPack = {
      ...activePack,
      id: `pack-${Math.random().toString(36).slice(2, 10)}`,
      title: `${activePack.title} (Copy)`,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };
    updatePacks([duplicate, ...packs]);
    setActivePackId(duplicate.id);
    setSelectedSubjectId(duplicate.subjects[0]?.id ?? null);
  };

  const handleExport = async () => {
    if (!activePack) return;
    const payload = JSON.stringify(activePack, null, 2);
    try {
      await navigator.clipboard.writeText(payload);
      alert('Lesson pack JSON copied to clipboard.');
    } catch {
      alert(payload);
    }
  };

  const handleImport = () => {
    const raw = window.prompt('Paste lesson pack JSON');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as LessonPack;
      if (!parsed?.id) throw new Error('Invalid pack');
      updatePacks([parsed, ...packs.filter(pack => pack.id !== parsed.id)]);
      setActivePackId(parsed.id);
      setSelectedSubjectId(parsed.subjects[0]?.id ?? null);
    } catch {
      alert('Invalid JSON. Please paste a valid lesson pack.');
    }
  };

  const subjectCount =
    activePack?.subjectCount ?? activePack?.subjects.length ?? 0;
  const sortedSubjects = activePack
    ? [...activePack.subjects].sort((a, b) => a.order - b.order)
    : [];
  const visibleSubjects = sortedSubjects.slice(0, subjectCount);

  const selectedSubject = visibleSubjects.find(
    subject => subject.id === selectedSubjectId,
  );

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
              Lesson Pack Builder
            </p>
            <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
              Build a clean lesson pack with pricing, subjects, and media blocks.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
              {activePack?.status === 'published' ? 'Published' : 'Draft'}
            </div>
            {isSaving ? (
              <div className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fff5f6)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                Saving
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-efece6)] p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Lesson Pack Title
                <input
                  className="w-full rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-2 text-base font-semibold text-[var(--c-1f1f1d)]"
                  value={activePack?.title ?? ''}
                  onChange={event => handleMetaChange('title', event.target.value)}
                  placeholder="Lesson pack title"
                />
              </label>
              <label className="flex flex-col gap-2 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Subtitle
                <input
                  className="w-full rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-2 text-sm text-[var(--c-6f6c65)]"
                  value={activePack?.subtitle ?? ''}
                  onChange={event => handleMetaChange('subtitle', event.target.value)}
                  placeholder="Subtitle (optional)"
                />
              </label>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Cover Image URL
                <input
                  value={activePack?.coverImage ?? ''}
                  onChange={event =>
                    handleMetaChange('coverImage', event.target.value)
                  }
                  className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                  placeholder="Cover image URL"
                />
              </label>
              <label className="flex flex-col gap-2 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Teacher Price
                <input
                  type="number"
                  value={activePack?.priceTeacher ?? ''}
                  onChange={event =>
                    handlePriceChange('priceTeacher', event.target.value)
                  }
                  className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                  placeholder="Teacher price"
                  min={0}
                />
              </label>
              <label className="flex flex-col gap-2 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Student Price
                <input
                  type="number"
                  value={activePack?.priceStudent ?? ''}
                  onChange={event =>
                    handlePriceChange('priceStudent', event.target.value)
                  }
                  className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                  placeholder="Student price"
                  min={0}
                />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-efece6)] p-4">
            <div className="flex flex-col gap-2 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-faf9f6)] p-3">
              <label className="text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Active Lesson Pack
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={activePack?.id ?? ''}
                  onChange={event => setActivePackId(event.target.value)}
                  className="flex-1 rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
                >
                  {packs.map(pack => (
                    <option key={pack.id} value={pack.id}>
                      {pack.title}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => void fetchPacks()}
                  className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
              <button
                type="button"
                onClick={() => handleSaveStatus('draft')}
                className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => handleSaveStatus('published')}
                className="rounded-xl border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)]"
              >
                Publish
              </button>
              <button
                type="button"
                onClick={handleDuplicatePack}
                className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
              >
                Duplicate
              </button>
              <button
                type="button"
                onClick={handleNewPack}
                className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
              >
                New Pack
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
              >
                Export JSON
              </button>
              <button
                type="button"
                onClick={handleImport}
                className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
              >
                Import JSON
              </button>
            </div>
          </div>
        </div>
      </header>

      {loadError ? (
        <div className="rounded-2xl border border-[var(--c-c8102e)] bg-[var(--c-fff5f6)] px-4 py-3 text-sm text-[var(--c-1f1f1d)]">
          {loadError}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          {activePack ? <LessonPackRenderer lessonPack={activePack} /> : null}
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm">
            <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-efece6)] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                  Lesson Subjects
                </p>
              <div className="flex items-center gap-2 rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-faf9f6)] px-3 py-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={subjectCount}
                  onChange={event => {
                    const cleaned = event.target.value.replace(/[^0-9]/g, '');
                    handleSubjectCountChange(
                      cleaned === '' ? 0 : Number(cleaned),
                    );
                  }}
                  className="w-12 bg-transparent text-center text-lg uppercase tracking-[0.2em] tabular-nums text-[var(--c-6f6c65)] focus:outline-none"
                />
                <div className="flex flex-col overflow-hidden rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)]">
                  <button
                    type="button"
                    onClick={event => {
                      event.stopPropagation();
                      handleSubjectCountChange(subjectCount + 1);
                    }}
                    className="px-3 py-1 text-[18px] leading-none font-semibold text-[var(--c-6f6c65)]"
                    aria-label="Increase lesson subjects"
                  >
                    +
                  </button>
                  <div className="h-px bg-[var(--c-ecebe7)]" />
                  <button
                    type="button"
                    onClick={event => {
                      event.stopPropagation();
                      handleSubjectCountChange(Math.max(0, subjectCount - 1));
                    }}
                    className="px-3 py-1 text-[20px] leading-none font-semibold text-[var(--c-6f6c65)]"
                    aria-label="Decrease lesson subjects"
                  >
                    −
                  </button>
                </div>
              </div>
              </div>
              <p className="mt-2 text-xs text-[var(--c-6f6c65)]">
                Set how many lesson subjects you want, then fill each one out.
              </p>
              <div className="mt-4 space-y-3">
              {visibleSubjects.length ? (
                visibleSubjects.map((subject, index) => (
                      <div
                        key={subject.id}
                        className={`rounded-xl border px-4 py-3 text-sm uppercase tracking-[0.2em] ${
                          selectedSubjectId === subject.id
                            ? 'border-[var(--c-c8102e)] bg-[var(--c-fff5f6)] text-[var(--c-1f1f1d)]'
                            : 'border-[var(--c-ecebe7)] bg-[var(--c-faf9f6)] text-[var(--c-6f6c65)]'
                        } cursor-pointer transition hover:border-[color:var(--c-c8102e)]/40 ${
                          draggingSubjectId === subject.id ? 'opacity-60' : ''
                        } ${
                          dropTargetId === subject.id
                            ? 'border-white/90 backdrop-blur-sm'
                            : ''
                        }`}
                        onClick={() => setSelectedSubjectId(subject.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={event => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setSelectedSubjectId(subject.id);
                          }
                        }}
                        draggable
                        onDragStart={() => handleDragStart(subject.id)}
                        onDragEnd={handleDragEnd}
                        onDragOver={event => {
                          event.preventDefault();
                          if (dropTargetId !== subject.id) {
                            setDropTargetId(subject.id);
                          }
                        }}
                        onDragLeave={() => {
                          if (dropTargetId === subject.id) {
                            setDropTargetId(null);
                          }
                        }}
                        onDrop={() => handleDropOnSubject(subject.id)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              className="text-[14px] font-semibold text-[var(--c-6f6c65)]"
                              onClick={event => event.stopPropagation()}
                              aria-label="Drag to reorder"
                            >
                              ::
                            </button>
                            <span>
                              {subject.title?.trim() || 'UNTITLED LESSON SUBJECT'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={event => {
                              event.stopPropagation();
                              handleRemoveSubject(subject.id);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] text-[14px] font-semibold"
                            aria-label="Remove lesson subject"
                          >
                            X
                          </button>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-xs text-[var(--c-6f6c65)]">
                    Add lesson subjects to start building.
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
              {selectedSubject ? 'Lesson Subject' : 'Pack Settings'}
            </p>
            <div className="mt-4 space-y-3 text-sm">
              {selectedSubject ? (
                <>
                  <label className="flex flex-col gap-2">
                    Lesson Subject Title
                    <input
                      value={selectedSubject.title}
                      onChange={event =>
                        handleSubjectUpdate(selectedSubject.id, {
                          title: event.target.value,
                        })
                      }
                      className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    Body
                    <textarea
                      value={selectedSubject.body}
                      onChange={event =>
                        handleSubjectUpdate(selectedSubject.id, {
                          body: event.target.value,
                        })
                      }
                      className="min-h-[120px] rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    Header Image URL
                    <input
                      value={selectedSubject.headerImageUrl}
                      onChange={event =>
                        handleSubjectUpdate(selectedSubject.id, {
                          headerImageUrl: event.target.value,
                        })
                      }
                      className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    Header Video URL
                    <input
                      value={selectedSubject.headerVideoUrl}
                      onChange={event =>
                        handleSubjectUpdate(selectedSubject.id, {
                          headerVideoUrl: event.target.value,
                        })
                      }
                      className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    Inline Video URL
                    <input
                      value={selectedSubject.inlineVideoUrl}
                      onChange={event =>
                        handleSubjectUpdate(selectedSubject.id, {
                          inlineVideoUrl: event.target.value,
                        })
                      }
                      className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    Inline PDF URL
                    <input
                      value={selectedSubject.inlinePdfUrl}
                      onChange={event =>
                        handleSubjectUpdate(selectedSubject.id, {
                          inlinePdfUrl: event.target.value,
                        })
                      }
                      className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    SoundSlice Embed URL
                    <input
                      value={selectedSubject.soundSliceUrl}
                      onChange={event =>
                        handleSubjectUpdate(selectedSubject.id, {
                          soundSliceUrl: event.target.value,
                        })
                      }
                      className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    SoundSlice Placement
                    <select
                      value={selectedSubject.soundSlicePlacement}
                      onChange={event =>
                        handleSubjectUpdate(selectedSubject.id, {
                          soundSlicePlacement: event.target
                            .value as LessonPackSubject['soundSlicePlacement'],
                        })
                      }
                      className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                    >
                      <option value="header">Header</option>
                      <option value="body">Above Body</option>
                    </select>
                  </label>

                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                      Links (3)
                    </p>
                    {selectedSubject.links.map((link, index) => (
                      <div
                        key={`link-${index}`}
                        className="grid grid-cols-1 gap-2 md:grid-cols-2"
                      >
                        <input
                          value={link.label}
                          onChange={event => {
                            const nextLinks = selectedSubject.links.map(
                              (item, linkIndex) =>
                                linkIndex === index
                                  ? { ...item, label: event.target.value }
                                  : item,
                            );
                            handleSubjectUpdate(selectedSubject.id, {
                              links: nextLinks,
                            });
                          }}
                          placeholder={`Link ${index + 1} label`}
                          className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                        />
                        <input
                          value={link.url}
                          onChange={event => {
                            const nextLinks = selectedSubject.links.map(
                              (item, linkIndex) =>
                                linkIndex === index
                                  ? { ...item, url: event.target.value }
                                  : item,
                            );
                            handleSubjectUpdate(selectedSubject.id, {
                              links: nextLinks,
                            });
                          }}
                          placeholder={`Link ${index + 1} url`}
                          className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                        />
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <label className="flex flex-col gap-2">
                    Description
                    <textarea
                      value={activePack?.description ?? ''}
                      onChange={event =>
                        handleMetaChange('description', event.target.value)
                      }
                      className="min-h-[120px] rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    Tags (comma separated)
                    <input
                      value={(activePack?.tags ?? []).join(', ')}
                      onChange={event =>
                        updateActivePack(pack => ({
                          ...pack,
                          tags: event.target.value
                            .split(',')
                            .map(tag => tag.trim())
                            .filter(Boolean),
                          updatedAt: new Date().toISOString(),
                        }))
                      }
                      className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    Teacher Price
                    <input
                      type="number"
                      value={activePack?.priceTeacher ?? ''}
                      onChange={event =>
                        handlePriceChange('priceTeacher', event.target.value)
                      }
                      className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    Student Price
                    <input
                      type="number"
                      value={activePack?.priceStudent ?? ''}
                      onChange={event =>
                        handlePriceChange('priceStudent', event.target.value)
                      }
                      className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                    />
                  </label>
                </>
              )}
            </div>
          </section>

          {isSaving ? (
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
              Saving...
            </p>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
