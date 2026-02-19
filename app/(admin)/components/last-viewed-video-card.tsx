'use client';

import { type ChangeEvent, type MouseEvent, useEffect, useRef, useState } from 'react';

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

const DASHBOARD_VIDEOS = [
  {
    src: '/reference/videos/dreams-1.1.1.mp4',
    title: 'Dreams Come True - 1.1.1',
  },
  {
    src: '/reference/videos/night-storm-1.2.1.mp4',
    title: 'Night Storm - 1.2.1',
  },
] as const;

const materialToVideoIndex = (material: string) =>
  material.toLowerCase().includes('night storm') ? 1 : 0;

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpandedLocal, setIsExpandedLocal] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(() =>
    materialToVideoIndex(data.material),
  );
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.6);
  const inlineVideoRef = useRef<HTMLVideoElement | null>(null);
  const expandedVideoRef = useRef<HTMLVideoElement | null>(null);
  const pendingExpandedStartTimeRef = useRef<number | null>(null);
  const isExpanded = expandedOpen ?? isExpandedLocal;

  const playVideo = (videoEl: HTMLVideoElement | null) => {
    if (!videoEl) return;
    const playPromise = videoEl.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => undefined);
    }
  };

  const activeVideoRef = () =>
    (isExpanded ? expandedVideoRef : inlineVideoRef).current;

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

  const openExpanded = () => {
    const inlineVideo = inlineVideoRef.current;
    pendingExpandedStartTimeRef.current = inlineVideo?.currentTime ?? currentTime;
    if (inlineVideo) {
      inlineVideo.pause();
    }
    if (expandedOpen === undefined) {
      setIsExpandedLocal(true);
    }
    onExpandedChange?.(true);
  };

  const closeExpanded = () => {
    const expandedVideo = expandedVideoRef.current;
    const inlineVideo = inlineVideoRef.current;
    const syncedTime = expandedVideo?.currentTime ?? currentTime;
    if (expandedVideo) {
      expandedVideo.pause();
    }
    if (inlineVideo) {
      inlineVideo.currentTime = syncedTime;
      inlineVideo.volume = volume;
      if (isPlaying) {
        playVideo(inlineVideo);
      }
    }
    setCurrentTime(syncedTime);
    if (expandedOpen === undefined) {
      setIsExpandedLocal(false);
    }
    onExpandedChange?.(false);
  };

  const handlePrev = () => {
    setCurrentVideoIndex(current => Math.max(0, current - 1));
    setCurrentTime(0);
    setDuration(0);
  };

  const handleNext = () => {
    setCurrentVideoIndex(current =>
      Math.min(DASHBOARD_VIDEOS.length - 1, current + 1),
    );
    setCurrentTime(0);
    setDuration(0);
  };

  const handleTimeUpdate = (player: 'inline' | 'expanded') => {
    const isActivePlayer =
      (player === 'expanded' && isExpanded) || (player === 'inline' && !isExpanded);
    if (!isActivePlayer) return;
    const source = player === 'expanded' ? expandedVideoRef.current : inlineVideoRef.current;
    if (!source) return;
    setCurrentTime(source.currentTime);
  };

  const handleMetadataLoad = (player: 'inline' | 'expanded') => {
    const source = player === 'expanded' ? expandedVideoRef.current : inlineVideoRef.current;
    if (!source) return;

    if (player === 'expanded' && pendingExpandedStartTimeRef.current !== null) {
      source.currentTime = pendingExpandedStartTimeRef.current;
      pendingExpandedStartTimeRef.current = null;
    }

    const isActivePlayer =
      (player === 'expanded' && isExpanded) || (player === 'inline' && !isExpanded);
    if (!isActivePlayer) return;
    setDuration(source.duration || 0);
    setCurrentTime(source.currentTime || 0);
  };

  const handleSeek = (event: MouseEvent<HTMLDivElement>) => {
    const activeVideo = activeVideoRef();
    if (!activeVideo || !Number.isFinite(activeVideo.duration) || activeVideo.duration <= 0) {
      return;
    }
    const bounds = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - bounds.left) / bounds.width;
    const clampedRatio = Math.max(0, Math.min(1, ratio));
    const nextTime = activeVideo.duration * clampedRatio;
    activeVideo.currentTime = nextTime;
    setCurrentTime(nextTime);
    setDuration(activeVideo.duration);
  };

  const handleVolumeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextVolume = Number(event.target.value);
    setVolume(nextVolume);
    if (inlineVideoRef.current) {
      inlineVideoRef.current.volume = nextVolume;
    }
    if (expandedVideoRef.current) {
      expandedVideoRef.current.volume = nextVolume;
    }
  };

  const currentVideo = DASHBOARD_VIDEOS[currentVideoIndex];
  const canGoPrev = currentVideoIndex > 0;
  const canGoNext = currentVideoIndex < DASHBOARD_VIDEOS.length - 1;
  const headerLabel = expandedLabel ?? (isPlaying ? 'Now Playing' : 'Viewing');
  const headerTitle = expandedTitle ?? currentVideo.title;
  const headerSubtitle = expandedSubtitle ?? currentVideo.title;
  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  useEffect(() => {
    if (inlineVideoRef.current) {
      inlineVideoRef.current.volume = volume;
    }
    if (expandedVideoRef.current) {
      expandedVideoRef.current.volume = volume;
    }

    const activeVideo = (isExpanded ? expandedVideoRef : inlineVideoRef).current;
    const inactiveVideo = (isExpanded ? inlineVideoRef : expandedVideoRef).current;
    if (inactiveVideo) {
      inactiveVideo.pause();
    }
    if (!activeVideo) return;

    if (isExpanded && pendingExpandedStartTimeRef.current !== null) {
      activeVideo.currentTime = pendingExpandedStartTimeRef.current;
      pendingExpandedStartTimeRef.current = null;
    }

    if (isPlaying) {
      playVideo(activeVideo);
    } else {
      activeVideo.pause();
    }
  }, [isPlaying, currentVideoIndex, isExpanded, volume]);

  return (
    <section
      className={`rounded-2xl border border-[var(--c-ecebe7)] bg-white p-5 shadow-sm [[data-theme=dark]_&]:bg-[var(--c-ffffff)] ${
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
          <video
            ref={inlineVideoRef}
            src={currentVideo.src}
            className="absolute inset-0 h-full w-full object-cover"
            playsInline
            preload="metadata"
            poster={expandedCoverImage}
            onLoadedMetadata={() => handleMetadataLoad('inline')}
            onTimeUpdate={() => handleTimeUpdate('inline')}
            onEnded={() => setIsPlaying(false)}
          />
          {!isPlaying ? (
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,6,6,0.6),rgba(3,3,3,0.9))]" />
          ) : null}
          {isPlaying ? (
            <div className="absolute right-4 top-4 z-20 rounded-2xl border border-white/30 bg-white/15 px-4 py-2 text-right backdrop-blur-md">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/75">
                Now Playing
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {currentVideo.title}
              </p>
            </div>
          ) : null}
          {!isPlaying ? (
            <div className="relative z-10 px-6 text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
                Viewing
              </p>
              <h4 className="mt-2 text-xl font-semibold text-white">
                {currentVideo.title}
              </h4>
              <p className="mt-2 text-sm text-white/70">
                {currentVideo.title}
              </p>
            </div>
          ) : null}
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
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            <div
              className="relative h-1 flex-1 cursor-pointer overflow-hidden rounded-full bg-white/20"
              role="slider"
              aria-label="Seek"
              aria-valuemin={0}
              aria-valuemax={duration || 0}
              aria-valuenow={currentTime}
              onClick={handleSeek}
            >
              <div
                className="h-full rounded-full bg-white"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/70">
              <span>Vol</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                aria-label="Volume"
                className="h-1 w-14 cursor-pointer accent-white"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                closePip();
                openExpanded();
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
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeExpanded}
          />
          <div className="relative h-[85vh] w-[85vw] max-w-[1700px] rounded-3xl border border-white/10 bg-[#0b0b0b] p-6 text-white shadow-2xl">
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
                onClick={closeExpanded}
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

            <div className="mt-6 h-[calc(100%-6.5rem)] overflow-hidden rounded-3xl border border-white/10 bg-[#070707]">
              <div className="relative flex h-full items-center justify-center overflow-hidden">
                <video
                  ref={expandedVideoRef}
                  src={currentVideo.src}
                  className="absolute inset-0 h-full w-full object-cover"
                  playsInline
                  preload="metadata"
                  poster={expandedCoverImage}
                  onLoadedMetadata={() => handleMetadataLoad('expanded')}
                  onTimeUpdate={() => handleTimeUpdate('expanded')}
                  onEnded={() => setIsPlaying(false)}
                />
                {expandedShowOverlay && !isPlaying ? (
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,6,6,0.65),rgba(3,3,3,0.95))]" />
                ) : null}
                {isPlaying ? (
                  <div className="absolute right-4 top-4 z-20 rounded-2xl border border-white/30 bg-white/15 px-4 py-2 text-right backdrop-blur-md">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/75">
                      Now Playing
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {currentVideo.title}
                    </p>
                  </div>
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
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                  <div
                    className="relative h-1 flex-1 cursor-pointer overflow-hidden rounded-full bg-white/20"
                    role="slider"
                    aria-label="Seek"
                    aria-valuemin={0}
                    aria-valuemax={duration || 0}
                    aria-valuenow={currentTime}
                    onClick={handleSeek}
                  >
                    <div
                      className="h-full rounded-full bg-white"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/70">
                    <span>Vol</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={handleVolumeChange}
                      aria-label="Volume"
                      className="h-1 w-14 cursor-pointer accent-white"
                    />
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
                {expandedShowCenterText && !isPlaying ? (
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
