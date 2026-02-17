'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApiData } from '../../components/use-api-data';

type StudioRecord = {
  id: string;
  company: string;
  name: string;
  location?: string;
  timeZone?: string;
  status?: string;
  createdAt?: string;
  adminTeacherId?: string;
  teacherIds?: string[];
};

type TeacherRecord = {
  id: string;
  name: string;
  username?: string;
  email: string;
  region?: string;
  status?: string;
  studioId?: string;
  studioRole?: string;
};

type StudentRecord = {
  id: string;
  teacher: string;
  name: string;
  lessonDay?: string;
  lessonTime?: string;
  status: 'Active' | 'Paused' | 'Archived';
};

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

export default function StudioDashboardPage() {
  const searchParams = useSearchParams();
  const { data: studiosData } = useApiData<{ studios: StudioRecord[] }>(
    '/api/studios',
    { studios: [] },
  );
  const { data: teachersData } = useApiData<{ teachers: TeacherRecord[] }>(
    '/api/teachers',
    { teachers: [] },
  );
  const { data: studentsData } = useApiData<{ students: StudentRecord[] }>(
    '/api/students',
    { students: [] },
  );
  const [studioId, setStudioId] = useState<string | null>(null);
  const [viewerRole, setViewerRole] = useState<'company' | 'teacher' | null>(null);
  const [viewerTeacherId, setViewerTeacherId] = useState<string | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem('sm_user');
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as { username?: string; role?: string };
      const studios = (studiosData.studios as StudioRecord[]) ?? [];
      const studioParam = searchParams.get('studio');
      const studioMatch = studios.find(studio => studio.id === studioParam);
      if (parsed?.role === 'company') {
        setViewerRole('company');
        setStudioId(studioMatch?.id ?? studios[0]?.id ?? null);
        return;
      }
      if (parsed?.role === 'teacher' && parsed?.username) {
        setViewerRole('teacher');
        const teachers = (teachersData.teachers as TeacherRecord[]) ?? [];
        const teacher = teachers.find(item => item.username === parsed.username);
        setViewerTeacherId(teacher?.id ?? null);
        setStudioId(teacher?.studioId ?? studioMatch?.id ?? null);
      }
    } catch {
      setViewerRole(null);
      setStudioId(null);
      setViewerTeacherId(null);
    }
  }, [searchParams, studiosData, teachersData]);

  const studio = useMemo(() => {
    const studios = (studiosData.studios as StudioRecord[]) ?? [];
    if (!studios.length) return null;
    return studios.find(item => item.id === studioId) ?? studios[0] ?? null;
  }, [studioId, studiosData]);

  const teacherRoster = useMemo(() => {
    const teachers = (teachersData.teachers as TeacherRecord[]) ?? [];
    if (!studio?.teacherIds?.length) return [] as TeacherRecord[];
    return teachers.filter(teacher => studio.teacherIds?.includes(teacher.id));
  }, [studio, teachersData]);

  const studentRoster = useMemo(() => {
    const students = (studentsData.students as StudentRecord[]) ?? [];
    if (!teacherRoster.length) return [] as StudentRecord[];
    const teacherUsernames = teacherRoster
      .map(teacher => teacher.username)
      .filter(Boolean) as string[];
    return students.filter(student => teacherUsernames.includes(student.teacher));
  }, [teacherRoster, studentsData]);

  const activeStudents = useMemo(
    () => studentRoster.filter(student => student.status === 'Active'),
    [studentRoster],
  );

  const lessonsThisWeek = useMemo(
    () => activeStudents.filter(student => Boolean(student.lessonDay)).length,
    [activeStudents],
  );

  const upcomingLessons = useMemo(() => {
    const sortable = activeStudents
      .filter(student => student.lessonDay)
      .map(student => ({
        ...student,
        timeMinutes: parseTimeToMinutes(student.lessonTime) ?? 9999,
      }))
      .sort((a, b) => a.timeMinutes - b.timeMinutes);
    return sortable.slice(0, 6);
  }, [activeStudents]);

  const adminTeacher = useMemo(
    () => teacherRoster.find(teacher => teacher.id === studio?.adminTeacherId),
    [teacherRoster, studio],
  );

  if (!studio) {
    return (
      <div className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
          Studios
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--c-1f1f1d)]">
          No studio assigned yet
        </h1>
        <p className="mt-3 text-sm text-[var(--c-6f6c65)]">
          Studios appear once two or more teachers are grouped by the company.
          Ask Simply Music to connect your studio team.
        </p>
      </div>
    );
  }

  const isAdmin = viewerTeacherId && viewerTeacherId === studio.adminTeacherId;

  return (
    <div className="space-y-6">
      <header
        className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm"
        id="overview"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
              Studios
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--c-1f1f1d)]">
              {studio.name}
            </h1>
            <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
              {studio.location ?? 'Location TBD'} · {studio.status ?? 'Active'} · Studio dashboard
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-fcfcfb)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
              {viewerRole === 'company' ? 'Company View' : isAdmin ? 'Studio Admin' : 'Studio Teacher'}
            </span>
            {adminTeacher ? (
              <p className="text-xs text-[var(--c-6f6c65)]">
                Owner:{' '}
                <span className="font-semibold text-[var(--c-1f1f1d)]">
                  {adminTeacher.name}
                </span>
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-e7eddc)]/60 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
              Teachers
            </p>
            <p className="mt-2 text-3xl font-semibold text-[var(--c-1f1f1d)]">
              {teacherRoster.length}
            </p>
            <p className="mt-1 text-sm text-[var(--c-6f6c65)]">
              Coaching team in rotation.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
              Active Students
            </p>
            <p className="mt-2 text-3xl font-semibold text-[var(--c-1f1f1d)]">
              {activeStudents.length}
            </p>
            <p className="mt-1 text-sm text-[var(--c-6f6c65)]">
              Across all studio teachers.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
              Lessons This Week
            </p>
            <p className="mt-2 text-3xl font-semibold text-[var(--c-1f1f1d)]">
              {lessonsThisWeek}
            </p>
            <p className="mt-1 text-sm text-[var(--c-6f6c65)]">
              Scheduled on the studio calendar.
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <div
            className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm"
            id="teachers"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                Studio Teachers
              </p>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                {teacherRoster.length} total
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {teacherRoster.map(teacher => {
                const studentCount = activeStudents.filter(
                  student => student.teacher === teacher.username,
                ).length;
                const isOwner = teacher.id === studio.adminTeacherId;
                return (
                  <div
                    key={teacher.id}
                    className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-lg font-semibold text-[var(--c-1f1f1d)]">
                          {teacher.name}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                          {teacher.region ?? 'Region'} · {teacher.status ?? 'Licensed'}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${
                          isOwner
                            ? 'bg-[var(--c-e7eddc)] text-[var(--c-3f4a2c)]'
                            : 'bg-[var(--c-e6eef8)] text-[var(--c-28527a)]'
                        }`}
                      >
                        {isOwner ? 'Owner' : 'Teacher'}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-[var(--c-6f6c65)]">
                      {studentCount} active students · {teacher.email}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                        {teacher.studioRole ?? 'Teacher'}
                      </span>
                      <span className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                        Active
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm"
            id="schedule"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                Studio Schedule
              </p>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                Next lessons
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {upcomingLessons.length ? (
                upcomingLessons.map(lesson => (
                  <div
                    key={lesson.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                        {lesson.name}
                      </p>
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                        {lesson.lessonDay ?? 'Day TBD'} · {lesson.lessonTime ?? 'Time TBD'}
                      </p>
                    </div>
                    <span className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                      {lesson.teacher}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--c-6f6c65)]">
                  No lessons scheduled yet.
                </p>
              )}
            </div>
          </div>

          <div
            className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm"
            id="students"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                Student Pulse
              </p>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                Active roster
              </span>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                  Active Students
                </p>
                <p className="mt-2 text-3xl font-semibold text-[var(--c-1f1f1d)]">
                  {activeStudents.length}
                </p>
                <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                  92% on track with practice goals.
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                  Families Engaged
                </p>
                <p className="mt-2 text-3xl font-semibold text-[var(--c-1f1f1d)]">
                  {Math.max(4, Math.round(activeStudents.length / 3))}
                </p>
                <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                  Weekly check-ins in progress.
                </p>
              </div>
            </div>
          </div>

          <div
            className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm"
            id="billing"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                Studio Billing
              </p>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                February outlook
              </span>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                  Estimated Royalty
                </p>
                <p className="mt-2 text-3xl font-semibold text-[var(--c-1f1f1d)]">
                  ${(activeStudents.length * 9).toLocaleString('en-US')}
                </p>
                <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                  Based on active student count.
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                  Invoices Due
                </p>
                <p className="mt-2 text-3xl font-semibold text-[var(--c-1f1f1d)]">
                  {Math.max(1, Math.round(activeStudents.length / 12))}
                </p>
                <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                  Follow up with families this week.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6" id="settings">
          <div className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
              Studio Focus
            </p>
            <p className="mt-3 text-2xl font-semibold text-[var(--c-1f1f1d)]">
              Next 30 Days
            </p>
            <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
              Strengthen onboarding, launch new recital planning, and balance
              teaching schedules across the team.
            </p>
            <div className="mt-4 space-y-3">
              {[
                'Finalize the spring recital roster',
                'Rotate lesson prep templates across teachers',
                'Reach out to 6 families for progress check-ins',
              ].map(item => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3 text-sm"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--c-e7eddc)] text-xs font-semibold text-[var(--c-3f4a2c)]">
                    ✓
                  </span>
                  <span className="text-[var(--c-3a3935)]">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
              Studio Ownership
            </p>
            <p className="mt-3 text-lg font-semibold text-[var(--c-1f1f1d)]">
              {adminTeacher?.name ?? 'Owner TBD'}
            </p>
            <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
              The company assigns ownership to one teacher in the studio.
            </p>
            <div className="mt-4 rounded-2xl border border-[var(--c-e5e3dd)] bg-[var(--c-fcfcfb)] px-4 py-3 text-xs text-[var(--c-6f6c65)]">
              {viewerRole === 'company'
                ? 'Select a new owner when leadership shifts.'
                : 'Contact Simply Music to update studio ownership.'}
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
              Studio Notes
            </p>
            <p className="mt-3 text-sm text-[var(--c-6f6c65)]">
              {studio.name} launched{' '}
              {studio.createdAt
                ? new Date(studio.createdAt).toLocaleDateString('en-US')
                : 'recently'}.
            </p>
            <div className="mt-4 space-y-2">
              {[
                'Highlight duet opportunities for spring.',
                'Share new practice hub walkthrough with teachers.',
                'Confirm new teacher onboarding checklist.',
              ].map(note => (
                <div
                  key={note}
                  className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3 text-sm text-[var(--c-3a3935)]"
                >
                  {note}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
