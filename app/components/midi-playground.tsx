"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { Dispatch, SetStateAction } from "react";
import { MidiNumbers, Piano } from "react-piano";
import {
  ControlChangeMessageEvent,
  Input,
  NoteMessageEvent,
  PortEvent,
  WebMidi,
} from "webmidi";
import styles from "./midi-playground.module.css";

const FULL_FIRST_NOTE = MidiNumbers.fromNote("c2");
const FULL_LAST_NOTE = MidiNumbers.fromNote("c6");
const EMBEDDED_FIRST_NOTE = MidiNumbers.fromNote("c2");
const EMBEDDED_LAST_NOTE = MidiNumbers.fromNote("c7");
const EMBEDDED_MOBILE_FIRST_NOTE = MidiNumbers.fromNote("c3");
const EMBEDDED_MOBILE_LAST_NOTE = MidiNumbers.fromNote("c6");
const ATTACK_SECONDS = 0.02;

const DEFAULT_DONE_LABEL = "BACK TO SIMPLY MUSIC";
const NOT_FOUND_HEADLINES = [
  "404 in B-flat. The page missed rehearsal.",
  "Wrong note: this page modulated out of range.",
  "This page took a fermata and never came back.",
  "404. Your page hit a dramatic rest.",
  "Page not found. The piano insists on an encore.",
];

type Voice = {
  oscA: OscillatorNode;
  oscB: OscillatorNode;
  gain: GainNode;
  releaseSeconds: number;
};

type MidiPlaygroundProps = {
  showDoneLink?: boolean;
  doneHref?: string;
  showNotFoundBadge?: boolean;
  showHarmonyDisplay?: boolean;
  embedded?: boolean;
  autoEnableAudio?: boolean;
};

type SavedChord = {
  id: string;
  label: string;
  name: string;
  noteNumbers: number[];
};

type RecordedEvent = {
  type: "on" | "off";
  noteNumber: number;
  velocity: number;
  atMs: number;
};
type CountInBars = 0 | 1 | 2;

type SoundPresetId = "acoustic" | "epiano" | "organ" | "synth" | "sf2piano";

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

const SOUND_PRESETS: Record<
  SoundPresetId,
  {
    label: string;
    oscA: OscillatorType;
    oscB: OscillatorType;
    ratioB: number;
    detuneB: number;
    level: number;
    release: number;
    cutoff: number;
    resonance: number;
    drive: number;
    reverb: number;
  }
> = {
  acoustic: {
    label: "Acoustic Piano",
    oscA: "triangle",
    oscB: "sine",
    ratioB: 2,
    detuneB: 0,
    level: 1,
    release: 0.2,
    cutoff: 5400,
    resonance: 1.1,
    drive: 1.15,
    reverb: 0.2,
  },
  epiano: {
    label: "Electric Piano",
    oscA: "sine",
    oscB: "triangle",
    ratioB: 2,
    detuneB: 3,
    level: 0.95,
    release: 0.24,
    cutoff: 4600,
    resonance: 1.35,
    drive: 1.3,
    reverb: 0.24,
  },
  organ: {
    label: "Organ",
    oscA: "sine",
    oscB: "square",
    ratioB: 1,
    detuneB: 5,
    level: 0.88,
    release: 0.1,
    cutoff: 6200,
    resonance: 0.9,
    drive: 1.05,
    reverb: 0.1,
  },
  synth: {
    label: "Synth Lead",
    oscA: "sawtooth",
    oscB: "square",
    ratioB: 1.01,
    detuneB: 6,
    level: 0.78,
    release: 0.16,
    cutoff: 3200,
    resonance: 2,
    drive: 1.45,
    reverb: 0.18,
  },
  sf2piano: {
    label: "Soundfont Piano",
    oscA: "triangle",
    oscB: "sine",
    ratioB: 2,
    detuneB: 0,
    level: 1,
    release: 0.2,
    cutoff: 5400,
    resonance: 1.1,
    drive: 1.15,
    reverb: 0.2,
  },
};

const SOUND_OPTIONS: SoundPresetId[] = [
  "sf2piano",
  "acoustic",
  "epiano",
  "organ",
  "synth",
];

function buildDriveCurve(amount: number) {
  const k = Math.max(0, amount);
  const samples = 1024;
  const curve = new Float32Array(samples);
  for (let i = 0; i < samples; i += 1) {
    const x = (i * 2) / (samples - 1) - 1;
    curve[i] = ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

function buildImpulseResponse(context: AudioContext, seconds = 1.4, decay = 2.1) {
  const sampleRate = context.sampleRate;
  const length = Math.floor(sampleRate * seconds);
  const impulse = context.createBuffer(2, length, sampleRate);
  for (let channel = 0; channel < 2; channel += 1) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      const t = i / length;
      data[i] = (Math.random() * 2 - 1) * (1 - t) ** decay;
    }
  }
  return impulse;
}

function addNote(noteNumber: number, setActiveNotes: Dispatch<SetStateAction<number[]>>) {
  setActiveNotes((previous) =>
    previous.includes(noteNumber) ? previous : [...previous, noteNumber],
  );
}

function removeNote(noteNumber: number, setActiveNotes: Dispatch<SetStateAction<number[]>>) {
  setActiveNotes((previous) => previous.filter((value) => value !== noteNumber));
}

function isInKeyboardRange(noteNumber: number, firstNote: number, lastNote: number) {
  return noteNumber >= firstNote && noteNumber <= lastNote;
}

function midiToFrequency(noteNumber: number) {
  return 440 * 2 ** ((noteNumber - 69) / 12);
}

function pickRandom<T>(values: T[]) {
  return values[Math.floor(Math.random() * values.length)] as T;
}

function encodeVariableLength(value: number) {
  const clamped = Math.max(0, Math.floor(value));
  let buffer = clamped & 0x7f;
  const bytes: number[] = [];
  let remaining = clamped >> 7;
  while (remaining > 0) {
    buffer <<= 8;
    buffer |= (remaining & 0x7f) | 0x80;
    remaining >>= 7;
  }
  while (true) {
    bytes.push(buffer & 0xff);
    if (buffer & 0x80) {
      buffer >>= 8;
    } else {
      break;
    }
  }
  return bytes;
}

function buildMidiFile(events: RecordedEvent[]) {
  const PPQ = 480;
  const TICKS_PER_MS = PPQ / 500;

  const orderedEvents = [...events].sort((a, b) => a.atMs - b.atMs);
  const trackBytes: number[] = [];

  // Set tempo meta event at the beginning of track.
  trackBytes.push(0x00, 0xff, 0x51, 0x03, 0x07, 0xa1, 0x20);

  let lastTick = 0;
  orderedEvents.forEach((event) => {
    const tick = Math.max(0, Math.round(event.atMs * TICKS_PER_MS));
    const delta = Math.max(0, tick - lastTick);
    trackBytes.push(...encodeVariableLength(delta));
    const note = Math.max(0, Math.min(127, Math.round(event.noteNumber)));
    if (event.type === "on") {
      const velocity = Math.max(1, Math.min(127, Math.round(event.velocity * 127)));
      trackBytes.push(0x90, note, velocity);
    } else {
      trackBytes.push(0x80, note, 0x00);
    }
    lastTick = tick;
  });

  // End of track meta event.
  trackBytes.push(0x00, 0xff, 0x2f, 0x00);

  const trackLength = trackBytes.length;
  const header = new Uint8Array([
    0x4d, 0x54, 0x68, 0x64, // MThd
    0x00, 0x00, 0x00, 0x06, // header length
    0x00, 0x00, // format 0
    0x00, 0x01, // one track
    0x01, 0xe0, // 480 ticks/quarter
    0x4d, 0x54, 0x72, 0x6b, // MTrk
    (trackLength >>> 24) & 0xff,
    (trackLength >>> 16) & 0xff,
    (trackLength >>> 8) & 0xff,
    trackLength & 0xff,
  ]);

  return new Blob([header, new Uint8Array(trackBytes)], { type: "audio/midi" });
}

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const SOUND_FONT_URL = "/soundfonts/piano/UprightPianoKW-20220221.sf2";
const SOUND_FONT_WORKLET_URL = "/soundfonts/spessasynth/spessasynth_processor.min.js";

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
  { intervals: [0, 3, 7, 11], name: "Minor Major 7" },
  { intervals: [0, 3, 6, 10], name: "Half-Diminished 7" },
  { intervals: [0, 3, 6, 9], name: "Diminished 7" },
  { intervals: [0, 4, 7, 9], name: "Major 6" },
  { intervals: [0, 3, 7, 9], name: "Minor 6" },
];

