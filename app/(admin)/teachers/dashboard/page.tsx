'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import {
  VIEW_ROLE_STORAGE_KEY,
  VIEW_TEACHER_STORAGE_KEY,
} from '../../components/auth';
import LastViewedVideoCard from '../../components/last-viewed-video-card';
import StudentPromoCard from '../../components/student-promo-card';
import {
  COMMUNICATIONS_UPDATE_EVENT,
  readCommunications,
  type CommunicationEntry,
} from '../../components/communications-store';
import { useApiData } from '../../components/use-api-data';
import HarmonyAssistant from '../../components/harmony/harmony-assistant';
import LessonPrepModal from '../../components/lesson-prep-modal';

type StudentRecord = {
  id: string;
  teacher: string;
  name: string;
  email: string;
  level: string;
  status: 'Active' | 'Paused' | 'Archived';
  lessonFeeAmount?: string;
  lessonFeePeriod?: 'Per Mo' | 'Per Qtr' | 'Per Yr';
  lessonDay?: string;
  lessonTime?: string;
  lessonDuration?: '30M' | '45M' | '1HR';
  lessonType?: 'Individual' | 'Group';
  lessonLocation?: 'In-Person' | 'Virtual' | 'Home-Visit';
  lessonNotes?: string;
  studentAlert?: string;
  createdAt: string;
  updatedAt: string;
};

type TeacherRecord = {
  id: string;
  name: string;
  email: string;
  username?: string;
  studioId?: string;
  studioRole?: string;
};

type StudioRecord = {
  id: string;
  name: string;
  location?: string;
  status?: string;
  adminTeacherId?: string;
  teacherIds?: string[];
};

type StudentPresenceActivity = {
  label: string;
  detail?: string;
  updatedAt?: string;
};

type Message = {
  id: string;
  sender: 'teacher' | 'student' | 'corporate';
  text: string;
  timestamp: string;
};

type LastViewedVideo = {
  material: string;
  part?: string;
  materials?: string[];
  viewedAt?: string;
};

type HarmonyInteraction = {
  id: string;
  speaker: 'Harmony' | 'You' | 'System';
  text: string;
  at: string;
};

type HarmonyReplyAction = 'task' | 'note' | 'followup';

type HarmonyDebugState = {
  livekitEvents: number;
  livekitSegments: number;
  livekitUnseenSegments: number;
  livekitCandidateTexts: number;
  livekitEmptyCandidates: number;
  localFinalResults: number;
  appendAttempts: number;
  appendedHarmony: number;
  droppedNonHarmony: number;
  droppedEmptyMessages: number;
  livekitTranscriptActive: boolean;
  lastLivekitParticipant: string;
  lastLivekitText: string;
  lastLocalText: string;
  lastAppendSpeaker: string;
  lastAppendText: string;
};

const createHarmonyDebugState = (): HarmonyDebugState => ({
  livekitEvents: 0,
  livekitSegments: 0,
  livekitUnseenSegments: 0,
  livekitCandidateTexts: 0,
  livekitEmptyCandidates: 0,
  localFinalResults: 0,
  appendAttempts: 0,
  appendedHarmony: 0,
  droppedNonHarmony: 0,
  droppedEmptyMessages: 0,
  livekitTranscriptActive: false,
  lastLivekitParticipant: '-',
  lastLivekitText: '-',
  lastLocalText: '-',
  lastAppendSpeaker: '-',
  lastAppendText: '-',
});

const parseTimeToMinutes = (value?: string) => {
  if (!value) return null;
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3].toUpperCase();
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  const normalizedHours = hours % 12;
  const offset = period === 'PM' ? 12 * 60 : 0;
  return normalizedHours * 60 + minutes + offset;
};

const getMonthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export default function TeacherDashboardPage() {
  const { data: studentsData } = useApiData<{ students: StudentRecord[] }>(
    '/api/students',
    { students: [] },
  );
  const { data: teachersData } = useApiData<{ teachers: TeacherRecord[] }>(
    '/api/teachers',
    { teachers: [] },
  );
  const { data: studiosData } = useApiData<{ studios: StudioRecord[] }>(
    '/api/studios',
    { studios: [] },
  );
  const [now, setNow] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  });
  const [teacherName, setTeacherName] = useState<string | null>(null);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [viewingAs, setViewingAs] = useState<string | null>(null);
  const [isCompanyViewer, setIsCompanyViewer] = useState(false);
  const [isPrepOpen, setIsPrepOpen] = useState(false);
  const [prepStudent, setPrepStudent] = useState<StudentRecord | null>(null);
  const [prepForm, setPrepForm] = useState({
    curriculumType: '',
    section: '',
    part: '',
    material: '',
    focus: '',
    materials: '',
    goal: '',
    warmup: '',
    notes: '',
  });
  const [prepByStudent, setPrepByStudent] = useState<
    Record<
      string,
      {
        dateKey: string;
        curriculumType: string;
        section: string;
        part: string;
        material: string;
        focus: string;
        materials: string;
        goal: string;
        warmup: string;
        notes: string;
      }
    >
  >({});
  const [paymentStatus, setPaymentStatus] = useState<Record<string, boolean>>(
    {},
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentSenders, setRecentSenders] = useState<
    { id: string; label: string; threadId: string; unreadCount: number }[]
  >([]);
  const [lastViewedVideo, setLastViewedVideo] = useState<LastViewedVideo | null>(
    null,
  );
  const [communications, setCommunications] = useState<CommunicationEntry[]>([]);
  const [promoPayload, setPromoPayload] = useState<{
    id?: string;
    title: string;
    body: string;
    cta?: string;
  } | null>(null);
  const [isPromoOpen, setIsPromoOpen] = useState(false);
  const [alertPayloads, setAlertPayloads] = useState<
    {
      id?: string;
      title: string;
      body: string;
      color: string;
      persistence: string;
    }[]
  >([]);
  const [onlineStudents, setOnlineStudents] = useState<
    (StudentRecord & { activity?: StudentPresenceActivity | null })[]
  >([]);
  const [communicationsViewerOpen, setCommunicationsViewerOpen] = useState(false);
  const [voiceSessionState, setVoiceSessionState] = useState<
    'idle' | 'connecting' | 'connected'
  >('idle');
  const [voiceSessionError, setVoiceSessionError] = useState<string | null>(null);
  const [voiceAgentName, setVoiceAgentName] = useState<string | null>(null);
  const [voiceRemoteCount, setVoiceRemoteCount] = useState(0);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [voiceAgentSpeaking, setVoiceAgentSpeaking] = useState(false);
  const [voiceWaveStep, setVoiceWaveStep] = useState(0);
  const [voiceWaveEnergy, setVoiceWaveEnergy] = useState(0.08);
  const [harmonyTranscript, setHarmonyTranscript] = useState<
    HarmonyInteraction[]
  >([]);
  const [harmonyPanelPosition, setHarmonyPanelPosition] = useState({
    x: 0,
    y: 0,
  });
  const [harmonyPanelReady, setHarmonyPanelReady] = useState(false);
  const [harmonyPanelDragging, setHarmonyPanelDragging] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false);
  const [wakeWordStatus, setWakeWordStatus] = useState<
    'off' | 'listening' | 'unsupported'
  >('off');
  const [wakeWordError, setWakeWordError] = useState<string | null>(null);
  const [wakeWordLastHeard, setWakeWordLastHeard] = useState<string | null>(null);
  const [harmonyDebug, setHarmonyDebug] = useState<HarmonyDebugState>(
    createHarmonyDebugState,
  );
  const [harmonyDebugVisible, setHarmonyDebugVisible] = useState(false);
  const maybeSetHarmonyDebug = useCallback(
    (updater: (previous: HarmonyDebugState) => HarmonyDebugState) => {
      if (!harmonyDebugVisible) return;
      setHarmonyDebug(updater);
    },
    [harmonyDebugVisible],
  );
  const [topCardPulse, setTopCardPulse] = useState(true);
  const roomRef = useRef<Room | null>(null);
  const harmonyCardRef = useRef<HTMLDivElement | null>(null);
  const startVoiceSessionRef = useRef<(() => Promise<void>) | null>(null);
  const stopVoiceSessionRef = useRef<
    ((reason?: 'manual' | 'idle' | 'disconnect') => void) | null
  >(null);
  const voiceLastActivityAtRef = useRef<number | null>(null);
  const voiceSegmentIdsRef = useRef<Set<string>>(new Set());
  const harmonySegmentTextRef = useRef<Map<string, string>>(new Map());
  const harmonyLastLivekitTextRef = useRef('');
  const harmonyLastReplyAtRef = useRef<number | null>(null);
  const harmonyTranscriptScrollRef = useRef<HTMLDivElement | null>(null);
  const wakeWordRecognitionRef = useRef<SpeechRecognition | null>(null);
  const localTranscriptRecognitionRef = useRef<SpeechRecognition | null>(null);
  const livekitTranscriptActiveRef = useRef(false);
  const voiceAgentSpeakingRef = useRef(false);
  const voiceAgentLastActiveAtRef = useRef<number | null>(null);
  const voiceNoticeTimeoutRef = useRef<number | null>(null);
  const voiceAgentJoinTimeoutRef = useRef<number | null>(null);
  const harmonyDragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const WAKE_WORD_PHRASE = 'hey harmony';
  const VOICE_IDLE_TIMEOUT_MS = 60_000;

  const currentTeacher = useMemo(() => {
    const teachers = (teachersData.teachers as TeacherRecord[]) ?? [];
    if (teacherId) {
      return teachers.find(teacher => teacher.id === teacherId) ?? null;
    }
    if (teacherName) {
      return teachers.find(teacher => teacher.username === teacherName) ?? null;
    }
    return null;
  }, [teacherId, teacherName, teachersData]);

  const studio = useMemo(() => {
    if (!currentTeacher?.studioId) return null;
    const studios = (studiosData.studios as StudioRecord[]) ?? [];
    return studios.find(item => item.id === currentTeacher.studioId) ?? null;
  }, [currentTeacher, studiosData]);

  const studioTeachers = useMemo(() => {
    const studioTeacherIds = Array.isArray(studio?.teacherIds)
      ? studio.teacherIds
      : [];
    if (studioTeacherIds.length === 0) return [] as TeacherRecord[];
    const teachers = (teachersData.teachers as TeacherRecord[]) ?? [];
    return teachers.filter(teacher => studioTeacherIds.includes(teacher.id));
  }, [studio, teachersData]);

  const communicationsViewedBy = useMemo(
    () => ['Ames Reed', 'Paige Hart', 'Jake Nolan', 'Patrick Lee', 'Max Carter'],
    [],
  );

  const communicationsNotSeenBy = useMemo(
    () => ['Quinn Alvarez', 'Maya Brooks', 'Sasha Kim', 'Leo Kim'],
    [],
  );

  const localTime = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }).format(now),
    [now],
  );

  const localDate = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).format(now),
    [now],
  );

  const harmonyWaveBars = useMemo(() => {
    const barCount = 28;
    const isConnected = voiceSessionState === 'connected' && !voiceMuted;
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

  const normalizeTranscriptForDedupe = useCallback((text: string) => {
    if (typeof text !== 'string') return '';
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }, []);

  const isNearDuplicateTranscript = useCallback((a: string, b: string) => {
    const left = normalizeTranscriptForDedupe(a);
    const right = normalizeTranscriptForDedupe(b);
    if (!left || !right) return false;
    if (left === right) return true;
    const minLen = Math.min(left.length, right.length);
    const maxLen = Math.max(left.length, right.length);
    const overlapRatio = minLen / Math.max(1, maxLen);
    if (minLen >= 16 && overlapRatio >= 0.78 && (left.includes(right) || right.includes(left))) {
      return true;
    }
    return false;
  }, [normalizeTranscriptForDedupe]);

  const appendHarmonyInteraction = useCallback((
    speaker: HarmonyInteraction['speaker'],
    text: string,
  ) => {
    maybeSetHarmonyDebug(previous => ({
      ...previous,
      appendAttempts: previous.appendAttempts + 1,
      lastAppendSpeaker: speaker,
      lastAppendText: text.trim().slice(0, 120) || '-',
    }));
    if (speaker !== 'Harmony') {
      maybeSetHarmonyDebug(previous => ({
        ...previous,
        droppedNonHarmony: previous.droppedNonHarmony + 1,
      }));
      return;
    }
    const message = text.trim().replace(/\s+/g, ' ');
    if (!message) {
      maybeSetHarmonyDebug(previous => ({
        ...previous,
        droppedEmptyMessages: previous.droppedEmptyMessages + 1,
      }));
      return;
    }
    setHarmonyTranscript(previous => {
      const now = new Date();
      const nowMs = now.getTime();
      const nowTime = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }).format(now);
      const lastEntry = previous[previous.length - 1];
      const recentWindowMs = 14_000;
      const inRecentWindow =
        harmonyLastReplyAtRef.current !== null &&
        nowMs - harmonyLastReplyAtRef.current <= recentWindowMs;
      if (
        lastEntry &&
        lastEntry.speaker === speaker &&
        inRecentWindow &&
        (
          message.startsWith(lastEntry.text) ||
          lastEntry.text.startsWith(message) ||
          isNearDuplicateTranscript(lastEntry.text, message)
        )
      ) {
        const nextText =
          message.length >= lastEntry.text.length ? message : lastEntry.text;
        harmonyLastReplyAtRef.current = nowMs;
        if (nextText === lastEntry.text) {
          return previous;
        }
        return [
          ...previous.slice(0, -1),
          {
            ...lastEntry,
            text: nextText,
            at: nowTime,
          },
        ];
      }
      const recentHarmonyTexts = previous
        .filter(entry => entry.speaker === 'Harmony')
        .slice(-4)
        .map(entry => entry.text);
      const isDuplicate = recentHarmonyTexts.some(recent =>
        isNearDuplicateTranscript(recent, message),
      );
      if (isDuplicate) {
        return previous;
      }
      harmonyLastReplyAtRef.current = nowMs;
      const nextEntries = [{
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        speaker,
        text: message,
        at: nowTime,
      }];
      maybeSetHarmonyDebug(current => ({
        ...current,
        appendedHarmony: current.appendedHarmony + nextEntries.length,
      }));
      return [...previous, ...nextEntries].slice(-5);
    });
  }, [isNearDuplicateTranscript, maybeSetHarmonyDebug]);

  const handleHarmonyReplyAction = useCallback(
    (action: HarmonyReplyAction, entry: HarmonyInteraction) => {
      const actionLabel =
        action === 'task'
          ? 'Create Task'
          : action === 'note'
            ? 'Add Lesson Note'
            : 'Follow Up';
      const preview = entry.text.length > 64 ? `${entry.text.slice(0, 64)}…` : entry.text;
      setVoiceNotice(`${actionLabel} queued from: "${preview}"`);
      if (voiceNoticeTimeoutRef.current !== null) {
        window.clearTimeout(voiceNoticeTimeoutRef.current);
      }
      voiceNoticeTimeoutRef.current = window.setTimeout(() => {
        setVoiceNotice(null);
        voiceNoticeTimeoutRef.current = null;
      }, 4000);
    },
    [],
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 1_000);
    return () => window.clearInterval(interval);
  }, [teachersData]);

  useEffect(() => {
    return () => {
      if (voiceNoticeTimeoutRef.current !== null) {
        window.clearTimeout(voiceNoticeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (voiceSessionState !== 'connected' || voiceMuted || !voiceAgentSpeaking) {
      setVoiceWaveEnergy(0.08);
      return;
    }
    const interval = window.setInterval(() => {
      setVoiceWaveStep(step => step + 1);
      setVoiceWaveEnergy(level => Math.max(0.08, level * 0.9));
    }, 140);
    return () => {
      window.clearInterval(interval);
    };
  }, [voiceAgentSpeaking, voiceSessionState, voiceMuted]);

  useEffect(() => {
    voiceAgentSpeakingRef.current = voiceAgentSpeaking;
  }, [voiceAgentSpeaking]);

  useEffect(() => {
    if (voiceSessionState !== 'connected') {
      setHarmonyPanelReady(false);
      return;
    }
    if (harmonyPanelReady) return;
    const card = harmonyCardRef.current;
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
    setHarmonyPanelPosition({ x: nextX, y: nextY });
    setHarmonyPanelReady(true);
  }, [harmonyPanelReady, voiceSessionState]);

  useEffect(() => {
    if (voiceSessionState !== 'connected') return;
    const handleResize = () => {
      setHarmonyPanelPosition(current => {
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
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [voiceSessionState]);

  useEffect(() => {
    const node = harmonyTranscriptScrollRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [harmonyTranscript]);

  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('sm-company-promos');
      channel.onmessage = event => {
        if (event?.data?.type === 'promo-removed') {
          setIsPromoOpen(false);
          setPromoPayload(null);
        }
      };
    } catch {
      channel = null;
    }
    return () => {
      channel?.close();
    };
  }, [teachersData]);

  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('sm-company-alerts');
      channel.onmessage = event => {
        if (event?.data?.type === 'alert-removed') {
          if (event?.data?.id) {
            setAlertPayloads(current => current.filter(item => item.id !== event.data.id));
          } else {
            setAlertPayloads([]);
          }
        }
      };
    } catch {
      channel = null;
    }
    return () => {
      channel?.close();
    };
  }, []);
  useEffect(() => {
    try {
      const readDismissedIds = (key: string) => {
        const raw = window.localStorage.getItem(key);
        if (!raw) return [] as string[];
        try {
          const parsed = JSON.parse(raw) as string[] | string;
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          return [raw];
        }
      };
      const storedPromo = window.localStorage.getItem('sm_company_promo_teacher');
      if (storedPromo) {
        const parsed = JSON.parse(storedPromo) as {
          title: string;
          body: string;
          cta?: string;
          trigger?: string;
          createdAt?: string;
        };
        if (!parsed.trigger || parsed.trigger === 'dashboard' || parsed.trigger === 'instant') {
          setPromoPayload(parsed);
          setIsPromoOpen(true);
          window.localStorage.removeItem('sm_company_promo_teacher');
        }
      }
      const storedAlert = window.localStorage.getItem('sm_company_alert_teacher');
      if (storedAlert) {
        const parsed = JSON.parse(storedAlert) as
          | {
              title: string;
              body: string;
              color: string;
              persistence: string;
              id?: string;
            }
          | {
              title: string;
              body: string;
              color: string;
              persistence: string;
              id?: string;
            }[];
        const dismissedIds = readDismissedIds('sm_company_alert_teacher_dismissed');
        const nextAlerts = (Array.isArray(parsed) ? parsed : [parsed]).filter(
          alert =>
            !alert.id ||
            !(Array.isArray(dismissedIds) && dismissedIds.includes(alert.id)),
        );
        if (nextAlerts.length > 0) {
          setAlertPayloads(nextAlerts);
        }
        const persistAlerts = nextAlerts.filter(alert => alert.persistence === 'persist');
        if (persistAlerts.length > 0) {
          window.localStorage.setItem(
            'sm_company_alert_teacher',
            JSON.stringify(persistAlerts),
          );
        } else {
          window.localStorage.removeItem('sm_company_alert_teacher');
        }
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    let isActive = true;
    const loadPromos = async () => {
      try {
        const response = await fetch('/api/company-promos', { cache: 'no-store' });
        if (!response.ok) return;
        const data = (await response.json()) as {
          promos?: {
            active?: {
              teacher?: {
              title: string;
              body: string;
              cta?: string;
              trigger?: string;
              createdAt?: string;
              id?: string;
              audience?: string;
            } | null;
            };
          };
        };
        const promo = data.promos?.active?.teacher ?? null;
        if (
          isActive &&
          promoPayload &&
          (!promo || (promoPayload.id && promo?.id && promoPayload.id !== promo.id))
        ) {
          setIsPromoOpen(false);
          setPromoPayload(null);
          try {
            window.localStorage.removeItem('sm_company_promo_teacher');
          } catch {
            // ignore
          }
        }
        if (promo && isActive) {
          const trigger = promo.trigger ?? 'dashboard';
          const lastLogin = window.localStorage.getItem('sm_last_login_at');
          const canShow =
            trigger === 'instant' ||
            trigger === 'dashboard' ||
            (trigger === 'login' &&
              lastLogin &&
              promo.createdAt &&
              new Date(lastLogin) >= new Date(promo.createdAt));
          if (canShow) {
            setPromoPayload(promo);
            setIsPromoOpen(true);
            await fetch('/api/company-promos?audience=teacher', { method: 'DELETE' });
          }
        }
      } catch {
        // ignore
      }
    };
    const loadAlerts = async () => {
      try {
        const response = await fetch('/api/company-alerts', { cache: 'no-store' });
        if (!response.ok) return;
        const data = (await response.json()) as {
          alerts?: {
            active?: {
              teacher?:
                | {
                    title: string;
                    body: string;
                    color: string;
                    persistence: string;
                    id?: string;
                    audience?: string;
                  }
                | {
                    title: string;
                    body: string;
                    color: string;
                    persistence: string;
                    id?: string;
                    audience?: string;
                  }[];
            };
          };
        };
        const rawAlerts = data.alerts?.active?.teacher ?? [];
        const normalizedAlerts = Array.isArray(rawAlerts) ? rawAlerts : [rawAlerts];
        if (normalizedAlerts.length === 0 && isActive) {
          setAlertPayloads([]);
        }
        if (normalizedAlerts.length > 0 && isActive) {
          const dismissedIdsRaw = window.localStorage.getItem(
            'sm_company_alert_teacher_dismissed',
          );
          let dismissedIds: string[] = [];
          if (dismissedIdsRaw) {
            try {
              const parsed = JSON.parse(dismissedIdsRaw) as string[] | string;
              dismissedIds = Array.isArray(parsed) ? parsed : [parsed];
            } catch {
              dismissedIds = [dismissedIdsRaw];
            }
          }
          const visibleAlerts = normalizedAlerts.filter(
            alert =>
              !alert.id ||
              !(Array.isArray(dismissedIds) && dismissedIds.includes(alert.id)),
          );
          setAlertPayloads(visibleAlerts);
          const nonPersistent = normalizedAlerts.filter(
            alert => alert.persistence !== 'persist' && alert.id,
          );
          await Promise.all(
            nonPersistent.map(alert =>
              fetch(`/api/company-alerts?id=${alert.id}`, { method: 'DELETE' }),
            ),
          );
        }
      } catch {
        // ignore
      }
    };
    void loadPromos();
    void loadAlerts();
    const promoInterval = window.setInterval(loadPromos, 2500);
    const alertInterval = window.setInterval(loadAlerts, 15000);
    return () => {
      isActive = false;
      window.clearInterval(promoInterval);
      window.clearInterval(alertInterval);
    };
  }, []);

  const dismissAlert = (alertId?: string) => {
    if (alertId) {
      try {
        const raw = window.localStorage.getItem('sm_company_alert_teacher_dismissed');
        let dismissed: string[] = [];
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as string[] | string;
            dismissed = Array.isArray(parsed) ? parsed : [parsed];
          } catch {
            dismissed = [raw];
          }
        }
        if (!(Array.isArray(dismissed) && dismissed.includes(alertId))) {
          dismissed = [alertId, ...dismissed];
        }
        window.localStorage.setItem(
          'sm_company_alert_teacher_dismissed',
          JSON.stringify(dismissed),
        );
      } catch {
        // ignore storage errors
      }
    }
    setAlertPayloads(current => current.filter(item => item.id !== alertId));
    try {
      const stored = window.localStorage.getItem('sm_company_alert_teacher');
      if (stored) {
        const parsed = JSON.parse(stored) as { id?: string } | { id?: string }[];
        const next = (Array.isArray(parsed) ? parsed : [parsed]).filter(
          item => item.id !== alertId,
        );
        if (next.length > 0) {
          window.localStorage.setItem('sm_company_alert_teacher', JSON.stringify(next));
        } else {
          window.localStorage.removeItem('sm_company_alert_teacher');
        }
      }
    } catch {
      // ignore storage errors
    }
  };

  const getAlertStyles = (color?: string) =>
    color === 'info' || color === 'blue'
      ? 'border-[var(--c-d9e2ef)] bg-[var(--c-e6f4ff)] text-[var(--c-28527a)]'
      : color === 'update' || color === 'sage'
        ? 'border-[var(--c-dfe6d2)] bg-[var(--c-e7eddc)] text-[var(--c-3f4f3b)]'
        : 'border-[var(--c-f2dac5)] bg-[var(--c-fff7e8)] text-[var(--c-7a4a17)]';

  useEffect(() => {
    const stored = window.localStorage.getItem('sm_user');
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as { username?: string; role?: string };
      if (parsed?.role === 'company') {
        setIsCompanyViewer(true);
        const storedView = window.localStorage.getItem(VIEW_ROLE_STORAGE_KEY);
        if (storedView === 'teacher') {
          const viewTeacherKey = parsed?.username
            ? `${VIEW_TEACHER_STORAGE_KEY}:${parsed.username}`
            : VIEW_TEACHER_STORAGE_KEY;
          const storedTeacher =
            window.localStorage.getItem(viewTeacherKey) ??
            window.localStorage.getItem(VIEW_TEACHER_STORAGE_KEY);
          if (storedTeacher) {
            try {
              const selected = JSON.parse(storedTeacher) as {
                username?: string;
                name?: string;
              };
              if (selected?.username) {
                setTeacherName(selected.username);
                setViewingAs(selected.name ?? selected.username);
                const teachers = (teachersData.teachers as TeacherRecord[]) ?? [];
                const match = teachers.find(
                  teacher => teacher.username === selected.username,
                );
                setTeacherId(match?.id ?? null);
                return;
              }
            } catch {
              setTeacherName(null);
              setTeacherId(null);
              setViewingAs(null);
            }
          }
        }
      }
      if (parsed?.role === 'teacher' && parsed?.username) {
        setIsCompanyViewer(false);
        setTeacherName(parsed.username);
        setViewingAs(null);
        const teachers = (teachersData.teachers as TeacherRecord[]) ?? [];
        const match = teachers.find(
          teacher => teacher.username === parsed.username,
        );
        setTeacherId(match?.id ?? null);
      }
    } catch {
      setTeacherName(null);
      setTeacherId(null);
      setViewingAs(null);
      setIsCompanyViewer(false);
    }
  }, []);

  useEffect(() => {
    const loadLastViewed = () => {
      try {
        const stored = window.localStorage.getItem('sm_last_viewed_video');
        if (!stored) {
          setLastViewedVideo(null);
          return;
        }
        setLastViewedVideo(JSON.parse(stored) as LastViewedVideo);
      } catch {
        setLastViewedVideo(null);
      }
    };
    loadLastViewed();
    window.addEventListener('sm-last-viewed-video', loadLastViewed);
    return () =>
      window.removeEventListener('sm-last-viewed-video', loadLastViewed);
  }, []);

  useEffect(() => {
    let isActive = true;
    const loadCommunications = async () => {
      const list = await readCommunications();
      if (isActive) {
        setCommunications(list);
      }
    };
    void loadCommunications();
    const handleUpdate = () => {
      void loadCommunications();
    };
    window.addEventListener(COMMUNICATIONS_UPDATE_EVENT, handleUpdate);
    return () => {
      isActive = false;
      window.removeEventListener(COMMUNICATIONS_UPDATE_EVENT, handleUpdate);
    };
  }, []);

  const selectedDayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(
        selectedDay,
      ),
    [selectedDay],
  );
  const selectedDayFullLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).format(selectedDay),
    [selectedDay],
  );
  const selectedDayFullSentence = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(selectedDay),
    [selectedDay],
  );
  const isSelectedDayToday = useMemo(
    () => selectedDay.toDateString() === new Date().toDateString(),
    [selectedDay],
  );
  const nextDay = useMemo(() => {
    const next = new Date(selectedDay);
    next.setDate(selectedDay.getDate() + 1);
    return next;
  }, [selectedDay]);
  const nextNextDay = useMemo(() => {
    const next = new Date(selectedDay);
    next.setDate(selectedDay.getDate() + 2);
    return next;
  }, [selectedDay]);
  const nextDayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(nextDay),
    [nextDay],
  );
  const nextNextDayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(nextNextDay),
    [nextNextDay],
  );
  const nextDayFullLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).format(nextDay),
    [nextDay],
  );
  const nextNextDayFullLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).format(nextNextDay),
    [nextNextDay],
  );
  const selectedDayLessons = useMemo(() => {
    const students = studentsData.students as StudentRecord[];
    return students.filter(
      student =>
        student.status === 'Active' &&
        student.lessonDay &&
        student.lessonDay.toLowerCase() === selectedDayLabel.toLowerCase(),
    );
  }, [selectedDayLabel, studentsData]);
  const nextDayLessons = useMemo(() => {
    const students = studentsData.students as StudentRecord[];
    return students.filter(
      student =>
        student.status === 'Active' &&
        student.lessonDay &&
        student.lessonDay.toLowerCase() === nextDayLabel.toLowerCase(),
    );
  }, [nextDayLabel, studentsData]);
  const nextNextDayLessons = useMemo(() => {
    const students = studentsData.students as StudentRecord[];
    return students.filter(
      student =>
        student.status === 'Active' &&
        student.lessonDay &&
        student.lessonDay.toLowerCase() === nextNextDayLabel.toLowerCase(),
    );
  }, [nextNextDayLabel, studentsData]);
  const sortedNextDayLessons = useMemo(() => {
    return [...nextDayLessons].sort((a, b) => {
      const aMinutes = parseTimeToMinutes(a.lessonTime) ?? 0;
      const bMinutes = parseTimeToMinutes(b.lessonTime) ?? 0;
      return aMinutes - bMinutes;
    });
  }, [nextDayLessons]);
  const sortedNextNextDayLessons = useMemo(() => {
    return [...nextNextDayLessons].sort((a, b) => {
      const aMinutes = parseTimeToMinutes(a.lessonTime) ?? 0;
      const bMinutes = parseTimeToMinutes(b.lessonTime) ?? 0;
      return aMinutes - bMinutes;
    });
  }, [nextNextDayLessons]);
  const sortedSelectedLessons = useMemo(() => {
    return [...selectedDayLessons].sort((a, b) => {
      const aMinutes = parseTimeToMinutes(a.lessonTime) ?? 0;
      const bMinutes = parseTimeToMinutes(b.lessonTime) ?? 0;
      return aMinutes - bMinutes;
    });
  }, [selectedDayLessons]);
  const nextStudent = useMemo(() => {
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    if (!isSelectedDayToday) {
      return sortedSelectedLessons[0] ?? null;
    }
    const upcoming = sortedSelectedLessons.find(student => {
      const minutes = parseTimeToMinutes(student.lessonTime);
      return minutes !== null && minutes >= nowMinutes;
    });
    return upcoming ?? sortedSelectedLessons[0] ?? null;
  }, [isSelectedDayToday, now, sortedSelectedLessons]);

  const selectedDayKey = useMemo(
    () => selectedDay.toISOString().slice(0, 10),
    [selectedDay],
  );
  const monthKey = useMemo(() => getMonthKey(new Date()), []);

  const activeStudents = useMemo(() => {
    const students = studentsData.students as StudentRecord[];
    return students.filter(
      student =>
        student.status === 'Active' &&
        (!teacherName || student.teacher === teacherName),
    );
  }, [teacherName, studentsData]);

  const unpaidCount = useMemo(
    () => activeStudents.filter(student => !paymentStatus[student.id]).length,
    [activeStudents, paymentStatus],
  );

  useEffect(() => {
    if (!activeStudents.length) {
      setOnlineStudents([]);
      return;
    }
    let isActive = true;
    const checkOnline = async () => {
      try {
          const results = await Promise.all(
            activeStudents.map(async student => {
              try {
                const response = await fetch(
                  `/api/presence?key=${encodeURIComponent(`student:${student.id}`)}`,
                  { cache: 'no-store' },
                );
                if (!response.ok) return null;
              const data = (await response.json()) as {
                lastSeen?: string | null;
                activity?: StudentPresenceActivity | null;
              };
              if (!data.lastSeen) return null;
              const diff = Date.now() - new Date(data.lastSeen).getTime();
              return diff < 120000 ? { ...student, activity: data.activity } : null;
              } catch {
                return null;
              }
            }),
          );
        if (!isActive) return;
        setOnlineStudents(results.filter(Boolean) as StudentRecord[]);
      } catch {
        if (isActive) setOnlineStudents([]);
      }
    };
    void checkOnline();
    const interval = window.setInterval(checkOnline, 5000);
    return () => {
      isActive = false;
      window.clearInterval(interval);
    };
  }, [activeStudents]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('sm_lesson_prep');
    if (!stored) {
      setPrepByStudent({});
      return;
    }
    try {
      const parsed = JSON.parse(stored) as typeof prepByStudent;
      setPrepByStudent(parsed ?? {});
    } catch {
      setPrepByStudent({});
    }
  }, []);

  useEffect(() => {
    if (!teacherName) return;
    const key = `sm_lesson_fees:${teacherName}:${monthKey}`;
    const stored = window.localStorage.getItem(key);
    if (!stored) {
      setPaymentStatus({});
      return;
    }
    try {
      const parsed = JSON.parse(stored) as { paid?: Record<string, boolean> };
      setPaymentStatus(parsed?.paid ?? {});
    } catch {
      setPaymentStatus({});
    }
  }, [monthKey, teacherName]);

  useEffect(() => {
    if (!teacherId) return;
    const READS_KEY = `sm_message_thread_reads:teacher:${teacherId}`;
    const LEGACY_READS_KEY = 'sm_message_thread_reads';
    const students = (studentsData.students as StudentRecord[]) ?? [];

    const computeUnread = async () => {
      const rawReads =
        window.localStorage.getItem(READS_KEY) ??
        window.localStorage.getItem(LEGACY_READS_KEY);
      const reads = rawReads
        ? (JSON.parse(rawReads) as Record<string, string>)
        : {};
      let threads: Record<string, Message[]> = {};
      try {
        const response = await fetch('/api/messages');
        if (response.ok) {
          const data = (await response.json()) as { threads?: Record<string, Message[]> };
          threads = data.threads ?? {};
        }
      } catch {
        threads = {};
      }

      const threadEntries = Object.entries(threads).filter(
        ([threadId, messages]) =>
          messages.length > 0 && threadId.endsWith(`teacher:${teacherId}`),
      );

      const unreadByThread = new Map<string, number>();
      const unreadMessages = threadEntries.reduce(
        (total, [threadId, messages]) => {
          const lastRead = reads[threadId];
          const threadUnread = messages.filter(message => {
            if (message.sender === 'teacher') return false;
            if (!lastRead) return true;
            return new Date(message.timestamp) > new Date(lastRead);
          }).length;
          unreadByThread.set(threadId, threadUnread);
          return total + threadUnread;
        },
        0,
      );

      setUnreadCount(unreadMessages);

      const sortedByRecent = [...threadEntries]
        .map(([threadId, messages]) => ({
          threadId,
          lastMessage: messages[messages.length - 1],
        }))
        .filter(item => item.lastMessage)
        .sort((a, b) => {
          const aTime = new Date(a.lastMessage!.timestamp).getTime();
          const bTime = new Date(b.lastMessage!.timestamp).getTime();
          return bTime - aTime;
        });

      const senders = sortedByRecent
        .map(item => {
          const unreadCountForThread = unreadByThread.get(item.threadId) ?? 0;
          if (item.threadId.startsWith('corporate|')) {
            return {
              id: item.threadId,
              label: 'Corporate',
              threadId: item.threadId,
              unreadCount: unreadCountForThread,
            };
          }
          const [studentPart] = item.threadId.split('|');
          const studentId = studentPart?.replace('student:', '');
          const student = students.find(s => s.id === studentId);
          return {
            id: studentId ?? item.threadId,
            label: student?.name ?? 'Student',
            threadId: item.threadId,
            unreadCount: unreadCountForThread,
          };
        })
        .filter((sender, index, self) => {
          return (
            self.findIndex(item => item.label === sender.label) === index
          );
        })
        .slice(0, 3);

      setRecentSenders(senders);
    };

    void computeUnread();
    const interval = window.setInterval(() => {
      void computeUnread();
    }, 5000);
    const handleUpdate = () => {
      void computeUnread();
    };
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.clearInterval(interval);
    };
  }, [teacherId, studentsData]);

  const clearVoiceAudioElements = () => {
    const nodes = document.querySelectorAll('[data-livekit-voice-audio="true"]');
    nodes.forEach(node => {
      node.remove();
    });
  };

  const stopVoiceSession = (reason: 'manual' | 'idle' | 'disconnect' = 'manual') => {
    const room = roomRef.current;
    if (room) {
      room.disconnect();
      roomRef.current = null;
    }
    clearVoiceAudioElements();
    voiceLastActivityAtRef.current = null;
    setVoiceSessionState('idle');
    setVoiceSessionError(null);
    setVoiceAgentName(null);
    setVoiceRemoteCount(0);
    setVoiceMuted(false);
    setVoiceAgentSpeaking(false);
    setVoiceWaveEnergy(0.08);
    setHarmonyPanelDragging(false);
    setHarmonyPanelReady(false);
    livekitTranscriptActiveRef.current = false;
    voiceSegmentIdsRef.current.clear();
    harmonySegmentTextRef.current.clear();
    harmonyLastLivekitTextRef.current = '';
    harmonyLastReplyAtRef.current = null;
    setHarmonyDebug(previous => ({
      ...previous,
      livekitTranscriptActive: false,
    }));
    if (reason === 'manual') {
      appendHarmonyInteraction('System', 'Voice session ended.');
    } else if (reason === 'disconnect') {
      appendHarmonyInteraction('System', 'Voice session disconnected.');
    }
    setVoiceNotice(null);
    if (voiceAgentJoinTimeoutRef.current !== null) {
      window.clearTimeout(voiceAgentJoinTimeoutRef.current);
      voiceAgentJoinTimeoutRef.current = null;
    }
  };

  const startVoiceSession = async () => {
    if (voiceSessionState === 'connecting' || voiceSessionState === 'connected') {
      return;
    }

    const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
    if (!livekitUrl) {
      setVoiceSessionError('Missing NEXT_PUBLIC_LIVEKIT_URL.');
      return;
    }

    setVoiceSessionState('connecting');
    setVoiceSessionError(null);
    setVoiceNotice(null);
    setVoiceAgentName(null);
    setVoiceAgentSpeaking(false);
    setVoiceWaveEnergy(0.08);
    setHarmonyPanelDragging(false);
    livekitTranscriptActiveRef.current = false;
    voiceSegmentIdsRef.current.clear();
    harmonySegmentTextRef.current.clear();
    harmonyLastLivekitTextRef.current = '';
    harmonyLastReplyAtRef.current = null;
    setHarmonyTranscript([]);
    setHarmonyDebug(createHarmonyDebugState());
    if (voiceAgentJoinTimeoutRef.current !== null) {
      window.clearTimeout(voiceAgentJoinTimeoutRef.current);
      voiceAgentJoinTimeoutRef.current = null;
    }

    try {
      const roomName = 'teachers-voice-agent';
      const identitySeed = teacherName ?? teacherId ?? 'teacher';
      const identity = `${identitySeed}-voice-${Math.random().toString(36).slice(2, 8)}`;

      try {
        const dispatchResponse = await fetch('/api/livekit/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            room: roomName,
            metadata: JSON.stringify({ voice: 'female', mode: 'conversation' }),
          }),
        });
        if (!dispatchResponse.ok) {
          const dispatchPayload = (await dispatchResponse.json()) as { error?: string };
          throw new Error(
            dispatchPayload.error ??
              'No agent dispatched. Set LIVEKIT_AGENT_NAME or dispatch from your agent service.',
          );
        }
      } catch (error) {
        throw new Error(
          error instanceof Error
            ? error.message
            : 'Dispatch request failed. Ensure your agent service is available.',
        );
      }

      const response = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room: roomName,
          identity,
          name: teacherName ?? 'Teacher',
        }),
      });
      const tokenPayload = (await response.json()) as {
        token?: string;
        error?: string;
      };
      if (!response.ok || !tokenPayload.token) {
        throw new Error(tokenPayload.error ?? 'Unable to create LiveKit token.');
      }

      const room = new Room();
      roomRef.current = room;

      room.on(RoomEvent.ParticipantConnected, participant => {
        if (voiceAgentJoinTimeoutRef.current !== null) {
          window.clearTimeout(voiceAgentJoinTimeoutRef.current);
          voiceAgentJoinTimeoutRef.current = null;
        }
        setVoiceSessionError(null);
        setVoiceAgentName(participant.name || participant.identity);
        setVoiceRemoteCount(room.remoteParticipants.size);
        voiceLastActivityAtRef.current = Date.now();
      });
      room.on(RoomEvent.ParticipantDisconnected, () => {
        const remoteCount = room.remoteParticipants.size;
        const firstRemote = room.remoteParticipants.values().next().value as
          | { name?: string; identity: string }
          | undefined;
        setVoiceAgentName(firstRemote ? firstRemote.name || firstRemote.identity : null);
        setVoiceRemoteCount(remoteCount);
        voiceLastActivityAtRef.current = Date.now();
        if (remoteCount === 0) {
          stopVoiceSessionRef.current?.('disconnect');
        }
      });
      room.on(RoomEvent.ActiveSpeakersChanged, speakers => {
        const remoteSpeakers = speakers.filter(
          speaker => speaker.identity !== room.localParticipant.identity,
        );
        const maxRemoteLevel = remoteSpeakers.reduce((maxLevel, speaker) => {
          const level =
            typeof speaker.audioLevel === 'number' ? speaker.audioLevel : 0;
          return Math.max(maxLevel, level);
        }, 0);
        setVoiceAgentSpeaking(remoteSpeakers.length > 0);
        if (remoteSpeakers.length > 0) {
          voiceAgentLastActiveAtRef.current = Date.now();
          setVoiceWaveEnergy(level => Math.max(level, maxRemoteLevel + 0.18));
          voiceLastActivityAtRef.current = Date.now();
        }
      });
      room.on(RoomEvent.TranscriptionReceived, (segments, participant) => {
        livekitTranscriptActiveRef.current = true;
        maybeSetHarmonyDebug(previous => ({
          ...previous,
          livekitEvents: previous.livekitEvents + 1,
          livekitSegments: previous.livekitSegments + segments.length,
          livekitTranscriptActive: true,
          lastLivekitParticipant: participant?.identity ?? '(unknown)',
        }));
        const isRemoteParticipant =
          Boolean(participant?.identity) &&
          participant?.identity !== room.localParticipant.identity;
        if (!isRemoteParticipant) {
          maybeSetHarmonyDebug(previous => ({
            ...previous,
            droppedNonHarmony: previous.droppedNonHarmony + 1,
          }));
          return;
        }
        if (localTranscriptRecognitionRef.current) {
          localTranscriptRecognitionRef.current.onend = null;
          localTranscriptRecognitionRef.current.stop();
          localTranscriptRecognitionRef.current = null;
        }
        const changedSegments: string[] = [];
        const finalSegments: string[] = [];
        segments.forEach(segment => {
          const segmentId =
            typeof segment.id === 'string' ? segment.id : undefined;
          const segmentText =
            typeof segment.text === 'string' ? segment.text.trim() : '';
          if (!segmentText) {
            return;
          }
          if (!segmentId) {
            changedSegments.push(segmentText);
            if (segment.final) {
              finalSegments.push(segmentText);
            }
            return;
          }
          const previousText = harmonySegmentTextRef.current.get(segmentId) ?? '';
          if (segmentText.length >= previousText.length) {
            harmonySegmentTextRef.current.set(segmentId, segmentText);
            if (segmentText !== previousText) {
              changedSegments.push(segmentText);
            }
          }
          if (segment.final) {
            finalSegments.push(segmentText);
          }
          if (!voiceSegmentIdsRef.current.has(segmentId)) {
            voiceSegmentIdsRef.current.add(segmentId);
          }
        });
        maybeSetHarmonyDebug(previous => ({
          ...previous,
          livekitUnseenSegments: previous.livekitUnseenSegments + changedSegments.length,
        }));
        const candidateText = (
          finalSegments.length > 0
            ? finalSegments[finalSegments.length - 1]
            : changedSegments.sort((a, b) => b.length - a.length)[0]
        )?.trim() ?? '';
        if (!candidateText) {
          maybeSetHarmonyDebug(previous => ({
            ...previous,
            livekitEmptyCandidates: previous.livekitEmptyCandidates + 1,
          }));
          return;
        }
        if (candidateText === harmonyLastLivekitTextRef.current) {
          return;
        }
        harmonyLastLivekitTextRef.current = candidateText;
        maybeSetHarmonyDebug(previous => ({
          ...previous,
          livekitCandidateTexts: previous.livekitCandidateTexts + 1,
          lastLivekitText: candidateText.slice(0, 120),
        }));
        appendHarmonyInteraction('Harmony', candidateText);
      });
      room.on(RoomEvent.TrackSubscribed, track => {
        if (track.kind !== Track.Kind.Audio) return;
        const audioElement = track.attach();
        audioElement.autoplay = true;
        audioElement.dataset.livekitVoiceAudio = 'true';
        audioElement.style.display = 'none';
        document.body.appendChild(audioElement);
        voiceLastActivityAtRef.current = Date.now();
      });
      room.on(RoomEvent.TrackUnsubscribed, track => {
        if (track.kind !== Track.Kind.Audio) return;
        track.detach().forEach(element => {
          element.remove();
        });
      });
      room.on(RoomEvent.Disconnected, () => {
        clearVoiceAudioElements();
        voiceLastActivityAtRef.current = null;
        setVoiceSessionState('idle');
        setVoiceAgentName(null);
        setVoiceRemoteCount(0);
        setVoiceMuted(false);
        setVoiceAgentSpeaking(false);
        setVoiceWaveEnergy(0.08);
      });

      await room.connect(livekitUrl, tokenPayload.token);
      await room.localParticipant.setMicrophoneEnabled(true);
      await room.startAudio();
      voiceLastActivityAtRef.current = Date.now();

      const firstRemote = room.remoteParticipants.values().next().value as
        | { name?: string; identity: string }
        | undefined;
      setVoiceAgentName(firstRemote ? firstRemote.name || firstRemote.identity : null);
      setVoiceRemoteCount(room.remoteParticipants.size);
      setVoiceMuted(false);
      setVoiceSessionState('connected');
      voiceAgentJoinTimeoutRef.current = window.setTimeout(() => {
        const activeRoom = roomRef.current;
        if (activeRoom !== room) return;
        if (activeRoom.remoteParticipants.size > 0) return;
        setVoiceSessionError(
          'Connected to LiveKit, but Harmony did not join. Check agent worker status and LIVEKIT_AGENT_NAME.',
        );
      }, 8000);
      appendHarmonyInteraction('System', 'Harmony connected and ready.');
    } catch (error) {
      roomRef.current?.disconnect();
      roomRef.current = null;
      clearVoiceAudioElements();
      voiceLastActivityAtRef.current = null;
      setVoiceSessionState('idle');
      setVoiceAgentName(null);
      setVoiceRemoteCount(0);
      setVoiceMuted(false);
      setVoiceAgentSpeaking(false);
      setVoiceWaveEnergy(0.08);
      livekitTranscriptActiveRef.current = false;
      voiceSegmentIdsRef.current.clear();
      if (voiceAgentJoinTimeoutRef.current !== null) {
        window.clearTimeout(voiceAgentJoinTimeoutRef.current);
        voiceAgentJoinTimeoutRef.current = null;
      }
      setVoiceSessionError(error instanceof Error ? error.message : 'Voice session failed.');
    }
  };

  const toggleVoiceMute = useCallback(async () => {
    const room = roomRef.current;
    if (!room || voiceSessionState !== 'connected') return;
    try {
      const nextMuted = !voiceMuted;
      await room.localParticipant.setMicrophoneEnabled(!nextMuted);
      setVoiceMuted(nextMuted);
      if (nextMuted) {
        setVoiceAgentSpeaking(false);
      }
      appendHarmonyInteraction(
        'System',
        nextMuted ? 'Microphone muted.' : 'Microphone unmuted.',
      );
      voiceLastActivityAtRef.current = Date.now();
    } catch {
      setVoiceSessionError('Unable to update microphone state.');
    }
  }, [appendHarmonyInteraction, voiceMuted, voiceSessionState]);

  useEffect(() => {
    if (typeof window === 'undefined' || voiceSessionState !== 'connected') {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key.toLowerCase() !== 'm') return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      event.preventDefault();
      void toggleVoiceMute();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleVoiceMute, voiceSessionState]);

  startVoiceSessionRef.current = startVoiceSession;
  stopVoiceSessionRef.current = stopVoiceSession;

  useEffect(() => {
    return () => {
      roomRef.current?.disconnect();
      roomRef.current = null;
      clearVoiceAudioElements();
      voiceLastActivityAtRef.current = null;
      if (voiceAgentJoinTimeoutRef.current !== null) {
        window.clearTimeout(voiceAgentJoinTimeoutRef.current);
        voiceAgentJoinTimeoutRef.current = null;
      }
      if (localTranscriptRecognitionRef.current) {
        localTranscriptRecognitionRef.current.onend = null;
        localTranscriptRecognitionRef.current.stop();
        localTranscriptRecognitionRef.current = null;
      }
      setVoiceAgentSpeaking(false);
      setVoiceWaveEnergy(0.08);
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTopCardPulse(false);
    }, 8_000);
    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (voiceSessionState !== 'connected') return;
    const interval = window.setInterval(() => {
      const lastActivity = voiceLastActivityAtRef.current;
      if (!lastActivity) return;
      const idleMs = Date.now() - lastActivity;
      if (idleMs >= VOICE_IDLE_TIMEOUT_MS) {
        stopVoiceSessionRef.current?.('idle');
      }
    }, 5_000);
    return () => {
      window.clearInterval(interval);
    };
  }, [voiceSessionState]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!wakeWordEnabled) {
      if (wakeWordRecognitionRef.current) {
        wakeWordRecognitionRef.current.onend = null;
        wakeWordRecognitionRef.current.stop();
        wakeWordRecognitionRef.current = null;
      }
      setWakeWordStatus('off');
      setWakeWordError(null);
      return;
    }

    const SpeechRecognitionCtor = (
      window as unknown as {
        SpeechRecognition?: typeof SpeechRecognition;
        webkitSpeechRecognition?: typeof SpeechRecognition;
      }
    ).SpeechRecognition ??
      (
        window as unknown as {
          webkitSpeechRecognition?: typeof SpeechRecognition;
        }
      ).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setWakeWordStatus('unsupported');
      setWakeWordError('Wake word needs Chrome/Safari speech recognition support.');
      return;
    }

    let active = true;
    const recognition = new SpeechRecognitionCtor();
    wakeWordRecognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onstart = () => {
      if (!active) return;
      setWakeWordStatus('listening');
      setWakeWordError(null);
    };
    recognition.onerror = event => {
      if (!active) return;
      setWakeWordError(event.error || 'Wake word listener error.');
    };
    recognition.onresult = event => {
      if (!active) return;
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        if (!event.results[i].isFinal) continue;
        const rawTranscript = event.results[i][0]?.transcript;
        if (typeof rawTranscript !== 'string') continue;
        const transcript = rawTranscript.toLowerCase().trim();
        if (!transcript) continue;
        if (typeof transcript === 'string' && transcript.includes(WAKE_WORD_PHRASE)) {
          setWakeWordLastHeard(new Date().toLocaleTimeString());
          appendHarmonyInteraction('You', 'Hey Harmony');
          if (voiceSessionState === 'idle') {
            void startVoiceSessionRef.current?.();
          }
        }
      }
    };
    recognition.onend = () => {
      if (!active || !wakeWordEnabled) return;
      try {
        recognition.start();
      } catch {
        // no-op
      }
    };

    try {
      recognition.start();
    } catch {
      setWakeWordError('Could not start wake word listener. Check microphone permission.');
    }

    return () => {
      active = false;
      if (wakeWordRecognitionRef.current) {
        wakeWordRecognitionRef.current.onend = null;
        wakeWordRecognitionRef.current.stop();
        wakeWordRecognitionRef.current = null;
      }
      setWakeWordStatus('off');
    };
  }, [appendHarmonyInteraction, wakeWordEnabled, voiceSessionState]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (voiceSessionState !== 'connected' || voiceMuted) {
      if (localTranscriptRecognitionRef.current) {
        localTranscriptRecognitionRef.current.onend = null;
        localTranscriptRecognitionRef.current.stop();
        localTranscriptRecognitionRef.current = null;
      }
      return;
    }

    const SpeechRecognitionCtor = (
      window as unknown as {
        SpeechRecognition?: typeof SpeechRecognition;
        webkitSpeechRecognition?: typeof SpeechRecognition;
      }
    ).SpeechRecognition ??
      (
        window as unknown as {
          webkitSpeechRecognition?: typeof SpeechRecognition;
        }
      ).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) return;

    let active = true;
    const recognition = new SpeechRecognitionCtor();
    localTranscriptRecognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = event => {
      if (!active) return;
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (!result) continue;
        const transcript = result[0]?.transcript?.trim();
        if (!transcript) continue;
        if (!result.isFinal) continue;
        maybeSetHarmonyDebug(previous => ({
          ...previous,
          localFinalResults: previous.localFinalResults + 1,
          lastLocalText: transcript.slice(0, 120),
        }));
      }
    };
    recognition.onend = () => {
      if (!active || voiceSessionState !== 'connected' || voiceMuted) return;
      try {
        recognition.start();
      } catch {
        // no-op
      }
    };

    try {
      recognition.start();
    } catch {
      // no-op
    }

    return () => {
      active = false;
      if (localTranscriptRecognitionRef.current) {
        localTranscriptRecognitionRef.current.onend = null;
        localTranscriptRecognitionRef.current.stop();
        localTranscriptRecognitionRef.current = null;
      }
    };
  }, [maybeSetHarmonyDebug, voiceMuted, voiceSessionState]);

  const savePrepStore = (next: typeof prepByStudent) => {
    setPrepByStudent(next);
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('sm_lesson_prep', JSON.stringify(next));
  };

  const openPrepModal = (student: StudentRecord) => {
    setPrepStudent(student);
    const existing = prepByStudent[student.id];
    if (existing && existing.dateKey === selectedDayKey) {
      setPrepForm({
        curriculumType: existing.curriculumType ?? '',
        section: existing.section ?? '',
        part: existing.part ?? '',
        material: existing.material ?? '',
        focus: existing.focus,
        materials: existing.materials,
        goal: existing.goal,
        warmup: existing.warmup,
        notes: existing.notes,
      });
    } else {
      setPrepForm({
        curriculumType: '',
        section: '',
        part: '',
        material: '',
        focus: '',
        materials: '',
        goal: '',
        warmup: '',
        notes: '',
      });
    }
    setIsPrepOpen(true);
  };

  const closePrepModal = () => {
    setIsPrepOpen(false);
    setPrepStudent(null);
  };

  const handlePrepSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!prepStudent) return;
    const next = {
      ...prepByStudent,
      [prepStudent.id]: {
        dateKey: selectedDayKey,
        curriculumType: prepForm.curriculumType.trim(),
        section: prepForm.section.trim(),
        part: prepForm.part.trim(),
        material: prepForm.material.trim(),
        focus: prepForm.focus.trim(),
        materials: prepForm.materials.trim(),
        goal: prepForm.goal.trim(),
        warmup: prepForm.warmup.trim(),
        notes: prepForm.notes.trim(),
      },
    };
    savePrepStore(next);
    closePrepModal();
  };

  const clampHarmonyPanel = (x: number, y: number) => {
    if (typeof window === 'undefined') return { x, y };
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

  const handleHarmonyPanelPointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (voiceSessionState !== 'connected') return;
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
  };

  const handleHarmonyPanelPointerMove = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    const dragState = harmonyDragRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    const next = clampHarmonyPanel(
      dragState.originX + deltaX,
      dragState.originY + deltaY,
    );
    setHarmonyPanelPosition(next);
  };

  const handleHarmonyPanelPointerUp = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (harmonyDragRef.current?.pointerId === event.pointerId) {
      harmonyDragRef.current = null;
      setHarmonyPanelDragging(false);
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <header>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
            Teachers
          </p>
          <h1 className="text-3xl font-semibold text-[var(--c-1f1f1d)] mt-2">
            Dashboard
          </h1>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            Your studio snapshot, schedule, and fees in one place.
          </p>
        </header>
        <div className="ml-auto flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-stretch lg:justify-end lg:self-start">
          <div
            className={`h-full rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 pt-2 pb-0.5 shadow-sm select-none lg:h-[108px] ${
              topCardPulse ? 'sidebar-card-pulse' : ''
            }`}
          >
            <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
              Local Time
            </p>
            <p className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
              {localTime}
            </p>
            <p className="mt-1 text-xs text-[var(--c-6f6c65)]">{localDate}</p>
          </div>
          <HarmonyAssistant
            participantName={teacherName ?? 'Teacher'}
            identityPrefix={teacherName ?? teacherId ?? 'teacher'}
            className="h-full lg:h-[108px]"
            cardClassName={
              topCardPulse
                ? 'sidebar-card-pulse h-full lg:h-[108px]'
                : 'h-full lg:h-[108px]'
            }
            compactButtons
          />
        </div>
      </div>
      {alertPayloads.length > 0 ? (
        <div className="space-y-3">
          {alertPayloads.map(alert => (
            <div
              key={alert.id ?? `${alert.title}-${alert.body}`}
              className={`rounded-2xl border px-5 py-4 text-[15px] shadow-[0_12px_30px_-24px_rgba(0,0,0,0.35)] ${getAlertStyles(alert.color)}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em]">
                    {alert.title}
                  </p>
                  <p className="mt-2 text-[17px] font-semibold text-[var(--c-1f1f1d)]">
                    {alert.body}
                  </p>
                </div>
                {alert.persistence === 'persist' ? (
                  <button
                    type="button"
                    onClick={() => dismissAlert(alert.id)}
                    className="rounded-full border border-black/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em]"
                  >
                    Dismiss
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_0.6fr] lg:items-start">
        <div className="space-y-4">
          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-white p-5 shadow-sm [[data-theme=dark]_&]:bg-[var(--c-e7eddc)]/60">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
              Lessons
            </p>
            <p className="mt-3 text-3xl font-semibold text-[var(--c-1f1f1d)]">
              {sortedSelectedLessons.length}
            </p>
            <p className="mt-1 text-sm text-[var(--c-6f6c65)]">
              Scheduled for {selectedDayFullSentence}.
            </p>
            <div className="mt-4 space-y-2 text-sm text-[var(--c-3a3935)]">
              {sortedSelectedLessons.length > 0 ? (
                sortedSelectedLessons.map(student => {
                  const prepRecord = prepByStudent[student.id];
                  const isPrepared = prepRecord?.dateKey === selectedDayKey;
                  const hasPrepData = Boolean(
                    prepRecord &&
                      (prepRecord.curriculumType?.trim() ||
                        prepRecord.section?.trim() ||
                        prepRecord.part?.trim() ||
                        prepRecord.material?.trim() ||
                        prepRecord.focus?.trim() ||
                        prepRecord.materials?.trim() ||
                        prepRecord.goal?.trim() ||
                        prepRecord.warmup?.trim() ||
                        prepRecord.notes?.trim()),
                  );
                  const isUnpaidForMonth = !paymentStatus[student.id];
                  return (
                    <div
                      key={student.id}
                      className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 shadow-[0_12px_24px_-18px_rgba(15,15,15,0.3)] ${
                        hasPrepData
                          ? 'border-[var(--c-e5e3dd)] bg-[var(--c-e7eddc)]'
                          : 'border-[var(--c-dfe6d2)] bg-[var(--c-e7eddc)]/75'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-full border shadow-sm ${
                            isPrepared
                              ? 'border-[color:rgba(31,41,55,0.2)] bg-[var(--c-1f1f1d)] text-[var(--c-ffffff)]'
                              : 'border-[var(--c-e5e3dd)] bg-[var(--c-f7f7f5)] text-[var(--c-9a9892)]'
                          }`}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                            className="h-4 w-4"
                          >
                            <path
                              d="M20 6L9 17l-5-5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        <div className="flex flex-col">
                          <span className="font-medium text-[var(--c-1f1f1d)]">
                            {student.name}
                          </span>
                          {hasPrepData && prepRecord ? (
                            <div className="mt-2 space-y-2">
                              {prepRecord.curriculumType?.trim() &&
                              prepRecord.section?.trim() ? (
                                <p className="text-[13px] text-[var(--c-6f6c65)]">
                                  <span className="uppercase tracking-[0.2em] text-[11px] text-[var(--c-9a9892)]">
                                    Curriculum
                                  </span>{' '}
                                  <span className="text-[var(--c-1f1f1d)]">
                                    {prepRecord.curriculumType} · {prepRecord.section}
                                  </span>
                                </p>
                              ) : null}
                              {prepRecord.part?.trim() || prepRecord.material?.trim() ? (
                                <p className="text-[13px] text-[var(--c-6f6c65)]">
                                  <span className="uppercase tracking-[0.2em] text-[11px] text-[var(--c-9a9892)]">
                                    Progress
                                  </span>{' '}
                                  <span className="text-[var(--c-1f1f1d)]">
                                    {[
                                      prepRecord.part?.trim()
                                        ? `Part ${prepRecord.part.trim()}`
                                        : null,
                                      prepRecord.material?.trim()
                                        ? `Material: ${prepRecord.material.trim()}`
                                        : null,
                                    ]
                                      .filter(Boolean)
                                      .join(' · ')}
                                  </span>
                                </p>
                              ) : null}
                              <div className="flex flex-wrap gap-2">
                                {[
                                  prepRecord.focus
                                    ? { label: 'Focus', value: prepRecord.focus }
                                    : null,
                                  prepRecord.materials
                                    ? {
                                        label: 'Materials',
                                        value: prepRecord.materials,
                                      }
                                    : null,
                                  prepRecord.goal
                                    ? { label: 'Goal', value: prepRecord.goal }
                                    : null,
                                  prepRecord.warmup
                                    ? {
                                        label: 'Warm-up',
                                        value: prepRecord.warmup,
                                      }
                                    : null,
                                ]
                                  .filter(Boolean)
                                  .map(item => (
                                    <span
                                      key={item?.label}
                                      className="inline-flex items-center gap-2 rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)]/90 px-3.5 py-2 text-[14px] shadow-sm"
                                    >
                                      <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                                        {item?.label}
                                      </span>
                                      <span className="text-[var(--c-1f1f1d)]">
                                        {item?.value}
                                      </span>
                                    </span>
                                  ))}
                              </div>
                              {prepRecord.notes ? (
                                <div className="flex flex-wrap gap-2">
                                  <span className="inline-flex items-center gap-2 rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)]/90 px-3.5 py-2 text-[14px] shadow-sm">
                                    <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                                      Notes
                                    </span>
                                    <span className="text-[var(--c-1f1f1d)]">
                                      {prepRecord.notes}
                                    </span>
                                  </span>
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {isUnpaidForMonth ? (
                          <span className="rounded-full bg-[var(--c-fce8d6)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-8a5b2b)]">
                            Unpaid
                          </span>
                        ) : null}
                        <span className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                          {student.lessonTime ?? 'TBD'}
                        </span>
                        <button
                          type="button"
                          onClick={() => openPrepModal(student)}
                          className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
                        >
                          Prep
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-[var(--c-6f6c65)]">
                  No lessons scheduled for {selectedDayLabel}.
                </p>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-e7eddc)]/70 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                Upcoming
              </p>
              <span className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                Next 2 days
              </span>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-white p-4 [[data-theme=dark]_&]:bg-[var(--c-fcfcfb)]">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                  {nextDayFullLabel}
                </p>
                <p className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                  {sortedNextDayLessons.length}
                </p>
                <div className="mt-3 space-y-2">
                  {sortedNextDayLessons.length > 0 ? (
                    sortedNextDayLessons.slice(0, 4).map(student => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-e7eddc)]/65 px-3 py-2 text-xs text-[var(--c-6f6c65)]"
                      >
                        <span className="font-medium text-[var(--c-1f1f1d)]">
                          {student.name}
                        </span>
                        <span className="uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                          {student.lessonTime ?? 'TBD'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[var(--c-6f6c65)]">
                      No lessons scheduled.
                    </p>
                  )}
                </div>
              </div>
              <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-white p-4 [[data-theme=dark]_&]:bg-[var(--c-fcfcfb)]">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                  {nextNextDayFullLabel}
                </p>
                <p className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                  {sortedNextNextDayLessons.length}
                </p>
                <div className="mt-3 space-y-2">
                  {sortedNextNextDayLessons.length > 0 ? (
                    sortedNextNextDayLessons.slice(0, 4).map(student => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-xs text-[var(--c-6f6c65)]"
                      >
                        <span className="font-medium text-[var(--c-1f1f1d)]">
                          {student.name}
                        </span>
                        <span className="uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                          {student.lessonTime ?? 'TBD'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[var(--c-6f6c65)]">
                      No lessons scheduled.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          {lastViewedVideo ? (
            <LastViewedVideoCard data={lastViewedVideo} />
          ) : null}
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-3 shadow-sm">
            <button
              type="button"
              onClick={() =>
                setSelectedDay(current => {
                  const next = new Date(current);
                  next.setDate(current.getDate() - 1);
                  return next;
                })
              }
              className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
            >
              Back
            </button>
            <span className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
              {selectedDayFullLabel}
            </span>
            <button
              type="button"
              onClick={() =>
                setSelectedDay(current => {
                  const next = new Date(current);
                  next.setDate(current.getDate() + 1);
                  return next;
                })
              }
              className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
            >
              Next
            </button>
          </div>
          {isCompanyViewer && viewingAs ? (
            <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                Viewing As
              </p>
              <p className="mt-3 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                {viewingAs}
              </p>
              <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                Company view of this teacher&apos;s dashboard.
              </p>
            </div>
          ) : null}
          {studio ? (
            <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                  Studio Account
                </p>
                <span className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-fcfcfb)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  {currentTeacher?.id === studio.adminTeacherId
                    ? 'Owner'
                    : 'Teacher'}
                </span>
              </div>
              <p className="mt-3 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                {studio.name}
              </p>
              <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                {studioTeachers.length} teachers · {studio.location ?? 'Location TBD'}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {studioTeachers.map(teacher => (
                  <span
                    key={teacher.id}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-fcfcfb)] px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
                  >
                    {teacher.name}
                    {teacher.id === studio.adminTeacherId ? ' · Admin' : ''}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <a
                  href="/studios/dashboard"
                  className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
                >
                  Open Studio
                </a>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                  {currentTeacher?.id === studio.adminTeacherId
                    ? 'Admin access'
                    : 'Studio access'}
                </span>
              </div>
            </div>
          ) : null}
          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
              Next Student
            </p>
            {nextStudent ? (
              <>
                <p className="mt-3 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                  {nextStudent.name}
                </p>
                <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                  {nextStudent.lessonTime ?? 'Time TBD'} ·{' '}
                  {nextStudent.lessonType ?? 'Lesson'} ·{' '}
                  {nextStudent.level ?? 'Level'}
                </p>
              </>
            ) : (
              <>
                <p className="mt-3 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                  No upcoming lesson
                </p>
                <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                  You&apos;re clear for {selectedDayLabel}.
                </p>
              </>
            )}
          </div>
          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                Students Online
              </p>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                {onlineStudents.length} Online
              </span>
            </div>
            {onlineStudents.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {onlineStudents.slice(0, 6).map(student => (
                  <a
                    key={student.id}
                    href={`/teachers/messages?thread=student:${student.id}|teacher:${teacherId ?? ''}`}
                    className="rounded-2xl border border-[color:rgba(16,185,129,0.35)] bg-[color:rgba(16,185,129,0.08)] px-3 py-2 text-[11px] text-[color:rgb(16,185,129)] transition hover:border-[color:rgba(16,185,129,0.6)] hover:bg-[color:rgba(16,185,129,0.15)]"
                  >
                    <p className="text-[12px] font-semibold text-[color:rgb(16,185,129)]">
                      {student.name}
                    </p>
                    <p className="mt-1 text-[12px] text-[var(--c-6f6c65)]">
                      {student.activity?.label ?? 'Active now'}
                      {student.activity?.detail
                        ? ` · ${student.activity.detail}`
                        : ''}
                    </p>
                  </a>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-[var(--c-6f6c65)]">
                No students online right now.
              </p>
            )}
          </div>
          <StudentPromoCard
            title="Jazz Colors: Teacher Edition"
            body="Quick coaching ideas, voicing tips, and a groove-first approach to keep students smiling."
            ctaLabel="View Lesson Pack Details"
            ctaHref="/teachers?mode=training"
          />
          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                Communications
              </p>
              <a
                href="/teachers/communications"
                className="text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)] hover:text-[var(--c-c8102e)]"
              >
                View
              </a>
            </div>
            <a href="/teachers/communications" className="mt-3 block">
              <p className="text-2xl font-semibold text-[var(--c-1f1f1d)]">
                {communications.length}
              </p>
              <p className="mt-1 text-sm text-[var(--c-6f6c65)]">
                Shared updates
              </p>
            </a>
            <a
              href="/teachers/communications"
              className="mt-4 block rounded-2xl border border-[var(--c-e5e3dd)] bg-[var(--c-fcfcfb)] px-4 py-3"
            >
              {communications[0] ? (
                <>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                    Latest
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--c-1f1f1d)]">
                    {communications[0].title}
                  </p>
                  <p className="mt-1 text-xs text-[var(--c-6f6c65)] line-clamp-2">
                    {communications[0].body}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={event => {
                        event.preventDefault();
                        event.stopPropagation();
                        setCommunicationsViewerOpen(true);
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-[var(--c-e5e3dd)] bg-white px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)] [[data-theme=dark]_&]:border-[var(--c-ecebe7)] [[data-theme=dark]_&]:bg-[var(--c-f1f1ef)] [[data-theme=dark]_&]:text-[var(--c-7a776f)]"
                    >
                      Viewed By
                      <span className="rounded-full bg-[var(--c-e7eddc)] px-2 py-1 text-[10px] font-semibold text-[var(--c-3a3935)] [[data-theme=dark]_&]:bg-[var(--c-2d6a4f)]/20 [[data-theme=dark]_&]:text-[var(--c-2d6a4f)]">
                        {communicationsViewedBy.length}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={event => {
                        event.preventDefault();
                        event.stopPropagation();
                        setCommunicationsViewerOpen(true);
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-[var(--c-e5e3dd)] bg-white px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)] [[data-theme=dark]_&]:border-[var(--c-ecebe7)] [[data-theme=dark]_&]:bg-[var(--c-f1f1ef)] [[data-theme=dark]_&]:text-[var(--c-7a776f)]"
                    >
                      Not Seen By
                      <span className="rounded-full bg-[var(--c-fce8d6)] px-2 py-1 text-[10px] font-semibold text-[var(--c-8a5b2b)] [[data-theme=dark]_&]:bg-[var(--c-7a4a17)]/20 [[data-theme=dark]_&]:text-[var(--c-7a4a17)]">
                        {communicationsNotSeenBy.length}
                      </span>
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-xs text-[var(--c-9a9892)]">
                  No communications posted yet.
                </p>
              )}
            </a>
          </div>
          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                Messages
              </p>
              <a
                href="/teachers/messages"
                className="text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)] hover:text-[var(--c-c8102e)]"
              >
                View
              </a>
            </div>
            <a href="/teachers/messages" className="mt-3 block">
              <p className="text-2xl font-semibold text-[var(--c-1f1f1d)]">
                {unreadCount}
              </p>
              <p className="mt-1 text-sm text-[var(--c-6f6c65)]">
                Unread messages
              </p>
            </a>
            <div className="mt-4 flex flex-wrap gap-2">
              {recentSenders.length === 0 ? (
                <span className="text-xs text-[var(--c-9a9892)]">
                  No recent senders.
                </span>
              ) : (
                recentSenders.map(sender => (
                  <a
                    key={sender.threadId}
                    href={`/teachers/messages?thread=${encodeURIComponent(
                      sender.threadId,
                    )}`}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-fcfcfb)] px-4 py-2 text-sm text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
                  >
                    {sender.label}
                    {sender.unreadCount > 0 ? (
                      <span className="rounded-full bg-[var(--c-c8102e)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                        {sender.unreadCount}
                      </span>
                    ) : null}
                  </a>
                ))
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
              Students Unpaid
            </p>
            <p className="mt-3 text-2xl font-semibold text-[var(--c-1f1f1d)]">
              {unpaidCount}
            </p>
            <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
              {unpaidCount === 0
                ? 'Everyone is caught up.'
                : 'Follow up before month-end.'}
            </p>
          </div>
        </div>
      </section>

      <LessonPrepModal
        isOpen={isPrepOpen}
        studentName={prepStudent?.name ?? null}
        prepForm={prepForm}
        setPrepForm={setPrepForm}
        onClose={closePrepModal}
        onSubmit={handlePrepSubmit}
      />

      {communicationsViewerOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setCommunicationsViewerOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                  Communications
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                  Latest Audience
                </h2>
                <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                  Latest post: {communications[0]?.title ?? 'No message'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCommunicationsViewerOpen(false)}
                className="rounded-full border border-[var(--c-ecebe7)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
              >
                Close
              </button>
            </div>
            <div className="mt-6 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                  Viewed By ({communicationsViewedBy.length})
                </p>
                <div className="mt-2 space-y-2">
                  {communicationsViewedBy.map(person => (
                    <div
                      key={person}
                      className="flex items-center justify-between rounded-2xl border border-[var(--c-e5e3dd)] bg-[var(--c-fcfcfb)] px-4 py-3 text-sm text-[var(--c-3a3935)]"
                    >
                      <span className="font-medium text-[var(--c-1f1f1d)]">
                        {person}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                        Viewed
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                  Not Seen By ({communicationsNotSeenBy.length})
                </p>
                <div className="mt-2 space-y-2">
                  {communicationsNotSeenBy.map(person => (
                    <div
                      key={person}
                      className="flex items-center justify-between rounded-2xl border border-[var(--c-e5e3dd)] bg-[var(--c-fcfcfb)] px-4 py-3 text-sm text-[var(--c-3a3935)]"
                    >
                      <span className="font-medium text-[var(--c-1f1f1d)]">
                        {person}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                        Not seen
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    {isPromoOpen && promoPayload ? (
      <div className="fixed inset-0 z-50 flex h-screen w-screen items-center justify-center px-4">
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setIsPromoOpen(false)}
        />
          <div className="relative w-full max-w-lg rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-xl">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
              Studio Update
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
              {promoPayload.title}
            </h2>
            <p className="mt-3 text-base text-[var(--c-6f6c65)]">
              {promoPayload.body}
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setIsPromoOpen(false)}
                className="w-full rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)] transition hover:brightness-110"
              >
                {promoPayload.cta ?? 'GOT IT'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
