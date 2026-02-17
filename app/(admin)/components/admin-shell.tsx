'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  AUTH_STORAGE_KEY,
  VIEW_TEACHER_STORAGE_KEY,
  VIEW_STUDENT_STORAGE_KEY,
  VIEW_ROLE_STORAGE_KEY,
  allowedRoots,
  navItems,
  roleHome,
  type AuthUser,
  type UserRole,
} from './auth';
import {
  normalizeTheme,
  THEME_STORAGE_KEY,
  type ThemeMode,
} from '../../components/theme';
import {
  COMMUNICATIONS_UPDATE_EVENT,
  readCommunications,
  type CommunicationEntry,
} from './communications-store';
import { useApiData } from './use-api-data';
import { useLessonData } from './use-lesson-data';

type TeacherRecord = {
  id: string;
  company: string;
  username?: string;
  name: string;
  email: string;
  region: string;
  status:
    | 'Licensed'
    | 'Certified'
    | 'Advanced'
    | 'Master'
    | 'Onboarding'
    | 'Interested'
    | 'Inactive'
    | 'Active';
};

type StudentRecord = {
  id: string;
  teacher: string;
  name: string;
  email: string;
  status: 'Active' | 'Paused' | 'Archived';
};

type ParentRecord = {
  id: string;
  username: string;
  name: string;
  email: string;
  students: string[];
};

type SelectedTeacher = {
  id: string;
  name: string;
  username: string;
};

type SelectedStudent = {
  id: string;
  name: string;
  email?: string;
};

type NotificationMessage = {
  id: string;
  kind?: 'message' | 'notification';
  kicker?: string;
  sender: string;
  text: string;
  subject?: string;
  threadId: string;
  timestamp: string;
  route?: string;
  leaving?: boolean;
};

type NotificationEvent = {
  id: string;
  type: 'email' | 'push';
  to: string;
  source?: string;
  subject?: string;
  title?: string;
  body: string;
  createdAt: string;
  data?: Record<string, unknown> | null;
};

const RECENT_TEACHERS_KEY = 'sm_recent_teachers';
const RECENT_STUDENTS_KEY = 'sm_recent_students';
const MESSAGE_NOTIFICATIONS_KEY = 'sm_message_notifications';
const COMMUNICATIONS_NOTIFICATIONS_KEY = 'sm_communications_notifications';
const ADMIN_PUSH_NOTIFICATIONS_KEY = 'sm_admin_push_notifications';
const FEATURES_OVERVIEW_KEY = 'sm_features_overview_active';
const SIDEBAR_HIDDEN_KEY = 'sm_sidebar_hidden';
const PRACTICE_TIMER_SETTINGS_KEY = 'sm_practice_timer_settings';
const PRACTICE_TIMER_STATE_KEY = 'sm_practice_timer_state';
const PRACTICE_TIMER_SESSIONS_KEY = 'sm_practice_timer_sessions';
const METRONOME_SETTINGS_KEY = 'sm_metronome_settings';

const METRONOME_PRESETS = [
  {
    id: 'dreams-come-true',
    name: 'Dreams Come True',
    shortLabel: 'Dreams',
    tempo: 105,
    timeSig: '4/4',
  },
  {
    id: 'night-storm',
    name: 'Night Storm',
    shortLabel: 'Night Storm',
    tempo: 122,
    timeSig: '4/4',
  },
  {
    id: 'alma-mater-blues',
    name: 'Alma Mater Blues',
    shortLabel: 'Alma Blues',
    tempo: 117,
    timeSig: '4/4',
  },
] as const;

type MetronomePreset = (typeof METRONOME_PRESETS)[number];
const normalizeTeacherStatus = (
  status:
    | 'Licensed'
    | 'Certified'
    | 'Advanced'
    | 'Master'
    | 'Onboarding'
    | 'Interested'
    | 'Inactive'
    | 'Active',
) => (status === 'Active' ? 'Licensed' : status);

type AdminShellProps = {
  children: React.ReactNode;
};

type PracticeSession = {
  id: string;
  duration: number;
  completedAt: string;
};

type MetronomePresetDropdownProps = {
  value: MetronomePreset | null;
  onSelect: (preset: MetronomePreset) => void;
};

