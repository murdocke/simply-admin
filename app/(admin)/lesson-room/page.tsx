// LiveKit React docs (installation): https://docs.livekit.io/reference/components/react/installation/
// Mock placeholders only; intended to be replaced with LiveKitRoom and VideoConference components.

"use client";

import type { CSSProperties, PointerEventHandler, ReactElement } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MidiNumbers, Piano } from "react-piano";
import {
  LocalAudioTrack,
  Room,
  RoomEvent,
  Track,
  createLocalAudioTrack,
  createLocalVideoTrack,
    type LocalVideoTrack,
    type RemoteTrack,
    type RemoteVideoTrack,
  } from "livekit-client";
import { HarmonyLiveSurface } from "../components/harmony/live-surface";
import { HARMONY_MENU_LABEL, HARMONY_NAME } from "../components/harmony/constants";

type VideoPlaceholderProps = {
  label: string;
  className?: string;
  showSwapButton?: boolean;
  onSwap?: () => void;
  videoRef?: React.RefObject<HTMLVideoElement>;
  mirrored?: boolean;
  labelSize?: "sm" | "md";
  signalActive?: boolean;
  livekitState?: "disconnected" | "connecting" | "connected";
  isRecording?: boolean;
};

type CameraFrameProps = {
  label: string;
  className?: string;
  showSwapButton?: boolean;
  onSwap?: () => void;
  videoRef?: React.RefObject<HTMLVideoElement>;
  mirrored?: boolean;
  labelSize?: "sm" | "md";
  signalActive?: boolean;
  livekitState?: "disconnected" | "connecting" | "connected";
  isRecording?: boolean;
};

type DragPosition = {
  x: number;
  y: number;
};

type DragState = {
  dragging: boolean;
  offsetX: number;
  offsetY: number;
};

type DockSide = "left" | "right";
type UserRole = "teacher" | "student" | "company" | "parent" | "dev";
type CameraSource = "teacher1" | "teacher2" | "student";
type StudentFeedSource = "remote" | "teacher1" | "teacher2" | "studentCam";
type LessonRecording = {
  id: string;
  roomName: string;
  egressId: string;
  status: string;
  startedAt: string;
  endedAt: string | null;
  filepath: string;
  fileUrl: string | null;
  error: string | null;
};

type RecordingLiveDebug = {
  status: string;
  error: string | null;
  egressId: string;
  details: string | null;
  roomName: string;
  sourceType: string;
  requestType: string | null;
  startedAt: string | null;
  updatedAt: string | null;
  endedAt: string | null;
  startedSeconds?: number | null;
  destinations: string[];
};

type RecordingDebugPayload = {
  live: RecordingLiveDebug | null;
  active:
    | {
        total: number;
        room: number;
        ids: string[];
        details?: Array<{
          egressId: string;
          roomName: string;
          status: string;
          startedAt: string | null;
        }>;
      }
    | null;
  diagnostics: {
    livekit: {
      hasUrl: boolean;
      hasApiKey: boolean;
      hasApiSecret: boolean;
      urlMatchesPublic: boolean;
      livekitUrl: string;
      publicLivekitUrl: string;
    };
    s3: {
      hasBucket: boolean;
      hasRegion: boolean;
      hasEndpoint: boolean;
      hasAccessKey: boolean;
      hasSecretKey: boolean;
      bucket: string;
      region: string;
      endpoint: string;
    };
  } | null;
  hints: string[];
};

type RecordingQualityState = {
  level: "good" | "fair" | "poor" | "unknown";
  videoKbps: number;
  audioKbps: number;
  fps: number | null;
  packetLossPct: number | null;
  rttMs: number | null;
  sampleCount: number;
};

type MidiLessonFile = {
  name: string;
  title: string;
  url: string;
};

type ParsedMidiNoteEvent = {
  atMs: number;
  type: "on" | "off";
  note: number;
  velocity: number;
  seq: number;
};

type MidiLessonStatus = "idle" | "loading" | "loaded" | "playing" | "ready";
type TeacherAudioMode = "on" | "mellow" | "off";
type NoteNamesMode = "off" | "sharp" | "flat";

type MidiNoteDataMessage = {
  type: "sm-midi-note";
  note: number;
  velocity: number;
  on: boolean;
  ts: number;
};
type MidiControlDataMessage = {
  type: "sm-midi-control";
  visualEnabled: boolean;
  keyboardVisible: boolean;
  noteNamesMode: NoteNamesMode;
  ts: number;
};
type HarmonyInteraction = {
  id: string;
  speaker: "Harmony" | "System";
  text: string;
  at: string;
};
type HarmonyMode = "prep" | "recap";

type SoundPresetId = "sf2piano" | "acoustic" | "epiano" | "organ" | "synth";
type SoundfontSynthLike = {
  soundBankManager: {
    addSoundBank(soundBankBuffer: ArrayBuffer, id: string, bankOffset?: number): Promise<void>;
  };
  isReady: Promise<unknown>;
  programChange(channel: number, programNumber: number): void;
  noteOn(channel: number, midiNote: number, velocity: number): void;
  noteOff(channel: number, midiNote: number, force?: boolean): void;
  controllerChange(
    channel: number,
    controllerNumber: number,
    controllerValue: number,
    force?: boolean,
  ): void;
  connect(destinationNode: AudioNode): AudioNode;
  disconnect(destinationNode?: AudioNode): AudioNode | undefined;
  stopAll(force?: boolean): void;
  destroy(): void;
};
type OscillatorVoice = {
  oscillatorA: OscillatorNode;
  oscillatorB: OscillatorNode;
  gainNode: GainNode;
  releaseSeconds: number;
};

const CONTROL_PANEL_WIDTH = 300;
const CONTROL_PANEL_HEIGHT = 88;
const MINIMIZED_WIDTH = 20;
const MINIMIZED_HEIGHT = 64;
const CONTROL_MARGIN = 16;
const CONTROL_PANEL_BOTTOM_OFFSET = 24;
const AUTH_STORAGE_KEY = "sm_user";
const VIEW_ROLE_STORAGE_KEY = "sm_view_role";
const VIEW_STUDENT_STORAGE_KEY = "sm_view_student";
const DEFAULT_ROOM_NAME = "lesson-room";
const LIVEKIT_CONNECT_RETRY_COUNT = 1;
const RECORDING_STOP_GUARD_MS = 5000;
const EGRESS_STARTING_MAX_WAIT_MS = 20000;
const CAMERA_DISPLAY_META: Record<
  CameraSource,
  { shortCode: string }
> = {
  teacher1: { shortCode: "CAM-T1" },
  teacher2: { shortCode: "CAM-T2" },
  student: { shortCode: "CAM-S1" },
};
const STATUS_LABELS: Record<string, string> = {
  EGRESS_STARTING: "PREPARING TO RECORD",
  EGRESS_ACTIVE: "RECORDING IN PROGRESS",
};
const MIDI_MIN_NOTE = MidiNumbers.fromNote("c2");
const MIDI_MAX_NOTE = MidiNumbers.fromNote("c7");
const SOUND_FONT_URL = "/soundfonts/piano/UprightPianoKW-20220221.sf2";
const SOUND_FONT_WORKLET_URL = "/soundfonts/spessasynth/spessasynth_processor.min.js";
const HARMONY_PANEL_INLINE_CONTROLS_VISIBLE = false;
const SOUND_OPTIONS: SoundPresetId[] = ["sf2piano", "acoustic", "epiano", "organ", "synth"];
const SOUND_LABELS: Record<SoundPresetId, string> = {
  sf2piano: "Simply Music Piano",
  acoustic: "Acoustic Piano",
  epiano: "Electric Piano",
  organ: "Organ",
  synth: "Synth Lead",
};
const TEACHER_AUDIO_GAIN_BY_MODE: Record<TeacherAudioMode, number> = {
  on: 1,
  mellow: 0.15,
  off: 0,
};
const MIDI_NOTE_NAMES_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
const MIDI_NOTE_NAMES_FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"] as const;
const CHORD_PATTERNS: Array<{ intervals: number[]; name: string }> = [
  { intervals: [0, 4, 7], name: "Major" },
  { intervals: [0, 3, 7], name: "Minor" },
  { intervals: [0, 3, 6], name: "Diminished" },
  { intervals: [0, 4, 8], name: "Augmented" },
  { intervals: [0, 2, 7], name: "Sus2" },
  { intervals: [0, 5, 7], name: "Sus4" },
  { intervals: [0, 4, 7, 11], name: "Major 7" },
  { intervals: [0, 4, 7, 10], name: "Dominant 7" },
  { intervals: [0, 3, 7, 10], name: "Minor 7" },
];

const detectChordName = (noteNumbers: number[], noteNames: readonly string[]) => {
  if (noteNumbers.length < 2) {
    return "";
  }
  const sortedNotes = [...noteNumbers].sort((a, b) => a - b);
  const bassPitchClass = ((sortedNotes[0] ?? 0) % 12 + 12) % 12;
  const uniquePitchClasses = [...new Set(noteNumbers.map((n) => ((n % 12) + 12) % 12))];
  if (uniquePitchClasses.length < 2) {
    return "";
  }

  for (const root of uniquePitchClasses) {
    const normalized = uniquePitchClasses
      .map((pc) => (pc - root + 12) % 12)
      .sort((a, b) => a - b);

    for (const pattern of CHORD_PATTERNS) {
      if (pattern.intervals.length !== normalized.length) {
        continue;
      }
      const exact = pattern.intervals.every((value, index) => value === normalized[index]);
      if (exact) {
        if (pattern.name === "Major" || pattern.name === "Minor") {
          const rootName = noteNames[root] ?? "C";
          const thirdInterval = pattern.name === "Major" ? 4 : 3;
          const bassInterval = (bassPitchClass - root + 12) % 12;
          if (bassInterval === thirdInterval) {
            return `${rootName} ${pattern.name} 1st Inversion`;
          }
          if (bassInterval === 7) {
            return `${rootName} ${pattern.name} 2nd Inversion`;
          }
          return `${rootName} ${pattern.name}`;
        }
        return `${noteNames[root] ?? "C"} ${pattern.name}`;
      }
    }
  }
  return "";
};

const isSoundfontWorkletExecutionError = (error: unknown) => {
  if (
    typeof DOMException !== "undefined" &&
    error instanceof DOMException &&
    error.name === "InvalidStateError"
  ) {
    return true;
  }
  const message = error instanceof Error ? error.message : String(error);
  return /AudioWorkletGlobalScope|audioWorklet\.addModule|AudioWorkletNode|No execution context available/i.test(
    message,
  );
};

const readVariableLength = (bytes: Uint8Array, offset: number) => {
  let value = 0;
  let cursor = offset;
  while (cursor < bytes.length) {
    const current = bytes[cursor];
    value = (value << 7) | (current & 0x7f);
    cursor += 1;
    if ((current & 0x80) === 0) {
      return { value, nextOffset: cursor };
    }
  }
  throw new Error("Invalid MIDI variable length value.");
};

const parseMidiNoteEvents = (buffer: ArrayBuffer): ParsedMidiNoteEvent[] => {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const readText = (start: number, length: number) =>
    String.fromCharCode(...bytes.slice(start, start + length));
  const readUint32 = (offset: number) => view.getUint32(offset, false);
  const readUint16 = (offset: number) => view.getUint16(offset, false);

  if (readText(0, 4) !== "MThd") {
    throw new Error("Invalid MIDI header.");
  }
  const headerLength = readUint32(4);
  const trackCount = readUint16(10);
  const division = readUint16(12);
  if ((division & 0x8000) !== 0) {
    throw new Error("SMPTE MIDI timing is not supported.");
  }
  const ppq = division;
  let cursor = 8 + headerLength;
  let sequence = 0;
  const noteEventsRaw: Array<{
    tick: number;
    type: "on" | "off";
    note: number;
    velocity: number;
    seq: number;
  }> = [];
  const tempoEventsRaw: Array<{ tick: number; tempoUsPerQuarter: number }> = [];

  for (let trackIndex = 0; trackIndex < trackCount; trackIndex += 1) {
    if (readText(cursor, 4) !== "MTrk") {
      break;
    }
    const trackLength = readUint32(cursor + 4);
    const trackEnd = cursor + 8 + trackLength;
    let trackCursor = cursor + 8;
    let runningStatus = 0;
    let absoluteTick = 0;

    while (trackCursor < trackEnd) {
      const delta = readVariableLength(bytes, trackCursor);
      absoluteTick += delta.value;
      trackCursor = delta.nextOffset;
      const eventByte = bytes[trackCursor];
      if (eventByte === undefined) break;

      if (eventByte === 0xff) {
        const metaType = bytes[trackCursor + 1] ?? 0;
        const metaLen = readVariableLength(bytes, trackCursor + 2);
        const metaDataStart = metaLen.nextOffset;
        const metaDataEnd = metaDataStart + metaLen.value;
        if (metaType === 0x51 && metaLen.value === 3 && metaDataEnd <= bytes.length) {
          const tempoUsPerQuarter =
            (bytes[metaDataStart] << 16) |
            (bytes[metaDataStart + 1] << 8) |
            bytes[metaDataStart + 2];
          tempoEventsRaw.push({ tick: absoluteTick, tempoUsPerQuarter });
        }
        trackCursor = metaDataEnd;
        continue;
      }

      if (eventByte === 0xf0 || eventByte === 0xf7) {
        const sysexLen = readVariableLength(bytes, trackCursor + 1);
        trackCursor = sysexLen.nextOffset + sysexLen.value;
        continue;
      }

      let status = eventByte;
      let data1Offset = trackCursor + 1;
      if (eventByte < 0x80) {
        if (runningStatus === 0) {
          throw new Error("Invalid MIDI running status.");
        }
        status = runningStatus;
        data1Offset = trackCursor;
      } else {
        runningStatus = status;
      }

      const eventType = status & 0xf0;
      if (eventType === 0x80 || eventType === 0x90) {
        const note = bytes[data1Offset] ?? 0;
        const velocity = bytes[data1Offset + 1] ?? 0;
        const isNoteOn = eventType === 0x90 && velocity > 0;
        noteEventsRaw.push({
          tick: absoluteTick,
          type: isNoteOn ? "on" : "off",
          note,
          velocity,
          seq: sequence++,
        });
        trackCursor = data1Offset + 2;
        continue;
      }

      if (eventType === 0xc0 || eventType === 0xd0) {
        trackCursor = data1Offset + 1;
        continue;
      }

      trackCursor = data1Offset + 2;
    }

    cursor = trackEnd;
  }

  const tempoEvents = [...tempoEventsRaw].sort((a, b) => a.tick - b.tick);
  if (tempoEvents.length === 0 || tempoEvents[0]?.tick !== 0) {
    tempoEvents.unshift({ tick: 0, tempoUsPerQuarter: 500000 });
  }

  const tempoSegments: Array<{
    tick: number;
    tempoUsPerQuarter: number;
    startMs: number;
  }> = [];
  for (let index = 0; index < tempoEvents.length; index += 1) {
    const event = tempoEvents[index];
    if (index === 0) {
      tempoSegments.push({ ...event, startMs: 0 });
      continue;
    }
    const prev = tempoEvents[index - 1];
    const prevSegment = tempoSegments[index - 1];
    const prevDurationTicks = event.tick - prev.tick;
    const prevDurationMs =
      (prevDurationTicks * prev.tempoUsPerQuarter) / (ppq * 1000);
    tempoSegments.push({
      ...event,
      startMs: prevSegment.startMs + prevDurationMs,
    });
  }

  const tickToMs = (tick: number) => {
    let segment = tempoSegments[0];
    for (let i = 1; i < tempoSegments.length; i += 1) {
      if (tempoSegments[i].tick > tick) break;
      segment = tempoSegments[i];
    }
    return segment.startMs + ((tick - segment.tick) * segment.tempoUsPerQuarter) / (ppq * 1000);
  };

  return noteEventsRaw
    .map((event) => ({
      atMs: tickToMs(event.tick),
      type: event.type,
      note: event.note,
      velocity: event.velocity,
      seq: event.seq,
    }))
    .sort((a, b) => (a.atMs === b.atMs ? a.seq - b.seq : a.atMs - b.atMs));
};

const QUALITY_COLORS: Record<RecordingQualityState["level"], string> = {
  good: "border-[var(--c-d8eadf)] bg-[var(--c-f3fbf6)] text-[var(--c-22653d)]",
  fair: "border-[var(--c-f5e3bd)] bg-[var(--c-fff8ea)] text-[var(--c-8a5b13)]",
  poor: "border-[var(--c-f2d7db)] bg-[var(--c-fff5f6)] text-[var(--c-8f2f3b)]",
  unknown: "border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] text-[var(--c-6f6c65)]",
};

const videoBackdropStyle: CSSProperties = {
  backgroundImage:
    "linear-gradient(180deg, rgba(8, 10, 14, 0.2), rgba(8, 10, 14, 0.78)), radial-gradient(120% 120% at 50% 0%, rgba(85, 102, 130, 0.35), rgba(12, 14, 20, 0.9)), repeating-linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0px, rgba(255, 255, 255, 0.06) 10px, rgba(0, 0, 0, 0.08) 10px, rgba(0, 0, 0, 0.08) 20px)",
  backgroundSize: "cover",
  backgroundPosition: "center",
};

const midiFrequencyFromNote = (note: number) => 440 * 2 ** ((note - 69) / 12);
const buildDriveCurve = (amount: number) => {
  const k = Math.max(0, amount);
  const samples = 1024;
  const curve = new Float32Array(samples);
  for (let i = 0; i < samples; i += 1) {
    const x = (i * 2) / (samples - 1) - 1;
    curve[i] = ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x));
  }
  return curve;
};

const SOUND_PRESET_CONFIG: Record<
  Exclude<SoundPresetId, "sf2piano">,
  {
    oscA: OscillatorType;
    oscB: OscillatorType;
    ratioB: number;
    detuneB: number;
    level: number;
    release: number;
    cutoff: number;
    resonance: number;
    drive: number;
  }
> = {
  acoustic: {
    oscA: "triangle",
    oscB: "sine",
    ratioB: 2,
    detuneB: 0,
    level: 1,
    release: 0.2,
    cutoff: 5400,
    resonance: 1.1,
    drive: 1.15,
  },
  epiano: {
    oscA: "sine",
    oscB: "triangle",
    ratioB: 2,
    detuneB: 3,
    level: 0.95,
    release: 0.24,
    cutoff: 4600,
    resonance: 1.35,
    drive: 1.3,
  },
  organ: {
    oscA: "sine",
    oscB: "square",
    ratioB: 1,
    detuneB: 5,
    level: 0.88,
    release: 0.1,
    cutoff: 6200,
    resonance: 0.9,
    drive: 1.05,
  },
  synth: {
    oscA: "sawtooth",
    oscB: "square",
    ratioB: 1.01,
    detuneB: 6,
    level: 0.78,
    release: 0.16,
    cutoff: 3200,
    resonance: 2,
    drive: 1.45,
  },
};

