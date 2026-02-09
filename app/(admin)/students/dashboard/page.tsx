'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import studentsData from '@/data/students.json';
import LastViewedVideoCard from '../../components/last-viewed-video-card';
import StudentPromoCard from '../../components/student-promo-card';
import {
  AUTH_STORAGE_KEY,
  VIEW_ROLE_STORAGE_KEY,
  VIEW_STUDENT_STORAGE_KEY,
} from '../../components/auth';
import lessonMaterials from '../../teachers/students/lesson-data/lesson-materials.json';
import { makePracticeMaterialId } from '../../components/practice-hub-utils';
import { useLessonCart } from '../../components/lesson-cart';
import {
  makeStudentScope,
  useLessonCartScope,
} from '../../components/lesson-cart-scope';
import { slugifyLessonValue } from '../../components/lesson-utils';

type StudentRecord = {
  id: string;
  name: string;
  email: string;
  username?: string;
  teacher?: string;
  lessonDay?: string;
};

type LastViewedVideo = {
  material: string;
  part?: string;
  materials?: string[];
  viewedAt?: string;
};

export default function StudentDashboardPage() {
  const students = useMemo(
    () => (studentsData.students as StudentRecord[]) ?? [],
    [],
  );
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(
    null,
  );
  const [isTeacherView, setIsTeacherView] = useState(false);
  const [lastViewedVideo, setLastViewedVideo] = useState<LastViewedVideo | null>(
    null,
  );
  const [isFeePaid, setIsFeePaid] = useState<boolean | null>(null);
  const [isCongratsToastVisible, setIsCongratsToastVisible] = useState(false);
  const [isCongratsCardVisible, setIsCongratsCardVisible] = useState(false);
  const defaultFullPlayerCover = '/reference/StudentVideo.png';
  const neilFullPlayerCover = '/reference/NeilMooreVideo.png';
  const [fullPlayerCover, setFullPlayerCover] = useState(
    defaultFullPlayerCover,
  );
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
  const [isCongratsPlayer, setIsCongratsPlayer] = useState(false);
  const { scope, studentId } = useLessonCartScope();
  const studentScope = studentId ? makeStudentScope(studentId) : scope;
  const { purchasedItems } = useLessonCart(studentScope);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [focusIds, setFocusIds] = useState<string[]>([]);
  const [studentServerUnlocks, setStudentServerUnlocks] = useState<
    typeof purchasedItems
  >([]);

  const handleFullPlayerChange = (next: boolean) => {
    setIsFullPlayerOpen(next);
    if (!next) {
      setFullPlayerCover(defaultFullPlayerCover);
      setIsCongratsPlayer(false);
    }
  };

  const handlePlayCongratsMessage = () => {
    setFullPlayerCover(neilFullPlayerCover);
    setIsFullPlayerOpen(true);
    setIsCongratsPlayer(true);
  };

  useEffect(() => {
    const loadStudentSelection = () => {
      const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (!stored) {
        setSelectedStudent(null);
        setIsTeacherView(false);
        return;
      }
      try {
        const parsed = JSON.parse(stored) as { username?: string; role?: string };
        if (parsed?.role === 'teacher' || parsed?.role === 'company') {
          const storedView = window.localStorage.getItem(VIEW_ROLE_STORAGE_KEY);
          const isStudentView = storedView === 'student';
          setIsTeacherView(isStudentView);

          const viewStudentKey = parsed?.username
            ? `${VIEW_STUDENT_STORAGE_KEY}:${parsed.username}`
            : VIEW_STUDENT_STORAGE_KEY;
          const storedStudent =
            window.localStorage.getItem(viewStudentKey) ??
            window.localStorage.getItem(VIEW_STUDENT_STORAGE_KEY);

          if (isStudentView && storedStudent) {
            try {
              const selected = JSON.parse(storedStudent) as {
                id?: string;
                name?: string;
                email?: string;
              };
              if (selected?.id) {
                const matched =
                  students.find(student => student.id === selected.id) ?? null;
                setSelectedStudent(matched);
                window.localStorage.setItem(viewStudentKey, storedStudent);
                return;
              }
            } catch {
              setSelectedStudent(null);
            }
          }

          setSelectedStudent(null);
          return;
        }

        if (parsed?.role === 'student') {
          const normalized = parsed.username?.toLowerCase() ?? '';
          const match =
            students.find(student => student.email.toLowerCase() === normalized) ??
            students.find(
              student => student.username?.toLowerCase() === normalized,
            ) ??
            students.find(
              student => student.name.toLowerCase() === normalized,
            ) ??
            students.find(student =>
              student.name.toLowerCase().startsWith(normalized),
            ) ??
            null;
          setSelectedStudent(match ?? null);
          setIsTeacherView(false);
          return;
        }

        setSelectedStudent(null);
        setIsTeacherView(false);
      } catch {
        setSelectedStudent(null);
        setIsTeacherView(false);
      }
    };

    loadStudentSelection();
    const handleSelectionUpdate = () => loadStudentSelection();
    window.addEventListener('sm-view-student-updated', handleSelectionUpdate);
    window.addEventListener('sm-student-selection', handleSelectionUpdate);
    return () => {
      window.removeEventListener(
        'sm-view-student-updated',
        handleSelectionUpdate,
      );
      window.removeEventListener('sm-student-selection', handleSelectionUpdate);
    };
  }, [students]);

  useEffect(() => {
    if (!selectedStudent?.teacher || !selectedStudent?.id) {
      setIsFeePaid(null);
      return;
    }
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const storageKey = `sm_lesson_fees:${selectedStudent.teacher}:${monthKey}`;
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (!stored) {
        setIsFeePaid(false);
        return;
      }
      const parsed = JSON.parse(stored) as { paid?: Record<string, boolean> };
      const paid = parsed?.paid?.[selectedStudent.id] ?? false;
      setIsFeePaid(Boolean(paid));
    } catch {
      setIsFeePaid(false);
    }
  }, [selectedStudent?.teacher, selectedStudent?.id]);

  useEffect(() => {
    if (selectedStudent?.name === 'Quinn') {
      setIsCongratsCardVisible(false);
      return;
    }
    setIsCongratsToastVisible(false);
    setIsCongratsCardVisible(false);
  }, [selectedStudent?.name]);

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
    if (!studentId) return;
    fetch('/api/practice-hub/unlocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'student',
        studentId,
        items: purchasedItems,
      }),
    }).catch(() => undefined);
  }, [purchasedItems, studentId]);

  useEffect(() => {
    if (!studentId) return;
    const refreshFromServer = async () => {
      try {
        const [unlocksRes, visibilityRes] = await Promise.all([
          fetch(`/api/practice-hub/unlocks?role=student&studentId=${encodeURIComponent(studentId)}`),
          fetch(`/api/practice-hub/visibility?studentId=${encodeURIComponent(studentId)}`),
        ]);
        const unlocksData = await unlocksRes.json();
        const visibilityData = await visibilityRes.json();
        setStudentServerUnlocks(unlocksData.items ?? []);
        setSelectedIds(
          Array.isArray(visibilityData.selectedIds) ? visibilityData.selectedIds : [],
        );
        setFocusIds(
          Array.isArray(visibilityData.focusIds) ? visibilityData.focusIds : [],
        );
      } catch {
        // ignore
      }
    };
    refreshFromServer();
    const timer = window.setInterval(refreshFromServer, 2000);
    return () => window.clearInterval(timer);
  }, [studentId]);

  const visibleSections = useMemo(() => {
    return studentServerUnlocks
      .map(item => ({
        program: item.program,
        section: item.section,
        materials:
          lessonMaterials[
            `${item.program}|${item.section}` as keyof typeof lessonMaterials
          ] ?? [],
      }))
      .map(section => {
        const materials = section.materials.filter(material =>
          selectedIds.includes(
            makePracticeMaterialId(
              section.program,
              section.section,
              material,
            ),
          ),
        );
        return {
          ...section,
          materials: materials.map(material => ({
            name: material,
            focused: focusIds.includes(
              makePracticeMaterialId(
                section.program,
                section.section,
                material,
              ),
            ),
          })),
        };
      })
      .filter(section => section.materials.length > 0);
  }, [studentServerUnlocks, selectedIds, focusIds]);

  const focusItems = useMemo(() => {
    const focused: Array<{
      program: string;
      section: string;
      material: string;
      display: string;
    }> = [];
    studentServerUnlocks.forEach(item => {
      const materials =
        lessonMaterials[
          `${item.program}|${item.section}` as keyof typeof lessonMaterials
        ] ?? [];
      materials.forEach(material => {
        const id = makePracticeMaterialId(
          item.program,
          item.section,
          material,
        );
        if (!focusIds.includes(id)) return;
        const display =
          material.split('–').slice(1).join('–').trim() ||
          material.split('-').slice(1).join('-').trim() ||
          material;
        focused.push({
          program: item.program,
          section: item.section,
          material,
          display,
        });
      });
    });
    return focused;
  }, [studentServerUnlocks, focusIds]);

  const [focusPrimary, focusSecondary] = useMemo(() => {
    if (focusItems.length === 0) return [null, null];
    const seedBase = `${studentId ?? 'student'}:focus:${new Date().toDateString()}`;
    const hashSeed = seedBase.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const mulberry32 = (seed: number) => {
      let t = seed + 0x6d2b79f5;
      return () => {
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    };
    const random = mulberry32(hashSeed);
    const indices = focusItems.map((_, index) => index);
    for (let i = indices.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const first = focusItems[indices[0]] ?? null;
    const second = focusItems[indices[1]] ?? null;
    return [first, second];
  }, [focusItems, studentId]);

  const focusPrimaryHref = focusPrimary
    ? `/students/lesson-library/${slugifyLessonValue(focusPrimary.program)}/${slugifyLessonValue(focusPrimary.section)}?material=${encodeURIComponent(focusPrimary.material)}`
    : null;
  const focusSecondaryHref = focusSecondary
    ? `/students/lesson-library/${slugifyLessonValue(focusSecondary.program)}/${slugifyLessonValue(focusSecondary.section)}?material=${encodeURIComponent(focusSecondary.material)}`
    : null;

  const unlockedSongs = useMemo(() => {
    const numberedPattern = /^\s*\d+(\.\d+)?\s*[-–]/;
    const songs: Array<{
      program: string;
      section: string;
      material: string;
      display: string;
    }> = [];
    for (const item of studentServerUnlocks) {
      const materials =
        lessonMaterials[
          `${item.program}|${item.section}` as keyof typeof lessonMaterials
        ] ?? [];
      const candidates = materials.filter(material =>
        numberedPattern.test(material),
      );
      candidates.forEach(candidate => {
        const display =
          candidate.split('–').slice(1).join('–').trim() ||
          candidate.split('-').slice(1).join('-').trim() ||
          candidate;
        songs.push({
          program: item.program,
          section: item.section,
          material: candidate,
          display,
        });
      });
    }
    return songs;
  }, [studentServerUnlocks]);

  const [primarySong, secondarySong] = useMemo(() => {
    if (unlockedSongs.length === 0) return [null, null];
    const seedBase = `${studentId ?? 'student'}:${new Date().toDateString()}`;
    const hashSeed = seedBase.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const mulberry32 = (seed: number) => {
      let t = seed + 0x6d2b79f5;
      return () => {
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    };
    const random = mulberry32(hashSeed);
    const indices = unlockedSongs.map((_, index) => index);
    for (let i = indices.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const ordered = indices.map(index => unlockedSongs[index]);
    const lastViewedMaterial = lastViewedVideo?.material ?? null;
    if (lastViewedMaterial && ordered.length > 1) {
      if (ordered[0]?.material === lastViewedMaterial) {
        ordered.push(ordered.shift()!);
      } else if (ordered[1]?.material === lastViewedMaterial && ordered.length > 2) {
        const swap = ordered[1];
        ordered[1] = ordered[2];
        ordered[2] = swap;
      }
    }
    const first = ordered[0] ?? null;
    const second = ordered[1] ?? null;
    return [first, second];
  }, [studentId, unlockedSongs, lastViewedVideo?.material]);

  const phraseIndex = useMemo(() => {
    const seedBase = `${studentId ?? 'student'}:${lastViewedVideo?.material ?? 'none'}:${new Date().toDateString()}`;
    return seedBase
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  }, [studentId, lastViewedVideo?.material]);

  const primaryTitleTemplates = [
    'Have you played "{song}" lately?',
    'When’s the last time you jammed "{song}"?',
    'Ready to bring "{song}" back to life?',
  ];

  const secondaryTitleTemplates = [
    'When did you last play "{song}"?',
    'How long has it been since "{song}"?',
    'Is "{song}" still in your fingers?',
  ];

  const primarySubtitleTemplates = [
    'Keep it fresh with a quick run-through.',
    'A few minutes today keeps it performance-ready.',
    'Give this one a quick polish session.',
  ];

  const secondarySubtitleTemplates = [
    'Drop in and refresh the arrangement.',
    'A short revisit goes a long way.',
    'Let’s keep it warm and ready.',
  ];

  const pickTemplate = (templates: string[], offset: number) =>
    templates[(phraseIndex + offset) % templates.length];

  const primarySongHref = primarySong
    ? `/students/lesson-library/${slugifyLessonValue(primarySong.program)}/${slugifyLessonValue(primarySong.section)}?material=${encodeURIComponent(primarySong.material)}`
    : null;
  const secondarySongHref = secondarySong
    ? `/students/lesson-library/${slugifyLessonValue(secondarySong.program)}/${slugifyLessonValue(secondarySong.section)}?material=${encodeURIComponent(secondarySong.material)}`
    : null;
  const isCongratsEligible = selectedStudent?.name === 'Quinn';
  const congratsMessage = isCongratsEligible
    ? "Quinn, I'm so proud of you for completing Level 3!"
    : "I'm so proud of you for completing your latest level!";
  const showCongratsToast = () => {
    if (!isCongratsEligible) return;
    setIsCongratsToastVisible(true);
    setIsCongratsCardVisible(false);
  };
  const openCongratsCard = () => {
    setIsCongratsToastVisible(false);
    setIsCongratsCardVisible(true);
  };
  const dismissCongratsCard = () => {
    setIsCongratsToastVisible(false);
    setIsCongratsCardVisible(false);
  };

  return (
    <div className="space-y-6">
      {isCongratsToastVisible && isCongratsEligible ? (
        <div className="fixed right-6 top-6 z-50 flex flex-col gap-3">
          <button
            type="button"
            onClick={openCongratsCard}
            className="w-[min(320px,90vw)] rounded-2xl border border-white/30 bg-white/5 p-4 text-left text-[var(--c-ffffff)] shadow-[0_8px_20px_-18px_rgba(0,0,0,0.25)] backdrop-blur-md backdrop-saturate-150 transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-18px_rgba(0,0,0,0.35)]"
          >
            <p className="text-[10px] uppercase tracking-[0.4em] text-white/90 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">
              New Message
            </p>
            <p className="mt-2 text-sm font-semibold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
              Neil Moore
            </p>
            <p className="mt-2 text-base text-white/90 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">
              {congratsMessage} Tap to watch a video message I sent you!
            </p>
          </button>
        </div>
      ) : null}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <header>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
            Students
          </p>
          <h1 className="text-3xl font-semibold text-[var(--c-1f1f1d)] mt-2">
            Dashboard
          </h1>
          <p className="mt-2 text-[15px] text-[var(--c-6f6c65)]">
            Your practice snapshot will live here.
          </p>
        </header>

        {isTeacherView ? (
          <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[linear-gradient(135deg,var(--c-ffffff),var(--c-f7f7f5))] p-5 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.45)] ring-1 ring-[var(--c-ecebe7)] lg:max-w-sm lg:flex-1">
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                Selected Student
              </p>
              <h2 className="text-xl font-semibold text-[var(--c-1f1f1d)]">
                {selectedStudent?.name ?? 'No student selected'}
              </h2>
              <p className="text-[15px] text-[var(--c-6f6c65)]">
                {selectedStudent?.name
                  ? 'You are viewing the student dashboard for this learner.'
                  : 'Choose a student in the sidebar to view their dashboard.'}
              </p>
            </div>
          </section>
        ) : null}
      </div>

      {isCongratsEligible && !isCongratsToastVisible && !isCongratsCardVisible ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={showCongratsToast}
            className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
          >
            Show Neil Message
          </button>
        </div>
      ) : null}

      {isFeePaid === false ? (
        <div className="rounded-2xl border border-[var(--c-f2dac5)] bg-[var(--c-fff7e8)] px-5 py-4 text-[15px] text-[var(--c-7a4a17)] shadow-[0_12px_30px_-24px_rgba(0,0,0,0.35)]">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-7a4a17)]">
            Lesson Fees Due
          </p>
          <p className="mt-2 text-base font-semibold text-[var(--c-1f1f1d)]">
            This month’s lesson fees are not marked paid yet.
          </p>
          <p className="mt-2 text-[15px] text-[var(--c-6f6c65)]">
            Please check in with your teacher and get this taken care of.
          </p>
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
        <div className="space-y-4">
          {lastViewedVideo ? (
            <LastViewedVideoCard
              data={lastViewedVideo}
              expandedCoverImage={fullPlayerCover}
              expandedOpen={isFullPlayerOpen}
              onExpandedChange={handleFullPlayerChange}
              expandedLabel={isCongratsPlayer ? 'Congratulations' : undefined}
              expandedTitle={isCongratsPlayer ? 'Neil Moore' : undefined}
              expandedSubtitle={isCongratsPlayer ? congratsMessage : undefined}
              expandedShowCenterText={!isCongratsPlayer}
              expandedShowOverlay={!isCongratsPlayer}
            />
          ) : null}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <section className="flex h-full flex-col rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f1f1ef)] p-5 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.35)] ring-1 ring-[var(--c-ecebe7)]">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                Focus
              </p>
              <h2 className="mt-3 text-lg font-semibold text-[var(--c-1f1f1d)]">
                Make &quot;{focusPrimary?.display ?? 'a focus song'}&quot; your weekly win.
              </h2>
              <p className="mt-2 text-[15px] text-[var(--c-6f6c65)]">
                {focusPrimary
                  ? 'Play it daily so your teacher can hear the growth next lesson.'
                  : 'Focus song will appear here once setup by your teacher.'}
              </p>
              <div className="mt-auto pt-6">
                {focusPrimaryHref ? (
                  <Link
                    href={focusPrimaryHref}
                    className="inline-flex items-center justify-center rounded-full border border-[var(--c-1f1f1d)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--c-1f1f1d)] transition hover:border-[var(--c-c8102e)] hover:text-[var(--c-c8102e)]"
                  >
                    Go to lesson video
                  </Link>
                ) : null}
              </div>
            </section>

            <section className="flex h-full flex-col rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f1f1ef)] p-5 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.35)] ring-1 ring-[var(--c-ecebe7)]">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                Focus
              </p>
              <h2 className="mt-3 text-lg font-semibold text-[var(--c-1f1f1d)]">
                Keep &quot;{focusSecondary?.display ?? 'your focus song'}&quot; polished.
              </h2>
              <p className="mt-2 text-[15px] text-[var(--c-6f6c65)]">
                {focusSecondary
                  ? 'A short daily run keeps it strong for your next lesson.'
                  : 'Focus song will appear here once setup by your teacher.'}
              </p>
              <div className="mt-auto pt-6">
                {focusSecondaryHref ? (
                  <Link
                    href={focusSecondaryHref}
                    className="inline-flex items-center justify-center rounded-full border border-[var(--c-1f1f1d)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--c-1f1f1d)] transition hover:border-[var(--c-c8102e)] hover:text-[var(--c-c8102e)]"
                  >
                    Go to lesson video
                  </Link>
                ) : null}
              </div>
            </section>

            <section className="flex h-full flex-col rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f1f1ef)] p-5 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.35)] ring-1 ring-[var(--c-ecebe7)]">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                Practice
              </p>
              <h2 className="mt-3 text-lg font-semibold text-[var(--c-1f1f1d)]">
                {pickTemplate(primaryTitleTemplates, 0).replace(
                  '{song}',
                  primarySong?.display ?? 'a new song',
                )}
              </h2>
              <p className="mt-2 text-[15px] text-[var(--c-6f6c65)]">
                {primarySong
                  ? pickTemplate(primarySubtitleTemplates, 1)
                  : 'Unlock a lesson to get started.'}
              </p>
              <div className="mt-auto pt-6">
                {primarySongHref ? (
                  <Link
                    href={primarySongHref}
                    className="inline-flex items-center justify-center rounded-full border border-[var(--c-1f1f1d)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--c-1f1f1d)] transition hover:border-[var(--c-c8102e)] hover:text-[var(--c-c8102e)]"
                  >
                    Go to lesson video
                  </Link>
                ) : null}
              </div>
            </section>

            <section className="flex h-full flex-col rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f1f1ef)] p-5 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.35)] ring-1 ring-[var(--c-ecebe7)]">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                Check-in
              </p>
              <h2 className="mt-3 text-lg font-semibold text-[var(--c-1f1f1d)]">
                {pickTemplate(secondaryTitleTemplates, 2).replace(
                  '{song}',
                  secondarySong?.display ?? 'this song',
                )}
              </h2>
              <p className="mt-2 text-[15px] text-[var(--c-6f6c65)]">
                {secondarySong
                  ? pickTemplate(secondarySubtitleTemplates, 3)
                  : 'Unlock a lesson to see your check-in prompt.'}
              </p>
              <div className="mt-auto pt-6">
                {secondarySongHref ? (
                  <Link
                    href={secondarySongHref}
                    className="inline-flex items-center justify-center rounded-full border border-[var(--c-1f1f1d)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--c-1f1f1d)] transition hover:border-[var(--c-c8102e)] hover:text-[var(--c-c8102e)]"
                  >
                    Go to lesson video
                  </Link>
                ) : null}
              </div>
            </section>
          </div>
        </div>
        <aside className="space-y-4">
          {isCongratsCardVisible && isCongratsEligible ? (
            <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f1f1ef)] p-5 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.45)] ring-1 ring-[var(--c-ecebe7)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                    Video Message
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-[var(--c-1f1f1d)]">
                    Neil Moore
                  </h2>
                </div>
                <span className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  Congratulations
                </span>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] shadow-sm">
                <div className="relative aspect-video w-full">
                  <img
                    src="/reference/NeilMooreVideo.png"
                    alt="Video placeholder"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.15),rgba(0,0,0,0.55))]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={handlePlayCongratsMessage}
                      className="rounded-full border border-white/70 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white transition hover:border-white hover:bg-white/20"
                    >
                      Play Message
                    </button>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-[15px] leading-relaxed text-[var(--c-6f6c65)]">
                {congratsMessage}
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-[var(--c-6f6c65)]">
                I've watched your consistency and focus grow every week, and it
                shows.
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-[var(--c-6f6c65)]">
                Keep leaning into the details — you're doing something special.
              </p>

              <button
                type="button"
                onClick={dismissCongratsCard}
                className="mt-4 inline-flex items-center justify-center rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
              >
                Dismiss This Message
              </button>
            </section>
          ) : null}
          <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f1f1ef)] p-5 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.45)] ring-1 ring-[var(--c-ecebe7)]">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
              This Week
            </p>
            <h2 className="mt-3 text-xl font-semibold text-[var(--c-1f1f1d)]">
              Lesson Plan Ready
            </h2>
            <p className="mt-2 text-[15px] text-[var(--c-6f6c65)]">
              Jump into your current lesson plan to review parts, videos, and
              practice goals.
            </p>
            <Link
              href="/students/current-lesson"
              className="mt-4 inline-flex items-center justify-center rounded-full border border-[var(--c-1f1f1d)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--c-1f1f1d)] transition hover:border-[var(--c-c8102e)] hover:text-[var(--c-c8102e)]"
            >
              View Lesson Plan
            </Link>
          </section>

          <StudentPromoCard />

          <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f1f1ef)] p-5 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.45)] ring-1 ring-[var(--c-ecebe7)]">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
              Playlist
            </p>
            <h2 className="mt-3 text-xl font-semibold text-[var(--c-1f1f1d)]">
              Keep Your Playlist Repertoire Alive!
            </h2>
            <p className="mt-2 text-[15px] text-[var(--c-6f6c65)]">
              This is your personal playlist, curated by your teacher so you can
              sit down, play through, and keep these songs fresh anytime.
            </p>
            {visibleSections.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-4 text-[15px] text-[var(--c-6f6c65)]">
                No playlist items have been set yet.
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {visibleSections.map(section => (
                  <div
                    key={`${section.program}-${section.section}`}
                    className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                      {section.program}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[var(--c-1f1f1d)]">
                      {section.section}
                    </p>
                    <div className="mt-3 space-y-2">
                      {section.materials.map(material => (
                        <div
                          key={`${section.program}-${section.section}-${material.name}`}
                          className={`rounded-xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm ${
                            material.focused
                              ? 'bg-[var(--c-faf9f6)] text-[var(--c-1f1f1d)]'
                              : 'bg-[var(--c-fcfcfb)] text-[var(--c-1f1f1d)]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span>{material.name}</span>
                            {material.focused ? (
                              <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                                Focus
                              </span>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>
      </section>
    </div>
  );
}
