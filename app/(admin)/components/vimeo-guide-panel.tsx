'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

type Marker = {
  id: string;
  time: number;
  label?: string;
  onEnter?: () => void;
};

type PlayerApi = {
  on: (event: string, handler: (data?: { seconds?: number }) => void) => void;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  unload: () => Promise<void>;
  getDuration?: () => Promise<number>;
  setMuted?: (muted: boolean) => Promise<void>;
  setVolume?: (volume: number) => Promise<void>;
  getIframe?: () => Promise<HTMLIFrameElement>;
};

type VimeoGuidePanelProps = {
  videoId: string;
  title?: string;
  description?: string;
  autoShow?: boolean;
  autoPlay?: boolean;
  autoCloseOnEnd?: boolean;
  frameAspectClass?: string;
  videoAspectClass?: string;
  videoWrapClass?: string;
  prebuffer?: boolean;
  minimalFrame?: boolean;
  onEnded?: () => void;
  onProgress?: (seconds: number, duration: number) => void;
  onPlay?: () => void;
  markers?: Marker[];
  onMarkerChange?: (marker: Marker | null) => void;
  className?: string;
};

export type VimeoGuidePanelHandle = {
  playWithSound: () => void;
};

const sortMarkers = (markers: Marker[]) =>
  [...markers].sort((a, b) => a.time - b.time);

