'use client';

import { useEffect, useMemo, useState } from 'react';
import lessonParts from '../teachers/students/lesson-data/lesson-parts.json';

type LastViewedVideo = {
  material: string;
  part?: string;
  materials?: string[];
  viewedAt?: string;
};

type LastViewedVideoCardProps = {
  data: LastViewedVideo;
  className?: string;
  expandedCoverImage?: string;
  expandedOpen?: boolean;
  onExpandedChange?: (next: boolean) => void;
  expandedLabel?: string;
  expandedTitle?: string;
  expandedSubtitle?: string;
  expandedShowCenterText?: boolean;
  expandedShowOverlay?: boolean;
};

const LAST_VIEWED_KEY = 'sm_last_viewed_video';

const sectionTitleFor = (material: string) =>
  material.replace(/^\s*\d+(\.\d+)?\s*[–-]\s*/i, '').trim();

export default function LastViewedVideoCard({
  data,
  className,
  expandedCoverImage = '/reference/StudentVideo.png',
  expandedOpen,
  onExpandedChange,
  expandedLabel,
  expandedTitle,
  expandedSubtitle,
  expandedShowCenterText = true,
  expandedShowOverlay = true,
}: LastViewedVideoCardProps) {
  const [material, setMaterial] = useState(data.material);
  const [part, setPart] = useState<string | null>(data.part ?? null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setMaterial(data.material);
    setPart(data.part ?? null);
  }, [data.material, data.part]);

  useEffect(() => {
    if (expandedOpen === undefined) return;
    setIsExpanded(expandedOpen);
  }, [expandedOpen]);

  const lessonPartItems = useMemo(() => {
    const partsMap = lessonParts as Record<string, string[]>;
    const matchedKey = Object.keys(partsMap).find(prefix =>
      material.startsWith(prefix),
    );
    return matchedKey ? partsMap[matchedKey] ?? [] : [];
  }, [material]);

  useEffect(() => {
    if (lessonPartItems.length === 0) {
      setPart(null);
      return;
    }
    if (!part || !lessonPartItems.includes(part)) {
      setPart(lessonPartItems[0]);
    }
  }, [lessonPartItems, part]);

  const materialIndex = data.materials
    ? data.materials.indexOf(material)
    : -1;
  const hasNextMaterial =
    data.materials &&
    materialIndex >= 0 &&
    materialIndex < data.materials.length - 1;
  const hasPrevMaterial = data.materials && materialIndex > 0;

  const partIndex = part ? lessonPartItems.indexOf(part) : -1;
  const hasNextPart =
    lessonPartItems.length > 0 &&
    partIndex >= 0 &&
    partIndex < lessonPartItems.length - 1;
  const hasPrevPart = lessonPartItems.length > 0 && partIndex > 0;

  const updateLastViewed = (next: Partial<LastViewedVideo>) => {
    const payload: LastViewedVideo = {
      material,
      part: part ?? undefined,
      materials: data.materials,
      viewedAt: data.viewedAt,
      ...next,
    };
    try {
      window.localStorage.setItem(LAST_VIEWED_KEY, JSON.stringify(payload));
      window.dispatchEvent(new Event('sm-last-viewed-video'));
    } catch {
      window.dispatchEvent(new Event('sm-last-viewed-video'));
    }
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

  const handlePrev = () => {
    if (hasPrevPart) {
      const nextPart = lessonPartItems[partIndex - 1];
      setPart(nextPart);
      updateLastViewed({ part: nextPart });
      return;
    }
    if (hasPrevMaterial && data.materials) {
      const nextMaterial = data.materials[materialIndex - 1];
      setMaterial(nextMaterial);
      setPart(null);
      updateLastViewed({ material: nextMaterial, part: undefined });
    }
  };

  const handleNext = () => {
    if (hasNextPart) {
      const nextPart = lessonPartItems[partIndex + 1];
      setPart(nextPart);
      updateLastViewed({ part: nextPart });
      return;
    }
    if (hasNextMaterial && data.materials) {
      const nextMaterial = data.materials[materialIndex + 1];
      setMaterial(nextMaterial);
      setPart(null);
      updateLastViewed({ material: nextMaterial, part: undefined });
    }
  };

  const lessonTitle = sectionTitleFor(material) || material;
  const canGoPrev = hasPrevPart || hasPrevMaterial;
  const canGoNext = hasNextPart || hasNextMaterial;
  const headerLabel = expandedLabel ?? (isPlaying ? 'Now Playing' : 'Viewing');
  const headerTitle = expandedTitle ?? lessonTitle;
  const headerSubtitle = expandedSubtitle ?? (part ?? 'Select a lesson part to begin.');

  return (
    <section
      className={`rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm ${
        className ?? ''
      }`}
    >
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
          Last Viewed Lesson Video
        </p>
        <h2 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
          Lesson Video
        </h2>
      </div>

      <div className="mt-4 overflow-hidden rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] shadow-sm">
        <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-[#070707]">
          <img
            src="/reference/StudentVideo.png"
            alt="Lesson video preview"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,6,6,0.6),rgba(3,3,3,0.9))]" />
          <div className="relative z-10 px-6 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
              {isPlaying ? 'Now Playing' : 'Viewing'}
            </p>
            <h4 className="mt-2 text-xl font-semibold text-white">
              {lessonTitle}
            </h4>
            <p className="mt-2 text-sm text-white/70">
              {part ?? 'Select a lesson part to begin.'}
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center gap-3 border-t border-white/10 bg-black/60 px-4 py-3 text-white">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/15 text-sm text-white shadow-[0_8px_20px_rgba(0,0,0,0.35)] transition hover:border-white/40 hover:bg-white/25"
              aria-label={isPlaying ? 'Pause' : 'Play'}
              onClick={() => {
                closePip();
                setIsPlaying(current => !current);
              }}
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
              <div className="h-full w-[55%] rounded-full bg-white" />
            </div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/70">
              <span>Vol</span>
              <div className="h-1 w-12 rounded-full bg-white/20">
                <div className="h-full w-[60%] rounded-full bg-white/70" />
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                closePip();
                setIsExpanded(true);
                onExpandedChange?.(true);
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--c-ecebe7)] bg-[var(--c-f1f1ef)] px-6 py-4">
          <div className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
            Last Viewed Lesson Video
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
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
              onClick={handleNext}
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
      </div>

      {isExpanded ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setIsExpanded(false);
              onExpandedChange?.(false);
            }}
          />
          <div className="relative w-full max-w-5xl rounded-3xl border border-white/10 bg-[#0b0b0b] p-6 text-white shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                  {headerLabel}
                </p>
                <h2 className="mt-2 text-2xl font-semibold">{headerTitle}</h2>
                <p className="mt-2 text-sm text-white/70">
                  {headerSubtitle}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsExpanded(false);
                  onExpandedChange?.(false);
                }}
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
                  src={expandedCoverImage}
                  alt="Lesson video preview"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                {expandedShowOverlay ? (
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,6,6,0.65),rgba(3,3,3,0.95))]" />
                ) : null}
                <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center gap-3 border-t border-white/10 bg-black/60 px-4 py-3 text-white">
                  <button
                    type="button"
                    onClick={() => setIsPlaying(current => !current)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/15 text-sm text-white shadow-[0_8px_20px_rgba(0,0,0,0.35)] transition hover:border-white/40 hover:bg-white/25"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
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
                    <div className="h-full w-[55%] rounded-full bg-white" />
                  </div>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/70">
                    <span>Vol</span>
                    <div className="h-1 w-12 rounded-full bg-white/20">
                      <div className="h-full w-[60%] rounded-full bg-white/70" />
                    </div>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePrev}
                      disabled={!canGoPrev}
                      className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wide transition ${
                        canGoPrev
                          ? 'border-white/40 text-white hover:border-white'
                          : 'border-white/10 text-white/40'
                      }`}
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={!canGoNext}
                      className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wide transition ${
                        canGoNext
                          ? 'border-white/40 text-white hover:border-white'
                          : 'border-white/10 text-white/40'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
                {expandedShowCenterText ? (
                  <div className="relative z-10 px-6 text-center">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/70">
                      {headerLabel}
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold">{headerTitle}</h3>
                    <p className="mt-2 text-sm text-white/70">
                      {headerSubtitle}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
