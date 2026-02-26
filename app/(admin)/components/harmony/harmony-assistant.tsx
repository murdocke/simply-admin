"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { Room, RoomEvent, Track } from "livekit-client";
import { HarmonyLiveSurface } from "./live-surface";
import { HARMONY_NAME } from "./constants";

type HarmonyAssistantProps = {
  title?: string;
  roomName?: string;
  identityPrefix?: string;
  participantName?: string;
  dispatchMetadata?: Record<string, unknown>;
  className?: string;
  containerStyle?: CSSProperties;
  cardClassName?: string;
  cardStyle?: CSSProperties;
  status?: "pulse" | "none";
  showWakeToggle?: boolean;
  tallButtons?: boolean;
  compactButtons?: boolean;
};

const joinClasses = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(" ");

const normalizeTranscript = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const nearDuplicate = (left: string, right: string) => {
  const a = normalizeTranscript(left);
  const b = normalizeTranscript(right);
  if (!a || !b) return false;
  if (a === b) return true;
  const minLen = Math.min(a.length, b.length);
  const maxLen = Math.max(a.length, b.length);
  if (minLen >= 16 && minLen / Math.max(1, maxLen) >= 0.78) {
    return a.includes(b) || b.includes(a);
  }
  return false;
};

type TranscriptItem = {
  id: string;
  speaker: "Harmony";
  text: string;
  at: string;
};