function formatNoteName(noteNumber: number) {
  const name = NOTE_NAMES[((noteNumber % 12) + 12) % 12] ?? "C";
  const octave = Math.floor(noteNumber / 12) - 1;
  return `${name}${octave}`;
}

function detectChordName(noteNumbers: number[]) {
  if (noteNumbers.length < 2) {
    return "";
  }
  const sortedNotes = [...noteNumbers].sort((a, b) => a - b);
  const bassPitchClass = ((sortedNotes[0] ?? 0) % 12 + 12) % 12;

  const uniquePitchClasses = [...new Set(noteNumbers.map((n) => ((n % 12) + 12) % 12))];
  if (uniquePitchClasses.length < 2) {
    return "";
  }

  const rootCandidates = [
    ...new Set(
      [...noteNumbers]
        .sort((a, b) => a - b)
        .map((n) => ((n % 12) + 12) % 12),
    ),
  ];

  const detectTertianChordFromRoot = (root: number, normalized: number[]) => {
    const normalizedSet = new Set(normalized);
    const has = (interval: number) => normalizedSet.has(interval);
    const hasUnexpected = (allowed: number[]) =>
      normalized.some((interval) => !allowed.includes(interval));

    const hasMajorTriad = has(4) && has(7);
    const hasMinorTriad = has(3) && has(7);
    if (!hasMajorTriad && !hasMinorTriad) {
      return "";
    }

    const rootName = NOTE_NAMES[root] ?? "C";
    const hasNine = has(2);
    const hasEleven = has(5);
    const hasThirteen = has(9);
    const hasFlatSeven = has(10);
    const hasMajorSeven = has(11);

    if (hasFlatSeven && hasMajorSeven) {
      return "";
    }

    if (hasMajorTriad) {
      if (hasFlatSeven) {
        const allowed = [0, 2, 4, 5, 7, 9, 10];
        if (hasUnexpected(allowed)) {
          return "";
        }
        const ext = hasThirteen ? "13" : hasEleven ? "11" : hasNine ? "9" : "7";
        return `${rootName} Dominant ${ext}`;
      }

      if (hasMajorSeven) {
        const allowed = [0, 2, 4, 5, 7, 9, 11];
        if (hasUnexpected(allowed)) {
          return "";
        }
        const ext = hasThirteen ? "13" : hasEleven ? "11" : hasNine ? "9" : "7";
        return ext === "7" ? `${rootName} Major 7` : `${rootName} Major ${ext}`;
      }

      const allowed = [0, 2, 4, 5, 7, 9];
      if (hasUnexpected(allowed)) {
        return "";
      }

      if (!hasNine && !hasEleven && hasThirteen) {
        return `${rootName} Major 6`;
      }

      const adds: string[] = [];
      if (hasNine) adds.push("add9");
      if (hasEleven) adds.push("add11");
      if (hasThirteen) adds.push("add13");
      if (adds.length === 0) {
        const bassInterval = (bassPitchClass - root + 12) % 12;
        if (bassInterval === 4) {
          return `${rootName} Major 1st Inversion`;
        }
        if (bassInterval === 7) {
          return `${rootName} Major 2nd Inversion`;
        }
      }
      return adds.length > 0
        ? `${rootName} Major ${adds.join(" ")}`
        : `${rootName} Major`;
    }

    if (hasFlatSeven) {
      const allowed = [0, 2, 3, 5, 7, 9, 10];
      if (hasUnexpected(allowed)) {
        return "";
      }
      const ext = hasThirteen ? "13" : hasEleven ? "11" : hasNine ? "9" : "7";
      return ext === "7" ? `${rootName} Minor 7` : `${rootName} Minor ${ext}`;
    }

    if (hasMajorSeven) {
      const allowed = [0, 2, 3, 5, 7, 9, 11];
      if (hasUnexpected(allowed)) {
        return "";
      }
      const ext = hasThirteen ? "13" : hasEleven ? "11" : hasNine ? "9" : "7";
      return ext === "7" ? `${rootName} Minor Major 7` : `${rootName} Minor Major ${ext}`;
    }

    const allowed = [0, 2, 3, 5, 7, 9];
    if (hasUnexpected(allowed)) {
      return "";
    }

    if (!hasNine && !hasEleven && hasThirteen) {
      return `${rootName} Minor 6`;
    }

    const adds: string[] = [];
    if (hasNine) adds.push("add9");
    if (hasEleven) adds.push("add11");
    if (hasThirteen) adds.push("add13");
    if (adds.length === 0) {
      const bassInterval = (bassPitchClass - root + 12) % 12;
      if (bassInterval === 3) {
        return `${rootName} Minor 1st Inversion`;
      }
      if (bassInterval === 7) {
        return `${rootName} Minor 2nd Inversion`;
      }
    }
    return adds.length > 0
      ? `${rootName} Minor ${adds.join(" ")}`
      : `${rootName} Minor`;
  };

  for (const root of rootCandidates) {
    const normalized = uniquePitchClasses
      .map((pc) => (pc - root + 12) % 12)
      .sort((a, b) => a - b);

    const extendedName = detectTertianChordFromRoot(root, normalized);
    if (extendedName) {
      return extendedName;
    }

    for (const pattern of CHORD_PATTERNS) {
      if (pattern.intervals.length !== normalized.length) {
        continue;
      }

      const exactMatch = pattern.intervals.every(
        (value, index) => value === normalized[index],
      );
      if (exactMatch) {
        return `${NOTE_NAMES[root]} ${pattern.name}`;
      }
    }
  }

  return "";
}