function MetronomePresetDropdown({ value, onSelect }: MetronomePresetDropdownProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (event.target instanceof Node && wrapperRef.current.contains(event.target)) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(current => !current)}
        aria-expanded={open}
        className="w-full rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-left"
      >
        <span className="block text-xs uppercase tracking-[0.2em] text-[var(--c-3a3935)]">
          {value?.name ?? 'Song Presets'}
        </span>
        <span className="mt-1 block text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
          {value ? `${value.tempo} BPM · ${value.timeSig}` : 'Choose a song'}
        </span>
      </button>
      {open ? (
        <div className="absolute left-0 right-0 z-40 mt-2 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-1 shadow-lg">
          {METRONOME_PRESETS.map(preset => {
            const isSelected = value?.id === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  onSelect(preset);
                  setOpen(false);
                }}
                className={`w-full rounded-lg px-3 py-2 text-left transition ${
                  isSelected
                    ? 'bg-[var(--c-f7fbf0)] text-[var(--c-3f4a2c)]'
                    : 'text-[var(--c-3a3935)] hover:bg-[var(--c-f8f7f4)]'
                }`}
              >
                <span className="block text-xs font-semibold uppercase tracking-[0.2em]">
                  {preset.name}
                </span>
                <span className="mt-1 block text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  {preset.tempo} BPM · {preset.timeSig}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default function AdminShell({ children }: AdminShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: teachersData } = useApiData<{ teachers: TeacherRecord[] }>(
    '/api/teachers',
    { teachers: [] },
  );
  const { data: studentsData } = useApiData<{ students: StudentRecord[] }>(
    '/api/students',
    { students: [] },
  );
  const { data: parentsData } = useApiData<{ parents: ParentRecord[] }>(
    '/api/parents',
    { parents: [] },
  );
  const { lessonParts } = useLessonData();
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [viewRole, setViewRole] = useState<UserRole | null>(null);
  const [pendingViewRole, setPendingViewRole] = useState<UserRole | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [featuresOverviewActive, setFeaturesOverviewActive] = useState(false);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [selectedTeacher, setSelectedTeacher] =
    useState<SelectedTeacher | null>(null);
  const [recentTeachers, setRecentTeachers] = useState<SelectedTeacher[]>([]);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [selectedStudent, setSelectedStudent] =
    useState<SelectedStudent | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null,
  );
  const [recentStudentIds, setRecentStudentIds] = useState<string[]>([]);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [accountInfo, setAccountInfo] = useState<{
    name: string;
    email: string;
    goesBy?: string;
    status: string;
    lastLogin: string | null;
  } | null>(null);
  const [pipState, setPipState] = useState<{
    open: boolean;
    playing: boolean;
    material: string | null;
    part: string | null;
    materials: string[];
  }>({
    open: false,
    playing: false,
    material: null,
    part: null,
    materials: [],
  });
  const [pipDock, setPipDock] = useState<
    'left-bottom' | 'right-bottom' | 'right-top'
  >('right-bottom');
  const showLessonRoomCta =
    pathname === '/teachers/dashboard' || pathname === '/students/dashboard';
  const backToTopOpacity = Math.min(1, Math.max(0, (scrollY - 80) / 240));
  const handleBackToTop = useCallback(() => {
    const startY = window.scrollY;
    const duration = 1400;
    const startTime = performance.now();
    const easeOutExpo = (t: number) =>
      t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

    const tick = (now: number) => {
      const elapsed = Math.min(1, (now - startTime) / duration);
      const eased = easeOutExpo(elapsed);
      window.scrollTo(0, Math.round(startY * (1 - eased)));
      if (elapsed < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const nextScrollY = window.scrollY;
      setScrollY(nextScrollY);
      setShowBackToTop(nextScrollY > 40);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const pipSwipeRef = useRef<{
    active: boolean;
    pointerId: number | null;
    startX: number;
    startY: number;
    startTime: number;
  }>({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    startTime: 0,
  });
  const [isPipExpanded, setIsPipExpanded] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountForm, setAccountForm] = useState({
    name: '',
    email: '',
    goesBy: '',
    password: '',
  });
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const [practiceMinutes, setPracticeMinutes] = useState(20);
  const [practiceSoundEnabled, setPracticeSoundEnabled] = useState(true);
  const [practiceRemaining, setPracticeRemaining] = useState(20 * 60);
  const [practiceRunning, setPracticeRunning] = useState(false);
  const [practiceSessions, setPracticeSessions] = useState<PracticeSession[]>([]);
  const practiceTickRef = useRef<number | null>(null);
  const practiceLastUpdateRef = useRef<number>(Date.now());
  const practiceLastCompletionRef = useRef<number | null>(null);
  const [metronomeOpen, setMetronomeOpen] = useState(false);
  const [metronomeTempo, setMetronomeTempo] = useState(84);
  const [metronomeTimeSig, setMetronomeTimeSig] = useState<'4/4' | '3/4' | '2/4'>(
    '4/4',
  );
  const [metronomeAccent, setMetronomeAccent] = useState(true);
  const [metronomeRunning, setMetronomeRunning] = useState(false);
  const metronomeBeatRef = useRef(1);
  const metronomeIntervalRef = useRef<number | null>(null);
  const metronomeAudioRef = useRef<AudioContext | null>(null);
  const [hoveredNotifications, setHoveredNotifications] = useState<
    Record<string, boolean>
  >({});
  const notificationTimers = useRef<Record<string, number>>({});
  const effectiveRole =
    role === 'company'
      ? viewRole ?? role
      : role === 'teacher'
        ? viewRole ?? role
        : role;
  const sidebarRoleLabel =
    (effectiveRole === 'company' && 'Admin') ||
    (effectiveRole === 'studio' && 'Studio') ||
    (effectiveRole === 'teacher' && 'Teacher') ||
    (effectiveRole === 'parent' && 'Parent') ||
    (effectiveRole === 'student' && 'Student') ||
    'Admin';
  const isStudentSidebar =
    effectiveRole === 'student' || pathname?.startsWith('/students');
  const isParentSidebar =
    effectiveRole === 'parent' || pathname?.startsWith('/parents');
  const parentRecord = useMemo(() => {
    const parentsList = (parentsData.parents as ParentRecord[]) ?? [];
    if (!parentsList.length) return null;
    const normalized = user?.username?.toLowerCase();
    if (normalized) {
      const match = parentsList.find(
        parent => parent.username.toLowerCase() === normalized,
      );
      if (match) return match;
    }
    return parentsList[0] ?? null;
  }, [parentsData, user?.username]);
  const parentStudents = useMemo(() => {
    if (!parentRecord) return [] as StudentRecord[];
    const studentsList = studentsData.students as StudentRecord[];
    return parentRecord.students
      .map(id => studentsList.find(student => student.id === id))
      .filter((student): student is StudentRecord => Boolean(student));
  }, [parentRecord, studentsData]);
  const parentPracticeSummary = useMemo(
    () =>
      parentStudents.map((student, index) => ({
        name: student.name,
        minutes: 40 + index * 20,
        goal: 90,
      })),
    [parentStudents],
  );
  const parentPracticeSessions = useMemo(
    () =>
      parentStudents.flatMap((student, index) => [
        {
          id: `${student.id}-session-1`,
          name: student.name,
          minutes: 25 + index * 10,
          time: 'Today · 4:15 PM',
        },
        {
          id: `${student.id}-session-2`,
          name: student.name,
          minutes: 20 + index * 8,
          time: 'Yesterday · 6:05 PM',
        },
      ]),
    [parentStudents],
  );
  const recentTeachersKey = useMemo(() => {
    if (!user?.username) return RECENT_TEACHERS_KEY;
    return `${RECENT_TEACHERS_KEY}:${user.username}`;
  }, [user?.username]);
  const viewTeacherKey = useMemo(() => {
    if (!user?.username) return VIEW_TEACHER_STORAGE_KEY;
    return `${VIEW_TEACHER_STORAGE_KEY}:${user.username}`;
  }, [user?.username]);
  const viewStudentKey = useMemo(() => {
    if (!user?.username) return VIEW_STUDENT_STORAGE_KEY;
    if (role === 'company' && selectedTeacher?.username) {
      return `${VIEW_STUDENT_STORAGE_KEY}:${user.username}:${selectedTeacher.username}`;
    }
    return `${VIEW_STUDENT_STORAGE_KEY}:${user.username}`;
  }, [role, selectedTeacher?.username, user?.username]);
  const selectedStudentKey = useMemo(() => {
    if (!user?.username) return null;
    if (role === 'company' && selectedTeacher?.username) {
      return `sm_selected_student:${user.username}:${selectedTeacher.username}`;
    }
    return `sm_selected_student:${user.username}:${user.username}`;
  }, [role, selectedTeacher?.username, user?.username]);
  const practiceSettingsKey = useMemo(() => {
    if (!user?.username) return PRACTICE_TIMER_SETTINGS_KEY;
    return `${PRACTICE_TIMER_SETTINGS_KEY}:${user.username}`;
  }, [user?.username]);
  const sidebarHiddenKey = useMemo(() => {
    if (!effectiveRole) return null;
    if (!user?.username) return `${SIDEBAR_HIDDEN_KEY}:${effectiveRole}`;
    return `${SIDEBAR_HIDDEN_KEY}:${user.username}:${effectiveRole}`;
  }, [effectiveRole, user?.username]);
  const practiceStateKey = useMemo(() => {
    if (!user?.username) return PRACTICE_TIMER_STATE_KEY;
    return `${PRACTICE_TIMER_STATE_KEY}:${user.username}`;
  }, [user?.username]);
  const practiceSessionsKey = useMemo(() => {
    if (!user?.username) return PRACTICE_TIMER_SESSIONS_KEY;
    return `${PRACTICE_TIMER_SESSIONS_KEY}:${user.username}`;
  }, [user?.username]);
  const metronomeSettingsKey = useMemo(() => {
    if (!user?.username) return METRONOME_SETTINGS_KEY;
    return `${METRONOME_SETTINGS_KEY}:${user.username}`;
  }, [user?.username]);
  const recentStudentsKey = useMemo(() => {
    if (!user?.username) return RECENT_STUDENTS_KEY;
    if (role === 'company' && selectedTeacher?.username) {
      return `sm_recent_selected_students:${user.username}:${selectedTeacher.username}`;
    }
    return `sm_recent_selected_students:${user.username}:${user.username}`;
  }, [role, selectedTeacher?.username, user?.username]);

  const practiceTotalSeconds = Math.max(5, practiceMinutes) * 60;
  const practiceProgress =
    practiceTotalSeconds === 0
      ? 0
      : (practiceTotalSeconds - practiceRemaining) / practiceTotalSeconds;
  const practiceTimeLabel = useMemo(() => {
    const minutes = Math.floor(practiceRemaining / 60);
    const seconds = practiceRemaining % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [practiceRemaining]);
  const isPracticeComplete = practiceRemaining === 0;
  const totalPracticeSeconds = useMemo(
    () => practiceSessions.reduce((sum, session) => sum + session.duration, 0),
    [practiceSessions],
  );
  const formatPracticeDuration = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;
    return remaining === 0 ? `${hours} hr` : `${hours} hr ${remaining} min`;
  }, []);
  const metronomePresetMatch = useMemo(() => {
    return (
      METRONOME_PRESETS.find(
        preset => preset.tempo === metronomeTempo && preset.timeSig === metronomeTimeSig,
      ) ?? null
    );
  }, [metronomeTempo, metronomeTimeSig]);

  const playPracticeDing = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const AudioContextClass =
        window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 880;
      gain.gain.value = 0.0001;
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start();
      gain.gain.exponentialRampToValueAtTime(0.2, audioContext.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.6);
      oscillator.stop(audioContext.currentTime + 0.65);
    } catch {
      // ignore audio errors
    }
  }, []);

  const handlePracticeStart = useCallback(() => {
    if (practiceRemaining <= 0) return;
    practiceLastUpdateRef.current = Date.now();
    setPracticeRunning(true);
  }, [practiceRemaining]);

  const handlePracticePause = useCallback(() => {
    setPracticeRunning(false);
  }, []);

  const handlePracticeReset = useCallback(() => {
    setPracticeRunning(false);
    practiceLastUpdateRef.current = Date.now();
    setPracticeRemaining(practiceTotalSeconds);
  }, [practiceTotalSeconds]);

  const appendPracticeSession = useCallback(
    (duration: number) => {
      const now = Date.now();
      if (practiceLastCompletionRef.current && now - practiceLastCompletionRef.current < 1000) {
        return;
      }
      practiceLastCompletionRef.current = now;
      setPracticeSessions(current => [
        {
          id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
          duration,
          completedAt: new Date(now).toISOString(),
        },
        ...current,
      ]);
    },
    [],
  );

  const handlePracticeStartNewSession = useCallback(() => {
    practiceLastUpdateRef.current = Date.now();
    setPracticeRemaining(practiceTotalSeconds);
    setPracticeRunning(false);
  }, [practiceTotalSeconds]);

  const playMetronomeClick = useCallback(
    (isAccent: boolean) => {
      if (typeof window === 'undefined') return;
      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as typeof window & { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!AudioContextClass) return;
        if (!metronomeAudioRef.current) {
          metronomeAudioRef.current = new AudioContextClass();
        }
        const audioContext = metronomeAudioRef.current;
        if (audioContext.state === 'suspended') {
          void audioContext.resume();
        }
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = isAccent ? 1100 : 760;
        gain.gain.value = 0.0001;
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start();
        gain.gain.exponentialRampToValueAtTime(0.18, audioContext.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.2);
        oscillator.stop(audioContext.currentTime + 0.25);
      } catch {
        // ignore audio errors
      }
    },
    [],
  );

  const handleMetronomeStart = useCallback(() => {
    if (metronomeRunning) return;
    setMetronomeRunning(true);
  }, [metronomeRunning]);

  const handleMetronomeStop = useCallback(() => {
    setMetronomeRunning(false);
  }, []);

  useEffect(() => {
    if (effectiveRole !== 'student' || !practiceSettingsKey) return;
    try {
      const stored = window.localStorage.getItem(practiceSettingsKey);
      if (stored) {
        const parsed = JSON.parse(stored) as {
          minutes?: number;
          soundEnabled?: boolean;
        };
        if (typeof parsed.minutes === 'number' && !Number.isNaN(parsed.minutes)) {
          setPracticeMinutes(parsed.minutes);
        }
        if (typeof parsed.soundEnabled === 'boolean') {
          setPracticeSoundEnabled(parsed.soundEnabled);
        }
      }
    } catch {
      // ignore
    }
  }, [effectiveRole, practiceSettingsKey]);

  useEffect(() => {
    if (effectiveRole !== 'student' || !practiceStateKey) return;
    const totalSeconds = Math.max(5, practiceMinutes) * 60;
    try {
      const stored = window.localStorage.getItem(practiceStateKey);
      if (stored) {
        const parsed = JSON.parse(stored) as {
          remaining?: number;
          running?: boolean;
          lastUpdated?: number;
          total?: number;
        };
        let remaining =
          typeof parsed.remaining === 'number' ? parsed.remaining : totalSeconds;
        let running = Boolean(parsed.running);
        const lastUpdated =
          typeof parsed.lastUpdated === 'number' ? parsed.lastUpdated : Date.now();
        if (running) {
          const elapsed = Math.floor((Date.now() - lastUpdated) / 1000);
          if (elapsed > 0) {
            remaining = Math.max(0, remaining - elapsed);
          }
          if (remaining === 0) {
            running = false;
            appendPracticeSession(totalSeconds);
            if (practiceSoundEnabled) {
              playPracticeDing();
            }
          }
        }
        if (!running && remaining === (parsed.total ?? remaining)) {
          remaining = totalSeconds;
        }
        setPracticeRemaining(remaining);
        setPracticeRunning(running);
        practiceLastUpdateRef.current = Date.now();
        return;
      }
    } catch {
      // ignore
    }
    setPracticeRemaining(totalSeconds);
    setPracticeRunning(false);
    practiceLastUpdateRef.current = Date.now();
  }, [
    appendPracticeSession,
    effectiveRole,
    practiceMinutes,
    practiceSoundEnabled,
    practiceStateKey,
    playPracticeDing,
  ]);

  useEffect(() => {
    if (effectiveRole !== 'student' || !practiceSessionsKey) return;
    try {
      const stored = window.localStorage.getItem(practiceSessionsKey);
      if (stored) {
        const parsed = JSON.parse(stored) as PracticeSession[];
        if (Array.isArray(parsed)) {
          setPracticeSessions(
            parsed.filter(
              session =>
                session &&
                typeof session.id === 'string' &&
                typeof session.duration === 'number' &&
                typeof session.completedAt === 'string',
            ),
          );
        }
      }
    } catch {
      // ignore
    }
  }, [effectiveRole, practiceSessionsKey]);

  useEffect(() => {
    if (effectiveRole !== 'student' || !practiceStateKey) return;
    try {
      window.localStorage.setItem(
        practiceStateKey,
        JSON.stringify({
          remaining: practiceRemaining,
          running: practiceRunning,
          lastUpdated: practiceLastUpdateRef.current,
          total: Math.max(5, practiceMinutes) * 60,
        }),
      );
    } catch {
      // ignore
    }
  }, [
    effectiveRole,
    practiceRemaining,
    practiceRunning,
    practiceMinutes,
    practiceStateKey,
  ]);

  useEffect(() => {
    if (effectiveRole !== 'student' || !practiceSessionsKey) return;
    try {
      window.localStorage.setItem(practiceSessionsKey, JSON.stringify(practiceSessions));
    } catch {
      // ignore
    }
  }, [effectiveRole, practiceSessions, practiceSessionsKey]);

  useEffect(() => {
    if (effectiveRole !== 'student') return;
    if (!practiceRunning) {
      if (practiceTickRef.current) {
        window.clearInterval(practiceTickRef.current);
        practiceTickRef.current = null;
      }
      return;
    }
    practiceLastUpdateRef.current = Date.now();
    const tick = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - practiceLastUpdateRef.current) / 1000);
      if (elapsed <= 0) return;
      practiceLastUpdateRef.current = now;
      setPracticeRemaining(current => {
        const next = Math.max(0, current - elapsed);
        if (next === 0) {
          setPracticeRunning(false);
          appendPracticeSession(practiceTotalSeconds);
          if (practiceSoundEnabled) {
            playPracticeDing();
          }
        }
        return next;
      });
    };
    practiceTickRef.current = window.setInterval(tick, 1000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        tick();
      }
    };
    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);
    return () => {
      if (practiceTickRef.current) {
        window.clearInterval(practiceTickRef.current);
        practiceTickRef.current = null;
      }
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, [
    appendPracticeSession,
    effectiveRole,
    practiceRunning,
    practiceSoundEnabled,
    playPracticeDing,
    practiceTotalSeconds,
  ]);

  useEffect(() => {
    if (effectiveRole !== 'student' || !practiceSettingsKey) return;
    try {
      window.localStorage.setItem(
        practiceSettingsKey,
        JSON.stringify({
          minutes: practiceMinutes,
          soundEnabled: practiceSoundEnabled,
        }),
      );
    } catch {
      // ignore
    }
  }, [effectiveRole, practiceMinutes, practiceSoundEnabled, practiceSettingsKey]);

  useEffect(() => {
    if (effectiveRole !== 'student' || !metronomeSettingsKey) return;
    try {
      const stored = window.localStorage.getItem(metronomeSettingsKey);
      if (!stored) return;
      const parsed = JSON.parse(stored) as {
        tempo?: number;
        timeSig?: '4/4' | '3/4' | '2/4';
        accent?: boolean;
        open?: boolean;
        running?: boolean;
      };
      if (typeof parsed.tempo === 'number' && !Number.isNaN(parsed.tempo)) {
        setMetronomeTempo(Math.min(220, Math.max(40, parsed.tempo)));
      }
      if (parsed.timeSig === '4/4' || parsed.timeSig === '3/4' || parsed.timeSig === '2/4') {
        setMetronomeTimeSig(parsed.timeSig);
      }
      if (typeof parsed.accent === 'boolean') {
        setMetronomeAccent(parsed.accent);
      }
      if (typeof parsed.open === 'boolean') {
        setMetronomeOpen(parsed.open);
      }
      if (typeof parsed.running === 'boolean') {
        setMetronomeRunning(parsed.running);
      }
    } catch {
      // ignore
    }
  }, [effectiveRole, metronomeSettingsKey, pathname]);

  useEffect(() => {
    if (effectiveRole !== 'student' || !metronomeSettingsKey) return;
    try {
      window.localStorage.setItem(
        metronomeSettingsKey,
        JSON.stringify({
          tempo: metronomeTempo,
          timeSig: metronomeTimeSig,
          accent: metronomeAccent,
          open: metronomeOpen,
          running: metronomeRunning,
        }),
      );
    } catch {
      // ignore
    }
  }, [
    effectiveRole,
    metronomeTempo,
    metronomeTimeSig,
    metronomeAccent,
    metronomeOpen,
    metronomeRunning,
    metronomeSettingsKey,
  ]);

  useEffect(() => {
    if (effectiveRole !== 'student') return;
    if (!metronomeRunning) {
      if (metronomeIntervalRef.current) {
        window.clearInterval(metronomeIntervalRef.current);
        metronomeIntervalRef.current = null;
      }
      metronomeBeatRef.current = 1;
      return;
    }
    const beatsPerBar = metronomeTimeSig === '4/4' ? 4 : metronomeTimeSig === '3/4' ? 3 : 2;
    const interval = Math.max(250, Math.floor(60000 / Math.max(40, metronomeTempo)));
    const tick = () => {
      const beat = metronomeBeatRef.current;
      const isAccent = metronomeAccent && beat === 1;
      playMetronomeClick(isAccent);
      metronomeBeatRef.current = beat >= beatsPerBar ? 1 : beat + 1;
    };
    tick();
    metronomeIntervalRef.current = window.setInterval(tick, interval);
    return () => {
      if (metronomeIntervalRef.current) {
        window.clearInterval(metronomeIntervalRef.current);
        metronomeIntervalRef.current = null;
      }
    };
  }, [effectiveRole, metronomeRunning, metronomeTempo, metronomeTimeSig, metronomeAccent, playMetronomeClick]);

  const resolveStudentFromUser = useCallback(
    (username?: string) => {
      if (!username) return null;
      const normalized = username.toLowerCase();
      const studentsList = studentsData.students as StudentRecord[];
      return (
        studentsList.find(
          student => student.username?.toLowerCase() === normalized,
        ) ??
        studentsList.find(student => student.email.toLowerCase() === normalized) ??
        studentsList.find(
          student => student.name.toLowerCase() === normalized,
        ) ??
        studentsList.find(student =>
          student.name.toLowerCase().startsWith(normalized),
        ) ??
        null
      );
    },
    [studentsData],
  );

  const resolveTeacherFromUser = useCallback(
    (username?: string) => {
      if (!username) return null;
      const normalized = username.toLowerCase();
      const teachersList = teachersData.teachers as TeacherRecord[];
      return (
        teachersList.find(
          teacher => teacher.username?.toLowerCase() === normalized,
        ) ??
        teachersList.find(teacher => teacher.email.toLowerCase() === normalized) ??
        teachersList.find(teacher => teacher.name.toLowerCase() === normalized) ??
        teachersList.find(teacher =>
          teacher.name.toLowerCase().startsWith(normalized),
        ) ??
        null
      );
    },
    [teachersData],
  );

  const scheduleNotificationDismiss = useCallback((id: string) => {
    const timers = notificationTimers.current;
    if (timers[id]) {
      window.clearTimeout(timers[id]);
      delete timers[id];
    }
    timers[id] = window.setTimeout(() => {
      if (hoveredNotifications[id]) {
        scheduleNotificationDismiss(id);
        return;
      }
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id ? { ...notification, leaving: true } : notification,
        ),
      );
      window.setTimeout(() => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
        delete timers[id];
      }, 350);
    }, 10000);
  }, [hoveredNotifications]);

  const pauseNotificationDismiss = useCallback((id: string) => {
    const timers = notificationTimers.current;
    if (timers[id]) {
      window.clearTimeout(timers[id]);
      delete timers[id];
    }
  }, []);

  const dismissNotification = useCallback((id: string) => {
    const timers = notificationTimers.current;
    if (timers[id]) {
      window.clearTimeout(timers[id]);
      delete timers[id];
    }
    setHoveredNotifications(prev => ({ ...prev, [id]: false }));
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    window.setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, 300);
  }, []);

  useEffect(() => {
    if (!user?.username || !role) return;
    const notificationKey = `${MESSAGE_NOTIFICATIONS_KEY}:${role}:${user.username}`;
    let lastNotified: Record<string, string> = {};
    try {
      const stored = window.localStorage.getItem(notificationKey);
      if (stored) lastNotified = JSON.parse(stored) as Record<string, string>;
    } catch {
      lastNotified = {};
    }

    const parseTeacherIdFromThread = (threadId: string) => {
      const match = threadId.match(/teacher:([a-f0-9-]+)/i);
      return match?.[1] ?? null;
    };
    const parseStudentIdFromThread = (threadId: string) => {
      const match = threadId.match(/student:([a-f0-9-]+)/i);
      return match?.[1] ?? null;
    };

    const getSenderName = (
      threadId: string,
      sender: 'student' | 'teacher' | 'corporate',
    ) => {
      if (sender === 'corporate') return 'Simply Music';
      const teacherId = parseTeacherIdFromThread(threadId);
      const studentId = parseStudentIdFromThread(threadId);
      if (sender === 'teacher') {
        return (
          (teachersData.teachers as TeacherRecord[]).find(
            teacher => teacher.id === teacherId,
          )?.name ?? 'Teacher'
        );
      }
      return (
        (studentsData.students as StudentRecord[]).find(
          student => student.id === studentId,
        )?.name ?? 'Student'
      );
    };

    const pollMessages = async () => {
      try {
        const response = await fetch('/api/messages');
        if (!response.ok) return;
        const data = (await response.json()) as {
          threads?: Record<string, { id: string; sender: 'student' | 'teacher' | 'corporate'; text: string; timestamp: string; subject?: string }[]>;
        };
        const threads = data.threads ?? {};
        const nextNotified = { ...lastNotified };
        const notificationsToAdd: NotificationMessage[] = [];

        const student = role === 'student' ? resolveStudentFromUser(user.username) : null;
        const teacher = role === 'teacher' ? resolveTeacherFromUser(user.username) : null;

        Object.entries(threads).forEach(([threadId, messages]) => {
          if (messages.length === 0) return;
          const lastMessage = messages[messages.length - 1];
          const lastTimestamp = lastMessage.timestamp;

          const isStudentThread =
            student && threadId.startsWith(`student:${student.id}|teacher:`);
          const isTeacherThread =
            teacher && threadId.endsWith(`teacher:${teacher.id}`);
          const isCorporateThread = role === 'company' && threadId.startsWith('corporate|teacher:');

          if (!isStudentThread && !isTeacherThread && !isCorporateThread) return;

          const isIncoming =
            (role === 'student' && lastMessage.sender === 'teacher') ||
            (role === 'teacher' &&
              (lastMessage.sender === 'student' || lastMessage.sender === 'corporate')) ||
            (role === 'company' && lastMessage.sender === 'teacher');

          if (!isIncoming) return;

          const lastSeen = lastNotified[threadId];
          if (lastSeen && new Date(lastTimestamp) <= new Date(lastSeen)) return;

          notificationsToAdd.push({
            id: crypto.randomUUID(),
            sender: getSenderName(threadId, lastMessage.sender),
            text: lastMessage.text,
            subject: lastMessage.subject,
            threadId,
            timestamp: lastTimestamp,
          });
          nextNotified[threadId] = lastTimestamp;
        });

        if (notificationsToAdd.length > 0) {
          setNotifications(prev => {
            const combined = [...notificationsToAdd, ...prev].slice(0, 3);
            combined.forEach(note => scheduleNotificationDismiss(note.id));
            return combined;
          });
          lastNotified = nextNotified;
          window.localStorage.setItem(notificationKey, JSON.stringify(nextNotified));
        }
      } catch {
        // ignore
      }
    };

    pollMessages();
    const interval = window.setInterval(pollMessages, 6000);
    return () => {
      window.clearInterval(interval);
    };
  }, [role, user?.username, resolveStudentFromUser, resolveTeacherFromUser, scheduleNotificationDismiss]);

  useEffect(() => {
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) {
      router.replace('/login');
      return;
    }
    try {
      const parsed = JSON.parse(stored) as AuthUser;
      if (!parsed?.role) {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
        router.replace('/login');
        return;
      }
      setUser(parsed);
      setRole(parsed.role);
      setViewRole(parsed.role);
      void fetch(
        `/api/account?username=${encodeURIComponent(
          parsed.username,
        )}&role=${encodeURIComponent(parsed.role)}`,
      )
        .then(async response => {
          if (!response.ok) return null;
          const data = (await response.json()) as {
            account?: {
              name: string;
              email: string;
              goesBy?: string;
              status: string;
              lastLogin: string | null;
            };
          };
          return data.account ?? null;
        })
        .then(account => {
          if (account) setAccountInfo(account);
        })
        .catch(() => {
          setAccountInfo(null);
        });
      const storedView = window.localStorage.getItem(VIEW_ROLE_STORAGE_KEY);
      if (storedView) {
        if (
          parsed.role === 'company' &&
          (storedView === 'company' ||
            storedView === 'teacher' ||
            storedView === 'student')
        ) {
          setViewRole(storedView as UserRole);
        }
        if (
          parsed.role === 'teacher' &&
          (storedView === 'teacher' || storedView === 'student')
        ) {
          setViewRole(storedView as UserRole);
        }
      }
      setIsReady(true);
    } catch {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      router.replace('/login');
    }
  }, [router]);

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    const nextTheme = normalizeTheme(stored);
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  }, []);

  useEffect(() => {
    if (role !== 'company' || !user?.username) return;
    let isActive = true;
    const fetchTeachers = async () => {
      try {
        const response = await fetch(
          `/api/teachers?company=${encodeURIComponent(user.username)}`,
        );
        if (!response.ok) return;
        const data = (await response.json()) as { teachers: TeacherRecord[] };
        if (isActive) {
          setTeachers(data.teachers ?? []);
        }
      } catch {
        if (isActive) setTeachers([]);
      }
    };
    fetchTeachers();
    return () => {
      isActive = false;
    };
  }, [role, user?.username]);

  useEffect(() => {
    if (role !== 'teacher' || !user?.username) return;
    const teachersList = teachersData.teachers as TeacherRecord[];
    const normalized = user.username.toLowerCase();
    const teacherRecord =
      teachersList.find(
        teacher => teacher.username?.toLowerCase() === normalized,
      ) ??
      teachersList.find(teacher => teacher.email.toLowerCase() === normalized) ??
      teachersList.find(teacher => teacher.name.toLowerCase() === normalized) ??
      teachersList.find(teacher =>
        teacher.name.toLowerCase().startsWith(normalized),
      ) ??
      null;
    if (!teacherRecord?.id) return;

    const key = `teacher:${teacherRecord.id}`;
    const sendPresence = async () => {
      try {
        await fetch('/api/presence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key }),
        });
      } catch {
        // ignore
      }
    };

    void sendPresence();
    const interval = window.setInterval(sendPresence, 45000);
    return () => {
      window.clearInterval(interval);
      void fetch(`/api/presence?key=${encodeURIComponent(key)}`, {
        method: 'DELETE',
      }).catch(() => {});
    };
  }, [role, user?.username, teachersData]);

  useEffect(() => {
    if (role !== 'student' || !user?.username) return;
    const studentRecord = resolveStudentFromUser(user.username);
    if (!studentRecord?.id) return;

    const key = `student:${studentRecord.id}`;
    const getStudentActivity = () => {
      if (typeof window === 'undefined') return undefined;
      const path = window.location.pathname;
      const baseActivity = (() => {
        if (path.startsWith('/students/current-lesson')) return 'Current Lesson';
        if (path.startsWith('/students/practice-hub')) return 'Practice Hub';
        if (path.startsWith('/students/lesson-library')) return 'Lesson Library';
        if (path.startsWith('/students/lesson-packs')) return 'Lesson Packs';
        if (path.startsWith('/students/communications')) return 'Communications';
        if (path.startsWith('/students/messages')) return 'Messages';
        if (path.startsWith('/students/past-lessons')) return 'Past Lessons';
        if (path.startsWith('/students/what-to-practice'))
          return 'What To Practice';
        if (path.startsWith('/students/ask-question')) return 'Ask a Question';
        if (path.startsWith('/students/dashboard')) return 'Dashboard';
        return 'Student Area';
      })();
      const song =
        path.startsWith('/students/current-lesson') &&
        window.localStorage.getItem('sm_student_current_song')
          ? window.localStorage.getItem('sm_student_current_song')
          : null;
      return {
        label: baseActivity,
        detail: song ?? undefined,
      };
    };
    const sendPresence = async () => {
      try {
        await fetch('/api/presence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, activity: getStudentActivity() }),
        });
      } catch {
        // ignore
      }
    };

    void sendPresence();
    const interval = window.setInterval(sendPresence, 45000);
    return () => {
      window.clearInterval(interval);
      void fetch(`/api/presence?key=${encodeURIComponent(key)}`, {
        method: 'DELETE',
      }).catch(() => {});
    };
  }, [role, user?.username, resolveStudentFromUser]);

  useEffect(() => {
    let teacherUsername: string | null = null;
    if (role === 'teacher') {
      teacherUsername = user?.username ?? null;
    }
    if (role === 'company') {
      teacherUsername = selectedTeacher?.username ?? null;
    }
    if (!teacherUsername) {
      if (role === 'company') setStudents([]);
      return;
    }
    let isActive = true;
    const fetchStudents = async () => {
      try {
        const response = await fetch(
          `/api/students?teacher=${encodeURIComponent(teacherUsername ?? '')}`,
        );
        if (!response.ok) return;
        const data = (await response.json()) as { students: StudentRecord[] };
        if (isActive) {
          setStudents(data.students ?? []);
        }
      } catch {
        if (isActive) setStudents([]);
      }
    };
    fetchStudents();
    return () => {
      isActive = false;
    };
  }, [role, selectedTeacher?.username, user?.username]);

  const refreshTeachers = useCallback(() => {
    if (role !== 'company' || !user?.username) return;
    void fetch(`/api/teachers?company=${encodeURIComponent(user.username)}`)
      .then(async response => {
        if (!response.ok) return null;
        const data = (await response.json()) as { teachers: TeacherRecord[] };
        return data.teachers ?? [];
      })
      .then(list => {
        if (list) setTeachers(list);
      })
      .catch(() => {
        setTeachers([]);
      });
  }, [role, user?.username]);

  useEffect(() => {
    if (role !== 'company') return;
    const handleUpdate = () => refreshTeachers();
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'sm_teachers_updated') {
        refreshTeachers();
      }
    };
    window.addEventListener('sm-teachers-updated', handleUpdate);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('sm-teachers-updated', handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, [refreshTeachers, role]);

  useEffect(() => {
    if (role !== 'company') return;
    if (isTeacherModalOpen) {
      refreshTeachers();
    }
  }, [isTeacherModalOpen, refreshTeachers, role]);

  useEffect(() => {
    if (role !== 'company') return;
    const handleOpenTeacherLookup = () => setIsTeacherModalOpen(true);
    window.addEventListener('sm-open-teacher-lookup', handleOpenTeacherLookup);
    return () => {
      window.removeEventListener(
        'sm-open-teacher-lookup',
        handleOpenTeacherLookup,
      );
    };
  }, [role]);

  useEffect(() => {
    if (role !== 'teacher' && role !== 'company') return;
    const handleOpenStudentLookup = () => setIsStudentModalOpen(true);
    window.addEventListener('sm-open-student-lookup', handleOpenStudentLookup);
    return () => {
      window.removeEventListener(
        'sm-open-student-lookup',
        handleOpenStudentLookup,
      );
    };
  }, [role]);

  useEffect(() => {
    if (role !== 'company') return;
    const stored =
      window.localStorage.getItem(viewTeacherKey) ??
      window.localStorage.getItem(VIEW_TEACHER_STORAGE_KEY);
    if (!stored) {
      setSelectedTeacher(null);
      return;
    }
    try {
      const parsed = JSON.parse(stored) as SelectedTeacher;
      if (parsed?.id && parsed?.username) {
        setSelectedTeacher(parsed);
        window.localStorage.setItem(viewTeacherKey, stored);
      } else {
        setSelectedTeacher(null);
      }
    } catch {
      setSelectedTeacher(null);
    }
  }, [role, viewTeacherKey]);

  useEffect(() => {
    if (role !== 'company') return;
    const handleViewTeacherUpdated = () => {
      const stored =
        window.localStorage.getItem(viewTeacherKey) ??
        window.localStorage.getItem(VIEW_TEACHER_STORAGE_KEY);
      if (!stored) {
        setSelectedTeacher(null);
        return;
      }
      try {
        const parsed = JSON.parse(stored) as SelectedTeacher;
        if (parsed?.id && parsed?.username) {
          setSelectedTeacher(parsed);
          window.localStorage.setItem(viewTeacherKey, stored);
          setRecentTeachers(current => {
            const next = [
              parsed,
              ...current.filter(item => item.id !== parsed.id),
            ].slice(0, 6);
            window.localStorage.setItem(recentTeachersKey, JSON.stringify(next));
            return next;
          });
        } else {
          setSelectedTeacher(null);
        }
      } catch {
        setSelectedTeacher(null);
      }
    };

    window.addEventListener('sm-view-teacher-updated', handleViewTeacherUpdated);
    return () => {
      window.removeEventListener(
        'sm-view-teacher-updated',
        handleViewTeacherUpdated,
      );
    };
  }, [recentTeachersKey, role, viewTeacherKey]);

  useEffect(() => {
    if (role !== 'company') return;
    const stored = window.localStorage.getItem(recentTeachersKey);
    if (!stored) {
      setRecentTeachers([]);
      return;
    }
    try {
      const parsed = JSON.parse(stored) as SelectedTeacher[];
      if (Array.isArray(parsed)) {
        setRecentTeachers(
          parsed.filter(item => item?.id && item?.name && item?.username),
        );
      } else {
        setRecentTeachers([]);
      }
    } catch {
      setRecentTeachers([]);
    }
  }, [recentTeachersKey, role]);

  useEffect(() => {
    if (role !== 'teacher' && role !== 'company') return;
    const stored = window.localStorage.getItem(recentStudentsKey);
    if (!stored) {
      setRecentStudentIds([]);
      return;
    }
    try {
      const parsed = JSON.parse(stored) as string[];
      if (Array.isArray(parsed)) {
        setRecentStudentIds(parsed.filter(Boolean));
      } else {
        setRecentStudentIds([]);
      }
    } catch {
      setRecentStudentIds([]);
    }
  }, [recentStudentsKey, role]);

  useEffect(() => {
    if (role !== 'teacher' && role !== 'company') return;
    if (!selectedStudentKey) return;
    if (role === 'company' && !selectedTeacher?.username) {
      setSelectedStudentId(null);
      return;
    }
    const storedId = window.localStorage.getItem(selectedStudentKey);
    if (storedId) {
      setSelectedStudentId(storedId);
      return;
    }
    const storedView = window.localStorage.getItem(viewStudentKey);
    if (storedView) {
      try {
        const parsed = JSON.parse(storedView) as SelectedStudent;
        if (parsed?.id) {
          setSelectedStudentId(parsed.id);
          window.localStorage.setItem(selectedStudentKey, parsed.id);
          return;
        }
      } catch {
        // ignore parse errors
      }
    }
    setSelectedStudentId(null);
  }, [role, selectedStudentKey, viewStudentKey]);

  useEffect(() => {
    if (!selectedStudentId) {
      setSelectedStudent(null);
      return;
    }
    const record = students.find(student => student.id === selectedStudentId);
    if (!record) {
      setSelectedStudent(null);
      return;
    }
    setSelectedStudent({
      id: record.id,
      name: record.name,
      email: record.email,
    });
  }, [selectedStudentId, students]);

  useEffect(() => {
    if (role !== 'company') return;
    if (!selectedStudent?.id || !selectedStudentKey) return;
    if (selectedStudentId === selectedStudent.id) return;
    window.localStorage.setItem(selectedStudentKey, selectedStudent.id);
    setSelectedStudentId(selectedStudent.id);
  }, [role, selectedStudent?.id, selectedStudentId, selectedStudentKey]);

  useEffect(() => {
    if (role !== 'teacher' && role !== 'company') return;
    const handleStudentUpdate = (event?: Event) => {
      const detail =
        event && 'detail' in event
          ? (event as CustomEvent<{
              selectedId?: string | null;
              recentIds?: string[];
            }>).detail
          : undefined;
      if (detail?.selectedId !== undefined) {
        setSelectedStudentId(detail.selectedId ?? null);
      }
      if (detail?.recentIds) {
        setRecentStudentIds(detail.recentIds);
      }

      let nextSelectedId: string | null = null;
      if (selectedStudentKey) {
        nextSelectedId = window.localStorage.getItem(selectedStudentKey);
      }
      if (!nextSelectedId) {
        const storedView = window.localStorage.getItem(viewStudentKey);
        if (storedView) {
          try {
            const parsed = JSON.parse(storedView) as SelectedStudent;
            if (parsed?.id) {
              nextSelectedId = parsed.id;
              setSelectedStudent(parsed);
              if (selectedStudentKey) {
                window.localStorage.setItem(selectedStudentKey, parsed.id);
              }
            }
          } catch {
            // ignore parse errors
          }
        }
      }
      if (detail?.selectedId === undefined) {
        setSelectedStudentId(nextSelectedId ?? null);
      }

      const recentStored = window.localStorage.getItem(recentStudentsKey);
      if (!recentStored) {
        if (!detail?.recentIds) setRecentStudentIds([]);
        return;
      }
      try {
        const parsed = JSON.parse(recentStored) as string[];
        if (Array.isArray(parsed)) {
          if (!detail?.recentIds) setRecentStudentIds(parsed.filter(Boolean));
        } else {
          if (!detail?.recentIds) setRecentStudentIds([]);
        }
      } catch {
        if (!detail?.recentIds) setRecentStudentIds([]);
      }
    };
    window.addEventListener('sm-view-student-updated', handleStudentUpdate);
    window.addEventListener('sm-selected-student-updated', handleStudentUpdate);
    window.addEventListener(
      'sm-student-selection',
      handleStudentUpdate as EventListener,
    );
    return () => {
      window.removeEventListener('sm-view-student-updated', handleStudentUpdate);
      window.removeEventListener(
        'sm-selected-student-updated',
        handleStudentUpdate,
      );
      window.removeEventListener(
        'sm-student-selection',
        handleStudentUpdate as EventListener,
      );
    };
  }, [recentStudentsKey, role, selectedStudentKey, viewStudentKey]);

  useEffect(() => {
    if (!effectiveRole || !pathname) return;
    const allowed = allowedRoots[effectiveRole];
    const isAllowed = allowed.some(root => pathname.startsWith(root));
    if (!isAllowed) {
      router.replace(roleHome[effectiveRole]);
    }
  }, [pathname, effectiveRole, router]);

  useEffect(() => {
    const syncPip = () => {
      try {
        const stored = window.localStorage.getItem('sm_pip_state');
        if (!stored) return;
        const parsed = JSON.parse(stored) as {
          open?: boolean;
          playing?: boolean;
          material?: string;
          part?: string;
          materials?: string[];
        };
        setPipState(current => ({
          open: Boolean(parsed?.open),
          playing: Boolean(parsed?.playing),
          material: parsed?.material ?? current.material,
          part: parsed?.part ?? null,
          materials: Array.isArray(parsed?.materials)
            ? parsed.materials
            : current.materials,
        }));
      } catch {
        // ignore
      }
    };
    syncPip();
    window.addEventListener('sm-pip-update', syncPip);
    return () => {
      window.removeEventListener('sm-pip-update', syncPip);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const inMaterials = pathname?.includes('/materials');
    try {
      const stored = window.localStorage.getItem('sm_pip_state');
      if (!stored) return;
      const parsed = JSON.parse(stored) as {
        open?: boolean;
        playing?: boolean;
        material?: string;
        part?: string;
        materials?: string[];
      };
      if (!parsed?.material) return;
      if (inMaterials) {
        if (parsed?.open) {
          window.localStorage.setItem(
            'sm_pip_state',
            JSON.stringify({ ...parsed, open: false }),
          );
          window.dispatchEvent(new Event('sm-pip-update'));
        }
        return;
      }
      if (parsed?.playing && !parsed?.open) {
        window.localStorage.setItem(
          'sm_pip_state',
          JSON.stringify({ ...parsed, open: true }),
        );
        window.dispatchEvent(new Event('sm-pip-update'));
      }
    } catch {
      // ignore
    }
  }, [pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (
      !(
        role === 'student' ||
        role === 'parent' ||
        viewRole === 'student' ||
        viewRole === 'parent'
      )
    )
      return;
    let lastNotified = window.localStorage.getItem(
      COMMUNICATIONS_NOTIFICATIONS_KEY,
    );

    const notifyIfNew = (latest?: CommunicationEntry | null) => {
      if (!latest) return;
      const latestTime = new Date(latest.createdAt);
      const lastSeen = lastNotified ? new Date(lastNotified) : null;
      if (lastSeen && latestTime <= lastSeen) return;
      setNotifications(prev => {
        const next = [
          {
            id: crypto.randomUUID(),
            sender: latest.author ?? 'Teacher',
            text: latest.body,
            subject: latest.title,
            threadId: 'communications',
            timestamp: latest.createdAt,
          },
          ...prev,
        ].slice(0, 3);
        next.forEach(note => scheduleNotificationDismiss(note.id));
        return next;
      });
      lastNotified = latest.createdAt;
      window.localStorage.setItem(
        COMMUNICATIONS_NOTIFICATIONS_KEY,
        latest.createdAt,
      );
    };

    const readLatest = async () => {
      const list = await readCommunications();
      return list[0] ?? null;
    };

    const handleUpdate = (event: Event) => {
      const detail = (event as CustomEvent<CommunicationEntry>).detail;
      if (detail) {
        notifyIfNew(detail);
        return;
      }
      void readLatest().then(latest => notifyIfNew(latest));
    };

    void readLatest().then(latest => notifyIfNew(latest));
    window.addEventListener(COMMUNICATIONS_UPDATE_EVENT, handleUpdate);
    const interval = window.setInterval(() => {
      void readLatest().then(latest => notifyIfNew(latest));
    }, 6000);
    return () => {
      window.removeEventListener(COMMUNICATIONS_UPDATE_EVENT, handleUpdate);
      window.clearInterval(interval);
    };
  }, [role, viewRole, scheduleNotificationDismiss]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (role !== 'company') return;
    if (!user?.username) return;

    const notificationKey = `${ADMIN_PUSH_NOTIFICATIONS_KEY}:${user.username}`;
    let lastNotified = window.localStorage.getItem(notificationKey);

    const resolveAdminEmails = () => {
      const fallback = `${user.username}@simplymusic.com`;
      return new Set(
        [accountInfo?.email, user.username, fallback]
          .filter(Boolean)
          .map(value => value.toLowerCase().trim()),
      );
    };

    const isAdminRecipient = (target: string, identifiers: Set<string>) => {
      const normalized = target.toLowerCase().trim();
      if (identifiers.has(normalized)) return true;
      return Array.from(identifiers).some(value =>
        value.includes('@') ? normalized === value : normalized.includes(value),
      );
    };

    const pollNotifications = async () => {
      try {
        const response = await fetch('/api/notifications', { cache: 'no-store' });
        if (!response.ok) return;
        const data = (await response.json()) as { events?: NotificationEvent[] };
        const events = data.events ?? [];
        const adminIdentifiers = resolveAdminEmails();
        const lastSeen = lastNotified ? new Date(lastNotified) : null;
        const incoming = events.filter(event => {
          if (event.type !== 'push') return false;
          if (!event.to) return false;
          return isAdminRecipient(event.to, adminIdentifiers);
        });
        const sortedIncoming = [...incoming].sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return aTime - bTime;
        });
        const fresh = lastSeen
          ? sortedIncoming.filter(event => {
              const eventTime = event.createdAt
                ? new Date(event.createdAt)
                : null;
              if (!eventTime || Number.isNaN(eventTime.getTime())) return false;
              return eventTime > lastSeen;
            })
          : sortedIncoming.slice(-1);

        if (fresh.length === 0) return;

        const notificationsToAdd: NotificationMessage[] = fresh.map(event => ({
          id: crypto.randomUUID(),
          kind: 'notification',
          kicker: event.source === 'Teacher Interest' ? 'Teacher Interest' : 'Admin Push',
          sender:
            event.title ||
            event.subject ||
            event.source ||
            'Admin Notification',
          text: event.body || 'New push notification delivered.',
          subject: event.source ? `Source: ${event.source}` : undefined,
          threadId: event.id,
          timestamp: event.createdAt,
          route:
            event.source === 'Teacher Interest' &&
            typeof event.data?.alertId === 'string'
              ? `/teacher-interest?alertId=${event.data.alertId}`
              : '/notifications',
        }));

        setNotifications(prev => {
          const combined = [...notificationsToAdd, ...prev].slice(0, 3);
          combined.forEach(note => scheduleNotificationDismiss(note.id));
          return combined;
        });

        const latestTime = fresh.reduce((latest, event) => {
          const eventTime = event.createdAt ? new Date(event.createdAt) : null;
          if (!eventTime || Number.isNaN(eventTime.getTime())) return latest;
          if (!latest) return eventTime;
          return eventTime > latest ? eventTime : latest;
        }, lastSeen);

        if (latestTime) {
          lastNotified = latestTime.toISOString();
          window.localStorage.setItem(notificationKey, lastNotified);
        }
      } catch {
        // ignore
      }
    };

    pollNotifications();
    const interval = window.setInterval(pollNotifications, 8000);
    return () => window.clearInterval(interval);
  }, [role, user?.username, accountInfo?.email, scheduleNotificationDismiss]);

  const items = useMemo(() => {
    if (!effectiveRole) return [];
    return navItems[effectiveRole];
  }, [effectiveRole]);

  const sidebarStyles = useMemo(() => {
    if (effectiveRole === 'teacher') {
      return {
        bg: 'bg-[var(--c-e7eddc)]',
        border: 'border-[var(--c-dfe6d2)]',
      };
    }
    if (effectiveRole === 'student' || effectiveRole === 'parent') {
      return {
        bg: 'bg-[var(--c-e6f4ff)]',
        border: 'border-[var(--c-d9e2ef)]',
      };
    }
    return {
      bg: 'bg-[var(--c-ffffff)]',
      border: 'border-[var(--c-ecebe7)]',
    };
  }, [effectiveRole]);

  useEffect(() => {
    if (role !== 'company') return;
    try {
      const stored = window.localStorage.getItem(FEATURES_OVERVIEW_KEY);
      if (stored === 'true') {
        setFeaturesOverviewActive(true);
      }
    } catch {
      // ignore storage errors
    }
  }, [role]);

  useEffect(() => {
    if (!sidebarHiddenKey) return;
    try {
      const stored = window.localStorage.getItem(sidebarHiddenKey);
      setIsSidebarHidden(stored === 'true');
    } catch {
      // ignore storage errors
    }
  }, [sidebarHiddenKey]);

  useEffect(() => {
    if (!sidebarHiddenKey) return;
    try {
      window.localStorage.setItem(
        sidebarHiddenKey,
        isSidebarHidden ? 'true' : 'false',
      );
    } catch {
      // ignore storage errors
    }
  }, [sidebarHiddenKey, isSidebarHidden]);

  useEffect(() => {
    if (!pathname) return;
    const cameFromOverview = searchParams?.get('from') === 'features-overview';
    const onOverviewPage = pathname.startsWith('/company/features-overview');
    if (role === 'company' && (cameFromOverview || onOverviewPage)) {
      setFeaturesOverviewActive(true);
      try {
        window.localStorage.setItem(FEATURES_OVERVIEW_KEY, 'true');
      } catch {
        // ignore storage errors
      }
    }
  }, [pathname, role, searchParams]);

  useEffect(() => {
    if (!role) return;
    const requestedView = searchParams?.get('view');
    if (!requestedView) return;
    if (requestedView === 'company') {
      setViewRole('company');
      try {
        window.localStorage.setItem(VIEW_ROLE_STORAGE_KEY, 'company');
      } catch {
        // ignore storage errors
      }
    }
    if (requestedView === 'teacher') {
      setViewRole('teacher');
      try {
        window.localStorage.setItem(VIEW_ROLE_STORAGE_KEY, 'teacher');
      } catch {
        // ignore storage errors
      }
    }
    if (requestedView === 'student') {
      setViewRole('student');
      try {
        window.localStorage.setItem(VIEW_ROLE_STORAGE_KEY, 'student');
      } catch {
        // ignore storage errors
      }
    }
  }, [role, searchParams]);

  const pipParts = useMemo(() => {
    if (!pipState.material) return [];
    const partsMap = lessonParts as Record<string, string[]>;
    const matchedKey = Object.keys(partsMap).find(prefix =>
      pipState.material?.startsWith(prefix),
    );
    return matchedKey ? partsMap[matchedKey] ?? [] : [];
  }, [lessonParts, pipState.material]);

  const pipPartIndex = pipState.part
    ? pipParts.indexOf(pipState.part)
    : -1;
  const pipHasParts = pipParts.length > 0;
  const pipCanPrev = pipHasParts && pipPartIndex > 0;
  const pipHasNextPart =
    pipHasParts && pipPartIndex >= 0 && pipPartIndex < pipParts.length - 1;
  const pipMaterialIndex = pipState.material
    ? pipState.materials.indexOf(pipState.material)
    : -1;
  const pipHasNextMaterial =
    pipState.material &&
    pipMaterialIndex >= 0 &&
    pipMaterialIndex < pipState.materials.length - 1;
  const pipCanNext = pipHasNextPart || pipHasNextMaterial;

  const updatePipState = (next: Partial<typeof pipState>) => {
    setPipState(current => {
      const merged = { ...current, ...next };
      try {
        window.localStorage.setItem('sm_pip_state', JSON.stringify(merged));
        window.dispatchEvent(new Event('sm-pip-update'));
      } catch {
        window.dispatchEvent(new Event('sm-pip-update'));
      }
      return merged;
    });
  };

  const handlePipPrev = () => {
    if (!pipCanPrev) return;
    updatePipState({ part: pipParts[pipPartIndex - 1] ?? null });
  };

  const handlePipNext = () => {
    if (!pipCanNext) return;
    if (pipHasNextPart) {
      updatePipState({ part: pipParts[pipPartIndex + 1] ?? null });
      return;
    }
    if (pipHasNextMaterial && pipState.materials[pipMaterialIndex + 1]) {
      updatePipState({
        material: pipState.materials[pipMaterialIndex + 1],
        part: null,
      });
    }
  };

  const openAccountModal = () => {
    if (!user) return;
    setAccountForm({
      name: accountInfo?.name ?? '',
      email: accountInfo?.email ?? '',
      goesBy: accountInfo?.goesBy ?? '',
      password: '',
    });
    setAccountError(null);
    setIsAccountModalOpen(true);
  };

  const closeAccountModal = () => {
    if (accountSaving) return;
    setIsAccountModalOpen(false);
  };

  const handleAccountSave = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!user) return;
    setAccountSaving(true);
    setAccountError(null);
    try {
      const response = await fetch(
        `/api/accounts/${encodeURIComponent(user.username)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: user.role,
            name: accountForm.name.trim(),
            email: accountForm.email.trim(),
            goesBy: accountForm.goesBy.trim(),
            password: accountForm.password.trim() || undefined,
          }),
        },
      );
      const data = (await response.json()) as {
        account?: { name: string; email: string; status: string; goesBy?: string };
        error?: string;
      };
      if (!response.ok || !data.account) {
        throw new Error(data.error ?? 'Unable to update account.');
      }
      setAccountInfo(current => ({
        name: data.account?.name ?? current?.name ?? '',
        email: data.account?.email ?? current?.email ?? '',
        goesBy: data.account?.goesBy ?? current?.goesBy ?? '',
        status: data.account?.status ?? current?.status ?? 'Active',
        lastLogin: current?.lastLogin ?? null,
      }));
      setIsAccountModalOpen(false);
    } catch (caught) {
      setAccountError(
        caught instanceof Error
          ? caught.message
          : 'Unable to update account.',
      );
    } finally {
      setAccountSaving(false);
    }
  };

  const teacherMode = useMemo(() => {
    if (!pathname?.startsWith('/teachers')) return 'training';
    return searchParams.get('mode') === 'teaching' ? 'teaching' : 'training';
  }, [pathname, searchParams]);

  const handleLogout = () => {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.localStorage.removeItem(VIEW_ROLE_STORAGE_KEY);
    router.replace('/login');
  };

  const handleExitFeaturesOverview = () => {
    setFeaturesOverviewActive(false);
    try {
      window.localStorage.removeItem(FEATURES_OVERVIEW_KEY);
    } catch {
      // ignore storage errors
    }
    if (role === 'company') {
      setViewRole('company');
      try {
        window.localStorage.setItem(VIEW_ROLE_STORAGE_KEY, 'company');
      } catch {
        // ignore storage errors
      }
    }
    if (!pathname) return;
    const nextParams = new URLSearchParams(searchParams?.toString() ?? '');
    nextParams.delete('from');
    nextParams.delete('view');
    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  };

  const handleBackToFeaturesOverview = () => {
    if (role === 'company') {
      setViewRole('company');
      try {
        window.localStorage.setItem(VIEW_ROLE_STORAGE_KEY, 'company');
      } catch {
        // ignore storage errors
      }
    }
    router.replace('/company/features-overview?view=company');
  };

  const handleViewRoleChange = (nextRole: UserRole) => {
    if (role === 'company') {
      if (nextRole === 'student') {
        setPendingViewRole('student');
        if (!selectedTeacher) {
          setIsStudentModalOpen(false);
          setIsTeacherModalOpen(true);
          return;
        }
        if (!selectedStudent) {
          setIsTeacherModalOpen(false);
          setIsStudentModalOpen(true);
          return;
        }
        setPendingViewRole(null);
        setViewRole(nextRole);
        window.localStorage.setItem(VIEW_ROLE_STORAGE_KEY, nextRole);
        router.replace(roleHome[nextRole]);
        return;
      }
      setPendingViewRole(null);
      setViewRole(nextRole);
      window.localStorage.setItem(VIEW_ROLE_STORAGE_KEY, nextRole);
      router.replace(roleHome[nextRole]);
      return;
    }
    if (role === 'teacher' && (nextRole === 'teacher' || nextRole === 'student')) {
      setViewRole(nextRole);
      window.localStorage.setItem(VIEW_ROLE_STORAGE_KEY, nextRole);
      router.replace(roleHome[nextRole]);
    }
  };

  const toTeacherUsername = (teacher: TeacherRecord) => {
    const normalized = teacher.username?.trim().toLowerCase();
    if (normalized) return normalized;
    const first = teacher.name.split(' ')[0]?.trim().toLowerCase();
    return first || teacher.name.trim().toLowerCase();
  };

  const handleTeacherSelect = (teacher: TeacherRecord) => {
    const selection: SelectedTeacher = {
      id: teacher.id,
      name: teacher.name,
      username: toTeacherUsername(teacher),
    };
    handleTeacherChoice(selection);
  };

  const handleTeacherChoice = (selection: SelectedTeacher) => {
    if (role === 'company') {
      setSelectedStudent(null);
      setSelectedStudentId(null);
      if (selectedStudentKey) {
        window.localStorage.removeItem(selectedStudentKey);
      }
      window.localStorage.removeItem(VIEW_STUDENT_STORAGE_KEY);
      window.dispatchEvent(new Event('sm-view-student-updated'));
    }
    setSelectedTeacher(selection);
    window.localStorage.setItem(viewTeacherKey, JSON.stringify(selection));
    window.dispatchEvent(new Event('sm-view-teacher-updated'));
    setRecentTeachers(current => {
      const next = [
        selection,
        ...current.filter(item => item.id !== selection.id),
      ].slice(0, 6);
      window.localStorage.setItem(recentTeachersKey, JSON.stringify(next));
      return next;
    });
    setIsTeacherModalOpen(false);
    setTeacherSearch('');
    if (role === 'company' && pendingViewRole === 'student') {
      setIsStudentModalOpen(true);
    }
  };

  const handleTeacherClear = () => {
    setSelectedTeacher(null);
    window.localStorage.removeItem(viewTeacherKey);
    window.localStorage.removeItem(VIEW_TEACHER_STORAGE_KEY);
    window.dispatchEvent(new Event('sm-view-teacher-updated'));
    if (role === 'company') {
      handleStudentClear();
      if (viewRole === 'student') {
        setPendingViewRole('student');
        setIsTeacherModalOpen(true);
      }
    }
  };

  const handleStudentSelect = (student: StudentRecord) => {
    const selection: SelectedStudent = {
      id: student.id,
      name: student.name,
      email: student.email,
    };
    handleStudentChoice(selection);
  };

  const handleStudentChoice = (selection: SelectedStudent) => {
    setSelectedStudent(selection);
    window.localStorage.setItem(viewStudentKey, JSON.stringify(selection));
    if (role === 'company') {
      if (user?.username) {
        window.localStorage.setItem(
          `${VIEW_STUDENT_STORAGE_KEY}:${user.username}`,
          JSON.stringify(selection),
        );
      }
      window.localStorage.setItem(
        VIEW_STUDENT_STORAGE_KEY,
        JSON.stringify(selection),
      );
    }
    window.dispatchEvent(new Event('sm-view-student-updated'));
    window.dispatchEvent(new Event('sm-selected-student-updated'));
    const nextRecent = [selection.id, ...recentStudentIds.filter(id => id !== selection.id)].slice(
      0,
      6,
    );
    window.localStorage.setItem(recentStudentsKey, JSON.stringify(nextRecent));
    setRecentStudentIds(nextRecent);
    if (selectedStudentKey) {
      window.localStorage.setItem(selectedStudentKey, selection.id);
      setSelectedStudentId(selection.id);
    }
    setIsStudentModalOpen(false);
    setStudentSearch('');

    window.dispatchEvent(
      new CustomEvent('sm-student-selection', {
        detail: { selectedId: selection.id, recentIds: nextRecent },
      }),
    );

    if (role === 'company' && pendingViewRole === 'student') {
      setPendingViewRole(null);
      setViewRole('student');
      window.localStorage.setItem(VIEW_ROLE_STORAGE_KEY, 'student');
      router.replace(roleHome.student);
    }
  };

  const handleStudentClear = () => {
    setSelectedStudent(null);
    window.localStorage.removeItem(viewStudentKey);
    window.localStorage.removeItem(VIEW_STUDENT_STORAGE_KEY);
    if (selectedStudentKey) {
      window.localStorage.removeItem(selectedStudentKey);
    }
    window.dispatchEvent(new Event('sm-view-student-updated'));
    window.dispatchEvent(new Event('sm-selected-student-updated'));
    setSelectedStudentId(null);
    window.dispatchEvent(
      new CustomEvent('sm-student-selection', {
        detail: { selectedId: null, recentIds: recentStudentIds },
      }),
    );
    if (role === 'company' && viewRole === 'student') {
      setPendingViewRole('student');
      if (selectedTeacher) {
        setIsStudentModalOpen(true);
      } else {
        setIsTeacherModalOpen(true);
      }
    }
  };

  const handleThemeChange = (nextTheme: ThemeMode) => {
    setTheme(nextTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  };

  const handleNewStudent = () => {
    if (effectiveRole !== 'teacher') return;
    router.push('/teachers/students?new=1');
    setIsOpen(false);
  };

  const handleNewTeacher = () => {
    if (effectiveRole !== 'company') return;
    router.push('/teachers?new=1');
    setIsOpen(false);
  };

  const handleTeacherMode = (mode: 'training' | 'teaching') => {
    if (effectiveRole !== 'teacher') return;
    router.push(`/teachers?mode=${mode}`);
    setIsOpen(false);
  };

  const displayName = useMemo(() => {
    const fallback = user?.username ?? 'Account';
    const name = accountInfo?.name ?? fallback;
    const match = name.match(/\s*\(([^)]+)\)\s*$/);
    if (match) {
      return name.replace(match[0], '').trim() || fallback;
    }
    return name;
  }, [accountInfo?.name, user?.username]);

  const recentThree = useMemo(
    () => recentTeachers.slice(0, 3),
    [recentTeachers],
  );
  const recentStudents = useMemo(() => {
    const byId = new Map(students.map(student => [student.id, student]));
    return recentStudentIds
      .map(id => byId.get(id))
      .filter((student): student is StudentRecord => Boolean(student))
      .map(student => ({
        id: student.id,
        name: student.name,
        email: student.email,
      }));
  }, [recentStudentIds, students]);

  const recentStudentThree = useMemo(
    () => recentStudents.slice(0, 3),
    [recentStudents],
  );

  useEffect(() => {
    if (role !== 'company' || !isReady) return;
    if (pendingViewRole !== 'student') return;
    if (!selectedTeacher) {
      setIsStudentModalOpen(false);
      setIsTeacherModalOpen(true);
      return;
    }
    const hasStudentSelection = Boolean(selectedStudentId || selectedStudent?.id);
    if (!hasStudentSelection) {
      setIsTeacherModalOpen(false);
      setIsStudentModalOpen(true);
    }
  }, [
    isReady,
    pendingViewRole,
    role,
    selectedStudent?.id,
    selectedStudentId,
    selectedTeacher,
  ]);

  const modalTeachers = useMemo(() => {
    const query = teacherSearch.trim().toLowerCase();
    if (!query) {
      return recentTeachers.slice(0, 6).map(teacher => ({
        id: teacher.id,
        name: teacher.name,
        username: teacher.username,
        label: 'Recent',
      }));
    }
    return teachers
      .filter(teacher =>
        [teacher.name, teacher.email, teacher.region, teacher.status]
          .join(' ')
          .toLowerCase()
          .includes(query),
      )
      .slice(0, 6)
      .map(teacher => ({
        id: teacher.id,
        name: teacher.name,
        username: toTeacherUsername(teacher),
        label: `${teacher.region} • ${normalizeTeacherStatus(teacher.status)}`,
      }));
  }, [recentTeachers, teacherSearch, teachers]);

  const modalStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();
    const candidates = students.filter(student => student.status !== 'Archived');
    if (!query) {
      return recentStudents.slice(0, 6).map(student => ({
        id: student.id,
        name: student.name,
        email: student.email ?? '',
        label: 'Recent',
      }));
    }
    return candidates
      .filter(student =>
        [student.name, student.email].join(' ').toLowerCase().includes(query),
      )
      .slice(0, 6)
      .map(student => ({
        id: student.id,
        name: student.name,
        email: student.email ?? '',
        label: student.email ? 'Match' : 'Student',
      }));
  }, [recentStudents, studentSearch, students]);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-[var(--c-f7f7f5)] text-[var(--c-1f1f1d)] flex items-center justify-center">
        <div className="text-sm uppercase tracking-[0.3em] text-[var(--c-6f6c65)]">
          Loading
        </div>
      </div>
    );
  }

  const isMessagesPage = Boolean(pathname?.includes('/messages'));

  return (
    <div className="app-shell-bg min-h-screen text-[var(--c-1f1f1d)]">
      {notifications.length > 0 && !isMessagesPage ? (
        <div className="fixed right-6 top-6 z-[70] flex w-full max-w-sm flex-col gap-3">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`relative cursor-pointer rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)]/95 px-4 py-3 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.45)] backdrop-blur ${
                notification.leaving ? 'animate-toast-out pointer-events-none' : 'animate-toast-in'
              }`}
              onClick={() => {
                if (notification.kind === 'notification') {
                  router.push(notification.route ?? '/notifications');
                  dismissNotification(notification.id);
                  return;
                }
                if (role === 'teacher') {
                  router.push(
                    `/teachers/messages?thread=${encodeURIComponent(
                      notification.threadId,
                    )}`,
                  );
                } else if (role === 'company') {
                  router.push('/company/messages');
                } else {
                  router.push('/students/messages');
                }
                dismissNotification(notification.id);
              }}
              onMouseEnter={() => {
                setHoveredNotifications(prev => ({ ...prev, [notification.id]: true }));
                pauseNotificationDismiss(notification.id);
              }}
              onMouseLeave={() => {
                if (notification.leaving) return;
                setHoveredNotifications(prev => ({ ...prev, [notification.id]: false }));
                scheduleNotificationDismiss(notification.id);
              }}
            >
              <button
                type="button"
                onClick={event => {
                  event.stopPropagation();
                  dismissNotification(notification.id);
                }}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-4 w-4"
                >
                  <path
                    d="M6 6l12 12M18 6l-12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
                {notification.kicker ?? 'New Message'}
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--c-1f1f1d)]">
                {notification.sender}
              </p>
              {notification.subject ? (
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--c-6f6c65)]">
                  {notification.subject}
                </p>
              ) : null}
              <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                {notification.text}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {pipState.open && pipState.material ? (
        <div
          className={`fixed z-[70] w-[360px] rounded-2xl border p-4 shadow-2xl backdrop-blur-sm ${
            pipDock === 'left-bottom'
              ? 'bottom-6 left-6'
              : pipDock === 'right-top'
                ? 'right-6 top-6'
                : 'bottom-6 right-6'
          }`}
          style={{
            backgroundColor: "var(--pip-bg)",
            borderColor: "var(--pip-border)",
            color: "var(--pip-text)",
          }}
        >
          <div
            className="flex items-start justify-between gap-3 select-none"
            style={{ touchAction: 'none' }}
            onPointerDown={(event) => {
              event.preventDefault();
              pipSwipeRef.current = {
                active: true,
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                startTime: performance.now(),
              };
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              if (!pipSwipeRef.current.active) return;
              if (pipSwipeRef.current.pointerId !== event.pointerId) return;
            }}
            onPointerUp={(event) => {
              if (!pipSwipeRef.current.active) return;
              if (pipSwipeRef.current.pointerId !== event.pointerId) return;
              const endX = event.clientX;
              const endY = event.clientY;
              const deltaX = endX - pipSwipeRef.current.startX;
              const deltaY = endY - pipSwipeRef.current.startY;
              const deltaTime = Math.max(
                1,
                performance.now() - pipSwipeRef.current.startTime,
              );
              const velocityX = deltaX / deltaTime;
              const velocityY = deltaY / deltaTime;
              const horizontalSwipe =
                Math.abs(deltaX) > 80 && Math.abs(velocityX) > 0.6;
              const verticalSwipe =
                Math.abs(deltaY) > 80 && Math.abs(velocityY) > 0.6;
              if (horizontalSwipe && Math.abs(deltaX) >= Math.abs(deltaY)) {
                if (deltaX < 0) {
                  setPipDock('left-bottom');
                } else {
                  setPipDock('right-bottom');
                }
              } else if (verticalSwipe && Math.abs(deltaY) > Math.abs(deltaX)) {
                if (pipDock.startsWith('right')) {
                  if (deltaY < 0) {
                    setPipDock('right-top');
                  } else {
                    setPipDock('right-bottom');
                  }
                }
              }
              pipSwipeRef.current = {
                active: false,
                pointerId: null,
                startX: 0,
                startY: 0,
                startTime: 0,
              };
              event.currentTarget.releasePointerCapture(event.pointerId);
              if (window.getSelection) {
                window.getSelection()?.removeAllRanges();
              }
            }}
            onPointerCancel={(event) => {
              if (pipSwipeRef.current.pointerId === event.pointerId) {
                pipSwipeRef.current = {
                  active: false,
                  pointerId: null,
                  startX: 0,
                  startTime: 0,
                };
              }
              if (window.getSelection) {
                window.getSelection()?.removeAllRanges();
              }
            }}
          >
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--pip-muted)]">
                {pipState.playing ? 'Now Playing' : 'Viewing'}
              </p>
              <p className="mt-2 text-lg font-semibold">
                {pipState.material}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[color:var(--pip-muted)]">
                {pipState.part || 'Select a lesson part to begin.'}
              </p>
            </div>
            <button
              type="button"
              onPointerDown={event => {
                event.stopPropagation();
              }}
              onClick={event => {
                event.stopPropagation();
                updatePipState({ open: false, playing: false });
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full border transition"
              style={{
                borderColor: "var(--pip-control-border)",
                color: "var(--pip-muted)",
              }}
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

          <div
            className="mt-4 overflow-hidden rounded-xl border"
            style={{
              borderColor: "var(--pip-border)",
              backgroundColor: "var(--pip-control-bg)",
            }}
          >
            <div className="relative flex aspect-video items-center justify-center">
              <img
                src="/reference/StudentVideo-2.png"
                alt="Lesson video preview"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{ background: "var(--pip-overlay)" }}
              />
              <div className="relative z-10 w-full -translate-y-4 px-4 text-center">
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/80">
                  {pipState.playing ? 'Now Playing' : 'Viewing'}
                </p>
                <p className="mt-2 text-lg font-semibold text-center text-white">
                  {pipState.material}
                </p>
                <p className="mt-1 text-xs text-white/70">
                  {pipState.part || 'Select a lesson part to begin.'}
                </p>
              </div>
              <div
                className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-between gap-2 border-t px-3 py-2"
                style={{
                  borderColor: "var(--pip-border)",
                  backgroundColor: "var(--pip-control-bg)",
                  color: "var(--pip-control-text)",
                }}
              >
                <button
                  type="button"
                  onClick={() => updatePipState({ playing: !pipState.playing })}
                  className="flex h-8 w-8 items-center justify-center rounded-full border transition"
                  style={{
                    borderColor: "var(--pip-control-border)",
                    backgroundColor: "rgba(255, 255, 255, 0.12)",
                    color: "var(--pip-control-text)",
                  }}
                  aria-label={pipState.playing ? 'Pause' : 'Play'}
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-4 w-4 translate-x-[1px] fill-current"
                  >
                    {pipState.playing ? (
                      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                    ) : (
                      <path d="M8 5v14l11-7z" />
                    )}
                  </svg>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePipPrev}
                    disabled={!pipCanPrev}
                    className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition ${
                      pipCanPrev
                        ? ''
                        : ''
                    }`}
                    style={{
                      borderColor: pipCanPrev
                        ? "var(--pip-control-border)"
                        : "var(--pip-border)",
                      color: pipCanPrev
                        ? "var(--pip-control-text)"
                        : "var(--pip-control-text)",
                    }}
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={handlePipNext}
                    disabled={!pipCanNext}
                    className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition ${
                      pipCanNext
                        ? ''
                        : ''
                    }`}
                    style={{
                      borderColor: pipCanNext
                        ? "var(--pip-control-border)"
                        : "var(--pip-border)",
                      color: pipCanNext
                        ? "var(--pip-control-text)"
                        : "var(--pip-control-text)",
                    }}
                  >
                    Next
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    updatePipState({ open: false, playing: pipState.playing });
                    setIsPipExpanded(true);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full border transition"
                  style={{
                    borderColor: "var(--pip-control-border)",
                    color: "var(--pip-control-text)",
                  }}
                  aria-label="Expand"
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
        </div>
      ) : null}

      {isPipExpanded && pipState.material ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsPipExpanded(false)}
          />
          <div className="relative w-full max-w-6xl rounded-3xl border border-white/10 bg-[#0b0b0b] p-6 shadow-2xl text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                  {pipState.playing ? 'Now Playing' : 'Viewing'}
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  {pipState.material}
                </h2>
                <p className="mt-2 text-sm text-white/70">
                  {pipState.part || 'Select a lesson part to begin.'}
                </p>
              </div>
              <button
                onClick={() => setIsPipExpanded(false)}
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
                <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center gap-3 border-t border-white/10 bg-black/60 px-4 py-3 text-white">
                  <button
                    type="button"
                    onClick={() =>
                      updatePipState({ playing: !pipState.playing })
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/15 text-sm text-white shadow-[0_8px_20px_rgba(0,0,0,0.35)] transition hover:border-white/40 hover:bg-white/25"
                    aria-label={pipState.playing ? 'Pause' : 'Play'}
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-4 w-4 translate-x-[1px] fill-current"
                    >
                      {pipState.playing ? (
                        <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                      ) : (
                        <path d="M8 5v14l11-7z" />
                      )}
                    </svg>
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePipPrev}
                      disabled={!pipCanPrev}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                        pipCanPrev
                          ? 'border-white/40 text-white hover:border-white'
                          : 'border-white/10 text-white/40'
                      }`}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={handlePipNext}
                      disabled={!pipCanNext}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                        pipCanNext
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
      <div className="flex min-h-screen">
        <aside
          className={`${
            isSidebarHidden ? 'hidden' : 'hidden lg:block'
          } relative w-72 border-r px-6 py-8 ${sidebarStyles.bg} ${sidebarStyles.border}`}
        >
          <button
            type="button"
            onClick={() => setIsSidebarHidden(true)}
            aria-label="Hide sidebar"
            className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--c-ecebe7)] bg-white text-[var(--c-6f6c65)] transition hover:border-[var(--c-d9d6ce)] hover:bg-[var(--c-fafafa)]"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 6 9 12 15 18" />
            </svg>
          </button>
          <div className="mb-10 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--c-c8102e)]">
                <img
                  src="https://simplymusic.com/wp-content/uploads/2024/02/simply-music-logo.svg"
                  alt="Simply Music"
                  className="h-[3.4rem] w-[3.4rem] rounded-xl"
                />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                  {sidebarRoleLabel}
                </p>
                <h2 className="text-xl font-semibold">Simply Music</h2>
              </div>
            </div>
          </div>
          <nav className="space-y-2 text-sm">
            {items.map(item => {
              if (effectiveRole === 'teacher' && item.label === 'Dashboard') {
                return (
                  <div key={item.label} className="space-y-2">
                    <a
                      href={item.href}
                      className="block rounded-lg px-3 py-2 font-medium text-[var(--c-3a3935)] transition hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)] hover:ring-1 hover:ring-[var(--sidebar-accent-border)]"
                    >
                      {item.label}
                    </a>
                    <a
                      href="/teachers/this-week"
                      className="block rounded-lg px-3 py-2 font-medium text-[var(--c-3a3935)] transition hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)] hover:ring-1 hover:ring-[var(--sidebar-accent-border)]"
                    >
                      This Week
                    </a>
                    <a
                      href="/teachers?mode=teaching"
                      className="block rounded-lg px-3 py-2 font-medium text-[var(--c-3a3935)] transition hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)] hover:ring-1 hover:ring-[var(--sidebar-accent-border)]"
                    >
                      Teaching
                    </a>
                    <a
                      href="/teachers?mode=training"
                      className="block rounded-lg px-3 py-2 font-medium text-[var(--c-3a3935)] transition hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)] hover:ring-1 hover:ring-[var(--sidebar-accent-border)]"
                    >
                      Training
                    </a>
                  </div>
                );
              }
              if (effectiveRole === 'teacher' && item.label === 'This Week') {
                return null;
              }
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className="block rounded-lg px-3 py-2 font-medium text-[var(--c-3a3935)] transition hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)] hover:ring-1 hover:ring-[var(--sidebar-accent-border)]"
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
          {effectiveRole === 'parent' ? (
            <section className="mt-4 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                Family Quick Actions
              </p>
              <div className="mt-3 grid gap-2">
                <a
                  href="/parents/messages"
                  className="rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)] transition hover:brightness-110"
                >
                  Message Teacher
                </a>
                <a
                  href="/parents/schedule"
                  className="rounded-full border border-[var(--c-ecebe7)] px-3 py-2 text-center text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)]"
                >
                  Request Reschedule
                </a>
                <a
                  href="/parents/billing"
                  className="rounded-full border border-[var(--c-ecebe7)] px-3 py-2 text-center text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)]"
                >
                  Update Payment
                </a>
              </div>
              <div className="mt-4 border-t border-[var(--c-ecebe7)] pt-3 text-[10px] uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
                Quick Actions
              </div>
            </section>
          ) : null}
          {showLessonRoomCta ? (
            <a
              href="/lesson-room"
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[var(--c-c8102e)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-md shadow-[var(--sidebar-accent-bg)] transition hover:brightness-110"
            >
              Lesson Room
            </a>
          ) : null}
          {isStudentSidebar ? (
            <section className="mt-4 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                Practice Timer
              </p>
              {isPracticeComplete ? (
                <div className="mt-3 space-y-3">
                  <div className="rounded-2xl border border-[var(--c-e7eddc)] bg-[var(--c-f7fbf0)] p-3 text-[var(--c-3f4a2c)]">
                    <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-3f4a2c)]">
                      Good Job!
                    </p>
                    <p className="mt-2 text-lg font-semibold text-[var(--c-3f4a2c)]">
                      Practice Complete
                    </p>
                    <p className="mt-1 text-xs text-[var(--c-3f4a2c)]/80">
                      You hit your {practiceMinutes} min goal.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handlePracticeStartNewSession}
                    className="w-full rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)] transition hover:brightness-110"
                  >
                    Start Another Session
                  </button>
                </div>
              ) : (
                <>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-2xl font-semibold text-[var(--c-1f1f1d)]">
                        {practiceTimeLabel}
                      </p>
                      <p className="mt-1 text-xs text-[var(--c-6f6c65)]">
                        {practiceMinutes} min goal
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button
                        type="button"
                        onClick={() => setPracticeSoundEnabled(current => !current)}
                        className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.2em] transition ${
                          practiceSoundEnabled
                            ? 'border-[var(--c-c8102e)] bg-[var(--c-fff5f6)] text-[var(--c-8f2f3b)]'
                            : 'border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] text-[var(--c-6f6c65)]'
                        }`}
                      >
                        Ding {practiceSoundEnabled ? 'On' : 'Off'}
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[var(--c-f1f1ef)]">
                    <div
                      className={`h-full rounded-full transition-[width] duration-500 ${
                        practiceRunning ? 'bg-[var(--c-3f4a2c)]' : 'bg-[var(--c-c8102e)]'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, practiceProgress * 100))}%` }}
                    />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={handlePracticeStart}
                      disabled={practiceRunning || practiceRemaining === 0}
                      className="rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Start
                    </button>
                    <button
                      type="button"
                      onClick={handlePracticePause}
                      disabled={!practiceRunning}
                      className="rounded-full border border-[var(--c-ecebe7)] px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Pause
                    </button>
                    <button
                      type="button"
                      onClick={handlePracticeReset}
                      className="rounded-full border border-[var(--c-ecebe7)] px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
                    >
                      Reset
                    </button>
                  </div>
                </>
              )}
              {practiceSessions.length > 0 ? (
                <div className="mt-4 border-t border-[var(--c-ecebe7)] pt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-6f6c65)]">
                      Sessions
                    </p>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                      Total {formatPracticeDuration(totalPracticeSeconds)}
                    </p>
                  </div>
                  <div className="mt-3 max-h-40 space-y-2 overflow-auto pr-1 text-xs">
                    {practiceSessions.map((session, index) => (
                      <div
                        key={session.id}
                        className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2"
                      >
                        <div className="flex items-center justify-between text-[var(--c-3a3935)]">
                          <span>Session {practiceSessions.length - index}</span>
                          <span>{formatPracticeDuration(session.duration)}</span>
                        </div>
                        <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                          {new Date(session.completedAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}
          {isStudentSidebar ? (
        <section className="mt-4 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4 shadow-sm">
            <div className="flex w-full items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setMetronomeOpen(current => !current)}
                className="text-left"
              >
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                  Metronome
                </p>
              </button>
              {metronomeOpen ? null : (
                <button
                  type="button"
                  onClick={metronomeRunning ? handleMetronomeStop : handleMetronomeStart}
                  className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.2em] transition ${
                    metronomeRunning
                      ? 'border-[var(--c-ecebe7)] text-[var(--c-6f6c65)]'
                      : 'border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] text-[var(--sidebar-accent-text)]'
                  }`}
                >
                  {metronomeRunning ? 'Stop' : 'Start'}
                </button>
              )}
            </div>
            <div className="mt-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-2xl font-semibold text-[var(--c-1f1f1d)]">
                  {metronomeTempo} BPM
                </p>
                  <p className="mt-1 text-xs text-[var(--c-6f6c65)]">
                    {metronomeTimeSig} · {metronomeAccent ? 'Accent On' : 'Accent off'}
                  </p>
                </div>
              </div>
              {metronomeOpen ? (
            <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {(['4/4', '3/4', '2/4'] as const).map(sig => (
                      <button
                        key={sig}
                        type="button"
                        onClick={() => setMetronomeTimeSig(sig)}
                        className={`rounded-full border px-3 py-2 text-[10px] uppercase tracking-[0.2em] transition ${
                          metronomeTimeSig === sig
                            ? 'border-[var(--c-c8102e)] bg-[var(--c-fff5f6)] text-[var(--c-8f2f3b)]'
                            : 'border-[var(--c-ecebe7)] text-[var(--c-6f6c65)]'
                        }`}
                      >
                        {sig}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setMetronomeTempo(current => Math.max(40, current - 2))}
                      className="rounded-full border border-[var(--c-ecebe7)] px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
                    >
                      −
                    </button>
                    <div className="text-sm uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                      Tempo
                    </div>
                    <button
                      type="button"
                      onClick={() => setMetronomeTempo(current => Math.min(220, current + 2))}
                      className="rounded-full border border-[var(--c-ecebe7)] px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMetronomeAccent(current => !current)}
                    className={`w-full rounded-full border px-3 py-2 text-[10px] uppercase tracking-[0.2em] transition ${
                      metronomeAccent
                        ? 'border-[var(--c-c8102e)] bg-[var(--c-fff5f6)] text-[var(--c-8f2f3b)]'
                        : 'border-[var(--c-ecebe7)] text-[var(--c-6f6c65)]'
                    }`}
                  >
                    Accent Beat One
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleMetronomeStart}
                      disabled={metronomeRunning}
                      className="rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Start
                    </button>
                    <button
                      type="button"
                      onClick={handleMetronomeStop}
                      disabled={!metronomeRunning}
                      className="rounded-full border border-[var(--c-ecebe7)] px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Stop
                    </button>
                  </div>
                </div>
              ) : null}
            <div
              className={`mt-4 ${metronomeOpen ? 'border-t border-[var(--c-ecebe7)] pt-3' : ''}`}
            >
              <MetronomePresetDropdown
                value={metronomePresetMatch}
                onSelect={preset => {
                  setMetronomeTempo(preset.tempo);
                  setMetronomeTimeSig(preset.timeSig);
                }}
              />
            </div>
          </section>
        ) : null}
        {isParentSidebar ? (
          <section className="mt-4 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
              My Kids Practiced
            </p>
            {parentStudents.length === 0 ? (
              <div className="mt-3 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-3 text-xs text-[var(--c-6f6c65)]">
                No students linked yet. Add students to see practice activity.
              </div>
            ) : (
              <>
                <div className="mt-3 space-y-2">
                  {parentPracticeSummary.map(student => {
                    const progress = Math.min(
                      100,
                      Math.round((student.minutes / student.goal) * 100),
                    );
                    return (
                      <div
                        key={student.name}
                        className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] px-3 py-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[var(--c-1f1f1d)]">
                            {student.name}
                          </span>
                          <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                            {student.minutes}/{student.goal} min
                          </span>
                        </div>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--c-f1f1ef)]">
                          <div
                            className="h-full rounded-full bg-[var(--c-3f4a2c)]"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 border-t border-[var(--c-ecebe7)] pt-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
                    Recent Sessions
                  </p>
                  <div className="mt-3 space-y-2 text-xs">
                    {parentPracticeSessions.slice(0, 4).map(session => (
                      <div
                        key={session.id}
                        className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] px-3 py-2"
                      >
                        <div className="flex items-center justify-between text-[var(--c-3a3935)]">
                          <span>{session.name}</span>
                          <span>{session.minutes} min</span>
                        </div>
                        <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                          {session.time}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>
        ) : null}
          {user ? (
            <div className="mt-4 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4 text-xs text-[var(--c-7a776f)]">
              <p className="mt-2 text-base font-semibold text-[var(--c-1f1f1d)]">
                {displayName}
              </p>
              <p className="mt-1 text-sm text-[var(--c-9a9892)]">
                {accountInfo?.email ?? `${user.username}@simplymusic.com`}
              </p>
              <button
                onClick={openAccountModal}
                className="mt-4 w-full rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--c-fafafa)] px-4 py-2.5 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)]"
              >
                Account Details
              </button>
              <div className="mt-4 border-t border-[var(--c-ecebe7)] pt-3 text-[10px] uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
                Account
              </div>
            </div>
          ) : null}
          {role === 'company' ? (
            <div className="mt-4 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-4 text-xs text-[var(--c-7a776f)]">
            <button
              onClick={() => setIsTeacherModalOpen(true)}
              className="w-full rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-4 py-2.5 text-xs uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)] transition hover:brightness-110"
            >
              Browse
            </button>
              <div className="mt-4 space-y-2">
                {recentThree.length === 0 ? (
                  <div className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-[11px] text-[var(--c-6f6c65)]">
                    No recent teachers yet. Open browse to pick one.
                  </div>
                ) : (
                  recentThree.map((teacher, index) => {
                    const isSelected = selectedTeacher?.id === teacher.id;
                  return (
                    <button
                      key={teacher.id}
                      onClick={() =>
                        isSelected
                          ? handleTeacherClear()
                          : handleTeacherChoice(teacher)
                      }
                      className={`flex w-full items-center rounded-xl border px-3 py-2 text-left transition min-h-[72px] ${
                        isSelected
                          ? 'border-[var(--sidebar-selected-border)] bg-[var(--sidebar-selected-bg)] shadow-sm'
                          : 'border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] hover:border-[var(--sidebar-accent-border)]'
                        }`}
                      >
                        <div className="flex w-full items-center justify-between gap-2">
                          <div>
                            <p
                              className={`text-sm font-semibold ${
                                isSelected
                                  ? 'text-[var(--sidebar-selected-text)]'
                                  : 'text-[var(--c-1f1f1d)]'
                              }`}
                            >
                              {teacher.name}
                            </p>
                            <p
                              className={`text-[10px] uppercase tracking-[0.2em] ${
                                isSelected
                                  ? 'text-[var(--sidebar-selected-text)]/80'
                                  : 'text-[var(--c-6f6c65)]'
                              }`}
                            >
                              {index === 0 ? 'Last used' : 'Recent'}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${
                              isSelected
                                ? 'border border-white/25 bg-white/10 text-[var(--sidebar-selected-text)]'
                                : 'border border-[var(--c-e5e3dd)] text-[var(--c-6f6c65)]'
                            }`}
                          >
                            {isSelected ? 'Selected' : 'Select'}
                          </span>
                        </div>
                      </button>
                  );
                })
              )}
            </div>
            <div className="mt-4 border-t border-[var(--c-ecebe7)] pt-3 text-[10px] uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
              Choose A Teacher
            </div>
          </div>
        ) : null}
          {role === 'teacher' ? (
            <div className="mt-4 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-4 text-xs text-[var(--c-7a776f)]">
              <button
                onClick={() => setIsStudentModalOpen(true)}
                className="w-full rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-4 py-2.5 text-xs uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)] transition hover:brightness-110"
              >
                Browse Students
              </button>
              <div className="mt-4 space-y-2">
                {recentStudentThree.length === 0 ? (
                  <div className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-[11px] text-[var(--c-6f6c65)]">
                    No recent students yet. Open browse to pick one.
                  </div>
                ) : (
                  recentStudentThree.map((student, index) => {
                    const isSelected = selectedStudent?.id === student.id;
                    return (
                      <button
                        key={student.id}
                        onClick={() =>
                          isSelected
                            ? handleStudentClear()
                            : handleStudentChoice(student)
                        }
                        className={`flex w-full items-center rounded-xl border px-3 py-2 text-left transition min-h-[72px] ${
                          isSelected
                            ? 'border-[var(--sidebar-selected-border)] bg-[var(--sidebar-selected-bg)]/85 shadow-sm'
                            : 'border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] hover:border-[var(--sidebar-accent-border)]'
                        }`}
                      >
                        <div className="flex w-full items-center justify-between gap-2">
                          <div>
                            <p
                              className={`text-sm font-semibold ${
                                isSelected
                                  ? 'text-[var(--sidebar-selected-text)]'
                                  : 'text-[var(--c-1f1f1d)]'
                              }`}
                            >
                              {student.name}
                            </p>
                            <p
                              className={`text-[10px] uppercase tracking-[0.2em] ${
                                isSelected
                                  ? 'text-[var(--sidebar-selected-text)]/80'
                                  : 'text-[var(--c-6f6c65)]'
                              }`}
                            >
                              {index === 0 ? 'Last used' : 'Recent'}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${
                              isSelected
                                ? 'border border-white/25 bg-white/10 text-[var(--sidebar-selected-text)]'
                                : 'border border-[var(--c-e5e3dd)] text-[var(--c-6f6c65)]'
                            }`}
                          >
                            {isSelected ? 'Selected' : 'Select'}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
              <div className="mt-4 border-t border-[var(--c-ecebe7)] pt-3 text-[10px] uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
                Choose A Student
              </div>
            </div>
          ) : null}
          {effectiveRole === 'company' ? null : null}
        {role === 'company' ? (
          <div className="mt-4 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-4 text-xs text-[var(--c-7a776f)]">
            <div className="mt-3 flex flex-col gap-2">
              {(['company', 'teacher', 'student', 'parent'] as UserRole[]).map(option => (
                <button
                  key={option}
                  onClick={() => handleViewRoleChange(option)}
                  className={`rounded-full px-4 py-2.5 text-xs uppercase tracking-[0.2em] transition ${
                    effectiveRole === option
                      ? 'bg-[var(--sidebar-selected-bg)] text-[var(--sidebar-selected-text)] border-[var(--sidebar-selected-border)]'
                      : 'border border-[var(--sidebar-accent-border)] text-[var(--c-6f6c65)] hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)]'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="mt-4 border-t border-[var(--c-ecebe7)] pt-3 text-[10px] uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
              View As
            </div>
          </div>
        ) : null}
        {role === 'teacher' ? (
          <div className="mt-4 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-4 text-xs text-[var(--c-7a776f)]">
            <div className="mt-3 flex flex-col gap-2">
              {(['teacher', 'student'] as UserRole[]).map(option => (
                <button
                  key={option}
                  onClick={() => handleViewRoleChange(option)}
                  className={`rounded-full px-4 py-2.5 text-xs uppercase tracking-[0.2em] transition ${
                    effectiveRole === option
                      ? 'bg-[var(--sidebar-selected-bg)] text-[var(--sidebar-selected-text)] border-[var(--sidebar-selected-border)]'
                      : 'border border-[var(--sidebar-accent-border)] text-[var(--c-6f6c65)] hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)]'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="mt-4 border-t border-[var(--c-ecebe7)] pt-3 text-[10px] uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
              View As
            </div>
          </div>
        ) : null}
        <div className="mt-4 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-4 text-xs text-[var(--c-7a776f)]">
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => handleThemeChange('light')}
              className={`rounded-full px-3 py-2 text-[10px] uppercase tracking-[0.2em] transition ${
                theme === 'light'
                  ? 'bg-[var(--sidebar-selected-bg)] text-[var(--sidebar-selected-text)] border-[var(--sidebar-selected-border)]'
                  : 'border border-[var(--sidebar-accent-border)] text-[var(--c-6f6c65)] hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)]'
              }`}
            >
              Light
            </button>
            <button
              onClick={() => handleThemeChange('dark')}
              className={`rounded-full px-3 py-2 text-[10px] uppercase tracking-[0.2em] transition ${
                theme === 'dark'
                  ? 'bg-[var(--sidebar-selected-bg)] text-[var(--sidebar-selected-text)] border-[var(--sidebar-selected-border)]'
                  : 'border border-[var(--sidebar-accent-border)] text-[var(--c-6f6c65)] hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)]'
              }`}
            >
              Dark
            </button>
          </div>
          <div className="mt-4 border-t border-[var(--c-ecebe7)] pt-3 text-[10px] uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
            Theme
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-6 w-full rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--c-ffffff)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)]"
        >
          Log Out
        </button>
        {effectiveRole === 'company' ? (
          <a
            href="/company/whats-next"
            className="mt-2 inline-flex w-full items-center justify-center rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--c-ffffff)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)]"
          >
            What&#39;s Next
          </a>
        ) : null}
        {effectiveRole === 'company' ? (
          <a
            href="/company/features-overview"
            className="mt-2 inline-flex w-full items-center justify-center rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--c-ffffff)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)]"
          >
            Features Overview
          </a>
        ) : null}
        {effectiveRole === 'company' ? (
          <a
            href="/company/what-we-offer"
            className="mt-2 inline-flex w-full items-center justify-center rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--c-ffffff)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)]"
          >
            What We Offer
          </a>
        ) : null}
      </aside>

        <div className="flex-1 relative">
          {isSidebarHidden ? (
            <button
              type="button"
              onClick={() => setIsSidebarHidden(false)}
              aria-label="Show sidebar"
              className="fixed left-4 top-4 z-40 hidden h-9 w-9 items-center justify-center rounded-lg border border-white/60 bg-white/35 text-[var(--c-6f6c65)] backdrop-blur-[1px] transition hover:border-white/80 hover:bg-white/50 lg:inline-flex"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 6 15 12 9 18" />
              </svg>
            </button>
          ) : null}
        <div className="flex items-center justify-between border-b border-[var(--c-ecebe7)] bg-[color:var(--c-ffffff)]/70 px-6 py-4 backdrop-blur lg:hidden">
            <button
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--c-c8102e)] text-white shadow-sm transition hover:brightness-110"
              onClick={() => setIsOpen(true)}
              aria-label="Open menu"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          <div className="text-sm uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
            {user ? `${user.username} • ${user.role}` : 'Simply Music'}
          </div>
        </div>
        <main className="p-6 md:p-10">{children}</main>
        {showBackToTop ? (
          <button
            type="button"
            onClick={handleBackToTop}
            aria-label="Back to top"
            className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-lg border border-white/60 bg-white/35 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--c-6f6c65)] backdrop-blur-[1px] transition hover:border-white/80 hover:bg-white/50"
            style={{
              opacity: backToTopOpacity,
              pointerEvents: backToTopOpacity < 0.1 ? 'none' : 'auto',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              className="block"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="18 15 12 9 6 15" />
            </svg>
            <span>Back To Top</span>
          </button>
        ) : null}
        {role === 'company' &&
        featuresOverviewActive &&
        !pathname?.startsWith('/company/features-overview') ? (
          <div className="fixed left-1/2 top-4 z-40 -translate-x-1/2">
            <div className="flex items-center gap-3 rounded-full border border-white/30 bg-white/30 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--c-1f1f1d)]/80 shadow-md backdrop-blur-[2px]">
              <button
                type="button"
                onClick={handleBackToFeaturesOverview}
                className="transition hover:brightness-110"
              >
                BACK TO FEATURES OVERVIEW
              </button>
              <span className="h-5 w-px bg-[var(--c-1f1f1d)]/20" />
              <button
                type="button"
                onClick={handleExitFeaturesOverview}
                className="transition hover:brightness-110"
              >
                CLOSE
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>

    {isAccountModalOpen ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={closeAccountModal}
        />
        <div className="relative w-full max-w-xl rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                Account
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                Account Details
              </h2>
              <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                Update your profile details. Role and username are locked.
              </p>
            </div>
          </div>

          <form
            className="mt-6 space-y-4"
            onSubmit={handleAccountSave}
            autoComplete="off"
            onKeyDown={event => {
              if (
                event.key === 'Enter' &&
                event.target instanceof HTMLTextAreaElement
              ) {
                return;
              }
              if (event.key === 'Enter') {
                event.preventDefault();
                handleAccountSave(event as React.FormEvent<HTMLFormElement>);
              }
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Name
                <input
                  autoComplete="name"
                  value={accountForm.name}
                  onChange={event =>
                    setAccountForm(current => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3 text-sm text-[var(--c-1f1f1d)] outline-none focus:border-[var(--c-c8102e)]"
                  placeholder="Full name"
                />
              </label>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Email
                <input
                  autoComplete="email"
                  value={accountForm.email}
                  onChange={event =>
                    setAccountForm(current => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3 text-sm text-[var(--c-1f1f1d)] outline-none focus:border-[var(--c-c8102e)]"
                  placeholder="Email address"
                />
              </label>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Goes By
                <input
                  autoComplete="nickname"
                  value={accountForm.goesBy}
                  onChange={event =>
                    setAccountForm(current => ({
                      ...current,
                      goesBy: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3 text-sm text-[var(--c-1f1f1d)] outline-none focus:border-[var(--c-c8102e)]"
                  placeholder="e.g., Mr. Neil"
                />
              </label>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Username
                <input
                  value={user?.username ?? ''}
                  disabled
                  autoComplete="username"
                  className="mt-2 w-full rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-f1f0ec)] px-4 py-3 text-sm text-[var(--c-6f6c65)]"
                />
              </label>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Role
                <input
                  value={user?.role ?? ''}
                  disabled
                  autoComplete="organization"
                  className="mt-2 w-full rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-f1f0ec)] px-4 py-3 text-sm text-[var(--c-6f6c65)]"
                />
              </label>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] sm:col-span-2">
                Password
                <input
                  type="password"
                  autoComplete="new-password"
                  value={accountForm.password}
                  onChange={event =>
                    setAccountForm(current => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3 text-sm text-[var(--c-1f1f1d)] outline-none focus:border-[var(--c-c8102e)]"
                  placeholder="Set new password"
                />
              </label>
              {effectiveRole === 'student' ? (
                <>
                  <div className="sm:col-span-2 mt-2">
                    <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                        Practice Timer
                      </p>
                      <div className="mt-3 grid gap-4 sm:grid-cols-2">
                        <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                          Daily Goal (Minutes)
                          <input
                            type="number"
                            min={5}
                            max={180}
                            step={1}
                            value={practiceMinutes}
                            onChange={event => {
                              const next = Number(event.target.value);
                              if (Number.isNaN(next)) return;
                              const clamped = Math.min(180, Math.max(5, next));
                              setPracticeMinutes(clamped);
                              if (!practiceRunning && practiceRemaining === practiceTotalSeconds) {
                                setPracticeRemaining(clamped * 60);
                              }
                            }}
                            className="mt-2 w-full rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-3 text-sm text-[var(--c-1f1f1d)] outline-none focus:border-[var(--c-c8102e)]"
                          />
                        </label>
                        <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                          Completion Sound
                          <button
                            type="button"
                            onClick={() => setPracticeSoundEnabled(current => !current)}
                            className={`mt-2 flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition ${
                              practiceSoundEnabled
                                ? 'border-[var(--c-c8102e)] bg-[var(--c-fff5f6)] text-[var(--c-8f2f3b)]'
                                : 'border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] text-[var(--c-6f6c65)]'
                            }`}
                          >
                            <span>{practiceSoundEnabled ? 'Ding enabled' : 'Ding disabled'}</span>
                            <span className="text-xs uppercase tracking-[0.2em]">
                              {practiceSoundEnabled ? 'On' : 'Off'}
                            </span>
                          </button>
                        </label>
                      </div>
                      <p className="mt-3 text-xs text-[var(--c-6f6c65)]">
                        This timer stays active across your dashboard until you pause or reset it.
                      </p>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {accountError ? (
              <div className="rounded-xl border border-[var(--c-f2d7db)] bg-[var(--c-fff5f6)] px-4 py-3 text-sm text-[var(--c-8f2f3b)]">
                {accountError}
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={closeAccountModal}
                className="w-full rounded-full border border-[var(--c-ecebe7)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={accountSaving}
                className="w-full rounded-full bg-[var(--c-c8102e)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {accountSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    ) : null}

      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setIsOpen(false)}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform border-r px-6 py-8 shadow-xl backdrop-blur-xl transition-transform ${
          sidebarStyles.bg
        } ${sidebarStyles.border} ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[var(--c-c8102e)] text-white flex items-center justify-center font-semibold">
              SM
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                Admin
              </p>
              <h2 className="text-xl font-semibold">Simply Music</h2>
            </div>
          </div>
          <button
            className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
            onClick={() => setIsOpen(false)}
          >
            Close
          </button>
        </div>
        {effectiveRole === 'company' ? (
          <a
            href="/company/whats-next"
            className="mb-6 inline-flex w-full items-center justify-center rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-4 py-3 text-lg font-semibold text-[var(--sidebar-accent-text)] shadow-sm transition hover:brightness-110"
            onClick={() => setIsOpen(false)}
          >
            What&#39;s Next
          </a>
        ) : null}
        {effectiveRole === 'company' ? (
          <a
            href="/company/features-overview"
            className="mb-2 inline-flex w-full items-center justify-center rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--c-ffffff)] px-4 py-2 text-sm font-medium text-[var(--c-6f6c65)] transition hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)]"
            onClick={() => setIsOpen(false)}
          >
            Features Overview
          </a>
        ) : null}
        {effectiveRole === 'company' ? (
          <a
            href="/company/what-we-offer"
            className="mb-6 inline-flex w-full items-center justify-center rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--c-ffffff)] px-4 py-2 text-sm font-medium text-[var(--c-6f6c65)] transition hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)]"
            onClick={() => setIsOpen(false)}
          >
            What We Offer
          </a>
        ) : null}
        <nav className="space-y-2 text-sm">
          {items.map(item => {
            if (effectiveRole === 'teacher' && item.label === 'Dashboard') {
              return (
                <div key={item.label} className="space-y-2">
                  <a
                    href={item.href}
                    className="block rounded-lg px-3 py-2 font-medium text-[var(--c-3a3935)] transition hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)] hover:ring-1 hover:ring-[var(--sidebar-accent-border)]"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </a>
                  <a
                    href="/teachers?mode=training"
                    className="block rounded-lg px-3 py-2 font-medium text-[var(--c-3a3935)] transition hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)] hover:ring-1 hover:ring-[var(--sidebar-accent-border)]"
                    onClick={() => setIsOpen(false)}
                  >
                    Training
                  </a>
                  <a
                    href="/teachers?mode=teaching"
                    className="block rounded-lg px-3 py-2 font-medium text-[var(--c-3a3935)] transition hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)] hover:ring-1 hover:ring-[var(--sidebar-accent-border)]"
                    onClick={() => setIsOpen(false)}
                  >
                    Teaching
                  </a>
                </div>
              );
            }
            return (
              <a
                key={item.label}
                href={item.href}
                className="block rounded-lg px-3 py-2 font-medium text-[var(--c-3a3935)] transition hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)] hover:ring-1 hover:ring-[var(--sidebar-accent-border)]"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
        {effectiveRole === 'parent' ? (
          <section className="mt-4 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
              Family Quick Actions
            </p>
            <div className="mt-3 grid gap-2">
              <a
                href="/parents/messages"
                onClick={() => setIsOpen(false)}
                className="rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)] transition hover:brightness-110"
              >
                Message Teacher
              </a>
              <a
                href="/parents/schedule"
                onClick={() => setIsOpen(false)}
                className="rounded-full border border-[var(--c-ecebe7)] px-3 py-2 text-center text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)]"
              >
                Request Reschedule
              </a>
              <a
                href="/parents/billing"
                onClick={() => setIsOpen(false)}
                className="rounded-full border border-[var(--c-ecebe7)] px-3 py-2 text-center text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)]"
              >
                Update Payment
              </a>
            </div>
            <div className="mt-4 border-t border-[var(--c-ecebe7)] pt-3 text-[10px] uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
              Quick Actions
            </div>
          </section>
        ) : null}
        {showLessonRoomCta ? (
          <a
            href="/lesson-room"
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[var(--c-c8102e)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-md shadow-[var(--sidebar-accent-bg)] transition hover:brightness-110"
            onClick={() => setIsOpen(false)}
          >
            Lesson Room
          </a>
        ) : null}
        {isStudentSidebar ? (
          <section className="mt-4 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
              Practice Timer
            </p>
            {isPracticeComplete ? (
              <div className="mt-3 space-y-3">
                <div className="rounded-2xl border border-[var(--c-e7eddc)] bg-[var(--c-f7fbf0)] p-3 text-[var(--c-3f4a2c)]">
                  <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-3f4a2c)]">
                    Good Job!
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[var(--c-3f4a2c)]">
                    Practice Complete
                  </p>
                  <p className="mt-1 text-xs text-[var(--c-3f4a2c)]/80">
                    You hit your {practiceMinutes} min goal.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handlePracticeStartNewSession}
                  className="w-full rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)] transition hover:brightness-110"
                >
                  Start Another Session
                </button>
              </div>
            ) : (
              <>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-2xl font-semibold text-[var(--c-1f1f1d)]">
                      {practiceTimeLabel}
                    </p>
                    <p className="mt-1 text-xs text-[var(--c-6f6c65)]">
                      {practiceMinutes} min goal
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      type="button"
                      onClick={() => setPracticeSoundEnabled(current => !current)}
                      className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.2em] transition ${
                        practiceSoundEnabled
                          ? 'border-[var(--c-c8102e)] bg-[var(--c-fff5f6)] text-[var(--c-8f2f3b)]'
                          : 'border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] text-[var(--c-6f6c65)]'
                      }`}
                    >
                      Ding {practiceSoundEnabled ? 'On' : 'Off'}
                    </button>
                  </div>
                </div>
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[var(--c-f1f1ef)]">
                  <div
                    className={`h-full rounded-full transition-[width] duration-500 ${
                      practiceRunning ? 'bg-[var(--c-3f4a2c)]' : 'bg-[var(--c-c8102e)]'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, practiceProgress * 100))}%` }}
                  />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={handlePracticeStart}
                    disabled={practiceRunning || practiceRemaining === 0}
                    className="rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Start
                  </button>
                  <button
                    type="button"
                    onClick={handlePracticePause}
                    disabled={!practiceRunning}
                    className="rounded-full border border-[var(--c-ecebe7)] px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Pause
                  </button>
                  <button
                    type="button"
                    onClick={handlePracticeReset}
                    className="rounded-full border border-[var(--c-ecebe7)] px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
                  >
                    Reset
                  </button>
                </div>
              </>
            )}
            {practiceSessions.length > 0 ? (
              <div className="mt-4 border-t border-[var(--c-ecebe7)] pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-6f6c65)]">
                    Sessions
                  </p>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                    Total {formatPracticeDuration(totalPracticeSeconds)}
                  </p>
                </div>
                <div className="mt-3 max-h-40 space-y-2 overflow-auto pr-1 text-xs">
                  {practiceSessions.map((session, index) => (
                    <div
                      key={session.id}
                      className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-2"
                    >
                      <div className="flex items-center justify-between text-[var(--c-3a3935)]">
                        <span>Session {practiceSessions.length - index}</span>
                        <span>{formatPracticeDuration(session.duration)}</span>
                      </div>
                      <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                        {new Date(session.completedAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}
        {isStudentSidebar ? (
          <section className="mt-4 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4 shadow-sm">
            <div className="flex w-full items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setMetronomeOpen(current => !current)}
                className="text-left"
              >
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                  Metronome
                </p>
              </button>
              {metronomeOpen ? null : (
                <button
                  type="button"
                  onClick={metronomeRunning ? handleMetronomeStop : handleMetronomeStart}
                  className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.2em] transition ${
                    metronomeRunning
                      ? 'border-[var(--c-ecebe7)] text-[var(--c-6f6c65)]'
                      : 'border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] text-[var(--sidebar-accent-text)]'
                  }`}
                >
                  {metronomeRunning ? 'Stop' : 'Start'}
                </button>
              )}
            </div>
            <div className="mt-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-2xl font-semibold text-[var(--c-1f1f1d)]">
                  {metronomeTempo} BPM
                </p>
                <p className="mt-1 text-xs text-[var(--c-6f6c65)]">
                  {metronomeTimeSig} · {metronomeAccent ? 'Accent On' : 'Accent off'}
                </p>
              </div>
            </div>
            {metronomeOpen ? (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {(['4/4', '3/4', '2/4'] as const).map(sig => (
                    <button
                      key={sig}
                      type="button"
                      onClick={() => setMetronomeTimeSig(sig)}
                      onPointerDown={event => event.stopPropagation()}
                      onClickCapture={event => event.stopPropagation()}
                      className={`rounded-full border px-3 py-2 text-[10px] uppercase tracking-[0.2em] transition ${
                        metronomeTimeSig === sig
                          ? 'border-[var(--c-c8102e)] bg-[var(--c-fff5f6)] text-[var(--c-8f2f3b)]'
                          : 'border-[var(--c-ecebe7)] text-[var(--c-6f6c65)]'
                      }`}
                    >
                      {sig}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setMetronomeTempo(current => Math.max(40, current - 2))}
                      onPointerDown={event => event.stopPropagation()}
                      onClickCapture={event => event.stopPropagation()}
                      className="rounded-full border border-[var(--c-ecebe7)] px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
                    >
                      −
                    </button>
                  <div className="text-sm uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                    Tempo
                  </div>
                    <button
                      type="button"
                      onClick={() => setMetronomeTempo(current => Math.min(220, current + 2))}
                      onPointerDown={event => event.stopPropagation()}
                      onClickCapture={event => event.stopPropagation()}
                      className="rounded-full border border-[var(--c-ecebe7)] px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
                    >
                      +
                    </button>
                </div>
                  <button
                    type="button"
                    onClick={() => setMetronomeAccent(current => !current)}
                    onPointerDown={event => event.stopPropagation()}
                    onClickCapture={event => event.stopPropagation()}
                    className={`w-full rounded-full border px-3 py-2 text-[10px] uppercase tracking-[0.2em] transition ${
                      metronomeAccent
                        ? 'border-[var(--c-c8102e)] bg-[var(--c-fff5f6)] text-[var(--c-8f2f3b)]'
                      : 'border-[var(--c-ecebe7)] text-[var(--c-6f6c65)]'
                  }`}
                >
                  Accent Beat One
                </button>
                <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleMetronomeStart}
                      onPointerDown={event => event.stopPropagation()}
                      onClickCapture={event => event.stopPropagation()}
                      disabled={metronomeRunning}
                      className="rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Start
                    </button>
                    <button
                      type="button"
                      onClick={handleMetronomeStop}
                      onPointerDown={event => event.stopPropagation()}
                      onClickCapture={event => event.stopPropagation()}
                      disabled={!metronomeRunning}
                      className="rounded-full border border-[var(--c-ecebe7)] px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                    Stop
                  </button>
                </div>
              </div>
              ) : null}
            <div
              className={`mt-4 ${metronomeOpen ? 'border-t border-[var(--c-ecebe7)] pt-3' : ''}`}
            >
              <MetronomePresetDropdown
                value={metronomePresetMatch}
                onSelect={preset => {
                  setMetronomeTempo(preset.tempo);
                  setMetronomeTimeSig(preset.timeSig);
                }}
              />
            </div>
          </section>
        ) : null}
        {isParentSidebar ? (
          <section className="mt-4 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
              My Kids Practiced
            </p>
            {parentStudents.length === 0 ? (
              <div className="mt-3 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-3 text-xs text-[var(--c-6f6c65)]">
                No students linked yet. Add students to see practice activity.
              </div>
            ) : (
              <>
                <div className="mt-3 space-y-2">
                  {parentPracticeSummary.map(student => {
                    const progress = Math.min(
                      100,
                      Math.round((student.minutes / student.goal) * 100),
                    );
                    return (
                      <div
                        key={student.name}
                        className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] px-3 py-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[var(--c-1f1f1d)]">
                            {student.name}
                          </span>
                          <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                            {student.minutes}/{student.goal} min
                          </span>
                        </div>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--c-f1f1ef)]">
                          <div
                            className="h-full rounded-full bg-[var(--c-3f4a2c)]"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 border-t border-[var(--c-ecebe7)] pt-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
                    Recent Sessions
                  </p>
                  <div className="mt-3 space-y-2 text-xs">
                    {parentPracticeSessions.slice(0, 4).map(session => (
                      <div
                        key={session.id}
                        className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] px-3 py-2"
                      >
                        <div className="flex items-center justify-between text-[var(--c-3a3935)]">
                          <span>{session.name}</span>
                          <span>{session.minutes} min</span>
                        </div>
                        <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                          {session.time}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>
        ) : null}
        {user ? (
          <div className="mt-4 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4 text-xs text-[var(--c-7a776f)]">
            <p className="mt-2 text-base font-semibold text-[var(--c-1f1f1d)]">
              {displayName}
            </p>
            <p className="mt-1 text-sm text-[var(--c-9a9892)]">
              {accountInfo?.email ?? `${user.username}@simplymusic.com`}
            </p>
            <button
              onClick={openAccountModal}
              className="mt-4 w-full rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--c-ffffff)] px-4 py-2.5 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)]"
            >
              Account Details
            </button>
            <div className="mt-4 border-t border-[var(--c-ecebe7)] pt-3 text-[10px] uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
              Account
            </div>
          </div>
        ) : null}
        {role === 'company' ? (
          <div className="mt-4 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-4 text-xs text-[var(--c-7a776f)]">
            <button
              onClick={() => setIsTeacherModalOpen(true)}
              className="w-full rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-4 py-2.5 text-xs uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)] transition hover:brightness-110"
            >
              Browse
            </button>
            <div className="mt-4 space-y-2">
              {recentThree.length === 0 ? (
                <div className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-[11px] text-[var(--c-6f6c65)]">
                  No recent teachers yet. Open browse to pick one.
                </div>
              ) : (
                recentThree.map((teacher, index) => {
                  const isSelected = selectedTeacher?.id === teacher.id;
                  return (
                    <button
                      key={teacher.id}
                      onClick={() =>
                        isSelected
                          ? handleTeacherClear()
                          : handleTeacherChoice(teacher)
                      }
                      className={`flex w-full items-center rounded-xl border px-3 py-2 text-left transition min-h-[72px] ${
                        isSelected
                          ? 'border-[var(--sidebar-selected-border)] bg-[var(--sidebar-selected-bg)] shadow-sm'
                          : 'border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] hover:border-[var(--sidebar-accent-border)]'
                      }`}
                    >
                      <div className="flex w-full items-center justify-between gap-2">
                        <div>
                          <p
                            className={`text-sm font-semibold ${
                              isSelected
                                ? 'text-[var(--sidebar-selected-text)]'
                                : 'text-[var(--c-1f1f1d)]'
                            }`}
                          >
                            {teacher.name}
                          </p>
                          <p
                            className={`text-[10px] uppercase tracking-[0.2em] ${
                              isSelected
                                ? 'text-[var(--sidebar-selected-text)]/80'
                                : 'text-[var(--c-6f6c65)]'
                            }`}
                          >
                            {index === 0 ? 'Last used' : 'Recent'}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${
                            isSelected
                              ? 'bg-[var(--sidebar-selected-bg)] text-[var(--sidebar-selected-text)] border-[var(--sidebar-selected-border)]'
                              : 'border border-[var(--c-e5e3dd)] text-[var(--c-6f6c65)]'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Select'}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            <div className="mt-4 border-t border-[var(--c-ecebe7)] pt-3 text-[10px] uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
              Choose A Teacher
            </div>
          </div>
        ) : null}
        {effectiveRole === 'company' ? null : null}
        {role === 'company' ? (
          <div className="mt-4 rounded-xl border border-[var(--c-ecebe7)] bg-[color:var(--c-ffffff)]/80 p-4 text-xs text-[var(--c-7a776f)]">
            <div className="mt-3 flex flex-col gap-2">
              {(['company', 'teacher', 'student', 'parent'] as UserRole[]).map(option => (
                <button
                  key={option}
                  onClick={() => handleViewRoleChange(option)}
                  className={`rounded-full px-4 py-2.5 text-xs uppercase tracking-[0.2em] transition ${
                    effectiveRole === option
                      ? 'bg-[var(--sidebar-selected-bg)] text-[var(--sidebar-selected-text)] border-[var(--sidebar-selected-border)]'
                      : 'border border-[var(--sidebar-accent-border)] text-[var(--c-6f6c65)] hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)]'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="mt-4 border-t border-[var(--c-ecebe7)] pt-3 text-[10px] uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
              View As
            </div>
          </div>
        ) : null}
        {role === 'teacher' ? (
          <div className="mt-4 rounded-xl border border-[var(--c-ecebe7)] bg-[color:var(--c-ffffff)]/80 p-4 text-xs text-[var(--c-7a776f)]">
            <div className="mt-3 flex flex-col gap-2">
              {(['teacher', 'student'] as UserRole[]).map(option => (
                <button
                  key={option}
                  onClick={() => handleViewRoleChange(option)}
                  className={`rounded-full px-4 py-2.5 text-xs uppercase tracking-[0.2em] transition ${
                    effectiveRole === option
                      ? 'bg-[var(--sidebar-selected-bg)] text-[var(--sidebar-selected-text)] border-[var(--sidebar-selected-border)]'
                      : 'border border-[var(--sidebar-accent-border)] text-[var(--c-6f6c65)] hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)]'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="mt-4 border-t border-[var(--c-ecebe7)] pt-3 text-[10px] uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
              View As
            </div>
          </div>
        ) : null}
        <div className="mt-4 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-4 text-xs text-[var(--c-7a776f)]">
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => handleThemeChange('light')}
              className={`rounded-full px-3 py-2 text-[10px] uppercase tracking-[0.2em] transition ${
                theme === 'light'
                  ? 'bg-[var(--sidebar-selected-bg)] text-[var(--sidebar-selected-text)] border-[var(--sidebar-selected-border)]'
                  : 'border border-[var(--sidebar-accent-border)] text-[var(--c-6f6c65)] hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)]'
              }`}
            >
              Light
            </button>
            <button
              onClick={() => handleThemeChange('dark')}
              className={`rounded-full px-3 py-2 text-[10px] uppercase tracking-[0.2em] transition ${
                theme === 'dark'
                  ? 'bg-[var(--sidebar-selected-bg)] text-[var(--sidebar-selected-text)] border-[var(--sidebar-selected-border)]'
                  : 'border border-[var(--sidebar-accent-border)] text-[var(--c-6f6c65)] hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)]'
              }`}
            >
              Dark
            </button>
          </div>
          <div className="mt-4 border-t border-[var(--c-ecebe7)] pt-3 text-[10px] uppercase tracking-[0.2em] text-[var(--c-7a776f)]">
            Theme
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-6 w-full rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--c-ffffff)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)]"
        >
          Log Out
        </button>
      </aside>

      {role === 'company' ? (
        <div
          className={`fixed inset-0 z-[60] ${
            isTeacherModalOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
          } transition-opacity`}
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsTeacherModalOpen(false)}
          />
          <div className="absolute inset-x-4 top-16 mx-auto max-w-2xl rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                  Teacher Directory
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                  Choose A Teacher
                </h2>
                <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                  {pendingViewRole === 'student'
                    ? 'Select the teacher you want to use before choosing a student.'
                    : 'Search by name, region, status, or email to switch context.'}
                </p>
              </div>
              <button
                onClick={() => setIsTeacherModalOpen(false)}
                className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-fafafa)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
              >
                Close
              </button>
            </div>

            <div className="mt-6">
              <input
                value={teacherSearch}
                onChange={event => setTeacherSearch(event.target.value)}
                list="teacher-directory"
                placeholder="Search teachers..."
                className="w-full rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3 text-sm text-[var(--c-1f1f1d)] outline-none focus:border-[var(--c-c8102e)]"
              />
              <datalist id="teacher-directory">
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.name} />
                ))}
              </datalist>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {modalTeachers.length === 0 ? (
                <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-6 text-sm text-[var(--c-6f6c65)] sm:col-span-2">
                  {teacherSearch
                    ? 'No matches yet. Try a different search.'
                    : 'No recent teachers yet. Start by searching the directory.'}
                </div>
              ) : (
                modalTeachers.map(teacher => {
                  const isSelected = selectedTeacher?.id === teacher.id;
                  return (
                    <button
                      key={teacher.id}
                      onClick={() =>
                        handleTeacherChoice({
                          id: teacher.id,
                          name: teacher.name,
                          username: teacher.username,
                        })
                      }
                      className={`rounded-2xl border px-4 py-4 text-left transition ${
                        isSelected
                          ? 'border-[var(--sidebar-selected-border)] bg-[var(--sidebar-selected-bg)] shadow-sm'
                          : 'border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] hover:border-[var(--c-c8102e)]/40'
                      }`}
                    >
                      <p
                        className={`text-sm font-semibold ${
                          isSelected
                            ? 'text-[var(--sidebar-selected-text)]'
                            : 'text-[var(--c-1f1f1d)]'
                        }`}
                      >
                        {teacher.name}
                      </p>
                      <p
                        className={`mt-2 text-[10px] uppercase tracking-[0.2em] ${
                          isSelected
                            ? 'text-[var(--sidebar-selected-text)]/80'
                            : 'text-[var(--c-6f6c65)]'
                        }`}
                      >
                        {isSelected ? 'Last used' : 'Recent'}
                      </p>
                      <div className="mt-3">
                        <span
                          className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em] ${
                            isSelected
                              ? 'border border-white/25 bg-white/10 text-[var(--sidebar-selected-text)]'
                              : 'border border-[var(--c-e5e3dd)] text-[var(--c-6f6c65)]'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Select'}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : null}

      {role === 'teacher' || role === 'company' ? (
        <div
          className={`fixed inset-0 z-[60] ${
            isStudentModalOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
          } transition-opacity`}
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsStudentModalOpen(false)}
          />
          <div className="absolute inset-x-4 top-16 mx-auto max-w-2xl rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                  Student Directory
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                  Choose A Student
                </h2>
                <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                  {role === 'company' && selectedTeacher?.name
                    ? `Showing students for ${selectedTeacher.name}.`
                    : 'Search by name or email to set the student for view-as.'}
                </p>
              </div>
              <button
                onClick={() => setIsStudentModalOpen(false)}
                className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-fafafa)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
              >
                Close
              </button>
            </div>

            <div className="mt-6">
              <input
                value={studentSearch}
                onChange={event => setStudentSearch(event.target.value)}
                list="student-directory"
                placeholder="Search students..."
                className="w-full rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3 text-sm text-[var(--c-1f1f1d)] outline-none focus:border-[var(--c-c8102e)]"
              />
              <datalist id="student-directory">
                {students.map(student => (
                  <option key={student.id} value={student.name} />
                ))}
              </datalist>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {modalStudents.length === 0 ? (
                <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-6 text-sm text-[var(--c-6f6c65)] sm:col-span-2">
                  {studentSearch
                    ? 'No matches yet. Try a different search.'
                    : 'No recent students yet. Start by searching your roster.'}
                </div>
              ) : (
                modalStudents.map(student => {
                  const isSelected = selectedStudent?.id === student.id;
                  return (
                    <button
                      key={student.id}
                      onClick={() =>
                        handleStudentChoice({
                          id: student.id,
                          name: student.name,
                          email: student.email,
                        })
                      }
                      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                        isSelected
                          ? 'border-[var(--sidebar-selected-border)] bg-[var(--sidebar-selected-bg)]'
                          : 'border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] hover:border-[var(--sidebar-accent-border)]'
                      }`}
                    >
                      <div>
                        <p
                          className={`text-sm font-semibold ${
                            isSelected
                              ? 'text-[var(--sidebar-selected-text)]'
                              : 'text-[var(--c-1f1f1d)]'
                          }`}
                        >
                          {student.name}
                        </p>
                        <p
                          className={`text-[10px] uppercase tracking-[0.2em] ${
                            isSelected
                              ? 'text-[var(--sidebar-selected-text)]/80'
                              : 'text-[var(--c-6f6c65)]'
                          }`}
                        >
                          {student.label}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${
                          isSelected
                            ? 'border border-white/25 bg-white/10 text-[var(--sidebar-selected-text)]'
                            : 'border border-[var(--c-e5e3dd)] text-[var(--c-6f6c65)]'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Select'}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
