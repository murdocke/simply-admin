'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  VIEW_ROLE_STORAGE_KEY,
  VIEW_TEACHER_STORAGE_KEY,
} from '../../components/auth';
import lessonTypes from './lesson-data/lesson-types.json';
import lessonSections from './lesson-data/lesson-sections.json';
import lessonMaterials from './lesson-data/lesson-materials.json';
import lessonParts from './lesson-data/lesson-parts.json';

type StudentRecord = {
  id: string;
  teacher: string;
  name: string;
  email: string;
  level: string;
  status: 'Active' | 'Paused';
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

const normalizeStudentLevel = (level: string) => {
  if (level.startsWith('Level ')) return level;
  if (level === 'Beginner') return 'Level 1';
  if (level === 'Intermediate') return 'Level 3';
  if (level === 'Advanced') return 'Level 5';
  return level;
};

const defaultForm = {
  name: '',
  email: '',
  level: 'Level 1',
  status: 'Active' as const,
  lessonFeeAmount: '',
  lessonFeePeriod: 'Per Mo' as const,
  lessonDay: '',
  lessonTime: '',
  lessonDuration: '30M' as const,
  lessonType: 'Individual' as const,
  lessonLocation: 'In-Person' as const,
  lessonNotes: '',
  studentAlert: '',
};

export default function TeacherStudentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [teacherName, setTeacherName] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [viewRole, setViewRole] = useState<string | null>(null);
  const [teacherLabel, setTeacherLabel] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<StudentRecord | null>(null);
  const [formState, setFormState] = useState(defaultForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null,
  );
  const [recentSelectedIds, setRecentSelectedIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [sortKey, setSortKey] = useState<'name' | 'email' | 'level' | 'status'>(
    'name',
  );
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    title: '',
    date: '',
    time: '',
    duration: '30',
    type: '',
    material: '',
    part: '',
    focus: 'Technique',
    notes: '',
    resources: '',
  });
  const [lessonPlanItems, setLessonPlanItems] = useState<
    { title: string; section: string; material: string; part: string }[]
  >([]);
  const [isPlanCollapsed, setIsPlanCollapsed] = useState(false);

  const timePickerMinutes = useMemo(() => ['00', '15', '30', '45'], []);
  const timePickerHours = useMemo(
    () => Array.from({ length: 12 }, (_, index) => String(index + 1)),
    [],
  );
  const timePickerPeriods = useMemo(() => ['AM', 'PM'], []);

  const selectedStudentKey = useMemo(() => {
    if (!teacherName) return null;
    return userName
      ? `sm_selected_student:${userName}:${teacherName}`
      : `sm_selected_student:${teacherName}`;
  }, [teacherName, userName]);
  const legacySelectedStudentKey = useMemo(() => {
    if (!teacherName) return null;
    return `sm_selected_student:${teacherName}`;
  }, [teacherName]);
  const recentSelectedKey = useMemo(() => {
    if (!teacherName) return null;
    return userName
      ? `sm_recent_selected_students:${userName}:${teacherName}`
      : `sm_recent_selected_students:${teacherName}`;
  }, [teacherName, userName]);
  const legacyRecentSelectedKey = useMemo(() => {
    if (!teacherName) return null;
    return `sm_recent_selected_students:${teacherName}`;
  }, [teacherName]);

  useEffect(() => {
    const stored = window.localStorage.getItem('sm_user');
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as { username?: string; role?: string };
      if (parsed?.username) setUserName(parsed.username);
      if (parsed?.role) setRole(parsed.role);
      if (parsed?.role === 'company') {
        const storedView = window.localStorage.getItem(VIEW_ROLE_STORAGE_KEY);
        if (storedView) setViewRole(storedView);
        const viewTeacherKey = parsed?.username
          ? `${VIEW_TEACHER_STORAGE_KEY}:${parsed.username}`
          : VIEW_TEACHER_STORAGE_KEY;
        const storedTeacher =
          window.localStorage.getItem(viewTeacherKey) ??
          window.localStorage.getItem(VIEW_TEACHER_STORAGE_KEY);
        if (storedView === 'teacher' && storedTeacher) {
          try {
            const selected = JSON.parse(storedTeacher) as {
              username?: string;
              name?: string;
            };
            if (selected?.username) {
              setTeacherName(selected.username);
              setTeacherLabel(selected.name ?? selected.username);
              window.localStorage.setItem(viewTeacherKey, storedTeacher);
              return;
            }
          } catch {
            setTeacherName(null);
            setTeacherLabel(null);
          }
        }
      }
      if (parsed?.username) {
        setTeacherName(parsed.username);
        setTeacherLabel(parsed.username);
      }
    } catch {
      setTeacherName(null);
      setTeacherLabel(null);
      setUserName(null);
      setRole(null);
      setViewRole(null);
    }
  }, []);

  useEffect(() => {
    if (!selectedStudentKey) {
      setSelectedStudentId(null);
      return;
    }
    const stored = window.localStorage.getItem(selectedStudentKey);
    if (stored) {
      setSelectedStudentId(stored);
      return;
    }
    if (legacySelectedStudentKey) {
      const legacyStored = window.localStorage.getItem(legacySelectedStudentKey);
      if (legacyStored) {
        setSelectedStudentId(legacyStored);
        window.localStorage.setItem(selectedStudentKey, legacyStored);
        if (legacySelectedStudentKey !== selectedStudentKey) {
          window.localStorage.removeItem(legacySelectedStudentKey);
        }
        return;
      }
    }
    setSelectedStudentId(null);
  }, [legacySelectedStudentKey, selectedStudentKey]);

  useEffect(() => {
    if (!recentSelectedKey) {
      setRecentSelectedIds([]);
      return;
    }
    const stored = window.localStorage.getItem(recentSelectedKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as string[];
        if (Array.isArray(parsed)) {
          setRecentSelectedIds(parsed.filter(Boolean).slice(0, 3));
          return;
        }
      } catch {
        setRecentSelectedIds([]);
        return;
      }
    }
    if (legacyRecentSelectedKey) {
      const legacyStored = window.localStorage.getItem(legacyRecentSelectedKey);
      if (legacyStored) {
        try {
          const parsed = JSON.parse(legacyStored) as string[];
          if (Array.isArray(parsed)) {
            const next = parsed.filter(Boolean).slice(0, 3);
            setRecentSelectedIds(next);
            window.localStorage.setItem(
              recentSelectedKey,
              JSON.stringify(next),
            );
            if (legacyRecentSelectedKey !== recentSelectedKey) {
              window.localStorage.removeItem(legacyRecentSelectedKey);
            }
            return;
          }
        } catch {
          setRecentSelectedIds([]);
        }
      }
    }
    setRecentSelectedIds([]);
  }, [legacyRecentSelectedKey, recentSelectedKey]);

  useEffect(() => {
    const handleTeacherChange = () => {
      setSelectedStudentId(null);
      if (selectedStudentKey) {
        window.localStorage.removeItem(selectedStudentKey);
      }
      if (legacySelectedStudentKey) {
        window.localStorage.removeItem(legacySelectedStudentKey);
      }
      if (recentSelectedKey) {
        window.localStorage.removeItem(recentSelectedKey);
      }
      if (legacyRecentSelectedKey) {
        window.localStorage.removeItem(legacyRecentSelectedKey);
      }
      setRecentSelectedIds([]);
      setStudentSearch('');
    };
    window.addEventListener('sm-view-teacher-updated', handleTeacherChange);
    return () => {
      window.removeEventListener('sm-view-teacher-updated', handleTeacherChange);
    };
  }, [
    legacyRecentSelectedKey,
    legacySelectedStudentKey,
    recentSelectedKey,
    selectedStudentKey,
  ]);

  useEffect(() => {
    if (!teacherName) return;
    let isActive = true;
    const fetchStudents = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/students?teacher=${encodeURIComponent(teacherName)}`,
        );
        const data = (await response.json()) as { students: StudentRecord[] };
        if (isActive) {
          setStudents(data.students ?? []);
        }
      } catch {
        if (isActive) setError('Unable to load students right now.');
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    fetchStudents();
    return () => {
      isActive = false;
    };
  }, [teacherName]);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      openCreateModal();
      router.replace('/teachers/students', { scroll: false });
    }
  }, [searchParams, router]);

  const rosterCount = useMemo(() => students.length, [students.length]);
  const needsTeacherSelection =
    role === 'company' && viewRole === 'teacher' && !teacherName;

  const openCreateModal = () => {
    setEditing(null);
    setFormState(defaultForm);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (student: StudentRecord) => {
    setEditing(student);
    setFormState({
      name: student.name,
      email: student.email,
      level: normalizeStudentLevel(student.level),
      status: student.status,
      lessonFeeAmount: student.lessonFeeAmount ?? '',
      lessonFeePeriod: student.lessonFeePeriod ?? 'Per Mo',
      lessonDay: student.lessonDay ?? '',
      lessonTime: student.lessonTime ?? '',
      lessonDuration: student.lessonDuration ?? '30M',
      lessonType: student.lessonType ?? 'Individual',
      lessonLocation: student.lessonLocation ?? 'In-Person',
      lessonNotes: student.lessonNotes ?? '',
      studentAlert: student.studentAlert ?? '',
    });
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setEditing(null);
  };

  const openAssignModal = () => {
    setAssignForm({
      title: '',
      date: '',
      time: '',
      duration: '30',
      type: '',
      material: '',
      part: '',
      focus: 'Technique',
      notes: '',
      resources: '',
    });
    setLessonPlanItems([]);
    setIsPlanCollapsed(false);
    setIsAssignModalOpen(true);
  };

  const closeAssignModal = () => {
    setIsAssignModalOpen(false);
  };

  const handleAddToLessonPlan = () => {
    const requiresPart = lessonPartOptions.length > 0;
    if (!assignForm.title || !assignForm.type || !assignForm.material) {
      return;
    }
    if (requiresPart && !assignForm.part) {
      return;
    }
    if (
      lessonPlanItems.some(item =>
        requiresPart
          ? item.material === assignForm.material &&
            item.part === assignForm.part
          : item.material === assignForm.material,
      )
    ) {
      return;
    }
    const nextItems = [
      ...lessonPlanItems,
      {
        title: assignForm.title,
        section: assignForm.type,
        material: assignForm.material,
        part: requiresPart ? assignForm.part : '',
      },
    ];
    setLessonPlanItems(nextItems);
    const partsForMaterial = new Set(
      nextItems
        .filter(item => item.material === assignForm.material)
        .map(item => item.part),
    );
    if (
      lessonPartOptions.length > 0 &&
      partsForMaterial.size >= lessonPartOptions.length
    ) {
      setAssignForm(current => ({
        ...current,
        title: '',
        type: '',
        material: '',
        part: '',
      }));
      return;
    }

    if (lessonPartOptions.length > 0) {
      const nextAvailablePart = lessonPartOptions.find(
        part => !partsForMaterial.has(part),
      );
      if (nextAvailablePart) {
        setAssignForm(current => ({
          ...current,
          part: nextAvailablePart,
        }));
      } else {
        setAssignForm(current => ({
          ...current,
          part: '',
        }));
      }
    } else {
      setAssignForm(current => ({
        ...current,
        material: '',
        part: '',
      }));
    }
  };

  const handleLessonPlanReset = () => {
    setAssignForm(current => ({
      ...current,
      title: '',
      type: '',
      material: '',
      part: '',
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!teacherName) {
      setError(
        needsTeacherSelection
          ? 'Choose a teacher in the sidebar to manage students.'
          : 'Please log in as a teacher to add or edit students.',
      );
      return;
    }
    setIsSaving(true);
    setError(null);

    try {
      const payload = {
        teacher: teacherName,
        name: formState.name.trim(),
        email: formState.email.trim(),
        level: formState.level,
        status: formState.status,
        lessonFeeAmount: formState.lessonFeeAmount.trim(),
        lessonFeePeriod: formState.lessonFeePeriod,
        lessonDay: formState.lessonDay,
        lessonTime: formState.lessonTime,
        lessonDuration: formState.lessonDuration,
        lessonType: formState.lessonType,
        lessonLocation: formState.lessonLocation,
        lessonNotes: formState.lessonNotes.trim(),
        studentAlert: formState.studentAlert.trim(),
      };

      if (!payload.name) {
        setError('Student name is required.');
        setIsSaving(false);
        return;
      }

      const response = await fetch(
        editing ? `/api/students/${editing.id}` : '/api/students',
        {
          method: editing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        throw new Error('Request failed');
      }

      const data = (await response.json()) as { student: StudentRecord };
      if (editing) {
        setStudents(current =>
          current.map(student =>
            student.id === data.student.id ? data.student : student,
          ),
        );
      } else {
        setStudents(current => [data.student, ...current]);
      }
      setIsModalOpen(false);
      setEditing(null);
      setFormState(defaultForm);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (student: StudentRecord) => {
    const teacher = teacherName ?? student.teacher;
    if (!teacher) return;
    const confirmed = window.confirm(
      `Remove ${student.name} from your roster?`,
    );
    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/students/${student.id}?teacher=${encodeURIComponent(teacher)}`,
        {
          method: 'DELETE',
        },
      );

      if (!response.ok) {
        throw new Error('Request failed');
      }

      setStudents(current =>
        current.filter(currentStudent => currentStudent.id !== student.id),
      );
    } catch {
      setError('Unable to delete that student right now.');
    }
  };

  const handleStudentSelect = (studentId: string) => {
    const nextSelection = selectedStudentId === studentId ? null : studentId;
    setSelectedStudentId(nextSelection);
    if (selectedStudentKey) {
      if (nextSelection) {
        window.localStorage.setItem(selectedStudentKey, nextSelection);
      } else {
        window.localStorage.removeItem(selectedStudentKey);
      }
    }
    if (legacySelectedStudentKey && legacySelectedStudentKey !== selectedStudentKey) {
      window.localStorage.removeItem(legacySelectedStudentKey);
    }

    if (recentSelectedKey && nextSelection) {
      setRecentSelectedIds(current => {
        const next = [
          nextSelection,
          ...current.filter(id => id !== nextSelection),
        ].slice(0, 3);
        window.localStorage.setItem(recentSelectedKey, JSON.stringify(next));
        return next;
      });
    }
    if (recentSelectedKey && !nextSelection) {
      setRecentSelectedIds(current => {
        const next = current.filter(id => id !== studentId);
        window.localStorage.setItem(recentSelectedKey, JSON.stringify(next));
        return next;
      });
    }
    if (legacyRecentSelectedKey && legacyRecentSelectedKey !== recentSelectedKey) {
      window.localStorage.removeItem(legacyRecentSelectedKey);
    }
  };

  const recentStudents = useMemo(() => {
    return [...students]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 8);
  }, [students]);

  const filteredStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();
    if (query) {
      return students.filter(student =>
        `${student.name} ${student.email}`.toLowerCase().includes(query),
      );
    }

    return students;
  }, [studentSearch, students]);

  const sortedStudents = useMemo(() => {
    const direction = sortDirection === 'asc' ? 1 : -1;
    const getLevelValue = (level: string) => {
      const normalized = normalizeStudentLevel(level);
      const match = normalized.match(/\d+/);
      return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
    };
    const getStatusValue = (status: StudentRecord['status']) =>
      status === 'Active' ? 0 : 1;

    return [...filteredStudents].sort((a, b) => {
      let result = 0;
      if (sortKey === 'name') {
        result = a.name.localeCompare(b.name);
      } else if (sortKey === 'email') {
        result = (a.email ?? '').localeCompare(b.email ?? '');
      } else if (sortKey === 'level') {
        result = getLevelValue(a.level) - getLevelValue(b.level);
      } else if (sortKey === 'status') {
        result = getStatusValue(a.status) - getStatusValue(b.status);
      }
      if (result === 0) {
        result = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return result * direction;
    });
  }, [filteredStudents, sortDirection, sortKey]);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(sortedStudents.length / pageSize));
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedStudents.slice(startIndex, startIndex + pageSize);
  }, [currentPage, pageSize, sortedStudents]);

  useEffect(() => {
    setCurrentPage(1);
  }, [studentSearch, sortDirection, sortKey, students.length]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const recentSelectedStudents = useMemo(() => {
    const byId = new Map(students.map(student => [student.id, student]));
    return recentSelectedIds
      .map(id => byId.get(id))
      .filter((student): student is StudentRecord => Boolean(student))
      .slice(0, 3);
  }, [recentSelectedIds, students]);

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDirection(current => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDirection('asc');
  };

  const parseLessonTime = (value: string) => {
    const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) {
      return { hour: '1', minute: '00', period: 'AM' };
    }
    const [, hour, minute, period] = match;
    return {
      hour: String(Number(hour)),
      minute,
      period: period.toUpperCase() as 'AM' | 'PM',
    };
  };

  const LessonTimePicker = ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (next: string) => void;
  }) => {
    const parsed = parseLessonTime(value || '1:00 AM');
    const updateTime = (
      nextHour: string,
      nextMinute: string,
      nextPeriod: string,
    ) => {
      onChange(`${nextHour}:${nextMinute} ${nextPeriod}`);
    };

    return (
      <div className="mt-2 grid grid-cols-3 gap-2">
        <div className="relative">
          <select
            value={parsed.hour}
            onChange={event =>
              updateTime(event.target.value, parsed.minute, parsed.period)
            }
            className="w-full appearance-none rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 pr-10 text-sm text-[var(--c-1f1f1d)]"
          >
            {timePickerHours.map(hour => (
              <option key={hour} value={hour}>
                {hour}
              </option>
            ))}
          </select>
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute right-[18px] top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--c-6f6c65)]"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="relative">
          <select
            value={parsed.minute}
            onChange={event =>
              updateTime(parsed.hour, event.target.value, parsed.period)
            }
            className="w-full appearance-none rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 pr-10 text-sm text-[var(--c-1f1f1d)]"
          >
            {timePickerMinutes.map(minute => (
              <option key={minute} value={minute}>
                {minute}
              </option>
            ))}
          </select>
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute right-[18px] top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--c-6f6c65)]"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="relative">
          <select
            value={parsed.period}
            onChange={event =>
              updateTime(parsed.hour, parsed.minute, event.target.value)
            }
            className="w-full appearance-none rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 pr-10 text-sm text-[var(--c-1f1f1d)]"
          >
            {timePickerPeriods.map(period => (
              <option key={period} value={period}>
                {period}
              </option>
            ))}
          </select>
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute right-[18px] top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--c-6f6c65)]"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    );
  };

  const lessonSectionOptions = useMemo(() => {
    if (!assignForm.title) return [];
    return (lessonSections as Record<string, string[]>)[assignForm.title] ?? [];
  }, [assignForm.title]);

  const lessonMaterialOptions = useMemo(() => {
    if (!assignForm.type) return [];
    const key = `${assignForm.title}|${assignForm.type}`;
    return (
      (lessonMaterials as Record<string, string[]>)[key] ?? [
        `${assignForm.type} - Lesson A`,
        `${assignForm.type} - Lesson B`,
        `${assignForm.type} - Lesson C`,
      ]
    );
  }, [assignForm.title, assignForm.type]);

  const availableLessonMaterials = useMemo(() => {
    const partsMap = lessonParts as Record<string, string[]>;
    return lessonMaterialOptions.filter(material => {
      const hasParts = Object.keys(partsMap).some(prefix =>
        material.startsWith(prefix),
      );
      if (hasParts) return true;
      return !lessonPlanItems.some(item => item.material === material);
    });
  }, [lessonMaterialOptions, lessonPlanItems]);

  const lessonPartOptions = useMemo(() => {
    if (!assignForm.material) return [];
    const partsMap = lessonParts as Record<string, string[]>;
    const matchedKey = Object.keys(partsMap).find(prefix =>
      assignForm.material.startsWith(prefix),
    );
    if (matchedKey) return partsMap[matchedKey] ?? [];
    return [];
  }, [assignForm.material]);

  const availableLessonParts = useMemo(() => {
    if (!assignForm.material) return lessonPartOptions;
    const usedParts = new Set(
      lessonPlanItems
        .filter(item => item.material === assignForm.material)
        .map(item => item.part),
    );
    return lessonPartOptions.filter(part => !usedParts.has(part));
  }, [assignForm.material, lessonPartOptions, lessonPlanItems]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
            Teachers
          </p>
          <h1 className="text-3xl font-semibold text-[var(--c-1f1f1d)] mt-2">
            Students
          </h1>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            Manage your studio roster, lesson readiness, and status updates.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/teachers/lesson-fees"
            className="rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)] transition hover:brightness-110"
          >
            Lesson Fees
          </Link>
          <button
            onClick={openCreateModal}
            className="rounded-full bg-[var(--c-c8102e)] px-5 py-2 text-xs uppercase tracking-[0.2em] text-white transition hover:brightness-110"
          >
            Add Student
          </button>
        </div>
      </header>

      {needsTeacherSelection ? (
        <div className="rounded-2xl border border-[var(--c-f2d7db)] bg-[var(--c-fff5f6)] px-4 py-3 text-sm text-[var(--c-8f2f3b)]">
          Choose a teacher in the sidebar to view and manage students.
        </div>
      ) : null}

      <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
              Active Roster
            </p>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
              {rosterCount} students{teacherLabel ? ` • ${teacherLabel}` : ''}
            </p>
          </div>
          {error ? (
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
              {error}
            </p>
          ) : null}
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {recentSelectedStudents.length === 0 ? (
            <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-4 text-sm text-[var(--c-6f6c65)] md:col-span-3">
              No students selected yet. Choose a student to pin them here.
            </div>
          ) : (
            recentSelectedStudents.map((student, index) => (
              <div
                key={student.id}
                className={`rounded-2xl border px-4 py-4 ${
                  index === 0
                    ? 'border-[var(--sidebar-selected-border)] bg-[var(--sidebar-selected-bg)] shadow-sm'
                    : 'border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                    {index === 0 ? 'Current selection' : 'Recently selected'}
                  </p>
                  {index === 0 ? (
                    <div className="flex items-center gap-2">
                      <button
                        className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--sidebar-selected-text)] transition hover:bg-white/20"
                        type="button"
                        onClick={openAssignModal}
                      >
                        Assign Lesson
                      </button>
                      <button
                        className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--sidebar-selected-text)] transition hover:bg-white/20"
                        type="button"
                      >
                        Practice Log
                      </button>
                    </div>
                  ) : null}
                </div>
                <p
                  className={`mt-2 text-sm font-semibold ${
                    index === 0
                      ? 'text-[var(--sidebar-selected-text)]'
                      : 'text-[var(--c-1f1f1d)]'
                  }`}
                >
                  {student.name}
                </p>
                <p
                  className={`mt-1 text-xs ${
                    index === 0
                      ? 'text-[var(--sidebar-selected-text)]/80'
                      : 'text-[var(--c-6f6c65)]'
                  }`}
                >
                  {student.email || '—'}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
            Search Students
            <input
              value={studentSearch}
              onChange={event => setStudentSearch(event.target.value)}
              list="student-directory"
              placeholder="Search by name or email..."
              className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-2 text-sm text-[var(--c-1f1f1d)] outline-none focus:border-[var(--c-c8102e)] sm:min-w-[280px]"
            />
            <datalist id="student-directory">
              {students.map(student => (
                <option
                  key={student.id}
                  value={`${student.name} ${student.email ?? ''}`.trim()}
                />
              ))}
            </datalist>
          </label>
          {studentSearch ? (
            <button
              onClick={() => setStudentSearch('')}
              className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
            >
              Clear Search
            </button>
          ) : null}
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--c-ecebe7)]">
          <div className="grid grid-cols-12 gap-2 bg-[var(--c-f7f7f5)] px-4 py-3 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
            <div className="col-span-1 text-center">Select</div>
            <button
              type="button"
              onClick={() => handleSort('name')}
              className="col-span-3 flex items-center gap-2 text-left"
              aria-sort={sortKey === 'name' ? sortDirection : 'none'}
            >
              Student{sortKey === 'name' ? (sortDirection === 'asc' ? ' ^' : ' v') : ''}
            </button>
            <button
              type="button"
              onClick={() => handleSort('email')}
              className="col-span-3 flex items-center gap-2 text-left"
              aria-sort={sortKey === 'email' ? sortDirection : 'none'}
            >
              Email{sortKey === 'email' ? (sortDirection === 'asc' ? ' ^' : ' v') : ''}
            </button>
            <button
              type="button"
              onClick={() => handleSort('level')}
              className="col-span-2 flex items-center gap-2 text-left"
              aria-sort={sortKey === 'level' ? sortDirection : 'none'}
            >
              Level{sortKey === 'level' ? (sortDirection === 'asc' ? ' ^' : ' v') : ''}
            </button>
            <button
              type="button"
              onClick={() => handleSort('status')}
              className="col-span-2 flex items-center gap-2 text-left"
              aria-sort={sortKey === 'status' ? sortDirection : 'none'}
            >
              Status{sortKey === 'status' ? (sortDirection === 'asc' ? ' ^' : ' v') : ''}
            </button>
            <div className="col-span-1 text-right">Actions</div>
          </div>
          <div className="divide-y divide-[var(--c-ecebe7)]">
            {isLoading ? (
              <div className="px-4 py-6 text-sm text-[var(--c-6f6c65)]">
                Loading roster...
              </div>
            ) : sortedStudents.length === 0 ? (
              <div className="px-4 py-6 text-sm text-[var(--c-6f6c65)]">
                {studentSearch
                  ? 'No matches yet. Try a different search.'
                  : 'No students yet. Add your first student to get started.'}
              </div>
            ) : (
              paginatedStudents.map(student => {
                const isSelected = selectedStudentId === student.id;
                return (
                <div
                  key={student.id}
                  className="grid grid-cols-12 items-center gap-2 px-4 py-4 text-sm"
                >
                  <div className="col-span-1 flex justify-center">
                    <button
                      onClick={() => handleStudentSelect(student.id)}
                      className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.2em] transition ${
                        isSelected
                          ? 'border-[var(--sidebar-selected-border)] bg-[var(--sidebar-selected-bg)] text-[var(--sidebar-selected-text)]'
                          : 'border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] text-[var(--c-6f6c65)] hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]'
                      }`}
                      aria-pressed={isSelected}
                      aria-label={
                        isSelected
                          ? `Clear ${student.name} selection`
                          : `Select ${student.name}`
                      }
                    >
                      {isSelected ? 'Selected' : 'Select'}
                    </button>
                  </div>
                  <div className="col-span-3">
                    <p className="font-medium text-[var(--c-1f1f1d)]">
                      {student.name}
                    </p>
                    <p className="text-xs text-[var(--c-9a9892)]">
                      Added {new Date(student.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="col-span-3 text-[var(--c-6f6c65)]">
                    {student.email || '—'}
                  </div>
                  <div className="col-span-2">
                    <span className="rounded-full border border-[var(--c-e5e3dd)] px-3 py-1 text-xs text-[var(--c-6f6c65)]">
                      {normalizeStudentLevel(student.level)}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        student.status === 'Active'
                          ? 'bg-[var(--c-e7eddc)] text-[var(--c-3f4a2c)]'
                          : 'bg-[var(--c-fce8d6)] text-[var(--c-8a5b2b)]'
                      }`}
                    >
                      {student.status}
                    </span>
                  </div>
                  <div className="col-span-1 flex justify-end gap-2">
                    <button
                      className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
                      onClick={() => openEditModal(student)}
                    >
                      Edit
                    </button>
                    <button
                      className="rounded-full border border-[var(--c-f2d7db)] bg-[var(--c-fff5f6)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-8f2f3b)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
                      onClick={() => handleDelete(student)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
          <p>
            {sortedStudents.length === 0
              ? '0 students'
              : `Showing ${Math.min(
                  (currentPage - 1) * pageSize + 1,
                  sortedStudents.length,
                )}-${Math.min(currentPage * pageSize, sortedStudents.length)} of ${
                  sortedStudents.length
                }`}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Prev
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
              className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative w-full max-w-xl rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                  Teachers
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                  {editing ? 'Edit Student' : 'Add Student'}
                </h2>
                <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                  {editing
                    ? 'Update roster details for this student.'
                    : 'Add a new student to your studio roster.'}
                </p>
              </div>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  Name
                  <input
                    type="text"
                    value={formState.name}
                    onChange={event =>
                      setFormState(current => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                    placeholder="Student name"
                  />
                </label>
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  Email
                  <input
                    type="email"
                    value={formState.email}
                    onChange={event =>
                      setFormState(current => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                    placeholder="student@email.com"
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  Level
                  <div className="relative">
                    <select
                      value={formState.level}
                      onChange={event =>
                        setFormState(current => ({
                          ...current,
                          level: event.target.value,
                        }))
                      }
                      className="mt-2 w-full appearance-none rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 pr-12 text-sm text-[var(--c-1f1f1d)]"
                    >
                      {Array.from({ length: 18 }, (_, index) => {
                        const level = `Level ${index + 1}`;
                        return (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        );
                      })}
                    </select>
                    <svg
                      aria-hidden="true"
                      className="pointer-events-none absolute right-[22px] top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--c-6f6c65)]"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </label>
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  Status
                  <div className="relative">
                    <select
                      value={formState.status}
                      onChange={event =>
                        setFormState(current => ({
                          ...current,
                          status: event.target.value as 'Active' | 'Paused',
                        }))
                      }
                      className="mt-2 w-full appearance-none rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 pr-12 text-sm text-[var(--c-1f1f1d)]"
                    >
                      <option value="Active">Active</option>
                      <option value="Paused">Paused</option>
                    </select>
                    <svg
                      aria-hidden="true"
                      className="pointer-events-none absolute right-[22px] top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--c-6f6c65)]"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  Lesson Fee
                  <div className="mt-2 grid grid-cols-[minmax(0,1fr)_minmax(0,120px)] gap-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formState.lessonFeeAmount ?? ''}
                      onChange={event =>
                        setFormState(current => ({
                          ...current,
                          lessonFeeAmount: event.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                    />
                    <div className="relative">
                      <select
                        value={formState.lessonFeePeriod}
                        onChange={event =>
                          setFormState(current => ({
                            ...current,
                            lessonFeePeriod: event.target
                              .value as typeof formState.lessonFeePeriod,
                          }))
                        }
                        className="w-full appearance-none rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 pr-10 text-sm text-[var(--c-1f1f1d)]"
                      >
                        <option value="Per Mo">Per Mo</option>
                        <option value="Per Qtr">Per Qtr</option>
                        <option value="Per Yr">Per Yr</option>
                      </select>
                      <svg
                        aria-hidden="true"
                        className="pointer-events-none absolute right-[18px] top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--c-6f6c65)]"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                </label>
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  Day Of Lesson
                  <div className="relative">
                    <select
                      value={formState.lessonDay}
                      onChange={event =>
                        setFormState(current => ({
                          ...current,
                          lessonDay: event.target.value,
                        }))
                      }
                      className="mt-2 w-full appearance-none rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 pr-12 text-sm text-[var(--c-1f1f1d)]"
                    >
                      <option value="">Select day</option>
                      {[
                        'Monday',
                        'Tuesday',
                        'Wednesday',
                        'Thursday',
                        'Friday',
                        'Saturday',
                        'Sunday',
                      ].map(day => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                    <svg
                      aria-hidden="true"
                      className="pointer-events-none absolute right-[22px] top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--c-6f6c65)]"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  Lesson Time
                  <LessonTimePicker
                    value={formState.lessonTime}
                    onChange={next =>
                      setFormState(current => ({
                        ...current,
                        lessonTime: next,
                      }))
                    }
                  />
                </label>
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  Lesson Duration
                  <div className="relative">
                    <select
                      value={formState.lessonDuration}
                      onChange={event =>
                        setFormState(current => ({
                          ...current,
                          lessonDuration: event.target
                            .value as typeof formState.lessonDuration,
                        }))
                      }
                      className="mt-2 w-full appearance-none rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 pr-12 text-sm text-[var(--c-1f1f1d)]"
                    >
                      <option value="30M">30M</option>
                      <option value="45M">45M</option>
                      <option value="1HR">1HR</option>
                    </select>
                    <svg
                      aria-hidden="true"
                      className="pointer-events-none absolute right-[22px] top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--c-6f6c65)]"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  Lesson Type
                  <div className="relative">
                    <select
                      value={formState.lessonType}
                      onChange={event =>
                        setFormState(current => ({
                          ...current,
                          lessonType: event.target.value as 'Individual' | 'Group',
                        }))
                      }
                      className="mt-2 w-full appearance-none rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 pr-12 text-sm text-[var(--c-1f1f1d)]"
                    >
                      <option value="Individual">Individual</option>
                      <option value="Group">Group</option>
                    </select>
                    <svg
                      aria-hidden="true"
                      className="pointer-events-none absolute right-[22px] top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--c-6f6c65)]"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </label>
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  Location
                  <div className="relative">
                    <select
                      value={formState.lessonLocation}
                      onChange={event =>
                        setFormState(current => ({
                          ...current,
                          lessonLocation: event.target
                            .value as typeof formState.lessonLocation,
                        }))
                      }
                      className="mt-2 w-full appearance-none rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 pr-12 text-sm text-[var(--c-1f1f1d)]"
                    >
                      <option value="In-Person">In-Person</option>
                      <option value="Virtual">Virtual</option>
                      <option value="Home-Visit">Home-Visit</option>
                    </select>
                    <svg
                      aria-hidden="true"
                      className="pointer-events-none absolute right-[22px] top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--c-6f6c65)]"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </label>
              </div>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Notes
                <textarea
                  value={formState.lessonNotes}
                  onChange={event =>
                    setFormState(current => ({
                      ...current,
                      lessonNotes: event.target.value,
                    }))
                  }
                  className="mt-2 min-h-[70px] w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                />
              </label>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Student Alert Message
                <textarea
                  value={formState.studentAlert}
                  onChange={event =>
                    setFormState(current => ({
                      ...current,
                      studentAlert: event.target.value,
                    }))
                  }
                  className="mt-2 min-h-[70px] w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                />
              </label>

              {error ? (
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                  {error}
                </p>
              ) : null}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full rounded-full border border-[var(--c-ecebe7)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full rounded-full bg-[var(--c-c8102e)] px-5 py-2 text-xs uppercase tracking-[0.2em] text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving
                    ? 'Saving...'
                    : editing
                      ? 'Save Changes'
                      : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isAssignModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeAssignModal}
          />
          <div className="relative w-full max-w-2xl rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                  Assign Lesson
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                  {recentSelectedStudents[0]?.name ?? 'Selected Student'}
                </h2>
                <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                  Draft a lesson plan and attach resources for this student.
                </p>
              </div>
              <button
                onClick={closeAssignModal}
                className="rounded-full border border-[var(--c-ecebe7)] px-3 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
              >
                Close
              </button>
            </div>

            <form className="mt-6 space-y-4">
              <div className="space-y-4">
                <label className="text-xs font-semibold tracking-[0.04em] text-[var(--c-6f6c65)]">
                  Choose Lesson Type
                  <div className="relative">
                    <select
                      value={assignForm.title}
                      onChange={event =>
                        setAssignForm(current => ({
                          ...current,
                          title: event.target.value,
                          type: '',
                          material: '',
                          part: '',
                        }))
                      }
                      className="mt-2 w-full appearance-none rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 pr-10 text-sm text-[var(--c-1f1f1d)]"
                    >
                      <option value="">Select a program</option>
                      {lessonTypes.map(type => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    <svg
                      aria-hidden="true"
                      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--c-6f6c65)]"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </label>

                {assignForm.title ? (
                  <label className="text-xs font-semibold tracking-[0.04em] text-[var(--c-6f6c65)]">
                    Lesson Section
                    <div className="relative">
                      <select
                        value={assignForm.type}
                        onChange={event =>
                          setAssignForm(current => ({
                            ...current,
                            type: event.target.value,
                            material: '',
                            part: '',
                          }))
                        }
                        className="mt-2 w-full appearance-none rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 pr-10 text-sm text-[var(--c-1f1f1d)]"
                      >
                        <option value="">{`Select Section - ${assignForm.title}`}</option>
                        {lessonSectionOptions.map(section => (
                          <option key={section} value={section}>
                            {section}
                          </option>
                        ))}
                      </select>
                      <svg
                        aria-hidden="true"
                        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--c-6f6c65)]"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </label>
                ) : null}

                {assignForm.type ? (
                  <label className="text-xs font-semibold tracking-[0.04em] text-[var(--c-6f6c65)]">
                    Lesson Material
                    <div className="relative">
                      <select
                        value={assignForm.material}
                        onChange={event =>
                          setAssignForm(current => ({
                            ...current,
                            material: event.target.value,
                            part: '',
                          }))
                        }
                        className="mt-2 w-full appearance-none rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 pr-10 text-sm text-[var(--c-1f1f1d)]"
                      >
                        <option value="">{`Select Material - ${assignForm.type}`}</option>
                      {availableLessonMaterials.map(material => (
                        <option key={material} value={material}>
                          {material}
                        </option>
                      ))}
                      </select>
                      <svg
                        aria-hidden="true"
                        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--c-6f6c65)]"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </label>
                ) : null}

                {assignForm.material && lessonPartOptions.length > 0 ? (
                  <label className="text-xs font-semibold tracking-[0.04em] text-[var(--c-6f6c65)]">
                    Lesson Part
                    <div className="relative">
                      <select
                        value={assignForm.part}
                        onChange={event =>
                          setAssignForm(current => ({
                            ...current,
                            part: event.target.value,
                          }))
                        }
                        className="mt-2 w-full appearance-none rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 pr-10 text-sm text-[var(--c-1f1f1d)]"
                      >
                        <option value="">{`Select Part - ${assignForm.material}`}</option>
                      {availableLessonParts.map(part => (
                        <option key={part} value={part}>
                          {part}
                        </option>
                      ))}
                      </select>
                      <svg
                        aria-hidden="true"
                        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--c-6f6c65)]"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </label>
                ) : null}

                <div className="mt-3 flex flex-col gap-3">
                  {assignForm.material &&
                  (lessonPartOptions.length === 0 || assignForm.part) ? (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <button
                        type="button"
                        onClick={handleLessonPlanReset}
                        className="rounded-2xl border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-3 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)] sm:w-auto"
                      >
                        New
                      </button>
                      <button
                        type="button"
                        onClick={handleAddToLessonPlan}
                        className="w-full rounded-2xl bg-[var(--c-3a3935)] px-4 py-3 text-xs uppercase tracking-[0.2em] text-white transition hover:brightness-110"
                      >
                        {`Add to Lesson Plan for ${
                          recentSelectedStudents[0]?.name ?? 'Student'
                        }`}
                      </button>
                    </div>
                  ) : null}

                  {lessonPlanItems.length > 0 ? (
                    <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                          Lesson Plan Items
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                              setIsPlanCollapsed(current => !current);
                          }}
                          className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
                        >
                          {isPlanCollapsed ? 'Expand' : 'Collapse'}
                        </button>
                      </div>
                      {isPlanCollapsed ? null : (
                        <div className="mt-3 space-y-2">
                          {lessonPlanItems.map((item, index) => (
                            <div
                              key={`${item.material}-${item.part}-${index}`}
                              className="flex items-start justify-between gap-3 rounded-xl border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-2 text-sm text-[var(--c-3a3935)]"
                            >
                              <div>
                                <span className="text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                                  {item.title}
                                </span>
                                <p className="mt-1 font-medium text-[var(--c-1f1f1d)]">
                                  {item.section} • {item.material}
                                  {item.part ? ` • ${item.part}` : ''}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setLessonPlanItems(current =>
                                    current.filter((_, idx) => idx !== index),
                                  )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--c-f2d7db)] bg-[var(--c-fff5f6)] text-[var(--c-8f2f3b)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
                                aria-label="Remove plan item"
                              >
                                <svg
                                  aria-hidden="true"
                                  className="h-4 w-4"
                                  viewBox="0 0 20 20"
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
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>

              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Lesson Notes
                <textarea
                  value={assignForm.notes}
                  onChange={event =>
                    setAssignForm(current => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  className="mt-2 min-h-[110px] w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                  placeholder="Outline goals, warm-ups, and homework focus."
                />
              </label>

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeAssignModal}
                  className="rounded-full border border-[var(--c-ecebe7)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-full bg-[var(--c-c8102e)] px-5 py-2 text-xs uppercase tracking-[0.2em] text-white transition hover:brightness-110"
                >
                  Assign Lesson
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
