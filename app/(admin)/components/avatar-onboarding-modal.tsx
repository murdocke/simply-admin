'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type AvatarVideo = {
  videoKey: string;
  title: string | null;
  description: string | null;
  provider: string | null;
  vimeoId: string | null;
  videoPath: string | null;
  openOnLoad: boolean;
  autoPlay: boolean;
  autoCloseOnEnd: boolean;
  openAfterModalKey: string | null;
  openButtonLabel: string | null;
  uiRefKey: string | null;
};

type AvatarImage = {
  id: string;
  imagePath: string | null;
  startSeconds: number | null;
  endSeconds: number | null;
  sortOrder: number | null;
  uiRefKey: string | null;
};

type AvatarOnboardingModalProps = {
  videoKey: string;
  forceOpen?: boolean;
  showOpenButton?: boolean;
  variant?: 'modal' | 'panel';
  createIfMissing?: boolean;
  createTitle?: string;
  createUiRefKey?: string;
  className?: string;
  onClose?: () => void;
};

type PlayerApi = {
  on: (event: string, handler: (data?: { seconds?: number }) => void) => void;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  unload: () => Promise<void>;
};

const resolveActiveImage = (images: AvatarImage[], time: number) => {
  if (!images.length) return 0;
  const index = images.findIndex(image => {
    const start = image.startSeconds ?? 0;
    const end = image.endSeconds ?? Number.MAX_SAFE_INTEGER;
    return time >= start && time < end;
  });
  return index >= 0 ? index : 0;
};

