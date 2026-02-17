'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLessonData } from '../../components/use-lesson-data';
import { useLessonCart } from '../../components/lesson-cart';
import { useLessonCartScope, makeStudentScope } from '../../components/lesson-cart-scope';
import { makePracticeMaterialId } from '../../components/practice-hub-utils';

export default function StudentPracticeHubPage() {
  const { lessonMaterials } = useLessonData();
  const { scope, studentId } = useLessonCartScope();
  const studentScope = studentId ? makeStudentScope(studentId) : scope;
  const { purchasedItems } = useLessonCart(studentScope);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [focusIds, setFocusIds] = useState<string[]>([]);
  const [practiceDays, setPracticeDays] = useState<Record<string, string[]>>({});
  const [helpFlags, setHelpFlags] = useState<Record<string, boolean>>({});
  const [studentServerUnlocks, setStudentServerUnlocks] = useState<
    typeof purchasedItems
  >([]);

  useEffect(() => {
    if (!studentId) return;
    fetch('/api/practice-hub/unlocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'student',
        studentId,
        items: purchasedItems,
      }),
    }).catch(() => undefined);
  }, [purchasedItems, studentId]);

  useEffect(() => {
    if (!studentId) return;
    const refreshFromServer = async () => {
      try {
        const [unlocksRes, visibilityRes] = await Promise.all([
          fetch(`/api/practice-hub/unlocks?role=student&studentId=${encodeURIComponent(studentId)}`),
          fetch(`/api/practice-hub/visibility?studentId=${encodeURIComponent(studentId)}`),
        ]);
        const unlocksData = await unlocksRes.json();
        const visibilityData = await visibilityRes.json();
        setStudentServerUnlocks(unlocksData.items ?? []);
        setSelectedIds(
          Array.isArray(visibilityData.selectedIds) ? visibilityData.selectedIds : [],
        );
        setFocusIds(
          Array.isArray(visibilityData.focusIds) ? visibilityData.focusIds : [],
        );
        setPracticeDays(
          visibilityData.practiceDays && typeof visibilityData.practiceDays === 'object'
            ? visibilityData.practiceDays
            : {},
        );
        setHelpFlags(
          visibilityData.helpFlags && typeof visibilityData.helpFlags === 'object'
            ? visibilityData.helpFlags
            : {},
        );
      } catch {
        // ignore
      }
    };
    refreshFromServer();
    const timer = window.setInterval(refreshFromServer, 2000);
    return () => window.clearInterval(timer);
  }, [studentId]);

  useEffect(() => {
    if (!studentId) return;
    fetch('/api/practice-hub/visibility', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId,
        practiceDays,
        helpFlags,
      }),
    }).catch(() => undefined);
  }, [practiceDays, helpFlags, studentId]);

  const unlockedSections = useMemo(() => {
    return studentServerUnlocks.map(item => ({
      program: item.program,
      section: item.section,
      materials:
        lessonMaterials[
          `${item.program}|${item.section}` as keyof typeof lessonMaterials
        ] ?? [],
    }));
  }, [studentServerUnlocks, lessonMaterials]);

  const visibleSections = useMemo(() => {
    return unlockedSections
      .map(section => {
        const materials = section.materials.filter(material =>
          selectedIds.includes(
            makePracticeMaterialId(
              section.program,
              section.section,
              material,
            ),
          ),
        );
        return {
          ...section,
          materials: materials.map(material => ({
            name: material,
            focused: focusIds.includes(
              makePracticeMaterialId(
                section.program,
                section.section,
                material,
              ),
            ),
          })),
        };
      })
      .filter(section => section.materials.length > 0);
  }, [selectedIds, focusIds, unlockedSections]);

  const focusItems = useMemo(() => {
    const focused: Array<{ name: string; program: string; section: string }> = [];
    visibleSections.forEach(section => {
      section.materials.forEach(material => {
        if (material.focused) {
          focused.push({
            name: material.name,
            program: section.program,
            section: section.section,
          });
        }
      });
    });
    return focused;
  }, [visibleSections]);

  const daysOfWeek = useMemo(
    () => ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
    [],
  );

  const togglePracticeDay = (id: string, day: string) => {
    setPracticeDays(current => {
      const existing = current[id] ?? [];
      const next = existing.includes(day)
        ? existing.filter(value => value !== day)
        : [...existing, day];
      return { ...current, [id]: next };
    });
  };

  const toggleHelpFlag = (id: string) => {
    setHelpFlags(current => ({ ...current, [id]: !current[id] }));
  };

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
          Students
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold text-[var(--c-1f1f1d)]">
            Practice Hub
          </h1>
        </div>
        <p className="text-base text-[var(--c-6f6c65)]">
          Your current playlist and open songs to play and practice. Help keep
          your playlist alive!
        </p>
      </header>

      <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f1f1ef)] p-6 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.45)] ring-1 ring-[var(--c-ecebe7)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
              Playlist
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--c-1f1f1d)]">
              Sections &amp; Materials
            </h2>
            <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
              Only items your teacher has shared appear here.
            </p>
          </div>

        </div>

        {visibleSections.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-6 text-sm text-[var(--c-6f6c65)]">
            Your teacher hasn&apos;t shared any practice items yet.
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            {focusItems.length > 0 ? (
              <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-6f6c65)]">
                  Songs To Focus On
                </p>
                <div className="mt-3 space-y-2">
                  {focusItems.map(item => {
                    const materialId = makePracticeMaterialId(
                      item.program,
                      item.section,
                      item.name,
                    );
                    return (
                    <div
                      key={`${item.program}-${item.section}-${item.name}`}
                      className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3 text-base text-[var(--c-1f1f1d)]"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="min-w-0 flex-1 pr-2">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {daysOfWeek.map(day => {
                              const isChecked =
                                practiceDays[materialId]?.includes(day) ?? false;
                              return (
                                <button
                                  key={`${materialId}-${day}`}
                                  type="button"
                                  onClick={() => togglePracticeDay(materialId, day)}
                                  className={`flex h-8 w-8 items-center justify-center rounded-full border text-[11px] font-semibold uppercase tracking-[0.1em] transition ${
                                    isChecked
                                      ? 'border-[var(--c-c8102e)] bg-[var(--c-c8102e)] text-white'
                                      : 'border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] text-[var(--c-6f6c65)] hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]'
                                  }`}
                                  aria-pressed={isChecked}
                                  aria-label={`Practiced on ${day}`}
                                  title={day}
                                >
                                  {day.slice(0, 1)}
                                </button>
                              );
                            })}
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleHelpFlag(materialId)}
                            className={`flex h-7 w-7 items-center justify-center rounded-full border text-sm font-semibold transition ${
                              helpFlags[materialId]
                                ? 'border-[var(--c-c8102e)] bg-[var(--c-fff5f6)] text-[var(--c-c8102e)]'
                                : 'border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] text-[var(--c-6f6c65)] hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]'
                            }`}
                            aria-pressed={helpFlags[materialId] ?? false}
                            aria-label="Needs help"
                            title="Needs help"
                          >
                            ?
                          </button>
                          <span className="flex h-7 w-7 items-center justify-center">
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="text-white"
                              aria-hidden="true"
                            >
                              <path d="M12 17.27l5.18 3.03-1.39-5.81 4.52-3.9-5.95-.5L12 4.5 9.64 10.09l-5.95.5 4.52 3.9-1.39 5.81L12 17.27z" />
                            </svg>
                          </span>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
            {visibleSections.map(section => (
              <div
                key={`${section.program}-${section.section}`}
                className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                      {section.program}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-[var(--c-1f1f1d)]">
                      {section.section}
                    </p>
                  </div>
                  <span className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                    Materials
                  </span>
                </div>
                <div className="mt-4 space-y-2">
                  {section.materials.map(material => (
                    <div
                      key={`${section.program}-${section.section}-${material.name}`}
                      className={`rounded-xl border border-[var(--c-ecebe7)] px-4 py-3 text-base text-[var(--c-1f1f1d)] ${
                        material.focused
                          ? 'bg-[var(--c-faf9f6)]'
                          : 'bg-[var(--c-fcfcfb)]'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="min-w-0 flex-1 pr-2">{material.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {daysOfWeek.map(day => {
                              const materialId = makePracticeMaterialId(
                                section.program,
                                section.section,
                                material.name,
                              );
                              const isChecked =
                                practiceDays[materialId]?.includes(day) ?? false;
                              return (
                                <button
                                  key={`${materialId}-${day}`}
                                  type="button"
                                  onClick={() => togglePracticeDay(materialId, day)}
                                  className={`flex h-8 w-8 items-center justify-center rounded-full border text-[11px] font-semibold uppercase tracking-[0.1em] transition ${
                                    isChecked
                                      ? 'border-[var(--c-c8102e)] bg-[var(--c-c8102e)] text-white'
                                      : 'border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] text-[var(--c-6f6c65)] hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]'
                                  }`}
                                  aria-pressed={isChecked}
                                  aria-label={`Practiced on ${day}`}
                                  title={day}
                                >
                                  {day.slice(0, 1)}
                                </button>
                              );
                            })}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              toggleHelpFlag(
                                makePracticeMaterialId(
                                  section.program,
                                  section.section,
                                  material.name,
                                ),
                              )
                            }
                            className={`flex h-7 w-7 items-center justify-center rounded-full border text-sm font-semibold transition ${
                              helpFlags[
                                makePracticeMaterialId(
                                  section.program,
                                  section.section,
                                  material.name,
                                )
                              ]
                                ? 'border-[var(--c-c8102e)] bg-[var(--c-fff5f6)] text-[var(--c-c8102e)]'
                                : 'border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] text-[var(--c-6f6c65)] hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]'
                            }`}
                            aria-pressed={
                              helpFlags[
                                makePracticeMaterialId(
                                  section.program,
                                  section.section,
                                  material.name,
                                )
                              ] ?? false
                            }
                            aria-label="Needs help"
                            title="Needs help"
                          >
                            ?
                          </button>
                          <span className="flex h-7 w-7 items-center justify-center">
                            {material.focused ? (
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="text-white"
                                aria-hidden="true"
                              >
                                <path d="M12 17.27l5.18 3.03-1.39-5.81 4.52-3.9-5.95-.5L12 4.5 9.64 10.09l-5.95.5 4.52 3.9-1.39 5.81L12 17.27z" />
                              </svg>
                            ) : null}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