const VimeoGuidePanel = forwardRef<VimeoGuidePanelHandle, VimeoGuidePanelProps>(
  (
    {
      videoId,
      title = 'Training Guide',
      description = 'Follow along with the walkthrough to complete your next steps.',
      autoShow = true,
      autoPlay = true,
      autoCloseOnEnd = true,
      frameAspectClass = 'aspect-[9/16]',
      videoAspectClass = 'aspect-[9/16]',
      videoWrapClass = '',
      prebuffer = false,
      minimalFrame = false,
      onEnded,
      onProgress,
      onPlay,
      markers = [],
      onMarkerChange,
      className,
    },
    ref,
  ) => {
  const [isOpen, setIsOpen] = useState(autoShow);
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [needsInteraction, setNeedsInteraction] = useState(false);
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const [wantsSound, setWantsSound] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<PlayerApi | null>(null);
  const lastMarkerIdRef = useRef<string | null>(null);
  const durationRef = useRef<number>(0);
  const pendingPlayRef = useRef<{ withSound: boolean } | null>(null);

  const sortedMarkers = useMemo(() => sortMarkers(markers), [markers]);

  useEffect(() => {
    setIsOpen(autoShow);
  }, [autoShow]);

  useImperativeHandle(
    ref,
    () => ({
      playWithSound: () => {
        setIsOpen(true);
        setWantsSound(true);
        pendingPlayRef.current = { withSound: true };
        if (playerRef.current) {
          void requestPlay(true);
        }
      },
    }),
    [],
  );

  useEffect(() => {
    if (!isOpen) return;
    if (!containerRef.current) return;

    let isMounted = true;

    const initPlayer = async () => {
      try {
        const loadSdk = () =>
          new Promise<void>((resolve, reject) => {
            if (typeof window === 'undefined') {
              reject(new Error('Window not available'));
              return;
            }
            if ((window as typeof window & { Vimeo?: { Player: unknown } }).Vimeo?.Player) {
              resolve();
              return;
            }
            const existing = document.querySelector(
              'script[data-vimeo-player]',
            ) as HTMLScriptElement | null;
            if (existing) {
              existing.addEventListener('load', () => resolve());
              existing.addEventListener('error', () =>
                reject(new Error('Failed to load Vimeo SDK')),
              );
              return;
            }
            const script = document.createElement('script');
            script.src = 'https://player.vimeo.com/api/player.js';
            script.async = true;
            script.dataset.vimeoPlayer = 'true';
            script.addEventListener('load', () => resolve());
            script.addEventListener('error', () =>
              reject(new Error('Failed to load Vimeo SDK')),
            );
            document.body.appendChild(script);
          });

        await loadSdk();
        if (!isMounted) return;
        const Vimeo = (window as typeof window & {
          Vimeo?: { Player: new (el: HTMLElement, options: unknown) => PlayerApi };
        }).Vimeo;
        if (!Vimeo?.Player) {
          throw new Error('Vimeo SDK unavailable');
        }

        const player = new Vimeo.Player(containerRef.current, {
          id: Number(videoId),
          autoplay: autoPlay,
          muted: autoPlay,
          controls: 1,
          title: 0,
          byline: 0,
          portrait: 0,
        });
        playerRef.current = player;

        player.on('loaded', () => {
          if (!isMounted) return;
          setIsReady(true);
          player
            .getDuration?.()
            .then(duration => {
              durationRef.current = duration;
            })
            .catch(() => undefined);
          if (player.getIframe) {
            void player.getIframe().then(iframe => {
              if (!iframe) return;
              iframe.style.width = '100%';
              iframe.style.height = '100%';
              iframe.style.position = 'absolute';
              iframe.style.inset = '0';
            });
          }
          if (pendingPlayRef.current) {
            const request = pendingPlayRef.current;
            pendingPlayRef.current = null;
            void requestPlay(request.withSound);
            return;
          }
          if (prebuffer && !autoPlay) {
            player
              .play()
              .then(() => player.pause())
              .catch(() => undefined);
          }
          if (autoPlay) {
            player
              .play()
              .then(() => {
                if (!isMounted) return;
                setNeedsInteraction(false);
              })
              .catch(() => {
                if (!isMounted) return;
                setNeedsInteraction(true);
              });
          }
        });

        player.on('play', () => {
          if (!isMounted) return;
          setIsReady(true);
          setNeedsInteraction(false);
          onPlay?.();
        });

        player.on('ended', () => {
          if (!isMounted) return;
          onEnded?.();
          if (autoCloseOnEnd) {
            setIsOpen(false);
          }
        });

        player.on('timeupdate', data => {
          if (!isMounted) return;
          const seconds = data?.seconds ?? 0;
          if (onProgress && durationRef.current > 0) {
            onProgress(seconds, durationRef.current);
          }
          if (!sortedMarkers.length) return;
          const nextMarker = [...sortedMarkers]
            .reverse()
            .find(marker => seconds >= marker.time);
          if (!nextMarker) return;
          if (lastMarkerIdRef.current === nextMarker.id) return;
          lastMarkerIdRef.current = nextMarker.id;
          setActiveMarkerId(nextMarker.id);
          nextMarker.onEnter?.();
          onMarkerChange?.(nextMarker);
        });
      } catch (error) {
        if (!isMounted) return;
        setLoadError(
          error instanceof Error
            ? `Unable to initialize Vimeo player. ${error.message}`
            : 'Unable to initialize Vimeo player.',
        );
      }
    };

    void initPlayer();

    return () => {
      isMounted = false;
    };
  }, [
    autoPlay,
    autoCloseOnEnd,
    isOpen,
    onMarkerChange,
    onEnded,
    onProgress,
    onPlay,
    sortedMarkers,
    videoId,
  ]);

  useEffect(() => {
    if (isOpen) return;
    if (playerRef.current) {
      void playerRef.current.pause();
    }
  }, [isOpen]);

  const requestPlay = async (withSound: boolean) => {
    const player = playerRef.current;
    if (!player) return;
    try {
      if (player.setMuted) {
        await player.setMuted(!withSound);
      }
      if (withSound && player.setVolume) {
        await player.setVolume(1);
      }
      await player.play();
      if (withSound && player.setMuted) {
        await player.setMuted(false);
      }
      setNeedsInteraction(false);
    } catch {
      setNeedsInteraction(true);
    }
  };

  const handleReplay = () => {
    setIsOpen(true);
    setIsReady(false);
    setLoadError(null);
    setNeedsInteraction(false);
    setActiveMarkerId(null);
    setWantsSound(false);
    lastMarkerIdRef.current = null;
  };

  return (
    <div className={className} data-active-marker={activeMarkerId ?? ''}>
      {isOpen ? (
        <div className="flex w-full justify-center">
          <div
            className={`relative ${frameAspectClass} w-full max-w-[360px] ${
              minimalFrame
                ? 'bg-transparent'
                : 'rounded-[28px] border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-3 shadow-[0_24px_60px_-50px_rgba(0,0,0,0.35)]'
            }`}
          >
            {!minimalFrame ? (
              <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-white via-white to-[rgba(0,0,0,0.04)]" />
            ) : null}
            <div
              className={`relative h-full w-full ${
                minimalFrame ? 'bg-transparent' : 'overflow-hidden rounded-[22px] bg-[var(--c-0b0b0b)]'
              }`}
            >
              <div
                className={`absolute inset-0 flex items-center justify-center bg-[var(--c-0b0b0b)]`}
              >
                <div className="absolute inset-0">
                  <div
                    ref={containerRef}
                    className={`relative ${videoAspectClass} h-full w-full ${videoWrapClass} overflow-hidden rounded-[30px] bg-transparent shadow-[0_55px_110px_-55px_rgba(0,0,0,0.7)] backdrop-blur-2xl translate-y-[-8px] [&_iframe]:h-full [&_iframe]:w-full [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:rounded-[30px] [&_iframe]:overflow-hidden [&_iframe]:opacity-100 [&_iframe]:[clip-path:inset(0_0_4px_0_round_30px)]`}
                  />
                </div>
              </div>
            </div>
            {needsInteraction ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                <button
                  type="button"
                  onClick={() => void requestPlay(wantsSound)}
                  className="rounded-full border border-white/40 bg-white/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white"
                >
                  {wantsSound ? 'Play With Sound' : 'Play Video'}
                </button>
              </div>
            ) : null}
            {loadError ? (
              <div className="absolute inset-0 flex items-end justify-center pb-3 text-xs text-red-300">
                {loadError}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
  },
);

VimeoGuidePanel.displayName = 'VimeoGuidePanel';

export default VimeoGuidePanel;