export default function AvatarOnboardingModal({
  videoKey,
  forceOpen,
  showOpenButton,
  variant = 'modal',
  createIfMissing = false,
  createTitle,
  createUiRefKey,
  className,
  onClose,
}: AvatarOnboardingModalProps) {
  const [video, setVideo] = useState<AvatarVideo | null>(null);
  const [images, setImages] = useState<AvatarImage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const playerRef = useRef<PlayerApi | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch(`/api/avatar-onboarding?key=${videoKey}`, {
          cache: 'no-store',
        });
        if (!response.ok) {
          if (response.status === 404 && createIfMissing) {
            await fetch('/api/avatar-onboarding', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                key: videoKey,
                title: createTitle ?? 'New Avatar Onboarding',
                uiRefKey: createUiRefKey ?? 'UI_REF_KEY_PLACEHOLDER',
              }),
            });
            const retry = await fetch(
              `/api/avatar-onboarding?key=${videoKey}`,
              { cache: 'no-store' },
            );
            if (!retry.ok) {
              throw new Error('Unable to load onboarding.');
            }
            const data = (await retry.json()) as {
              video?: AvatarVideo;
              images?: AvatarImage[];
            };
            if (!active) return;
            setVideo(data.video ?? null);
            setImages(
              Array.isArray(data.images)
                ? data.images.filter(image => image.imagePath)
                : [],
            );
            setLoadError(null);
            return;
          }
          throw new Error('Unable to load onboarding.');
        }
        const data = (await response.json()) as {
          video?: AvatarVideo;
          images?: AvatarImage[];
        };
        if (!active) return;
        setVideo(data.video ?? null);
        setImages(
          Array.isArray(data.images)
            ? data.images.filter(image => image.imagePath)
            : [],
        );
        setLoadError(null);
      } catch (error) {
        if (!active) return;
        setLoadError(
          error instanceof Error
            ? error.message
            : 'Unable to load onboarding.',
        );
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [videoKey]);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
    }
  }, [forceOpen]);

  useEffect(() => {
    if (!video) return;
    if (video.openOnLoad) {
      setIsOpen(true);
    }
  }, [video]);

  useEffect(() => {
    if (!video?.openAfterModalKey) return;
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ key?: string }>).detail;
      if (!detail?.key) return;
      if (detail.key === video.openAfterModalKey) {
        setIsOpen(true);
      }
    };
    window.addEventListener('avatar-onboarding:after-modal', handler);
    return () => window.removeEventListener('avatar-onboarding:after-modal', handler);
  }, [video]);

  useEffect(() => {
    if (!isOpen || !video || video.provider !== 'vimeo') return;
    if (!iframeRef.current) return;
    let isMounted = true;

    const initPlayer = async () => {
      try {
        const module = await import('@vimeo/player');
        if (!isMounted) return;
        const Player = module.default;
        const player = new Player(iframeRef.current);
        playerRef.current = player;
        player.on('loaded', () => {
          if (!isMounted) return;
          setIsReady(true);
          if (video.autoPlay) {
            void player.play();
          }
        });
        player.on('play', () => {
          if (!isMounted) return;
          setIsReady(true);
        });
        player.on('pause', () => {
          if (!isMounted) return;
        });
        player.on('ended', () => {
          if (!isMounted) return;
          if (video.autoCloseOnEnd) {
            setIsOpen(false);
            onClose?.();
          }
        });
        player.on('timeupdate', data => {
          if (!isMounted) return;
          const seconds = data?.seconds ?? 0;
          const nextIndex = resolveActiveImage(images, seconds);
          setActiveIndex(nextIndex);
        });
      } catch {
        setLoadError('Unable to initialize video player.');
      }
    };

    void initPlayer();

    return () => {
      isMounted = false;
    };
  }, [isOpen, video, images, onClose]);

  useEffect(() => {
    if (!isOpen) {
      if (playerRef.current) {
        void playerRef.current.pause();
      }
    }
  }, [isOpen]);

  const activeImage = images[activeIndex]?.imagePath ?? null;
  const imageLayers = useMemo(
    () =>
      images.map((image, index) => ({
        id: image.id,
        src: image.imagePath ?? '',
        isActive: index === activeIndex,
      })),
    [images, activeIndex],
  );

  if (!video) {
    return null;
  }

  return (
    <div className={className}>
      {showOpenButton ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[var(--c-c8102e)] hover:text-[var(--c-c8102e)]"
        >
          {video.openButtonLabel ?? 'Open Training'}
        </button>
      ) : null}

      {isOpen ? (
        variant === 'panel' ? (
          <div className="relative w-full overflow-hidden rounded-3xl border border-white/20 bg-black shadow-[0_30px_90px_-50px_rgba(0,0,0,0.65)]">
            <div className="relative h-[520px] w-full overflow-hidden bg-black">
              {imageLayers.map(layer => (
                <div
                  key={layer.id}
                  className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[900ms] ${
                    layer.isActive ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{ backgroundImage: `url(${layer.src})` }}
                />
              ))}
              {!activeImage ? (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-white/70">
                  Background images will appear here.
                </div>
              ) : null}

              <div className="absolute bottom-6 left-6 rounded-[28px] border border-white/20 bg-black/50 p-2 backdrop-blur-md">
                <div className="relative h-[200px] w-[160px] overflow-hidden rounded-[22px] border border-white/30 shadow-[0_20px_40px_-24px_rgba(0,0,0,0.6)]">
                  {video.provider === 'vimeo' && video.vimeoId ? (
                    <iframe
                      ref={iframeRef}
                      title={video.title ?? 'Training Avatar'}
                      className="h-full w-full"
                      allow="autoplay; fullscreen; picture-in-picture"
                      src={`https://player.vimeo.com/video/${video.vimeoId}?autoplay=0&muted=0&controls=0&title=0&byline=0&portrait=0`}
                    />
                  ) : video.videoPath ? (
                    <video
                      className="h-full w-full object-cover"
                      src={video.videoPath}
                      autoPlay={video.autoPlay}
                      muted={false}
                      controls={false}
                      onEnded={() => {
                        if (video.autoCloseOnEnd) {
                          setIsOpen(false);
                          onClose?.();
                        }
                      }}
                      onTimeUpdate={event => {
                        const time = event.currentTarget.currentTime;
                        const nextIndex = resolveActiveImage(images, time);
                        setActiveIndex(nextIndex);
                      }}
                      onPause={() => undefined}
                      onPlay={() => setIsReady(true)}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-black text-xs text-white/70">
                      Avatar video placeholder
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onClose?.();
                }}
                className="absolute right-4 top-4 rounded-full border border-white/20 bg-black/40 px-3 py-2 text-xs uppercase tracking-[0.2em] text-white transition hover:bg-black/70"
              >
                Close
              </button>

              <div className="absolute bottom-6 right-6 max-w-[320px] text-right text-sm text-white/80">
                <div className="text-xs uppercase tracking-[0.3em] text-white/70">
                  {video.title ?? 'Training Guide'}
                </div>
                {video.description ? (
                  <p className="mt-2 text-sm text-white/70">
                    {video.description}
                  </p>
                ) : null}
                {!isReady ? (
                  <p className="mt-2 text-xs uppercase tracking-[0.3em] text-white/60">
                    Loading avatar…
                  </p>
                ) : null}
                {loadError ? (
                  <p className="mt-2 text-xs text-red-300">{loadError}</p>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-6">
            <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-white/20 bg-black shadow-[0_40px_120px_-40px_rgba(0,0,0,0.65)]">
              <div className="relative h-[520px] w-full overflow-hidden bg-black">
                {imageLayers.map(layer => (
                  <div
                    key={layer.id}
                    className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[900ms] ${
                      layer.isActive ? 'opacity-100' : 'opacity-0'
                    }`}
                    style={{ backgroundImage: `url(${layer.src})` }}
                  />
                ))}
                {!activeImage ? (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-white/70">
                    Background images will appear here.
                  </div>
                ) : null}

                <div className="absolute bottom-6 left-6 rounded-[28px] border border-white/20 bg-black/50 p-2 backdrop-blur-md">
                  <div className="relative h-[200px] w-[160px] overflow-hidden rounded-[22px] border border-white/30 shadow-[0_20px_40px_-24px_rgba(0,0,0,0.6)]">
                    {video.provider === 'vimeo' && video.vimeoId ? (
                      <iframe
                        ref={iframeRef}
                        title={video.title ?? 'Training Avatar'}
                        className="h-full w-full"
                        allow="autoplay; fullscreen; picture-in-picture"
                        src={`https://player.vimeo.com/video/${video.vimeoId}?autoplay=0&muted=0&controls=0&title=0&byline=0&portrait=0`}
                      />
                    ) : video.videoPath ? (
                      <video
                        className="h-full w-full object-cover"
                        src={video.videoPath}
                        autoPlay={video.autoPlay}
                        muted={false}
                        controls={false}
                        onEnded={() => {
                          if (video.autoCloseOnEnd) {
                            setIsOpen(false);
                            onClose?.();
                          }
                        }}
                        onTimeUpdate={event => {
                          const time = event.currentTarget.currentTime;
                          const nextIndex = resolveActiveImage(images, time);
                          setActiveIndex(nextIndex);
                        }}
                        onPause={() => undefined}
                        onPlay={() => setIsReady(true)}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-black text-xs text-white/70">
                        Avatar video placeholder
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onClose?.();
                  }}
                  className="absolute right-4 top-4 rounded-full border border-white/20 bg-black/40 px-3 py-2 text-xs uppercase tracking-[0.2em] text-white transition hover:bg-black/70"
                >
                  Close
                </button>

                <div className="absolute bottom-6 right-6 max-w-[320px] text-right text-sm text-white/80">
                  <div className="text-xs uppercase tracking-[0.3em] text-white/70">
                    {video.title ?? 'Training Guide'}
                  </div>
                  {video.description ? (
                    <p className="mt-2 text-sm text-white/70">
                      {video.description}
                    </p>
                  ) : null}
                  {!isReady ? (
                    <p className="mt-2 text-xs uppercase tracking-[0.3em] text-white/60">
                      Loading avatar…
                    </p>
                  ) : null}
                  {loadError ? (
                    <p className="mt-2 text-xs text-red-300">{loadError}</p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )
      ) : null}
    </div>
  );
}
