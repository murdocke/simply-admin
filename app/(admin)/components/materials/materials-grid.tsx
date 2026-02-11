'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import lessonParts from '../../teachers/students/lesson-data/lesson-parts.json';

type MaterialsMode = 'training' | 'teaching' | 'learning';

type MaterialsGridProps = {
  materials: string[];
  mode: MaterialsMode;
  initialMaterial?: string;
  initialPart?: string;
};

const teacherPhrases: Record<'training' | 'teaching', string[]> = {
  training: [
    'Nice choice... Ready for Training?',
    "Solid pick... Let's practice it together.",
    'Great call... Your next training step awaits.',
  ],
  teaching: [
    'Nice choice... Ready to Teach?',
    "Strong selection... Let's teach it with confidence.",
    'Great call... Time to bring it to the studio.',
  ],
};

const learningPhrases = [
  "Great selection... let's get to learning...",
  'Awesome choice... time to play and explore.',
  "Nice pick... let's make some music.",
];

const hashString = (value: string) =>
  value.split('').reduce((total, char) => total + char.charCodeAt(0), 0);

const pickPhrase = (phrases: string[], material: string) => {
  if (phrases.length === 0) return '';
  const index = Math.abs(hashString(material)) % phrases.length;
  return phrases[index];
};

export default function MaterialsGrid({
  materials,
  mode,
  initialMaterial,
  initialPart,
}: MaterialsGridProps) {
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [pendingNextMaterial, setPendingNextMaterial] = useState<string | null>(
    null
  );
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const detailsRef = useRef<HTMLDivElement | null>(null);
  const initialMaterialApplied = useRef(false);
  const initialPartApplied = useRef(false);
  const [isReferenceOpen, setIsReferenceOpen] = useState(false);
  const [isSheetMusicOpen, setIsSheetMusicOpen] = useState(false);
  const [noteValue, setNoteValue] = useState('');
  const [showAskQuestion, setShowAskQuestion] = useState(false);
  const splitIndex = Math.ceil(materials.length / 2);
  const [columnOne, columnTwo] = useMemo(
    () => [materials.slice(0, splitIndex), materials.slice(splitIndex)],
    [materials, splitIndex]
  );
  const lessonPartItems = useMemo(() => {
    if (!selectedMaterial) return [];
    const partsMap = lessonParts as Record<string, string[]>;
    const matchedKey = Object.keys(partsMap).find(prefix =>
      selectedMaterial.startsWith(prefix)
    );
    return matchedKey ? partsMap[matchedKey] ?? [] : [];
  }, [selectedMaterial]);
  const activePartIndex = selectedPart
    ? lessonPartItems.indexOf(selectedPart)
    : -1;
  const hasParts = lessonPartItems.length > 0;
  const canGoPrev = hasParts && activePartIndex > 0;
  const hasNextPart =
    hasParts && activePartIndex >= 0 && activePartIndex < lessonPartItems.length - 1;
  const hasNextMaterial =
    !!selectedMaterial &&
    materials.indexOf(selectedMaterial) >= 0 &&
    materials.indexOf(selectedMaterial) < materials.length - 1;
  const canGoNext = hasNextPart || hasNextMaterial;
  const partMarkerKey = 'sm_material_part_marker';
  const lastViewedKey = 'sm_last_viewed_video';
  const playedStorageKey = 'sm-video-played';
  const notesStorageKey = 'sm_material_notes';
  const sectionTitleFor = (material: string) =>
    material.replace(/^\s*\d+(\.\d+)?\s*[–-]\s*/i, '').trim();
  const lessonTitle = selectedMaterial
    ? sectionTitleFor(selectedMaterial) || selectedMaterial
    : 'Lesson Title';
  const partLabel = hasParts ? selectedPart ?? 'Select a lesson part to begin.' : null;
  const nextLabel = useMemo(() => {
    if (!selectedMaterial) return null;
    const partsMap = lessonParts as Record<string, string[]>;
    if (activePartIndex >= 0 && activePartIndex < lessonPartItems.length - 1) {
      return lessonPartItems[activePartIndex + 1];
    }
    const materialIndex = materials.indexOf(selectedMaterial);
    if (materialIndex < 0 || materialIndex >= materials.length - 1) {
      return null;
    }
    const nextMaterial = materials[materialIndex + 1];
    let savedPart: string | undefined;
    try {
      const stored = window.localStorage.getItem(partMarkerKey);
      const parsed = stored ? (JSON.parse(stored) as Record<string, string>) : {};
      savedPart = parsed[nextMaterial];
    } catch {
      savedPart = undefined;
    }
    const nextKey = Object.keys(partsMap).find(prefix =>
      nextMaterial.startsWith(prefix)
    );
    const nextParts = nextKey ? partsMap[nextKey] ?? [] : [];
    const nextPart =
      savedPart && nextParts.includes(savedPart) ? savedPart : nextParts[0];
    const sectionTitle = sectionTitleFor(nextMaterial);
    if (nextPart) {
      return `${sectionTitle} - ${nextPart}`;
    }
    return sectionTitle || nextMaterial || null;
  }, [activePartIndex, lessonPartItems, materials, selectedMaterial]);

  const handleNextClick = () => {
    if (!selectedMaterial) return;
    if (activePartIndex >= 0 && activePartIndex < lessonPartItems.length - 1) {
      setSelectedPart(lessonPartItems[activePartIndex + 1]);
      return;
    }
    const materialIndex = materials.indexOf(selectedMaterial);
    if (materialIndex < 0 || materialIndex >= materials.length - 1) {
      return;
    }
    const nextMaterial = materials[materialIndex + 1];
    setPendingNextMaterial(nextMaterial);
  };
  const fallbackDuration = useMemo(() => 3 + Math.floor(Math.random() * 5), []);
  const totalDurationMinutes =
    lessonPartItems.length > 0 ? lessonPartItems.length * 3 : fallbackDuration;
  const progressPercent = useMemo(() => {
    if (!selectedMaterial) return 35;
    const seed = selectedMaterial
      .split('')
      .reduce((total, char) => total + char.charCodeAt(0), 0);
    return 25 + (seed % 56);
  }, [selectedMaterial]);

  useEffect(() => {
    if (initialMaterialApplied.current || !initialMaterial) return;
    const match = materials.find(item => item === initialMaterial);
    if (!match) return;
    setSelectedMaterial(match);
    initialMaterialApplied.current = true;
  }, [initialMaterial, materials]);

  useEffect(() => {
    if (!selectedMaterial) {
      setSelectedPart(null);
      return;
    }
    if (lessonPartItems.length === 0) {
      setSelectedPart(null);
      return;
    }
    if (
      !initialPartApplied.current &&
      initialPart &&
      selectedMaterial === initialMaterial &&
      lessonPartItems.includes(initialPart)
    ) {
      setSelectedPart(initialPart);
      initialPartApplied.current = true;
      return;
    }
    try {
      const stored = window.localStorage.getItem(partMarkerKey);
      const parsed = stored ? (JSON.parse(stored) as Record<string, string>) : {};
      const savedPart = parsed[selectedMaterial];
      if (savedPart && lessonPartItems.includes(savedPart)) {
        setSelectedPart(savedPart);
        return;
      }
      setSelectedPart(lessonPartItems[0]);
    } catch {
      setSelectedPart(lessonPartItems[0]);
    }
  }, [lessonPartItems, selectedMaterial]);

  useEffect(() => {
    if (!selectedMaterial) return;
    if (!detailsRef.current) return;
    detailsRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, [selectedMaterial]);

  useEffect(() => {
    if (!selectedMaterial) return;
    const payload = {
      material: selectedMaterial,
      part: selectedPart ?? undefined,
      materials,
      viewedAt: new Date().toISOString(),
    };
    try {
      window.localStorage.setItem(lastViewedKey, JSON.stringify(payload));
      window.dispatchEvent(new Event('sm-last-viewed-video'));
    } catch {
      window.dispatchEvent(new Event('sm-last-viewed-video'));
    }
  }, [lastViewedKey, materials, selectedMaterial, selectedPart]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!selectedMaterial) return;
      const target = event.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') {
          return;
        }
        if (target.isContentEditable) return;
      }
      if (event.code === 'Space') {
        event.preventDefault();
        return;
      }
      if (event.key.toLowerCase() === 'n') {
        if (!canGoNext) return;
        event.preventDefault();
        if (hasNextPart) {
          setSelectedPart(lessonPartItems[activePartIndex + 1]);
          return;
        }
        if (hasNextMaterial) {
          handleNextClick();
        }
        return;
      }
      if (event.key.toLowerCase() === 'p') {
        if (!canGoPrev) return;
        event.preventDefault();
        setSelectedPart(lessonPartItems[activePartIndex - 1]);
        return;
      }
      if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        setIsVideoModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activePartIndex,
    canGoNext,
    canGoPrev,
    hasNextMaterial,
    hasNextPart,
    lessonPartItems,
    selectedMaterial,
  ]);

  useEffect(() => {
    if (!selectedMaterial || !selectedPart) return;
    try {
      const stored = window.localStorage.getItem(partMarkerKey);
      const parsed = stored ? (JSON.parse(stored) as Record<string, string>) : {};
      const next = { ...parsed, [selectedMaterial]: selectedPart };
      window.localStorage.setItem(partMarkerKey, JSON.stringify(next));
    } catch {
      // Ignore storage failures.
    }
  }, [selectedMaterial, selectedPart]);

  useEffect(() => {
    if (!selectedMaterial) {
      setNoteValue('');
      return;
    }
    const noteKey = selectedPart
      ? `${selectedMaterial}||${selectedPart}`
      : selectedMaterial;
    try {
      const stored = window.localStorage.getItem(notesStorageKey);
      const parsed = stored ? (JSON.parse(stored) as Record<string, string>) : {};
      setNoteValue(parsed[noteKey] ?? '');
    } catch {
      setNoteValue('');
    }
  }, [selectedMaterial, selectedPart]);

  useEffect(() => {
    if (!selectedMaterial) return;
    const noteKey = selectedPart
      ? `${selectedMaterial}||${selectedPart}`
      : selectedMaterial;
    try {
      const stored = window.localStorage.getItem(notesStorageKey);
      const parsed = stored ? (JSON.parse(stored) as Record<string, string>) : {};
      const next = { ...parsed, [noteKey]: noteValue };
      window.localStorage.setItem(notesStorageKey, JSON.stringify(next));
    } catch {
      // Ignore storage failures.
    }
  }, [noteValue, notesStorageKey, selectedMaterial, selectedPart]);

  const subtitle = selectedMaterial
    ? mode === 'learning'
      ? pickPhrase(learningPhrases, selectedMaterial)
      : pickPhrase(teacherPhrases[mode], selectedMaterial)
    : '';
  const nowPlayingLabel = isPlaying ? 'Now Playing' : 'Viewing';

  const markPlayedGlobal = () => {
    if (!selectedMaterial) return;
    const key = `${selectedMaterial}||${selectedPart ?? ''}`;
    try {
      const raw = window.localStorage.getItem(playedStorageKey);
      const stored = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
      const next = { ...stored, [key]: true };
      window.localStorage.setItem(playedStorageKey, JSON.stringify(next));
      window.dispatchEvent(new Event('sm-video-played'));
    } catch {
      window.dispatchEvent(new Event('sm-video-played'));
    }
  };

  const handlePlayToggle = () => {
    if (!selectedMaterial) return;
    if (!isPlaying) {
      markPlayedGlobal();
    }
    setIsPlaying(current => !current);
    setHasPlayed(true);
  };

  const handleOpenPip = () => {
    if (!selectedMaterial) return;
    const payload = {
      open: true,
      playing: true,
      material: selectedMaterial,
      part: selectedPart ?? '',
      materials,
    };
    try {
      window.localStorage.setItem('sm_pip_state', JSON.stringify(payload));
      window.dispatchEvent(new Event('sm-pip-update'));
    } catch {
      window.dispatchEvent(new Event('sm-pip-update'));
    }
    setIsPlaying(true);
    setHasPlayed(true);
  };

  const closePip = () => {
    try {
      const stored = window.localStorage.getItem('sm_pip_state');
      const parsed = stored ? (JSON.parse(stored) as Record<string, unknown>) : {};
      if (parsed?.open || parsed?.playing) {
        window.localStorage.setItem(
          'sm_pip_state',
          JSON.stringify({ ...parsed, open: false, playing: false }),
        );
        window.dispatchEvent(new Event('sm-pip-update'));
      }
    } catch {
      window.dispatchEvent(new Event('sm-pip-update'));
    }
  };

  useEffect(() => {
    if (!selectedMaterial) return;
    const payload = {
      open: false,
      playing: isPlaying,
      material: selectedMaterial,
      part: selectedPart ?? '',
      materials,
    };
    try {
      const stored = window.localStorage.getItem('sm_pip_state');
      const parsed = stored ? (JSON.parse(stored) as Record<string, unknown>) : {};
      if (parsed?.open) {
        window.localStorage.setItem(
          'sm_pip_state',
          JSON.stringify({ ...payload, open: false }),
        );
      } else {
        window.localStorage.setItem('sm_pip_state', JSON.stringify(payload));
      }
      window.dispatchEvent(new Event('sm-pip-update'));
    } catch {
      window.dispatchEvent(new Event('sm-pip-update'));
    }
  }, [isPlaying, materials, selectedMaterial, selectedPart]);

  useEffect(() => {
    return () => {
      if (!isPlaying || !selectedMaterial) return;
      const payload = {
        open: true,
        playing: true,
        material: selectedMaterial,
        part: selectedPart ?? '',
        materials,
      };
      try {
        window.localStorage.setItem('sm_pip_state', JSON.stringify(payload));
        window.dispatchEvent(new Event('sm-pip-update'));
      } catch {
        window.dispatchEvent(new Event('sm-pip-update'));
      }
    };
  }, [isPlaying, materials, selectedMaterial, selectedPart]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-6">
          <div className="space-y-3">
            {columnOne.map(material => (
              <button
                key={material}
                type="button"
                onClick={() => setSelectedMaterial(material)}
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                  selectedMaterial === material
                  ? 'border-[var(--c-c8102e)] bg-[var(--c-fff5f0)] text-[var(--c-3a3935)] shadow-sm'
                  : 'border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] text-[var(--c-3a3935)] hover:border-[var(--c-d9d6cf)]'
                }`}
              >
                {material}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {columnTwo.map(material => (
              <button
                key={material}
                type="button"
                onClick={() => setSelectedMaterial(material)}
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                  selectedMaterial === material
                  ? 'border-[var(--c-c8102e)] bg-[var(--c-fff5f0)] text-[var(--c-3a3935)] shadow-sm'
                  : 'border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] text-[var(--c-3a3935)] hover:border-[var(--c-d9d6cf)]'
                }`}
              >
                {material}
              </button>
            ))}
          </div>
        </div>
      </section>

      {selectedMaterial ? (
        <section
          ref={detailsRef}
          className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm"
        >
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
              {selectedMaterial}
            </h2>
            <p className="text-sm text-[var(--c-6f6c65)]">{subtitle}</p>
          </div>

          <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <div className="space-y-4">
              <div className="overflow-hidden rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] shadow-sm">
                <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-[#070707]">
                  <img
                    src="/reference/StudentVideo-2.png"
                    alt="Lesson video preview"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,6,6,0.65),rgba(3,3,3,0.95))]" />
                  <div className="relative z-10 px-6 text-center">
                    <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
                      {nowPlayingLabel}
                    </p>
                    <h4 className="mt-2 text-xl font-semibold text-white">
                      {lessonTitle}
                    </h4>
                    {partLabel ? (
                      <p className="mt-2 text-sm text-white/70">{partLabel}</p>
                    ) : null}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center gap-3 border-t border-white/10 bg-black/60 px-4 py-3 text-white">
                    <button
                      type="button"
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/15 text-sm text-white shadow-[0_8px_20px_rgba(0,0,0,0.35)] transition hover:border-white/40 hover:bg-white/25"
                      aria-label={isPlaying ? 'Pause' : 'Play'}
                      onClick={handlePlayToggle}
                    >
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="h-4 w-4 translate-x-[1px] fill-current"
                      >
                        {isPlaying ? (
                          <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                        ) : (
                          <path d="M8 5v14l11-7z" />
                        )}
                      </svg>
                    </button>
                    <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold tracking-wide">
                      02:39
                    </span>
                    <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/20">
                      <div
                        className="h-full rounded-full bg-white"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/70">
                      <span>Vol</span>
                      <div className="h-1 w-12 rounded-full bg-white/20">
                        <div className="h-full w-[60%] rounded-full bg-white/70" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasPlayed ? (
                        <button
                          type="button"
                          onClick={handleOpenPip}
                          className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80 transition hover:border-white/40 hover:text-white"
                        >
                          PIP
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => {
                          closePip();
                          setIsVideoModalOpen(true);
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/80 transition hover:border-white/40 hover:text-white"
                        aria-label="Expand video"
                      >
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="15 3 21 3 21 9" />
                          <polyline points="9 21 3 21 3 15" />
                          <line x1="21" y1="3" x2="14" y2="10" />
                          <line x1="3" y1="21" x2="10" y2="14" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--c-ecebe7)] px-6 py-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                    {hasParts && activePartIndex >= 0
                      ? `Part ${activePartIndex + 1} of ${lessonPartItems.length}`
                      : 'Part Navigation'}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!canGoPrev) return;
                        setSelectedPart(lessonPartItems[activePartIndex - 1]);
                      }}
                      disabled={!canGoPrev}
                      className={`rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                        canGoPrev
                          ? 'border-[var(--c-1f1f1d)] text-[var(--c-1f1f1d)] hover:border-[var(--c-c8102e)] hover:text-[var(--c-c8102e)]'
                          : 'border-[var(--c-ecebe7)] text-[var(--c-9a9892)]'
                      }`}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!canGoNext) return;
                        if (hasNextPart) {
                          setSelectedPart(lessonPartItems[activePartIndex + 1]);
                          return;
                        }
                        if (hasNextMaterial) {
                          handleNextClick();
                        }
                      }}
                      disabled={!canGoNext}
                      className={`rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                        canGoNext
                          ? 'border-[var(--c-1f1f1d)] text-[var(--c-1f1f1d)] hover:border-[var(--c-c8102e)] hover:text-[var(--c-c8102e)]'
                          : 'border-[var(--c-ecebe7)] text-[var(--c-9a9892)]'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
                <div className="space-y-4 p-6">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-[var(--c-c8102e)]">
                      Lesson Title
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                      {lessonTitle}
                    </h3>
                    <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                      Subtitle: Building expressive touch with a dynamic palette.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-[var(--c-efe7d5)] bg-[var(--c-fff7e8)] p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--c-7a4a17)]">
                        Reference Paper
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsReferenceOpen(true)}
                        className="mt-2 text-sm font-semibold text-[var(--c-1f1f1d)] underline decoration-[var(--c-7a4a17)]/40 underline-offset-4 transition hover:decoration-[var(--c-7a4a17)]"
                      >
                        View Reference
                      </button>
                    </div>
                    <div className="rounded-2xl border border-[var(--c-e6eef8)] bg-[var(--c-f5f9ff)] p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--c-28527a)]">
                        Sheet Music
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsSheetMusicOpen(true)}
                        className="mt-2 text-sm font-semibold text-[var(--c-1f1f1d)] underline decoration-[var(--c-28527a)]/40 underline-offset-4 transition hover:decoration-[var(--c-28527a)]"
                      >
                        View Sheet Music
                      </button>
                    </div>
                    <div className="rounded-2xl border border-[var(--c-e8efe9)] bg-[var(--c-f6fbf7)] p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--c-2d6a4f)]">
                        Total Duration
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[var(--c-1f1f1d)]">
                        {totalDurationMinutes} min
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-faf9f6)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                          Progress
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[var(--c-1f1f1d)]">
                          {progressPercent}% watched
                        </p>
                      </div>
                      {nextLabel ? (
                        <button
                          type="button"
                          onClick={handleNextClick}
                          className="rounded-full border border-[var(--c-d9e2ef)] bg-[var(--c-ffffff)] px-3 py-1 text-sm font-semibold text-[var(--c-1f1f1d)] transition hover:border-[var(--c-c8102e)] hover:text-[var(--c-c8102e)]"
                        >
                          Next: {nextLabel}
                        </button>
                      ) : null}
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--c-ffffff)]">
                      <div
                        className="h-full rounded-full bg-[var(--c-c8102e)]"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={`grid gap-4 ${
                  mode === 'learning' ? 'md:grid-cols-3' : 'md:grid-cols-2'
                }`}
              >
                <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                    Completed
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                      Not Yet
                    </span>
                    <button className="rounded-full border border-[var(--c-c8102e)] px-4 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--c-c8102e)]">
                      Mark Done
                    </button>
                  </div>
                </div>
                <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                    Add As Favorite
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                      No
                    </span>
                    <button className="rounded-full border border-[var(--c-111111)] px-4 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--c-111111)]">
                      Favorite
                    </button>
                  </div>
                </div>
                {mode === 'learning' ? (
                  <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                      Ask For Help
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                        Send Message
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAskQuestion(true)}
                        className="rounded-full border border-[var(--c-1f1f1d)] px-4 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--c-1f1f1d)]"
                      >
                        Ask
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <aside className="space-y-4">
              {lessonPartItems.length > 0 ? (
                <div className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.25em] text-[var(--c-c8102e)]">
                    Lesson Snapshot
                  </p>
                  <h3 className="mt-3 text-lg font-semibold text-[var(--c-1f1f1d)]">
                    Lesson Parts
                  </h3>
                  <ul className="mt-4 space-y-2 text-sm text-[var(--c-6f6c65)]">
                    {lessonPartItems.map(item => (
                      <li key={item}>
                        <button
                          type="button"
                          onClick={() => setSelectedPart(item)}
                          className={`flex w-full items-start gap-3 rounded-2xl border px-3 py-2 text-left transition ${
                            selectedPart === item
                              ? 'border-[var(--c-c8102e)] bg-[var(--c-fff5f0)] text-[var(--c-3a3935)]'
                              : 'border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] text-[var(--c-6f6c65)] hover:border-[var(--c-d9d6cf)]'
                          }`}
                        >
                          <span
                            className={`mt-1 h-2 w-2 rounded-full ${
                              selectedPart === item
                                ? 'bg-[var(--c-c8102e)]'
                                : 'bg-[var(--c-9a9892)]'
                            }`}
                          />
                          <span>{item}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-[var(--c-6f6c65)]">
                      Notes
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[var(--c-1f1f1d)]">
                      Lesson Notes
                    </p>
                  </div>
                  <span className="rounded-full border border-[var(--c-e8efe9)] bg-[var(--c-f6fbf7)] px-3 py-1 text-xs font-semibold text-[var(--c-2d6a4f)]">
                    Auto-saved
                  </span>
                </div>
                <textarea
                  value={noteValue}
                  onChange={event => setNoteValue(event.target.value)}
                  rows={5}
                  placeholder={
                    selectedPart
                      ? `Write a note for ${selectedPart}...`
                      : 'Write a note for this material...'
                  }
                  className="mt-4 w-full resize-none rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-faf9f6)] px-4 py-3 text-sm text-[var(--c-1f1f1d)] placeholder:text-[var(--c-9c978f)]"
                />
              </div>

              {mode === 'learning' && showAskQuestion ? (
                <div className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.25em] text-[var(--c-c8102e)]">
                      Ask A Question
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowAskQuestion(false)}
                      className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--c-6f6c65)]"
                    >
                      Close
                    </button>
                  </div>
                  <p className="mt-3 text-sm text-[var(--c-6f6c65)]">
                    {selectedMaterial
                      ? `Send a message about "${sectionTitleFor(selectedMaterial)}".`
                      : 'Send a message about this lesson.'}
                  </p>
                  <textarea
                    rows={5}
                    placeholder="Type your question..."
                    className="mt-4 w-full resize-none rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-faf9f6)] px-4 py-3 text-sm text-[var(--c-1f1f1d)] placeholder:text-[var(--c-9c978f)]"
                  />
                  <button className="mt-4 w-full rounded-2xl bg-[var(--c-c8102e)] px-4 py-2 text-sm font-semibold text-white">
                    Send Message
                  </button>
                </div>
              ) : null}
            </aside>
          </section>
        </section>
      ) : null}
      {pendingNextMaterial ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setPendingNextMaterial(null)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-xl">
            <p className="text-xs uppercase tracking-[0.25em] text-[var(--c-c8102e)]">
              Ready For Next Lesson?
            </p>
            <h3 className="mt-2 text-xl font-semibold text-[var(--c-1f1f1d)]">
              You are leaving &quot;{selectedMaterial}&quot;.
            </h3>
            <p className="mt-3 text-sm text-[var(--c-6f6c65)]">
              Ready to work on the next section?
            </p>
            <div className="mt-4 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-faf9f6)] p-4 text-sm text-[var(--c-1f1f1d)]">
              {pendingNextMaterial}
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingNextMaterial(null)}
                className="rounded-full border border-[var(--c-ecebe7)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--c-6f6c65)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedMaterial(pendingNextMaterial);
                  setPendingNextMaterial(null);
                }}
                className="rounded-full bg-[var(--c-c8102e)] px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {isReferenceOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsReferenceOpen(false)}
          />
          <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--c-ecebe7)] px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[var(--c-c8102e)]">
                  Reference Paper
                </p>
                <h3 className="mt-1 text-lg font-semibold text-[var(--c-1f1f1d)]">
                  Dreams Come True
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="/reference/dreams-come-true.png"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[var(--c-1f1f1d)] px-4 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--c-1f1f1d)] transition hover:border-[var(--c-c8102e)] hover:text-[var(--c-c8102e)]"
                >
                  Open Full Size
                </a>
                <a
                  href="/reference/dreams-come-true.png"
                  download
                  className="rounded-full border border-[var(--c-1f1f1d)] px-4 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--c-1f1f1d)] transition hover:border-[var(--c-c8102e)] hover:text-[var(--c-c8102e)]"
                >
                  Download
                </a>
                <button
                  type="button"
                  onClick={() => setIsReferenceOpen(false)}
                  className="rounded-full border border-[var(--c-1f1f1d)] px-4 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--c-1f1f1d)]"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="bg-[var(--c-faf9f6)] p-6">
              <img
                src="/reference/dreams-come-true.png"
                alt="Reference Paper for Dreams Come True"
                className="mx-auto max-h-[70vh] w-auto rounded-2xl border border-[var(--c-ecebe7)] bg-white shadow-sm"
              />
            </div>
          </div>
        </div>
      ) : null}
      {isSheetMusicOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsSheetMusicOpen(false)}
          />
          <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--c-ecebe7)] px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[var(--c-c8102e)]">
                  Sheet Music
                </p>
                <h3 className="mt-1 text-lg font-semibold text-[var(--c-1f1f1d)]">
                  Dreams Come True
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="/reference/sheet-music.png"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[var(--c-1f1f1d)] px-4 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--c-1f1f1d)] transition hover:border-[var(--c-c8102e)] hover:text-[var(--c-c8102e)]"
                >
                  Open Full Size
                </a>
                <a
                  href="/reference/sheet-music.png"
                  download
                  className="rounded-full border border-[var(--c-1f1f1d)] px-4 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--c-1f1f1d)] transition hover:border-[var(--c-c8102e)] hover:text-[var(--c-c8102e)]"
                >
                  Download
                </a>
                <button
                  type="button"
                  onClick={() => setIsSheetMusicOpen(false)}
                  className="rounded-full border border-[var(--c-1f1f1d)] px-4 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--c-1f1f1d)]"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="bg-[var(--c-faf9f6)] p-6">
              <img
                src="/reference/sheet-music.png"
                alt="Sheet music for Dreams Come True"
                className="mx-auto max-h-[70vh] w-auto rounded-2xl border border-[var(--c-ecebe7)] bg-white shadow-sm"
              />
            </div>
          </div>
        </div>
      ) : null}

      {isVideoModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsVideoModalOpen(false)}
          />
          <div className="relative w-full max-w-6xl rounded-3xl border border-white/10 bg-[#0b0b0b] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                  Now Playing
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {lessonTitle}
                </h2>
                {partLabel ? (
                  <p className="mt-2 text-sm text-white/70">{partLabel}</p>
                ) : null}
              </div>
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/70 transition hover:border-white/40 hover:text-white"
                aria-label="Close"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  className="h-4 w-4"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.22 5.22a.75.75 0 0 1 1.06 0L10 8.94l3.72-3.72a.75.75 0 1 1 1.06 1.06L11.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06L10 11.06l-3.72 3.72a.75.75 0 0 1-1.06-1.06L8.94 10 5.22 6.28a.75.75 0 0 1 0-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-[#070707]">
              <div className="relative flex aspect-video items-center justify-center overflow-hidden">
                <img
                  src="/reference/StudentVideo-2.png"
                  alt="Lesson video preview"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,6,6,0.65),rgba(3,3,3,0.95))]" />
                <div className="relative z-10 px-6 text-center">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                    Expanded View
                  </p>
                  <h4 className="mt-2 text-2xl font-semibold text-white">
                    {lessonTitle}
                  </h4>
                  {partLabel ? (
                    <p className="mt-2 text-sm text-white/70">{partLabel}</p>
                  ) : null}
                </div>
                <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center gap-3 border-t border-white/10 bg-black/60 px-4 py-3 text-white">
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/15 text-sm text-white shadow-[0_8px_20px_rgba(0,0,0,0.35)] transition hover:border-white/40 hover:bg-white/25"
                    aria-label="Play"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-4 w-4 translate-x-[1px] fill-current"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                  <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold tracking-wide">
                    02:39
                  </span>
                  <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/20">
                    <div
                      className="h-full rounded-full bg-white"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/70">
                    <span>Vol</span>
                    <div className="h-1 w-12 rounded-full bg-white/20">
                      <div className="h-full w-[60%] rounded-full bg-white/70" />
                    </div>
                  </div>
                  <div className="ml-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!canGoPrev) return;
                        setSelectedPart(lessonPartItems[activePartIndex - 1]);
                      }}
                      disabled={!canGoPrev}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                        canGoPrev
                          ? 'border-white/40 text-white hover:border-white'
                          : 'border-white/10 text-white/40'
                      }`}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!canGoNext) return;
                        if (hasNextPart) {
                          setSelectedPart(lessonPartItems[activePartIndex + 1]);
                          return;
                        }
                        if (hasNextMaterial) {
                          handleNextClick();
                        }
                      }}
                      disabled={!canGoNext}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                        canGoNext
                          ? 'border-white/40 text-white hover:border-white'
                          : 'border-white/10 text-white/40'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