export default function HarmonyAssistant({
  title = HARMONY_NAME,
  roomName = "teachers-voice-agent",
  identityPrefix = "teacher",
  participantName = "Teacher",
  dispatchMetadata = { voice: "female", mode: "conversation" },
  className,
  containerStyle,
  cardClassName,
  cardStyle,
  status = "pulse",
  showWakeToggle = true,
  tallButtons = false,
  compactButtons = false,
}: HarmonyAssistantProps) {
  const [voiceSessionState, setVoiceSessionState] = useState<
    "idle" | "connecting" | "connected"
  >("idle");
  const [voiceSessionError, setVoiceSessionError] = useState<string | null>(
    null,
  );
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [voiceAgentSpeaking, setVoiceAgentSpeaking] = useState(false);
  const [voiceWaveStep, setVoiceWaveStep] = useState(0);
  const [voiceWaveEnergy, setVoiceWaveEnergy] = useState(0.08);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [panelPosition, setPanelPosition] = useState({ x: 0, y: 0 });
  const [panelReady, setPanelReady] = useState(false);
  const [panelDragging, setPanelDragging] = useState(false);

  const roomRef = useRef<Room | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const transcriptScrollRef = useRef<HTMLDivElement | null>(null);
  const lastReplyAtRef = useRef<number | null>(null);
  const lastLivekitTextRef = useRef("");
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const buttonHeightClass = tallButtons
    ? "py-2"
    : compactButtons
      ? "py-1"
      : "py-1.5";

  const waveBars = useMemo(() => {
    const barCount = 28;
    const isConnected = voiceSessionState === "connected" && !voiceMuted;
    const baseEnergy = isConnected
      ? voiceAgentSpeaking
        ? Math.max(0.42, voiceWaveEnergy * 3.4)
        : 0.22
      : 0.06;
    return Array.from({ length: barCount }, (_, index) => {
      const centerDistance = Math.abs(index - (barCount - 1) / 2);
      const envelope = Math.max(0.2, 1 - centerDistance / (barCount / 1.65));
      const pulse = Math.sin(voiceWaveStep * 0.58 + index * 0.86);
      const shimmer = Math.cos(voiceWaveStep * 0.31 + index * 0.47);
      const blend = Math.max(0.15, (pulse * 0.6 + shimmer * 0.4 + 1) / 2);
      const height = 4 + blend * baseEnergy * envelope * 34;
      return Math.min(34, Math.max(3, height));
    });
  }, [
    voiceAgentSpeaking,
    voiceMuted,
    voiceSessionState,
    voiceWaveEnergy,
    voiceWaveStep,
  ]);

  const clearVoiceAudioElements = useCallback(() => {
    const nodes = document.querySelectorAll('[data-livekit-voice-audio="true"]');
    nodes.forEach(node => node.remove());
  }, []);

  const appendHarmonyInteraction = useCallback((text: string) => {
    const message = text.trim().replace(/\s+/g, " ");
    if (!message) return;

    setTranscript(previous => {
      const now = new Date();
      const nowMs = now.getTime();
      const nowTime = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }).format(now);
      const lastEntry = previous[previous.length - 1];
      const recentWindowMs = 14_000;
      const inRecentWindow =
        lastReplyAtRef.current !== null &&
        nowMs - lastReplyAtRef.current <= recentWindowMs;

      if (
        lastEntry &&
        inRecentWindow &&
        (message.startsWith(lastEntry.text) ||
          lastEntry.text.startsWith(message) ||
          nearDuplicate(lastEntry.text, message))
      ) {
        const nextText =
          message.length >= lastEntry.text.length ? message : lastEntry.text;
        lastReplyAtRef.current = nowMs;
        if (nextText === lastEntry.text) return previous;
        return [
          ...previous.slice(0, -1),
          {
            ...lastEntry,
            text: nextText,
            at: nowTime,
          },
        ];
      }

      const recentHarmonyTexts = previous.slice(-4).map(entry => entry.text);
      const isDuplicate = recentHarmonyTexts.some(recent =>
        nearDuplicate(recent, message),
      );
      if (isDuplicate) return previous;

      lastReplyAtRef.current = nowMs;
      return [
        ...previous,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          speaker: "Harmony" as const,
          text: message,
          at: nowTime,
        },
      ].slice(-5);
    });
  }, []);

  const stopVoiceSession = useCallback(() => {
    const room = roomRef.current;
    if (room) {
      room.disconnect();
      roomRef.current = null;
    }
    clearVoiceAudioElements();
    setVoiceSessionState("idle");
    setVoiceSessionError(null);
    setVoiceMuted(false);
    setVoiceAgentSpeaking(false);
    setVoiceWaveEnergy(0.08);
    setPanelDragging(false);
    setPanelReady(false);
    lastLivekitTextRef.current = "";
    lastReplyAtRef.current = null;
  }, [clearVoiceAudioElements]);

  const startVoiceSession = useCallback(async () => {
    if (voiceSessionState !== "idle") return;

    const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
    if (!livekitUrl) {
      setVoiceSessionError("Missing NEXT_PUBLIC_LIVEKIT_URL.");
      return;
    }

    setVoiceSessionState("connecting");
    setVoiceSessionError(null);
    setVoiceAgentSpeaking(false);
    setVoiceWaveEnergy(0.08);
    setPanelDragging(false);
    lastLivekitTextRef.current = "";
    lastReplyAtRef.current = null;
    setTranscript([]);

    try {
      const identity = `${identityPrefix}-voice-${Math.random()
        .toString(36)
        .slice(2, 8)}`;

      const dispatchResponse = await fetch("/api/livekit/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room: roomName,
          metadata: JSON.stringify(dispatchMetadata),
        }),
      });
      if (!dispatchResponse.ok) {
        const dispatchPayload = (await dispatchResponse.json()) as {
          error?: string;
        };
        throw new Error(
          dispatchPayload.error ??
            "No agent dispatched. Check LIVEKIT_AGENT_NAME / worker status.",
        );
      }

      const tokenResponse = await fetch("/api/livekit/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room: roomName,
          identity,
          name: participantName,
        }),
      });
      const tokenPayload = (await tokenResponse.json()) as {
        token?: string;
        error?: string;
      };
      if (!tokenResponse.ok || !tokenPayload.token) {
        throw new Error(tokenPayload.error ?? "Unable to create LiveKit token.");
      }

      const room = new Room();
      roomRef.current = room;

      room.on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
        if (track.kind !== Track.Kind.Audio) return;
        const audio = track.attach();
        audio.setAttribute("autoplay", "true");
        audio.setAttribute("playsinline", "true");
        audio.setAttribute("data-livekit-voice-audio", "true");
        audio.dataset.participantIdentity = participant.identity;
        document.body.appendChild(audio);
      });

      room.on(RoomEvent.ParticipantDisconnected, participant => {
        const nodes = document.querySelectorAll(
          `[data-livekit-voice-audio=\"true\"][data-participant-identity=\"${participant.identity}\"]`,
        );
        nodes.forEach(node => node.remove());
      });

      room.on(RoomEvent.ActiveSpeakersChanged, speakers => {
        const remoteSpeakers = speakers.filter(
          speaker => speaker.identity !== room.localParticipant.identity,
        );
        const maxRemoteLevel = remoteSpeakers.reduce((maxLevel, speaker) => {
          const level =
            typeof speaker.audioLevel === "number" ? speaker.audioLevel : 0;
          return Math.max(maxLevel, level);
        }, 0);
        setVoiceAgentSpeaking(remoteSpeakers.length > 0);
        if (remoteSpeakers.length > 0) {
          setVoiceWaveEnergy(level => Math.max(level, maxRemoteLevel + 0.18));
        }
      });

      room.on(RoomEvent.TranscriptionReceived, (segments, participant) => {
        const isRemoteParticipant =
          Boolean(participant?.identity) &&
          participant?.identity !== room.localParticipant.identity;
        if (!isRemoteParticipant) return;

        const candidates: string[] = [];
        for (const segment of segments) {
          if (!segment || typeof segment.text !== "string") continue;
          const next = segment.text.trim();
          if (next) candidates.push(next);
        }

        if (candidates.length === 0) return;
        const candidateText = candidates.join(" ").trim();
        if (!candidateText || candidateText === lastLivekitTextRef.current) return;
        lastLivekitTextRef.current = candidateText;
        appendHarmonyInteraction(candidateText);
      });

      await room.connect(livekitUrl, tokenPayload.token);
      await room.localParticipant.setMicrophoneEnabled(true);
      setVoiceSessionState("connected");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to connect voice session.";
      setVoiceSessionError(message);
      setVoiceSessionState("idle");
      stopVoiceSession();
    }
  }, [
    appendHarmonyInteraction,
    dispatchMetadata,
    identityPrefix,
    participantName,
    roomName,
    stopVoiceSession,
    voiceSessionState,
  ]);

  const toggleVoiceMute = useCallback(async () => {
    const room = roomRef.current;
    if (!room || voiceSessionState !== "connected") return;
    const nextMuted = !voiceMuted;
    await room.localParticipant.setMicrophoneEnabled(!nextMuted);
    setVoiceMuted(nextMuted);
  }, [voiceMuted, voiceSessionState]);

  useEffect(() => {
    return () => {
      stopVoiceSession();
    };
  }, [stopVoiceSession]);

  useEffect(() => {
    if (voiceSessionState !== "connected" || voiceMuted || !voiceAgentSpeaking) {
      setVoiceWaveEnergy(0.08);
      return;
    }
    const interval = window.setInterval(() => {
      setVoiceWaveStep(step => step + 1);
      setVoiceWaveEnergy(level => Math.max(0.08, level * 0.9));
    }, 140);
    return () => window.clearInterval(interval);
  }, [voiceAgentSpeaking, voiceMuted, voiceSessionState]);

  useEffect(() => {
    if (voiceSessionState !== "connected") {
      setPanelReady(false);
      return;
    }
    if (panelReady) return;
    const card = cardRef.current;
    const width = 360;
    const margin = 16;
    const nextX = (() => {
      if (!card) return Math.max(margin, window.innerWidth - width - margin);
      const rect = card.getBoundingClientRect();
      return Math.max(
        margin,
        Math.min(window.innerWidth - width - margin, rect.right - width),
      );
    })();
    const nextY = (() => {
      if (!card) return 128;
      const rect = card.getBoundingClientRect();
      return Math.max(96, rect.bottom + 12);
    })();
    setPanelPosition({ x: nextX, y: nextY });
    setPanelReady(true);
  }, [panelReady, voiceSessionState]);

  useEffect(() => {
    if (voiceSessionState !== "connected") return;
    const handleResize = () => {
      setPanelPosition(current => {
        const panelWidth = 360;
        const panelHeight = 330;
        const minX = 8;
        const minY = 72;
        const maxX = Math.max(minX, window.innerWidth - panelWidth - 8);
        const maxY = Math.max(minY, window.innerHeight - panelHeight - 8);
        return {
          x: Math.min(maxX, Math.max(minX, current.x)),
          y: Math.min(maxY, Math.max(minY, current.y)),
        };
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [voiceSessionState]);

  useEffect(() => {
    const node = transcriptScrollRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [transcript]);

  const clampPanel = (x: number, y: number) => {
    if (typeof window === "undefined") return { x, y };
    const panelWidth = 360;
    const panelHeight = 330;
    const minX = 8;
    const minY = 72;
    const maxX = Math.max(minX, window.innerWidth - panelWidth - 8);
    const maxY = Math.max(minY, window.innerHeight - panelHeight - 8);
    return {
      x: Math.min(maxX, Math.max(minX, x)),
      y: Math.min(maxY, Math.max(minY, y)),
    };
  };

  const handlePanelPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (voiceSessionState !== "connected") return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: panelPosition.x,
      originY: panelPosition.y,
    };
    setPanelDragging(true);
  };

  const handlePanelPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const dragState = dragRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    const next = clampPanel(dragState.originX + deltaX, dragState.originY + deltaY);
    setPanelPosition(next);
  };

  const handlePanelPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      setPanelDragging(false);
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div className={className} style={containerStyle}>
      <div
        ref={cardRef}
        className={joinClasses(
          "flex h-full flex-col rounded-2xl border border-[color:var(--harmony-card-border)] bg-[color:var(--harmony-card-bg)] px-3 py-2 shadow-sm backdrop-blur-[3px]",
          cardClassName,
          status === "pulse" && voiceSessionState === "connected"
            ? "harmony-connected-pulse"
            : "",
        )}
        style={{ backgroundImage: "var(--harmony-card-overlay)", ...cardStyle }}
      >
        <div className="my-auto flex flex-col justify-center">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[14px] font-semibold uppercase tracking-[0.22em] text-[var(--c-c8102e)]">
              {title}
            </p>
            <span
              className={joinClasses(
                "rounded-full px-2.5 py-0.5 text-[9px] uppercase tracking-[0.16em]",
                voiceSessionState === "idle"
                  ? "bg-[var(--c-fff7e8)] text-[var(--c-7a4a17)]"
                  : "bg-[var(--c-ffffff)] text-[var(--c-6f6c65)]",
              )}
            >
              {voiceSessionState === "idle" ? "Ready" : "Connected"}
            </span>
          </div>
          <div
            className={joinClasses(
              "mt-2 grid w-full gap-1.5",
              voiceSessionState !== "connected" ? "grid-cols-1" : "grid-cols-2",
            )}
          >
            {voiceSessionState !== "connected" ? (
              <button
                type="button"
                onClick={() => {
                  void startVoiceSession();
                }}
                disabled={voiceSessionState !== "idle"}
                className={joinClasses(
                  "rounded-xl border border-teal-800 bg-teal-700 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50",
                  buttonHeightClass,
                )}
              >
                Connect
              </button>
            ) : null}
            {voiceSessionState === "connected" ? (
              <button
                type="button"
                onClick={() => {
                  void toggleVoiceMute();
                }}
                className={joinClasses(
                  "rounded-xl border border-[var(--harmony-panel-block-border)] bg-[var(--harmony-panel-block-bg)] px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--harmony-panel-header-text)] transition hover:border-teal-700/60 hover:text-teal-800",
                  buttonHeightClass,
                )}
              >
                {voiceMuted ? "Unmute" : "Mute"}
              </button>
            ) : null}
            {voiceSessionState === "connected" ? (
              <button
                type="button"
                onClick={stopVoiceSession}
                className={joinClasses(
                  "rounded-xl border border-[var(--harmony-panel-block-border)] bg-[var(--harmony-panel-block-bg)] px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--harmony-panel-header-text)] transition hover:border-teal-700/60 hover:text-teal-800",
                  buttonHeightClass,
                )}
              >
                End
              </button>
            ) : null}
            {showWakeToggle ? (
              <button
                type="button"
                onClick={() => setWakeWordEnabled(current => !current)}
                className={joinClasses(
                  "rounded-xl border border-[var(--harmony-panel-block-border)] bg-[var(--harmony-panel-block-bg)] px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--harmony-panel-header-text)] transition hover:border-teal-700/60 hover:text-teal-800",
                  buttonHeightClass,
                  voiceSessionState !== "connected" ? "" : "col-span-2",
                )}
              >
                {wakeWordEnabled ? '"Hey Harmony"' : "Wake Off"}
              </button>
            ) : null}
          </div>
        </div>
        {voiceSessionError ? (
          <p className="mt-3 text-xs text-[var(--c-8f2f3b)]">{voiceSessionError}</p>
        ) : null}
      </div>

      {voiceSessionState === "connected" ? (
        <HarmonyLiveSurface
          className="fixed z-40 w-[min(360px,calc(100vw-16px))] overflow-hidden rounded-2xl border backdrop-blur-[4px]"
          style={{
            left: panelPosition.x,
            top: panelPosition.y,
            borderColor: "var(--harmony-panel-border)",
            backgroundImage: "var(--harmony-panel-bg)",
            boxShadow: "var(--harmony-panel-shadow)",
          }}
          title={title}
          dragging={panelDragging}
          headerRight={
            <button
              type="button"
              onPointerDown={event => event.stopPropagation()}
              onClick={stopVoiceSession}
              className="harmony-done-pulse rounded-full border border-teal-800 bg-teal-700 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white shadow-[0_2px_8px_rgba(10,80,72,0.32)] transition hover:border-teal-900 hover:bg-teal-800"
            >
              Done
            </button>
          }
          headerClassName="cursor-grab touch-none"
          headerStyle={{
            borderBottomColor: "var(--harmony-panel-border)",
            color: "var(--harmony-panel-header-text)",
          }}
          onPointerDown={handlePanelPointerDown}
          onPointerMove={handlePanelPointerMove}
          onPointerUp={handlePanelPointerUp}
          onPointerCancel={handlePanelPointerUp}
        >
          <div
            className="rounded-xl border px-2.5 py-2"
            style={{
              borderColor: "var(--harmony-panel-block-border)",
              backgroundColor: "var(--harmony-panel-block-bg)",
            }}
          >
            <svg
              viewBox="0 0 224 44"
              className="h-10 w-full"
              role="img"
              aria-label="Harmony voice waveform"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient
                  id="harmonyFloatingWaveGradientReusable"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="var(--harmony-wave-stop-a)" />
                  <stop offset="42%" stopColor="var(--harmony-wave-stop-b)" />
                  <stop offset="100%" stopColor="var(--harmony-wave-stop-c)" />
                </linearGradient>
              </defs>
              {waveBars.map((barHeight, index) => {
                const x = index * 8 + 1;
                const y = 22 - barHeight / 2;
                return (
                  <rect
                    key={`floating-wave-${index}`}
                    x={x}
                    y={y}
                    width={5}
                    height={barHeight}
                    rx={2.5}
                    fill="url(#harmonyFloatingWaveGradientReusable)"
                  />
                );
              })}
            </svg>
          </div>
          <p
            className="mt-2 text-[10px] uppercase tracking-[0.18em]"
            style={{ color: "var(--harmony-panel-muted)" }}
          >
            {voiceMuted
              ? "Muted"
              : voiceAgentSpeaking
                ? "Harmony speaking"
                : "Listening for your cue"}
          </p>
          {transcript.length > 0 ? (
            <div
              className="mt-2 space-y-1.5 rounded-xl border px-2.5 py-2"
              style={{
                borderColor: "var(--harmony-panel-block-border)",
                backgroundColor: "var(--harmony-panel-block-bg)",
              }}
            >
              <div
                ref={transcriptScrollRef}
                className="harmony-transcript-scroll max-h-[60vh] space-y-1.5 overflow-y-auto pr-1"
              >
                {transcript.map(entry => (
                  <div key={entry.id} className="w-full rounded-xl border border-[var(--c-e5e3dd)] bg-[var(--c-fff5f6)] px-2.5 py-2 text-sm">
                    <p style={{ color: "var(--harmony-panel-text)" }}>
                      <span
                        className="font-semibold"
                        style={{ color: "var(--harmony-panel-speaker)" }}
                      >
                        {entry.speaker}:
                      </span>{" "}
                      {entry.text}
                    </p>
                    <p
                      className="mt-0.5 text-right text-[10px]"
                      style={{ color: "var(--harmony-panel-time)" }}
                    >
                      {entry.at}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </HarmonyLiveSurface>
      ) : null}
    </div>
  );
}