const MidiKeyboardPanel = ({
  activeNotes,
  interactive,
  isTeacher,
  visualEnabled,
  onToggleVisual,
  keyboardEnabled,
  onToggleKeyboard,
  teacherAudioMode,
  onCycleTeacherAudioMode,
  studentAudioEnabled,
  onToggleStudentAudio,
  noteNamesMode,
  onCycleNoteNamesMode,
  onNoteOn,
  onNoteOff,
  selectedSound,
  onCycleSound,
  volume,
  onVolumeChange,
  isSoundfontLoading,
  soundfontFailed,
  keyboardName,
}: {
  activeNotes: number[];
  interactive: boolean;
  isTeacher: boolean;
  visualEnabled: boolean;
  onToggleVisual: () => void;
  keyboardEnabled: boolean;
  onToggleKeyboard: () => void;
  teacherAudioMode: TeacherAudioMode;
  onCycleTeacherAudioMode: () => void;
  studentAudioEnabled: boolean;
  onToggleStudentAudio: () => void;
  noteNamesMode: NoteNamesMode;
  onCycleNoteNamesMode: () => void;
  onNoteOn: (note: number, velocity?: number) => void;
  onNoteOff: (note: number) => void;
  selectedSound: SoundPresetId;
  onCycleSound: (direction: 1 | -1) => void;
  volume: number;
  onVolumeChange: (value: number) => void;
  isSoundfontLoading: boolean;
  soundfontFailed: boolean;
  keyboardName: string;
}): ReactElement => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pointerHeldNotesRef = useRef<Set<number>>(new Set());
  const [keyboardWidth, setKeyboardWidth] = useState(720);
  const displayNoteNames = noteNamesMode === "flat" ? MIDI_NOTE_NAMES_FLAT : MIDI_NOTE_NAMES_SHARP;
  const chordName = useMemo(
    () => detectChordName(activeNotes, displayNoteNames),
    [activeNotes, displayNoteNames],
  );
  const noteNamesModeLabel =
    noteNamesMode === "off" ? "" : noteNamesMode === "flat" ? "Flat" : "#";
  const releasePointerHeldNotes = useCallback(() => {
    if (pointerHeldNotesRef.current.size === 0) {
      return;
    }
    const notes = Array.from(pointerHeldNotesRef.current);
    pointerHeldNotesRef.current.clear();
    notes.forEach((note) => {
      onNoteOff(note);
    });
  }, [onNoteOff]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }
    const node = containerRef.current;
    const resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (typeof width === "number" && width > 0) {
        setKeyboardWidth(Math.floor(width));
      }
    });
    resizeObserver.observe(node);
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const handlePointerEnd = () => {
      releasePointerHeldNotes();
    };
    const handleVisibility = () => {
      if (document.hidden) {
        releasePointerHeldNotes();
      }
    };
    window.addEventListener("pointerup", handlePointerEnd);
    window.addEventListener("pointercancel", handlePointerEnd);
    window.addEventListener("blur", handlePointerEnd);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("pointerup", handlePointerEnd);
      window.removeEventListener("pointercancel", handlePointerEnd);
      window.removeEventListener("blur", handlePointerEnd);
      document.removeEventListener("visibilitychange", handleVisibility);
      releasePointerHeldNotes();
    };
  }, [releasePointerHeldNotes]);

  return (
    <section className="rounded-2xl border border-white/20 bg-black p-3 text-white shadow-[0_14px_26px_-22px_rgba(8,10,14,0.45)]">
      <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-white/75">
        <span>MIDI KEYBOARD ({keyboardName})</span>
        {isTeacher ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleVisual}
              className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] transition ${
                visualEnabled
                  ? "border-white bg-white text-black"
                  : "border-white/25 bg-white/5 text-white/70"
              }`}
            >
              Visual
            </button>
            <button
              type="button"
              onClick={onToggleKeyboard}
              className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] transition ${
                keyboardEnabled
                  ? "border-white bg-white text-black"
                  : "border-white/25 bg-white/5 text-white/70"
              }`}
            >
              Keyboard
            </button>
            <button
              type="button"
              onClick={onCycleTeacherAudioMode}
              className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] transition ${
                teacherAudioMode === "on"
                  ? "border-white bg-white text-black"
                  : teacherAudioMode === "mellow"
                  ? "border-white/60 bg-white/20 text-white"
                  : "border-white/25 bg-white/5 text-white/70"
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <span>Teacher</span>
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
                  <path
                    d="M3 9v6h4l5 4V5L7 9H3Zm13.5 3a3.5 3.5 0 0 0-1.75-3.03v6.06A3.5 3.5 0 0 0 16.5 12Zm0-7a1 1 0 0 1 .86.49 8.5 8.5 0 0 1 0 13.02 1 1 0 1 1-1.71-1.02 6.5 6.5 0 0 0 0-10.98A1 1 0 0 1 16.5 5Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
            </button>
            <button
              type="button"
              onClick={onToggleStudentAudio}
              className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] transition ${
                studentAudioEnabled
                  ? "border-white bg-white text-black"
                  : "border-white/25 bg-white/5 text-white/70"
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <span>Student</span>
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
                  <path
                    d="M3 9v6h4l5 4V5L7 9H3Zm13.5 3a3.5 3.5 0 0 0-1.75-3.03v6.06A3.5 3.5 0 0 0 16.5 12Zm0-7a1 1 0 0 1 .86.49 8.5 8.5 0 0 1 0 13.02 1 1 0 1 1-1.71-1.02 6.5 6.5 0 0 0 0-10.98A1 1 0 0 1 16.5 5Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
            </button>
            <button
              type="button"
              onClick={onCycleNoteNamesMode}
              className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] transition ${
                noteNamesMode === "off"
                  ? "border-white/25 bg-white/5 text-white/70"
                  : noteNamesMode === "flat"
                  ? "border-white/60 bg-white/20 text-white"
                  : "border-white bg-white text-black"
              }`}
            >
              Note Names{noteNamesModeLabel ? ` ${noteNamesModeLabel}` : ""}
            </button>
          </div>
        ) : null}
      </div>
      <div className="mb-0 rounded-[10px] rounded-b-none border border-[rgba(255,255,255,0.16)] border-b-0 bg-[#74797f] p-2.5 pb-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_10px_22px_rgba(0,0,0,0.18)]">
        <div className="mb-1 flex items-center justify-between gap-4 rounded-lg border border-white/20 bg-[linear-gradient(180deg,rgba(24,26,29,0.72),rgba(15,17,20,0.78))] px-3 py-2">
          <div className="text-[13px] font-extrabold uppercase tracking-[0.25em] text-white/95">
            SIMPLY MUSIC
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-white/90">
              <span className="inline-flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex min-w-8 items-center justify-center rounded-full border border-white/20 bg-[linear-gradient(180deg,rgba(24,26,29,0.72),rgba(15,17,20,0.78))] px-2 py-1 text-white/90"
                  onClick={() => onCycleSound(-1)}
                  aria-label="Previous sound"
                >
                  <span className="text-base leading-none">‹</span>
                </button>
                <span className="inline-flex min-w-[165px] items-center justify-center rounded-full border border-white/25 bg-[#101318] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-white/95">
                  {SOUND_LABELS[selectedSound]}
                </span>
                <button
                  type="button"
                  className="inline-flex min-w-8 items-center justify-center rounded-full border border-white/20 bg-[linear-gradient(180deg,rgba(24,26,29,0.72),rgba(15,17,20,0.78))] px-2 py-1 text-white/90"
                  onClick={() => onCycleSound(1)}
                  aria-label="Next sound"
                >
                  <span className="text-base leading-none">›</span>
                </button>
              </span>
            </label>
            <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-white/90">
              <span>Volume {volume}</span>
              <input
                className="w-40 accent-white"
                type="range"
                min={0}
                max={100}
                step={1}
                value={volume}
                onChange={(event) => onVolumeChange(Number(event.target.value))}
              />
            </label>
          </div>
        </div>
        <div className="min-h-5 text-right">
          {selectedSound === "sf2piano" && isSoundfontLoading ? (
            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/85">
              Loading SF2...
            </span>
          ) : null}
          {soundfontFailed ? (
            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/85">
              SF2 failed, using Acoustic
            </span>
          ) : null}
        </div>
      </div>
      <div
        ref={containerRef}
        className="lesson-room-midi-wrap lesson-room-midi-keyboard overflow-hidden rounded-b-[8px]"
      >
        <Piano
          noteRange={{ first: MIDI_MIN_NOTE, last: MIDI_MAX_NOTE }}
          width={keyboardWidth}
          renderNoteLabel={({ midiNumber }) => {
            if (noteNamesMode === "off") {
              return null;
            }
            const label = displayNoteNames[midiNumber % 12] ?? "";
            const match = label.match(/^([A-G])([#b])?$/);
            if (!match) {
              return <span className="lesson-room-note-label">{label}</span>;
            }
            return (
              <span className="lesson-room-note-label">
                <span className="lesson-room-note-label-main">{match[1]}</span>
                {match[2] ? (
                  <span className="lesson-room-note-label-accidental">
                    {match[2] === "b" ? "♭" : "#"}
                  </span>
                ) : null}
              </span>
            );
          }}
          playNote={(note) => {
            if (interactive) {
              pointerHeldNotesRef.current.add(note);
              onNoteOn(note, 0.85);
            }
          }}
          stopNote={(note) => {
            if (interactive) {
              pointerHeldNotesRef.current.delete(note);
              onNoteOff(note);
            }
          }}
          activeNotes={activeNotes}
        />
      </div>
      <div className="mt-2 h-[32px] rounded-md border border-white/12 bg-white/5 px-3 py-1.5 text-center text-[11px] font-semibold uppercase tracking-[0.1em] text-white/80">
        <span className="block whitespace-nowrap overflow-hidden text-ellipsis">
          {chordName || "\u00a0"}
        </span>
      </div>
      <style jsx global>{`
        .lesson-room-midi-wrap .ReactPiano__Keyboard {
          position: relative;
          display: flex;
          height: 160px;
        }
        .lesson-room-midi-wrap .ReactPiano__Key {
          display: flex;
        }
        .lesson-room-midi-wrap .ReactPiano__Key--natural {
          background: #f4f7f8;
          border: 0;
          border-right: 1px solid #c4cad1;
          border-bottom: 1px solid #b8c0c7;
          border-radius: 0 0 6px 6px;
          box-sizing: border-box;
          flex: 1 1 0;
          margin-right: 0;
          min-width: 10px;
          cursor: pointer;
        }
        .lesson-room-midi-wrap .ReactPiano__Key--natural:first-child {
          border-left: 1px solid #c4cad1;
        }
        .lesson-room-midi-wrap .ReactPiano__Key--natural:last-child {
          border-right: 1px solid #c4cad1;
        }
        .lesson-room-midi-wrap .ReactPiano__Key--accidental {
          position: absolute;
          top: 0;
          height: 66%;
          background: #1a2024;
          border: 1px solid #13191d;
          border-top: 0;
          border-radius: 0 0 4px 4px;
          z-index: 2;
          cursor: pointer;
          box-shadow: inset 0 -1px 0 rgba(255, 255, 255, 0.05);
        }
        .lesson-room-midi-wrap .ReactPiano__Key--active.ReactPiano__Key--natural {
          background: #7ee7df;
          border-right-color: #58c8bf;
          border-bottom-color: #4ebeb5;
        }
        .lesson-room-midi-wrap .ReactPiano__Key--active.ReactPiano__Key--accidental {
          background: #16c5b8;
          border-color: #119c91;
        }
        .lesson-room-midi-wrap .ReactPiano__NoteLabelContainer {
          display: flex;
          justify-content: center;
          align-items: flex-end;
          pointer-events: none;
          width: 100%;
          height: 100%;
          padding-bottom: 8px;
        }
        .lesson-room-note-label {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          line-height: 0.95;
          color: #8a9299;
          text-shadow: 0 1px 1px rgba(0, 0, 0, 0.08);
        }
        .lesson-room-midi-wrap .ReactPiano__Key--accidental .lesson-room-note-label {
          color: #c3c8cf;
          text-shadow: none;
          transform: translateY(-2px);
        }
        .lesson-room-note-label-main {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .lesson-room-note-label-accidental {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-top: 1px;
          transform: translateY(1px);
        }
        @media (max-width: 920px) {
          .lesson-room-midi-wrap .ReactPiano__Keyboard {
            height: 120px;
          }
        }
      `}</style>
    </section>
  );
};

const VideoPlaceholder = ({
  label,
  className = "",
  showSwapButton = false,
  onSwap,
  videoRef,
  mirrored = false,
  labelSize = "md",
  signalActive = false,
  livekitState = "disconnected",
  isRecording = false,
}: VideoPlaceholderProps): ReactElement => {
  const labelClasses =
    labelSize === "sm"
      ? "px-3 py-1.5 text-[11px] rounded-full"
      : "px-4 py-2 text-sm rounded-full";
  const [overlayTone, setOverlayTone] = useState<"light" | "dark">("light");
  const effectiveOverlayTone =
    !signalActive || livekitState !== "connected" ? "light" : overlayTone;
  const pillTone =
    effectiveOverlayTone === "dark"
      ? "bg-black/45 text-white/90"
      : "bg-white/20 text-white/90";
  const pillBorderTone =
    effectiveOverlayTone === "dark" ? "border-white/15" : "border-white/25";

  useEffect(() => {
    if (!videoRef?.current || !signalActive || livekitState !== "connected") {
      return;
    }
    const video = videoRef.current;
    const timeoutId = window.setTimeout(() => {
      try {
        const canvas = document.createElement("canvas");
        const width = 64;
        const height = 36;
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) return;
        context.drawImage(video, 0, 0, width, height);
        const { data } = context.getImageData(0, 0, width, height);
        let sum = 0;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i] / 255;
          const g = data[i + 1] / 255;
          const b = data[i + 2] / 255;
          sum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
        }
        const avg = sum / (data.length / 4);
        setOverlayTone(avg > 0.55 ? "dark" : "light");
      } catch {
        setOverlayTone("light");
      }
    }, 2200);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [videoRef, signalActive, livekitState]);
  return (
    <div
      className={[
        "relative flex h-full w-full flex-col justify-between overflow-hidden",
        "rounded-2xl border border-[var(--c-efece6)]",
        "text-white shadow-[0_25px_60px_-40px_rgba(10,10,12,0.7)]",
        className,
      ].join(" ")}
      style={videoBackdropStyle}
      aria-label={`${label} placeholder`}
    >
      {videoRef ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 h-full w-full object-cover"
          style={mirrored ? { transform: "scaleX(-1)" } : undefined}
        />
      ) : null}
      <div className="relative flex items-center justify-between px-4 py-3 text-xs uppercase tracking-[0.2em] text-white/80">
        <span className={`select-none rounded-full px-4 py-1.5 text-[11px] font-semibold backdrop-blur-sm ${pillTone}`}>
          Live View
        </span>
        {isRecording && signalActive && livekitState === "connected" ? (
          <span className={`select-none flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold backdrop-blur-sm ${pillTone}`}>
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Recording In Progress
          </span>
        ) : null}
      </div>
      <div className="relative flex flex-1" />
      <div className="relative flex items-center justify-between px-4 py-3 text-xs text-white/70">
        <div
          className={`select-none flex items-center gap-2 font-semibold uppercase tracking-wide backdrop-blur-sm ${labelClasses} ${pillTone}`}
          style={{
            clipPath: "inset(0 round 999px)",
          }}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              signalActive ? "bg-emerald-400" : "bg-red-500"
            }`}
          />
          {label}
        </div>
        <div className="flex items-center gap-3">
          <span className={`rounded-full border px-3 py-1 backdrop-blur-sm ${pillBorderTone} ${pillTone}`}>
            16:9
          </span>
          <span className={`rounded-full border px-3 py-1 backdrop-blur-sm ${pillBorderTone} ${pillTone}`}>
            HD
          </span>
          {showSwapButton ? (
            <button
              type="button"
              title="Swap to main view"
              onClick={onSwap}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-white/25 text-white/80 transition hover:border-white/40 hover:text-white"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
                <path
                  d="M7 7h10l-2.5-2.5M17 17H7l2.5 2.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const CameraFrame = ({
  label,
  className = "",
  showSwapButton = false,
  onSwap,
  videoRef,
  mirrored = false,
  labelSize,
  signalActive,
  livekitState,
  isRecording,
}: CameraFrameProps): ReactElement => {
  return (
    <div className={`w-full aspect-video ${className}`}>
      <VideoPlaceholder
        label={label}
        className="h-full w-full"
        showSwapButton={showSwapButton}
        onSwap={onSwap}
        videoRef={videoRef}
        mirrored={mirrored}
        labelSize={labelSize}
        signalActive={signalActive}
        livekitState={livekitState}
        isRecording={isRecording}
      />
    </div>
  );
};

const PanelButton = ({
  label,
  onClick,
}: {
  label: string;
  onClick?: () => void;
}): ReactElement => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
    >
      {label}
    </button>
  );
};

const PanelSection = ({
  title,
  className,
  titleClassName,
  contentClassName,
  style,
  children,
}: {
  title: string;
  className?: string;
  titleClassName?: string;
  contentClassName?: string;
  style?: CSSProperties;
  children: ReactElement | ReactElement[];
}): ReactElement => {
  return (
    <div
      className={`rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4 shadow-sm ${className ?? ""}`}
      style={style}
    >
      <p className={`text-[10px] uppercase tracking-[0.3em] text-[var(--c-7a776f)] ${titleClassName ?? ""}`}>
        {title}
      </p>
      <div className={`mt-3 space-y-3 ${contentClassName ?? ""}`}>{children}</div>
    </div>
  );
};

const PastRecordingsPanel = ({
  recordings,
  loading,
  error,
  onRefresh,
  onOpenRecording,
}: {
  recordings: LessonRecording[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onOpenRecording: (recording: LessonRecording) => void;
}): ReactElement => {
  const formatStartedAt = (value: string) => {
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };
  return (
    <PanelSection title="Past Recordings">
      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="w-full rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)] disabled:opacity-60"
      >
        {loading ? "Refreshing..." : "Refresh"}
      </button>
      {error ? (
        <div className="rounded-xl border border-[var(--c-f2d7db)] bg-[var(--c-fff5f6)] px-3 py-2 text-xs text-[var(--c-8f2f3b)]">
          {error}
        </div>
      ) : null}
      {recordings.length === 0 && !loading ? (
        <div className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-xs text-[var(--c-6f6c65)]">
          No recordings yet.
        </div>
      ) : null}
      <div className="space-y-2">
        {recordings.map((recording) => (
          <div
            key={recording.id}
            className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-3 text-xs text-[var(--c-3a3935)]"
          >
            <div className="font-semibold">{formatStartedAt(recording.startedAt)}</div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
              {STATUS_LABELS[recording.status] ?? recording.status}
            </div>
            {recording.error ? (
              <div className="mt-2 rounded-lg border border-[var(--c-f2d7db)] bg-[var(--c-fff5f6)] px-2 py-1 text-[11px] text-[var(--c-8f2f3b)]">
                {recording.error}
              </div>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onOpenRecording(recording)}
                disabled={!recording.id}
                className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)] disabled:opacity-60"
              >
                Watch
              </button>
            </div>
          </div>
        ))}
      </div>
    </PanelSection>
  );
};

