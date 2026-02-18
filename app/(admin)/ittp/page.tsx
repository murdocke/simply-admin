'use client';

import { useEffect, useRef, useState } from 'react';
import { AUTH_STORAGE_KEY } from '../components/auth';
import VimeoGuidePanel, {
  type VimeoGuidePanelHandle,
} from '../components/vimeo-guide-panel';

export default function IttpPage() {
  const [activeModule, setActiveModule] = useState(1);
  const [manualActiveModule, setManualActiveModule] = useState<number | null>(
    null,
  );
  const [module1OverviewRead, setModule1OverviewRead] = useState(false);
  const [module1BreakdownRead, setModule1BreakdownRead] = useState(false);
  const [module2OverviewRead, setModule2OverviewRead] = useState(false);
  const [module3OverviewRead, setModule3OverviewRead] = useState(false);
  const [module5OverviewRead, setModule5OverviewRead] = useState(false);
  const [module6OverviewRead, setModule6OverviewRead] = useState(false);
  const [module7OverviewRead, setModule7OverviewRead] = useState(false);
  const [module8OverviewRead, setModule8OverviewRead] = useState(false);
  const [module9OverviewRead, setModule9OverviewRead] = useState(false);
  const [module10OverviewRead, setModule10OverviewRead] = useState(false);
  const [module1CompletedAt, setModule1CompletedAt] = useState<string | null>(null);
  const [moduleMasterChecks, setModuleMasterChecks] = useState<boolean[]>(
    Array(10).fill(false),
  );
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameSuggested, setUsernameSuggested] = useState('');
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [usernameStatus, setUsernameStatus] = useState<
    'idle' | 'checking' | 'available' | 'unavailable'
  >('idle');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [welcomeProfile, setWelcomeProfile] = useState<{
    name?: string;
    email?: string;
  } | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [hasWatchedIntro, setHasWatchedIntro] = useState(false);
  const [introTriggered, setIntroTriggered] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const [clearIntroReady, setClearIntroReady] = useState(false);
  const [introEndedAt, setIntroEndedAt] = useState<number | null>(null);
  const guideRef = useRef<VimeoGuidePanelHandle | null>(null);
  const [slideAway, setSlideAway] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [slideIn, setSlideIn] = useState(false);
  const [module1Pulse, setModule1Pulse] = useState(false);
  const module1PulseTriggered = useRef(false);
  const [module1Glow, setModule1Glow] = useState(false);
  const [glowModules, setGlowModules] = useState<Record<number, boolean>>({});
  const [trainingUsername, setTrainingUsername] = useState<string | null>(null);
  const sessionStartRef = useRef<number | null>(null);
  const [showCongratsModal, setShowCongratsModal] = useState(false);
  const moduleBodyRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [moduleBodyMaxHeights, setModuleBodyMaxHeights] = useState<
    Array<number | null>
  >(Array(10).fill(null));
  const moduleCardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isVideoVisible = showVideo && !slideAway;
  const pdfFrameClass =
    'overflow-hidden rounded-2xl border border-[var(--c-ecebe7)] bg-white w-full';
  const videoThumbClass =
    'h-16 w-24 shrink-0 overflow-hidden rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)]';
  const pillClass =
    'inline-flex min-w-[72px] items-center justify-center rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]';
  const module2Videos = [
    {
      title: 'Welcome to Simply Music Piano',
      thumb: '/reference/StudentVideo-1.png',
    },
    {
      title: 'An Overview of Simply Music Piano',
      thumb: '/reference/StudentVideo-2.png',
    },
    {
      title: 'Before We Start',
      thumb: '/reference/StudentVideo-3.png',
    },
    {
      title: 'The Basics – About Content & Delivery',
      thumb: '/reference/StudentVideo-4.png',
    },
  ];
  const module3TeacherVideos = [
    {
      title: '1.1 – Dreams Come True',
      thumb: '/reference/StudentVideo-1.png',
    },
    {
      title: '1.2 – Night Storm',
      thumb: '/reference/StudentVideo-2.png',
    },
  ];
  const module3StudentVideos = [
    {
      title: '1.1 – Dreams Come True',
      thumb: '/reference/StudentVideo-3.png',
    },
    {
      title: '1.2 – Night Storm',
      thumb: '/reference/StudentVideo-4.png',
    },
  ];
  const module4TeacherVideos = [
    {
      title: '1.3 – Jackson Blues',
      thumb: '/reference/StudentVideo-1.png',
    },
    {
      title: '1.4 – Honey Dew',
      thumb: '/reference/StudentVideo-2.png',
    },
  ];
  const module4StudentVideos = [
    {
      title: '1.3 – Jackson Blues',
      thumb: '/reference/StudentVideo-3.png',
    },
    {
      title: '1.4 – Honey Dew',
      thumb: '/reference/StudentVideo-4.png',
    },
  ];
  const module5TeacherVideos = [
    {
      title: '1.5 – Chester Chills Out',
      thumb: '/reference/StudentVideo-1.png',
    },
    {
      title: '1.6 – Ode to Joy',
      thumb: '/reference/StudentVideo-2.png',
    },
  ];
  const module5StudentVideos = [
    {
      title: '1.5 – Chester Chills Out',
      thumb: '/reference/StudentVideo-3.png',
    },
    {
      title: '1.6 – Ode to Joy',
      thumb: '/reference/StudentVideo-4.png',
    },
  ];
  const module6TeacherVideos = [
    {
      title: '1.7 – Bishop Street Blues',
      thumb: '/reference/StudentVideo-1.png',
    },
    {
      title: '1.8 – Amazing Grace',
      thumb: '/reference/StudentVideo-2.png',
    },
  ];
  const module6StudentVideos = [
    {
      title: '1.7 – Bishop Street Blues',
      thumb: '/reference/StudentVideo-3.png',
    },
    {
      title: '1.8 – Amazing Grace',
      thumb: '/reference/StudentVideo-4.png',
    },
  ];
  const module7TeacherVideos = [
    {
      title: '1.9 – Für Elise',
      thumb: '/reference/StudentVideo-1.png',
    },
    {
      title: '1.10 – Alma Mater Blues',
      thumb: '/reference/StudentVideo-2.png',
    },
  ];
  const module7StudentVideos = [
    {
      title: '1.9 – Für Elise',
      thumb: '/reference/StudentVideo-3.png',
    },
    {
      title: '1.10 – Alma Mater Blues',
      thumb: '/reference/StudentVideo-4.png',
    },
  ];
  const module8TeacherVideos = [
    {
      title: 'Variations',
      thumb: '/reference/StudentVideo-1.png',
    },
  ];

  useEffect(() => {
    const timer = window.setTimeout(() => setPageReady(true), 120);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('sm_teacher_welcome');
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as { name?: string; email?: string };
      setWelcomeProfile(parsed ?? null);
    } catch {
      setWelcomeProfile(null);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as { username?: string; role?: string };
      if (parsed?.role === 'teacher' && parsed.username) {
        setTrainingUsername(parsed.username);
      }
    } catch {
      setTrainingUsername(null);
    }
  }, []);

  useEffect(() => {
    if (!trainingUsername) return;
    sessionStartRef.current = Date.now();
    const sendOpen = () => {
      fetch('/api/teacher-training/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trainingUsername, action: 'open' }),
      }).catch(() => {});
    };
    sendOpen();
    return () => {
      const start = sessionStartRef.current ?? Date.now();
      const durationSeconds = (Date.now() - start) / 1000;
      fetch('/api/teacher-training/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: trainingUsername,
          action: 'close',
          durationSeconds,
        }),
      }).catch(() => {});
    };
  }, [trainingUsername]);

  useEffect(() => {
    if (!trainingUsername) return;
    let active = true;
    const loadProgress = async () => {
      try {
        const response = await fetch(
          `/api/teacher-training?username=${encodeURIComponent(trainingUsername)}`,
          { cache: 'no-store' },
        );
        if (!response.ok) return;
        const data = (await response.json()) as {
          records?: Array<{
            itemKey: string;
            status: string;
          }>;
        };
        if (!active || !data.records) return;
        const map = new Map(
          data.records.map(record => [record.itemKey, record.status === 'complete']),
        );
        if (map.size === 0) return;
        if (map.has('mod1_overview_pdf')) {
          setModule1OverviewRead(Boolean(map.get('mod1_overview_pdf')));
        }
        if (map.has('mod1_breakdown_pdf')) {
          setModule1BreakdownRead(Boolean(map.get('mod1_breakdown_pdf')));
        }
        if (map.has('mod2_overview_pdf')) {
          setModule2OverviewRead(Boolean(map.get('mod2_overview_pdf')));
        }
        if (map.has('mod3_overview_pdf')) {
          setModule3OverviewRead(Boolean(map.get('mod3_overview_pdf')));
        }
        if (map.has('mod5_overview_pdf')) {
          setModule5OverviewRead(Boolean(map.get('mod5_overview_pdf')));
        }
        if (map.has('mod6_overview_pdf')) {
          setModule6OverviewRead(Boolean(map.get('mod6_overview_pdf')));
        }
        if (map.has('mod7_overview_pdf')) {
          setModule7OverviewRead(Boolean(map.get('mod7_overview_pdf')));
        }
        if (map.has('mod8_overview_pdf')) {
          setModule8OverviewRead(Boolean(map.get('mod8_overview_pdf')));
        }
        if (map.has('mod9_overview_pdf')) {
          setModule9OverviewRead(Boolean(map.get('mod9_overview_pdf')));
        }
        if (map.has('mod10_overview_pdf')) {
          setModule10OverviewRead(Boolean(map.get('mod10_overview_pdf')));
        }
        const nextMasters = Array.from({ length: 10 }).map((_, index) =>
          Boolean(map.get(`mod${index + 1}_master`)),
        );
        if (nextMasters.some(Boolean)) {
          setModuleMasterChecks(nextMasters);
        }
      } catch {
        // ignore
      }
    };
    void loadProgress();
    return () => {
      active = false;
    };
  }, [trainingUsername]);

  useEffect(() => {
    const handleOpen = () => {
      setShowUsernameModal(true);
      window.localStorage.setItem('ittp_username_modal_open', 'true');
      window.dispatchEvent(new Event('sm-teacher-welcome-updated'));
      window.dispatchEvent(
        new CustomEvent('ittp-username-modal-state', { detail: { open: true } }),
      );
    };
    window.addEventListener('ittp-open-username-modal', handleOpen);
    return () => {
      window.removeEventListener('ittp-open-username-modal', handleOpen);
    };
  }, []);

  const normalizeUsernameInput = (value: string) =>
    value.trim().toLowerCase().replace(/[^a-z0-9.-]/g, '');

  const extractFirstName = (name?: string) => {
    const cleaned = name?.trim();
    if (!cleaned) return '';
    return cleaned.split(/\s+/)[0] ?? '';
  };

  const buildBaseUsername = (name?: string, email?: string) => {
    const cleanedName = name?.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
    if (cleanedName) {
      const parts = cleanedName.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        return `${parts[0]}.${parts[1].slice(0, 1)}`;
      }
      if (parts.length === 1) return `${parts[0]}.t`;
    }
    if (email) {
      const prefix = email.split('@')[0]?.replace(/[^a-z0-9]/g, '');
      if (prefix) return `${prefix.slice(0, 8)}.t`;
    }
    return 'teacher.t';
  };

  const checkUsernameAvailability = async (value: string) => {
    const normalized = normalizeUsernameInput(value);
    if (!normalized) return false;
    const response = await fetch('/api/teachers/username', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'check', nextUsername: normalized }),
    });
    if (!response.ok) return false;
    const data = (await response.json()) as { available?: boolean };
    return Boolean(data.available);
  };

  useEffect(() => {
    if (!showUsernameModal) return;
    let active = true;
    const base = buildBaseUsername(welcomeProfile?.name, welcomeProfile?.email);
    const firstName = extractFirstName(welcomeProfile?.name).toLowerCase();
    const suggestionSeeds = [
      firstName ? `${firstName}.piano` : '',
      firstName ? `${firstName}.music` : '',
      firstName ? `${firstName}.keys` : '',
      firstName ? `${firstName}.teach` : '',
      firstName ? `learn-with-${firstName}` : '',
      base,
      `${base}1`,
      `${base}2`,
      `${base}3`,
    ]
      .map(item => item.trim())
      .filter(Boolean);
    const uniqueSuggestions = Array.from(
      new Set(
        suggestionSeeds
          .map(item => normalizeUsernameInput(item))
          .filter(item => item.length >= 5 && item.length <= 35),
      ),
    );
    const attemptSuggestion = async () => {
      const candidates = uniqueSuggestions.length
        ? uniqueSuggestions
        : [base, `${base}1`, `${base}2`, `${base}3`, `${base}4`];
      const availableSuggestions: string[] = [];
      for (const candidate of candidates) {
        if (!active) return;
        const isAvailable = await checkUsernameAvailability(candidate);
        if (isAvailable) {
          availableSuggestions.push(candidate);
          if (!usernameSuggested) {
            setUsernameSuggested(candidate);
            setUsernameInput(current => (current ? current : candidate));
          }
          if (availableSuggestions.length >= 6) break;
        }
      }
      if (!availableSuggestions.length) {
        setUsernameSuggested(base);
        setUsernameInput(current => (current ? current : base));
      }
      if (active) {
        setUsernameSuggestions(availableSuggestions);
      }
    };
    void attemptSuggestion();
    return () => {
      active = false;
    };
  }, [showUsernameModal, welcomeProfile, usernameSuggested]);

  useEffect(() => {
    if (!showUsernameModal) return;
    const nextValue = normalizeUsernameInput(usernameInput);
    if (!nextValue) {
      setUsernameStatus('idle');
      return;
    }
    let active = true;
    setUsernameStatus('checking');
    const timer = window.setTimeout(() => {
      checkUsernameAvailability(nextValue)
        .then(isAvailable => {
          if (!active) return;
          setUsernameStatus(isAvailable ? 'available' : 'unavailable');
        })
        .catch(() => {
          if (!active) return;
          setUsernameStatus('unavailable');
        });
    }, 350);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [showUsernameModal, usernameInput]);

  const handleSaveUsername = async () => {
    const normalized = normalizeUsernameInput(usernameInput);
    if (!normalized) {
      setUsernameError('Add a username to continue.');
      return;
    }
    if (normalized.length < 5 || normalized.length > 35) {
      setUsernameError('Username must be 5–35 characters.');
      return;
    }
    const illegalChars = /[^a-z0-9.-]/i;
    if (illegalChars.test(usernameInput) || /\s/.test(usernameInput)) {
      setUsernameError('Only letters, numbers, periods, and dashes (no spaces).');
      return;
    }
    const bannedWords = [
      'simplymusic',
      'simply-music',
      'simply.music',
      'admin',
      'support',
      'help',
      'moderator',
      'owner',
      'staff',
      'nazi',
      'hitler',
      'kkk',
      'racist',
      'hate',
      'slur',
      'apple',
      'google',
      'microsoft',
      'amazon',
      'meta',
      'tesla',
      'spotify',
      'netflix',
      'nike',
      'adidas',
      'cocacola',
      'coke',
    ];
    const normalizedCheck = normalized.replace(/[^a-z0-9]/g, '');
    if (bannedWords.some(word => normalizedCheck.includes(word))) {
      setUsernameError('Please choose a different username.');
      return;
    }
    setUsernameError(null);
    setIsSavingUsername(true);
    try {
      const storedAuth = window.localStorage.getItem(AUTH_STORAGE_KEY);
      const parsedAuth = storedAuth
        ? (JSON.parse(storedAuth) as { username?: string })
        : null;
      const currentUsername = parsedAuth?.username ?? '';
      const response = await fetch('/api/teachers/username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          currentUsername,
          nextUsername: normalized,
          email: welcomeProfile?.email ?? '',
        }),
      });
      const data = (await response.json()) as { error?: string; username?: string };
      if (!response.ok) {
        throw new Error(data.error ?? 'Unable to save username.');
      }
      if (storedAuth) {
        try {
          const nextAuth = { ...(parsedAuth ?? {}), username: normalized };
          window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuth));
        } catch {
          // ignore
        }
      }
      window.localStorage.removeItem('sm_teacher_welcome');
      window.localStorage.removeItem('ittp_username_modal_open');
      window.dispatchEvent(new Event('sm-teacher-welcome-updated'));
      window.dispatchEvent(
        new CustomEvent('ittp-username-modal-state', { detail: { open: false } }),
      );
      setShowUsernameModal(false);
    } catch (caught) {
      setUsernameError(
        caught instanceof Error ? caught.message : 'Unable to save username.',
      );
    } finally {
      setIsSavingUsername(false);
    }
  };

  useEffect(() => {
    const storedOverview = window.localStorage.getItem('ittp_mod1_overview_read');
    const storedBreakdown = window.localStorage.getItem('ittp_mod1_breakdown_read');
    const storedMod2Overview = window.localStorage.getItem('ittp_mod2_overview_read');
    const storedMod3Overview = window.localStorage.getItem('ittp_mod3_overview_read');
    const storedMod5Overview = window.localStorage.getItem('ittp_mod5_overview_read');
    const storedMod6Overview = window.localStorage.getItem('ittp_mod6_overview_read');
    const storedMod7Overview = window.localStorage.getItem('ittp_mod7_overview_read');
    const storedMod8Overview = window.localStorage.getItem('ittp_mod8_overview_read');
    const storedMod9Overview = window.localStorage.getItem('ittp_mod9_overview_read');
    const storedMod10Overview = window.localStorage.getItem('ittp_mod10_overview_read');
    const storedCompletedAt = window.localStorage.getItem('ittp_mod1_completed_at');
    const storedActive = window.localStorage.getItem('ittp_active_module');
    const storedManual = window.localStorage.getItem('ittp_manual_active_module');
    if (storedOverview) {
      setModule1OverviewRead(storedOverview === 'true');
    }
    if (storedBreakdown) {
      setModule1BreakdownRead(storedBreakdown === 'true');
    }
    if (storedMod2Overview) {
      setModule2OverviewRead(storedMod2Overview === 'true');
    }
    if (storedMod3Overview) {
      setModule3OverviewRead(storedMod3Overview === 'true');
    }
    if (storedMod5Overview) {
      setModule5OverviewRead(storedMod5Overview === 'true');
    }
    if (storedMod6Overview) {
      setModule6OverviewRead(storedMod6Overview === 'true');
    }
    if (storedMod7Overview) {
      setModule7OverviewRead(storedMod7Overview === 'true');
    }
    if (storedMod8Overview) {
      setModule8OverviewRead(storedMod8Overview === 'true');
    }
    if (storedMod9Overview) {
      setModule9OverviewRead(storedMod9Overview === 'true');
    }
    if (storedMod10Overview) {
      setModule10OverviewRead(storedMod10Overview === 'true');
    }
    const storedMasters = Array.from({ length: 10 }).map((_, index) =>
      window.localStorage.getItem(`ittp_mod${index + 1}_master_complete`),
    );
    if (storedMasters.some(value => value !== null)) {
      setModuleMasterChecks(storedMasters.map(value => value === 'true'));
    }
    if (storedCompletedAt) {
      setModule1CompletedAt(storedCompletedAt);
    }
    if (storedActive) {
      const parsed = Number(storedActive);
      if (!Number.isNaN(parsed) && parsed > 0) {
        setActiveModule(parsed);
      }
    }
    if (storedManual) {
      const parsed = Number(storedManual);
      if (!Number.isNaN(parsed) && parsed > 0) {
        setManualActiveModule(parsed);
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      'ittp_mod1_overview_read',
      String(module1OverviewRead),
    );
  }, [module1OverviewRead]);

  useEffect(() => {
    window.localStorage.setItem(
      'ittp_mod1_breakdown_read',
      String(module1BreakdownRead),
    );
  }, [module1BreakdownRead]);

  useEffect(() => {
    window.localStorage.setItem(
      'ittp_mod2_overview_read',
      String(module2OverviewRead),
    );
  }, [module2OverviewRead]);

  useEffect(() => {
    window.localStorage.setItem(
      'ittp_mod3_overview_read',
      String(module3OverviewRead),
    );
  }, [module3OverviewRead]);

  useEffect(() => {
    window.localStorage.setItem(
      'ittp_mod5_overview_read',
      String(module5OverviewRead),
    );
  }, [module5OverviewRead]);

  useEffect(() => {
    window.localStorage.setItem(
      'ittp_mod6_overview_read',
      String(module6OverviewRead),
    );
  }, [module6OverviewRead]);

  useEffect(() => {
    window.localStorage.setItem(
      'ittp_mod7_overview_read',
      String(module7OverviewRead),
    );
  }, [module7OverviewRead]);

  useEffect(() => {
    window.localStorage.setItem(
      'ittp_mod8_overview_read',
      String(module8OverviewRead),
    );
  }, [module8OverviewRead]);

  useEffect(() => {
    window.localStorage.setItem(
      'ittp_mod9_overview_read',
      String(module9OverviewRead),
    );
  }, [module9OverviewRead]);

  useEffect(() => {
    window.localStorage.setItem(
      'ittp_mod10_overview_read',
      String(module10OverviewRead),
    );
  }, [module10OverviewRead]);

  useEffect(() => {
    moduleMasterChecks.forEach((value, index) => {
      window.localStorage.setItem(
        `ittp_mod${index + 1}_master_complete`,
        String(value),
      );
    });
  }, [moduleMasterChecks]);

  useEffect(() => {
    const firstIncomplete = moduleMasterChecks.findIndex(value => !value);
    const nextActive = firstIncomplete === -1 ? 10 : firstIncomplete + 1;
    if (moduleMasterChecks[0] && !module1CompletedAt) {
      const now = new Date();
      const formatted = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(
        now.getDate(),
      ).padStart(2, '0')}/${now.getFullYear()}`;
      setModule1CompletedAt(formatted);
      window.localStorage.setItem('ittp_mod1_completed_at', formatted);
    }
    if (nextActive !== activeModule) {
      setActiveModule(nextActive);
    }
    window.localStorage.setItem('ittp_active_module', String(nextActive));
  }, [activeModule, module1CompletedAt, moduleMasterChecks]);

  const displayActiveModule = manualActiveModule ?? activeModule;

  useEffect(() => {
    if (showWelcome) return;
    if (!introTriggered) return;
    setShowVideo(true);
  }, [showWelcome, introTriggered]);

  useEffect(() => {
    const computeHeights = () => {
      const nextHeights = Array(10).fill(null) as Array<number | null>;
      for (let index = 0; index < 10; index += 2) {
        const leftRef = moduleBodyRefs.current[index];
        const rightRef = moduleBodyRefs.current[index + 1];
        if (!leftRef || !rightRef) continue;
        const leftHeight = leftRef.scrollHeight;
        const rightHeight = rightRef.scrollHeight;
        const leftModule = index + 1;
        const rightModule = index + 2;
        const activeInPair =
          displayActiveModule === leftModule || displayActiveModule === rightModule;

        if (activeInPair) {
          const activeHeight =
            displayActiveModule === leftModule ? leftHeight : rightHeight;
          const otherIndex =
            displayActiveModule === leftModule ? index + 1 : index;
          const otherHeight = otherIndex === index ? leftHeight : rightHeight;
          if (otherHeight > activeHeight) {
            nextHeights[otherIndex] = activeHeight;
          }
        } else {
          if (leftHeight > rightHeight) {
            nextHeights[index] = rightHeight;
          } else if (rightHeight > leftHeight) {
            nextHeights[index + 1] = leftHeight;
          }
        }
      }
      setModuleBodyMaxHeights(nextHeights);
    };

    const raf = window.requestAnimationFrame(computeHeights);
    window.addEventListener('resize', computeHeights);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', computeHeights);
    };
  }, [displayActiveModule, module1OverviewRead, module1BreakdownRead, showWelcome]);

  useEffect(() => {
    if (displayActiveModule === 1) return;
    const target = moduleCardRefs.current[displayActiveModule - 1];
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const offset = 120;
    if (rect.top < offset || rect.bottom > window.innerHeight) {
      window.scrollTo({
        top: window.scrollY + rect.top - offset,
        behavior: 'smooth',
      });
    }
  }, [displayActiveModule]);

  useEffect(() => {
    const cookie = document.cookie
      .split('; ')
      .find(item => item.startsWith('ittp_intro_watched='));
    if (cookie?.split('=')[1] === 'true') {
      setHasWatchedIntro(true);
      setShowWelcome(false);
    }
  }, []);

  useEffect(() => {
    if (!hasWatchedIntro) {
      setClearIntroReady(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setClearIntroReady(true);
    }, 30000);
    return () => window.clearTimeout(timer);
  }, [hasWatchedIntro, introEndedAt]);


  const module1Complete = module1OverviewRead && module1BreakdownRead;
  const updateTrainingItem = async (
    itemKey: string,
    itemType: string,
    checked: boolean,
  ) => {
    if (!trainingUsername) return;
    try {
      await fetch('/api/teacher-training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: trainingUsername,
          itemKey,
          itemType,
          status: checked ? 'complete' : 'incomplete',
          progress: checked ? 1 : 0,
        }),
      });
    } catch {
      // ignore
    }
  };

  const notifyModuleCompleted = async (moduleNumber: number) => {
    if (!trainingUsername) return;
    try {
      await fetch('/api/teacher-training/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trainingUsername, moduleNumber }),
      });
    } catch {
      // ignore
    }
  };

  const clearTrainingData = async () => {
    if (!trainingUsername) return;
    try {
      await fetch('/api/teacher-training', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trainingUsername }),
      });
    } catch {
      // ignore
    }
    setModule1OverviewRead(false);
    setModule1BreakdownRead(false);
    setModule2OverviewRead(false);
    setModule3OverviewRead(false);
    setModule5OverviewRead(false);
    setModule6OverviewRead(false);
    setModule7OverviewRead(false);
    setModule8OverviewRead(false);
    setModule9OverviewRead(false);
    setModule10OverviewRead(false);
    setModuleMasterChecks(Array(10).fill(false));
    setManualActiveModule(null);
    setActiveModule(1);
    setModule1CompletedAt(null);
    setModule1Glow(false);
    setGlowModules({});
    module1PulseTriggered.current = false;
    try {
      const keys = [
        'ittp_mod1_overview_read',
        'ittp_mod1_breakdown_read',
        'ittp_mod2_overview_read',
        'ittp_mod3_overview_read',
        'ittp_mod5_overview_read',
        'ittp_mod6_overview_read',
        'ittp_mod7_overview_read',
        'ittp_mod8_overview_read',
        'ittp_mod9_overview_read',
        'ittp_mod10_overview_read',
        'ittp_mod1_completed_at',
        'ittp_active_module',
        'ittp_manual_active_module',
      ];
      keys.forEach(key => window.localStorage.removeItem(key));
      Array.from({ length: 10 }).forEach((_, index) => {
        window.localStorage.removeItem(`ittp_mod${index + 1}_master_complete`);
      });
    } catch {
      // ignore
    }
  };
  const completedCount = [
    module1OverviewRead,
    module1BreakdownRead,
    module2OverviewRead,
    module3OverviewRead,
    module5OverviewRead,
    module6OverviewRead,
    module7OverviewRead,
    module8OverviewRead,
    module9OverviewRead,
    module10OverviewRead,
    ...moduleMasterChecks,
  ].filter(Boolean).length;
  const totalChecks =
    10 + moduleMasterChecks.length;
  const completionPercent = Math.round((completedCount / totalChecks) * 100);
  const modulesCompletedCount = moduleMasterChecks.filter(Boolean).length;
  const allModulesComplete = moduleMasterChecks.every(Boolean);
  const prevActiveModule = useRef(activeModule);
  const prevAllComplete = useRef(allModulesComplete);

  useEffect(() => {
    if (activeModule !== prevActiveModule.current) {
      const nextModule = activeModule;
      setGlowModules({ [nextModule]: true });
      window.setTimeout(() => {
        setGlowModules({ [nextModule]: true });
      }, 10400);
      prevActiveModule.current = activeModule;
    }
  }, [activeModule]);

  useEffect(() => {
    if (allModulesComplete && !prevAllComplete.current) {
      setShowCongratsModal(true);
    }
    prevAllComplete.current = allModulesComplete;
  }, [allModulesComplete]);

  useEffect(() => {
    if (moduleMasterChecks[0]) {
      setModule1Glow(false);
    }
  }, [moduleMasterChecks]);

  const getModuleCompletedAt = (moduleNumber: number) => {
    if (moduleNumber === 1) {
      return module1CompletedAt;
    }
    return null;
  };

  const isModalOpen = showWelcome || showUsernameModal;
  const contentClasses = `space-y-6 transition-opacity duration-300 ${
    isModalOpen ? 'pointer-events-none select-none opacity-60' : 'opacity-100'
  }`;

  return (
    <div className="relative">
      <div className="absolute right-4 top-4 z-[15] flex items-center gap-2">
        <button
          type="button"
          aria-label="Show Completion Modal"
          onClick={() => setShowCongratsModal(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--c-ecebe7)] bg-white text-[var(--c-6f6c65)] shadow-sm transition hover:border-[var(--sidebar-accent-bg)] hover:text-[var(--c-c8102e)]"
        >
          <span className="text-[16px] leading-none">★</span>
        </button>
        {trainingUsername ? (
          <button
            type="button"
            aria-label="Clear Training Data"
            onClick={clearTrainingData}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--c-ecebe7)] bg-white text-[var(--c-6f6c65)] shadow-sm transition hover:border-[var(--sidebar-accent-bg)] hover:text-[var(--c-c8102e)]"
          >
            <span className="text-[16px] leading-none">↺</span>
          </button>
        ) : null}
        <button
          type="button"
          aria-label="Clear Training Intro Cookie"
          onClick={() => {
            document.cookie = 'ittp_intro_watched=; Max-Age=0; path=/; SameSite=Lax';
            setHasWatchedIntro(false);
            setShowWelcome(false);
            setShowVideo(false);
            setSlideIn(false);
            setSlideAway(false);
            setIntroTriggered(false);
            setClearIntroReady(false);
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--c-ecebe7)] bg-white text-[var(--c-6f6c65)] shadow-sm transition hover:border-[var(--sidebar-accent-bg)] hover:text-[var(--c-c8102e)]"
        >
          <span className="text-lg leading-none">×</span>
        </button>
      </div>
      {false ? (
        <button
          type="button"
          aria-label="Clear Training Intro Cookie"
          onClick={() => {
            document.cookie = 'ittp_intro_watched=; Max-Age=0; path=/; SameSite=Lax';
            setHasWatchedIntro(false);
            setShowWelcome(false);
            setShowVideo(false);
            setSlideIn(false);
            setSlideAway(false);
            setIntroTriggered(false);
            setClearIntroReady(false);
          }}
          className="absolute right-4 top-4 z-[15] flex h-9 w-9 items-center justify-center rounded-full border border-[var(--c-ecebe7)] bg-white text-[var(--c-6f6c65)] shadow-sm transition hover:border-[var(--sidebar-accent-bg)] hover:text-[var(--c-c8102e)]"
        >
          <span className="text-lg leading-none">×</span>
        </button>
      ) : null}
      <div className={contentClasses}>
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="md:max-w-[60%]">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
            Teacher Training
          </p>
          <h1 className="text-3xl font-semibold text-[var(--c-1f1f1d)] mt-2">
            Initial Teacher Training Program
          </h1>
          <p className="text-base text-[var(--c-6f6c65)] mt-2">
            Your guided onboarding session appears below.
          </p>
        </div>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-3 select-none">
          <div className="flex flex-wrap items-center gap-3">
          {hasWatchedIntro ? (
            <button
              type="button"
              onClick={() => {
                if (isVideoVisible) {
                  setSlideAway(true);
                  window.setTimeout(() => {
                    setShowVideo(false);
                    setSlideIn(false);
                    setSlideAway(false);
                  }, 700);
                  return;
                }
                setIntroTriggered(true);
                setShowWelcome(false);
                setShowVideo(false);
                setSlideIn(false);
                setSlideAway(false);
                window.setTimeout(() => {
                  guideRef.current?.playWithSound();
                }, 250);
              }}
              className="rounded-full border border-[var(--sidebar-accent-bg)] bg-[var(--sidebar-accent-bg)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:brightness-110"
            >
              {isVideoVisible ? 'Close Training Introduction' : 'Watch Training Introduction'}
            </button>
          ) : null}
        </div>
        <a
          href="/teachers/messages"
          className="rounded-full border border-[var(--c-ecebe7)] bg-white px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-[var(--c-6f6c65)] transition hover:border-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-bg)]"
        >
          Ask A Question
        </a>
      </div>

      <section className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm select-none">
        <div>
          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[linear-gradient(135deg,rgba(252,252,251,0.95),rgba(255,255,255,0.7))] px-4 py-4 shadow-[0_20px_40px_-30px_rgba(0,0,0,0.2)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl uppercase tracking-[0.4em] text-[var(--c-9a9892)]">
                    Steps
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                    {modulesCompletedCount} / 10
                  </p>
              <p className="mt-2 text-xl font-semibold uppercase tracking-[0.35em] text-[var(--c-6f6c65)]">
                Modules Completed
              </p>
                </div>
                <div className="text-3xl font-semibold text-[var(--c-1f1f1d)]">
                  {completionPercent}%
                </div>
              </div>
              <div className="mt-4">
                <div className="h-1.5 w-full rounded-full bg-[var(--c-ecebe7)]">
                  <div
                    className="h-1.5 rounded-full bg-[var(--sidebar-accent-bg)] transition-all"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
                <div className="mt-4 flex w-full">
                  <div className="grid w-full grid-cols-10 items-center justify-items-center gap-0">
                  {Array.from({ length: 10 }).map((_, index) => {
                    const moduleNumber = index + 1;
                    const isActive = moduleNumber === activeModule;
                    return (
                      <span
                        key={`dot-${moduleNumber}`}
                        className={`relative h-7 w-7 rounded-full border ${
                          isActive
                            ? 'border-[var(--sidebar-accent-bg)] bg-[var(--sidebar-accent-bg)]'
                            : 'border-[var(--c-ecebe7)] bg-white'
                        }`}
                      >
                        {isActive ? (
                          <span className="absolute inset-0 rounded-full border border-[var(--sidebar-accent-bg)] opacity-30 animate-ping" />
                        ) : null}
                      </span>
                    );
                  })}
                  </div>
                </div>
          </div>
        </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 md:items-center">
          <div className="md:max-w-[70%]">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
              Modules
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
              Training Modules
            </h3>
            <p className="mt-2 text-base text-[var(--c-6f6c65)]">
              Work through each module in order to unlock the next step.
            </p>
          </div>
          <div className="flex md:justify-end">
            <div className="inline-flex items-center rounded-full border border-[var(--c-ecebe7)] bg-white px-4 py-2 text-xl font-semibold uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
              You are working on Module {activeModule}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {Array.from({ length: 10 }).map((_, index) => {
            const moduleNumber = index + 1;
              const isActiveModule = moduleNumber === displayActiveModule;
              const isProgressActive = moduleNumber === activeModule;
              const isCompletedModule = moduleNumber < activeModule;
            return (
              <div
                key={`module-${moduleNumber}`}
                ref={el => {
                  moduleCardRefs.current[moduleNumber - 1] = el;
                }}
                className={`flex flex-col gap-3 rounded-2xl border px-4 py-3 transition ${
                    isActiveModule
                      ? 'border-[var(--sidebar-accent-bg)]/40 bg-[var(--c-ffffff)] shadow-sm'
                      : 'border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] text-[var(--c-9a9892)] opacity-70'
                  } ${
                    moduleNumber === 1 && module1Pulse ? 'module-pulse' : ''
                  } ${
                    moduleNumber === 1 && module1Glow ? 'module-glow' : ''
                  } ${glowModules[moduleNumber] ? 'module-glow module-pulse' : ''}`}
                onClick={() => {
                  if (moduleNumber === activeModule) {
                    setManualActiveModule(null);
                    window.localStorage.removeItem('ittp_manual_active_module');
                    return;
                  }
                  if (moduleMasterChecks[moduleNumber - 1]) {
                    setManualActiveModule(moduleNumber);
                    window.localStorage.setItem(
                      'ittp_manual_active_module',
                      String(moduleNumber),
                    );
                  }
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full border text-sm font-semibold uppercase tracking-[0.2em] ${
                      isActiveModule
                        ? 'border-[var(--sidebar-accent-bg)] bg-white text-[var(--c-c8102e)]'
                        : isCompletedModule
                          ? 'border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] text-[var(--c-1f1f1d)]'
                          : 'border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] text-[var(--c-9a9892)]'
                    }`}
                  >
                    M{moduleNumber}
                  </div>
                  <div>
                  <p
                    className={`text-xl font-semibold ${
                      isActiveModule
                        ? 'text-[var(--c-1f1f1d)]'
                        : isCompletedModule
                          ? 'text-[var(--c-1f1f1d)]'
                          : 'text-[var(--c-9a9892)]'
                    }`}
                  >
                    {moduleNumber === 1
                      ? 'Start Here: How It All Works'
                      : moduleNumber === 2
                        ? 'Welcome To Simply Music Piano'
                        : moduleNumber === 3
                          ? 'Learning Your First 2 Songs'
                          : moduleNumber === 4
                            ? 'Jackson Blues & Honey Dew'
                            : moduleNumber === 5
                              ? 'Chester Chills Out & Ode To Joy'
                              : moduleNumber === 6
                                ? 'Bishop Street Blues & Amazing Grace'
                                : moduleNumber === 7
                                  ? 'Für Elise & Alma Mater Blues'
                                  : moduleNumber === 8
                                    ? 'Song Variations'
                                    : moduleNumber === 9
                                      ? 'Student Management'
                                      : moduleNumber === 10
                                        ? 'Teacher Status & Moving Forward'
                                      : `Module ${moduleNumber}`}
                  </p>
                  <p
                    className={`text-sm ${
                      isActiveModule
                        ? 'text-[var(--c-6f6c65)]'
                        : isCompletedModule
                          ? 'text-[var(--c-6f6c65)]'
                          : 'text-[var(--c-9a9892)]'
                    }`}
                  >
                    {isCompletedModule
                      ? 'Completed'
                      : isActiveModule
                        ? 'Current module'
                        : `Unlocks after Module ${moduleNumber - 1}`}
                  </p>
                  </div>
                </div>
                  {isCompletedModule ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {getModuleCompletedAt(moduleNumber) ? (
                        <span className="rounded-full bg-[var(--c-15803d)]/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-15803d)]">
                          Completed on {getModuleCompletedAt(moduleNumber)}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  </div>
                  <div
                    ref={el => {
                      moduleBodyRefs.current[moduleNumber - 1] = el;
                    }}
                    className="space-y-6 overflow-hidden transition-opacity duration-500"
                    style={
                      moduleBodyMaxHeights[moduleNumber - 1]
                        ? {
                            maxHeight: `${moduleBodyMaxHeights[moduleNumber - 1]}px`,
                          }
                        : undefined
                    }
                  >
                  {moduleNumber === 1 ? (
                    <div className="space-y-6">
                    <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr] items-start">
                        <div className={pdfFrameClass}>
                          {!isModalOpen ? (
                            <iframe
                              title="ITTP Module 1 Overview"
                              src="/reference/ITTP/PDF/ITTP_MOD1_Overview.pdf"
                              className="h-72 w-full"
                            />
                          ) : null}
                        </div>
                      <div className="space-y-4">
                        <p className="text-sm text-[var(--c-6f6c65)]">
                          Please save and/or print out your Module 1 Overview so you can
                          follow along with the notes while you review the corresponding
                          materials. This overview will give you details needed for each
                          piece of content below as well as any relevant teacher training
                          notes.
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                          <a
                            href="/reference/ITTP/PDF/ITTP_MOD1_Overview.pdf"
                            download
                            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--sidebar-accent-bg)] bg-[var(--sidebar-accent-bg)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:brightness-110"
                          >
                            Download Overview
                          </a>
                          <label className="inline-flex items-center gap-2 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                            <input
                              type="checkbox"
                              checked={module1OverviewRead}
                              onChange={event =>
                                (() => {
                                  const checked = event.target.checked;
                                  setModule1OverviewRead(checked);
                                  void updateTrainingItem(
                                    'mod1_overview_pdf',
                                    'pdf',
                                    checked,
                                  );
                                })()
                              }
                              className="h-4 w-4 accent-[var(--c-c8102e)]"
                            />
                            I have read and understand
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr] items-start">
                        <div className={pdfFrameClass}>
                          {!isModalOpen ? (
                            <iframe
                              title="ITTP Module 1 Breakdown"
                              src="/reference/ITTP/PDF/ITTP_MOD1_ITTP-Module-Breakdown.pdf"
                              className="h-72 w-full"
                            />
                          ) : null}
                        </div>
                      <div className="space-y-4">
                        <p className="text-sm text-[var(--c-6f6c65)]">
                          The table below gives you a comprehensive breakdown of the
                          contents of each ITTP Module. It can be used for future
                          reference, making it easy to find and review individual
                          components of your ITTP. Please review all contents
                          thoroughly before moving on to the next module.
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                          <a
                            href="/reference/ITTP/PDF/ITTP_MOD1_ITTP-Module-Breakdown.pdf"
                            download
                            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--sidebar-accent-bg)] bg-[var(--sidebar-accent-bg)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:brightness-110"
                          >
                            Download Breakdown
                          </a>
                          <label className="inline-flex items-center gap-2 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                            <input
                              type="checkbox"
                              checked={module1BreakdownRead}
                              onChange={event =>
                                (() => {
                                  const checked = event.target.checked;
                                  setModule1BreakdownRead(checked);
                                  void updateTrainingItem(
                                    'mod1_breakdown_pdf',
                                    'pdf',
                                    checked,
                                  );
                                })()
                              }
                              className="h-4 w-4 accent-[var(--c-c8102e)]"
                            />
                            I have read and understand
                          </label>
                        </div>
                      </div>
                    </div>
                    </div>
                  ) : null}
                  {moduleNumber === 1 ? (
                    <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] px-5 py-4 text-sm text-[var(--c-6f6c65)]">
                      <span className="font-semibold text-[var(--c-2f2b25)]">
                        Printing Note:
                      </span>{' '}
                      To avoid issues printing PDF materials, download and print them
                      directly from your device. To save printer ink, we recommend
                      printing PDF materials in black and white. To request permission
                      to print Teacher Training Materials at a print or copy shop,{' '}
                      <a
                        href="/teachers/messages"
                        className="font-semibold text-[var(--c-c8102e)] hover:underline"
                      >
                        contact us.
                      </a>
                    </div>
                  ) : null}
                  {moduleNumber === 1 ? (
                    <label
                      className={`inline-flex w-full items-center gap-2 rounded-2xl border border-[var(--c-ecebe7)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] ${
                        isActiveModule ? 'bg-white text-[var(--c-6f6c65)]' : 'bg-[var(--c-f7f7f5)] text-[var(--c-9a9892)]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={moduleMasterChecks[0]}
                        onChange={event => {
                          const next = [...moduleMasterChecks];
                          const checked = event.target.checked;
                          next[0] = checked;
                          setModuleMasterChecks(next);
                          void updateTrainingItem('mod1_master', 'module', checked);
                          if (checked) {
                            void notifyModuleCompleted(1);
                          }
                        }}
                        className="h-4 w-4 accent-[var(--c-c8102e)]"
                        disabled={!isProgressActive}
                      />
                      I have completed & understand all the training in Module 1
                    </label>
                  ) : null}
                {moduleNumber === 2 ? (
                  <div className="space-y-6">
                    <div
                      className={`space-y-5 transition-opacity duration-500 ${
                        isActiveModule
                          ? 'opacity-100'
                          : 'pointer-events-none opacity-50'
                      }`}
                    >
                      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr] items-start">
                        <div className={pdfFrameClass}>
                          {!isModalOpen ? (
                            <iframe
                              title="ITTP Module 2 Overview"
                              src="/reference/ITTP/PDF/ITTP_MOD1_Overview.pdf"
                              className="h-72 w-full"
                            />
                          ) : null}
                        </div>
                        <div className="space-y-4">
                          <p className="text-sm text-[var(--c-6f6c65)]">
                            Please save and/or print out your Module 2 Overview so you can
                            follow along with the notes while you review the corresponding
                            materials. This overview will give you details needed for each
                            piece of content below as well as any relevant teacher training
                            notes.
                          </p>
                          <div className="flex flex-wrap items-center gap-3">
                            <a
                              href="/reference/ITTP/PDF/ITTP_MOD1_Overview.pdf"
                              download
                              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--sidebar-accent-bg)] bg-[var(--sidebar-accent-bg)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:brightness-110"
                            >
                              Download Overview
                            </a>
                            <label className="inline-flex items-center gap-2 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                            <input
                              type="checkbox"
                              checked={module2OverviewRead}
                              onChange={event =>
                                (() => {
                                  const checked = event.target.checked;
                                  setModule2OverviewRead(checked);
                                  void updateTrainingItem(
                                    'mod2_overview_pdf',
                                    'pdf',
                                    checked,
                                  );
                                })()
                              }
                              className="h-4 w-4 accent-[var(--c-c8102e)]"
                            />
                              I have read and understand
                            </label>
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-[var(--c-ecebe7)] pt-4">
                        <h4 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
                          Welcome
                        </h4>
                        <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                          The following videos are the introduction to Simply Music Piano
                          and the Initial Teacher Training Program. Please watch all of
                          the following videos before moving on to Module 3.
                        </p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          {module2Videos.map(video => (
                            <div
                              key={video.title}
                              className="flex items-center gap-3 rounded-2xl border border-[var(--c-ecebe7)] bg-white p-3"
                            >
                              <div className={videoThumbClass}>
                                <img
                                  src={video.thumb}
                                  alt={video.title}
                                  className="block h-full w-full object-cover object-center"
                                />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                                  {video.title}
                                </p>
                                <p className="mt-1 text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
                                  Video
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
                {moduleNumber === 3 ? (
                  <div className="space-y-6">
                    <div
                      className={`space-y-6 transition-opacity duration-500 ${
                        isActiveModule
                          ? 'opacity-100'
                          : 'pointer-events-none opacity-50'
                      }`}
                    >
                      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr] items-start">
                        <div className={pdfFrameClass}>
                          <iframe
                            title="ITTP Module 3 Overview"
                            src="/reference/ITTP/PDF/ITTP_MOD1_Overview.pdf"
                            className="h-72 w-full"
                          />
                        </div>
                        <div className="space-y-4">
                          <p className="text-sm text-[var(--c-6f6c65)]">
                            Please save and/or print out your Module 3 Overview so you can
                            follow along with the notes while you review the corresponding
                            materials. This overview will give you details needed for each
                            piece of content below as well as any relevant teacher training
                            notes.
                          </p>
                          <div className="flex flex-wrap items-center gap-3">
                            <a
                              href="/reference/ITTP/PDF/ITTP_MOD1_Overview.pdf"
                              download
                              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--sidebar-accent-bg)] bg-[var(--sidebar-accent-bg)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:brightness-110"
                            >
                              Download Overview
                            </a>
                            <label className="inline-flex items-center gap-2 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                            <input
                              type="checkbox"
                              checked={module3OverviewRead}
                              onChange={event =>
                                (() => {
                                  const checked = event.target.checked;
                                  setModule3OverviewRead(checked);
                                  void updateTrainingItem(
                                    'mod3_overview_pdf',
                                    'pdf',
                                    checked,
                                  );
                                })()
                              }
                              className="h-4 w-4 accent-[var(--c-c8102e)]"
                            />
                              I have read and understand
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-[var(--c-ecebe7)] pt-4">
                        <h4 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
                          Core Curriculum
                        </h4>
                        <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                          Please watch all of the teacher training videos for Dreams Come
                          True. When you are done, watch the student videos for Dreams
                          Come True and process each video segment on the keyboard. When
                          you have learned Dreams Come True from both the teacher and
                          student perspectives, process Night Storm in the same way.
                        </p>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-white p-4">
                            <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                              Teacher Training – Videos
                            </p>
                            <div className="mt-3 space-y-2">
                              {module3TeacherVideos.map(video => (
                                <div
                                  key={video.title}
                                  className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] px-3 py-2 text-sm text-[var(--c-2f2b25)]"
                                >
                                  <div className={videoThumbClass}>
                                    <img
                                      src={video.thumb}
                                      alt={video.title}
                                      className="block h-full w-full object-cover object-center"
                                    />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                                      {video.title}
                                    </p>
                                    <span className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-9a9892)]`}>
                                      Video
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-white p-4">
                            <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                              Student – Videos
                            </p>
                            <div className="mt-3 space-y-2">
                              {module3StudentVideos.map(video => (
                                <div
                                  key={video.title}
                                  className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] px-3 py-2 text-sm text-[var(--c-2f2b25)]"
                                >
                                  <div className={videoThumbClass}>
                                    <img
                                      src={video.thumb}
                                      alt={video.title}
                                      className="block h-full w-full object-cover object-center"
                                    />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                                      {video.title}
                                    </p>
                                    <span className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-9a9892)]`}>
                                      Video
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] px-5 py-4 text-sm text-[var(--c-6f6c65)]">
                          <span className="font-semibold text-[var(--c-2f2b25)]">
                            Student Home Materials note:
                          </span>{' '}
                          The Student Home Materials (SHMs) provided on the Simply Music
                          Teacher Intranet are your copy of what students use for lessons
                          and independent practice. Simply Music students must purchase
                          their own SHMs, available from the Simply Music Student Intranet
                          online store.
                        </div>
                      </div>

                      <div className="border-t border-[var(--c-ecebe7)] pt-4 space-y-3">
                        <h4 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
                          Curriculum Support
                        </h4>
                        <div className="grid gap-2 md:grid-cols-2">
                          {[
                            { label: 'Curriculum Overview', type: 'Video' },
                            { label: 'Curriculum Overview (PDF)', type: 'PDF' },
                            { label: 'Curriculum Sequence Protocol (PDF)', type: 'PDF' },
                          ].map(item => (
                            <div
                              key={item.label}
                              className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-white px-3 py-2 text-sm text-[var(--c-2f2b25)]"
                            >
                              <span className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-c8102e)]`}>
                                {item.type}
                              </span>
                              {item.label}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-[var(--c-ecebe7)] pt-4 space-y-3">
                        <h4 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
                          Educator Support
                        </h4>
                        <div className="grid gap-2 md:grid-cols-2">
                          {[
                            { label: 'The Relationship Conversation', type: 'Audio' },
                            { label: 'The Relationship Graph (PDF)', type: 'PDF' },
                            {
                              label:
                                'The Relationship Conversation – Transcript (PDF)',
                              type: 'PDF',
                            },
                            {
                              label:
                                "Download and Read Neil's book \"Music and The Art of Long-Term Relationships\"",
                              type: 'Link',
                            },
                          ].map(item => (
                            <div
                              key={item.label}
                              className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-white px-3 py-2 text-sm text-[var(--c-2f2b25)]"
                            >
                              <span className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-c8102e)]`}>
                                {item.type}
                              </span>
                              {item.label}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-[var(--c-ecebe7)] pt-4 space-y-3">
                        <h4 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
                          Studio Support
                        </h4>
                        <div className="grid gap-2 md:grid-cols-2">
                          {[
                            { label: 'When Can I Start Teaching?', type: 'Audio' },
                            {
                              label:
                                'When Can I Start Teaching? – Transcript (PDF)',
                              type: 'PDF',
                            },
                          ].map(item => (
                            <div
                              key={item.label}
                              className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-white px-3 py-2 text-sm text-[var(--c-2f2b25)]"
                            >
                              <span className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-c8102e)]`}>
                                {item.type}
                              </span>
                              {item.label}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-[var(--c-ecebe7)] pt-4 space-y-3">
                        <h4 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
                          Business Support
                        </h4>
                        <div className="grid gap-2 md:grid-cols-2">
                          {[
                            { label: 'Introductory Sessions', type: 'Video' },
                            { label: 'My First Introductory Session', type: 'Audio' },
                            {
                              label:
                                'My First Introductory Session – Transcript (PDF)',
                              type: 'PDF',
                            },
                          ].map(item => (
                            <div
                              key={item.label}
                              className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-white px-3 py-2 text-sm text-[var(--c-2f2b25)]"
                            >
                              <span className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-c8102e)]`}>
                                {item.type}
                              </span>
                              {item.label}
                            </div>
                          ))}
                        </div>
                        <p className="mt-3 text-sm text-[var(--c-6f6c65)]">
                          Click the link below to stream the Testimonial Video or
                          download it to share with prospective students during your
                          Introductory Sessions. Your download should begin
                          automatically.
                        </p>
                        <div className="grid gap-2 md:grid-cols-2">
                          {[
                            { label: 'Testimonials', type: 'Video' },
                            { label: 'Testimonials (ZIP)', type: 'ZIP' },
                          ].map(item => (
                            <div
                              key={item.label}
                              className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-white px-3 py-2 text-sm text-[var(--c-2f2b25)]"
                            >
                              <span className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-c8102e)]`}>
                                {item.type}
                              </span>
                              {item.label}
                            </div>
                          ))}
                        </div>
                        <p className="mt-3 text-sm text-[var(--c-6f6c65)]">
                          Click the following link to download the teacher Design Suite.
                          Your download should begin automatically.
                        </p>
                        <div className="grid gap-2 md:grid-cols-2">
                          <div className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-white px-3 py-2 text-sm text-[var(--c-2f2b25)]">
                            <span className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-c8102e)]`}>
                              ZIP
                            </span>
                            Design Suite (ZIP)
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-[var(--c-6f6c65)]">
                          Design Suite note: we recommend using Adobe Reader to view and
                          edit files included with the Design Suite. Adobe Reader is a
                          free software application, available on device multiple
                          platforms, and the latest version can be downloaded here.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
                {moduleNumber === 4 ? (
                  <div className="space-y-6">
                    <div
                      className={`space-y-6 transition-opacity duration-500 ${
                        isActiveModule
                          ? 'opacity-100'
                          : 'pointer-events-none opacity-50'
                      }`}
                    >
                      <div className="border-t border-[var(--c-ecebe7)] pt-4">
                        <p className="text-sm text-[var(--c-6f6c65)]">
                          Please watch all of the teacher training videos for Jackson
                          Blues. When you are done, watch the student videos for Jackson
                          Blues and process each video segment on the keyboard. When you
                          have learned Jackson Blues from both the teacher and student
                          perspectives, process Honey Dew in the same way.
                        </p>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-white p-4">
                            <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                              Teacher Training – Videos
                            </p>
                            <div className="mt-3 space-y-2">
                              {module4TeacherVideos.map(video => (
                                <div
                                  key={video.title}
                                  className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] px-3 py-2 text-sm text-[var(--c-2f2b25)]"
                                >
                                  <div className={videoThumbClass}>
                                    <img
                                      src={video.thumb}
                                      alt={video.title}
                                      className="block h-full w-full object-cover object-center"
                                    />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                                      {video.title}
                                    </p>
                                    <span className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-9a9892)]`}>
                                      Video
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-white p-4">
                            <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                              Student – Videos
                            </p>
                            <div className="mt-3 space-y-2">
                              {module4StudentVideos.map(video => (
                                <div
                                  key={video.title}
                                  className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] px-3 py-2 text-sm text-[var(--c-2f2b25)]"
                                >
                                  <div className={videoThumbClass}>
                                    <img
                                      src={video.thumb}
                                      alt={video.title}
                                      className="block h-full w-full object-cover object-center"
                                    />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                                      {video.title}
                                    </p>
                                    <span className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-9a9892)]`}>
                                      Video
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] px-5 py-4 text-sm text-[var(--c-6f6c65)]">
                          <span className="font-semibold text-[var(--c-2f2b25)]">
                            Student Home Materials note:
                          </span>{' '}
                          The Student Home Materials (SHMs) provided on the Simply Music
                          Teacher Intranet are your copy of what students use for lessons
                          and independent practice. Simply Music students must purchase
                          their own SHMs, available from the Simply Music Student Intranet
                          online store.
                        </div>
                      </div>

                      <div className="border-t border-[var(--c-ecebe7)] pt-4 space-y-3">
                        <h4 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
                          Curriculum Support
                        </h4>
                        <div className="grid gap-2 md:grid-cols-2">
                          {[
                            { label: 'The Foundation Session', type: 'Audio' },
                            {
                              label: 'The Foundation Session – Transcript (PDF)',
                              type: 'PDF',
                            },
                          ].map(item => (
                            <div
                              key={item.label}
                              className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-white px-3 py-2 text-sm text-[var(--c-2f2b25)]"
                            >
                              <span className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-c8102e)]`}>
                                {item.type}
                              </span>
                              {item.label}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-[var(--c-ecebe7)] pt-4 space-y-3">
                        <h4 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
                          Educator Support
                        </h4>
                        <div className="grid gap-2 md:grid-cols-2">
                          {[
                            { label: 'The Dynamic of Claiming Territory', type: 'Audio' },
                            {
                              label:
                                'The Dynamic of Claiming Territory – Transcript (PDF)',
                              type: 'PDF',
                            },
                          ].map(item => (
                            <div
                              key={item.label}
                              className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-white px-3 py-2 text-sm text-[var(--c-2f2b25)]"
                            >
                              <span className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-c8102e)]`}>
                                {item.type}
                              </span>
                              {item.label}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-[var(--c-ecebe7)] pt-4 space-y-3">
                        <h4 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
                          Studio Support
                        </h4>
                        <div className="grid gap-2 md:grid-cols-2">
                          {[
                            { label: 'Shared Lessons', type: 'Video' },
                          ].map(item => (
                            <div
                              key={item.label}
                              className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-white px-3 py-2 text-sm text-[var(--c-2f2b25)]"
                            >
                              <span className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-c8102e)]`}>
                                {item.type}
                              </span>
                              {item.label}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-[var(--c-ecebe7)] pt-4 space-y-3">
                        <h4 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
                          Business Support
                        </h4>
                        <div className="grid gap-2 md:grid-cols-2">
                          {[
                            { label: 'Setting Fees & Shared Lessons', type: 'Audio' },
                            {
                              label:
                                'Setting Fees & Shared Lessons – Transcript (PDF)',
                              type: 'PDF',
                            },
                          ].map(item => (
                            <div
                              key={item.label}
                              className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-white px-3 py-2 text-sm text-[var(--c-2f2b25)]"
                            >
                              <span className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-c8102e)]`}>
                                {item.type}
                              </span>
                              {item.label}
                            </div>
                          ))}
                        </div>
                        <p className="mt-3 text-sm text-[var(--c-6f6c65)]">
                          Organization note: just a friendly reminder of the importance of
                          staying organized. Now is a great time to start your own file
                          management system. Use an easily accessible folder on your
                          device, or a three-ring binder to house all of your PDF
                          materials and teaching notes.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
                {moduleNumber === 5 ? (
                  <div className="space-y-6">
                    <div
                      className={`space-y-6 transition-opacity duration-500 ${
                        isActiveModule
                          ? 'opacity-100'
                          : 'pointer-events-none opacity-50'
                      }`}
                    >
                      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr] items-start">
                        <div className={pdfFrameClass}>
                          <iframe
                            title="ITTP Module 5 Overview"
                            src="/reference/ITTP/PDF/ITTP_MOD1_Overview.pdf"
                            className="h-72 w-full"
                          />
                        </div>
                        <div className="space-y-4">
                          <p className="text-sm text-[var(--c-6f6c65)]">
                            Please save and/or print out your Module 5 Overview so you can
                            follow along with the notes while you review the corresponding
                            materials. This overview will give you details needed for each
                            piece of content below as well as any relevant teacher training
                            notes.
                          </p>
                          <div className="flex flex-wrap items-center gap-3">
                            <a
                              href="/reference/ITTP/PDF/ITTP_MOD1_Overview.pdf"
                              download
                              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--sidebar-accent-bg)] bg-[var(--sidebar-accent-bg)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:brightness-110"
                            >
                              Download Overview
                            </a>
                            <label className="inline-flex items-center gap-2 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                            <input
                              type="checkbox"
                              checked={module5OverviewRead}
                              onChange={event =>
                                (() => {
                                  const checked = event.target.checked;
                                  setModule5OverviewRead(checked);
                                  void updateTrainingItem(
                                    'mod5_overview_pdf',
                                    'pdf',
                                    checked,
                                  );
                                })()
                              }
                              className="h-4 w-4 accent-[var(--c-c8102e)]"
                            />
                              I have read and understand
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-[var(--c-ecebe7)] pt-4">
                        <h4 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
                          Core Curriculum
                        </h4>
                        <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                          Please watch all of the teacher training videos for Chester
                          Chills Out. When you are done, watch the student videos for
                          Chester Chills Out and process each video segment on the
                          keyboard. When you have learned Chester Chills Out from both the
                          teacher and student perspectives, process Ode to Joy in the same
                          way.
                        </p>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-white p-4">
                            <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                              Teacher Training – Videos
                            </p>
                            <div className="mt-3 space-y-2">
                              {module5TeacherVideos.map(video => (
                                <div
                                  key={video.title}
                                  className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] px-3 py-2 text-sm text-[var(--c-2f2b25)]"
                                >
                                  <div className={videoThumbClass}>
                                    <img
                                      src={video.thumb}
                                      alt={video.title}
                                      className="block h-full w-full object-cover object-center"
                                    />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                                      {video.title}
                                    </p>
                                    <span className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-9a9892)]`}>
                                      Video
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-white p-4">
                            <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                              Student – Videos
                            </p>
                            <div className="mt-3 space-y-2">
                              {module5StudentVideos.map(video => (
                                <div
                                  key={video.title}
                                  className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] px-3 py-2 text-sm text-[var(--c-2f2b25)]"
                                >
                                  <div className={videoThumbClass}>
                                    <img
                                      src={video.thumb}
                                      alt={video.title}
                                      className="block h-full w-full object-cover object-center"
                                    />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                                      {video.title}
                                    </p>
                                    <span className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-9a9892)]`}>
                                      Video
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] px-5 py-4 text-sm text-[var(--c-6f6c65)]">
                          <span className="font-semibold text-[var(--c-2f2b25)]">
                            Student Home Materials note:
                          </span>{' '}
                          The Student Home Materials (SHMs) provided on the Simply Music
                          Teacher Intranet are your copy of what students use for lessons
                          and independent practice. Simply Music students must purchase
                          their own SHMs, available from the Simply Music Student Intranet
                          online store.
                        </div>
                      </div>

                      <div className="border-t border-[var(--c-ecebe7)] pt-4 space-y-3">
                        <h4 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
                          Curriculum Support
                        </h4>
                        <div className="grid gap-2 md:grid-cols-2">
                          {[
                            { label: 'The Role of Diagrams', type: 'Audio' },
                            { label: 'The Role of Diagrams – Transcript (PDF)', type: 'PDF' },
                            { label: 'Practice Pads vs Keyboards', type: 'Audio' },
                            { label: 'Practice Pads vs. Keyboards – Transcript (PDF)', type: 'PDF' },
                          ].map(item => (
                            <div
                              key={item.label}
                              className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-white px-3 py-2 text-sm text-[var(--c-2f2b25)]"
                            >
                              <span className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-c8102e)]`}>
                                {item.type}
                              </span>
                              {item.label}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-[var(--c-ecebe7)] pt-4 space-y-3">
                        <h4 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
                          Educator Support
                        </h4>
                        <div className="grid gap-2 md:grid-cols-2">
                          {[
                            { label: 'Being Truthful to Children', type: 'Audio' },
                            {
                              label: 'Being Truthful to Children – Transcript (PDF)',
                              type: 'PDF',
                            },
                            { label: 'Being a Novice or Experienced Teacher', type: 'Audio' },
                            {
                              label:
                                'Being a Novice or Experienced Teacher – Transcript (PDF)',
                              type: 'PDF',
                            },
                          ].map(item => (
                            <div
                              key={item.label}
                              className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-white px-3 py-2 text-sm text-[var(--c-2f2b25)]"
                            >
                              <span className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-c8102e)]`}>
                                {item.type}
                              </span>
                              {item.label}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-[var(--c-ecebe7)] pt-4 space-y-3">
                        <h4 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
                          Studio Support
                        </h4>
                        <div className="grid gap-2 md:grid-cols-2">
                          {[
                            { label: 'Request vs Requirements', type: 'Audio' },
                            {
                              label: 'Request vs Requirements – Transcript (PDF)',
                              type: 'PDF',
                            },
                          ].map(item => (
                            <div
                              key={item.label}
                              className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-white px-3 py-2 text-sm text-[var(--c-2f2b25)]"
                            >
                              <span className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-c8102e)]`}>
                                {item.type}
                              </span>
                              {item.label}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-[var(--c-ecebe7)] pt-4 space-y-3">
                        <h4 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
                          Business Support
                        </h4>
                        <div className="grid gap-2 md:grid-cols-2">
                          {[
                            { label: 'Talking to People', type: 'Audio' },
                            {
                              label: 'Talking to People – Separation',
                              type: 'Audio',
                            },
                            {
                              label: 'Talking to People – Separation – Transcript (PDF)',
                              type: 'PDF',
                            },
                            {
                              label: 'Talking to People – Foundation',
                              type: 'Audio',
                            },
                            {
                              label: 'Talking to People – Foundation – Transcript (PDF)',
                              type: 'PDF',
                            },
                            {
                              label: 'Talking to People – Application',
                              type: 'Audio',
                            },
                            {
                              label: 'Talking to People – Application – Transcript (PDF)',
                              type: 'PDF',
                            },
                            {
                              label:
                                'Discussing the Cost of Lessons & Materials',
                              type: 'Audio',
                            },
                            {
                              label:
                                'Discussing the Cost of Lessons & Materials – Transcript (PDF)',
                              type: 'PDF',
                            },
                          ].map(item => (
                            <div
                              key={item.label}
                              className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-white px-3 py-2 text-sm text-[var(--c-2f2b25)]"
                            >
                              <span className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-c8102e)]`}>
                                {item.type}
                              </span>
                              {item.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
                {moduleNumber === 6 ? (
                  <div className="space-y-6">
                    <div
                      className={`space-y-6 transition-opacity duration-500 ${
                        isActiveModule
                          ? 'opacity-100'
                          : 'pointer-events-none opacity-50'
                      }`}
                    >
                      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr] items-start">
                        <div className={pdfFrameClass}>
                          <iframe
                            title="ITTP Module 6 Overview"
                            src="/reference/ITTP/PDF/ITTP_MOD1_Overview.pdf"
                            className="h-72 w-full"
                          />
                        </div>
                        <div className="space-y-4">
                          <p className="text-sm text-[var(--c-6f6c65)]">
                            Please save and/or print out your Module 6 Overview so you can
                            follow along with the notes while you review the corresponding
                            materials. This overview will give you details needed for each
                            piece of content below as well as any relevant teacher training
                            notes.
                          </p>
                          <div className="flex flex-wrap items-center gap-3">
                            <a
                              href="/reference/ITTP/PDF/ITTP_MOD1_Overview.pdf"
                              download
                              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--sidebar-accent-bg)] bg-[var(--sidebar-accent-bg)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:brightness-110"
                            >
                              Download Overview
                            </a>
                            <label className="inline-flex items-center gap-2 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                            <input
                              type="checkbox"
                              checked={module6OverviewRead}
                              onChange={event =>
                                (() => {
                                  const checked = event.target.checked;
                                  setModule6OverviewRead(checked);
                                  void updateTrainingItem(
                                    'mod6_overview_pdf',
                                    'pdf',
                                    checked,
                                  );
                                })()
                              }
                              className="h-4 w-4 accent-[var(--c-c8102e)]"
                            />
                              I have read and understand
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-[var(--c-ecebe7)] pt-4">
                        <h4 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
                          Core Curriculum
                        </h4>
                        <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                          Please watch all of the teacher training videos for Bishop
                          Street Blues. When you are done, watch the student videos for
                          Bishop Street Blues and process each video segment on the
                          keyboard. When you have learned Bishop Street Blues from both
                          the teacher and student perspectives, process Amazing Grace in
                          the same way.
                        </p>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-white p-4">
                            <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                              Teacher Training – Videos
                            </p>
                            <div className="mt-3 space-y-2">
                              {module6TeacherVideos.map(video => (
                                <div
                                  key={video.title}
                                  className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] px-3 py-2 text-sm text-[var(--c-2f2b25)]"
                                >
                                  <div className={videoThumbClass}>
                                    <img
                                      src={video.thumb}
                                      alt={video.title}
                                      className="block h-full w-full object-cover object-center"
                                    />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                                      {video.title}
                                    </p>
                                    <span className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-9a9892)]`}>
                                      Video
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-white p-4">
                            <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                              Student – Videos
                            </p>
                            <div className="mt-3 space-y-2">
                              {module6StudentVideos.map(video => (
                                <div
                                  key={video.title}
                                  className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] px-3 py-2 text-sm text-[var(--c-2f2b25)]"
                                >
                                  <div className={videoThumbClass}>
                                    <img
                                      src={video.thumb}
                                      alt={video.title}
                                      className="block h-full w-full object-cover object-center"
                                    />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                                      {video.title}
                                    </p>
                                    <span className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-9a9892)]`}>
                                      Video
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] px-5 py-4 text-sm text-[var(--c-6f6c65)]">
                          <span className="font-semibold text-[var(--c-2f2b25)]">
                            Student Home Materials note:
                          </span>{' '}
                          The Student Home Materials (SHMs) provided on the Simply Music
                          Teacher Intranet are your copy of what students use for lessons
                          and independent practice. Simply Music students must purchase
                          their own SHMs, available from the Simply Music Student Intranet
                          online store.
                        </div>
                      </div>

                      <div className="border-t border-[var(--c-ecebe7)] pt-4 space-y-3">
                        <h4 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
                          Curriculum Support
                        </h4>
                        <div className="grid gap-2 md:grid-cols-2">
                          {[
                            { label: 'Simpedia – Walk-Through', type: 'Video' },
                            { label: 'Simpedia', type: 'Link' },
                            { label: 'Library', type: 'Link' },
                          ].map(item => (
                            <div
                              key={item.label}
                              className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-white px-3 py-2 text-sm text-[var(--c-2f2b25)]"
                            >
                              <span className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-c8102e)]`}>
                                {item.type}
                              </span>
                              {item.label}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-[var(--c-ecebe7)] pt-4 space-y-3">
                        <h4 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
                          Educator Support
                        </h4>
                        <div className="grid gap-2 md:grid-cols-2">
                          {[
                            { label: 'Creating Time to Grow & Develop', type: 'Audio' },
                            {
                              label:
                                'Creating Time to Grow & Develop – Transcript (PDF)',
                              type: 'PDF',
                            },
                          ].map(item => (
                            <div
                              key={item.label}
                              className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-white px-3 py-2 text-sm text-[var(--c-2f2b25)]"
                            >
                              <span className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-c8102e)]`}>
                                {item.type}
                              </span>
                              {item.label}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-[var(--c-ecebe7)] pt-4 space-y-3">
                        <h4 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
                          Studio Support
                        </h4>
                        <div className="grid gap-2 md:grid-cols-2">
                          {[
                            { label: 'Studio Forms', type: 'Video' },
                          ].map(item => (
                            <div
                              key={item.label}
                              className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-white px-3 py-2 text-sm text-[var(--c-2f2b25)]"
                            >
                              <span className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-c8102e)]`}>
                                {item.type}
                              </span>
                              {item.label}
                            </div>
                          ))}
                        </div>
                        <p className="mt-3 text-sm text-[var(--c-6f6c65)]">
                          Click the following link to download the Usable Studio Forms.
                          Your download should begin automatically.
                        </p>
                        <div className="grid gap-2 md:grid-cols-2">
                          <div className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-white px-3 py-2 text-sm text-[var(--c-2f2b25)]">
                            <span className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-c8102e)]`}>
                              ZIP
                            </span>
                            Usable Studio Forms (ZIP)
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-[var(--c-6f6c65)]">
                          Usable Studio Forms note: we recommend using Adobe Reader to
                          view and edit files included with the Design Suite. Adobe Reader
                          is a free software application, available on device multiple
                          platforms, and the latest version can be downloaded here.
                        </p>
                      </div>

                      <div className="border-t border-[var(--c-ecebe7)] pt-4 space-y-3">
                        <h4 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
                          Business Support
                        </h4>
                        <p className="text-sm text-[var(--c-6f6c65)]">
                          The following links take you to the Location &amp; Profile
                          section of the My Account page, where you can manage or update
                          your location and public profile, and to the Teacher Locator Map,
                          where students can search for Simply Music Teachers in their area.
                        </p>
                        <div className="grid gap-2 md:grid-cols-2">
                          {[
                            { label: 'Profile & Location', type: 'Link' },
                            { label: 'Teacher Locator Map', type: 'Link' },
                          ].map(item => (
                            <div
                              key={item.label}
                              className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-white px-3 py-2 text-sm text-[var(--c-2f2b25)]"
                            >
                              <span className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-c8102e)]`}>
                                {item.type}
                              </span>
                              {item.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
                {moduleNumber === 7 ? (
                  <div className="space-y-6">
                    <div
                      className={`space-y-6 transition-opacity duration-500 ${
                        isActiveModule
                          ? 'opacity-100'
                          : 'pointer-events-none opacity-50'
                      }`}
                    >
                      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr] items-start">
                        <div className={pdfFrameClass}>
                          <iframe
                            title="ITTP Module 7 Overview"
                            src="/reference/ITTP/PDF/ITTP_MOD1_Overview.pdf"
                            className="h-72 w-full"
                          />
                        </div>
                        <div className="space-y-4">
                          <p className="text-sm text-[var(--c-6f6c65)]">
                            Please save and/or print out your Module 7 Overview so you can
                            follow along with the notes while you review the corresponding
                            materials. This overview will give you details needed for each
                            piece of content below as well as any relevant teacher training
                            notes.
                          </p>
                          <div className="flex flex-wrap items-center gap-3">
                            <a
                              href="/reference/ITTP/PDF/ITTP_MOD1_Overview.pdf"
                              download
                              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--sidebar-accent-bg)] bg-[var(--sidebar-accent-bg)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:brightness-110"
                            >
                              Download Overview
                            </a>
                            <label className="inline-flex items-center gap-2 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                            <input
                              type="checkbox"
                              checked={module7OverviewRead}
                              onChange={event =>
                                (() => {
                                  const checked = event.target.checked;
                                  setModule7OverviewRead(checked);
                                  void updateTrainingItem(
                                    'mod7_overview_pdf',
                                    'pdf',
                                    checked,
                                  );
                                })()
                              }
                              className="h-4 w-4 accent-[var(--c-c8102e)]"
                            />
                              I have read and understand
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-[var(--c-ecebe7)] pt-4">
                        <h4 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
                          Core Curriculum
                        </h4>
                        <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                          Please watch all of the teacher training videos for Bishop
                          Street Blues. When you are done, watch the student videos for
                          Bishop Street Blues and process each video segment on the
                          keyboard. When you have learned Bishop Street Blues from both
                          the teacher and student perspectives, process Amazing Grace in
                          the same way.
                        </p>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-white p-4">
                            <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                              Teacher Training – Videos
                            </p>
                            <div className="mt-3 space-y-2">
                              {module7TeacherVideos.map(video => (
                                <div
                                  key={video.title}
                                  className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] px-3 py-2 text-sm text-[var(--c-2f2b25)]"
                                >
                                  <div className={videoThumbClass}>
                                    <img
                                      src={video.thumb}
                                      alt={video.title}
                                      className="block h-full w-full object-cover object-center"
                                    />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                                      {video.title}
                                    </p>
                                    <span
                                      className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-9a9892)]`}
                                    >
                                      Video
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-white p-4">
                            <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                              Student – Videos
                            </p>
                            <div className="mt-3 space-y-2">
                              {module7StudentVideos.map(video => (
                                <div
                                  key={video.title}
                                  className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] px-3 py-2 text-sm text-[var(--c-2f2b25)]"
                                >
                                  <div className={videoThumbClass}>
                                    <img
                                      src={video.thumb}
                                      alt={video.title}
                                      className="block h-full w-full object-cover object-center"
                                    />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                                      {video.title}
                                    </p>
                                    <span
                                      className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-9a9892)]`}
                                    >
                                      Video
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] px-5 py-4 text-sm text-[var(--c-6f6c65)]">
                          <span className="font-semibold text-[var(--c-2f2b25)]">
                            Student Home Materials note:
                          </span>{' '}
                          The Student Home Materials (SHMs) provided on the Simply Music
                          Teacher Intranet are your copy of what students use for lessons
                          and independent practice. Simply Music students must purchase
                          their own SHMs, available from the Simply Music Student Intranet
                          online store.
                        </div>
                      </div>

                      <div className="border-t border-[var(--c-ecebe7)] pt-4 space-y-3">
                        <h4 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
                          Curriculum Support
                        </h4>
                        <div className="grid gap-2 md:grid-cols-2">
                          {[
                            { label: 'The Music Book in Early Levels', type: 'Audio' },
                            {
                              label:
                                'The Music Book in Early Levels – Transcript (PDF)',
                              type: 'PDF',
                            },
                            { label: 'Writing SHM Notes', type: 'Audio' },
                          ].map(item => (
                            <div
                              key={item.label}
                              className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-white px-3 py-2 text-sm text-[var(--c-2f2b25)]"
                            >
                              <span
                                className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-c8102e)]`}
                              >
                                {item.type}
                              </span>
                              {item.label}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-[var(--c-ecebe7)] pt-4 space-y-3">
                        <h4 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
                          Educator Support
                        </h4>
                        <div className="grid gap-2 md:grid-cols-2">
                          {[
                            {
                              label:
                                'Managing Adult Students Who Control the Lessons',
                              type: 'Audio',
                            },
                            {
                              label:
                                'Managing Adult Students Who Control the Lessons – Transcript (PDF)',
                              type: 'PDF',
                            },
                          ].map(item => (
                            <div
                              key={item.label}
                              className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-white px-3 py-2 text-sm text-[var(--c-2f2b25)]"
                            >
                              <span
                                className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-c8102e)]`}
                              >
                                {item.type}
                              </span>
                              {item.label}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-[var(--c-ecebe7)] pt-4 space-y-3">
                        <h4 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
                          Studio Support
                        </h4>
                        <div className="grid gap-2 md:grid-cols-2">
                          {[
                            { label: 'Evolving Larger Shared Lessons', type: 'Audio' },
                            {
                              label:
                                'Evolving Larger Shared Lessons – Transcript (PDF)',
                              type: 'PDF',
                            },
                          ].map(item => (
                            <div
                              key={item.label}
                              className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-white px-3 py-2 text-sm text-[var(--c-2f2b25)]"
                            >
                              <span
                                className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-c8102e)]`}
                              >
                                {item.type}
                              </span>
                              {item.label}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-[var(--c-ecebe7)] pt-4 space-y-3">
                        <h4 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
                          Business Support
                        </h4>
                        <div className="grid gap-2 md:grid-cols-2">
                          {[
                            { label: 'Teaching Throughout the Entire Year', type: 'Audio' },
                            {
                              label:
                                'Teaching Throughout the Entire Year – Transcript (PDF)',
                              type: 'PDF',
                            },
                          ].map(item => (
                            <div
                              key={item.label}
                              className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-white px-3 py-2 text-sm text-[var(--c-2f2b25)]"
                            >
                              <span
                                className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-c8102e)]`}
                              >
                                {item.type}
                              </span>
                              {item.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
                {moduleNumber === 8 ? (
                  <div className="space-y-6">
                    <div
                      className={`space-y-6 transition-opacity duration-500 ${
                        isActiveModule
                          ? 'opacity-100'
                          : 'pointer-events-none opacity-50'
                      }`}
                    >
                      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr] items-start">
                        <div className={pdfFrameClass}>
                          <iframe
                            title="ITTP Module 8 Overview"
                            src="/reference/ITTP/PDF/ITTP_MOD1_Overview.pdf"
                            className="h-72 w-full"
                          />
                        </div>
                        <div className="space-y-4">
                          <p className="text-sm text-[var(--c-6f6c65)]">
                            Please save and/or print out your Module 8 Overview so you can
                            follow along with the notes while you review the corresponding
                            materials. This overview will give you details needed for each
                            piece of content below as well as any relevant teacher training
                            notes.
                          </p>
                          <div className="flex flex-wrap items-center gap-3">
                            <a
                              href="/reference/ITTP/PDF/ITTP_MOD1_Overview.pdf"
                              download
                              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--sidebar-accent-bg)] bg-[var(--sidebar-accent-bg)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:brightness-110"
                            >
                              Download Overview
                            </a>
                            <label className="inline-flex items-center gap-2 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                            <input
                              type="checkbox"
                              checked={module8OverviewRead}
                              onChange={event =>
                                (() => {
                                  const checked = event.target.checked;
                                  setModule8OverviewRead(checked);
                                  void updateTrainingItem(
                                    'mod8_overview_pdf',
                                    'pdf',
                                    checked,
                                  );
                                })()
                              }
                              className="h-4 w-4 accent-[var(--c-c8102e)]"
                            />
                              I have read and understand
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-[var(--c-ecebe7)] pt-4">
                        <h4 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
                          Core Curriculum
                        </h4>
                        <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                          Please watch all of the teacher training videos for Variations.
                          There are no student videos for this module.
                        </p>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-white p-4">
                            <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                              Teacher Training – Videos
                            </p>
                            <div className="mt-3 space-y-2">
                              {module8TeacherVideos.map(video => (
                                <div
                                  key={video.title}
                                  className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] px-3 py-2 text-sm text-[var(--c-2f2b25)]"
                                >
                                  <div className={videoThumbClass}>
                                    <img
                                      src={video.thumb}
                                      alt={video.title}
                                      className="block h-full w-full object-cover object-center"
                                    />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                                      {video.title}
                                    </p>
                                    <span
                                      className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-9a9892)]`}
                                    >
                                      Video
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-[var(--c-ecebe7)] pt-4 space-y-3">
                        <h4 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
                          Curriculum Support
                        </h4>
                        <div className="grid gap-2 md:grid-cols-2">
                          {[
                            { label: 'Student Assessment', type: 'Audio' },
                            { label: 'Student Assessment List & Graph (PDF)', type: 'PDF' },
                            { label: 'Talking to Students with Prior Experience', type: 'Audio' },
                            {
                              label:
                                'Talking to Students with Prior Experience – Transcript (PDF)',
                              type: 'PDF',
                            },
                          ].map(item => (
                            <div
                              key={item.label}
                              className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-white px-3 py-2 text-sm text-[var(--c-2f2b25)]"
                            >
                              <span
                                className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-c8102e)]`}
                              >
                                {item.type}
                              </span>
                              {item.label}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-[var(--c-ecebe7)] pt-4 space-y-3">
                        <h4 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
                          Educator Support
                        </h4>
                        <div className="grid gap-2 md:grid-cols-2">
                          {[
                            { label: 'Special Circumstances', type: 'Audio' },
                            { label: 'News Article (PDF)', type: 'PDF' },
                          ].map(item => (
                            <div
                              key={item.label}
                              className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-white px-3 py-2 text-sm text-[var(--c-2f2b25)]"
                            >
                              <span
                                className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-c8102e)]`}
                              >
                                {item.type}
                              </span>
                              {item.label}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-[var(--c-ecebe7)] pt-4 space-y-3">
                        <h4 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
                          Studio Support
                        </h4>
                        <div className="grid gap-2 md:grid-cols-2">
                          <div className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-white px-3 py-2 text-sm text-[var(--c-2f2b25)]">
                            <span
                              className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-c8102e)]`}
                            >
                              PDF
                            </span>
                            Student Certificates – PDFs
                          </div>
                          <div className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-white px-3 py-2 text-sm text-[var(--c-2f2b25)]">
                            <span
                              className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-c8102e)]`}
                            >
                              PDF
                            </span>
                            Foundation 1 – Student Certificate (A4)
                          </div>
                          <div className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-white px-3 py-2 text-sm text-[var(--c-2f2b25)]">
                            <span
                              className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-c8102e)]`}
                            >
                              PDF
                            </span>
                            Foundation 1 – Student Certificate (US Letter)
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-[var(--c-ecebe7)] pt-4 space-y-3">
                        <h4 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
                          Business Support
                        </h4>
                        <div className="grid gap-2 md:grid-cols-2">
                          {[
                            { label: 'Building Your Student Body & Shared Lessons', type: 'Audio' },
                            {
                              label:
                                'Building Your Student Body & Shared Lessons – Transcript (PDF)',
                              type: 'PDF',
                            },
                          ].map(item => (
                            <div
                              key={item.label}
                              className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-white px-3 py-2 text-sm text-[var(--c-2f2b25)]"
                            >
                              <span
                                className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-c8102e)]`}
                              >
                                {item.type}
                              </span>
                              {item.label}
                            </div>
                          ))}
                        </div>
                        <p className="mt-3 text-sm text-[var(--c-6f6c65)]">
                          Additional resources note: don’t forget there are additional
                          teacher training resources on this topic, and many others,
                          located in the Library.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
                {moduleNumber === 9 ? (
                  <div className="space-y-6">
                    <div
                      className={`space-y-6 transition-opacity duration-500 ${
                        isActiveModule
                          ? 'opacity-100'
                          : 'pointer-events-none opacity-50'
                      }`}
                    >
                      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr] items-start">
                        <div className={pdfFrameClass}>
                          <iframe
                            title="ITTP Module 9 Overview"
                            src="/reference/ITTP/PDF/ITTP_MOD1_Overview.pdf"
                            className="h-72 w-full"
                          />
                        </div>
                        <div className="space-y-4">
                          <p className="text-sm text-[var(--c-6f6c65)]">
                            Please save and/or print out your Module 9 Overview so you can
                            follow along with the notes while you review the corresponding
                            materials. This overview will give you details needed for each
                            piece of content below as well as any relevant teacher training
                            notes.
                          </p>
                          <div className="flex flex-wrap items-center gap-3">
                            <a
                              href="/reference/ITTP/PDF/ITTP_MOD1_Overview.pdf"
                              download
                              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--sidebar-accent-bg)] bg-[var(--sidebar-accent-bg)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:brightness-110"
                            >
                              Download Overview
                            </a>
                            <label className="inline-flex items-center gap-2 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                            <input
                              type="checkbox"
                              checked={module9OverviewRead}
                              onChange={event =>
                                (() => {
                                  const checked = event.target.checked;
                                  setModule9OverviewRead(checked);
                                  void updateTrainingItem(
                                    'mod9_overview_pdf',
                                    'pdf',
                                    checked,
                                  );
                                })()
                              }
                              className="h-4 w-4 accent-[var(--c-c8102e)]"
                            />
                              I have read and understand
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-[var(--c-ecebe7)] pt-4 space-y-3">
                        <h4 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
                          Student Management
                        </h4>
                        <div className="grid gap-2 md:grid-cols-2">
                          {[
                            { label: 'Introduction', type: 'Audio' },
                            {
                              label:
                                'The Importance of Student Home Materials (SHMs)',
                              type: 'Audio',
                            },
                            { label: 'Enrolling & Managing Students (PDF)', type: 'PDF' },
                            { label: 'Student Sign-Up Handout (PDF)', type: 'PDF' },
                            {
                              label:
                                'Student Intranet Account Setup & Overview – Walk-Through',
                              type: 'Video',
                            },
                            { label: 'Student Teacher Linking – Walk-Through', type: 'Video' },
                            { label: 'Conclusion', type: 'Audio' },
                            { label: 'Student Workshop', type: 'Audio' },
                          ].map(item => (
                            <div
                              key={item.label}
                              className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-white px-3 py-2 text-sm text-[var(--c-2f2b25)]"
                            >
                              <span
                                className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-c8102e)]`}
                              >
                                {item.type}
                              </span>
                              {item.label}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-[var(--c-ecebe7)] pt-4 space-y-3">
                        <h4 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
                          Monthly Royalties & Licensing
                        </h4>
                        <div className="grid gap-2 md:grid-cols-2">
                          {[
                            { label: 'Submitting Monthly Royalties – Walk-Through', type: 'Video' },
                            { label: 'Royalty Protocols (PDF)', type: 'PDF' },
                            { label: 'Annual License Agreement Renewal – Walk-Through', type: 'Video' },
                            { label: 'License Agreement (PDF)', type: 'PDF' },
                          ].map(item => (
                            <div
                              key={item.label}
                              className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-white px-3 py-2 text-sm text-[var(--c-2f2b25)]"
                            >
                              <span
                                className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-c8102e)]`}
                              >
                                {item.type}
                              </span>
                              {item.label}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-[var(--c-ecebe7)] pt-4 space-y-3">
                        <h4 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
                          Peer Support
                        </h4>
                        <div className="grid gap-2 md:grid-cols-2">
                          <div className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-white px-3 py-2 text-sm text-[var(--c-2f2b25)]">
                            <span
                              className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-c8102e)]`}
                            >
                              Link
                            </span>
                            Simply Music Teachers Group on Facebook
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
                {moduleNumber === 10 ? (
                  <div className="space-y-6">
                    <div
                      className={`space-y-6 transition-opacity duration-500 ${
                        isActiveModule
                          ? 'opacity-100'
                          : 'pointer-events-none opacity-50'
                      }`}
                    >
                      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr] items-start">
                        <div className={pdfFrameClass}>
                          <iframe
                            title="ITTP Module 10 Overview"
                            src="/reference/ITTP/PDF/ITTP_MOD1_Overview.pdf"
                            className="h-72 w-full"
                          />
                        </div>
                        <div className="space-y-4">
                          <p className="text-sm text-[var(--c-6f6c65)]">
                            Please save and/or print out your Module 10 Overview so you can
                            follow along with the notes while you review the corresponding
                            materials. This overview will give you details needed for each
                            piece of content below as well as any relevant teacher training
                            notes.
                          </p>
                          <div className="flex flex-wrap items-center gap-3">
                            <a
                              href="/reference/ITTP/PDF/ITTP_MOD1_Overview.pdf"
                              download
                              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--sidebar-accent-bg)] bg-[var(--sidebar-accent-bg)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:brightness-110"
                            >
                              Download Overview
                            </a>
                            <label className="inline-flex items-center gap-2 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                            <input
                              type="checkbox"
                              checked={module10OverviewRead}
                              onChange={event =>
                                (() => {
                                  const checked = event.target.checked;
                                  setModule10OverviewRead(checked);
                                  void updateTrainingItem(
                                    'mod10_overview_pdf',
                                    'pdf',
                                    checked,
                                  );
                                })()
                              }
                              className="h-4 w-4 accent-[var(--c-c8102e)]"
                            />
                              I have read and understand
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-[var(--c-ecebe7)] pt-4 space-y-3">
                        <h4 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
                          Teacher Status
                        </h4>
                        <p className="text-sm text-[var(--c-6f6c65)]">
                          Licensed teachers are endorsed by Simply Music as having
                          successfully fulfilled the requirements for completing our
                          Initial Teacher Training Program.
                        </p>
                        <p className="text-sm text-[var(--c-6f6c65)]">
                          To increase your teacher status from Trainee to Licensed, follow
                          the link below to set up a call with a Simply Music coach.
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-white px-3 py-2 text-sm text-[var(--c-2f2b25)]">
                            <span className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-c8102e)]`}>
                              Link
                            </span>
                            Increase your teacher status from TRAINEE to LICENSED
                          </div>
                          <div className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] px-3 py-2 text-sm text-[var(--c-2f2b25)]">
                            <span className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-c8102e)]`}>
                              Link
                            </span>
                            Set up an ITTP Completion Call
                          </div>
                        </div>

                        <p className="mt-4 text-sm text-[var(--c-6f6c65)]">
                          To increase your teacher status from Licensed to Certified,
                          follow the requirements and directions below.
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-white px-3 py-2 text-sm text-[var(--c-2f2b25)]">
                            <span className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-c8102e)]`}>
                              PDF
                            </span>
                            Certified Teacher Status – Requirements &amp; Instructions (PDF)
                          </div>
                          <div className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-white px-3 py-2 text-sm text-[var(--c-2f2b25)]">
                            <span className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-c8102e)]`}>
                              PDF
                            </span>
                            Certified Teacher Status – Application (PDF)
                          </div>
                        </div>

                        <p className="mt-4 text-sm text-[var(--c-6f6c65)]">
                          To increase your teacher status from Certified to Advanced,
                          follow the requirements and directions below.
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-white px-3 py-2 text-sm text-[var(--c-2f2b25)]">
                            <span className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-c8102e)]`}>
                              PDF
                            </span>
                            Advanced Teacher Status – Requirements &amp; Instructions (PDF)
                          </div>
                          <div className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-white px-3 py-2 text-sm text-[var(--c-2f2b25)]">
                            <span className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-c8102e)]`}>
                              PDF
                            </span>
                            Advanced Teacher Status – Application (PDF)
                          </div>
                        </div>

                        <div className="mt-4 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] px-5 py-4 text-sm text-[var(--c-6f6c65)]">
                          Master teacher status is available by invitation only
                        </div>
                      </div>

                      <div className="border-t border-[var(--c-ecebe7)] pt-4 space-y-3">
                        <h4 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
                          Moving Forward
                        </h4>
                        <div className="grid gap-2 md:grid-cols-2">
                          {[
                            { label: "I'm Done With the ITTP, Now What?", type: 'Audio' },
                            {
                              label: "I'm Done With the ITTP, Now What? – Transcript (PDF)",
                              type: 'PDF',
                            },
                            { label: 'Library', type: 'Link' },
                            { label: 'Simpedia', type: 'Link' },
                            { label: 'Simply Music Teachers Group on Facebook', type: 'Link' },
                            { label: 'Simply Music Support', type: 'Link' },
                          ].map(item => (
                            <div
                              key={item.label}
                              className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-white px-3 py-2 text-sm text-[var(--c-2f2b25)]"
                            >
                              <span className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-c8102e)]`}>
                                {item.type}
                              </span>
                              {item.label}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-[var(--c-ecebe7)] pt-4 space-y-3">
                        <h4 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
                          Extras
                        </h4>
                        <div className="grid gap-2 md:grid-cols-2">
                          {[
                            { label: 'Supplemental Programs (PDF) – Overview', type: 'PDF' },
                            { label: 'The Playground, the Simply Music Blog', type: 'Link' },
                            { label: 'Music & Creativity Program', type: 'Link' },
                          ].map(item => (
                            <div
                              key={item.label}
                              className="flex items-center gap-3 rounded-xl border border-[var(--c-ecebe7)] bg-white px-3 py-2 text-sm text-[var(--c-2f2b25)]"
                            >
                              <span className={`${pillClass} bg-[var(--c-f7f7f5)] text-[var(--c-c8102e)]`}>
                                {item.type}
                              </span>
                              {item.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
                  </div>
                {moduleNumber === 2 ? (
                  <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] px-5 py-4 text-sm text-[var(--c-6f6c65)]">
                    <span className="font-semibold text-[var(--c-2f2b25)]">
                      Printing note:
                    </span>{' '}
                    To avoid issues printing PDF materials, download and print them
                    directly from your device. To save printer ink, we recommend
                    printing PDF materials in black and white. To request permission
                    to print Teacher Training Materials at a print or copy shop, contact
                    us at{' '}
                    <span className="font-semibold text-[var(--c-c8102e)]">
                      support@simplymusic.com
                    </span>
                    .
                  </div>
                ) : null}
                {moduleNumber === 2 ? (
                  <label
                    className={`inline-flex w-full items-center gap-2 rounded-2xl border border-[var(--c-ecebe7)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] ${
                      isActiveModule ? 'bg-white text-[var(--c-6f6c65)]' : 'bg-[var(--c-f7f7f5)] text-[var(--c-9a9892)]'
                    }`}
                  >
                      <input
                        type="checkbox"
                        checked={moduleMasterChecks[1]}
                        onChange={event => {
                          const next = [...moduleMasterChecks];
                          const checked = event.target.checked;
                          next[1] = checked;
                          setModuleMasterChecks(next);
                          void updateTrainingItem('mod2_master', 'module', checked);
                          if (checked) {
                            void notifyModuleCompleted(2);
                          }
                        }}
                        className="h-4 w-4 accent-[var(--c-c8102e)]"
                        disabled={!isProgressActive}
                      />
                    I have completed & understand all the training in Module 2
                  </label>
                ) : null}
                {moduleNumber === 3 ? (
                  <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] px-5 py-4 text-sm text-[var(--c-6f6c65)]">
                    <span className="font-semibold text-[var(--c-2f2b25)]">
                      Printing note:
                    </span>{' '}
                    To avoid issues printing PDF materials, download and print them
                    directly from your device. To save printer ink, we recommend
                    printing PDF materials in black and white. To request permission
                    to print Teacher Training Materials at a print or copy shop, contact
                    us at{' '}
                    <span className="font-semibold text-[var(--c-c8102e)]">
                      support@simplymusic.com
                    </span>
                    .
                  </div>
                ) : null}
                {moduleNumber === 3 ? (
                  <label
                    className={`inline-flex w-full items-center gap-2 rounded-2xl border border-[var(--c-ecebe7)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] ${
                      isActiveModule ? 'bg-white text-[var(--c-6f6c65)]' : 'bg-[var(--c-f7f7f5)] text-[var(--c-9a9892)]'
                    }`}
                  >
                      <input
                        type="checkbox"
                        checked={moduleMasterChecks[2]}
                        onChange={event => {
                          const next = [...moduleMasterChecks];
                          const checked = event.target.checked;
                          next[2] = checked;
                          setModuleMasterChecks(next);
                          void updateTrainingItem('mod3_master', 'module', checked);
                          if (checked) {
                            void notifyModuleCompleted(3);
                          }
                        }}
                        className="h-4 w-4 accent-[var(--c-c8102e)]"
                        disabled={!isProgressActive}
                      />
                    I have completed & understand all the training in Module 3
                  </label>
                ) : null}
                {moduleNumber === 4 ? (
                  <label
                    className={`inline-flex w-full items-center gap-2 rounded-2xl border border-[var(--c-ecebe7)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] ${
                      isActiveModule ? 'bg-white text-[var(--c-6f6c65)]' : 'bg-[var(--c-f7f7f5)] text-[var(--c-9a9892)]'
                    }`}
                  >
                      <input
                        type="checkbox"
                        checked={moduleMasterChecks[3]}
                        onChange={event => {
                          const next = [...moduleMasterChecks];
                          const checked = event.target.checked;
                          next[3] = checked;
                          setModuleMasterChecks(next);
                          void updateTrainingItem('mod4_master', 'module', checked);
                          if (checked) {
                            void notifyModuleCompleted(4);
                          }
                        }}
                        className="h-4 w-4 accent-[var(--c-c8102e)]"
                        disabled={!isProgressActive}
                      />
                    I have completed & understand all the training in Module 4
                  </label>
                ) : null}
                {moduleNumber === 5 ? (
                  <label
                    className={`inline-flex w-full items-center gap-2 rounded-2xl border border-[var(--c-ecebe7)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] ${
                      isActiveModule ? 'bg-white text-[var(--c-6f6c65)]' : 'bg-[var(--c-f7f7f5)] text-[var(--c-9a9892)]'
                    }`}
                  >
                      <input
                        type="checkbox"
                        checked={moduleMasterChecks[4]}
                        onChange={event => {
                          const next = [...moduleMasterChecks];
                          const checked = event.target.checked;
                          next[4] = checked;
                          setModuleMasterChecks(next);
                          void updateTrainingItem('mod5_master', 'module', checked);
                          if (checked) {
                            void notifyModuleCompleted(5);
                          }
                        }}
                        className="h-4 w-4 accent-[var(--c-c8102e)]"
                        disabled={!isProgressActive}
                      />
                    I have completed & understand all the training in Module 5
                  </label>
                ) : null}
                {moduleNumber === 6 ? (
                  <label
                    className={`inline-flex w-full items-center gap-2 rounded-2xl border border-[var(--c-ecebe7)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] ${
                      isActiveModule ? 'bg-white text-[var(--c-6f6c65)]' : 'bg-[var(--c-f7f7f5)] text-[var(--c-9a9892)]'
                    }`}
                  >
                      <input
                        type="checkbox"
                        checked={moduleMasterChecks[5]}
                        onChange={event => {
                          const next = [...moduleMasterChecks];
                          const checked = event.target.checked;
                          next[5] = checked;
                          setModuleMasterChecks(next);
                          void updateTrainingItem('mod6_master', 'module', checked);
                          if (checked) {
                            void notifyModuleCompleted(6);
                          }
                        }}
                        className="h-4 w-4 accent-[var(--c-c8102e)]"
                        disabled={!isProgressActive}
                      />
                    I have completed & understand all the training in Module 6
                  </label>
                ) : null}
                {moduleNumber === 6 ? (
                  <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] px-5 py-4 text-sm text-[var(--c-6f6c65)]">
                    <span className="font-semibold text-[var(--c-2f2b25)]">
                      Printing note:
                    </span>{' '}
                    To avoid issues printing PDF materials, download and print them
                    directly from your device. To save printer ink, we recommend
                    printing PDF materials in black and white. To request permission
                    to print Teacher Training Materials at a print or copy shop, contact
                    us at{' '}
                    <span className="font-semibold text-[var(--c-c8102e)]">
                      support@simplymusic.com
                    </span>
                    .
                  </div>
                ) : null}
                {moduleNumber === 7 ? (
                  <label
                    className={`inline-flex w-full items-center gap-2 rounded-2xl border border-[var(--c-ecebe7)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] ${
                      isActiveModule ? 'bg-white text-[var(--c-6f6c65)]' : 'bg-[var(--c-f7f7f5)] text-[var(--c-9a9892)]'
                    }`}
                  >
                      <input
                        type="checkbox"
                        checked={moduleMasterChecks[6]}
                        onChange={event => {
                          const next = [...moduleMasterChecks];
                          const checked = event.target.checked;
                          next[6] = checked;
                          setModuleMasterChecks(next);
                          void updateTrainingItem('mod7_master', 'module', checked);
                          if (checked) {
                            void notifyModuleCompleted(7);
                          }
                        }}
                        className="h-4 w-4 accent-[var(--c-c8102e)]"
                        disabled={!isProgressActive}
                      />
                    I have completed & understand all the training in Module 7
                  </label>
                ) : null}
                {moduleNumber === 7 ? (
                  <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] px-5 py-4 text-sm text-[var(--c-6f6c65)]">
                    <span className="font-semibold text-[var(--c-2f2b25)]">
                      Printing note:
                    </span>{' '}
                    To avoid issues printing PDF materials, download and print them
                    directly from your device. To save printer ink, we recommend
                    printing PDF materials in black and white. To request permission
                    to print Teacher Training Materials at a print or copy shop, contact
                    us at{' '}
                    <span className="font-semibold text-[var(--c-c8102e)]">
                      support@simplymusic.com
                    </span>
                    .
                  </div>
                ) : null}
                {moduleNumber === 8 ? (
                  <label
                    className={`inline-flex w-full items-center gap-2 rounded-2xl border border-[var(--c-ecebe7)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] ${
                      isActiveModule ? 'bg-white text-[var(--c-6f6c65)]' : 'bg-[var(--c-f7f7f5)] text-[var(--c-9a9892)]'
                    }`}
                  >
                      <input
                        type="checkbox"
                        checked={moduleMasterChecks[7]}
                        onChange={event => {
                          const next = [...moduleMasterChecks];
                          const checked = event.target.checked;
                          next[7] = checked;
                          setModuleMasterChecks(next);
                          void updateTrainingItem('mod8_master', 'module', checked);
                          if (checked) {
                            void notifyModuleCompleted(8);
                          }
                        }}
                        className="h-4 w-4 accent-[var(--c-c8102e)]"
                        disabled={!isProgressActive}
                      />
                    I have completed & understand all the training in Module 8
                  </label>
                ) : null}
                {moduleNumber === 8 ? (
                  <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] px-5 py-4 text-sm text-[var(--c-6f6c65)]">
                    <span className="font-semibold text-[var(--c-2f2b25)]">
                      Printing note:
                    </span>{' '}
                    To avoid issues printing PDF materials, download and print them
                    directly from your device. To save printer ink, we recommend
                    printing PDF materials in black and white. To request permission
                    to print Teacher Training Materials at a print or copy shop, contact
                    us at{' '}
                    <span className="font-semibold text-[var(--c-c8102e)]">
                      support@simplymusic.com
                    </span>
                    .
                  </div>
                ) : null}
                {moduleNumber === 9 ? (
                  <label
                    className={`inline-flex w-full items-center gap-2 rounded-2xl border border-[var(--c-ecebe7)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] ${
                      isActiveModule ? 'bg-white text-[var(--c-6f6c65)]' : 'bg-[var(--c-f7f7f5)] text-[var(--c-9a9892)]'
                    }`}
                  >
                      <input
                        type="checkbox"
                        checked={moduleMasterChecks[8]}
                        onChange={event => {
                          const next = [...moduleMasterChecks];
                          const checked = event.target.checked;
                          next[8] = checked;
                          setModuleMasterChecks(next);
                          void updateTrainingItem('mod9_master', 'module', checked);
                          if (checked) {
                            void notifyModuleCompleted(9);
                          }
                        }}
                        className="h-4 w-4 accent-[var(--c-c8102e)]"
                        disabled={!isProgressActive}
                      />
                    I have completed & understand all the training in Module 9
                  </label>
                ) : null}
                {moduleNumber === 9 ? (
                  <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] px-5 py-4 text-sm text-[var(--c-6f6c65)]">
                    <span className="font-semibold text-[var(--c-2f2b25)]">
                      Printing note:
                    </span>{' '}
                    To avoid issues printing PDF materials, download and print them
                    directly from your device. To save printer ink, we recommend
                    printing PDF materials in black and white. To request permission
                    to print Teacher Training Materials at a print or copy shop, contact
                    us at{' '}
                    <span className="font-semibold text-[var(--c-c8102e)]">
                      support@simplymusic.com
                    </span>
                    .
                  </div>
                ) : null}
                {moduleNumber === 10 ? (
                  <label
                    className={`inline-flex w-full items-center gap-2 rounded-2xl border border-[var(--c-ecebe7)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] ${
                      isActiveModule ? 'bg-white text-[var(--c-6f6c65)]' : 'bg-[var(--c-f7f7f5)] text-[var(--c-9a9892)]'
                    }`}
                  >
                      <input
                        type="checkbox"
                        checked={moduleMasterChecks[9]}
                        onChange={event => {
                          const next = [...moduleMasterChecks];
                          const checked = event.target.checked;
                          next[9] = checked;
                          setModuleMasterChecks(next);
                          void updateTrainingItem('mod10_master', 'module', checked);
                          if (checked) {
                            void notifyModuleCompleted(10);
                          }
                        }}
                        className="h-4 w-4 accent-[var(--c-c8102e)]"
                        disabled={!isProgressActive}
                      />
                    I have completed & understand all the training in Module 10
                  </label>
                ) : null}
                {moduleNumber === 10 ? (
                  <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] px-5 py-4 text-sm text-[var(--c-6f6c65)]">
                    <span className="font-semibold text-[var(--c-2f2b25)]">
                      Printing note:
                    </span>{' '}
                    To avoid issues printing PDF materials, download and print them
                    directly from your device. To save printer ink, we recommend
                    printing PDF materials in black and white. To request permission
                    to print Teacher Training Materials at a print or copy shop, contact
                    us at{' '}
                    <span className="font-semibold text-[var(--c-c8102e)]">
                      support@simplymusic.com
                    </span>
                    .
                  </div>
                ) : null}
                {moduleNumber === 5 ? (
                  <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] px-5 py-4 text-sm text-[var(--c-6f6c65)]">
                    <span className="font-semibold text-[var(--c-2f2b25)]">
                      Printing note:
                    </span>{' '}
                    To avoid issues printing PDF materials, download and print them
                    directly from your device. To save printer ink, we recommend
                    printing PDF materials in black and white. To request permission
                    to print Teacher Training Materials at a print or copy shop, contact
                    us at{' '}
                    <span className="font-semibold text-[var(--c-c8102e)]">
                      support@simplymusic.com
                    </span>
                    .
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      {showVideo ? (
        <div
          className={`fixed right-20 top-20 z-[60] -translate-x-1 transition-all duration-700 ease-in-out ${
            slideAway
              ? 'translate-x-[140%] opacity-0'
              : slideIn
                ? 'translate-x-0 opacity-100'
                : 'translate-x-[140%] opacity-0'
          }`}
        >
          <VimeoGuidePanel
            ref={guideRef}
            videoId="1166063740"
            title="ITTP Guided Walkthrough"
            description="Follow this guide to complete each step with confidence."
            autoShow
            autoPlay={false}
            autoCloseOnEnd={false}
            frameAspectClass="aspect-[2/3]"
            videoAspectClass="aspect-[2/3]"
            videoWrapClass="h-full max-w-[300px] scale-[1.18]"
            prebuffer
            minimalFrame
            className="w-[300px]"
            onPlay={() => {
              setSlideIn(true);
            }}
            onEnded={() => {
              document.cookie =
                'ittp_intro_watched=true; Max-Age=2592000; path=/; SameSite=Lax';
              setHasWatchedIntro(true);
              setIntroEndedAt(Date.now());
              window.setTimeout(() => {
                setSlideAway(true);
              }, 1500);
            }}
            onProgress={(seconds, duration) => {
              if (duration <= 0) return;
              if (seconds / duration >= 0.5 && !hasWatchedIntro) {
                document.cookie =
                  'ittp_intro_watched=true; Max-Age=2592000; path=/; SameSite=Lax';
                setHasWatchedIntro(true);
              }
              if (seconds >= 12 && !module1PulseTriggered.current) {
                module1PulseTriggered.current = true;
                setModule1Pulse(true);
                window.setTimeout(() => {
                  setModule1Pulse(false);
                }, 10400);
              }
              if (duration - seconds <= 2.5) {
                setModule1Glow(true);
              }
            }}
          />
        </div>
      ) : null}

      </div>

      {showWelcome ? (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-6 select-none">
          <div className="w-full max-w-lg rounded-3xl border border-white/20 bg-[var(--c-ffffff)] p-8 shadow-[0_30px_90px_-50px_rgba(0,0,0,0.65)] select-none">
            <p className="text-xs uppercase tracking-[0.4em] text-[var(--c-9a9892)]">
              Welcome
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
              Welcome To Your Simply Music Training
            </h2>
            <p className="mt-3 text-base leading-relaxed text-[var(--c-6f6c65)]">
              The Initial Teacher Training Program is organized into clear modules,
              each supported by essential resources and guidance. Everything you need
              to progress through your certification journey is available within this
              section.
            </p>
            <p className="mt-3 text-lg font-semibold text-[var(--c-1f1f1d)]">
              When you’re ready, begin with Module 1.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setIntroTriggered(true);
                  setShowWelcome(false);
                  window.setTimeout(() => {
                    guideRef.current?.playWithSound();
                  }, 250);
                }}
                className="w-full rounded-full border border-[var(--sidebar-accent-bg)] bg-[var(--sidebar-accent-bg)] px-5 py-2 text-base font-semibold uppercase tracking-[0.3em] text-white transition hover:brightness-110"
              >
                View Training Introduction
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showUsernameModal ? (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 px-4 py-8">
          <div className="w-full max-w-lg rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
                  Training Setup
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                  Choose Your Username
                </h2>
                <p className="mt-2 text-base text-[var(--c-6f6c65)]">
                  This will be your public teacher handle inside Simply Music.
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                Username
              </label>
              <input
                value={usernameInput}
                onChange={event => {
                  setUsernameError(null);
                  setUsernameInput(event.target.value);
                }}
                maxLength={35}
                className="w-full rounded-xl border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-3 text-base text-[var(--c-1f1f1d)] outline-none focus:border-[var(--sidebar-accent-bg)]"
                placeholder="yourname"
              />
              {usernameSuggestions.length > 0 ? (
                <div className="text-sm text-[var(--c-6f6c65)]">
                  Suggested:{' '}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {usernameSuggestions.slice(0, 6).map(suggestion => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => {
                          setUsernameError(null);
                          setUsernameInput(suggestion);
                        }}
                        className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-f7f7f5)] px-3 py-1.5 text-sm font-semibold text-[var(--c-1f1f1d)] transition hover:border-[var(--sidebar-accent-bg)] hover:text-[var(--c-c8102e)]"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : usernameSuggested ? (
                <div className="text-sm text-[var(--c-6f6c65)]">
                  Suggested: <span className="font-semibold">{usernameSuggested}</span>
                </div>
              ) : null}
              <div className="text-sm uppercase tracking-[0.2em]">
                {usernameStatus === 'checking' ? (
                  <span className="text-[var(--c-9a9892)]">Checking availability…</span>
                ) : usernameStatus === 'available' ? (
                  <span className="text-emerald-600">Available</span>
                ) : usernameStatus === 'unavailable' ? (
                  <span className="text-[var(--c-c8102e)]">Already in use</span>
                ) : null}
              </div>
              {usernameError ? (
                <div className="rounded-xl border border-[var(--c-f2d7db)] bg-[var(--c-fff5f6)] px-3 py-2 text-sm text-[var(--c-8f2f3b)]">
                  {usernameError}
                </div>
              ) : null}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowUsernameModal(false);
                    window.localStorage.removeItem('ittp_username_modal_open');
                    window.dispatchEvent(new Event('sm-teacher-welcome-updated'));
                    window.dispatchEvent(
                      new CustomEvent('ittp-username-modal-state', {
                        detail: { open: false },
                      }),
                    );
                  }}
                  className="w-full rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-fafafa)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[var(--sidebar-accent-bg)]/40 hover:text-[var(--c-c8102e)]"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSaveUsername}
                  disabled={isSavingUsername}
                  className="w-full rounded-full bg-[var(--sidebar-accent-bg)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:brightness-110 disabled:opacity-60"
                >
                  {isSavingUsername ? 'Saving…' : 'Save Username'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showCongratsModal ? (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 px-4 py-8">
          <div className="w-full max-w-xl rounded-3xl border border-white/20 bg-[var(--c-ffffff)] p-8 shadow-[0_30px_90px_-50px_rgba(0,0,0,0.65)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-[var(--c-9a9892)]">
                  Congratulations
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-[var(--c-1f1f1d)]">
                  Congrats! You Did It!
                </h2>
                <p className="mt-3 text-base leading-relaxed text-[var(--c-6f6c65)]">
                  You’ve completed all ITTP modules. We’ll add next‑step resources and
                  bundles here as they become available.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCongratsModal(false)}
                className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-fafafa)] px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[var(--sidebar-accent-bg)]/40 hover:text-[var(--c-c8102e)]"
              >
                Close
              </button>
            </div>
            <div className="mt-6 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] p-5 text-sm text-[var(--c-6f6c65)]">
              Placeholder for upcoming bundle content, resources, and next steps.
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
