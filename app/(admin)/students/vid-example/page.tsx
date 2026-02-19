'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type VideoPair = {
  id: 'dreams' | 'night-storm';
  label: string;
  newMp4: string;
  oldMp4: string;
  oldMov: string;
};

const VIDEO_PAIRS: VideoPair[] = [
  {
    id: 'dreams',
    label: 'Dreams Come True 1.1.1',
    newMp4: '/reference/videos/dreams-1.1.1.mp4',
    oldMp4: '/reference/videos/dreams-1.1.1-1980.mp4',
    oldMov: '/reference/videos/dreams-1.1.1-1980.mov',
  },
  {
    id: 'night-storm',
    label: 'Night Storm 1.2.1',
    newMp4: '/reference/videos/night-storm-1.2.1.mp4',
    oldMp4: '/reference/videos/night-storm-1.2.1-1980.mp4',
    oldMov: '/reference/videos/night-storm-1.2.1-1980.mov',
  },
];

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export default function StudentVideoExamplePage() {
  const [activeId, setActiveId] = useState<VideoPair['id']>('dreams');
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [oldVideoError, setOldVideoError] = useState(false);
  const [splitPercent, setSplitPercent] = useState(50);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<1 | 2 | 3>(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDraggingPan, setIsDraggingPan] = useState(false);

  const oldVideoRef = useRef<HTMLVideoElement | null>(null);
  const newVideoRef = useRef<HTMLVideoElement | null>(null);
  const compareViewportRef = useRef<HTMLDivElement | null>(null);
  const panStartPointerRef = useRef({ x: 0, y: 0 });
  const panStartOffsetRef = useRef({ x: 0, y: 0 });

  const activePair = useMemo(
    () => VIDEO_PAIRS.find(pair => pair.id === activeId) ?? VIDEO_PAIRS[0],
    [activeId],
  );

  const syncOldToNew = () => {
    const oldVideo = oldVideoRef.current;
    const newVideo = newVideoRef.current;
    if (!oldVideo || !newVideo) return;
    oldVideo.currentTime = newVideo.currentTime;
  };

  const playBoth = () => {
    const oldVideo = oldVideoRef.current;
    const newVideo = newVideoRef.current;
    if (!oldVideo || !newVideo) return;
    oldVideo.muted = true;
    newVideo.volume = volume;

    const playNew = newVideo.play();
    const playOld = oldVideo.play();
    Promise.allSettled([playNew, playOld]).then(() => {
      setPlaying(true);
      syncOldToNew();
    });
  };

  const pauseBoth = () => {
    oldVideoRef.current?.pause();
    newVideoRef.current?.pause();
    setPlaying(false);
  };

  const resetBoth = () => {
    pauseBoth();
    const oldVideo = oldVideoRef.current;
    const newVideo = newVideoRef.current;
    if (oldVideo) oldVideo.currentTime = 0;
    if (newVideo) newVideo.currentTime = 0;
    setCurrentTime(0);
  };

  const seekBoth = (value: number) => {
    const oldVideo = oldVideoRef.current;
    const newVideo = newVideoRef.current;
    if (!oldVideo || !newVideo) return;
    oldVideo.currentTime = value;
    newVideo.currentTime = value;
    setCurrentTime(value);
  };

  const updateSplitFromClientX = (clientX: number) => {
    const viewport = compareViewportRef.current;
    if (!viewport) return;
    const bounds = viewport.getBoundingClientRect();
    const ratio = (clientX - bounds.left) / bounds.width;
    const nextPercent = Math.max(0, Math.min(100, ratio * 100));
    setSplitPercent(nextPercent);
  };

  const clampPan = useCallback(
    (nextX: number, nextY: number) => {
      const viewport = compareViewportRef.current;
      if (!viewport) return { x: 0, y: 0 };
      const bounds = viewport.getBoundingClientRect();
      const maxX = (bounds.width * (zoomLevel - 1)) / 2;
      const maxY = (bounds.height * (zoomLevel - 1)) / 2;
      return {
        x: Math.max(-maxX, Math.min(maxX, nextX)),
        y: Math.max(-maxY, Math.min(maxY, nextY)),
      };
    },
    [zoomLevel],
  );

  useEffect(() => {
    const newVideo = newVideoRef.current;
    const oldVideo = oldVideoRef.current;
    if (!newVideo || !oldVideo) return;
    oldVideo.muted = true;
    newVideo.volume = volume;
  }, [volume, activeId]);

  useEffect(() => {
    setOldVideoError(false);
    setSplitPercent(50);
    setPanOffset({ x: 0, y: 0 });
    resetBoth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  useEffect(() => {
    if (zoomLevel === 1) {
      setPanOffset({ x: 0, y: 0 });
      setIsDraggingPan(false);
      return;
    }
    setPanOffset(current => clampPan(current.x, current.y));
  }, [zoomLevel, clampPan]);

  useEffect(() => {
    if (!isDraggingSplit) return;
    const handlePointerMove = (event: PointerEvent) => {
      updateSplitFromClientX(event.clientX);
    };
    const handlePointerUp = () => {
      setIsDraggingSplit(false);
    };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDraggingSplit]);

  useEffect(() => {
    if (!isDraggingPan) return;
    const handlePointerMove = (event: PointerEvent) => {
      const deltaX = event.clientX - panStartPointerRef.current.x;
      const deltaY = event.clientY - panStartPointerRef.current.y;
      const nextX = panStartOffsetRef.current.x + deltaX;
      const nextY = panStartOffsetRef.current.y + deltaY;
      setPanOffset(clampPan(nextX, nextY));
    };
    const handlePointerUp = () => {
      setIsDraggingPan(false);
    };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDraggingPan, clampPan]);

  return (
    <main className="min-h-screen bg-[var(--c-f5f4f2)] px-3 py-4 text-[var(--c-1f1f1d)] [[data-theme=dark]_&]:bg-[#121212] [[data-theme=dark]_&]:text-[var(--c-ffffff)] md:px-4 md:py-5">
      <div className="mx-auto max-w-[1900px] space-y-4">
        <header className="rounded-2xl border border-[var(--c-ecebe7)] bg-white p-5 shadow-sm [[data-theme=dark]_&]:border-white/15 [[data-theme=dark]_&]:bg-[#1a1a1a]">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--c-c8102e)]">
            Students
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)] [[data-theme=dark]_&]:text-white">
            Video Comparison
          </h1>
          <p className="mt-2 text-sm text-[var(--c-4b4b49)] [[data-theme=dark]_&]:text-white/70">
            Reprocessing of previous footage to newer 4K resolution output examples.
          </p>
        </header>

        <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-white p-5 shadow-sm [[data-theme=dark]_&]:border-white/15 [[data-theme=dark]_&]:bg-[#1a1a1a]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs uppercase tracking-[0.2em] text-[var(--c-7d7b75)] [[data-theme=dark]_&]:text-white/65">
                Song
              </span>
              {VIDEO_PAIRS.map(pair => (
                <button
                  key={pair.id}
                  type="button"
                  onClick={() => setActiveId(pair.id)}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                    pair.id === activeId
                      ? 'border-[var(--c-c8102e)] bg-[var(--c-c8102e)] text-white'
                      : 'border-[var(--c-e0dfda)] text-[var(--c-1f1f1d)] hover:border-[var(--c-c8102e)] hover:text-[var(--c-c8102e)] [[data-theme=dark]_&]:border-white/20 [[data-theme=dark]_&]:text-white/90 [[data-theme=dark]_&]:hover:border-[var(--c-c8102e)] [[data-theme=dark]_&]:hover:text-[var(--c-c8102e)]'
                  }`}
                >
                  {pair.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSplitPercent(100)}
                className="rounded-full border border-[var(--c-e0dfda)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--c-1f1f1d)] transition hover:border-[var(--c-c8102e)] hover:text-[var(--c-c8102e)] [[data-theme=dark]_&]:border-white/25 [[data-theme=dark]_&]:text-white/85"
              >
                OLD
              </button>
              <button
                type="button"
                onClick={() => setSplitPercent(0)}
                className="rounded-full border border-[var(--c-e0dfda)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--c-1f1f1d)] transition hover:border-[var(--c-c8102e)] hover:text-[var(--c-c8102e)] [[data-theme=dark]_&]:border-white/25 [[data-theme=dark]_&]:text-white/85"
              >
                NEW
              </button>
              {[1, 2, 3].map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setZoomLevel(level as 1 | 2 | 3)}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] transition ${
                    zoomLevel === level
                      ? 'border-[var(--c-c8102e)] bg-[var(--c-c8102e)] text-white'
                      : 'border-[var(--c-e0dfda)] text-[var(--c-1f1f1d)] hover:border-[var(--c-c8102e)] hover:text-[var(--c-c8102e)] [[data-theme=dark]_&]:border-white/25 [[data-theme=dark]_&]:text-white/85'
                  }`}
                >
                  {level}X
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[var(--c-ecebe7)] bg-white shadow-sm [[data-theme=dark]_&]:border-white/15 [[data-theme=dark]_&]:bg-[#1a1a1a]">
          <div
            ref={compareViewportRef}
            className={`relative aspect-[16/9] select-none bg-black xl:aspect-[18/9] ${
              zoomLevel > 1 ? (isDraggingPan ? 'cursor-grabbing' : 'cursor-grab') : ''
            }`}
            onPointerDown={event => {
              if (zoomLevel <= 1) return;
              const target = event.target as HTMLElement | null;
              if (target?.closest('button')) return;
              panStartPointerRef.current = { x: event.clientX, y: event.clientY };
              panStartOffsetRef.current = { ...panOffset };
              setIsDraggingPan(true);
            }}
          >
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - splitPercent}% 0 0)` }}
            >
              <video
                ref={oldVideoRef}
                key={`${activePair.id}-old`}
                className="h-full w-full object-cover object-center"
                style={{
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                  transformOrigin: 'center center',
                }}
                preload="metadata"
                playsInline
                onError={() => setOldVideoError(true)}
                onLoadedMetadata={() => {
                  setOldVideoError(false);
                  const d = newVideoRef.current?.duration ?? 0;
                  setDuration(Number.isFinite(d) ? d : 0);
                }}
              >
                <source src={activePair.oldMp4} type="video/mp4" />
                <source src={activePair.oldMov} type="video/quicktime" />
              </video>
              <div className="absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
                Old
              </div>
              {oldVideoError ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 px-5 text-center text-sm text-white/90">
                  Old source failed to decode.
              </div>
            ) : null}
            </div>

            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 0 0 ${splitPercent}%)` }}
            >
              <video
                ref={newVideoRef}
                key={`${activePair.id}-new`}
                src={activePair.newMp4}
                className="h-full w-full object-cover object-center"
                style={{
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                  transformOrigin: 'center center',
                }}
                preload="metadata"
                playsInline
                onLoadedMetadata={event => {
                  const nextDuration = event.currentTarget.duration;
                  setDuration(Number.isFinite(nextDuration) ? nextDuration : 0);
                }}
                onTimeUpdate={event => {
                  const time = event.currentTarget.currentTime;
                  setCurrentTime(time);
                  syncOldToNew();
                }}
                onEnded={() => setPlaying(false)}
              />
              <div className="absolute right-3 top-3 rounded-full bg-black/55 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
                New
              </div>
            </div>

            <div className="pointer-events-none absolute left-1/2 top-3 z-30 -translate-x-1/2 rounded-2xl border border-white/30 bg-white/15 px-4 py-2 text-center backdrop-blur-md">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/85">
                {zoomLevel}X • Split {Math.round(splitPercent)} / {Math.round(100 - splitPercent)}
              </p>
            </div>

            <div
              className="absolute inset-y-0 z-20 w-px -translate-x-1/2 bg-white/80"
              style={{ left: `${splitPercent}%` }}
            />
            <button
              type="button"
              aria-label="Drag comparison slider"
              onPointerDown={event => {
                setIsDraggingSplit(true);
                updateSplitFromClientX(event.clientX);
              }}
              className="absolute top-1/2 z-30 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80 bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/65"
              style={{ left: `${splitPercent}%` }}
            >
              <span className="sr-only">Drag split</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="m-auto h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="14 5 7 12 14 19" />
                <polyline points="10 5 17 12 10 19" />
              </svg>
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-white p-5 shadow-sm [[data-theme=dark]_&]:border-white/15 [[data-theme=dark]_&]:bg-[#1a1a1a]">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => (playing ? pauseBoth() : playBoth())}
              className="rounded-full border border-[var(--c-1f1f1d)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--c-1f1f1d)] transition hover:border-[var(--c-c8102e)] hover:text-[var(--c-c8102e)] [[data-theme=dark]_&]:border-white/35 [[data-theme=dark]_&]:text-white"
            >
              {playing ? 'Pause' : 'Play'}
            </button>
            <button
              type="button"
              onClick={resetBoth}
              className="rounded-full border border-[var(--c-e0dfda)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--c-1f1f1d)] transition hover:border-[var(--c-c8102e)] hover:text-[var(--c-c8102e)] [[data-theme=dark]_&]:border-white/20 [[data-theme=dark]_&]:text-white/90"
            >
              Reset
            </button>
            <span className="ml-auto text-xs font-semibold tracking-wide text-[var(--c-7d7b75)] [[data-theme=dark]_&]:text-white/70">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="mt-4">
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.01}
              value={Math.min(currentTime, duration || 0)}
              onChange={event => seekBoth(Number(event.target.value))}
              className="h-2 w-full cursor-pointer accent-[var(--c-c8102e)]"
              aria-label="Scrub videos"
            />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <label
              htmlFor="new-video-volume"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-7d7b75)] [[data-theme=dark]_&]:text-white/65"
            >
              Volume
            </label>
            <input
              id="new-video-volume"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={event => setVolume(Number(event.target.value))}
              className="h-2 w-44 cursor-pointer accent-[var(--c-c8102e)]"
              aria-label="New video volume"
            />
          </div>
        </section>
      </div>
    </main>
  );
}