const LessonRoomFileMenu = ({
  role,
  onRequestPermission,
  devices,
  cameraSelectionTarget,
  onChangeCameraSelectionTarget,
  onAssignCameraOption,
  isRecording,
  recordingBusy,
  stopBlockedByStarting,
  canForceStopFromStarting,
  onToggleRecording,
}: {
  role: UserRole;
  onRequestPermission: () => void;
  devices: MediaDeviceInfo[];
  cameraSelectionTarget: CameraSource;
  onChangeCameraSelectionTarget: (value: CameraSource) => void;
  onAssignCameraOption: (optionIndex: number) => void;
  isRecording: boolean;
  recordingBusy: boolean;
  stopBlockedByStarting: boolean;
  canForceStopFromStarting: boolean;
  onToggleRecording: () => void;
}): ReactElement | null => {
  const [openMenu, setOpenMenu] = useState<"camera" | "session" | "builder" | "tools" | null>(
    null,
  );
  const glassPanelClass =
    "absolute right-0 left-auto top-[calc(100%+10px)] z-30 w-max max-w-[min(92vw,40rem)] rounded-2xl border border-white/60 bg-white/55 p-4 shadow-[0_20px_44px_rgba(18,22,30,0.2)] backdrop-blur-xl";
  const menuActionButtonClass =
    "rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] whitespace-nowrap text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-3f4a59)]/40 hover:text-[var(--c-3f4a59)]";
  if (role === "student") {
    return null;
  }
  const normalizedLabel = (device: MediaDeviceInfo) =>
    (device.label || `Camera ${device.deviceId.slice(0, 4)}`)
      .replace(/\s*\([^)]*\)\s*/g, " ")
      .trim();

  return (
    <div className="relative">
      <div className="flex flex-wrap justify-end gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenMenu((current) => (current === "camera" ? null : "camera"))}
            className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] transition ${
              openMenu === "camera"
                ? "border-[var(--c-3f4a59)] bg-[var(--c-3f4a59)]/10 text-[var(--c-3f4a59)]"
                : "border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] text-[var(--c-6f6c65)] hover:border-[var(--c-3f4a59)]/40 hover:text-[var(--c-3f4a59)]"
            }`}
          >
            Camera Controls
          </button>
          {openMenu === "camera" ? (
            <div className={glassPanelClass}>
              <div className="grid grid-cols-2 gap-2 text-[10px] uppercase tracking-[0.2em]">
                <button
                  type="button"
                  onClick={() => onChangeCameraSelectionTarget("teacher1")}
                  className={`rounded-full border px-3 py-2 font-semibold transition ${
                    cameraSelectionTarget === "teacher1"
                      ? "border-[var(--c-3f4a59)] bg-[var(--c-3f4a59)] text-[var(--c-ffffff)]"
                      : "border-[var(--c-3f4a59)]/55 bg-[var(--c-ffffff)]/88 text-[var(--c-1f1f1d)] hover:border-[var(--c-3f4a59)] hover:text-[var(--c-1f1f1d)]"
                  }`}
                  title="Press Q"
                >
                  Teacher Cam 1
                </button>
                <button
                  type="button"
                  onClick={() => onChangeCameraSelectionTarget("teacher2")}
                  className={`rounded-full border px-3 py-2 font-semibold transition ${
                    cameraSelectionTarget === "teacher2"
                      ? "border-[var(--c-3f4a59)] bg-[var(--c-3f4a59)] text-[var(--c-ffffff)]"
                      : "border-[var(--c-3f4a59)]/55 bg-[var(--c-ffffff)]/88 text-[var(--c-1f1f1d)] hover:border-[var(--c-3f4a59)] hover:text-[var(--c-1f1f1d)]"
                  }`}
                  title="Press W"
                >
                  Teacher Cam 2
                </button>
                <button
                  type="button"
                  onClick={() => onChangeCameraSelectionTarget("student")}
                  className={`col-span-2 rounded-full border px-3 py-2 font-semibold transition ${
                    cameraSelectionTarget === "student"
                      ? "border-[var(--c-3f4a59)] bg-[var(--c-3f4a59)] text-[var(--c-ffffff)]"
                      : "border-[var(--c-3f4a59)]/55 bg-[var(--c-ffffff)]/88 text-[var(--c-1f1f1d)] hover:border-[var(--c-3f4a59)] hover:text-[var(--c-1f1f1d)]"
                  }`}
                  title="Press E"
                >
                  Student Camera
                </button>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => onAssignCameraOption(1)}
                  className="flex items-center justify-between rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-left text-xs font-semibold whitespace-nowrap text-[var(--c-3a3935)] transition hover:border-[var(--c-3f4a59)]/40 hover:text-[var(--c-3f4a59)]"
                >
                  <span>Remote Student Camera</span>
                  <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                    1
                  </span>
                </button>
                {devices.map((device, index) => (
                  <button
                    key={device.deviceId}
                    type="button"
                    onClick={() => onAssignCameraOption(index + 2)}
                    className="flex items-center justify-between rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-left text-xs font-semibold whitespace-nowrap text-[var(--c-3a3935)] transition hover:border-[var(--c-3f4a59)]/40 hover:text-[var(--c-3f4a59)]"
                  >
                    <span>{normalizedLabel(device)}</span>
                    <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                      {index + 2}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenMenu((current) => (current === "session" ? null : "session"))}
            className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] transition ${
              openMenu === "session"
                ? "border-[var(--c-3f4a59)] bg-[var(--c-3f4a59)]/10 text-[var(--c-3f4a59)]"
                : "border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] text-[var(--c-6f6c65)] hover:border-[var(--c-3f4a59)]/40 hover:text-[var(--c-3f4a59)]"
            }`}
          >
            Session Controls
          </button>
          {openMenu === "session" ? (
            <div className={glassPanelClass}>
              <div className="flex w-max flex-col gap-2">
                <button type="button" onClick={onToggleRecording} className={menuActionButtonClass}>
                  {stopBlockedByStarting
                    ? canForceStopFromStarting
                      ? "Stop Recording (Force)"
                      : "Recording Starting..."
                    : recordingBusy
                    ? "Recording..."
                    : isRecording
                    ? "Stop Recording"
                    : "Start Recording"}
                </button>
                <button type="button" className={menuActionButtonClass}>
                  Mark Highlight
                </button>
                <button type="button" className={menuActionButtonClass}>
                  Add Timestamp Note
                </button>
                <button type="button" className={menuActionButtonClass}>
                  Generate AI Summary
                </button>
                <button type="button" className={menuActionButtonClass}>
                  End Lesson
                </button>
              </div>
            </div>
          ) : null}
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenMenu((current) => (current === "tools" ? null : "tools"))}
            className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] transition ${
              openMenu === "tools"
                ? "border-[var(--c-3f4a59)] bg-[var(--c-3f4a59)]/10 text-[var(--c-3f4a59)]"
                : "border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] text-[var(--c-6f6c65)] hover:border-[var(--c-3f4a59)]/40 hover:text-[var(--c-3f4a59)]"
            }`}
          >
            Lesson Tools
          </button>
          {openMenu === "tools" ? (
            <div className={glassPanelClass}>
              <div className="flex w-max flex-col gap-2">
                <button type="button" className={menuActionButtonClass}>
                  Open Student Profile
                </button>
                <button type="button" className={menuActionButtonClass}>
                  Assign Practice
                </button>
                <button type="button" onClick={onRequestPermission} className={menuActionButtonClass}>
                  Request Student Permission
                </button>
              </div>
            </div>
          ) : null}
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenMenu((current) => (current === "builder" ? null : "builder"))}
            className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] transition ${
              openMenu === "builder"
                ? "border-[var(--c-3f4a59)] bg-[var(--c-3f4a59)]/10 text-[var(--c-3f4a59)]"
                : "border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] text-[var(--c-6f6c65)] hover:border-[var(--c-3f4a59)]/40 hover:text-[var(--c-3f4a59)]"
            }`}
          >
            Lesson Builder
          </button>
          {openMenu === "builder" ? (
            <div className={glassPanelClass}>
              <div className="flex w-max flex-col gap-2">
                <button type="button" className={menuActionButtonClass}>
                  Convert Recording to Lesson Pack
                </button>
                <button type="button" className={menuActionButtonClass}>
                  Attach PDF
                </button>
                <button type="button" className={menuActionButtonClass}>
                  Attach Soundslice
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const HarmonyLivePanel = ({
  voiceSessionState,
  voiceMuted,
  wakeWordEnabled,
  voiceSessionError,
  voiceNotice,
  harmonyDebugLines,
  harmonyDebugVisible,
  voiceAgentSpeaking,
  harmonyWaveBars,
  harmonyTranscript,
  harmonyPanelPosition,
  harmonyPanelDragging,
  onConnect,
  onToggleMute,
  onStop,
  onToggleWakeWord,
  onClearDebug,
  onToggleDebugVisible,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: {
  voiceSessionState: "idle" | "connecting" | "connected";
  voiceMuted: boolean;
  wakeWordEnabled: boolean;
  voiceSessionError: string | null;
  voiceNotice: string | null;
  harmonyDebugLines: string[];
  harmonyDebugVisible: boolean;
  voiceAgentSpeaking: boolean;
  harmonyWaveBars: number[];
  harmonyTranscript: Array<{ id: string; speaker: "Harmony" | "System"; text: string; at: string }>;
  harmonyPanelPosition: { x: number; y: number };
  harmonyPanelDragging: boolean;
  onConnect: () => void;
  onToggleMute: () => void;
  onStop: () => void;
  onToggleWakeWord: () => void;
  onClearDebug: () => void;
  onToggleDebugVisible: () => void;
  onPointerDown: PointerEventHandler<HTMLDivElement>;
  onPointerMove: PointerEventHandler<HTMLDivElement>;
  onPointerUp: PointerEventHandler<HTMLDivElement>;
  onPointerCancel: PointerEventHandler<HTMLDivElement>;
}): ReactElement => {
  return (
    <HarmonyLiveSurface
      className="fixed z-40 w-[min(420px,94vw)] overflow-hidden rounded-2xl border border-[color:var(--harmony-card-border)] bg-[color:var(--harmony-card-bg)] shadow-[0_16px_40px_-24px_rgba(12,16,24,0.75)] backdrop-blur-[4px]"
      style={{
        left: harmonyPanelPosition.x,
        top: harmonyPanelPosition.y,
      }}
      dragging={harmonyPanelDragging}
      headerClassName="cursor-grab touch-none border-[var(--harmony-panel-border)]"
      headerStyle={{ color: "var(--harmony-panel-header-text)" }}
      headerRight={
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onStop}
          className="rounded-full border border-teal-800 bg-teal-700 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition hover:border-teal-900 hover:bg-teal-800"
        >
          Done
        </button>
      }
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      bodyClassName="px-3 py-2"
    >
      <div
        className="rounded-2xl border border-[color:var(--harmony-card-border)] bg-[color:var(--harmony-card-bg)] px-3 py-2"
        style={{
          backgroundImage:
            "radial-gradient(140% 120% at 0% 0%, rgba(132, 231, 212, 0.24) 0%, rgba(132, 231, 212, 0) 42%), radial-gradient(120% 110% at 100% 100%, rgba(74, 188, 171, 0.2) 0%, rgba(74, 188, 171, 0) 46%), linear-gradient(145deg, rgba(229, 252, 247, 0.4) 0%, rgba(198, 240, 231, 0.2) 100%)",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[14px] font-semibold uppercase tracking-[0.22em] text-[var(--c-c8102e)]">
            {HARMONY_NAME}
          </p>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[9px] uppercase tracking-[0.16em] ${
              voiceSessionState === "idle"
                ? "bg-[var(--c-fff7e8)] text-[var(--c-7a4a17)]"
                : "bg-[var(--c-ffffff)] text-[var(--c-6f6c65)]"
            }`}
          >
            {voiceSessionState === "idle" ? "Ready" : "Connected"}
          </span>
        </div>
        {HARMONY_PANEL_INLINE_CONTROLS_VISIBLE ? (
          <div
            className={`mt-2 grid w-full gap-1.5 ${
              voiceSessionState !== "connected" ? "grid-cols-1" : "grid-cols-2"
            }`}
          >
            {voiceSessionState !== "connected" ? (
              <button
                type="button"
                onClick={onConnect}
                disabled={voiceSessionState !== "idle"}
                className="rounded-xl border border-teal-800 bg-teal-700 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Connect
              </button>
            ) : null}
            {voiceSessionState === "connected" ? (
              <button
                type="button"
                onClick={onToggleMute}
                className="rounded-xl border border-[var(--harmony-panel-block-border)] bg-[var(--harmony-panel-block-bg)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--harmony-panel-header-text)] transition hover:border-teal-700/60 hover:text-teal-800"
              >
                {voiceMuted ? "Unmute" : "Mute"}
              </button>
            ) : null}
            {voiceSessionState === "connected" ? (
              <button
                type="button"
                onClick={onStop}
                className="rounded-xl border border-[var(--harmony-panel-block-border)] bg-[var(--harmony-panel-block-bg)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--harmony-panel-header-text)] transition hover:border-teal-700/60 hover:text-teal-800"
              >
                End
              </button>
            ) : null}
            <button
              type="button"
              onClick={onToggleWakeWord}
              className={`rounded-xl border border-[var(--harmony-panel-block-border)] bg-[var(--harmony-panel-block-bg)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--harmony-panel-header-text)] transition hover:border-teal-700/60 hover:text-teal-800 ${
                voiceSessionState !== "connected" ? "" : "col-span-2"
              }`}
            >
              {wakeWordEnabled ? '"Hey Harmony"' : "Wake Off"}
            </button>
          </div>
        ) : null}
      </div>
      <div
        className="mt-2 rounded-xl border px-2.5 py-2"
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
            <linearGradient id="harmonyLessonWaveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--harmony-wave-stop-a)" />
              <stop offset="42%" stopColor="var(--harmony-wave-stop-b)" />
              <stop offset="100%" stopColor="var(--harmony-wave-stop-c)" />
            </linearGradient>
          </defs>
          {harmonyWaveBars.map((barHeight, index) => {
            const x = index * 8 + 1;
            const y = 22 - barHeight / 2;
            return (
              <rect
                key={`lesson-wave-${index}`}
                x={x}
                y={y}
                width={5}
                height={barHeight}
                rx={2.5}
                fill="url(#harmonyLessonWaveGradient)"
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
      {harmonyTranscript.length > 0 ? (
        <div
          className="mt-2 space-y-1.5 rounded-xl border px-2.5 py-2"
          style={{
            borderColor: "var(--harmony-panel-block-border)",
            backgroundColor: "var(--harmony-panel-block-bg)",
          }}
        >
          {harmonyTranscript.map((entry) => (
            <div
              key={entry.id}
              className="w-full rounded-xl border border-[var(--c-e5e3dd)] bg-[var(--c-fff5f6)] px-2.5 py-2 text-sm"
            >
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
      ) : null}
      {(voiceSessionError || voiceNotice) ? (
        <p className="mt-3 text-xs text-[var(--c-8f2f3b)]">
          {voiceSessionError ?? voiceNotice}
        </p>
      ) : null}
      {HARMONY_PANEL_INLINE_CONTROLS_VISIBLE ? (
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={onToggleDebugVisible}
            className="h-6 min-w-6 rounded-full border border-[var(--harmony-panel-block-border)] px-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--harmony-panel-header-text)] transition hover:border-teal-700/60 hover:text-teal-800"
            aria-label={harmonyDebugVisible ? "Hide Harmony debug" : "Show Harmony debug"}
            title={harmonyDebugVisible ? "Hide debug" : "Show debug"}
          >
            Dbg
          </button>
        </div>
      ) : null}
      {HARMONY_PANEL_INLINE_CONTROLS_VISIBLE && harmonyDebugVisible ? (
        <div
          className="mt-2 rounded-xl border px-2.5 py-2"
          style={{
            borderColor: "var(--harmony-panel-block-border)",
            backgroundColor: "var(--harmony-panel-block-bg)",
          }}
        >
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--harmony-panel-header-text)]">
              Harmony Debug
            </p>
            <button
              type="button"
              onClick={onClearDebug}
              className="rounded-full border border-[var(--harmony-panel-block-border)] px-2 py-0.5 text-[9px] uppercase tracking-[0.16em] text-[var(--harmony-panel-header-text)] transition hover:border-teal-700/60 hover:text-teal-800"
            >
              Clear
            </button>
          </div>
          <div className="max-h-36 space-y-1 overflow-auto font-mono text-[10px] leading-4 text-[var(--harmony-panel-text)]">
            {harmonyDebugLines.length > 0 ? (
              harmonyDebugLines.map((line, index) => (
                <p key={`${line}-${index}`}>{line}</p>
              ))
            ) : (
              <p>No debug events yet.</p>
            )}
          </div>
        </div>
      ) : null}
    </HarmonyLiveSurface>
  );
};

const RightSidebar = ({
  role,
  harmonyActive,
  harmonyVoiceState,
  onStartHarmonyMode,
  onStopHarmony,
  recordings,
  recordingsLoading,
  recordingsError,
  onRefreshRecordings,
  onOpenRecording,
  midiLessons,
  midiLessonsLoading,
  midiLessonsError,
  midiLessonStatus,
  playingMidiLessonName,
  onToggleMidiLesson,
  onRefreshMidiLessons,
}: {
  role: UserRole;
  harmonyActive: boolean;
  harmonyVoiceState: "idle" | "connecting" | "connected";
  onStartHarmonyMode: (mode: HarmonyMode) => void;
  onStopHarmony: () => void;
  recordings: LessonRecording[];
  recordingsLoading: boolean;
  recordingsError: string | null;
  onRefreshRecordings: () => void;
  onOpenRecording: (recording: LessonRecording) => void;
  midiLessons: MidiLessonFile[];
  midiLessonsLoading: boolean;
  midiLessonsError: string | null;
  midiLessonStatus: Record<string, MidiLessonStatus>;
  playingMidiLessonName: string | null;
  onToggleMidiLesson: (lesson: MidiLessonFile) => void;
  onRefreshMidiLessons: () => void;
}): ReactElement => {
  if (role === "student") {
    return (
      <div className="space-y-4">
        <PanelSection title="Session Status">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[var(--c-f7f7f5)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
              Live Lesson
            </span>
          </div>
          <div className="text-sm font-semibold text-[var(--c-1f1f1d)]">
            Teacher: Morgan Lee (Mock)
          </div>
          <div className="text-xs text-[var(--c-6f6c65)]">
            Topic: Chord Shapes (Mock)
          </div>
        </PanelSection>

        <PanelSection title="My Notes">
          <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
            My Lesson Notes
          </label>
          <textarea
            className="h-28 w-full resize-none rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-3 text-sm text-[var(--c-3a3935)]"
            placeholder="Write notes here..."
          />
          <PanelButton label="Save Notes" />
        </PanelSection>

        <PanelSection title="Quick Actions">
          <PanelButton label="Request Clarification" />
          <PanelButton label="Mark Favorite Moment" />
          <PanelButton label="Download Practice PDF" />
        </PanelSection>

        <PastRecordingsPanel
          recordings={recordings}
          loading={recordingsLoading}
          error={recordingsError}
          onRefresh={onRefreshRecordings}
          onOpenRecording={onOpenRecording}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PanelSection
        title={HARMONY_MENU_LABEL}
        className="border-[color:var(--harmony-card-border)] bg-[color:var(--harmony-card-bg)]"
        titleClassName="text-[12px] tracking-[0.28em] text-[var(--c-c8102e)]"
        style={{
          backgroundImage:
            "radial-gradient(140% 120% at 0% 0%, rgba(132, 231, 212, 0.24) 0%, rgba(132, 231, 212, 0) 42%), radial-gradient(120% 110% at 100% 100%, rgba(74, 188, 171, 0.2) 0%, rgba(74, 188, 171, 0) 46%), linear-gradient(145deg, rgba(229, 252, 247, 0.4) 0%, rgba(198, 240, 231, 0.2) 100%)",
        }}
      >
        <p className="text-xs text-[var(--c-6f6c65)]">
          {harmonyActive
            ? `${HARMONY_NAME} is active in the display area.`
            : `Start ${HARMONY_NAME} for live assistant support.`}
        </p>
        <div className="mt-2">
          <button
            type="button"
            onClick={
              harmonyVoiceState === "connected"
                ? onStopHarmony
                : () => onStartHarmonyMode("prep")
            }
            disabled={harmonyVoiceState === "connecting"}
            className="w-full rounded-full border border-[var(--harmony-panel-block-border)] bg-[var(--harmony-panel-block-bg)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--harmony-panel-header-text)] transition hover:border-teal-700/60 hover:text-teal-800"
          >
            {harmonyVoiceState === "connected"
              ? "Stop Harmony"
              : harmonyVoiceState === "connecting"
              ? "Connecting..."
              : "Start Harmony"}
          </button>
        </div>
      </PanelSection>

      <PanelSection title="MIDI Lessons">
        <button
          type="button"
          onClick={onRefreshMidiLessons}
          disabled={midiLessonsLoading}
          className="w-full rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)] disabled:opacity-60"
        >
          {midiLessonsLoading ? "Refreshing..." : "Refresh MIDI Lessons"}
        </button>
        {midiLessonsError ? (
          <div className="rounded-xl border border-[var(--c-f2d7db)] bg-[var(--c-fff5f6)] px-3 py-2 text-xs text-[var(--c-8f2f3b)]">
            {midiLessonsError}
          </div>
        ) : null}
        {midiLessons.length === 0 && !midiLessonsLoading ? (
          <div className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2 text-xs text-[var(--c-6f6c65)]">
            No MIDI lessons found in `public/midi-lessons`.
          </div>
        ) : null}
        <div className="space-y-2">
          {midiLessons.map((lesson) => {
            const isPlaying = playingMidiLessonName === lesson.name;
            const status = midiLessonStatus[lesson.name] ?? "idle";
            const label = status === "loading"
              ? "LOADING..."
              : isPlaying || status === "playing"
              ? "PLAYING..."
              : status === "loaded"
              ? "PLAY"
              : status === "ready"
              ? "READY TO PLAY"
              : "LOAD";
            return (
              <button
                key={lesson.name}
                type="button"
                onClick={() => onToggleMidiLesson(lesson)}
                disabled={status === "loading"}
                className={`w-full rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${
                  isPlaying
                    ? "border-[var(--c-c8102e)] bg-[var(--c-c8102e)]/10 text-[var(--c-c8102e)]"
                    : "border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] text-[var(--c-3a3935)] hover:border-[var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
                } ${status === "loading" ? "opacity-70" : ""}`}
              >
                <div className="truncate">{lesson.title}</div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.16em] opacity-80">
                  {label}
                </div>
              </button>
            );
          })}
        </div>
      </PanelSection>

      <PanelSection title="Session Notes">
        <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
          Session Notes
        </label>
        <textarea
          className="h-28 w-full resize-none rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-3 text-sm text-[var(--c-3a3935)]"
          placeholder="Add session notes..."
        />
        <PanelButton label="Save Notes" />
      </PanelSection>

      <PanelSection title="Student Status Snapshot">
        <div className="grid grid-cols-1 gap-2 text-xs text-[var(--c-6f6c65)]">
          <div className="rounded-lg border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2">
            Skill Level: Intermediate (Mock)
          </div>
          <div className="rounded-lg border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2">
            Last Lesson: Jan 28, 2026 (Mock)
          </div>
          <div className="rounded-lg border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2">
            Practice Score: 82% (Mock)
          </div>
        </div>
      </PanelSection>

      <PastRecordingsPanel
        recordings={recordings}
        loading={recordingsLoading}
        error={recordingsError}
        onRefresh={onRefreshRecordings}
        onOpenRecording={onOpenRecording}
      />
    </div>
  );
};

type ControlButton = {
  label: string;
};

const controlButtons: ControlButton[] = [
  { label: "Camera" },
  { label: "Mute" },
  { label: "Switch" },
  { label: "Record" },
  { label: "Share" },
  { label: "Settings" },
];

const controlIcons: Record<string, ReactElement> = {
  Camera: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M4 7.5a2 2 0 0 1 2-2h2.4l1.4-1.5h4.4l1.4 1.5H18a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle
        cx="12"
        cy="12"
        r="3.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  ),
  Mute: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M5 9v6h3l4 3V6L8 9H5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M16 9l3 6M19 9l-3 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  ),
  Switch: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M7 7h10l-2.5-2.5M17 17H7l2.5 2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  ),
  Record: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <circle cx="12" cy="12" r="4.5" fill="currentColor" />
    </svg>
  ),
  Share: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M12 5v10M8 8l4-4 4 4M6 15v3h12v-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  ),
  Settings: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M4.5 12h2m11 0h2M12 4.5v2m0 11v2m-5.2-13.2 1.4 1.4m9.6 9.6 1.4 1.4m0-12.4-1.4 1.4M7.2 17.2l-1.4 1.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  ),
};

export function LessonRoomPage({
  forcedRole,
}: {
  forcedRole?: UserRole;
} = {}): ReactElement {
  const cameraAreaRef = useRef<HTMLDivElement | null>(null);
  const [controlPosition, setControlPosition] = useState<DragPosition>({
    x: 0,
    y: 0,
  });
  const [controlsMinimized, setControlsMinimized] = useState(false);
  const [minimizedSide, setMinimizedSide] = useState<DockSide>("right");
  void controlPosition;
  void setControlsMinimized;
  void setMinimizedSide;
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const layoutWidth = viewportSize.width || 0;
  const isUltraWide = layoutWidth >= 3500;
  const isWide = layoutWidth >= 2000 && layoutWidth < 3500;
  const layoutKey = isUltraWide ? "ultra" : isWide ? "middle" : "compact";
  const layoutLabel =
    layoutKey === "compact"
      ? "Compact (Teacher Top)"
      : layoutKey === "middle"
      ? "Middle (Teachers Left)"
      : "Ultra (Three-Cam Wide)";
  const lessonNow = new Date();
  const lessonDateLabel = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(lessonNow);
  const lessonTimeLabel = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(lessonNow);
  const [activeRole, setActiveRole] = useState<UserRole>(forcedRole ?? "teacher");
  const [roleResolved, setRoleResolved] = useState(Boolean(forcedRole));
  const [currentStudentName, setCurrentStudentName] = useState("Student");
  const [cameraSelectionTarget, setCameraSelectionTarget] = useState<CameraSource>("teacher1");
  const [studentFeedSource, setStudentFeedSource] = useState<StudentFeedSource>("remote");
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionTermsAgreed, setPermissionTermsAgreed] = useState(false);
  const [teacherTrackOne, setTeacherTrackOne] = useState<LocalVideoTrack | null>(
    null,
  );
  const [teacherTrackTwo, setTeacherTrackTwo] = useState<LocalVideoTrack | null>(
    null,
  );
  const [studentTrack, setStudentTrack] = useState<LocalVideoTrack | null>(null);
  const [micTrack, setMicTrack] = useState<LocalAudioTrack | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [teacherCamOneId, setTeacherCamOneId] = useState<string>("");
  const [teacherCamTwoId, setTeacherCamTwoId] = useState<string>("");
  const [studentCamId, setStudentCamId] = useState<string>("");
  const [livekitError, setLivekitError] = useState<string | null>(null);
  const [livekitState, setLivekitState] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");
  const [participantCount, setParticipantCount] = useState(1);
  const [remoteTracksVersion, setRemoteTracksVersion] = useState(0);
  const [connectionDebug, setConnectionDebug] = useState({
    roomState: "unknown",
    connectionState: "unknown",
    remoteCount: 0,
    roomName: "unknown",
    localPublished: 0,
  });
  const [cameraPermission, setCameraPermission] = useState<
    "granted" | "denied" | "prompt" | "unknown"
  >("unknown");
  const roomRef = useRef<Room | null>(null);
  const teacherOneVideoRef = useRef<HTMLVideoElement | null>(null);
  const teacherTwoVideoRef = useRef<HTMLVideoElement | null>(null);
  const mainVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteTracksRef = useRef<RemoteVideoTrack[]>([]);
  const remoteTeacherTracksRef = useRef<Array<RemoteVideoTrack | null>>([
    null,
    null,
  ]);
  const remoteStudentTrackRef = useRef<RemoteVideoTrack | null>(null);
  const [layoutSources, setLayoutSources] = useState({
    compact: { main: "student" as CameraSource, small: ["teacher1", "teacher2"] as CameraSource[] },
    middle: { main: "student" as CameraSource, small: ["teacher1", "teacher2"] as CameraSource[] },
    ultra: { main: "student" as CameraSource, small: ["teacher1", "teacher2"] as CameraSource[] },
  });
  const [recordingEgressId, setRecordingEgressId] = useState<string | null>(null);
  const [recordingStartedAtMs, setRecordingStartedAtMs] = useState<number | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<string | null>(null);
  const [recordingStatusUpdatedAtMs, setRecordingStatusUpdatedAtMs] = useState<number | null>(null);
  const [recordingDebug, setRecordingDebug] = useState<RecordingDebugPayload | null>(null);
  const [debugPanelVisible, setDebugPanelVisible] = useState(false);
  const [cleanupBusy, setCleanupBusy] = useState(false);
  const [recordingBusy, setRecordingBusy] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [pastRecordings, setPastRecordings] = useState<LessonRecording[]>([]);
  const [recordingsLoading, setRecordingsLoading] = useState(false);
  const [recordingsError, setRecordingsError] = useState<string | null>(null);
  const [midiLessons, setMidiLessons] = useState<MidiLessonFile[]>([]);
  const [harmonyActive, setHarmonyActive] = useState(false);
  const [voiceSessionState, setVoiceSessionState] = useState<
    "idle" | "connecting" | "connected"
  >("idle");
  const [voiceSessionError, setVoiceSessionError] = useState<string | null>(null);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [harmonyDebugLines, setHarmonyDebugLines] = useState<string[]>([]);
  const [harmonyDebugVisible, setHarmonyDebugVisible] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false);
  const [voiceAgentSpeaking, setVoiceAgentSpeaking] = useState(false);
  const [voiceWaveStep, setVoiceWaveStep] = useState(0);
  const [voiceWaveEnergy, setVoiceWaveEnergy] = useState(0.08);
  const [harmonyTranscript, setHarmonyTranscript] = useState<HarmonyInteraction[]>([]);
  const [harmonyPanelPosition, setHarmonyPanelPosition] = useState({ x: 0, y: 0 });
  const [harmonyPanelReady, setHarmonyPanelReady] = useState(false);
  const [harmonyPanelDragging, setHarmonyPanelDragging] = useState(false);
  const [midiLessonsLoading, setMidiLessonsLoading] = useState(false);
  const [midiLessonsError, setMidiLessonsError] = useState<string | null>(null);
  const [midiLessonStatus, setMidiLessonStatus] = useState<Record<string, MidiLessonStatus>>({});
  const [playingMidiLessonName, setPlayingMidiLessonName] = useState<string | null>(null);
  const [playingMidiLessonTitle, setPlayingMidiLessonTitle] = useState<string | null>(null);
  const [recordingModalOpen, setRecordingModalOpen] = useState(false);
  const [modalRecording, setModalRecording] = useState<LessonRecording | null>(null);
  const [modalSignedUrl, setModalSignedUrl] = useState<string | null>(null);
  const [modalSignedUrlLoading, setModalSignedUrlLoading] = useState(false);
  const [modalSignedUrlError, setModalSignedUrlError] = useState<string | null>(null);
  const [recordingQuality, setRecordingQuality] = useState<RecordingQualityState>({
    level: "unknown",
    videoKbps: 0,
    audioKbps: 0,
    fps: null,
    packetLossPct: null,
    rttMs: null,
    sampleCount: 0,
  });
  const [midiEnabled, setMidiEnabled] = useState(true);
  const [midiKeyboardVisibleForStudents, setMidiKeyboardVisibleForStudents] = useState(true);
  const [midiNoteNamesModeForStudents, setMidiNoteNamesModeForStudents] = useState<NoteNamesMode>("off");
  const [midiTeacherAudioMode, setMidiTeacherAudioMode] = useState<TeacherAudioMode>("on");
  const [midiStudentAudioEnabled, setMidiStudentAudioEnabled] = useState(true);
  const [midiVolume, setMidiVolume] = useState(72);
  const [selectedSound, setSelectedSound] = useState<SoundPresetId>("sf2piano");
  const [isSoundfontLoading, setIsSoundfontLoading] = useState(false);
  const [soundfontFailed, setSoundfontFailed] = useState(false);
  const [soundfontLoaded, setSoundfontLoaded] = useState(false);
  const [midiInputName, setMidiInputName] = useState("MPK mini 3");
  const [teacherMidiActiveNotes, setTeacherMidiActiveNotes] = useState<number[]>([]);
  const [studentMidiActiveNotes, setStudentMidiActiveNotes] = useState<number[]>([]);
  const [studentMidiVisualEnabled, setStudentMidiVisualEnabled] = useState(true);
  const [studentKeyboardVisible, setStudentKeyboardVisible] = useState(true);
  const [studentMidiNoteNamesMode, setStudentMidiNoteNamesMode] = useState<NoteNamesMode>("off");
  const sustainPedalDownRef = useRef(false);
  const heldMidiNotesRef = useRef<Set<number>>(new Set());
  const sustainedMidiNotesRef = useRef<Set<number>>(new Set());
  const teacherMidiNotesRef = useRef<Set<number>>(new Set());
  const studentMidiNotesRef = useRef<Set<number>>(new Set());
  const selectedSoundRef = useRef<SoundPresetId>("sf2piano");
  const driveCurveCacheRef = useRef<Partial<Record<Exclude<SoundPresetId, "sf2piano">, Float32Array>>>({});
  const soundfontWorkletContextRef = useRef<AudioContext | null>(null);
  const soundfontSynthRef = useRef<SoundfontSynthLike | null>(null);
  const soundfontLoadPromiseRef = useRef<Promise<SoundfontSynthLike | null> | null>(null);
  const midiAudioContextRef = useRef<AudioContext | null>(null);
  const midiMasterGainRef = useRef<GainNode | null>(null);
  const midiTeacherGainRef = useRef<GainNode | null>(null);
  const midiStudentGainRef = useRef<GainNode | null>(null);
  const midiBroadcastDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const midiVoicesRef = useRef<Map<number, OscillatorVoice>>(
    new Map(),
  );
  const [midiBroadcastTrack, setMidiBroadcastTrack] = useState<LocalAudioTrack | null>(null);
  const midiPlaybackTimerIdsRef = useRef<number[]>([]);
  const midiPlaybackActiveNotesRef = useRef<Set<number>>(new Set());
  const midiLessonEventCacheRef = useRef<Map<string, ParsedMidiNoteEvent[]>>(new Map());
  const midiLessonUnloadTimersRef = useRef<Map<string, number>>(new Map());
  const midiPlaybackPendingLessonRef = useRef<string | null>(null);
  const playingMidiLessonNameRef = useRef<string | null>(null);
  const midiPlaybackSessionRef = useRef(0);
  const dragStateRef = useRef<DragState>({
    dragging: false,
    offsetX: 0,
    offsetY: 0,
  });
  const harmonySegmentTextRef = useRef<Map<string, string>>(new Map());
  const harmonyLastLivekitTextRef = useRef("");
  const harmonyLastReplyAtRef = useRef<number | null>(null);
  const harmonyDispatchJoinTimeoutRef = useRef<number | null>(null);
  const harmonyDispatchRequestedAtRef = useRef<number | null>(null);
  const harmonyDispatchPendingRef = useRef(false);
  const harmonyParticipantIdentityRef = useRef<string | null>(null);
  const harmonyAudioElementsRef = useRef<Set<HTMLAudioElement>>(new Set());
  const harmonyLastSpeakerCountRef = useRef<number>(0);
  const pendingHarmonyModeRef = useRef<HarmonyMode | null>(null);
  const harmonyDragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const isRecording = Boolean(recordingEgressId);
  const stopBlockedByStarting = isRecording && recordingStatus === "EGRESS_STARTING";
  const canForceStopFromStarting =
    stopBlockedByStarting &&
    recordingStatusUpdatedAtMs !== null &&
    Date.now() - recordingStatusUpdatedAtMs >= EGRESS_STARTING_MAX_WAIT_MS;
  const recordingQualityLabel =
    recordingQuality.level === "good"
      ? "High"
      : recordingQuality.level === "fair"
      ? "Medium"
      : recordingQuality.level === "poor"
      ? "Low"
      : "Unknown";
  const displayedMidiNotes =
    activeRole === "teacher"
      ? teacherMidiActiveNotes
      : studentMidiVisualEnabled
      ? studentMidiActiveNotes
      : [];
  const harmonyWaveBars = useMemo(() => {
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
  }, [voiceAgentSpeaking, voiceMuted, voiceSessionState, voiceWaveEnergy, voiceWaveStep]);

  const appendHarmonyInteraction = useCallback((speaker: "Harmony" | "System", text: string) => {
    const message = text.trim().replace(/\s+/g, " ");
    if (!message) return;
    setHarmonyTranscript((previous) => {
      const now = new Date();
      const nowMs = now.getTime();
      const nowTime = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }).format(now);
      const lastEntry = previous[previous.length - 1];
      if (
        speaker === "Harmony" &&
        lastEntry &&
        lastEntry.speaker === "Harmony" &&
        harmonyLastReplyAtRef.current !== null &&
        nowMs - harmonyLastReplyAtRef.current <= 14000 &&
        (message.startsWith(lastEntry.text) || lastEntry.text.startsWith(message))
      ) {
        harmonyLastReplyAtRef.current = nowMs;
        if (message.length <= lastEntry.text.length) return previous;
        return [
          ...previous.slice(0, -1),
          {
            ...lastEntry,
            text: message,
            at: nowTime,
          },
        ];
      }
      if (speaker === "Harmony") {
        harmonyLastReplyAtRef.current = nowMs;
      }
      return [
        ...previous,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          speaker,
          text: message,
          at: nowTime,
        },
      ].slice(-4);
    });
  }, []);

  const appendHarmonyDebug = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setHarmonyDebugLines((previous) => [`${timestamp} ${message}`, ...previous].slice(0, 40));
  }, []);

  const publishHarmonyModeIntent = useCallback((room: Room, mode: HarmonyMode) => {
    const instruction =
      mode === "prep"
        ? "Mode is prep. Focus on upcoming lesson preparation."
        : "Mode is recap. Focus on lesson recap and follow-up actions.";
    try {
      const encoder = new TextEncoder();
      const payload = encoder.encode(
        JSON.stringify({
          type: "sm-harmony-mode",
          mode,
          instruction,
          ts: Date.now(),
        }),
      );
      void room.localParticipant.publishData(payload, { reliable: true });
      window.setTimeout(() => {
        void room.localParticipant.publishData(payload, { reliable: true }).catch(() => undefined);
      }, 220);
      appendHarmonyDebug(`mode intent sent mode=${mode} reliable=true`);
      return true;
    } catch {
      appendHarmonyDebug(`mode intent failed mode=${mode}`);
      return false;
    }
  }, [appendHarmonyDebug]);

  const isHarmonyParticipant = useCallback((participant?: { identity?: string; name?: string } | null) => {
    if (!participant) return false;
    const identityRaw = participant.identity ?? "";
    if (harmonyParticipantIdentityRef.current && identityRaw === harmonyParticipantIdentityRef.current) {
      return true;
    }
    const identity = identityRaw.toLowerCase();
    const name = (participant.name ?? "").toLowerCase();
    return identity.includes("harmony") || name.includes("harmony");
  }, []);

  const isDispatchCandidateParticipant = useCallback(
    (participant?: { identity?: string; name?: string } | null) => {
      if (!participant) return false;
      if (!harmonyDispatchPendingRef.current) return false;
      const requestedAt = harmonyDispatchRequestedAtRef.current;
      if (!requestedAt || Date.now() - requestedAt > 25000) return false;
      const identity = (participant.identity ?? "").toLowerCase();
      return identity.startsWith("agent-");
    },
    [],
  );

  const attachHarmonyAudioPublications = useCallback((participant: {
    identity?: string;
    name?: string;
    audioTrackPublications: Map<string, { setSubscribed: (value: boolean) => void; track?: RemoteTrack | null }>;
  }) => {
    appendHarmonyDebug(
      `attach-audio participant=${participant.identity ?? "unknown"} pubs=${participant.audioTrackPublications.size}`,
    );
    participant.audioTrackPublications.forEach((publication) => {
      try {
        publication.setSubscribed(true);
      } catch {
        appendHarmonyDebug("setSubscribed(true) failed");
      }
      const track = publication.track;
      if (!track || track.kind !== Track.Kind.Audio) {
        appendHarmonyDebug("audio publication has no attached audio track yet");
        return;
      }
      const audioElement = track.attach() as HTMLAudioElement;
      audioElement.autoplay = true;
      audioElement.dataset.livekitVoiceAudio = "true";
      audioElement.style.display = "none";
      harmonyAudioElementsRef.current.add(audioElement);
      document.body.appendChild(audioElement);
      void audioElement.play().catch(() => undefined);
      appendHarmonyDebug(`attached remote audio track sid=${track.sid ?? "unknown"}`);
    });
  }, [appendHarmonyDebug]);

  const startHarmonySession = useCallback(async () => {
    if (voiceSessionState !== "idle") {
      appendHarmonyDebug(`start ignored: state=${voiceSessionState}`);
      return;
    }
    const room = roomRef.current;
    if (!room || room.state !== "connected") {
      setVoiceSessionError("Live lesson room is not connected yet.");
      appendHarmonyDebug(`start failed: room state=${room?.state ?? "missing"}`);
      return;
    }
    appendHarmonyDebug(
      `start requested mode=${pendingHarmonyModeRef.current ?? "none"} room=${room.name || DEFAULT_ROOM_NAME}`,
    );
    setVoiceSessionState("connecting");
    setVoiceSessionError(null);
    setVoiceNotice(null);
    setHarmonyTranscript([]);
    harmonySegmentTextRef.current.clear();
    harmonyLastLivekitTextRef.current = "";
    const requestedMode = pendingHarmonyModeRef.current;
    const remoteParticipants = Array.from(room.remoteParticipants.values());
    const remoteSummary = remoteParticipants
      .map((participant) => {
        const identity = participant.identity ?? "unknown";
        const name = participant.name ?? "unknown";
        return `${identity}(${name})`;
      })
      .join(", ");
    appendHarmonyDebug(`remote participants: ${remoteSummary || "none"}`);
    const harmonyParticipants = remoteParticipants.filter((participant) =>
      isHarmonyParticipant(participant),
    );
    appendHarmonyDebug(`known harmony participants=${harmonyParticipants.length}`);
    if (harmonyParticipants.length > 0) {
      appendHarmonyDebug("known harmony participant found; attaching audio");
      harmonyParticipants.forEach((participant) => {
        attachHarmonyAudioPublications(participant);
      });
      if (requestedMode) {
        appendHarmonyDebug(`sending queued mode on known participant mode=${requestedMode}`);
        publishHarmonyModeIntent(room, requestedMode);
      }
      setVoiceSessionState("connected");
      appendHarmonyDebug("voice session set connected (existing participant)");
      pendingHarmonyModeRef.current = null;
      return;
    }
    try {
      const dispatchBodyBase = {
        room: room.name || DEFAULT_ROOM_NAME,
        metadata: JSON.stringify({
          voice: "female",
          mode: "conversation",
          lesson_mode: requestedMode ?? "general",
        }),
      };
      const dispatchAttempts: Array<{ body: Record<string, unknown>; label: string }> = [
        {
          body: { ...dispatchBodyBase, agentName: "Harmony-Lesson-Rooms" },
          label: "Harmony-Lesson-Rooms",
        },
        {
          body: dispatchBodyBase,
          label: "default",
        },
      ];
      let dispatched = false;
      let dispatchError = "No agent dispatched.";
      for (const attempt of dispatchAttempts) {
        appendHarmonyDebug(`dispatch attempt=${attempt.label}`);
        const dispatchResponse = await fetch("/api/livekit/dispatch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(attempt.body),
        });
        const payload = (await dispatchResponse.json()) as { error?: string };
        if (dispatchResponse.ok) {
          appendHarmonyDebug(`dispatch success via ${attempt.label}`);
          dispatched = true;
          break;
        }
        appendHarmonyDebug(
          `dispatch failed via ${attempt.label}: status=${dispatchResponse.status} error=${payload.error ?? "unknown"}`,
        );
        dispatchError = payload.error ?? `Dispatch failed for ${attempt.label}.`;
        if (dispatchResponse.status < 500) {
          continue;
        }
        break;
      }
      if (!dispatched) {
        throw new Error(dispatchError);
      }
      harmonyDispatchPendingRef.current = true;
      harmonyDispatchRequestedAtRef.current = Date.now();
      appendHarmonyDebug("dispatch accepted; waiting for a new agent participant");
      room.remoteParticipants.forEach((participant) => {
        if (!isHarmonyParticipant(participant)) return;
        attachHarmonyAudioPublications(participant);
      });
      appendHarmonyDebug("waiting for harmony join/audio");
      if (harmonyDispatchJoinTimeoutRef.current !== null) {
        window.clearTimeout(harmonyDispatchJoinTimeoutRef.current);
      }
      harmonyDispatchJoinTimeoutRef.current = window.setTimeout(() => {
        setVoiceSessionState("idle");
        setVoiceNotice(null);
        setVoiceSessionError("Harmony did not join the room yet (dispatch sent).");
        harmonyDispatchPendingRef.current = false;
        harmonyDispatchRequestedAtRef.current = null;
        appendHarmonyDebug("timeout waiting for harmony join");
      }, 15000);
    } catch (error) {
      setVoiceSessionState("idle");
      setVoiceNotice(null);
      setVoiceSessionError(error instanceof Error ? error.message : "Dispatch request failed.");
      harmonyDispatchPendingRef.current = false;
      harmonyDispatchRequestedAtRef.current = null;
      appendHarmonyDebug(
        `start failed: ${error instanceof Error ? error.message : "Dispatch request failed."}`,
      );
    }
  }, [
    appendHarmonyDebug,
    attachHarmonyAudioPublications,
    isHarmonyParticipant,
    publishHarmonyModeIntent,
    voiceSessionState,
  ]);

  const sendHarmonyModeIntent = useCallback((mode: HarmonyMode) => {
    const room = roomRef.current;
    if (!room || room.state !== "connected") {
      appendHarmonyDebug(`mode intent skipped mode=${mode}; room not connected`);
      return false;
    }
    const published = publishHarmonyModeIntent(room, mode);
    if (!published) {
      setVoiceSessionError("Failed to send Harmony mode.");
      return false;
    }
    return true;
  }, [appendHarmonyDebug, publishHarmonyModeIntent]);

  const stopHarmonySession = useCallback(() => {
    appendHarmonyDebug("stop requested");
    setVoiceSessionState("idle");
    setVoiceMuted(false);
    setVoiceAgentSpeaking(false);
    setVoiceWaveEnergy(0.08);
    setVoiceNotice(null);
    harmonySegmentTextRef.current.clear();
    harmonyLastLivekitTextRef.current = "";
    harmonyLastReplyAtRef.current = null;
    if (harmonyDispatchJoinTimeoutRef.current !== null) {
      window.clearTimeout(harmonyDispatchJoinTimeoutRef.current);
      harmonyDispatchJoinTimeoutRef.current = null;
    }
    const room = roomRef.current;
    if (room) {
      room.remoteParticipants.forEach((participant) => {
        if (!isHarmonyParticipant(participant)) return;
        participant.audioTrackPublications.forEach((publication) => {
          try {
            publication.setSubscribed(false);
          } catch {
            // ignore subscription toggle failures
          }
          const track = publication.track;
          if (track && track.kind === Track.Kind.Audio) {
            track.detach().forEach((element) => {
              if (element instanceof HTMLAudioElement) {
                harmonyAudioElementsRef.current.delete(element);
              }
              element.remove();
            });
          }
        });
      });
    }
    harmonyAudioElementsRef.current.forEach((node) => {
      node.remove();
    });
    harmonyAudioElementsRef.current.clear();
    harmonyDispatchPendingRef.current = false;
    harmonyDispatchRequestedAtRef.current = null;
    harmonyParticipantIdentityRef.current = null;
    pendingHarmonyModeRef.current = null;
    harmonyLastSpeakerCountRef.current = 0;
  }, [appendHarmonyDebug, isHarmonyParticipant]);

  const startHarmonyWithMode = useCallback((mode: HarmonyMode) => {
    appendHarmonyDebug(`mode selected=${mode}`);
    setHarmonyActive(true);
    setVoiceSessionError(null);
    pendingHarmonyModeRef.current = mode;
    if (voiceSessionState === "connected") {
      appendHarmonyDebug("voice connected; sending mode immediately");
      const sent = sendHarmonyModeIntent(mode);
      if (sent) {
        pendingHarmonyModeRef.current = null;
      }
      return;
    }
    if (voiceSessionState === "connecting") {
      appendHarmonyDebug("voice connecting; mode queued");
      return;
    }
    if (voiceSessionState === "idle") {
      void startHarmonySession();
    }
  }, [appendHarmonyDebug, sendHarmonyModeIntent, startHarmonySession, voiceSessionState]);

  const toggleHarmonyMute = useCallback(async () => {
    const track = micTrack;
    if (voiceSessionState !== "connected" || !track) return;
    try {
      const nextMuted = !voiceMuted;
      if (nextMuted) {
        await track.mute();
      } else {
        await track.unmute();
      }
      setVoiceMuted(nextMuted);
      setVoiceNotice(nextMuted ? "Microphone muted." : "Microphone unmuted.");
      appendHarmonyDebug(`mic ${nextMuted ? "muted" : "unmuted"}`);
    } catch {
      setVoiceSessionError("Unable to update microphone state.");
      appendHarmonyDebug("mic mute toggle failed");
    }
  }, [appendHarmonyDebug, micTrack, voiceMuted, voiceSessionState]);

  const clampHarmonyPanel = useCallback((x: number, y: number) => {
    if (typeof window === "undefined") return { x, y };
    const panelWidth = Math.min(420, window.innerWidth * 0.94);
    const panelHeight = 430;
    const minX = 24;
    const minY = 56;
    const maxX = Math.max(minX, window.innerWidth - panelWidth - 8);
    const maxY = Math.max(minY, window.innerHeight - panelHeight - 8);
    return {
      x: Math.min(maxX, Math.max(minX, x)),
      y: Math.min(maxY, Math.max(minY, y)),
    };
  }, []);

  const handleHarmonyPanelPointerDown: PointerEventHandler<HTMLDivElement> = useCallback((event) => {
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    harmonyDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: harmonyPanelPosition.x,
      originY: harmonyPanelPosition.y,
    };
    setHarmonyPanelDragging(true);
  }, [harmonyPanelPosition.x, harmonyPanelPosition.y]);

  const handleHarmonyPanelPointerMove: PointerEventHandler<HTMLDivElement> = useCallback((event) => {
    const dragState = harmonyDragRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    const next = clampHarmonyPanel(dragState.originX + deltaX, dragState.originY + deltaY);
    setHarmonyPanelPosition(next);
  }, [clampHarmonyPanel]);

  const handleHarmonyPanelPointerUp: PointerEventHandler<HTMLDivElement> = useCallback((event) => {
    if (harmonyDragRef.current?.pointerId === event.pointerId) {
      harmonyDragRef.current = null;
      setHarmonyPanelDragging(false);
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  useEffect(() => {
    if (!harmonyActive) {
      setHarmonyPanelReady(false);
      return;
    }
    if (harmonyPanelReady) return;
    const panelWidth = Math.min(420, window.innerWidth * 0.94);
    const next = clampHarmonyPanel(window.innerWidth - panelWidth - 44, 72);
    setHarmonyPanelPosition(next);
    setHarmonyPanelReady(true);
  }, [clampHarmonyPanel, harmonyActive, harmonyPanelReady]);
  const cycleSound = useCallback((direction: 1 | -1) => {
    const currentIndex = SOUND_OPTIONS.indexOf(selectedSoundRef.current);
    const nextIndex = (currentIndex + direction + SOUND_OPTIONS.length) % SOUND_OPTIONS.length;
    const nextSound = SOUND_OPTIONS[nextIndex] ?? SOUND_OPTIONS[0];
    if (!nextSound) {
      return;
    }
    selectedSoundRef.current = nextSound;
    setSelectedSound(nextSound);
  }, []);

  const clampControlsPosition = useCallback((
    bounds: DOMRect,
    panelWidth: number,
    panelHeight: number,
    position: DragPosition,
    dockSide: DockSide,
  ) => {
    const clampedX = Math.min(Math.max(0, position.x), bounds.width - panelWidth);
    const clampedY = Math.min(Math.max(0, position.y), bounds.height - panelHeight);
    if (!controlsMinimized) {
      return { x: clampedX, y: clampedY };
    }
    const dockX = dockSide === "left" ? 0 : Math.max(0, bounds.width - panelWidth);
    return { x: dockX, y: clampedY };
  }, [controlsMinimized]);

  useEffect(() => {
    if (!harmonyActive) {
      stopHarmonySession();
    }
  }, [harmonyActive, stopHarmonySession]);

  useEffect(() => {
    if (voiceSessionState !== "connected" || voiceMuted || !voiceAgentSpeaking) {
      setVoiceWaveEnergy(0.08);
      return;
    }
    const interval = window.setInterval(() => {
      setVoiceWaveStep((step) => step + 1);
      setVoiceWaveEnergy((level) => Math.max(0.08, level * 0.9));
    }, 140);
    return () => {
      window.clearInterval(interval);
    };
  }, [voiceAgentSpeaking, voiceMuted, voiceSessionState]);

  useEffect(() => {
    if (!cameraAreaRef.current) {
      return;
    }
    const bounds = cameraAreaRef.current.getBoundingClientRect();
    setControlPosition({
      x: Math.max(0, bounds.width - CONTROL_PANEL_WIDTH - CONTROL_MARGIN),
      y: Math.max(
        0,
        bounds.height - CONTROL_PANEL_HEIGHT - CONTROL_MARGIN - CONTROL_PANEL_BOTTOM_OFFSET,
      ),
    });
  }, []);

  useEffect(() => {
    if (controlsMinimized || !cameraAreaRef.current) {
      return;
    }
    const bounds = cameraAreaRef.current.getBoundingClientRect();
    setControlPosition({
      x: Math.max(0, bounds.width - CONTROL_PANEL_WIDTH - CONTROL_MARGIN),
      y: Math.max(
        0,
        bounds.height - CONTROL_PANEL_HEIGHT - CONTROL_MARGIN - CONTROL_PANEL_BOTTOM_OFFSET,
      ),
    });
  }, [layoutKey, controlsMinimized]);

  useEffect(() => {
    const updatePermission = async () => {
      if (!("permissions" in navigator)) {
        setCameraPermission("unknown");
        return;
      }
      try {
        const status = await navigator.permissions.query({
          name: "camera" as PermissionName,
        });
        setCameraPermission(status.state ?? "unknown");
        status.onchange = () => {
          setCameraPermission(status.state ?? "unknown");
        };
      } catch {
        setCameraPermission("unknown");
      }
    };
    updatePermission();
  }, []);

  useEffect(() => {
    const loadDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((device) => device.kind === "videoinput");
        setVideoDevices(videoInputs);
        if (!teacherCamOneId && videoInputs[0]) {
          setTeacherCamOneId(videoInputs[0].deviceId);
        }
        if (!teacherCamTwoId && videoInputs[1]) {
          setTeacherCamTwoId(videoInputs[1].deviceId);
        }
        if (!studentCamId && videoInputs[0]) {
          setStudentCamId(videoInputs[0].deviceId);
        }
      } catch {
        setVideoDevices([]);
      }
    };
    loadDevices();
  }, [teacherCamOneId, teacherCamTwoId, studentCamId]);

  const stopTrack = (track: LocalVideoTrack | null) => {
    if (track) {
      track.stop();
    }
  };
  const stopAudioTrack = (track: LocalAudioTrack | null) => {
    if (track) {
      track.stop();
    }
  };

  const normalizeStateLabel = (value: unknown) => {
    if (value === undefined || value === null) {
      return "unknown";
    }
    const label = String(value);
    return label === "undefined" || label.trim() === "" ? "unknown" : label;
  };

  const getDeviceLabelById = (deviceId: string) => {
    const device = videoDevices.find((item) => item.deviceId === deviceId);
    if (!device) return "Unknown device";
    return (device.label || `Camera ${device.deviceId.slice(0, 4)}`)
      .replace(/\s*\([^)]*\)\s*/g, " ")
      .trim();
  };

  const ensureMidiAudioGraph = useCallback(async () => {
    if (typeof window === "undefined") {
      return null;
    }
    let context = midiAudioContextRef.current;
    if (!context) {
      const AudioContextCtor =
        window.AudioContext ||
        (
          window as typeof window & {
            webkitAudioContext?: typeof AudioContext;
          }
        ).webkitAudioContext;
      if (!AudioContextCtor) {
        return null;
      }
      context = new AudioContextCtor();
      const masterGain = context.createGain();
      masterGain.gain.value = Math.max(0, Math.min(1, midiVolume / 100));
      const teacherGain = context.createGain();
      teacherGain.gain.value = TEACHER_AUDIO_GAIN_BY_MODE[midiTeacherAudioMode];
      const studentGain = context.createGain();
      studentGain.gain.value = midiStudentAudioEnabled ? 1 : 0;
      const destination = context.createMediaStreamDestination();

      masterGain.connect(teacherGain);
      masterGain.connect(studentGain);
      teacherGain.connect(context.destination);
      studentGain.connect(destination);

      midiAudioContextRef.current = context;
      midiMasterGainRef.current = masterGain;
      midiTeacherGainRef.current = teacherGain;
      midiStudentGainRef.current = studentGain;
      midiBroadcastDestinationRef.current = destination;
    }

    if (context.state === "suspended") {
      try {
        await context.resume();
      } catch {
        return null;
      }
    }

    if (!midiBroadcastTrack && midiBroadcastDestinationRef.current) {
      const mediaTrack = midiBroadcastDestinationRef.current.stream.getAudioTracks()[0];
      if (mediaTrack) {
        setMidiBroadcastTrack(new LocalAudioTrack(mediaTrack));
      }
    }
    return context;
  }, [midiBroadcastTrack, midiStudentAudioEnabled, midiTeacherAudioMode, midiVolume]);

  const setMidiNoteList = (
    setRef: { current: Set<number> },
    setState: (value: number[]) => void,
    note: number,
    on: boolean,
  ) => {
    if (on) {
      setRef.current.add(note);
    } else {
      setRef.current.delete(note);
    }
    setState(Array.from(setRef.current).sort((a, b) => a - b));
  };

  const initSoundfontSynth = useCallback(async () => {
    if (soundfontSynthRef.current) {
      return soundfontSynthRef.current;
    }
    if (soundfontLoadPromiseRef.current) {
      return soundfontLoadPromiseRef.current;
    }
    const context = await ensureMidiAudioGraph();
    if (!context || !midiMasterGainRef.current) {
      return null;
    }
    if (context.state === "closed") {
      return null;
    }
    if (context.state !== "running") {
      try {
        await context.resume();
      } catch {
        return null;
      }
      if (context.state !== "running") {
        return null;
      }
    }

    setIsSoundfontLoading(true);
    soundfontLoadPromiseRef.current = (async () => {
      try {
        if (soundfontWorkletContextRef.current !== context) {
          await context.audioWorklet.addModule(SOUND_FONT_WORKLET_URL);
          soundfontWorkletContextRef.current = context;
        }
        const spessa = await import("spessasynth_lib");
        let synth: SoundfontSynthLike | null = null;
        const createSynth = () => new spessa.WorkletSynthesizer(context) as SoundfontSynthLike;
        try {
          synth = createSynth();
        } catch (error) {
          if (isSoundfontWorkletExecutionError(error)) {
            if (context.state !== "running") {
              try {
                await context.resume();
              } catch {
                return null;
              }
            }
            await context.audioWorklet.addModule(SOUND_FONT_WORKLET_URL);
            soundfontWorkletContextRef.current = context;
            try {
              synth = createSynth();
            } catch (retryError) {
              if (isSoundfontWorkletExecutionError(retryError)) {
                return null;
              }
              throw retryError;
            }
          } else {
            throw error;
          }
        }
        if (!synth) {
          return null;
        }
        synth.connect(midiMasterGainRef.current);
        const response = await fetch(SOUND_FONT_URL);
        if (!response.ok) {
          throw new Error(`Soundfont fetch failed: ${response.status}`);
        }
        const soundBank = await response.arrayBuffer();
        await synth.soundBankManager.addSoundBank(soundBank, "main");
        await synth.isReady;
        synth.programChange(0, 0);
        synth.controllerChange(0, 7, Math.max(0, Math.min(127, Math.round((midiVolume / 100) * 127))));
        soundfontSynthRef.current = synth;
        setSoundfontFailed(false);
        setSoundfontLoaded(true);
        return synth;
      } catch (error) {
        if (!isSoundfontWorkletExecutionError(error)) {
          setSoundfontFailed(true);
          setSoundfontLoaded(false);
          selectedSoundRef.current = "acoustic";
          setSelectedSound("acoustic");
        }
        return null;
      } finally {
        setIsSoundfontLoading(false);
        soundfontLoadPromiseRef.current = null;
      }
    })();

    return soundfontLoadPromiseRef.current;
  }, [ensureMidiAudioGraph, midiVolume]);

  const destroySoundfontSynth = useCallback(() => {
    if (soundfontSynthRef.current) {
      try {
        soundfontSynthRef.current.stopAll(true);
        soundfontSynthRef.current.destroy();
      } catch {
        // ignore
      }
    }
    soundfontSynthRef.current = null;
    soundfontLoadPromiseRef.current = null;
    soundfontWorkletContextRef.current = null;
    setIsSoundfontLoading(false);
    setSoundfontLoaded(false);
  }, []);

  const publishMidiData = useCallback((message: MidiNoteDataMessage) => {
    const room = roomRef.current;
    if (!room || room.state !== "connected" || activeRole !== "teacher") {
      return;
    }
    if (!midiEnabled) {
      return;
    }
    try {
      const encoder = new TextEncoder();
      void room.localParticipant.publishData(encoder.encode(JSON.stringify(message)));
    } catch {
      // ignore data channel publish failures
    }
  }, [activeRole, midiEnabled]);

  const publishMidiControl = useCallback(
    (
      visualEnabled: boolean,
      keyboardVisible: boolean,
      noteNamesMode: NoteNamesMode,
    ) => {
      const room = roomRef.current;
      if (!room || room.state !== "connected" || activeRole !== "teacher") {
        return;
      }
      try {
        const encoder = new TextEncoder();
        const payload: MidiControlDataMessage = {
          type: "sm-midi-control",
          visualEnabled,
          keyboardVisible,
          noteNamesMode,
          ts: Date.now(),
        };
        void room.localParticipant.publishData(encoder.encode(JSON.stringify(payload)));
      } catch {
        // ignore data channel publish failures
      }
    },
    [activeRole],
  );

  const handleTeacherNoteOn = useCallback(async (note: number, velocity = 0.85) => {
    if (activeRole !== "teacher") {
      return;
    }
    heldMidiNotesRef.current.add(note);
    sustainedMidiNotesRef.current.delete(note);
    const context = await ensureMidiAudioGraph();
    if (!context || !midiMasterGainRef.current) {
      return;
    }
    if (midiVoicesRef.current.has(note)) {
      return;
    }
    const sound = selectedSoundRef.current;
    if (sound === "sf2piano") {
      const synth = await initSoundfontSynth();
      if (synth) {
        const midiVelocity = Math.max(1, Math.min(127, Math.round(velocity * 127)));
        synth.noteOn(0, note, midiVelocity);
      }
      setMidiNoteList(teacherMidiNotesRef, setTeacherMidiActiveNotes, note, true);
      publishMidiData({
        type: "sm-midi-note",
        note,
        velocity,
        on: true,
        ts: Date.now(),
      });
      return;
    }

    const preset = SOUND_PRESET_CONFIG[sound];
    const gainNode = context.createGain();
    const oscillatorA = context.createOscillator();
    const oscillatorB = context.createOscillator();
    oscillatorA.type = preset.oscA;
    oscillatorA.frequency.setValueAtTime(midiFrequencyFromNote(note), context.currentTime);
    oscillatorB.type = preset.oscB;
    oscillatorB.frequency.setValueAtTime(
      midiFrequencyFromNote(note) * preset.ratioB,
      context.currentTime,
    );
    oscillatorB.detune.setValueAtTime(preset.detuneB, context.currentTime);
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = preset.cutoff;
    filter.Q.value = preset.resonance;
    const drive = context.createWaveShaper();
    const cachedDrive = driveCurveCacheRef.current[sound] ?? buildDriveCurve(preset.drive * 16);
    driveCurveCacheRef.current[sound] = cachedDrive;
    drive.curve = cachedDrive;
    drive.oversample = "4x";
    gainNode.gain.setValueAtTime(0.0001, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, velocity * 0.24 * preset.level),
      context.currentTime + 0.015,
    );
    oscillatorA.connect(filter);
    oscillatorB.connect(filter);
    filter.connect(drive);
    drive.connect(gainNode);
    gainNode.connect(midiMasterGainRef.current);
    oscillatorA.start();
    oscillatorB.start();
    midiVoicesRef.current.set(note, {
      oscillatorA,
      oscillatorB,
      gainNode,
      releaseSeconds: preset.release,
    });
    setMidiNoteList(teacherMidiNotesRef, setTeacherMidiActiveNotes, note, true);
    publishMidiData({
      type: "sm-midi-note",
      note,
      velocity,
      on: true,
      ts: Date.now(),
    });
  }, [activeRole, ensureMidiAudioGraph, initSoundfontSynth, publishMidiData]);

  const releaseTeacherNoteNow = useCallback(
    (note: number) => {
      const sound = selectedSoundRef.current;
      if (sound === "sf2piano") {
        if (soundfontSynthRef.current) {
          try {
            soundfontSynthRef.current.noteOff(0, note, false);
          } catch {
            // ignore
          }
        }
        setMidiNoteList(teacherMidiNotesRef, setTeacherMidiActiveNotes, note, false);
        publishMidiData({
          type: "sm-midi-note",
          note,
          velocity: 0,
          on: false,
          ts: Date.now(),
        });
        return;
      }
      const context = midiAudioContextRef.current;
      const voice = midiVoicesRef.current.get(note);
      if (voice && context) {
        const now = context.currentTime;
        try {
          voice.gainNode.gain.cancelScheduledValues(now);
          voice.gainNode.gain.setValueAtTime(Math.max(0.0001, voice.gainNode.gain.value), now);
          voice.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + voice.releaseSeconds);
          voice.oscillatorA.stop(now + voice.releaseSeconds + 0.01);
          voice.oscillatorB.stop(now + voice.releaseSeconds + 0.01);
        } catch {
          voice.oscillatorA.stop();
          voice.oscillatorB.stop();
        }
        midiVoicesRef.current.delete(note);
      }
      setMidiNoteList(teacherMidiNotesRef, setTeacherMidiActiveNotes, note, false);
      publishMidiData({
        type: "sm-midi-note",
        note,
        velocity: 0,
        on: false,
        ts: Date.now(),
      });
    },
    [publishMidiData],
  );

  const handleTeacherNoteOff = useCallback((note: number, allowSustain = false) => {
    heldMidiNotesRef.current.delete(note);
    if (allowSustain && sustainPedalDownRef.current) {
      sustainedMidiNotesRef.current.add(note);
      return;
    }
    sustainedMidiNotesRef.current.delete(note);
    releaseTeacherNoteNow(note);
  }, [releaseTeacherNoteNow]);

  const handleTeacherSustainChange = useCallback((pedalDown: boolean) => {
    if (sustainPedalDownRef.current === pedalDown) {
      return;
    }
    sustainPedalDownRef.current = pedalDown;
    const sound = selectedSoundRef.current;
    if (sound === "sf2piano") {
      if (soundfontSynthRef.current) {
        try {
          soundfontSynthRef.current.controllerChange(0, 64, pedalDown ? 127 : 0, true);
        } catch {
          // ignore
        }
      }
    }
    if (pedalDown) {
      return;
    }
    const pendingRelease = Array.from(sustainedMidiNotesRef.current);
    pendingRelease.forEach((note) => {
      if (heldMidiNotesRef.current.has(note)) {
        return;
      }
      sustainedMidiNotesRef.current.delete(note);
      releaseTeacherNoteNow(note);
    });
  }, [releaseTeacherNoteNow]);

  const toShortCameraName = (rawLabel: string) => {
    const cleaned = rawLabel.trim().replace(/\s+/g, " ");
    if (!cleaned || cleaned.toLowerCase() === "unknown device") {
      return "Unknown";
    }

    const parenMatch = cleaned.match(/\(([^)]+)\)/);
    if (parenMatch?.[1]) {
      const parenValue = parenMatch[1].trim();
      if (parenValue) {
        return parenValue.slice(0, 18);
      }
    }

    const modelTokenMatch = cleaned.match(/\b[A-Za-z]*\d+[A-Za-z0-9-]*\b/);
    if (modelTokenMatch?.[0]) {
      return modelTokenMatch[0].slice(0, 18);
    }

    const genericWords = new Set([
      "camera",
      "webcam",
      "usb",
      "video",
      "integrated",
      "builtin",
      "built-in",
      "hd",
      "microphone",
    ]);
    const meaningful = cleaned
      .split(" ")
      .map((part) => part.replace(/[^A-Za-z0-9-]/g, ""))
      .filter((part) => part.length > 0)
      .filter((part) => !genericWords.has(part.toLowerCase()));
    if (meaningful.length > 0) {
      return meaningful.slice(-2).join(" ").slice(0, 18);
    }

    return cleaned.slice(0, 18);
  };

  const loadPastRecordings = useCallback(async () => {
    setRecordingsLoading(true);
    setRecordingsError(null);
    try {
      const response = await fetch(
        `/api/livekit/recording?room=${encodeURIComponent(DEFAULT_ROOM_NAME)}&limit=8`,
      );
      const payload = (await response.json()) as {
        recordings?: LessonRecording[];
        error?: string;
      };
      if (!response.ok) {
        setRecordingsError(payload.error ?? "Failed to load recordings.");
        return;
      }
      setPastRecordings(Array.isArray(payload.recordings) ? payload.recordings : []);
    } catch (error) {
      setRecordingsError(
        error instanceof Error ? error.message : "Failed to load recordings.",
      );
    } finally {
      setRecordingsLoading(false);
    }
  }, []);

  const loadMidiLessons = useCallback(async () => {
    setMidiLessonsLoading(true);
    setMidiLessonsError(null);
    try {
      const response = await fetch("/api/midi-lessons");
      const payload = (await response.json()) as {
        files?: MidiLessonFile[];
        error?: string;
      };
      if (!response.ok) {
        setMidiLessonsError(payload.error ?? "Failed to load MIDI lessons.");
        return;
      }
      setMidiLessons(Array.isArray(payload.files) ? payload.files : []);
    } catch (error) {
      setMidiLessonsError(
        error instanceof Error ? error.message : "Failed to load MIDI lessons.",
      );
    } finally {
      setMidiLessonsLoading(false);
    }
  }, []);

  const setLessonStatus = useCallback((lessonName: string, status: MidiLessonStatus) => {
    setMidiLessonStatus((current) => ({ ...current, [lessonName]: status }));
  }, []);

  const clearMidiLessonUnloadTimer = useCallback((lessonName: string) => {
    const timerId = midiLessonUnloadTimersRef.current.get(lessonName);
    if (timerId !== undefined) {
      window.clearTimeout(timerId);
      midiLessonUnloadTimersRef.current.delete(lessonName);
    }
  }, []);

  const scheduleMidiLessonUnload = useCallback(
    (lessonName: string) => {
      clearMidiLessonUnloadTimer(lessonName);
      const timerId = window.setTimeout(() => {
        midiLessonEventCacheRef.current.delete(lessonName);
        setLessonStatus(lessonName, "idle");
        midiLessonUnloadTimersRef.current.delete(lessonName);
      }, 10000);
      midiLessonUnloadTimersRef.current.set(lessonName, timerId);
    },
    [clearMidiLessonUnloadTimer, setLessonStatus],
  );

  const getMidiLessonEvents = useCallback(async (lesson: MidiLessonFile) => {
    const cached = midiLessonEventCacheRef.current.get(lesson.name);
    if (cached) {
      return cached;
    }
    const response = await fetch(lesson.url);
    if (!response.ok) {
      throw new Error(`Failed to load file: ${lesson.name}`);
    }
    const buffer = await response.arrayBuffer();
    const events = parseMidiNoteEvents(buffer);
    midiLessonEventCacheRef.current.set(lesson.name, events);
    return events;
  }, []);

  const loadMidiLessonForPlay = useCallback(async (lesson: MidiLessonFile) => {
    clearMidiLessonUnloadTimer(lesson.name);
    const context = await ensureMidiAudioGraph();
    if (!context) {
      throw new Error("Audio engine is not ready yet. Click again to retry.");
    }
    if (selectedSoundRef.current === "sf2piano") {
      await initSoundfontSynth();
    }
    const cached = midiLessonEventCacheRef.current.get(lesson.name);
    if (cached) {
      setLessonStatus(lesson.name, "loaded");
      return cached;
    }
    setLessonStatus(lesson.name, "loading");
    try {
      const events = await getMidiLessonEvents(lesson);
      setLessonStatus(lesson.name, "loaded");
      return events;
    } catch (error) {
      setLessonStatus(lesson.name, "idle");
      throw error;
    }
  }, [
    clearMidiLessonUnloadTimer,
    ensureMidiAudioGraph,
    getMidiLessonEvents,
    initSoundfontSynth,
    setLessonStatus,
  ]);

  const stopMidiLessonPlayback = useCallback((lessonNameOverride?: string) => {
    const previousLesson =
      lessonNameOverride ??
      midiPlaybackPendingLessonRef.current ??
      playingMidiLessonNameRef.current;
    midiPlaybackSessionRef.current += 1;
    midiPlaybackPendingLessonRef.current = null;
    midiPlaybackTimerIdsRef.current.forEach((id) => {
      window.clearTimeout(id);
    });
    midiPlaybackTimerIdsRef.current = [];
    midiPlaybackActiveNotesRef.current.forEach((note) => {
      handleTeacherNoteOff(note, false);
    });
    midiPlaybackActiveNotesRef.current.clear();
    playingMidiLessonNameRef.current = null;
    setPlayingMidiLessonName(null);
    setPlayingMidiLessonTitle(null);
    if (previousLesson) {
      setLessonStatus(previousLesson, "ready");
      scheduleMidiLessonUnload(previousLesson);
    }
  }, [handleTeacherNoteOff, scheduleMidiLessonUnload, setLessonStatus]);

  const startMidiLessonPlayback = useCallback(async (lesson: MidiLessonFile) => {
    stopMidiLessonPlayback();
    const sessionId = midiPlaybackSessionRef.current + 1;
    midiPlaybackSessionRef.current = sessionId;
    midiPlaybackPendingLessonRef.current = lesson.name;
    clearMidiLessonUnloadTimer(lesson.name);
    playingMidiLessonNameRef.current = lesson.name;
    setPlayingMidiLessonName(lesson.name);
    setPlayingMidiLessonTitle(lesson.title);
    setLessonStatus(lesson.name, "playing");
    try {
      const events = await loadMidiLessonForPlay(lesson);
      if (midiPlaybackSessionRef.current !== sessionId) {
        return;
      }
      if (events.length === 0) {
        midiPlaybackPendingLessonRef.current = null;
        playingMidiLessonNameRef.current = null;
        setPlayingMidiLessonName(null);
        setPlayingMidiLessonTitle(null);
        setLessonStatus(lesson.name, "ready");
        scheduleMidiLessonUnload(lesson.name);
        return;
      }
      const firstNoteOnAtMs = events.find((event) => event.type === "on")?.atMs ?? events[0]?.atMs ?? 0;
      events.forEach((event) => {
        const timerId = window.setTimeout(() => {
          if (midiPlaybackSessionRef.current !== sessionId) {
            return;
          }
          if (event.type === "on") {
            void handleTeacherNoteOn(event.note, Math.max(0.05, event.velocity / 127));
            midiPlaybackActiveNotesRef.current.add(event.note);
          } else {
            handleTeacherNoteOff(event.note, false);
            midiPlaybackActiveNotesRef.current.delete(event.note);
          }
        }, Math.max(0, Math.round(event.atMs - firstNoteOnAtMs)));
        midiPlaybackTimerIdsRef.current.push(timerId);
      });
      const lastAtMs = (events[events.length - 1]?.atMs ?? 0) - firstNoteOnAtMs;
      const finishTimer = window.setTimeout(() => {
        if (midiPlaybackSessionRef.current !== sessionId) {
          return;
        }
        midiPlaybackActiveNotesRef.current.forEach((note) => {
          handleTeacherNoteOff(note, false);
        });
        midiPlaybackActiveNotesRef.current.clear();
        midiPlaybackPendingLessonRef.current = null;
        playingMidiLessonNameRef.current = null;
        setPlayingMidiLessonName(null);
        setPlayingMidiLessonTitle(null);
        setLessonStatus(lesson.name, "ready");
        scheduleMidiLessonUnload(lesson.name);
      }, Math.round(lastAtMs + 250));
      midiPlaybackTimerIdsRef.current.push(finishTimer);
    } catch (error) {
      setMidiLessonsError(
        error instanceof Error ? error.message : "Failed to play MIDI lesson.",
      );
      stopMidiLessonPlayback(lesson.name);
      setLessonStatus(lesson.name, "idle");
    }
  }, [
    clearMidiLessonUnloadTimer,
    handleTeacherNoteOff,
    handleTeacherNoteOn,
    loadMidiLessonForPlay,
    scheduleMidiLessonUnload,
    setLessonStatus,
    stopMidiLessonPlayback,
  ]);

  const toggleMidiLessonPlayback = useCallback((lesson: MidiLessonFile) => {
    const status = midiLessonStatus[lesson.name] ?? "idle";
    const activeLesson =
      midiPlaybackPendingLessonRef.current ?? playingMidiLessonNameRef.current;
    if (activeLesson === lesson.name) {
      stopMidiLessonPlayback(lesson.name);
      return;
    }
    if (status === "loading") {
      return;
    }
    if (status === "idle") {
      void loadMidiLessonForPlay(lesson).catch((error) => {
        setMidiLessonsError(
          error instanceof Error ? error.message : "Failed to load MIDI lesson.",
        );
      });
      return;
    }
    void startMidiLessonPlayback(lesson);
  }, [
    loadMidiLessonForPlay,
    midiLessonStatus,
    startMidiLessonPlayback,
    stopMidiLessonPlayback,
  ]);

  const requestSignedUrl = useCallback(async (recordingId: string) => {
    if (!recordingId) {
      setModalSignedUrlError("Recording id is missing.");
      return;
    }
    setModalSignedUrl(null);
    setModalSignedUrlError(null);
    setModalSignedUrlLoading(true);
    try {
      const response = await fetch(
        `/api/recordings/${encodeURIComponent(recordingId)}/signed-url`,
      );
      const payload = (await response.json()) as {
        url?: string;
        error?: string;
      };
      if (!response.ok || !payload.url) {
        setModalSignedUrlError(payload.error ?? "Failed to load secure playback URL.");
        return;
      }
      setModalSignedUrl(payload.url);
    } catch (error) {
      setModalSignedUrlError(
        error instanceof Error ? error.message : "Failed to load secure playback URL.",
      );
    } finally {
      setModalSignedUrlLoading(false);
    }
  }, []);

  const handleOpenRecording = async (recording: LessonRecording) => {
    if (!recording.id) {
      return;
    }
    setModalRecording(recording);
    setRecordingModalOpen(true);
    await requestSignedUrl(recording.id);
  };

  const handleRecordToggle = async () => {
    if (recordingBusy) {
      return;
    }
    if (stopBlockedByStarting && !canForceStopFromStarting) {
      setRecordingError("Recording pipeline is still starting. Please wait.");
      return;
    }
    if (
      isRecording &&
      recordingStartedAtMs &&
      Date.now() - recordingStartedAtMs < RECORDING_STOP_GUARD_MS
    ) {
      const remaining = Math.ceil(
        (RECORDING_STOP_GUARD_MS - (Date.now() - recordingStartedAtMs)) / 1000,
      );
      setRecordingError(`Recording is starting. Try stopping again in ${remaining}s.`);
      return;
    }
    const nextAction = isRecording ? "stop" : "start";
    setRecordingBusy(true);
    setRecordingError(null);
    try {
      const response = await fetch("/api/livekit/recording", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: nextAction,
          room: DEFAULT_ROOM_NAME,
          egressId: recordingEgressId ?? undefined,
        }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        egressId?: string;
        status?: string;
        participantCount?: number;
        publishedTrackCount?: number;
        activePublishedTrackCount?: number;
        participants?: Array<{
          identity: string;
          name: string;
          publishedTracks: Array<{
            sid: string;
            name: string;
            type: "audio" | "video" | "data";
            muted: boolean;
          }>;
        }>;
        blockers?: Array<{
          egressId: string;
          roomName: string;
          status: string;
          startedAt: string | null;
        }>;
      };
      if (!response.ok || !payload.ok) {
        if (payload.blockers && payload.blockers.length > 0) {
          const blockerSummary = payload.blockers
            .map((item) => `${item.egressId}(${item.roomName}:${item.status})`)
            .join(", ");
          setRecordingError(`${payload.error ?? "Recording request failed."} Blockers: ${blockerSummary}`);
        } else {
          const participantSummary =
            payload.participantCount !== undefined
              ? ` participants=${payload.participantCount}, published=${payload.publishedTrackCount ?? 0}, activeAv=${payload.activePublishedTrackCount ?? 0}`
              : "";
          const identities =
            payload.participants && payload.participants.length > 0
              ? ` [${payload.participants.map((item) => item.identity || item.name || "unknown").join(", ")}]`
              : "";
          setRecordingError(
            `${payload.error ?? "Recording request failed."}${participantSummary}${identities}`,
          );
        }
        return;
      }
      if (nextAction === "start") {
        setRecordingEgressId(payload.egressId ?? null);
        setRecordingStartedAtMs(Date.now());
        setRecordingStatus(payload.status ?? "EGRESS_STARTING");
        setRecordingStatusUpdatedAtMs(Date.now());
        setRecordingDebug(null);
      } else {
        setRecordingEgressId(null);
        setRecordingStartedAtMs(null);
        setRecordingStatus(null);
        setRecordingStatusUpdatedAtMs(null);
        setRecordingDebug(null);
      }
      await loadPastRecordings();
    } catch (error) {
      setRecordingError(
        error instanceof Error ? error.message : "Recording request failed.",
      );
    } finally {
      setRecordingBusy(false);
    }
  };

  const handleCleanupEgress = async (scope: "room" | "all") => {
    if (cleanupBusy) {
      return;
    }
    setCleanupBusy(true);
    try {
      const response = await fetch("/api/livekit/recording", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cleanup",
          room: DEFAULT_ROOM_NAME,
          all: scope === "all",
        }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        stopped?: Array<{ egressId: string; roomName: string; status: string }>;
        failed?: Array<{ egressId: string; roomName: string; message: string }>;
        remaining?: Array<{ egressId: string; roomName: string; status: string }>;
      };
      if (!response.ok || !payload.ok) {
        setRecordingError(payload.error ?? "Failed to cleanup egress sessions.");
        return;
      }
      const stoppedCount = payload.stopped?.length ?? 0;
      const remainingCount = payload.remaining?.length ?? 0;
      const failedCount = payload.failed?.length ?? 0;
      setRecordingError(
        `Cleanup finished: stopped ${stoppedCount}, remaining ${remainingCount}${failedCount > 0 ? `, failed ${failedCount}` : ""}.`,
      );
      if (remainingCount === 0) {
        setRecordingEgressId(null);
        setRecordingStatus(null);
        setRecordingStatusUpdatedAtMs(null);
      }
    } catch (error) {
      setRecordingError(
        error instanceof Error ? error.message : "Failed to cleanup egress sessions.",
      );
    } finally {
      setCleanupBusy(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const clearPastRecordingsOnLoad = async () => {
      try {
        await fetch(`/api/livekit/recording?room=${encodeURIComponent(DEFAULT_ROOM_NAME)}`, {
          method: "DELETE",
        });
      } catch {
        // best effort cleanup
      } finally {
        if (!cancelled) {
          void loadPastRecordings();
        }
      }
    };
    void clearPastRecordingsOnLoad();
    return () => {
      cancelled = true;
    };
  }, [loadPastRecordings]);

  useEffect(() => {
    if (!recordingEgressId || !isRecording) {
      return;
    }
    let cancelled = false;
    const pollStatus = async () => {
      try {
        const response = await fetch(
          `/api/livekit/recording?room=${encodeURIComponent(DEFAULT_ROOM_NAME)}&egressId=${encodeURIComponent(recordingEgressId)}`,
        );
        const payload = (await response.json()) as {
          live?: RecordingLiveDebug | null;
          active?: RecordingDebugPayload["active"];
          diagnostics?: RecordingDebugPayload["diagnostics"];
          hints?: string[];
          error?: string;
        };
        if (!response.ok) {
          if (!cancelled && payload.error) {
            setRecordingError(payload.error);
          }
          return;
        }
        if (cancelled) return;
        if (payload.live?.status) {
          setRecordingStatus(payload.live.status);
          setRecordingStatusUpdatedAtMs(Date.now());
        }
        if (payload.live?.error) {
          setRecordingError(payload.live.error);
        }
        setRecordingDebug({
          live: payload.live ?? null,
          active: payload.active ?? null,
          diagnostics: payload.diagnostics ?? null,
          hints: Array.isArray(payload.hints) ? payload.hints : [],
        });
      } catch {
        // best effort poll
      }
    };

    void pollStatus();
    const interval = window.setInterval(() => {
      void pollStatus();
    }, 2000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [isRecording, recordingEgressId]);

  const isSignalActiveForSource = (source: CameraSource) => {
    if (activeRole === "teacher") {
      const isLocal = source === "teacher1" || source === "teacher2";
      if (isLocal) {
        return cameraPermission === "granted" && livekitState === "connected";
      }
      if (studentFeedSource === "studentCam") {
        return (
          cameraPermission === "granted" &&
          livekitState === "connected" &&
          Boolean(studentTrack)
        );
      }
      if (studentFeedSource === "teacher1" || studentFeedSource === "teacher2") {
        return cameraPermission === "granted" && livekitState === "connected";
      }
      return Boolean(remoteStudentTrackRef.current) && livekitState === "connected";
    }
    const isLocal = source === "student";
    if (isLocal) {
      return cameraPermission === "granted" && livekitState === "connected";
    }
    return (
      Boolean(
        source === "teacher1"
          ? remoteTeacherTracksRef.current[0]
          : remoteTeacherTracksRef.current[1],
      ) && livekitState === "connected"
    );
  };

  const isLocalSourceForRole = (source: CameraSource) => {
    if (activeRole === "teacher") {
      if (source === "student") {
        return (
          studentFeedSource === "teacher1" ||
          studentFeedSource === "teacher2" ||
          studentFeedSource === "studentCam"
        );
      }
      return source === "teacher1" || source === "teacher2";
    }
    if (activeRole === "student") {
      return source === "student";
    }
    return false;
  };

  useEffect(() => {
    if (activeRole !== "teacher") {
      setTeacherTrackOne((prev) => {
        stopTrack(prev);
        return null;
      });
      setTeacherTrackTwo((prev) => {
        stopTrack(prev);
        return null;
      });
      return;
    }
    let mounted = true;
    const initTeacherTracks = async () => {
      if (!teacherCamOneId || !teacherCamTwoId) return;
      try {
        const trackOne = await createLocalVideoTrack({
          deviceId: { exact: teacherCamOneId },
        });
        const trackTwo =
          teacherCamTwoId === teacherCamOneId
            ? trackOne
            : await createLocalVideoTrack({
                deviceId: { exact: teacherCamTwoId },
              });
        if (!mounted) {
          trackOne.stop();
          if (trackTwo !== trackOne) trackTwo.stop();
          return;
        }
        setTeacherTrackOne((prev) => {
          if (prev && prev !== trackOne) {
            prev.stop();
          }
          return trackOne;
        });
        setTeacherTrackTwo((prev) => {
          if (prev && prev !== trackTwo) {
            prev.stop();
          }
          return trackTwo;
        });
      } catch (error) {
        setLivekitError(
          error instanceof Error ? error.message : "Camera init failed.",
        );
      }
    };
    initTeacherTracks();
    return () => {
      mounted = false;
    };
  }, [activeRole, teacherCamOneId, teacherCamTwoId]);

  useEffect(() => {
    if (
      activeRole !== "student" &&
      !(activeRole === "teacher" && studentFeedSource === "studentCam")
    ) {
      setStudentTrack((prev) => {
        stopTrack(prev);
        return null;
      });
      return;
    }
    let mounted = true;
    const initStudentTrack = async () => {
      if (!studentCamId) return;
      try {
        const track = await createLocalVideoTrack({
          deviceId: { exact: studentCamId },
        });
        if (!mounted) {
          track.stop();
          return;
        }
        setStudentTrack((prev) => {
          if (prev && prev !== track) {
            prev.stop();
          }
          return track;
        });
      } catch (error) {
        setLivekitError(
          error instanceof Error ? error.message : "Camera init failed.",
        );
      }
    };
    initStudentTrack();
    return () => {
      mounted = false;
    };
  }, [activeRole, studentCamId, studentFeedSource]);

  useEffect(() => {
    if (activeRole !== "teacher" && activeRole !== "student") {
      setMicTrack((prev) => {
        stopAudioTrack(prev);
        return null;
      });
      return;
    }
    let mounted = true;
    const initMicTrack = async () => {
      try {
        const track = await createLocalAudioTrack();
        if (!mounted) {
          track.stop();
          return;
        }
        setMicTrack((prev) => {
          if (prev && prev !== track) {
            prev.stop();
          }
          return track;
        });
      } catch (error) {
        setLivekitError(
          error instanceof Error
            ? `Microphone init failed: ${error.message}`
            : "Microphone init failed.",
        );
      }
    };
    void initMicTrack();
    return () => {
      mounted = false;
    };
  }, [activeRole]);

  const getTrackForSource = useCallback((source: CameraSource) => {
    if (activeRole === "student") {
      if (source === "student") return studentTrack;
      const teacherIndex = source === "teacher1" ? 0 : 1;
      return remoteTeacherTracksRef.current[teacherIndex];
    }
    if (source === "student") {
      if (studentFeedSource === "studentCam") {
        return studentTrack;
      }
      if (studentFeedSource === "teacher1") {
        return teacherTrackOne;
      }
      if (studentFeedSource === "teacher2") {
        return teacherTrackTwo;
      }
      return remoteStudentTrackRef.current;
    }
    return source === "teacher1" ? teacherTrackOne : teacherTrackTwo;
  }, [activeRole, studentFeedSource, studentTrack, teacherTrackOne, teacherTrackTwo]);

  const getLabelForSource = (source: CameraSource, isMain: boolean) => {
    void isMain;

    const getDeviceNameForSource = (value: CameraSource) => {
      if (value === "teacher1") {
        return getDeviceLabelById(teacherCamOneId);
      }
      if (value === "teacher2") {
        return getDeviceLabelById(teacherCamTwoId);
      }
      if (activeRole === "teacher") {
        if (studentFeedSource === "teacher1") {
          return getDeviceLabelById(teacherCamOneId);
        }
        if (studentFeedSource === "teacher2") {
          return getDeviceLabelById(teacherCamTwoId);
        }
        if (studentFeedSource === "studentCam") {
          return getDeviceLabelById(studentCamId);
        }
        return "Remote";
      }
      return getDeviceLabelById(studentCamId);
    };

    const displayMeta = CAMERA_DISPLAY_META[source];
    const shortName = toShortCameraName(getDeviceNameForSource(source));
    return `${displayMeta.shortCode} (${shortName})`;
  };

  const handleSwap = (index: number) => {
    setLayoutSources((current) => {
      const next = { ...current };
      const active = { ...next[layoutKey], small: [...next[layoutKey].small] };
      const targetSource = active.small[index];
      active.small[index] = active.main;
      active.main = targetSource;
      next[layoutKey] = active;
      return next;
    });
  };

  const setDisplaySourceForLayout = useCallback((target: CameraSource, source: CameraSource) => {
    setLayoutSources((current) => {
      const next = { ...current };
      const active = { ...next[layoutKey], small: [...next[layoutKey].small] };
      if (target === "teacher1") {
        active.small[0] = source;
      } else if (target === "teacher2") {
        active.small[1] = source;
      } else {
        active.main = source;
      }
      next[layoutKey] = active;
      return next;
    });
  }, [layoutKey]);

  const getDisplaySourceForLayout = useCallback((target: CameraSource): CameraSource => {
    const active = layoutSources[layoutKey];
    if (target === "teacher1") return active.small[0];
    if (target === "teacher2") return active.small[1];
    return active.main;
  }, [layoutKey, layoutSources]);

  const handleAssignCameraOption = useCallback((optionIndex: number) => {
    if (optionIndex === 1) {
      setDisplaySourceForLayout(cameraSelectionTarget, "student");
      if (cameraSelectionTarget === "student") {
        setStudentFeedSource("remote");
      }
      return;
    }
    const device = videoDevices[optionIndex - 2];
    if (!device) {
      return;
    }
    if (cameraSelectionTarget === "student") {
      setStudentCamId(device.deviceId);
      setDisplaySourceForLayout("student", "student");
      setStudentFeedSource("studentCam");
      return;
    }
    const currentSource = getDisplaySourceForLayout(cameraSelectionTarget);
    const localSource: "teacher1" | "teacher2" =
      currentSource === "teacher1" || currentSource === "teacher2"
        ? currentSource
        : "teacher1";
    if (localSource === "teacher1") {
      setTeacherCamOneId(device.deviceId);
    } else {
      setTeacherCamTwoId(device.deviceId);
    }
    setDisplaySourceForLayout(cameraSelectionTarget, localSource);
    if (cameraSelectionTarget === "student") {
      setStudentFeedSource(localSource);
    }
  }, [
    cameraSelectionTarget,
    getDisplaySourceForLayout,
    setDisplaySourceForLayout,
    videoDevices,
  ]);

  const cycleTeacherAudioMode = useCallback(() => {
    setMidiTeacherAudioMode((current) =>
      current === "on" ? "mellow" : current === "mellow" ? "off" : "on",
    );
  }, []);

  const cycleMidiNoteNamesMode = useCallback(() => {
    setMidiNoteNamesModeForStudents((current) =>
      current === "off" ? "sharp" : current === "sharp" ? "flat" : "off",
    );
  }, []);

  useEffect(() => {
    if (midiTeacherGainRef.current) {
      midiTeacherGainRef.current.gain.value =
        TEACHER_AUDIO_GAIN_BY_MODE[midiTeacherAudioMode];
    }
  }, [midiTeacherAudioMode]);

  useEffect(() => {
    if (midiStudentGainRef.current) {
      midiStudentGainRef.current.gain.value = midiStudentAudioEnabled ? 1 : 0;
    }
  }, [midiStudentAudioEnabled]);

  useEffect(() => {
    selectedSoundRef.current = selectedSound;
  }, [selectedSound]);

  useEffect(() => {
    if (midiMasterGainRef.current) {
      midiMasterGainRef.current.gain.value = Math.max(0, Math.min(1, midiVolume / 100));
    }
    if (soundfontSynthRef.current) {
      try {
        soundfontSynthRef.current.controllerChange(
          0,
          7,
          Math.max(0, Math.min(127, Math.round((midiVolume / 100) * 127))),
          true,
        );
      } catch {
        // ignore
      }
    }
  }, [midiVolume]);

  useEffect(() => {
    if (selectedSound !== "sf2piano" && (soundfontLoaded || soundfontSynthRef.current)) {
      destroySoundfontSynth();
    }
  }, [destroySoundfontSynth, selectedSound, soundfontLoaded]);

  useEffect(() => {
    if (activeRole !== "teacher" || livekitState !== "connected") {
      return;
    }
    const publish = () => {
      publishMidiControl(
        midiEnabled,
        midiKeyboardVisibleForStudents,
        midiNoteNamesModeForStudents,
      );
    };
    publish();
    const intervalId = window.setInterval(publish, 3000);
    if (!midiEnabled) {
      Array.from(teacherMidiNotesRef.current).forEach((note) => {
        publishMidiData({
          type: "sm-midi-note",
          note,
          velocity: 0,
          on: false,
          ts: Date.now(),
        });
      });
    }
    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    activeRole,
    livekitState,
    midiEnabled,
    midiKeyboardVisibleForStudents,
    midiNoteNamesModeForStudents,
    publishMidiControl,
    publishMidiData,
  ]);

  useEffect(() => {
    if (activeRole !== "teacher") {
      teacherMidiNotesRef.current.clear();
      setTeacherMidiActiveNotes([]);
      heldMidiNotesRef.current.clear();
      sustainedMidiNotesRef.current.clear();
      sustainPedalDownRef.current = false;
      midiVoicesRef.current.forEach((voice) => {
        try {
          voice.oscillatorA.stop();
          voice.oscillatorB.stop();
        } catch {
          // ignore
        }
      });
      midiVoicesRef.current.clear();
      if (soundfontSynthRef.current) {
        try {
          soundfontSynthRef.current.stopAll(true);
        } catch {
          // ignore
        }
      }
      return;
    }
    void ensureMidiAudioGraph();
  }, [activeRole, ensureMidiAudioGraph]);

  useEffect(() => {
    if (activeRole !== "teacher") {
      if (activeRole === "teacher") {
        setMidiInputName("MIDI feed paused");
      } else {
        setMidiInputName("Teacher feed only");
      }
      return;
    }
    if (!("requestMIDIAccess" in navigator)) {
      setMidiInputName("Web MIDI unavailable");
      return;
    }

    let active = true;
    let midiAccess: MIDIAccess | null = null;
    const attachedInputs = new Set<MIDIInput>();

    const handleMessage = (event: MIDIMessageEvent) => {
      const data = event.data;
      if (!data || data.length < 3) {
        return;
      }
      const status = data[0] & 0xf0;
      const data1 = data[1];
      const data2 = data[2];
      if (status === 0xb0) {
        if (data1 === 64) {
          handleTeacherSustainChange(data2 >= 64);
        }
        return;
      }
      const note = data1;
      const velocity = data2;
      if (status === 0x90 && velocity > 0) {
        void handleTeacherNoteOn(note, velocity / 127);
        return;
      }
      if (status === 0x80 || (status === 0x90 && velocity === 0)) {
        handleTeacherNoteOff(note, true);
      }
    };

    const attachInputs = () => {
      if (!midiAccess || !active) {
        return;
      }
      attachedInputs.forEach((input) => {
        input.onmidimessage = null;
      });
      attachedInputs.clear();
      const inputs = Array.from(midiAccess.inputs.values());
      if (inputs.length === 0) {
        setMidiInputName("No MIDI device");
        return;
      }
      inputs.forEach((input) => {
        input.onmidimessage = handleMessage;
        attachedInputs.add(input);
      });
      setMidiInputName(inputs.map((input) => input.name || "MIDI input").join(", "));
    };

    void navigator
      .requestMIDIAccess()
      .then((access) => {
        if (!active) return;
        midiAccess = access;
        attachInputs();
        access.onstatechange = () => {
          attachInputs();
        };
      })
      .catch(() => {
        if (active) {
          setMidiInputName("MIDI permission blocked");
        }
      });

    return () => {
      active = false;
      if (midiAccess) {
        midiAccess.onstatechange = null;
      }
      attachedInputs.forEach((input) => {
        input.onmidimessage = null;
      });
      attachedInputs.clear();
    };
  }, [activeRole, handleTeacherNoteOff, handleTeacherNoteOn, handleTeacherSustainChange]);

  useEffect(() => {
    const midiVoices = midiVoicesRef.current;
    const heldNotes = heldMidiNotesRef.current;
    const sustainedNotes = sustainedMidiNotesRef.current;
    return () => {
      midiVoices.forEach((voice) => {
        try {
          voice.oscillatorA.stop();
          voice.oscillatorB.stop();
        } catch {
          // ignore
        }
      });
      midiVoices.clear();
      heldNotes.clear();
      sustainedNotes.clear();
      sustainPedalDownRef.current = false;
      destroySoundfontSynth();
      if (midiBroadcastTrack) {
        try {
          midiBroadcastTrack.stop();
        } catch {
          // ignore
        }
      }
      const context = midiAudioContextRef.current;
      if (context) {
        void context.close().catch(() => undefined);
      }
      midiAudioContextRef.current = null;
      midiMasterGainRef.current = null;
      midiTeacherGainRef.current = null;
      midiStudentGainRef.current = null;
      midiBroadcastDestinationRef.current = null;
    };
  }, [destroySoundfontSynth, midiBroadcastTrack]);

  useEffect(() => {
    const updateSize = () => {
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => {
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  useEffect(() => {
    if (activeRole !== "teacher") {
      return;
    }
    const isTypingTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) {
        return false;
      }
      const tag = target.tagName.toLowerCase();
      return (
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        target.isContentEditable
      );
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      const key = event.key.toLowerCase();
      if (key === "q") {
        setCameraSelectionTarget("teacher1");
        return;
      }
      if (key === "w") {
        setCameraSelectionTarget("teacher2");
        return;
      }
      if (key === "e") {
        setCameraSelectionTarget("student");
        return;
      }
      if (!/^[1-9]$/.test(key)) {
        return;
      }
      handleAssignCameraOption(Number(key));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeRole, handleAssignCameraOption]);

  useEffect(() => {
    if (forcedRole) {
      setActiveRole(forcedRole);
      setRoleResolved(true);
      return;
    }
    try {
      const storedUser = window.localStorage.getItem(AUTH_STORAGE_KEY);
      const storedViewRole = window.localStorage.getItem(VIEW_ROLE_STORAGE_KEY);
      if (storedViewRole === "teacher" || storedViewRole === "student" || storedViewRole === "company") {
        setActiveRole(storedViewRole);
        setRoleResolved(true);
        return;
      }
      if (storedUser) {
        const parsed = JSON.parse(storedUser) as { role?: UserRole };
        if (parsed.role === "teacher" || parsed.role === "student" || parsed.role === "company") {
          setActiveRole(parsed.role);
        }
      }
    } catch {
      setActiveRole(forcedRole ?? "teacher");
    } finally {
      setRoleResolved(true);
    }
  }, [forcedRole]);

  useEffect(() => {
    const readSelectedStudentName = () => {
      try {
        const raw = window.localStorage.getItem(VIEW_STUDENT_STORAGE_KEY);
        if (!raw) {
          setCurrentStudentName("Student");
          return;
        }
        const parsed = JSON.parse(raw) as { name?: string } | null;
        const selectedName = parsed?.name?.trim();
        setCurrentStudentName(selectedName && selectedName.length > 0 ? selectedName : "Student");
      } catch {
        setCurrentStudentName("Student");
      }
    };

    readSelectedStudentName();
    window.addEventListener("sm-view-student-updated", readSelectedStudentName);
    window.addEventListener("sm-selected-student-updated", readSelectedStudentName);
    window.addEventListener("storage", readSelectedStudentName);
    return () => {
      window.removeEventListener("sm-view-student-updated", readSelectedStudentName);
      window.removeEventListener("sm-selected-student-updated", readSelectedStudentName);
      window.removeEventListener("storage", readSelectedStudentName);
    };
  }, []);

  useEffect(() => {
    if (!roleResolved) {
      return;
    }
    if (!process.env.NEXT_PUBLIC_LIVEKIT_URL) {
      setLivekitError("Missing LiveKit URL.");
      return;
    }
    let mounted = true;
    let pendingRoom: Room | null = null;
    const harmonyAudioElements = harmonyAudioElementsRef.current;
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, ms);
      });
    const connectRoom = async () => {
      setLivekitError(null);
      setLivekitState("connecting");
      appendHarmonyDebug(`room connect starting role=${activeRole}`);
      try {
        let connectedRoom: Room | null = null;
        for (let attempt = 0; attempt <= LIVEKIT_CONNECT_RETRY_COUNT; attempt += 1) {
          const identity = `${activeRole}-${Math.random().toString(36).slice(2, 9)}`;
          const response = await fetch("/api/livekit/token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              room: DEFAULT_ROOM_NAME,
              identity,
              name: identity,
            }),
          });
          const data = (await response.json()) as { token?: string; error?: string };
          if (!mounted) {
            return;
          }
          if (!response.ok || !data.token) {
            const tokenError = data.error ?? "Failed to fetch LiveKit token.";
            appendHarmonyDebug(`token fetch failed attempt=${attempt + 1}: ${tokenError}`);
            if (attempt < LIVEKIT_CONNECT_RETRY_COUNT) {
              setLivekitError(`${tokenError} Retrying...`);
              await wait(600);
              continue;
            }
            throw new Error(tokenError);
          }
          const room = new Room();
          pendingRoom = room;
          try {
            await room.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL, data.token);
            appendHarmonyDebug(`room.connect success attempt=${attempt + 1}`);
            connectedRoom = room;
            pendingRoom = null;
            break;
          } catch (connectError) {
            room.disconnect();
            pendingRoom = null;
            const maybeError = connectError as {
              code?: number;
              reasonName?: string;
              reason?: number | string;
              message?: string;
            };
            const isTimeout =
              maybeError?.code === 5 ||
              maybeError?.reasonName === "Timeout" ||
              maybeError?.reason === 5;
            if (
              mounted &&
              isTimeout &&
              attempt < LIVEKIT_CONNECT_RETRY_COUNT
            ) {
              appendHarmonyDebug("room.connect timeout; retrying");
              setLivekitError("LiveKit timeout (code 5). Retrying connection...");
              await wait(600);
              continue;
            }
            appendHarmonyDebug(
              `room.connect failed: ${
                connectError instanceof Error ? connectError.message : String(connectError)
              }`,
            );
            throw connectError;
          }
        }
        if (!connectedRoom) {
          throw new Error("LiveKit connect failed after retry.");
        }
        if (!mounted) {
          connectedRoom.disconnect();
          return;
        }
        const room = connectedRoom;
        roomRef.current = room;
        const updateParticipants = () => {
          setParticipantCount(1 + room.remoteParticipants.size);
        };
        const attachExistingRemoteTracks = () => {
          room.remoteParticipants.forEach((participant) => {
            participant.videoTrackPublications.forEach((publication) => {
              const track = publication.track;
              if (!track || track.kind !== Track.Kind.Video) return;
              if (remoteTracksRef.current.includes(track)) return;
              remoteTracksRef.current = [...remoteTracksRef.current, track];
              if (activeRole === "student") {
                const firstEmpty = remoteTeacherTracksRef.current.findIndex(
                  (entry) => !entry,
                );
                if (firstEmpty >= 0) {
                  remoteTeacherTracksRef.current[firstEmpty] = track;
                }
              } else {
                remoteStudentTrackRef.current = track;
              }
            });
          });
          setRemoteTracksVersion((v) => v + 1);
        };
        const handleConnected = () => {
          setLivekitState("connected");
          appendHarmonyDebug(`room connected name=${room.name || "unknown"}`);
          updateParticipants();
          setConnectionDebug({
            roomState: normalizeStateLabel(room.state),
            connectionState: normalizeStateLabel(room.state),
            remoteCount: room.remoteParticipants.size,
            roomName: room.name || "unknown",
            localPublished:
              room.localParticipant.videoTrackPublications.size +
              room.localParticipant.audioTrackPublications.size,
          });
        };
        const handleDisconnected = (reason?: unknown) => {
          setLivekitState("disconnected");
          setVoiceSessionState("idle");
          setVoiceMuted(false);
          setVoiceAgentSpeaking(false);
          setVoiceWaveEnergy(0.08);
          updateParticipants();
          const reasonLabel =
            reason !== undefined && reason !== null ? String(reason) : "unknown";
          appendHarmonyDebug(`room disconnected reason=${reasonLabel}`);
          setConnectionDebug({
            roomState: normalizeStateLabel(room.state),
            connectionState: `disconnected (${reasonLabel})`,
            remoteCount: room.remoteParticipants.size,
            roomName: room.name || "unknown",
            localPublished:
              room.localParticipant.videoTrackPublications.size +
              room.localParticipant.audioTrackPublications.size,
          });
          harmonyAudioElements.forEach((node) => {
            node.remove();
          });
          harmonyAudioElements.clear();
          harmonyDispatchPendingRef.current = false;
          harmonyDispatchRequestedAtRef.current = null;
          harmonyParticipantIdentityRef.current = null;
        };
        const handleParticipantConnected = (participant: { identity?: string; name?: string }) => {
          updateParticipants();
          const harmonyKnown = isHarmonyParticipant(participant);
          const dispatchCandidate = isDispatchCandidateParticipant(participant);
          appendHarmonyDebug(
            `participant connected identity=${participant.identity ?? "unknown"} name=${participant.name ?? "unknown"} known=${harmonyKnown} dispatchCandidate=${dispatchCandidate}`,
          );
          if (!harmonyKnown && !dispatchCandidate) return;
          if (dispatchCandidate && participant.identity) {
            harmonyParticipantIdentityRef.current = participant.identity;
            appendHarmonyDebug(`locked harmony participant identity=${participant.identity}`);
          }
          harmonyDispatchPendingRef.current = false;
          harmonyDispatchRequestedAtRef.current = null;
          attachHarmonyAudioPublications(participant as typeof participant & {
            audioTrackPublications: Map<
              string,
              { setSubscribed: (value: boolean) => void; track?: RemoteTrack | null }
            >;
          });
          if (harmonyDispatchJoinTimeoutRef.current !== null) {
            window.clearTimeout(harmonyDispatchJoinTimeoutRef.current);
            harmonyDispatchJoinTimeoutRef.current = null;
          }
          setVoiceSessionError(null);
          setVoiceNotice(null);
          setVoiceSessionState("connected");
          appendHarmonyDebug("voice session set connected (participant connected)");
          if (pendingHarmonyModeRef.current) {
            sendHarmonyModeIntent(pendingHarmonyModeRef.current);
            pendingHarmonyModeRef.current = null;
          }
        };
        const handleParticipantDisconnected = (participant: { identity?: string; name?: string }) => {
          updateParticipants();
          appendHarmonyDebug(
            `participant disconnected identity=${participant.identity ?? "unknown"} name=${participant.name ?? "unknown"}`,
          );
          if (
            participant.identity &&
            harmonyParticipantIdentityRef.current &&
            participant.identity === harmonyParticipantIdentityRef.current
          ) {
            harmonyParticipantIdentityRef.current = null;
            appendHarmonyDebug("cleared locked harmony participant identity");
          }
          if (!isHarmonyParticipant(participant)) return;
          setVoiceSessionState("idle");
          setVoiceMuted(false);
          setVoiceAgentSpeaking(false);
        };
        const handleTrackSubscribed = (
          track: RemoteTrack,
          _publication?: unknown,
          participant?: { identity?: string; name?: string },
        ) => {
          appendHarmonyDebug(
            `track subscribed kind=${track.kind} sid=${track.sid ?? "unknown"} participant=${participant?.identity ?? participant?.name ?? "unknown"}`,
          );
          if (track.kind === Track.Kind.Audio) {
            const audioElement = track.attach() as HTMLAudioElement;
            audioElement.autoplay = true;
            audioElement.dataset.livekitVoiceAudio = "true";
            audioElement.style.display = "none";
            harmonyAudioElementsRef.current.add(audioElement);
            document.body.appendChild(audioElement);
            return;
          }
          if (track.kind !== Track.Kind.Video) return;
          const videoTrack = track as RemoteVideoTrack;
          if (remoteTracksRef.current.includes(videoTrack)) return;
          remoteTracksRef.current = [...remoteTracksRef.current, videoTrack];
          if (activeRole === "student") {
            const firstEmpty = remoteTeacherTracksRef.current.findIndex(
              (entry) => !entry,
            );
            if (firstEmpty >= 0) {
              remoteTeacherTracksRef.current[firstEmpty] = videoTrack;
            }
          } else {
            remoteStudentTrackRef.current = videoTrack;
          }
          setRemoteTracksVersion((v) => v + 1);
        };
        const handleTrackUnsubscribed = (
          track: RemoteTrack,
          _publication?: unknown,
          participant?: { identity?: string; name?: string },
        ) => {
          appendHarmonyDebug(
            `track unsubscribed kind=${track.kind} sid=${track.sid ?? "unknown"} participant=${participant?.identity ?? participant?.name ?? "unknown"}`,
          );
          if (track.kind === Track.Kind.Audio) {
            const detached = track.detach();
            detached.forEach((element) => {
              if (element instanceof HTMLAudioElement) {
                harmonyAudioElementsRef.current.delete(element);
              }
              element.remove();
            });
            return;
          }
          if (track.kind !== Track.Kind.Video) return;
          const videoTrack = track as RemoteVideoTrack;
          const index = remoteTracksRef.current.indexOf(videoTrack);
          if (index >= 0) {
            remoteTracksRef.current = remoteTracksRef.current.filter((t) => t !== videoTrack);
            if (remoteStudentTrackRef.current === videoTrack) {
              remoteStudentTrackRef.current = null;
            }
            const teacherIndex = remoteTeacherTracksRef.current.findIndex(
              (entry) => entry === videoTrack,
            );
            if (teacherIndex >= 0) {
              remoteTeacherTracksRef.current[teacherIndex] = null;
            }
            setRemoteTracksVersion((v) => v + 1);
          }
        };
        const handleActiveSpeakersChanged = (
          speakers: Array<{ identity?: string; name?: string; audioLevel?: number }>,
        ) => {
          const harmonySpeakers = speakers.filter((speaker) => isHarmonyParticipant(speaker));
          if (harmonySpeakers.length !== harmonyLastSpeakerCountRef.current) {
            appendHarmonyDebug(
              `harmony active speakers=${harmonySpeakers.length} ids=${harmonySpeakers.map((speaker) => speaker.identity ?? speaker.name ?? "unknown").join(",") || "none"}`,
            );
            harmonyLastSpeakerCountRef.current = harmonySpeakers.length;
          }
          const maxRemoteLevel = harmonySpeakers.reduce((maxLevel, speaker) => {
            const level = typeof speaker.audioLevel === "number" ? speaker.audioLevel : 0;
            return Math.max(maxLevel, level);
          }, 0);
          setVoiceAgentSpeaking(harmonySpeakers.length > 0);
          if (harmonySpeakers.length > 0) {
            setVoiceWaveEnergy((level) => Math.max(level, maxRemoteLevel + 0.18));
          }
        };
        const handleTranscriptionReceived = (
          segments: Array<{ id?: string; text?: string; final?: boolean }>,
          participant?: { identity?: string; name?: string },
        ) => {
          if (!isHarmonyParticipant(participant)) return;
          const changedSegments: string[] = [];
          const finalSegments: string[] = [];
          segments.forEach((segment) => {
            const segmentId = typeof segment.id === "string" ? segment.id : undefined;
            const segmentText = typeof segment.text === "string" ? segment.text.trim() : "";
            if (!segmentText) return;
            if (!segmentId) {
              changedSegments.push(segmentText);
              if (segment.final) finalSegments.push(segmentText);
              return;
            }
            const previousText = harmonySegmentTextRef.current.get(segmentId) ?? "";
            if (segmentText.length >= previousText.length) {
              harmonySegmentTextRef.current.set(segmentId, segmentText);
              if (segmentText !== previousText) {
                changedSegments.push(segmentText);
              }
            }
            if (segment.final) {
              finalSegments.push(segmentText);
            }
          });
          const candidateText = (
            finalSegments.length > 0
              ? finalSegments[finalSegments.length - 1]
              : changedSegments.sort((a, b) => b.length - a.length)[0]
          )?.trim() ?? "";
          if (!candidateText || candidateText === harmonyLastLivekitTextRef.current) {
            return;
          }
          harmonyLastLivekitTextRef.current = candidateText;
          appendHarmonyInteraction("Harmony", candidateText);
        };
        const handleDataReceived = (
          payload: Uint8Array,
          participant?: { identity?: string } | undefined,
        ) => {
          if (activeRole !== "student") {
            return;
          }
          if (!participant?.identity?.startsWith("teacher-")) {
            return;
          }
          try {
            const decoded = new TextDecoder().decode(payload);
            const message = JSON.parse(decoded) as
              | Partial<MidiNoteDataMessage>
              | Partial<MidiControlDataMessage>;
            if (message.type === "sm-midi-control") {
              if (typeof message.visualEnabled === "boolean") {
                setStudentMidiVisualEnabled(message.visualEnabled);
                if (!message.visualEnabled) {
                  studentMidiNotesRef.current.clear();
                  setStudentMidiActiveNotes([]);
                }
              }
              if (typeof message.keyboardVisible === "boolean") {
                setStudentKeyboardVisible(message.keyboardVisible);
              }
              if (
                message.noteNamesMode === "off" ||
                message.noteNamesMode === "sharp" ||
                message.noteNamesMode === "flat"
              ) {
                setStudentMidiNoteNamesMode(message.noteNamesMode);
              }
              return;
            }
            if (message.type !== "sm-midi-note" || typeof message.note !== "number") {
              return;
            }
            if (message.on) {
              studentMidiNotesRef.current.add(message.note);
            } else {
              studentMidiNotesRef.current.delete(message.note);
            }
            setStudentMidiActiveNotes(
              Array.from(studentMidiNotesRef.current).sort((a, b) => a - b),
            );
          } catch {
            // ignore malformed data messages
          }
        };

        room.on(RoomEvent.Connected, handleConnected);
        room.on(RoomEvent.Disconnected, handleDisconnected);
        room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
        room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
        room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
        room.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
        room.on(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakersChanged);
        room.on(RoomEvent.TranscriptionReceived, handleTranscriptionReceived);
        room.on(RoomEvent.DataReceived, handleDataReceived);

        setLivekitState(room.state === "connected" ? "connected" : "connecting");
        updateParticipants();
        setConnectionDebug({
          roomState: normalizeStateLabel(room.state),
          connectionState: normalizeStateLabel(room.state),
          remoteCount: room.remoteParticipants.size,
          roomName: room.name || "unknown",
          localPublished:
            room.localParticipant.videoTrackPublications.size +
            room.localParticipant.audioTrackPublications.size,
        });
        attachExistingRemoteTracks();
      } catch (error) {
        if (pendingRoom) {
          pendingRoom.disconnect();
          pendingRoom = null;
        }
        if (!mounted) {
          return;
        }
        const details = error as {
          code?: number;
          reasonName?: string;
          reason?: number | string;
          message?: string;
          status?: number | string;
        };
        const detailParts: string[] = [];
        if (typeof details.code === "number") detailParts.push(`code=${details.code}`);
        if (details.reasonName) detailParts.push(`reason=${details.reasonName}`);
        if (details.reason !== undefined && details.reason !== null) {
          detailParts.push(`reasonRaw=${String(details.reason)}`);
        }
        if (details.status !== undefined && details.status !== null) {
          detailParts.push(`status=${String(details.status)}`);
        }
        setLivekitError(
          error instanceof Error
            ? `${error.message}${detailParts.length > 0 ? ` (${detailParts.join(", ")})` : ""}`
            : "LiveKit connect failed.",
        );
        appendHarmonyDebug(
          `room connect failed: ${
            error instanceof Error ? error.message : "LiveKit connect failed."
          }`,
        );
        setLivekitState("disconnected");
        setConnectionDebug({
          roomState: "error",
          connectionState: "error",
          remoteCount: 0,
          roomName: "unknown",
          localPublished: 0,
        });
      }
    };
    connectRoom();
    return () => {
      mounted = false;
      if (pendingRoom && pendingRoom !== roomRef.current) {
        pendingRoom.disconnect();
        pendingRoom = null;
      }
      setLivekitState("disconnected");
      setParticipantCount(1);
      remoteTracksRef.current.forEach((track) => {
        track.detach();
      });
      remoteTracksRef.current = [];
      remoteTeacherTracksRef.current = [null, null];
      remoteStudentTrackRef.current = null;
      setRemoteTracksVersion((v) => v + 1);
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
      if (harmonyDispatchJoinTimeoutRef.current !== null) {
        window.clearTimeout(harmonyDispatchJoinTimeoutRef.current);
        harmonyDispatchJoinTimeoutRef.current = null;
      }
      harmonyAudioElements.forEach((node) => {
        node.remove();
      });
      harmonyAudioElements.clear();
      harmonyDispatchPendingRef.current = false;
      harmonyDispatchRequestedAtRef.current = null;
      harmonyParticipantIdentityRef.current = null;
      setConnectionDebug({
        roomState: "disconnected",
        connectionState: "disconnected",
        remoteCount: 0,
        roomName: "unknown",
        localPublished: 0,
      });
    };
  }, [
    activeRole,
    appendHarmonyDebug,
    appendHarmonyInteraction,
    attachHarmonyAudioPublications,
    isDispatchCandidateParticipant,
    isHarmonyParticipant,
    roleResolved,
    sendHarmonyModeIntent,
  ]);

  useEffect(() => {
    if (livekitState === "connected") {
      return;
    }
    studentMidiNotesRef.current.clear();
    setStudentMidiActiveNotes([]);
    setStudentMidiVisualEnabled(true);
    setStudentKeyboardVisible(true);
    setStudentMidiNoteNamesMode("off");
  }, [livekitState]);

  useEffect(() => {
    if (activeRole !== "teacher") {
      stopMidiLessonPlayback();
      return;
    }
    void loadMidiLessons();
  }, [activeRole, loadMidiLessons, stopMidiLessonPlayback]);

  useEffect(() => {
    if (activeRole !== "teacher" || midiLessons.length === 0) {
      return;
    }
    const names = new Set(midiLessons.map((lesson) => lesson.name));
    Array.from(midiLessonEventCacheRef.current.keys()).forEach((key) => {
      if (!names.has(key)) {
        midiLessonEventCacheRef.current.delete(key);
      }
    });
    Array.from(midiLessonUnloadTimersRef.current.keys()).forEach((key) => {
      if (!names.has(key)) {
        const timerId = midiLessonUnloadTimersRef.current.get(key);
        if (timerId !== undefined) {
          window.clearTimeout(timerId);
        }
        midiLessonUnloadTimersRef.current.delete(key);
      }
    });
    setMidiLessonStatus((current) => {
      const next: Record<string, MidiLessonStatus> = {};
      Object.entries(current).forEach(([key, value]) => {
        if (names.has(key)) {
          next[key] = value;
        }
      });
      return next;
    });
  }, [activeRole, midiLessons]);

  useEffect(() => {
    if (activeRole !== "teacher") {
      return;
    }
    let warmed = false;
    const warm = () => {
      if (warmed) {
        return;
      }
      warmed = true;
      window.removeEventListener("pointerdown", warm);
      window.removeEventListener("keydown", warm);
      void ensureMidiAudioGraph();
    };
    window.addEventListener("pointerdown", warm);
    window.addEventListener("keydown", warm);
    return () => {
      window.removeEventListener("pointerdown", warm);
      window.removeEventListener("keydown", warm);
    };
  }, [activeRole, ensureMidiAudioGraph]);

  useEffect(() => {
    const unloadTimers = midiLessonUnloadTimersRef.current;
    return () => {
      stopMidiLessonPlayback();
      unloadTimers.forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      unloadTimers.clear();
    };
  }, [stopMidiLessonPlayback]);

  useEffect(() => {
    const room = roomRef.current;
    if (!room || room.state !== "connected") {
      return;
    }
    let cancelled = false;
    const syncPublishedTracks = async () => {
      try {
        const desiredTracks =
          activeRole === "teacher"
            ? [
                teacherTrackOne,
                teacherTrackTwo,
                ...(studentFeedSource === "studentCam" ? [studentTrack] : []),
              ].filter((track): track is LocalVideoTrack => Boolean(track))
            : [studentTrack].filter(
                (track): track is LocalVideoTrack => Boolean(track),
              );
        const desiredAudioTracks = [
          micTrack,
          ...(
            activeRole === "teacher" && midiStudentAudioEnabled
              ? [midiBroadcastTrack]
              : []
          ),
        ].filter((track): track is LocalAudioTrack => Boolean(track));
        const publications = Array.from(room.localParticipant.videoTrackPublications.values());
        for (const publication of publications) {
          if (!publication.track) continue;
          if (!desiredTracks.includes(publication.track as LocalVideoTrack)) {
            await room.localParticipant.unpublishTrack(
              publication.track as LocalVideoTrack,
            );
          }
        }
        for (const track of desiredTracks) {
          const latestPublications = Array.from(
            room.localParticipant.videoTrackPublications.values(),
          );
          const alreadyPublished = latestPublications.some((pub) => pub.track === track);
          if (!alreadyPublished) {
            await room.localParticipant.publishTrack(track);
          }
        }
        const audioPublications = Array.from(
          room.localParticipant.audioTrackPublications.values(),
        );
        for (const publication of audioPublications) {
          if (!publication.track) continue;
          if (!desiredAudioTracks.includes(publication.track as LocalAudioTrack)) {
            await room.localParticipant.unpublishTrack(
              publication.track as LocalAudioTrack,
            );
          }
        }
        for (const track of desiredAudioTracks) {
          const latestAudioPublications = Array.from(
            room.localParticipant.audioTrackPublications.values(),
          );
          const alreadyPublished = latestAudioPublications.some((pub) => pub.track === track);
          if (!alreadyPublished) {
            await room.localParticipant.publishTrack(track);
          }
        }
        if (!cancelled) {
          setConnectionDebug((prev) => ({
            ...prev,
            localPublished:
              room.localParticipant.videoTrackPublications.size +
              room.localParticipant.audioTrackPublications.size,
          }));
        }
      } catch (error) {
        if (!cancelled) {
          setLivekitError(
            error instanceof Error
              ? `Publish failed: ${error.message}`
              : "Publish failed.",
          );
        }
      }
    };
    void syncPublishedTracks();
    return () => {
      cancelled = true;
    };
  }, [
    activeRole,
    teacherTrackOne,
    teacherTrackTwo,
    studentTrack,
    micTrack,
    midiBroadcastTrack,
    midiStudentAudioEnabled,
    studentFeedSource,
    livekitState,
  ]);

  useEffect(() => {
    if (!isRecording || livekitState !== "connected") {
      setRecordingQuality({
        level: "unknown",
        videoKbps: 0,
        audioKbps: 0,
        fps: null,
        packetLossPct: null,
        rttMs: null,
        sampleCount: 0,
      });
      return;
    }

    let cancelled = false;
    const sampleQuality = async () => {
      const videoTracks = [teacherTrackOne, teacherTrackTwo, studentTrack].filter(
        (track): track is LocalVideoTrack => Boolean(track),
      );
      const audioTracks = [micTrack, midiBroadcastTrack].filter(
        (track): track is LocalAudioTrack => Boolean(track),
      );
      const allTracks = [...videoTracks, ...audioTracks];
      if (allTracks.length === 0) {
        if (!cancelled) {
          setRecordingQuality((prev) => ({ ...prev, level: "unknown", sampleCount: 0 }));
        }
        return;
      }

      let videoBits = 0;
      let audioBits = 0;
      let fpsTotal = 0;
      let fpsSamples = 0;
      const packetLossValues: number[] = [];
      const rttValues: number[] = [];

      for (const track of videoTracks) {
        videoBits += Number(track.currentBitrate || 0);
      }
      for (const track of audioTracks) {
        audioBits += Number(track.currentBitrate || 0);
      }

      for (const track of allTracks) {
        try {
          const report = await track.getRTCStatsReport();
          if (!report) continue;
          report.forEach((stat) => {
            if (stat.type === "outbound-rtp" && "framesPerSecond" in stat) {
              const fps = typeof stat.framesPerSecond === "number" ? stat.framesPerSecond : 0;
              if (fps > 0) {
                fpsTotal += fps;
                fpsSamples += 1;
              }
            }
            if (stat.type === "remote-inbound-rtp") {
              if ("fractionLost" in stat && typeof stat.fractionLost === "number") {
                packetLossValues.push(Math.max(0, stat.fractionLost * 100));
              }
              if ("roundTripTime" in stat && typeof stat.roundTripTime === "number") {
                rttValues.push(Math.max(0, stat.roundTripTime * 1000));
              }
            }
            if (stat.type === "candidate-pair" && "currentRoundTripTime" in stat) {
              const rtt =
                typeof stat.currentRoundTripTime === "number"
                  ? stat.currentRoundTripTime * 1000
                  : null;
              if (rtt !== null && Number.isFinite(rtt) && rtt > 0) {
                rttValues.push(rtt);
              }
            }
          });
        } catch {
          // best effort stats sample
        }
      }

      const videoKbps = Math.round(videoBits / 1000);
      const audioKbps = Math.round(audioBits / 1000);
      const fps = fpsSamples > 0 ? Math.round((fpsTotal / fpsSamples) * 10) / 10 : null;
      const packetLossPct =
        packetLossValues.length > 0
          ? Math.round(
              (packetLossValues.reduce((sum, value) => sum + value, 0) /
                packetLossValues.length) *
                10,
            ) / 10
          : null;
      const rttMs =
        rttValues.length > 0
          ? Math.round(rttValues.reduce((sum, value) => sum + value, 0) / rttValues.length)
          : null;

      let level: RecordingQualityState["level"] = "good";
      if (
        videoKbps < 800 ||
        (packetLossPct !== null && packetLossPct > 5) ||
        (rttMs !== null && rttMs > 250)
      ) {
        level = "poor";
      } else if (
        videoKbps < 1600 ||
        (packetLossPct !== null && packetLossPct > 2) ||
        (rttMs !== null && rttMs > 150)
      ) {
        level = "fair";
      }
      if (videoKbps === 0 && audioKbps === 0) {
        level = "unknown";
      }

      if (!cancelled) {
        setRecordingQuality({
          level,
          videoKbps,
          audioKbps,
          fps,
          packetLossPct,
          rttMs,
          sampleCount: allTracks.length,
        });
      }
    };

    void sampleQuality();
    const intervalId = window.setInterval(() => {
      void sampleQuality();
    }, 2000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [
    isRecording,
    livekitState,
    teacherTrackOne,
    teacherTrackTwo,
    studentTrack,
    micTrack,
    midiBroadcastTrack,
  ]);

  useEffect(() => {
    if (!roomRef.current) {
      return;
    }
    const slotSources = layoutSources[layoutKey];
    const slots = [
      { ref: teacherOneVideoRef, source: slotSources.small[0], isMain: false },
      { ref: teacherTwoVideoRef, source: slotSources.small[1], isMain: false },
      { ref: mainVideoRef, source: slotSources.main, isMain: true },
    ];
    const allTracks = [
      teacherTrackOne,
      teacherTrackTwo,
      studentTrack,
      remoteStudentTrackRef.current,
      remoteTeacherTracksRef.current[0],
      remoteTeacherTracksRef.current[1],
    ].filter((track): track is LocalVideoTrack | RemoteVideoTrack => Boolean(track));

    slots.forEach(({ ref, source }) => {
      const element = ref.current;
      if (!element) return;
      allTracks.forEach((track) => track.detach(element));
      const track = getTrackForSource(source);
      if (track) {
        track.attach(element);
      }
    });
  }, [
    layoutKey,
    activeRole,
    remoteTracksVersion,
    teacherTrackOne,
    teacherTrackTwo,
    studentTrack,
    layoutSources,
    getTrackForSource,
  ]);

  useEffect(() => {
    if (!showPermissionModal) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showPermissionModal]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!dragStateRef.current.dragging || !cameraAreaRef.current) {
        return;
      }
      const bounds = cameraAreaRef.current.getBoundingClientRect();
      const panelWidth = controlsMinimized ? MINIMIZED_WIDTH : CONTROL_PANEL_WIDTH;
      const panelHeight = controlsMinimized ? MINIMIZED_HEIGHT : CONTROL_PANEL_HEIGHT;
      const nextX = event.clientX - bounds.left - dragStateRef.current.offsetX;
      const nextY = event.clientY - bounds.top - dragStateRef.current.offsetY;
      const { x: clampedX, y: clampedY } = clampControlsPosition(
        bounds,
        panelWidth,
        panelHeight,
        { x: nextX, y: nextY },
        minimizedSide,
      );
      setControlPosition({ x: clampedX, y: clampedY });
    };

    const handlePointerUp = () => {
      dragStateRef.current.dragging = false;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [clampControlsPosition, controlsMinimized, minimizedSide]);

  useEffect(() => {
    const handleResize = () => {
      if (!cameraAreaRef.current) {
        return;
      }
      const bounds = cameraAreaRef.current.getBoundingClientRect();
      const panelWidth = controlsMinimized ? MINIMIZED_WIDTH : CONTROL_PANEL_WIDTH;
      const panelHeight = controlsMinimized ? MINIMIZED_HEIGHT : CONTROL_PANEL_HEIGHT;
      setControlPosition(() => {
        if (controlsMinimized) {
          return clampControlsPosition(
            bounds,
            panelWidth,
            panelHeight,
            {
              x: 0,
              y: Math.max(0, (bounds.height - panelHeight) / 2),
            },
            minimizedSide,
          );
        }
        return {
          x: Math.max(0, bounds.width - CONTROL_PANEL_WIDTH - CONTROL_MARGIN),
          y: Math.max(
            0,
            bounds.height -
              CONTROL_PANEL_HEIGHT -
              CONTROL_MARGIN -
              CONTROL_PANEL_BOTTOM_OFFSET,
          ),
        };
      });
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [clampControlsPosition, controlsMinimized, minimizedSide]);

  return (
    <div className="min-h-screen bg-[color:var(--background)] px-6 py-8 text-[color:var(--foreground)]">
      <div className="mx-auto flex h-full w-full max-w-none flex-col gap-6">
        <header className="grid grid-cols-1 gap-2 select-none xl:grid-cols-2 xl:items-end">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold">
              Simply Music Lesson Room - Mr. Brian &amp; {currentStudentName}
            </h1>
            <p className="text-sm text-[var(--c-6f6c65)]">
              LESSON DATE {lessonDateLabel} - LESSON TIME: {lessonTimeLabel}
            </p>
          </div>
          <div className="min-w-0 xl:flex xl:justify-end">
            <LessonRoomFileMenu
              role={activeRole}
              onRequestPermission={() => setShowPermissionModal(true)}
              devices={videoDevices}
              cameraSelectionTarget={cameraSelectionTarget}
              onChangeCameraSelectionTarget={setCameraSelectionTarget}
              onAssignCameraOption={handleAssignCameraOption}
              isRecording={isRecording}
              recordingBusy={recordingBusy}
              stopBlockedByStarting={stopBlockedByStarting}
              canForceStopFromStarting={canForceStopFromStarting}
              onToggleRecording={() => void handleRecordToggle()}
            />
          </div>
        </header>

        <div className="fixed right-6 top-6 z-40 flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={() => setDebugPanelVisible((value) => !value)}
            aria-label="Toggle development settings"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] text-[var(--c-6f6c65)] shadow-sm transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path
                d="M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M4.5 12h2m11 0h2M12 4.5v2m0 11v2m-5.2-13.2 1.4 1.4m9.6 9.6 1.4 1.4m0-12.4-1.4 1.4M7.2 17.2l-1.4 1.4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </button>
          {debugPanelVisible ? (
            <section className="max-h-[min(72vh,760px)] w-[min(540px,calc(100vw-3rem))] overflow-y-auto rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4 shadow-xl">
              <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
                <span>DEVELOPMENT SETTINGS</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
                <span className="flex items-center gap-2">
                  Live Session
                  <span
                    className={`h-2 w-2 rounded-full ${
                      livekitState === "connected"
                        ? "bg-emerald-500"
                        : livekitState === "connecting"
                        ? "bg-amber-400"
                        : "bg-[var(--c-6f6c65)]"
                    }`}
                  />
                </span>
                <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-1 text-[10px] font-semibold tracking-[0.2em] text-[var(--c-6f6c65)]">
                  LiveKit: {livekitState}
                </span>
                <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-1 text-[10px] font-semibold tracking-[0.2em] text-[var(--c-6f6c65)]">
                  Participants: {participantCount}
                </span>
                <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-1 text-[10px] font-semibold tracking-[0.2em] text-[var(--c-6f6c65)]">
                  Room: {connectionDebug.roomName} · {connectionDebug.roomState} · {connectionDebug.connectionState} · {connectionDebug.remoteCount}
                </span>
                <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-1 text-[10px] font-semibold tracking-[0.2em] text-[var(--c-6f6c65)]">
                  Local Published: {connectionDebug.localPublished}
                </span>
                <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-1 text-[10px] font-semibold tracking-[0.2em] text-[var(--c-6f6c65)]">
                  Camera: {cameraPermission}
                </span>
                <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-1 text-[10px] font-semibold tracking-[0.2em] text-[var(--c-6f6c65)]">
                  Recording: {isRecording ? "on" : "off"}
                </span>
                {isRecording ? (
                  <span
                    className={`rounded-full border px-3 py-1 text-[10px] font-semibold tracking-[0.2em] ${QUALITY_COLORS[recordingQuality.level]}`}
                  >
                    Quality: {recordingQualityLabel} · V {recordingQuality.videoKbps} kbps · A{" "}
                    {recordingQuality.audioKbps} kbps
                    {recordingQuality.packetLossPct !== null
                      ? ` · Loss ${recordingQuality.packetLossPct}%`
                      : ""}
                    {recordingQuality.rttMs !== null ? ` · RTT ${recordingQuality.rttMs}ms` : ""}
                    {recordingQuality.fps !== null ? ` · FPS ${recordingQuality.fps}` : ""}
                  </span>
                ) : null}
                {recordingStatus ? (
                  <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-1 text-[10px] font-semibold tracking-[0.2em] text-[var(--c-6f6c65)]">
                    Egress: {STATUS_LABELS[recordingStatus] ?? recordingStatus}
                  </span>
                ) : null}
                {livekitError ? (
                  <span className="rounded-full border border-[var(--c-f2d7db)] bg-[var(--c-fff5f6)] px-3 py-1 text-[10px] font-semibold tracking-[0.2em] text-[var(--c-8f2f3b)]">
                    LiveKit: {livekitError}
                  </span>
                ) : null}
                {recordingError ? (
                  <span className="rounded-full border border-[var(--c-f2d7db)] bg-[var(--c-fff5f6)] px-3 py-1 text-[10px] font-semibold tracking-[0.2em] text-[var(--c-8f2f3b)]">
                    Recording: {recordingError}
                  </span>
                ) : null}
                {playingMidiLessonTitle ? (
                  <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-1 text-[10px] font-semibold tracking-[0.2em] text-[var(--c-6f6c65)]">
                    Now Playing: {playingMidiLessonTitle}
                  </span>
                ) : null}
                <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-1 text-[10px] font-semibold tracking-[0.2em] text-[var(--c-6f6c65)]">
                  {viewportSize.width} × {viewportSize.height}
                </span>
                <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-1 text-[10px] font-semibold tracking-[0.2em] text-[var(--c-6f6c65)]">
                  Layout: {layoutLabel}
                </span>
                <span className="rounded-full border border-[var(--c-ecebe7)] px-2 py-1 text-[10px] text-[var(--c-6f6c65)]">
                  Compact=Teacher Top · Middle=Teachers Left · Ultra=Three-Cam Wide
                </span>
                {recordingDebug?.live?.egressId ? (
                  <span className="rounded-full border border-[var(--c-ecebe7)] px-2 py-1 text-[10px] text-[var(--c-6f6c65)]">
                    {recordingDebug.live.egressId}
                  </span>
                ) : null}
              </div>
              {recordingDebug ? (
                <>
                  <div className="mt-3 grid gap-2 text-xs text-[var(--c-3a3935)] md:grid-cols-2">
                    <div className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-3">
                      <div>Status: {recordingDebug.live?.status ?? "n/a"}</div>
                      <div>
                        Starting for:
                        {" "}
                        {typeof recordingDebug.live?.startedSeconds === "number"
                          ? `${recordingDebug.live.startedSeconds}s`
                          : "n/a"}
                      </div>
                      <div>Request Type: {recordingDebug.live?.requestType ?? "n/a"}</div>
                      <div>Source Type: {recordingDebug.live?.sourceType ?? "n/a"}</div>
                      <div>Active Egress Total: {recordingDebug.active?.total ?? 0}</div>
                      <div>Active In Room: {recordingDebug.active?.room ?? 0}</div>
                    </div>
                    <div className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-3">
                      <div>
                        LiveKit env:
                        {" "}
                        {recordingDebug.diagnostics?.livekit.hasUrl &&
                        recordingDebug.diagnostics?.livekit.hasApiKey &&
                        recordingDebug.diagnostics?.livekit.hasApiSecret
                          ? "ok"
                          : "missing values"}
                      </div>
                      <div>
                        URL match:
                        {" "}
                        {recordingDebug.diagnostics?.livekit.urlMatchesPublic ? "yes" : "no"}
                      </div>
                      <div>
                        S3 env:
                        {" "}
                        {recordingDebug.diagnostics?.s3.hasBucket &&
                        recordingDebug.diagnostics?.s3.hasRegion &&
                        recordingDebug.diagnostics?.s3.hasEndpoint &&
                        recordingDebug.diagnostics?.s3.hasAccessKey &&
                        recordingDebug.diagnostics?.s3.hasSecretKey
                          ? "ok"
                          : "missing values"}
                      </div>
                      <div>S3 endpoint: {recordingDebug.diagnostics?.s3.endpoint || "n/a"}</div>
                      <div>S3 bucket: {recordingDebug.diagnostics?.s3.bucket || "n/a"}</div>
                    </div>
                  </div>
                  {recordingDebug.active?.details && recordingDebug.active.details.length > 0 ? (
                    <div className="mt-3 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-3 text-xs text-[var(--c-3a3935)]">
                      <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[var(--c-7a776f)]">
                        Active Egress Sessions
                      </div>
                      {recordingDebug.active.details.map((item) => (
                        <div key={item.egressId}>
                          {item.egressId} · room={item.roomName} · status={item.status}
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {recordingDebug.live?.error ? (
                    <div className="mt-3 rounded-xl border border-[var(--c-f2d7db)] bg-[var(--c-fff5f6)] p-3 text-xs text-[var(--c-8f2f3b)]">
                      Error: {recordingDebug.live.error}
                    </div>
                  ) : null}
                  {recordingDebug.hints.length > 0 ? (
                    <div className="mt-3 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-3 text-xs text-[var(--c-3a3935)]">
                      {recordingDebug.hints.map((hint) => (
                        <div key={hint}>- {hint}</div>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="mt-3 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-3 text-xs text-[var(--c-6f6c65)]">
                  Recording debug data will appear once diagnostics are available.
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void handleCleanupEgress("room")}
                  disabled={cleanupBusy}
                  className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)] disabled:opacity-60"
                >
                  {cleanupBusy ? "Cleaning..." : "Force Cleanup (Room)"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleCleanupEgress("all")}
                  disabled={cleanupBusy}
                  className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)] disabled:opacity-60"
                >
                  {cleanupBusy ? "Cleaning..." : "Force Cleanup (All)"}
                </button>
              </div>
            </section>
          ) : null}
        </div>

        <main className="flex flex-1 flex-col gap-6">
          {layoutWidth < 2000 || layoutWidth === 0 ? (
            <div className="flex flex-1 flex-col gap-6 min-[3500px]:hidden">
            <section className="flex flex-col gap-4 min-[2000px]:hidden">
              <h2 className="sr-only">Teacher Cameras</h2>
              <div className="grid min-h-[220px] grid-cols-1 gap-4 md:grid-cols-2">
                  <CameraFrame
                    label={getLabelForSource(layoutSources.compact.small[0], false)}
                    showSwapButton
                    onSwap={() => handleSwap(0)}
                    videoRef={teacherOneVideoRef}
                    labelSize="sm"
                    mirrored={isLocalSourceForRole(layoutSources.compact.small[0])}
                    signalActive={isSignalActiveForSource(layoutSources.compact.small[0])}
                    livekitState={livekitState}
                    isRecording={isRecording}
                  />
                  <CameraFrame
                    label={getLabelForSource(layoutSources.compact.small[1], false)}
                    showSwapButton
                    onSwap={() => handleSwap(1)}
                    videoRef={teacherTwoVideoRef}
                    labelSize="sm"
                    mirrored={isLocalSourceForRole(layoutSources.compact.small[1])}
                    signalActive={isSignalActiveForSource(layoutSources.compact.small[1])}
                    livekitState={livekitState}
                    isRecording={isRecording}
                  />
              </div>
            </section>

            <section className="grid flex-1 gap-4 min-[2000px]:hidden lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="flex flex-1 flex-col gap-4">
                {activeRole !== "student" || studentKeyboardVisible ? (
                  <MidiKeyboardPanel
                    activeNotes={displayedMidiNotes}
                    interactive={activeRole === "teacher"}
                    isTeacher={activeRole === "teacher"}
                    visualEnabled={midiEnabled}
                    onToggleVisual={() => setMidiEnabled((value) => !value)}
                    keyboardEnabled={midiKeyboardVisibleForStudents}
                    onToggleKeyboard={() =>
                      setMidiKeyboardVisibleForStudents((value) => !value)
                    }
                    teacherAudioMode={midiTeacherAudioMode}
                    onCycleTeacherAudioMode={cycleTeacherAudioMode}
                    studentAudioEnabled={midiStudentAudioEnabled}
                    onToggleStudentAudio={() =>
                      setMidiStudentAudioEnabled((value) => !value)
                    }
                    noteNamesMode={
                      activeRole === "teacher"
                        ? midiNoteNamesModeForStudents
                        : studentMidiNoteNamesMode
                    }
                    onCycleNoteNamesMode={cycleMidiNoteNamesMode}
                    onNoteOn={(note, velocity) => void handleTeacherNoteOn(note, velocity)}
                    onNoteOff={handleTeacherNoteOff}
                    selectedSound={selectedSound}
                    onCycleSound={cycleSound}
                    volume={midiVolume}
                    onVolumeChange={setMidiVolume}
                    isSoundfontLoading={isSoundfontLoading}
                    soundfontFailed={soundfontFailed}
                    keyboardName={midiInputName}
                  />
                ) : null}
                <div ref={cameraAreaRef} className="relative w-full overflow-hidden">
                  {harmonyActive ? (
                    <HarmonyLivePanel
                      voiceSessionState={voiceSessionState}
                      voiceMuted={voiceMuted}
                      wakeWordEnabled={wakeWordEnabled}
                      voiceSessionError={voiceSessionError}
                      voiceNotice={voiceNotice}
                      harmonyDebugLines={harmonyDebugLines}
                      harmonyDebugVisible={harmonyDebugVisible}
                      voiceAgentSpeaking={voiceAgentSpeaking}
                      harmonyWaveBars={harmonyWaveBars}
                      harmonyTranscript={harmonyTranscript}
                      harmonyPanelPosition={harmonyPanelPosition}
                      harmonyPanelDragging={harmonyPanelDragging}
                      onConnect={() => void startHarmonySession()}
                      onToggleMute={() => void toggleHarmonyMute()}
                      onStop={() => {
                        stopHarmonySession();
                        setHarmonyActive(false);
                      }}
                      onToggleWakeWord={() => setWakeWordEnabled((value) => !value)}
                      onClearDebug={() => setHarmonyDebugLines([])}
                      onToggleDebugVisible={() =>
                        setHarmonyDebugVisible((value) => !value)
                      }
                      onPointerDown={handleHarmonyPanelPointerDown}
                      onPointerMove={handleHarmonyPanelPointerMove}
                      onPointerUp={handleHarmonyPanelPointerUp}
                      onPointerCancel={handleHarmonyPanelPointerUp}
                    />
                  ) : null}
                    <CameraFrame
                      label={getLabelForSource(layoutSources.compact.main, true)}
                      className="max-w-full"
                      videoRef={mainVideoRef}
                      mirrored={isLocalSourceForRole(layoutSources.compact.main)}
                      signalActive={isSignalActiveForSource(layoutSources.compact.main)}
                      livekitState={livekitState}
                      isRecording={isRecording}
                    />
                  <div className="absolute left-1/2 top-[14px] z-10 w-[min(640px,94vw)] -translate-x-1/2">
                    <div className="group/controls relative flex flex-col items-center">
                      <div className="absolute left-0 top-0 h-[36px] w-full" aria-hidden="true" />
                      <div className="w-full rounded-2xl border border-white/15 bg-black/35 px-3 py-2 shadow-[0_18px_36px_-26px_rgba(0,0,0,0.7)] backdrop-blur-[8px] opacity-0 max-h-0 overflow-hidden transition-all duration-200 group-hover/controls:opacity-100 group-hover/controls:max-h-24">
                        <div className="flex flex-nowrap items-center justify-center gap-2">
                          {controlButtons.map((button) => (
                            <button
                              key={button.label}
                              type="button"
                              title={button.label}
                              aria-label={button.label}
                              onClick={button.label === "Record" ? handleRecordToggle : undefined}
                              disabled={
                                button.label === "Record"
                                  ? recordingBusy ||
                                    livekitState !== "connected" ||
                                    (stopBlockedByStarting && !canForceStopFromStarting)
                                  : false
                              }
                              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/90 transition ${
                                button.label === "Record" && isRecording
                                  ? "border-red-300/80 bg-red-500/30 hover:bg-red-500/40"
                                  : "border-white/15 bg-white/10 hover:bg-white/20"
                              } ${
                                button.label === "Record" &&
                                (recordingBusy ||
                                  livekitState !== "connected" ||
                                  (stopBlockedByStarting && !canForceStopFromStarting))
                                  ? "opacity-60"
                                  : ""
                              }`}
                            >
                              <span className="text-white/95">{controlIcons[button.label]}</span>
                              <span className="hidden text-[9px] tracking-[0.2em] text-white/80 sm:inline">
                                {button.label === "Record" &&
                                stopBlockedByStarting &&
                                !canForceStopFromStarting
                                  ? "Starting"
                                  : button.label === "Record" &&
                                    stopBlockedByStarting &&
                                    canForceStopFromStarting
                                  ? "Stop (Force)"
                                  : button.label === "Record" && recordingBusy
                                  ? "Working"
                                  : button.label === "Record" && isRecording
                                  ? "Stop"
                                  : button.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
                <aside className="flex flex-col gap-4">
                  <RightSidebar
                    role={activeRole}
                    harmonyActive={harmonyActive}
                    harmonyVoiceState={voiceSessionState}
                    onStartHarmonyMode={startHarmonyWithMode}
                    onStopHarmony={() => {
                      stopHarmonySession();
                      setHarmonyActive(false);
                    }}
                    recordings={pastRecordings}
                    recordingsLoading={recordingsLoading}
                    recordingsError={recordingsError}
                    onRefreshRecordings={() => void loadPastRecordings()}
                    onOpenRecording={handleOpenRecording}
                    midiLessons={midiLessons}
                    midiLessonsLoading={midiLessonsLoading}
                    midiLessonsError={midiLessonsError}
                    midiLessonStatus={midiLessonStatus}
                    playingMidiLessonName={playingMidiLessonName}
                    onToggleMidiLesson={toggleMidiLessonPlayback}
                    onRefreshMidiLessons={() => void loadMidiLessons()}
                  />
                </aside>
            </section>
          </div>
          ) : null}

          {isWide ? (
          <div className="w-full flex-1 gap-8">
            <div className="grid w-full flex-1 grid-cols-[minmax(300px,0.3fr)_minmax(0,0.7fr)_260px] gap-6">
              <section className="flex flex-col gap-4">
                <h2 className="sr-only">Teacher Cameras</h2>
                <CameraFrame
                  label={getLabelForSource(layoutSources.middle.small[0], false)}
                  showSwapButton
                  onSwap={() => handleSwap(0)}
                  videoRef={teacherOneVideoRef}
                  labelSize="sm"
                  mirrored={isLocalSourceForRole(layoutSources.middle.small[0])}
                  signalActive={isSignalActiveForSource(layoutSources.middle.small[0])}
                  livekitState={livekitState}
                  isRecording={isRecording}
                />
                <CameraFrame
                  label={getLabelForSource(layoutSources.middle.small[1], false)}
                  showSwapButton
                  onSwap={() => handleSwap(1)}
                  videoRef={teacherTwoVideoRef}
                  labelSize="sm"
                  mirrored={isLocalSourceForRole(layoutSources.middle.small[1])}
                  signalActive={isSignalActiveForSource(layoutSources.middle.small[1])}
                  livekitState={livekitState}
                  isRecording={isRecording}
                />
              </section>
              <section className="flex flex-1 flex-col gap-3">
                <h2 className="sr-only">Teacher Camera Focus</h2>
                <div ref={cameraAreaRef} className="relative w-full overflow-hidden">
                  {harmonyActive ? (
                    <HarmonyLivePanel
                      voiceSessionState={voiceSessionState}
                      voiceMuted={voiceMuted}
                      wakeWordEnabled={wakeWordEnabled}
                      voiceSessionError={voiceSessionError}
                      voiceNotice={voiceNotice}
                      harmonyDebugLines={harmonyDebugLines}
                      harmonyDebugVisible={harmonyDebugVisible}
                      voiceAgentSpeaking={voiceAgentSpeaking}
                      harmonyWaveBars={harmonyWaveBars}
                      harmonyTranscript={harmonyTranscript}
                      harmonyPanelPosition={harmonyPanelPosition}
                      harmonyPanelDragging={harmonyPanelDragging}
                      onConnect={() => void startHarmonySession()}
                      onToggleMute={() => void toggleHarmonyMute()}
                      onStop={() => {
                        stopHarmonySession();
                        setHarmonyActive(false);
                      }}
                      onToggleWakeWord={() => setWakeWordEnabled((value) => !value)}
                      onClearDebug={() => setHarmonyDebugLines([])}
                      onToggleDebugVisible={() =>
                        setHarmonyDebugVisible((value) => !value)
                      }
                      onPointerDown={handleHarmonyPanelPointerDown}
                      onPointerMove={handleHarmonyPanelPointerMove}
                      onPointerUp={handleHarmonyPanelPointerUp}
                      onPointerCancel={handleHarmonyPanelPointerUp}
                    />
                  ) : null}
                  <CameraFrame
                    label={getLabelForSource(layoutSources.middle.main, true)}
                    className="max-w-full"
                    videoRef={mainVideoRef}
                    mirrored={isLocalSourceForRole(layoutSources.middle.main)}
                    signalActive={isSignalActiveForSource(layoutSources.middle.main)}
                    livekitState={livekitState}
                    isRecording={isRecording}
                  />
                  <div className="absolute left-1/2 top-[14px] z-10 w-[min(640px,94vw)] -translate-x-1/2">
                    <div className="group/controls relative flex flex-col items-center">
                      <div className="absolute left-0 top-0 h-[36px] w-full" aria-hidden="true" />
                      <div className="w-full rounded-2xl border border-white/15 bg-black/35 px-3 py-2 shadow-[0_18px_36px_-26px_rgba(0,0,0,0.7)] backdrop-blur-[8px] opacity-0 max-h-0 overflow-hidden transition-all duration-200 group-hover/controls:opacity-100 group-hover/controls:max-h-24">
                        <div className="flex flex-nowrap items-center justify-center gap-2">
                          {controlButtons.map((button) => (
                            <button
                              key={button.label}
                              type="button"
                              title={button.label}
                              aria-label={button.label}
                              onClick={button.label === "Record" ? handleRecordToggle : undefined}
                              disabled={
                                button.label === "Record"
                                  ? recordingBusy ||
                                    livekitState !== "connected" ||
                                    (stopBlockedByStarting && !canForceStopFromStarting)
                                  : false
                              }
                              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/90 transition ${
                                button.label === "Record" && isRecording
                                  ? "border-red-300/80 bg-red-500/30 hover:bg-red-500/40"
                                  : "border-white/15 bg-white/10 hover:bg-white/20"
                              } ${
                                button.label === "Record" &&
                                (recordingBusy ||
                                  livekitState !== "connected" ||
                                  (stopBlockedByStarting && !canForceStopFromStarting))
                                  ? "opacity-60"
                                  : ""
                              }`}
                            >
                              <span className="text-white/95">{controlIcons[button.label]}</span>
                              <span className="hidden text-[9px] tracking-[0.2em] text-white/80 sm:inline">
                                {button.label === "Record" &&
                                stopBlockedByStarting &&
                                !canForceStopFromStarting
                                  ? "Starting"
                                  : button.label === "Record" &&
                                    stopBlockedByStarting &&
                                    canForceStopFromStarting
                                  ? "Stop (Force)"
                                  : button.label === "Record" && recordingBusy
                                  ? "Working"
                                  : button.label === "Record" && isRecording
                                  ? "Stop"
                                  : button.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {activeRole !== "student" || studentKeyboardVisible ? (
                  <MidiKeyboardPanel
                    activeNotes={displayedMidiNotes}
                    interactive={activeRole === "teacher"}
                    isTeacher={activeRole === "teacher"}
                    visualEnabled={midiEnabled}
                    onToggleVisual={() => setMidiEnabled((value) => !value)}
                    keyboardEnabled={midiKeyboardVisibleForStudents}
                    onToggleKeyboard={() =>
                      setMidiKeyboardVisibleForStudents((value) => !value)
                    }
                    teacherAudioMode={midiTeacherAudioMode}
                    onCycleTeacherAudioMode={cycleTeacherAudioMode}
                    studentAudioEnabled={midiStudentAudioEnabled}
                    onToggleStudentAudio={() =>
                      setMidiStudentAudioEnabled((value) => !value)
                    }
                    noteNamesMode={
                      activeRole === "teacher"
                        ? midiNoteNamesModeForStudents
                        : studentMidiNoteNamesMode
                    }
                    onCycleNoteNamesMode={cycleMidiNoteNamesMode}
                    onNoteOn={(note, velocity) => void handleTeacherNoteOn(note, velocity)}
                    onNoteOff={handleTeacherNoteOff}
                    selectedSound={selectedSound}
                    onCycleSound={cycleSound}
                    volume={midiVolume}
                    onVolumeChange={setMidiVolume}
                    isSoundfontLoading={isSoundfontLoading}
                    soundfontFailed={soundfontFailed}
                    keyboardName={midiInputName}
                  />
                ) : null}
              </section>
              <aside className="flex flex-col gap-4">
                <RightSidebar
                  role={activeRole}
                  harmonyActive={harmonyActive}
                  harmonyVoiceState={voiceSessionState}
                  onStartHarmonyMode={startHarmonyWithMode}
                  onStopHarmony={() => {
                    stopHarmonySession();
                    setHarmonyActive(false);
                  }}
                  recordings={pastRecordings}
                  recordingsLoading={recordingsLoading}
                  recordingsError={recordingsError}
                  onRefreshRecordings={() => void loadPastRecordings()}
                  onOpenRecording={handleOpenRecording}
                  midiLessons={midiLessons}
                  midiLessonsLoading={midiLessonsLoading}
                  midiLessonsError={midiLessonsError}
                  midiLessonStatus={midiLessonStatus}
                  playingMidiLessonName={playingMidiLessonName}
                  onToggleMidiLesson={toggleMidiLessonPlayback}
                  onRefreshMidiLessons={() => void loadMidiLessons()}
                />
              </aside>
            </div>
          </div>
          ) : null}

          {isUltraWide ? (
          <div className="w-full flex-1 gap-8 items-center justify-center">
            <div className="grid w-full flex-1 grid-cols-[minmax(240px,1fr)_minmax(420px,1.5fr)_minmax(240px,1fr)_minmax(260px,320px)] gap-6">
              <section className="flex flex-col gap-3">
                <h2 className="sr-only">Teacher Camera 1</h2>
                <CameraFrame
                  label={getLabelForSource(layoutSources.ultra.small[0], false)}
                  showSwapButton
                  onSwap={() => handleSwap(0)}
                  videoRef={teacherOneVideoRef}
                  labelSize="sm"
                  mirrored={isLocalSourceForRole(layoutSources.ultra.small[0])}
                  signalActive={isSignalActiveForSource(layoutSources.ultra.small[0])}
                  livekitState={livekitState}
                  isRecording={isRecording}
                />
              </section>
              <section className="flex flex-col gap-3">
                <div ref={cameraAreaRef} className="relative w-full overflow-hidden">
                  {harmonyActive ? (
                    <HarmonyLivePanel
                      voiceSessionState={voiceSessionState}
                      voiceMuted={voiceMuted}
                      wakeWordEnabled={wakeWordEnabled}
                      voiceSessionError={voiceSessionError}
                      voiceNotice={voiceNotice}
                      harmonyDebugLines={harmonyDebugLines}
                      harmonyDebugVisible={harmonyDebugVisible}
                      voiceAgentSpeaking={voiceAgentSpeaking}
                      harmonyWaveBars={harmonyWaveBars}
                      harmonyTranscript={harmonyTranscript}
                      harmonyPanelPosition={harmonyPanelPosition}
                      harmonyPanelDragging={harmonyPanelDragging}
                      onConnect={() => void startHarmonySession()}
                      onToggleMute={() => void toggleHarmonyMute()}
                      onStop={() => {
                        stopHarmonySession();
                        setHarmonyActive(false);
                      }}
                      onToggleWakeWord={() => setWakeWordEnabled((value) => !value)}
                      onClearDebug={() => setHarmonyDebugLines([])}
                      onToggleDebugVisible={() =>
                        setHarmonyDebugVisible((value) => !value)
                      }
                      onPointerDown={handleHarmonyPanelPointerDown}
                      onPointerMove={handleHarmonyPanelPointerMove}
                      onPointerUp={handleHarmonyPanelPointerUp}
                      onPointerCancel={handleHarmonyPanelPointerUp}
                    />
                  ) : null}
                  <CameraFrame
                    label={getLabelForSource(layoutSources.ultra.main, true)}
                    className="max-w-full"
                    videoRef={mainVideoRef}
                    mirrored={isLocalSourceForRole(layoutSources.ultra.main)}
                    signalActive={isSignalActiveForSource(layoutSources.ultra.main)}
                    livekitState={livekitState}
                    isRecording={isRecording}
                  />
                  <div className="absolute left-1/2 top-[14px] z-10 w-[min(640px,94vw)] -translate-x-1/2">
                    <div className="group/controls relative flex flex-col items-center">
                      <div className="absolute left-0 top-0 h-[36px] w-full" aria-hidden="true" />
                      <div className="w-full rounded-2xl border border-white/15 bg-black/35 px-3 py-2 shadow-[0_18px_36px_-26px_rgba(0,0,0,0.7)] backdrop-blur-[8px] opacity-0 max-h-0 overflow-hidden transition-all duration-200 group-hover/controls:opacity-100 group-hover/controls:max-h-24">
                        <div className="flex flex-nowrap items-center justify-center gap-2">
                          {controlButtons.map((button) => (
                            <button
                              key={button.label}
                              type="button"
                              title={button.label}
                              aria-label={button.label}
                              onClick={button.label === "Record" ? handleRecordToggle : undefined}
                              disabled={
                                button.label === "Record"
                                  ? recordingBusy ||
                                    livekitState !== "connected" ||
                                    (stopBlockedByStarting && !canForceStopFromStarting)
                                  : false
                              }
                              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/90 transition ${
                                button.label === "Record" && isRecording
                                  ? "border-red-300/80 bg-red-500/30 hover:bg-red-500/40"
                                  : "border-white/15 bg-white/10 hover:bg-white/20"
                              } ${
                                button.label === "Record" &&
                                (recordingBusy ||
                                  livekitState !== "connected" ||
                                  (stopBlockedByStarting && !canForceStopFromStarting))
                                  ? "opacity-60"
                                  : ""
                              }`}
                            >
                              <span className="text-white/95">{controlIcons[button.label]}</span>
                              <span className="hidden text-[9px] tracking-[0.2em] text-white/80 sm:inline">
                                {button.label === "Record" &&
                                stopBlockedByStarting &&
                                !canForceStopFromStarting
                                  ? "Starting"
                                  : button.label === "Record" &&
                                    stopBlockedByStarting &&
                                    canForceStopFromStarting
                                  ? "Stop (Force)"
                                  : button.label === "Record" && recordingBusy
                                  ? "Working"
                                  : button.label === "Record" && isRecording
                                  ? "Stop"
                                  : button.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {activeRole !== "student" || studentKeyboardVisible ? (
                  <MidiKeyboardPanel
                    activeNotes={displayedMidiNotes}
                    interactive={activeRole === "teacher"}
                    isTeacher={activeRole === "teacher"}
                    visualEnabled={midiEnabled}
                    onToggleVisual={() => setMidiEnabled((value) => !value)}
                    keyboardEnabled={midiKeyboardVisibleForStudents}
                    onToggleKeyboard={() =>
                      setMidiKeyboardVisibleForStudents((value) => !value)
                    }
                    teacherAudioMode={midiTeacherAudioMode}
                    onCycleTeacherAudioMode={cycleTeacherAudioMode}
                    studentAudioEnabled={midiStudentAudioEnabled}
                    onToggleStudentAudio={() =>
                      setMidiStudentAudioEnabled((value) => !value)
                    }
                    noteNamesMode={
                      activeRole === "teacher"
                        ? midiNoteNamesModeForStudents
                        : studentMidiNoteNamesMode
                    }
                    onCycleNoteNamesMode={cycleMidiNoteNamesMode}
                    onNoteOn={(note, velocity) => void handleTeacherNoteOn(note, velocity)}
                    onNoteOff={handleTeacherNoteOff}
                    selectedSound={selectedSound}
                    onCycleSound={cycleSound}
                    volume={midiVolume}
                    onVolumeChange={setMidiVolume}
                    isSoundfontLoading={isSoundfontLoading}
                    soundfontFailed={soundfontFailed}
                    keyboardName={midiInputName}
                  />
                ) : null}
              </section>
              <section className="flex flex-col gap-3">
                <h2 className="sr-only">Teacher Camera 2</h2>
                <CameraFrame
                  label={getLabelForSource(layoutSources.ultra.small[1], false)}
                  showSwapButton
                  onSwap={() => handleSwap(1)}
                  videoRef={teacherTwoVideoRef}
                  labelSize="sm"
                  mirrored={isLocalSourceForRole(layoutSources.ultra.small[1])}
                  signalActive={isSignalActiveForSource(layoutSources.ultra.small[1])}
                  livekitState={livekitState}
                  isRecording={isRecording}
                />
              </section>
              <aside className="space-y-4">
                <RightSidebar
                  role={activeRole}
                  harmonyActive={harmonyActive}
                  harmonyVoiceState={voiceSessionState}
                  onStartHarmonyMode={startHarmonyWithMode}
                  onStopHarmony={() => {
                    stopHarmonySession();
                    setHarmonyActive(false);
                  }}
                  recordings={pastRecordings}
                  recordingsLoading={recordingsLoading}
                  recordingsError={recordingsError}
                  onRefreshRecordings={() => void loadPastRecordings()}
                  onOpenRecording={handleOpenRecording}
                  midiLessons={midiLessons}
                  midiLessonsLoading={midiLessonsLoading}
                  midiLessonsError={midiLessonsError}
                  midiLessonStatus={midiLessonStatus}
                  playingMidiLessonName={playingMidiLessonName}
                  onToggleMidiLesson={toggleMidiLessonPlayback}
                  onRefreshMidiLessons={() => void loadMidiLessons()}
                />
            </aside>
            </div>
          </div>
          ) : null}
        </main>
      </div>
      {recordingModalOpen && modalRecording ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8">
          <div className="w-full max-w-4xl rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
                  Playback
                </p>
                <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                  {modalRecording.filepath}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRecordingModalOpen(false);
                  setModalRecording(null);
                  setModalSignedUrl(null);
                  setModalSignedUrlError(null);
                  setModalSignedUrlLoading(false);
                }}
                className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
              >
                Close
              </button>
            </div>
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                disabled={modalSignedUrlLoading || !modalRecording?.id}
                onClick={() => {
                  if (!modalRecording?.id) return;
                  void requestSignedUrl(modalRecording.id);
                }}
                className="rounded-full border border-[var(--c-ecebe7)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] disabled:opacity-60"
              >
                Regenerate URL
              </button>
            </div>
            {modalSignedUrlLoading ? (
              <div className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-4 text-sm text-[var(--c-6f6c65)]">
                Creating secure playback URL...
              </div>
            ) : modalSignedUrlError ? (
              <div className="rounded-xl border border-[var(--c-f2d7db)] bg-[var(--c-fff5f6)] p-4 text-sm text-[var(--c-8f2f3b)]">
                {modalSignedUrlError}
              </div>
            ) : modalSignedUrl ? (
              <video
                controls
                autoPlay
                className="h-auto w-full rounded-xl bg-black"
                src={modalSignedUrl}
              />
            ) : (
              <div className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-4 text-sm text-[var(--c-6f6c65)]">
                Playback URL not available.
              </div>
            )}
          </div>
        </div>
      ) : null}
      {showPermissionModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8">
          <div className="w-full max-w-xl rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 text-[var(--c-1f1f1d)] shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-7a776f)]">
                  Student Permission
                </p>
                <h2 className="mt-2 text-xl font-semibold">
                  Request Lesson Content Usage
                </h2>
              </div>
            </div>
            <p className="mt-4 text-sm text-[var(--c-6f6c65)]">
              Are you ok with this lesson content being used in future lesson
              content provided to other students or teachers?
            </p>
            <div className="mt-5 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-4 text-sm text-[var(--c-6f6c65)]">
              <p>
                By agreeing, you allow this lesson recording and related
                materials to be used to improve future lessons and learning
                resources.
              </p>
              <p className="mt-3">
                Your content may be edited for clarity, length, or instructional
                value, and may be shared with other students or teachers as part
                of Simply Music materials.
              </p>
              <p className="mt-3">
                We will never share private account details, and we will take
                reasonable steps to remove sensitive personal information from
                any shared content.
              </p>
              <p className="mt-3">
                You can withdraw your consent at any time by contacting support,
                and we will stop using new versions of the content going
                forward.
              </p>
            </div>
            <label className="mt-4 flex items-start gap-3 text-sm text-[var(--c-6f6c65)]">
              <input
                type="checkbox"
                checked={permissionTermsAgreed}
                onChange={(event) => setPermissionTermsAgreed(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border border-[var(--c-ecebe7)]"
              />
              <span>
                I agree to the terms for using this lesson content in future
                materials.
              </span>
            </label>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setShowPermissionModal(false)}
                className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
              >
                Yes, I Agree
              </button>
              <button
                type="button"
                onClick={() => setShowPermissionModal(false)}
                className="rounded-full border border-[var(--c-ecebe7)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
              >
                No, Not Now
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function LessonRoomRoutePage(): ReactElement {
  return <LessonRoomPage />;
}