export default function MidiPlayground({
  showDoneLink = false,
  doneHref = "/simplymusic",
  showNotFoundBadge = false,
  showHarmonyDisplay = false,
  embedded = false,
  autoEnableAudio = false,
}: MidiPlaygroundProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const connectedInputs = useRef<Map<string, Input>>(new Map());
  const voicesRef = useRef<Map<number, Voice>>(new Map());
  const activeNoteSetRef = useRef<Set<number>>(new Set());
  const pendingNotesRef = useRef<Map<number, number>>(new Map());
  const sustainedNotesRef = useRef<Set<number>>(new Set());
  const sustainPedalRef = useRef(false);
  const resumePromiseRef = useRef<Promise<void> | null>(null);
  const userActivatedRef = useRef(false);
  const volumeRef = useRef(72);
  const selectedSoundRef = useRef<SoundPresetId>("sf2piano");
  const driveCurveCacheRef = useRef<Partial<Record<SoundPresetId, Float32Array>>>({});
  const soundfontWorkletAddedRef = useRef(false);
  const isRecordingRef = useRef(false);
  const recordingStartRef = useRef(0);
  const recordedEventsRef = useRef<RecordedEvent[]>([]);
  const playbackTimersRef = useRef<number[]>([]);
  const metronomeTimerRef = useRef<number | null>(null);
  const metronomeBeatRef = useRef(0);
  const metronomeForcedRef = useRef(false);
  const countInTimersRef = useRef<number[]>([]);
  const accentFlashTimerRef = useRef<number | null>(null);
  const soundfontSynthRef = useRef<SoundfontSynthLike | null>(null);
  const soundfontLoadPromiseRef = useRef<Promise<SoundfontSynthLike | null> | null>(
    null,
  );
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const reverbRef = useRef<ConvolverNode | null>(null);
  const reverbGainRef = useRef<GainNode | null>(null);
  const [activeNotes, setActiveNotes] = useState<number[]>([]);
  const [keyboardWidth, setKeyboardWidth] = useState<number>(900);
  const [audioReady, setAudioReady] = useState(false);
  const [volume, setVolume] = useState(72);
  const [selectedSound, setSelectedSound] = useState<SoundPresetId>("sf2piano");
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordedCount, setRecordedCount] = useState(0);
  const [bpm, setBpm] = useState(90);
  const [clickEnabled, setClickEnabled] = useState(false);
  const [countInBars, setCountInBars] = useState<CountInBars>(0);
  const [countInBeatsLeft, setCountInBeatsLeft] = useState(0);
  const [countInBeatInBar, setCountInBeatInBar] = useState(0);
  const [isMetronomeRunning, setIsMetronomeRunning] = useState(false);
  const [accentFlash, setAccentFlash] = useState(false);
  const [isSoundfontLoading, setIsSoundfontLoading] = useState(false);
  const [soundfontFailed, setSoundfontFailed] = useState(false);
  const [soundfontLoaded, setSoundfontLoaded] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [isChordCaptureActive, setIsChordCaptureActive] = useState(false);
  const [savedChords, setSavedChords] = useState<SavedChord[]>([]);
  const [audioContextState, setAudioContextState] = useState("not-created");
  const [viewportWidth, setViewportWidth] = useState(1024);
  const [userActivated, setUserActivated] = useState(false);
  const [lastAudioError, setLastAudioError] = useState<string>("");
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [sf2NoteOnCount, setSf2NoteOnCount] = useState(0);
  const [sustainPedalDown, setSustainPedalDown] = useState(false);
  const [isPlaybackMuted, setIsPlaybackMuted] = useState(false);
  const chordCaptureActiveRef = useRef(false);
  const capturedChordNotesRef = useRef<Set<number>>(new Set());
  const [hoverPreviewNotes, setHoverPreviewNotes] = useState<number[]>([]);
  const chordCardPressStartIdRef = useRef<string | null>(null);
  const chordCardClickAllowedIdRef = useRef<string | null>(null);
  const chordCardPressStartedAtRef = useRef(0);
  const previousVolumeBeforeMuteRef = useRef(72);
  const isClient = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const doneLabel = useMemo(() => {
    if (!showDoneLink) {
      return "";
    }
    return DEFAULT_DONE_LABEL;
  }, [showDoneLink]);
  const notFoundHeadline = useMemo(() => {
    if (!showNotFoundBadge) {
      return "";
    }
    return isClient ? pickRandom(NOT_FOUND_HEADLINES) : NOT_FOUND_HEADLINES[0];
  }, [isClient, showNotFoundBadge]);

  const pushDebug = useCallback((message: string) => {
    const ts = new Date().toLocaleTimeString();
    setDebugLog((previous) => [`${ts} ${message}`, ...previous].slice(0, 6));
  }, []);

  const selectedSoundLabel = SOUND_PRESETS[selectedSound].label;
  const isEmbeddedMobile = embedded && viewportWidth <= 700;
  const firstNote = isEmbeddedMobile
    ? EMBEDDED_MOBILE_FIRST_NOTE
    : embedded
      ? EMBEDDED_FIRST_NOTE
      : FULL_FIRST_NOTE;
  const lastNote = isEmbeddedMobile
    ? EMBEDDED_MOBILE_LAST_NOTE
    : embedded
      ? EMBEDDED_LAST_NOTE
      : FULL_LAST_NOTE;
  const cycleSound = useCallback(
    (direction: -1 | 1) => {
      const currentIndex = SOUND_OPTIONS.indexOf(selectedSoundRef.current);
      const safeIndex = currentIndex >= 0 ? currentIndex : 0;
      const nextIndex =
        (safeIndex + direction + SOUND_OPTIONS.length) % SOUND_OPTIONS.length;
      const nextSound = SOUND_OPTIONS[nextIndex] ?? SOUND_OPTIONS[0];
      if (!nextSound) {
        return;
      }
      selectedSoundRef.current = nextSound;
      setSelectedSound(nextSound);
    },
    [],
  );
  const harmonyDisplayText = useMemo(() => {
    if (!showHarmonyDisplay) {
      return "";
    }

    if (activeNotes.length === 1) {
      return formatNoteName(activeNotes[0] ?? firstNote);
    }

    if (activeNotes.length > 1) {
      return detectChordName(activeNotes);
    }

    return "";
  }, [activeNotes, firstNote, showHarmonyDisplay]);

  const getAudioContext = useCallback(() => {
    if (typeof window === "undefined") {
      return null;
    }

    if (audioContextRef.current) {
      return audioContextRef.current;
    }

    const AudioContextCtor = window.AudioContext;
    if (!AudioContextCtor) {
      return null;
    }

    const context = new AudioContextCtor();
    setAudioContextState(context.state);
    context.onstatechange = () => {
      setAudioContextState(context.state);
    };
    const masterGain = context.createGain();
    const compressor = context.createDynamicsCompressor();
    const convolver = context.createConvolver();
    const reverbGain = context.createGain();

    masterGain.gain.value = (volumeRef.current / 100) * 0.35;
    compressor.threshold.value = -18;
    compressor.knee.value = 16;
    compressor.ratio.value = 2.8;
    compressor.attack.value = 0.004;
    compressor.release.value = 0.22;

    convolver.buffer = buildImpulseResponse(context);
    reverbGain.gain.value = 0.16;

    masterGain.connect(compressor);
    reverbGain.connect(compressor);
    compressor.connect(context.destination);
    convolver.connect(reverbGain);

    audioContextRef.current = context;
    masterGainRef.current = masterGain;
    compressorRef.current = compressor;
    reverbRef.current = convolver;
    reverbGainRef.current = reverbGain;
    return context;
  }, []);

  useEffect(() => {
    selectedSoundRef.current = selectedSound;
  }, [selectedSound]);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    chordCaptureActiveRef.current = isChordCaptureActive;
  }, [isChordCaptureActive]);

  useEffect(() => {
    volumeRef.current = volume;
    if (!masterGainRef.current) {
      if (soundfontSynthRef.current) {
        try {
          soundfontSynthRef.current.controllerChange(
            0,
            7,
            Math.round((volume / 100) * 127),
            true,
          );
        } catch {
          // ignore synth update errors
        }
      }
      return;
    }
    masterGainRef.current.gain.value = (volume / 100) * 0.35;
    if (soundfontSynthRef.current) {
      try {
        soundfontSynthRef.current.controllerChange(
          0,
          7,
          Math.round((volume / 100) * 127),
          true,
        );
      } catch {
        // ignore synth update errors
      }
    }
  }, [volume]);

  const ensureAudioRunning = useCallback(async () => {
    const context = getAudioContext();
    if (!context) {
      return null;
    }

    if (context.state === "suspended") {
      if (!resumePromiseRef.current) {
        resumePromiseRef.current = context
          .resume()
          .catch(() => undefined)
          .then(() => undefined)
          .finally(() => {
            resumePromiseRef.current = null;
          });
      }
      await resumePromiseRef.current;
    }

    if (context.state !== "running") {
      return null;
    }

    return context;
  }, [getAudioContext]);

  const initSoundfontSynth = useCallback(async () => {
    if (soundfontSynthRef.current) {
      return soundfontSynthRef.current;
    }

    if (soundfontLoadPromiseRef.current) {
      return soundfontLoadPromiseRef.current;
    }

    const context = getAudioContext();
    if (!context) {
      return null;
    }

    setIsSoundfontLoading(true);

    soundfontLoadPromiseRef.current = (async () => {
      try {
        if (!soundfontWorkletAddedRef.current) {
          await context.audioWorklet.addModule(SOUND_FONT_WORKLET_URL);
          soundfontWorkletAddedRef.current = true;
          pushDebug("Loaded soundfont worklet module");
        }
        const spessa = await import("spessasynth_lib");
        const synth = new spessa.WorkletSynthesizer(context) as SoundfontSynthLike;
        synth.connect(context.destination);

        const response = await fetch(SOUND_FONT_URL);
        if (!response.ok) {
          throw new Error(`Failed to load SF2 (${response.status})`);
        }

        const soundBank = await response.arrayBuffer();
        await synth.soundBankManager.addSoundBank(soundBank, "main");
        await synth.isReady;
        synth.programChange(0, 0);
        synth.controllerChange(0, 7, Math.round((volumeRef.current / 100) * 127), true);
        setSoundfontFailed(false);
        setSoundfontLoaded(true);
        pushDebug("Soundfont ready");

        soundfontSynthRef.current = synth;
        return synth;
      } catch (error: unknown) {
        console.error("Soundfont synth initialization failed", error);
        const message = error instanceof Error ? error.message : "Unknown SF2 error";
        setLastAudioError(message);
        pushDebug(`SF2 init failed: ${message}`);
        setSoundfontFailed(true);
        setSoundfontLoaded(false);
        selectedSoundRef.current = "acoustic";
        setSelectedSound("acoustic");
        return null;
      } finally {
        setIsSoundfontLoading(false);
        soundfontLoadPromiseRef.current = null;
      }
    })();

    return soundfontLoadPromiseRef.current;
  }, [getAudioContext, pushDebug]);

  const destroySoundfontSynth = useCallback(() => {
    if (soundfontSynthRef.current) {
      try {
        soundfontSynthRef.current.stopAll(true);
        soundfontSynthRef.current.destroy();
      } catch {
        // ignore cleanup errors
      }
    }
    soundfontSynthRef.current = null;
    soundfontLoadPromiseRef.current = null;
    soundfontWorkletAddedRef.current = false;
    setIsSoundfontLoading(false);
    setSoundfontLoaded(false);
  }, []);

  useEffect(() => {
    if (selectedSound === "sf2piano") {
      voicesRef.current.forEach((voice, noteNumber) => {
        try {
          voice.oscA.stop();
          voice.oscB.stop();
        } catch {
          // ignore stop errors
        }
        voicesRef.current.delete(noteNumber);
      });
      if (userActivatedRef.current) {
        void initSoundfontSynth();
      }
      return;
    }

    if (soundfontSynthRef.current) {
      try {
        soundfontSynthRef.current.stopAll(true);
      } catch {
        // ignore stop errors
      }
    }
  }, [initSoundfontSynth, selectedSound]);

  const flushPendingVoices = useCallback(async (markReady = false) => {
    const context = await ensureAudioRunning();
    if (!context) {
      if (markReady) {
        setAudioReady(false);
      }
      return;
    }
    if (markReady) {
      setAudioReady(context.state === "running");
    }

    const currentSound = selectedSoundRef.current;
    if (currentSound === "sf2piano") {
      const synth = await initSoundfontSynth();
      if (!synth) {
        return;
      }

      const pending = Array.from(pendingNotesRef.current.entries());
      pending.forEach(([noteNumber, velocity]) => {
        if (!activeNoteSetRef.current.has(noteNumber)) {
          pendingNotesRef.current.delete(noteNumber);
          return;
        }
        const midiVelocity = Math.max(1, Math.min(127, Math.round(velocity * 127)));
        try {
          synth.noteOn(0, noteNumber, midiVelocity);
          setSf2NoteOnCount((n) => n + 1);
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "SF2 noteOn failed";
          setLastAudioError(message);
          pushDebug(`SF2 noteOn error: ${message}`);
        }
        pendingNotesRef.current.delete(noteNumber);
      });
      return;
    }

    const masterGain = masterGainRef.current;
    const reverb = reverbRef.current;
    if (!masterGain || !reverb) {
      return;
    }

    const createVoice = (noteNumber: number, velocity: number) => {
      if (!activeNoteSetRef.current.has(noteNumber)) {
        pendingNotesRef.current.delete(noteNumber);
        return;
      }
      if (voicesRef.current.has(noteNumber)) {
        pendingNotesRef.current.delete(noteNumber);
        return;
      }

      const now = context.currentTime;
      const baseFrequency = midiToFrequency(noteNumber);
      const preset = SOUND_PRESETS[currentSound];

      const oscA = context.createOscillator();
      oscA.type = preset.oscA;
      oscA.frequency.value = baseFrequency;

      const oscB = context.createOscillator();
      oscB.type = preset.oscB;
      oscB.frequency.value = baseFrequency * preset.ratioB;
      oscB.detune.value = preset.detuneB;

      const voiceGain = context.createGain();
      const level = Math.max(0.05, Math.min(velocity, 1)) * 0.32 * preset.level;
      const voiceFilter = context.createBiquadFilter();
      const voiceDrive = context.createWaveShaper();
      const reverbSend = context.createGain();

      voiceFilter.type = "lowpass";
      voiceFilter.frequency.value = preset.cutoff;
      voiceFilter.Q.value = preset.resonance;

      const driveCurve =
        driveCurveCacheRef.current[currentSound] ??
        buildDriveCurve(preset.drive * 16);
      driveCurveCacheRef.current[currentSound] = driveCurve;
      voiceDrive.curve = driveCurve;
      voiceDrive.oversample = "2x";
      reverbSend.gain.value = preset.reverb;

      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.exponentialRampToValueAtTime(level, now + ATTACK_SECONDS);

      oscA.connect(voiceFilter);
      oscB.connect(voiceFilter);
      voiceFilter.connect(voiceDrive);
      voiceDrive.connect(voiceGain);
      voiceGain.connect(masterGain);
      voiceGain.connect(reverbSend);
      reverbSend.connect(reverb);

      oscA.start(now);
      oscB.start(now);

      voicesRef.current.set(noteNumber, {
        oscA,
        oscB,
        gain: voiceGain,
        releaseSeconds: preset.release,
      });
      pendingNotesRef.current.delete(noteNumber);
    };

    const pending = Array.from(pendingNotesRef.current.entries());
    pending.forEach(([noteNumber, velocity]) => {
      createVoice(noteNumber, velocity);
    });
  }, [ensureAudioRunning, initSoundfontSynth, pushDebug]);

  const enableAudio = useCallback(async () => {
    userActivatedRef.current = true;
    setUserActivated(true);
    pushDebug("Enable sound requested");
    await flushPendingVoices(true);
  }, [flushPendingVoices, pushDebug]);

  useEffect(() => {
    if (!(embedded && autoEnableAudio) || audioReady) {
      return;
    }
    const tryEnable = () => {
      void enableAudio();
    };
    window.addEventListener("pointerdown", tryEnable, { passive: true });
    window.addEventListener("keydown", tryEnable);
    return () => {
      window.removeEventListener("pointerdown", tryEnable);
      window.removeEventListener("keydown", tryEnable);
    };
  }, [audioReady, autoEnableAudio, embedded, enableAudio]);

  const testSoundfont = useCallback(async () => {
    try {
      await enableAudio();
      const synth = await initSoundfontSynth();
      if (!synth) {
        pushDebug("SF2 test failed: synth unavailable");
        return;
      }

      pushDebug("SF2 test noteOn C4");
      synth.noteOn(0, 60, 110);
      setSf2NoteOnCount((n) => n + 1);

      window.setTimeout(() => {
        try {
          synth.noteOff(0, 60, false);
          pushDebug("SF2 test noteOff C4");
        } catch {
          pushDebug("SF2 test noteOff failed");
        }
      }, 350);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown SF2 test error";
      setLastAudioError(message);
      pushDebug(`SF2 test error: ${message}`);
    }
  }, [enableAudio, initSoundfontSynth, pushDebug]);

  const clearPlaybackTimers = useCallback(() => {
    playbackTimersRef.current.forEach((id) => window.clearTimeout(id));
    playbackTimersRef.current = [];
    setIsPlaying(false);
  }, []);

  const clearCountInTimers = useCallback(() => {
    countInTimersRef.current.forEach((id) => window.clearTimeout(id));
    countInTimersRef.current = [];
    setCountInBeatsLeft(0);
    setCountInBeatInBar(0);
  }, []);

  const clearAccentFlashTimer = useCallback(() => {
    if (accentFlashTimerRef.current != null) {
      window.clearTimeout(accentFlashTimerRef.current);
      accentFlashTimerRef.current = null;
    }
  }, []);

  const clearMetronomeInterval = useCallback(() => {
    if (metronomeTimerRef.current != null) {
      window.clearInterval(metronomeTimerRef.current);
      metronomeTimerRef.current = null;
    }
  }, []);

  const stopMetronome = useCallback(() => {
    clearMetronomeInterval();
    metronomeForcedRef.current = false;
    setIsMetronomeRunning(false);
    setAccentFlash(false);
    clearAccentFlashTimer();
  }, [clearAccentFlashTimer, clearMetronomeInterval]);

  const playMetronomeTick = useCallback(async (beatIndex: number) => {
    const context = await ensureAudioRunning();
    if (!context) {
      return;
    }
    const masterGain = masterGainRef.current;
    if (!masterGain) {
      return;
    }
    const now = context.currentTime;
    const accented = beatIndex % 4 === 0;
    if (accented) {
      setAccentFlash(true);
      clearAccentFlashTimer();
      accentFlashTimerRef.current = window.setTimeout(() => {
        setAccentFlash(false);
      }, 140);
    }
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = "triangle";
    osc.frequency.value = accented ? 1568 : 1046;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(accented ? 0.26 : 0.17, now + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.085);
  }, [clearAccentFlashTimer, ensureAudioRunning]);

  const startMetronome = useCallback(
    async (options?: { force?: boolean; resetBeat?: boolean }) => {
      const force = options?.force ?? false;
      const resetBeat = options?.resetBeat ?? false;
      await enableAudio();
      if (resetBeat) {
        metronomeBeatRef.current = 0;
      }
      if (force) {
        metronomeForcedRef.current = true;
      }
      clearMetronomeInterval();
      const intervalMs = Math.max(20, Math.round((60_000 / Math.max(20, bpm))));
      void playMetronomeTick(metronomeBeatRef.current);
      metronomeBeatRef.current = (metronomeBeatRef.current + 1) % 4;
      metronomeTimerRef.current = window.setInterval(() => {
        void playMetronomeTick(metronomeBeatRef.current);
        metronomeBeatRef.current = (metronomeBeatRef.current + 1) % 4;
      }, intervalMs);
      setIsMetronomeRunning(true);
    },
    [bpm, clearMetronomeInterval, enableAudio, playMetronomeTick],
  );

  const beginRecordingNow = useCallback(() => {
    recordedEventsRef.current = [];
    recordingStartRef.current = performance.now();
    setRecordedCount(0);
    setIsRecording(true);
  }, []);

  const beginRecording = useCallback(async () => {
    clearPlaybackTimers();
    clearCountInTimers();
    stopMetronome();
    setIsRecording(false);

    if (countInBars > 0) {
      const totalCountBeats = countInBars * 4;
      setCountInBeatsLeft(totalCountBeats);
      setCountInBeatInBar(0);
      await startMetronome({ force: true, resetBeat: true });
      const beatMs = Math.max(20, Math.round(60_000 / Math.max(20, bpm)));

      for (let i = 1; i <= totalCountBeats; i += 1) {
        const timerId = window.setTimeout(() => {
          const beatsLeft = totalCountBeats - i;
          const beatInBar = ((i - 1) % 4) + 1;
          setCountInBeatInBar(beatInBar);
          setCountInBeatsLeft(Math.max(0, beatsLeft));
          if (i === totalCountBeats) {
            beginRecordingNow();
            metronomeForcedRef.current = true;
            setCountInBeatInBar(0);
          }
        }, beatMs * i);
        countInTimersRef.current.push(timerId);
      }
      return;
    }

    beginRecordingNow();
    await startMetronome({ force: true, resetBeat: true });
  }, [
    beginRecordingNow,
    bpm,
    clearCountInTimers,
    clearPlaybackTimers,
    countInBars,
    startMetronome,
    stopMetronome,
  ]);

  const stopRecording = useCallback(() => {
    clearCountInTimers();
    setIsRecording(false);
    setRecordedCount(recordedEventsRef.current.length);
    metronomeForcedRef.current = false;
    if (!clickEnabled && !metronomeForcedRef.current) {
      stopMetronome();
    }
  }, [clearCountInTimers, clickEnabled, stopMetronome]);

  const clearRecording = useCallback(() => {
    clearPlaybackTimers();
    clearCountInTimers();
    recordedEventsRef.current = [];
    setRecordedCount(0);
    setIsRecording(false);
    if (!clickEnabled) {
      stopMetronome();
    }
  }, [clearCountInTimers, clearPlaybackTimers, clickEnabled, stopMetronome]);

  useEffect(() => {
    if (metronomeTimerRef.current == null) {
      return;
    }
    void startMetronome({
      force: metronomeForcedRef.current,
      resetBeat: false,
    });
  }, [bpm, startMetronome]);

  const countInModeLabel = useMemo(() => {
    if (countInBars === 1) {
      return "1 Bar Count In";
    }
    if (countInBars === 2) {
      return "2 Bar Count In";
    }
    return "Count In";
  }, [countInBars]);

  const countInButtonLabel = useMemo(() => {
    if (countInBeatsLeft <= 0) {
      return countInModeLabel;
    }
    if (countInBeatInBar <= 1) {
      return "1";
    }
    if (countInBeatInBar === 2) {
      return "1 - 2";
    }
    if (countInBeatInBar === 3) {
      return "1 - 2 - 3";
    }
    return "1 - 2 - 3 - 4";
  }, [countInBeatInBar, countInBeatsLeft, countInModeLabel]);

  const startVoice = useCallback(
    async (noteNumber: number, velocity = 0.75) => {
      pendingNotesRef.current.set(noteNumber, velocity);

      // Respect autoplay policy: do not attempt to create/resume audio
      // until an explicit user gesture has occurred.
      if (!userActivatedRef.current) {
        return;
      }

      const context = await ensureAudioRunning();
      if (!context) {
        return;
      }

      if (voicesRef.current.has(noteNumber)) {
        return;
      }

      if (!activeNoteSetRef.current.has(noteNumber)) {
        pendingNotesRef.current.delete(noteNumber);
        return;
      }
      const pendingVelocity = pendingNotesRef.current.get(noteNumber) ?? velocity;
      pendingNotesRef.current.delete(noteNumber);

      const currentSound = selectedSoundRef.current;
      if (currentSound === "sf2piano") {
        const synth = await initSoundfontSynth();
        if (!synth) {
          return;
        }
        const midiVelocity = Math.max(
          1,
          Math.min(127, Math.round(pendingVelocity * 127)),
        );
        try {
          synth.noteOn(0, noteNumber, midiVelocity);
          setSf2NoteOnCount((n) => n + 1);
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "SF2 noteOn failed";
          setLastAudioError(message);
          pushDebug(`SF2 noteOn error: ${message}`);
        }
        return;
      }

      const masterGain = masterGainRef.current;
      const reverb = reverbRef.current;
      if (!masterGain || !reverb) {
        return;
      }

      const now = context.currentTime;
      const baseFrequency = midiToFrequency(noteNumber);
      const preset = SOUND_PRESETS[currentSound];

      const oscA = context.createOscillator();
      oscA.type = preset.oscA;
      oscA.frequency.value = baseFrequency;

      const oscB = context.createOscillator();
      oscB.type = preset.oscB;
      oscB.frequency.value = baseFrequency * preset.ratioB;
      oscB.detune.value = preset.detuneB;

      const voiceGain = context.createGain();
      const level = Math.max(0.05, Math.min(pendingVelocity, 1)) * 0.32 * preset.level;
      const voiceFilter = context.createBiquadFilter();
      const voiceDrive = context.createWaveShaper();
      const reverbSend = context.createGain();

      voiceFilter.type = "lowpass";
      voiceFilter.frequency.value = preset.cutoff;
      voiceFilter.Q.value = preset.resonance;

      const driveCurve =
        driveCurveCacheRef.current[currentSound] ??
        buildDriveCurve(preset.drive * 16);
      driveCurveCacheRef.current[currentSound] = driveCurve;
      voiceDrive.curve = driveCurve;
      voiceDrive.oversample = "2x";
      reverbSend.gain.value = preset.reverb;

      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.exponentialRampToValueAtTime(level, now + ATTACK_SECONDS);

      oscA.connect(voiceFilter);
      oscB.connect(voiceFilter);
      voiceFilter.connect(voiceDrive);
      voiceDrive.connect(voiceGain);
      voiceGain.connect(masterGain);
      voiceGain.connect(reverbSend);
      reverbSend.connect(reverb);

      oscA.start(now);
      oscB.start(now);

      voicesRef.current.set(noteNumber, {
        oscA,
        oscB,
        gain: voiceGain,
        releaseSeconds: preset.release,
      });
    },
    [ensureAudioRunning, initSoundfontSynth, pushDebug],
  );

  const stopVoice = useCallback((noteNumber: number) => {
    pendingNotesRef.current.delete(noteNumber);

    if (selectedSoundRef.current === "sf2piano") {
      if (soundfontSynthRef.current) {
        try {
          soundfontSynthRef.current.noteOff(0, noteNumber, false);
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "SF2 noteOff failed";
          setLastAudioError(message);
          pushDebug(`SF2 noteOff error: ${message}`);
        }
      }
      return;
    }

    const context = audioContextRef.current;
    const voice = voicesRef.current.get(noteNumber);
    if (!context || !voice) {
      return;
    }

    const now = context.currentTime;
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setValueAtTime(Math.max(0.0001, voice.gain.gain.value), now);
    voice.gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + voice.releaseSeconds,
    );

    const stopAt = now + voice.releaseSeconds + 0.01;
    voice.oscA.stop(stopAt);
    voice.oscB.stop(stopAt);
    voicesRef.current.delete(noteNumber);
  }, [pushDebug]);

  const releaseSustainedNotes = useCallback(() => {
    const pendingRelease = Array.from(sustainedNotesRef.current);
    pendingRelease.forEach((noteNumber) => {
      if (activeNoteSetRef.current.has(noteNumber)) {
        return;
      }
      sustainedNotesRef.current.delete(noteNumber);
      stopVoice(noteNumber);
    });
  }, [stopVoice]);

  const pressNote = useCallback(
    (noteNumber: number, velocity = 0.75) => {
      if (!isInKeyboardRange(noteNumber, firstNote, lastNote)) {
        return;
      }

      if (isRecordingRef.current) {
        recordedEventsRef.current.push({
          type: "on",
          noteNumber,
          velocity,
          atMs: performance.now() - recordingStartRef.current,
        });
        setRecordedCount(recordedEventsRef.current.length);
      }

      activeNoteSetRef.current.add(noteNumber);
      if (chordCaptureActiveRef.current) {
        capturedChordNotesRef.current.add(noteNumber);
      }
      sustainedNotesRef.current.delete(noteNumber);
      addNote(noteNumber, setActiveNotes);
      void startVoice(noteNumber, velocity);
    },
    [firstNote, lastNote, startVoice],
  );

  const releaseNote = useCallback(
    (noteNumber: number) => {
      if (!isInKeyboardRange(noteNumber, firstNote, lastNote)) {
        return;
      }

      if (isRecordingRef.current) {
        recordedEventsRef.current.push({
          type: "off",
          noteNumber,
          velocity: 0,
          atMs: performance.now() - recordingStartRef.current,
        });
        setRecordedCount(recordedEventsRef.current.length);
      }

      activeNoteSetRef.current.delete(noteNumber);
      removeNote(noteNumber, setActiveNotes);
      if (sustainPedalRef.current) {
        sustainedNotesRef.current.add(noteNumber);
        return;
      }
      stopVoice(noteNumber);
    },
    [firstNote, lastNote, stopVoice],
  );

  const playRecording = useCallback(async () => {
    if (isPlaying || recordedEventsRef.current.length === 0) {
      return;
    }

    await enableAudio();
    metronomeForcedRef.current = false;
    stopMetronome();
    clearPlaybackTimers();
    setIsPlaying(true);

    const events = [...recordedEventsRef.current];
    events.forEach((event) => {
      const timerId = window.setTimeout(() => {
        if (event.type === "on") {
          pressNote(event.noteNumber, event.velocity);
        } else {
          releaseNote(event.noteNumber);
        }
      }, event.atMs);
      playbackTimersRef.current.push(timerId);
    });

    const lastAt = events[events.length - 1]?.atMs ?? 0;
    const doneTimerId = window.setTimeout(() => {
      setIsPlaying(false);
      playbackTimersRef.current = [];
    }, lastAt + 250);
    playbackTimersRef.current.push(doneTimerId);
  }, [clearPlaybackTimers, enableAudio, isPlaying, pressNote, releaseNote, stopMetronome]);

  const saveRecordingMidi = useCallback(() => {
    const events = recordedEventsRef.current;
    if (!events.length) {
      return;
    }
    const blob = buildMidiFile(events);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
      now.getDate(),
    ).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(
      now.getMinutes(),
    ).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
    anchor.href = url;
    anchor.download = `midi-recording-${stamp}.mid`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 0);
  }, []);

  const startChordCapture = useCallback(() => {
    capturedChordNotesRef.current.clear();
    setIsChordCaptureActive(true);
  }, []);

  const stopChordCapture = useCallback(() => {
    const noteNumbers = [...capturedChordNotesRef.current].sort((a, b) => a - b);
    setIsChordCaptureActive(false);
    if (noteNumbers.length === 0) {
      return;
    }
    const detectedName = detectChordName(noteNumbers).trim();
    setSavedChords((previous) => {
      const nextIndex = previous.length + 1;
      const label = `Chord ${nextIndex}`;
      return [
        ...previous,
        {
          id: `${Date.now()}-${nextIndex}`,
          label,
          name: detectedName,
          noteNumbers,
        },
      ];
    });
    capturedChordNotesRef.current.clear();
  }, []);

  const playSavedChord = useCallback(
    async (noteNumbers: number[]) => {
      if (noteNumbers.length === 0) {
        return;
      }
      await enableAudio();
      const hadSustainPedalDown = sustainPedalRef.current;
      if (!hadSustainPedalDown) {
        sustainPedalRef.current = true;
        setSustainPedalDown(true);
      }
      noteNumbers.forEach((noteNumber) => {
        pressNote(noteNumber, 0.84);
      });
      const releaseTimer = window.setTimeout(() => {
        noteNumbers.forEach((noteNumber) => {
          releaseNote(noteNumber);
        });
        if (!hadSustainPedalDown) {
          const tailTimer = window.setTimeout(() => {
            sustainPedalRef.current = false;
            setSustainPedalDown(false);
            releaseSustainedNotes();
          }, 380);
          playbackTimersRef.current.push(tailTimer);
        }
      }, 900);
      playbackTimersRef.current.push(releaseTimer);
    },
    [enableAudio, pressNote, releaseNote, releaseSustainedNotes],
  );

  const clearChordPreviewVisual = useCallback(() => {
    setHoverPreviewNotes([]);
  }, []);

  const showChordPreviewVisual = useCallback(
    (chord: SavedChord) => {
      setHoverPreviewNotes(chord.noteNumbers);
    },
    [],
  );

  const togglePlaybackMute = useCallback(() => {
    setIsPlaybackMuted((current) => {
      const next = !current;
      if (next) {
        if (volume > 0) {
          previousVolumeBeforeMuteRef.current = volume;
        }
        setVolume(0);
      } else {
        const restoreTo =
          previousVolumeBeforeMuteRef.current > 0
            ? previousVolumeBeforeMuteRef.current
            : 72;
        setVolume(restoreTo);
      }
      return next;
    });
  }, [volume]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const updateViewportWidth = () => {
      setViewportWidth(window.innerWidth);
    };
    updateViewportWidth();
    window.addEventListener("resize", updateViewportWidth);
    return () => {
      window.removeEventListener("resize", updateViewportWidth);
    };
  }, []);

  useEffect(() => {
    const updateWidth = () => {
      const nextWidth = wrapperRef.current?.clientWidth ?? 900;
      setKeyboardWidth(Math.max(320, nextWidth));
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    if (wrapperRef.current) {
      observer.observe(wrapperRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const trackedInputs = connectedInputs.current;
    const trackedVoices = voicesRef.current;
    const trackedPendingNotes = pendingNotesRef.current;
    const trackedActiveNotes = activeNoteSetRef.current;
    const trackedSustainedNotes = sustainedNotesRef.current;

    const noteOn = (event: NoteMessageEvent) => {
      pressNote(event.note.number, event.note.attack);
    };

    const noteOff = (event: NoteMessageEvent) => {
      releaseNote(event.note.number);
    };

    const controlChange = (event: ControlChangeMessageEvent) => {
      if (event.controller.number !== 64) {
        return;
      }

      const rawValue =
        typeof event.rawValue === "number"
          ? event.rawValue
          : Math.round((event.value ?? 0) * 127);
      const nextPedalDown = rawValue >= 64;
      if (sustainPedalRef.current === nextPedalDown) {
        return;
      }

      sustainPedalRef.current = nextPedalDown;
      setSustainPedalDown(nextPedalDown);

      if (soundfontSynthRef.current) {
        try {
          soundfontSynthRef.current.controllerChange(
            0,
            64,
            nextPedalDown ? 127 : 0,
            true,
          );
        } catch {
          // ignore sustain control errors
        }
      }

      if (!nextPedalDown) {
        releaseSustainedNotes();
      }
    };

    const attachInput = (candidate: Input | null | undefined) => {
      const resolvedInput =
        candidate?.id ? WebMidi.getInputById(candidate.id) ?? candidate : candidate;

      if (!resolvedInput) {
        return;
      }

      const addListener = resolvedInput?.addListener;
      if (typeof addListener !== "function") {
        return;
      }

      if (trackedInputs.has(resolvedInput.id)) {
        return;
      }

      try {
        addListener.call(resolvedInput, "noteon", noteOn);
        addListener.call(resolvedInput, "noteoff", noteOff);
        addListener.call(resolvedInput, "controlchange", controlChange);
        trackedInputs.set(resolvedInput.id, resolvedInput);
      } catch {
        // ignore flaky transient ports
      }
    };

    const detachInput = (inputId: string) => {
      const existingInput = trackedInputs.get(inputId);
      if (!existingInput) {
        return;
      }

      existingInput.removeListener("noteon", noteOn);
      existingInput.removeListener("noteoff", noteOff);
      existingInput.removeListener("controlchange", controlChange);
      trackedInputs.delete(inputId);
    };

    const handleConnected = (event: PortEvent) => {
      if (event.port?.type === "input") {
        attachInput(WebMidi.getInputById(event.port.id) ?? (event.port as Input));
      }
    };

    const handleDisconnected = (event: PortEvent) => {
      if (event.port?.type === "input") {
        detachInput(event.port.id);
      }
    };

    let isMounted = true;

    WebMidi.enable()
      .then(() => {
        if (!isMounted) {
          return;
        }

        WebMidi.inputs.forEach(attachInput);
        WebMidi.addListener("connected", handleConnected);
        WebMidi.addListener("disconnected", handleDisconnected);
      })
      .catch((error: unknown) => {
        console.error("WebMidi could not be enabled", error);
      });

    return () => {
      isMounted = false;
      clearChordPreviewVisual();

      WebMidi.removeListener("connected", handleConnected);
      WebMidi.removeListener("disconnected", handleDisconnected);

      trackedInputs.forEach((input) => {
        input.removeListener("noteon", noteOn);
        input.removeListener("noteoff", noteOff);
        input.removeListener("controlchange", controlChange);
      });
      trackedInputs.clear();

      trackedVoices.forEach((_, noteNumber) => stopVoice(noteNumber));
      trackedPendingNotes.clear();
      trackedActiveNotes.clear();
      trackedSustainedNotes.clear();
      sustainPedalRef.current = false;
      setSustainPedalDown(false);
      clearPlaybackTimers();
      clearCountInTimers();
      stopMetronome();
      clearAccentFlashTimer();
      userActivatedRef.current = false;
      setUserActivated(false);
      destroySoundfontSynth();

      if (WebMidi.enabled) {
        WebMidi.disable().catch(() => undefined);
      }

      if (audioContextRef.current) {
        audioContextRef.current.onstatechange = null;
        void audioContextRef.current.close();
        audioContextRef.current = null;
        masterGainRef.current = null;
        compressorRef.current = null;
        reverbRef.current = null;
        reverbGainRef.current = null;
        setAudioContextState("closed");
      }
    };
  }, [
    clearChordPreviewVisual,
    clearCountInTimers,
    clearAccentFlashTimer,
    clearPlaybackTimers,
    destroySoundfontSynth,
    pressNote,
    releaseNote,
    releaseSustainedNotes,
    stopMetronome,
    stopVoice,
  ]);

  return (
    <main className={`${styles.root} ${embedded ? styles.rootEmbedded : ""}`.trim()}>
      {showNotFoundBadge ? (
        <h1 className={styles.notFoundHeadline}>{notFoundHeadline}</h1>
      ) : null}

      <div className={styles.keyboardFrame}>
        {showHarmonyDisplay ? (
          <div className={styles.harmonyDisplay}>
            <p className={styles.harmonyDisplayText}>{harmonyDisplayText}</p>
          </div>
        ) : null}

        <div className={styles.controlStrip}>
          {!embedded ? <div className={styles.controlLogo}>SIMPLY MUSIC</div> : null}

          <div className={styles.controlRight}>
            <label className={styles.controlLabel}>
              <div className={styles.soundPicker}>
                <button
                  type="button"
                  className={styles.soundNavButton}
                  onClick={() => cycleSound(-1)}
                  aria-label="Previous sound"
                >
                  <span className={styles.soundNavChevron}>‹</span>
                </button>
                <span className={styles.soundCurrent}>{selectedSoundLabel}</span>
                <button
                  type="button"
                  className={styles.soundNavButton}
                  onClick={() => cycleSound(1)}
                  aria-label="Next sound"
                >
                  <span className={styles.soundNavChevron}>›</span>
                </button>
              </div>
            </label>

            <label className={styles.controlLabel}>
              Volume {volume}
              <input
                className={styles.controlRange}
                type="range"
                min={0}
                max={100}
                step={1}
                value={volume}
                onChange={(event) => {
                  setVolume(Number(event.target.value));
                }}
              />
            </label>

            {embedded ? (
              <button
                type="button"
                className={`${styles.transportButton} ${isChordCaptureActive ? styles.transportActive : ""}`.trim()}
                onClick={() => {
                  if (isChordCaptureActive) {
                    stopChordCapture();
                  } else {
                    startChordCapture();
                  }
                }}
              >
                {isChordCaptureActive ? "Stop" : "Save"}
              </button>
            ) : null}

            {!embedded ? (
              <div className={styles.transport}>
                <div className={styles.metronomeGroup}>
                  <button
                    type="button"
                    className={[
                      styles.transportButton,
                      clickEnabled ? styles.transportActive : "",
                      isMetronomeRunning ? styles.clickPulse : "",
                      accentFlash ? styles.clickAccent : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={async () => {
                      const next = !clickEnabled;
                      setClickEnabled(next);
                      if (next) {
                        await startMetronome({ resetBeat: true });
                      } else if (!isRecording && countInBeatsLeft <= 0) {
                        stopMetronome();
                      }
                    }}
                    disabled={countInBeatsLeft > 0}
                  >
                    CLICK
                  </button>
                  <div className={styles.bpmControl}>
                    <button
                      type="button"
                      className={styles.bpmButton}
                      onClick={() => setBpm((current) => Math.max(20, current - 1))}
                    >
                      −
                    </button>
                    <span className={styles.bpmValue}>{bpm} BPM</span>
                    <button
                      type="button"
                      className={styles.bpmButton}
                      onClick={() => setBpm((current) => Math.min(260, current + 1))}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    className={`${styles.transportButton} ${countInBars > 0 || countInBeatsLeft > 0 ? styles.transportActive : ""}`.trim()}
                    onClick={() =>
                      setCountInBars((current) => (((current + 1) % 3) as CountInBars))
                    }
                    disabled={isRecording || countInBeatsLeft > 0}
                  >
                    {countInButtonLabel}
                  </button>
                </div>
                {!isRecording ? (
                  <button
                    type="button"
                    className={styles.transportButton}
                    onClick={beginRecording}
                    disabled={isPlaying || countInBeatsLeft > 0}
                  >
                    Record
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`${styles.transportButton} ${styles.transportActive}`}
                    onClick={stopRecording}
                  >
                    Stop
                  </button>
                )}
                <button
                  type="button"
                  className={styles.transportButton}
                  onClick={() => void playRecording()}
                  disabled={isRecording || isPlaying || recordedCount === 0}
                >
                  Play
                </button>
                <button
                  type="button"
                  className={styles.transportButton}
                  onClick={clearRecording}
                  disabled={isRecording || isPlaying || recordedCount === 0}
                >
                  Clear
                </button>
                <button
                  type="button"
                  className={styles.transportButton}
                  onClick={saveRecordingMidi}
                  disabled={isRecording || isPlaying || recordedCount === 0}
                >
                  Save MIDI
                </button>
                <span className={styles.transportMeta}>{recordedCount} evts</span>
              </div>
            ) : null}
            {selectedSound === "sf2piano" && isSoundfontLoading ? (
              <span className={styles.transportMeta}>Loading SF2...</span>
            ) : null}
            {soundfontFailed ? (
              <span className={styles.transportMeta}>SF2 failed, using Acoustic</span>
            ) : null}
          </div>
        </div>

        {!audioReady && !(embedded && autoEnableAudio) ? (
          <div className={styles.audioOverlay}>
            <p className={styles.audioOverlayTitle}>Ready To Play Your Masterpiece?</p>
            <button
              type="button"
              className={styles.audioOverlayButton}
              onClick={() => {
                void enableAudio();
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  void enableAudio();
                }
              }}
            >
              ENABLE SOUND
            </button>
          </div>
        ) : null}
        <div
          className={`${styles.keyboard} ${!audioReady && !(embedded && autoEnableAudio) ? styles.keyboardLocked : ""}`.trim()}
          ref={wrapperRef}
        >
          <Piano
            noteRange={{ first: firstNote, last: lastNote }}
            playNote={(midiNumber: number) => {
              if (embedded && autoEnableAudio && !audioReady) {
                void enableAudio();
              }
              pressNote(midiNumber);
            }}
            stopNote={(midiNumber: number) => releaseNote(midiNumber)}
            activeNotes={[...new Set([...activeNotes, ...hoverPreviewNotes])]}
            keyboardShortcuts={[]}
            width={keyboardWidth}
          />
        </div>

        <div className={styles.debugToggleRow}>
          <button
            type="button"
            className={styles.debugToggleButton}
            onClick={() => setShowDebugPanel((current) => !current)}
            aria-label={showDebugPanel ? "Hide debug panel" : "Show debug panel"}
            title={showDebugPanel ? "Hide debug panel" : "Show debug panel"}
          >
            <svg viewBox="0 0 24 24" className={styles.debugToggleIcon} aria-hidden="true">
              <path
                d="M9 4h6l1 2h2a1 1 0 0 1 1 1v2h-2v2.2A5.8 5.8 0 0 1 12 17a5.8 5.8 0 0 1-5-5.8V9H5V7a1 1 0 0 1 1-1h2l1-2Zm.5 7.2v.8m4-0.8v.8M9.5 14.5h5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {showDebugPanel ? (
          <div className={styles.debugPanel}>
            <p className={styles.debugTitle}>AUDIO DEBUG</p>
            <p className={styles.debugRow}>Engine: {selectedSound}</p>
            <p className={styles.debugRow}>Audio Ready: {audioReady ? "yes" : "no"}</p>
            <p className={styles.debugRow}>Context: {audioContextState}</p>
            <p className={styles.debugRow}>Activated: {userActivated ? "yes" : "no"}</p>
            <p className={styles.debugRow}>SF2 Loading: {isSoundfontLoading ? "yes" : "no"}</p>
            <p className={styles.debugRow}>SF2 Loaded: {soundfontLoaded ? "yes" : "no"}</p>
            <p className={styles.debugRow}>SF2 Failed: {soundfontFailed ? "yes" : "no"}</p>
            <p className={styles.debugRow}>SF2 noteOn calls: {sf2NoteOnCount}</p>
            <p className={styles.debugRow}>Sustain: {sustainPedalDown ? "down" : "up"}</p>
            <p className={styles.debugRow}>Active Notes: {activeNotes.length}</p>
            <button
              type="button"
              className={styles.debugTestButton}
              onClick={() => void testSoundfont()}
            >
              TEST SF2 C4
            </button>
            {lastAudioError ? (
              <p className={styles.debugError}>Error: {lastAudioError}</p>
            ) : null}
            {debugLog.length > 0 ? (
              <div className={styles.debugLog}>
                {debugLog.map((entry) => (
                  <p key={entry} className={styles.debugLogRow}>
                    {entry}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {embedded ? (
        <div className={styles.savedChordsWrap}>
          {savedChords.length > 0 ? (
            <div>
              <button
                type="button"
                onClick={togglePlaybackMute}
                className={`${styles.savedChordsMuteToggle} ${isPlaybackMuted ? styles.savedChordsMuteToggleActive : ""}`.trim()}
              >
                {isPlaybackMuted ? "Audio Playback Muted" : "Mute Audio Playback"}
              </button>
              <div className={styles.savedChordsGrid}>
                {savedChords.map((chord) => (
                  <button
                    key={chord.id}
                    type="button"
                    className={styles.savedChordCard}
                    onPointerDown={() => {
                      chordCardPressStartIdRef.current = chord.id;
                      chordCardPressStartedAtRef.current = Date.now();
                      showChordPreviewVisual(chord);
                    }}
                    onPointerUp={() => {
                      if (chordCardPressStartIdRef.current === chord.id) {
                        const pressDuration = Date.now() - chordCardPressStartedAtRef.current;
                        chordCardClickAllowedIdRef.current =
                          pressDuration < 280 ? chord.id : null;
                      }
                      chordCardPressStartIdRef.current = null;
                      clearChordPreviewVisual();
                    }}
                    onPointerCancel={() => {
                      chordCardPressStartIdRef.current = null;
                      chordCardClickAllowedIdRef.current = null;
                      clearChordPreviewVisual();
                    }}
                    onPointerLeave={() => {
                      chordCardPressStartIdRef.current = null;
                      chordCardClickAllowedIdRef.current = null;
                      clearChordPreviewVisual();
                    }}
                    onClick={(event) => {
                      if (chordCardClickAllowedIdRef.current !== chord.id) {
                        event.preventDefault();
                        return;
                      }
                      chordCardClickAllowedIdRef.current = null;
                      showChordPreviewVisual(chord);
                      void playSavedChord(chord.noteNumbers);
                      window.setTimeout(() => {
                        clearChordPreviewVisual();
                      }, 1400);
                    }}
                  >
                    <span className={styles.savedChordLabel}>{chord.label}</span>
                    {chord.name ? (
                      <span className={styles.savedChordName}>{chord.name}</span>
                    ) : null}
                    <span className={styles.savedChordNotes}>
                      {chord.noteNumbers.map(formatNoteName).join(" ")}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className={styles.savedChordsHint}>
              Tap Save, play a chord, then tap Stop to store it.
            </p>
          )}
        </div>
      ) : null}

      {showDoneLink ? (
        <div className={styles.doneWrap}>
          <Link href={doneHref} className={styles.doneButton}>
            {doneLabel}
          </Link>
        </div>
      ) : null}
    </main>
  );
}
