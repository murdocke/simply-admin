'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import TimeBadge from '../components/time-badge';

const DAYS = [
  { label: 'Monday', short: 'Mon', index: 1 },
  { label: 'Tuesday', short: 'Tue', index: 2 },
  { label: 'Wednesday', short: 'Wed', index: 3 },
  { label: 'Thursday', short: 'Thu', index: 4 },
  { label: 'Friday', short: 'Fri', index: 5 },
  { label: 'Saturday', short: 'Sat', index: 6 },
  { label: 'Sunday', short: 'Sun', index: 0 },
];

const TIMEZONES = [
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'Europe/London',
  'Europe/Paris',
  'Australia/Melbourne',
  'Australia/Sydney',
  'Pacific/Auckland',
];

type MeetingType = {
  id: string;
  slug: string;
  name: string;
  location: string;
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  minNoticeMinutes: number;
  maxHorizonDays: number;
  timezoneDefault: string;
  availabilityMode: 'all' | 'busy' | 'daily_limit';
  busyBufferPercent: number;
  busyPatternVersion: number;
  dailyLimit: number;
  showSimplyMusicHeader: boolean;
  simplyMusicSubheaderText: string;
  noOvernightSlots: boolean;
  allowPublicReschedule: boolean;
  adminUsername: string;
  createdAt: string;
  updatedAt: string;
};

type ScheduleSettings = {
  adminUsername: string;
  primaryTimezone: string;
  travelModeEnabled: boolean;
  travelTimezone: string | null;
  travelStartDate: string | null;
  travelEndDate: string | null;
  globalUnavailable: boolean;
  updatedAt: string;
};

type WeeklyAvailability = {
  id: string;
  meetingTypeId: string;
  dayOfWeek: number;
  startTimeMinutes: number;
  endTimeMinutes: number;
  createdAt: string;
  updatedAt: string;
};

type WeeklyBlackout = {
  id: string;
  meetingTypeId: string;
  dayOfWeek: number;
  startTimeMinutes: number;
  endTimeMinutes: number;
  createdAt: string;
  updatedAt: string;
};

type Blackout = {
  id: string;
  meetingTypeId: string;
  startsAtUtc: string;
  endsAtUtc: string;
  allDay: boolean;
  note: string;
  createdAt: string;
  updatedAt: string;
};

type Booking = {
  id: string;
  meetingTypeId: string;
  startsAtUtc: string;
  endsAtUtc: string;
  name: string;
  email: string;
  notes: string;
  status: string;
  publicToken: string | null;
  bookingTimezone: string | null;
  zoomJoinUrl: string | null;
  zoomStartUrl: string | null;
  createdAt: string;
};

type Slot = {
  startsAtUtc: string;
  endsAtUtc: string;
  label: string;
  meetingStartLocal: string;
  isBusy?: boolean;
};

const minutesToTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0');
  const mins = Math.round(minutes % 60)
    .toString()
    .padStart(2, '0');
  return `${hours}:${mins}`;
};

const formatTimeLabel = (minutes: number) => {
  const base = new Date(Date.UTC(2020, 0, 1, 0, 0, 0));
  base.setUTCMinutes(minutes);
  return base.toLocaleTimeString('en-US', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const minutesToParts = (minutes: number) => {
  const total = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hour24 = Math.floor(total / 60);
  const minute = total % 60;
  const meridiem = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return {
    hour12,
    minute,
    meridiem,
  };
};

const partsToMinutes = (hour12: number, minute: number, meridiem: 'AM' | 'PM') => {
  const normalizedHour = hour12 % 12;
  const hour24 = meridiem === 'PM' ? normalizedHour + 12 : normalizedHour;
  return hour24 * 60 + minute;
};

const timeToMinutes = (value: string) => {
  const [hours, minutes] = value.split(':').map(Number);
  return Number.isFinite(hours) && Number.isFinite(minutes)
    ? hours * 60 + minutes
    : 0;
};

const formatDateTime = (iso: string, timeZone: string) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));

const formatTimeOnly = (iso: string, timeZone: string) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeStyle: 'short',
  }).format(new Date(iso));

const getMinutesInTimeZone = (iso: string, timeZone: string) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(iso));
  const hour = Number(parts.find(part => part.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find(part => part.type === 'minute')?.value ?? 0);
  return hour * 60 + minute;
};

const getTodayInTimeZone = (timeZone: string) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const year = parts.find(part => part.type === 'year')?.value ?? '1970';
  const month = parts.find(part => part.type === 'month')?.value ?? '01';
  const day = parts.find(part => part.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
};

const getWeekdayIndexInTimeZone = (date: string, timeZone: string) => {
  const [year, month, day] = date.split('-').map(Number);
  const sample = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
  }).format(sample);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[weekday] ?? 0;
};

const getDaysInMonth = (year: number, month: number) =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();

const formatMonthLabel = (year: number, month: number, timeZone: string) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: 'long',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, 1, 12, 0, 0)));

const buildDateRange = (start: string, end: string) => {
  const first = start <= end ? start : end;
  const last = start <= end ? end : start;
  const dates: string[] = [];
  let current = first;
  let guard = 0;
  while (current <= last && guard < 400) {
    dates.push(current);
    current = addDays(current, 1);
    guard += 1;
  }
  return dates;
};

const getWeekStart = (date: string) => {
  const [year, month, day] = date.split('-').map(Number);
  const base = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = base.getUTCDay();
  const diff = (dayOfWeek + 6) % 7;
  base.setUTCDate(base.getUTCDate() - diff);
  const yyyy = base.getUTCFullYear();
  const mm = String(base.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(base.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const addDays = (date: string, days: number) => {
  const [year, month, day] = date.split('-').map(Number);
  const base = new Date(Date.UTC(year, month - 1, day));
  base.setUTCDate(base.getUTCDate() + days);
  const yyyy = base.getUTCFullYear();
  const mm = String(base.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(base.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const formatDateLabel = (date: string, timeZone: string) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${date}T12:00:00Z`));

const toTimeZoneDate = (iso: string, timeZone: string) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(iso));
  const year = parts.find(part => part.type === 'year')?.value ?? '1970';
  const month = parts.find(part => part.type === 'month')?.value ?? '01';
  const day = parts.find(part => part.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
};

const getAdminUsername = () => {
  if (typeof window === 'undefined') return null;
  const stored = window.localStorage.getItem('sm_user');
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored) as { username?: string };
    return parsed.username ?? null;
  } catch {
    return null;
  }
};

const buildWeeklySignature = (
  items: Array<{ dayOfWeek: number; startTimeMinutes: number; endTimeMinutes: number }>,
) =>
  items
    .map(item => `${item.dayOfWeek}-${item.startTimeMinutes}-${item.endTimeMinutes}`)
    .sort()
    .join('|');

export default function SchedulePage() {
  const [adminUsername, setAdminUsername] = useState<string>('company');
  const [meetingType, setMeetingType] = useState<MeetingType | null>(null);
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([]);
  const [selectedMeetingTypeId, setSelectedMeetingTypeId] = useState<string | null>(
    null,
  );
  const [newMeetingTypeName, setNewMeetingTypeName] = useState('');
  const [availability, setAvailability] = useState<WeeklyAvailability[]>([]);
  const [weeklyBlackouts, setWeeklyBlackouts] = useState<WeeklyBlackout[]>([]);
  const [blackouts, setBlackouts] = useState<Blackout[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [scheduleSettings, setScheduleSettings] = useState<ScheduleSettings | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [blackoutForm, setBlackoutForm] = useState({
    startTime: '12:00',
    endTime: '13:00',
    allDay: false,
    note: '',
  });
  const [blackoutCalendarMonth, setBlackoutCalendarMonth] = useState({
    year: 0,
    month: 0,
  });
  const [blackoutSelectedDates, setBlackoutSelectedDates] = useState<string[]>([]);
  const [blackoutRangeAnchor, setBlackoutRangeAnchor] = useState<string | null>(null);
  const [timeModalOpen, setTimeModalOpen] = useState(false);
  const [timeModalContext, setTimeModalContext] = useState<{
    kind: 'window' | 'weeklyBlackout' | 'blackoutForm';
    id?: string;
    startMinutes: number;
    endMinutes: number;
  } | null>(null);
  const [busyPatternMessage, setBusyPatternMessage] = useState('');
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTimezone, setRescheduleTimezone] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState<Slot[]>([]);
  const [rescheduleSlotLoading, setRescheduleSlotLoading] = useState(false);
  const [rescheduleSlotError, setRescheduleSlotError] = useState('');
  const [rescheduleSelection, setRescheduleSelection] = useState<Slot | null>(null);
  const [rescheduleSaving, setRescheduleSaving] = useState(false);
  const [cancelBooking, setCancelBooking] = useState<Booking | null>(null);
  const [detectedTimeZone, setDetectedTimeZone] = useState('');
  const [deleteMeetingTypeOpen, setDeleteMeetingTypeOpen] = useState(false);
  const [weekStart, setWeekStart] = useState('');
  const [weekSlots, setWeekSlots] = useState<Record<string, Slot[]>>({});
  const [weekLoading, setWeekLoading] = useState(false);
  const [availabilitySignature, setAvailabilitySignature] = useState('');
  const [weeklyBlackoutsSignature, setWeeklyBlackoutsSignature] = useState('');

  useEffect(() => {
    const stored = getAdminUsername();
    setAdminUsername(stored || 'company');
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (detected) setDetectedTimeZone(detected);
  }, []);

  const adminHeader = useMemo(
    () => ({
      'x-sm-admin': adminUsername || 'company',
    }),
    [adminUsername],
  );

  const loadSchedule = useCallback(async () => {
    setStatus('loading');
    setError('');
    try {
      const url = new URL('/api/schedule/availability', window.location.origin);
      if (selectedMeetingTypeId) {
        url.searchParams.set('meetingTypeId', selectedMeetingTypeId);
      }
      const response = await fetch(url.toString(), {
        cache: 'no-store',
        headers: adminHeader,
      });
      const payload = (await response.json().catch(() => ({}))) as
        | {
            error?: string;
            meetingType?: MeetingType;
            meetingTypes?: MeetingType[];
            availability?: WeeklyAvailability[];
            weeklyBlackouts?: WeeklyBlackout[];
            blackouts?: Blackout[];
            bookings?: Booking[];
            scheduleSettings?: ScheduleSettings;
          }
        | undefined;
      if (!response.ok) {
        const message =
          payload?.error ||
          `Failed to load schedule settings. (${response.status})`;
        throw new Error(message);
      }
      const data = payload as {
        meetingType: MeetingType;
        meetingTypes: MeetingType[];
        availability: WeeklyAvailability[];
        weeklyBlackouts: WeeklyBlackout[];
        blackouts: Blackout[];
        bookings: Booking[];
        scheduleSettings?: ScheduleSettings;
      };
      setMeetingType(data.meetingType);
      setAvailability(data.availability ?? []);
      setWeeklyBlackouts(data.weeklyBlackouts ?? []);
      setBlackouts(data.blackouts ?? []);
      setBookings(data.bookings ?? []);
      setMeetingTypes(data.meetingTypes ?? []);
      setScheduleSettings(data.scheduleSettings ?? null);
      setAvailabilitySignature(buildWeeklySignature(data.availability ?? []));
      setWeeklyBlackoutsSignature(buildWeeklySignature(data.weeklyBlackouts ?? []));
      if (!selectedMeetingTypeId || !data.meetingTypes?.some(mt => mt.id === selectedMeetingTypeId)) {
        setSelectedMeetingTypeId(data.meetingType.id);
      }
      setStatus('ready');
      if (!weekStart) {
        const baseZone =
          data.scheduleSettings?.primaryTimezone ?? data.meetingType.timezoneDefault;
        const base = getTodayInTimeZone(baseZone);
        setWeekStart(getWeekStart(base));
      }
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unable to load schedule data.');
    }
  }, [adminHeader, selectedMeetingTypeId]);

  useEffect(() => {
    if (!adminUsername) return;
    void loadSchedule();
  }, [adminUsername, loadSchedule]);

  useEffect(() => {
    if (!meetingType) return;
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/schedule-meeting?slug=${encodeURIComponent(
      meetingType.slug,
    )}`;
    setShareUrl(url);
    if (!blackoutCalendarMonth.year) {
      const today = getTodayInTimeZone(meetingType.timezoneDefault);
      const [year, month] = today.split('-').map(Number);
      setBlackoutCalendarMonth({ year, month });
    }
  }, [meetingType]);

  const loadWeekSlots = useCallback(async () => {
    if (!meetingType || !weekStart) return;
    setWeekLoading(true);
    try {
      const url = new URL('/api/schedule/slots', window.location.origin);
      url.searchParams.set('meetingTypeId', meetingType.id);
      url.searchParams.set('startDate', weekStart);
      url.searchParams.set('days', '7');
      url.searchParams.set('timezone', meetingType.timezoneDefault);
      const response = await fetch(url.toString(), { cache: 'no-store' });
      if (!response.ok) throw new Error('Unable to load week slots.');
      const data = (await response.json()) as { days: Array<{ date: string; slots: Slot[] }> };
      const map: Record<string, Slot[]> = {};
      data.days?.forEach(day => {
        map[day.date] = day.slots ?? [];
      });
      setWeekSlots(map);
    } catch (err) {
      setWeekSlots({});
    } finally {
      setWeekLoading(false);
    }
  }, [meetingType, weekStart]);

  useEffect(() => {
    if (!meetingType || !weekStart) return;
    void loadWeekSlots();
  }, [meetingType, weekStart, loadWeekSlots]);

  const availabilityByDay = useMemo(() => {
    const grouped: Record<number, WeeklyAvailability[]> = {};
    DAYS.forEach(day => {
      grouped[day.index] = availability
        .filter(item => item.dayOfWeek === day.index)
        .sort((a, b) => a.startTimeMinutes - b.startTimeMinutes);
    });
    return grouped;
  }, [availability]);

  const weeklyBlackoutsByDay = useMemo(() => {
    const grouped: Record<number, WeeklyBlackout[]> = {};
    DAYS.forEach(day => {
      grouped[day.index] = weeklyBlackouts
        .filter(item => item.dayOfWeek === day.index)
        .sort((a, b) => a.startTimeMinutes - b.startTimeMinutes);
    });
    return grouped;
  }, [weeklyBlackouts]);

  const minNoticeDays = Math.floor((meetingType?.minNoticeMinutes ?? 0) / (24 * 60));
  const minNoticeHours = Math.floor(
    ((meetingType?.minNoticeMinutes ?? 0) % (24 * 60)) / 60,
  );

  const updateMeetingType = <K extends keyof MeetingType>(key: K, value: MeetingType[K]) => {
    setMeetingType(current => (current ? { ...current, [key]: value } : current));
  };

  const updateScheduleSettings = <K extends keyof ScheduleSettings>(
    key: K,
    value: ScheduleSettings[K],
  ) => {
    setScheduleSettings(current => (current ? { ...current, [key]: value } : current));
  };

  const handleAddWindow = (dayIndex: number) => {
    if (!meetingType) return;
    setAvailability(current => [
      ...current,
      {
        id: crypto.randomUUID(),
        meetingTypeId: meetingType.id,
        dayOfWeek: dayIndex,
        startTimeMinutes: 9 * 60,
        endTimeMinutes: 17 * 60,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
  };

  const updateWindow = (id: string, updates: Partial<WeeklyAvailability>) => {
    setAvailability(current =>
      current.map(item => (item.id === id ? { ...item, ...updates } : item)),
    );
  };

  const removeWindow = (id: string) => {
    setAvailability(current => current.filter(item => item.id !== id));
  };

  const handleAddWeeklyBlackout = (dayIndex: number) => {
    if (!meetingType) return;
    setWeeklyBlackouts(current => [
      ...current,
      {
        id: crypto.randomUUID(),
        meetingTypeId: meetingType.id,
        dayOfWeek: dayIndex,
        startTimeMinutes: 12 * 60,
        endTimeMinutes: 13 * 60,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
  };

  const updateWeeklyBlackout = (id: string, updates: Partial<WeeklyBlackout>) => {
    setWeeklyBlackouts(current =>
      current.map(item => (item.id === id ? { ...item, ...updates } : item)),
    );
  };

  const removeWeeklyBlackout = (id: string) => {
    setWeeklyBlackouts(current => current.filter(item => item.id !== id));
  };

  const openTimeModal = (params: {
    kind: 'window' | 'weeklyBlackout' | 'blackoutForm';
    id?: string;
    startMinutes: number;
    endMinutes: number;
  }) => {
    setTimeModalContext(params);
    setTimeModalOpen(true);
  };

  const applyTimeModal = () => {
    if (!timeModalContext) return;
    const { kind, id, startMinutes, endMinutes } = timeModalContext;
    if (endMinutes <= startMinutes) return;
    if (kind === 'window' && id) {
      updateWindow(id, { startTimeMinutes: startMinutes, endTimeMinutes: endMinutes });
    }
    if (kind === 'weeklyBlackout' && id) {
      updateWeeklyBlackout(id, {
        startTimeMinutes: startMinutes,
        endTimeMinutes: endMinutes,
      });
    }
    if (kind === 'blackoutForm') {
      setBlackoutForm(current => ({
        ...current,
        startTime: minutesToTime(startMinutes),
        endTime: minutesToTime(endMinutes),
      }));
    }
    setTimeModalOpen(false);
  };

  const handleSave = async () => {
    if (!meetingType || !adminUsername) return;
    const nextAvailabilitySignature = buildWeeklySignature(availability);
    const nextWeeklyBlackoutsSignature = buildWeeklySignature(weeklyBlackouts);
    const shouldRefreshBusyPattern =
      meetingType.availabilityMode === 'busy' &&
      (nextAvailabilitySignature !== availabilitySignature ||
        nextWeeklyBlackoutsSignature !== weeklyBlackoutsSignature);
    const meetingTypeToSave = shouldRefreshBusyPattern
      ? {
          ...meetingType,
          busyPatternVersion: (meetingType.busyPatternVersion || 1) + 1,
        }
      : meetingType;
    if (shouldRefreshBusyPattern) {
      setMeetingType(meetingTypeToSave);
    }
    setSaving(true);
    try {
      const settingsToSave: ScheduleSettings = scheduleSettings
        ? { ...scheduleSettings, updatedAt: new Date().toISOString() }
        : {
            adminUsername,
            primaryTimezone: meetingType.timezoneDefault,
            travelModeEnabled: false,
            travelTimezone: null,
            travelStartDate: null,
            travelEndDate: null,
            globalUnavailable: false,
            updatedAt: new Date().toISOString(),
          };
      const response = await fetch('/api/schedule/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminHeader },
        body: JSON.stringify({
          action: 'save',
          meetingType: meetingTypeToSave,
          availability,
          weeklyBlackouts,
          scheduleSettings: settingsToSave,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as
        | { meetingType?: MeetingType; error?: string }
        | undefined;
      if (!response.ok) {
        throw new Error(
          payload?.error || `Unable to save schedule settings. (${response.status})`,
        );
      }
      const data = payload as { meetingType: MeetingType };
      setMeetingType(data.meetingType);
      setAvailabilitySignature(nextAvailabilitySignature);
      setWeeklyBlackoutsSignature(nextWeeklyBlackoutsSignature);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save schedule settings.');
      setStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateMeetingType = async () => {
    if (!adminUsername) return;
    const name = newMeetingTypeName.trim();
    if (!name) return;
    try {
      const response = await fetch('/api/schedule/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminHeader },
        body: JSON.stringify({
          action: 'createMeetingType',
          newMeetingTypeName: name,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as
        | { meetingType?: MeetingType; error?: string }
        | undefined;
      if (!response.ok) {
        throw new Error(
          payload?.error || `Unable to create meeting type. (${response.status})`,
        );
      }
      const data = payload as { meetingType: MeetingType };
      setNewMeetingTypeName('');
      setSelectedMeetingTypeId(data.meetingType.id);
      setMeetingType(data.meetingType);
      await loadSchedule();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create meeting type.');
      setStatus('error');
    }
  };

  const handleAddBlackout = async () => {
    if (!meetingType || !adminUsername) return;
    if (blackoutSelectedDates.length === 0) return;
    const sortedDates = [...blackoutSelectedDates].sort();
    const isConsecutive = sortedDates.every((date, index) => {
      if (index === 0) return true;
      return date === addDays(sortedDates[index - 1], 1);
    });
    try {
      const payloadForDates = isConsecutive
        ? [{ startDate: sortedDates[0], endDate: sortedDates[sortedDates.length - 1] }]
        : sortedDates.map(date => ({ startDate: date, endDate: date }));

      for (const range of payloadForDates) {
        const response = await fetch('/api/schedule/availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...adminHeader },
          body: JSON.stringify({
            action: 'addBlackout',
            blackout: {
              meetingTypeId: meetingType.id,
              startDate: range.startDate,
              endDate: range.endDate,
              startTime: blackoutForm.startTime,
              endTime: blackoutForm.endTime,
              allDay: blackoutForm.allDay,
              timezone: meetingType.timezoneDefault,
              note: blackoutForm.note,
            },
          }),
        });
        const payload = (await response.json().catch(() => ({}))) as
          | { error?: string }
          | undefined;
        if (!response.ok) {
          throw new Error(
            payload?.error || `Unable to add blackout. (${response.status})`,
          );
        }
      }
      setBlackoutForm({
        startTime: '09:00',
        endTime: '17:00',
        allDay: false,
        note: '',
      });
      setBlackoutSelectedDates([]);
      setBlackoutRangeAnchor(null);
      await loadSchedule();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add blackout.');
      setStatus('error');
    }
  };

  const handleDeleteBlackout = async (id: string) => {
    if (!adminUsername) return;
    try {
      const response = await fetch('/api/schedule/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminHeader },
        body: JSON.stringify({ action: 'deleteBlackout', blackoutId: id }),
      });
      const payload = (await response.json().catch(() => ({}))) as
        | { error?: string }
        | undefined;
      if (!response.ok) {
        throw new Error(
          payload?.error || `Unable to delete blackout. (${response.status})`,
        );
      }
      await loadSchedule();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete blackout.');
      setStatus('error');
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!meetingType) return;
    try {
      await fetch('/api/schedule/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          bookingId,
          meetingTypeId: meetingType.id,
        }),
      });
      await loadSchedule();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to cancel booking.');
      setStatus('error');
    }
  };

  const handleDeleteMeetingType = async () => {
    if (!meetingType) return;
    try {
      const response = await fetch('/api/schedule/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminHeader },
        body: JSON.stringify({ action: 'deleteMeetingType', meetingTypeId: meetingType.id }),
      });
      const payload = (await response.json().catch(() => ({}))) as
        | { error?: string }
        | undefined;
      if (!response.ok) {
        throw new Error(payload?.error || `Unable to delete meeting type.`);
      }
      setDeleteMeetingTypeOpen(false);
      setSelectedMeetingTypeId(null);
      await loadSchedule();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete meeting type.');
      setStatus('error');
    }
  };

  const openReschedule = (booking: Booking) => {
    if (!meetingType) return;
    const zone = meetingType.timezoneDefault;
    setRescheduleBooking(booking);
    setRescheduleTimezone(zone);
    setRescheduleDate(toTimeZoneDate(booking.startsAtUtc, zone));
    setRescheduleSelection({
      startsAtUtc: booking.startsAtUtc,
      endsAtUtc: booking.endsAtUtc,
      label: formatTimeOnly(booking.startsAtUtc, zone),
      meetingStartLocal: '',
    });
    setRescheduleSlotError('');
  };

  const loadRescheduleSlots = useCallback(async () => {
    if (!meetingType || !rescheduleBooking || !rescheduleDate) return;
    setRescheduleSlotLoading(true);
    setRescheduleSlotError('');
    try {
      const url = new URL('/api/schedule/slots', window.location.origin);
      url.searchParams.set('meetingTypeId', meetingType.id);
      url.searchParams.set('date', rescheduleDate);
      url.searchParams.set('timezone', rescheduleTimezone || meetingType.timezoneDefault);
      const response = await fetch(url.toString(), { cache: 'no-store' });
      if (!response.ok) throw new Error('Unable to load slots.');
      const data = (await response.json()) as { days: Array<{ slots: Slot[] }> };
      const baseSlots = data.days?.[0]?.slots ?? [];
      let nextSlots = baseSlots;
      if (rescheduleBooking) {
        const bookingDate = toTimeZoneDate(
          rescheduleBooking.startsAtUtc,
          rescheduleTimezone || meetingType.timezoneDefault,
        );
        if (bookingDate === rescheduleDate) {
          const exists = baseSlots.some(
            slot => slot.startsAtUtc === rescheduleBooking.startsAtUtc,
          );
          if (!exists) {
            nextSlots = [
              {
                startsAtUtc: rescheduleBooking.startsAtUtc,
                endsAtUtc: rescheduleBooking.endsAtUtc,
                label: formatTimeOnly(
                  rescheduleBooking.startsAtUtc,
                  rescheduleTimezone || meetingType.timezoneDefault,
                ),
                meetingStartLocal: '',
              },
              ...baseSlots,
            ];
          }
        }
      }
      setRescheduleSlots(nextSlots);
      if (!rescheduleSelection && rescheduleBooking) {
        setRescheduleSelection({
          startsAtUtc: rescheduleBooking.startsAtUtc,
          endsAtUtc: rescheduleBooking.endsAtUtc,
          label: formatTimeOnly(
            rescheduleBooking.startsAtUtc,
            rescheduleTimezone || meetingType.timezoneDefault,
          ),
          meetingStartLocal: '',
        });
      }
    } catch (err) {
      setRescheduleSlotError(
        err instanceof Error ? err.message : 'Unable to load available slots.',
      );
    } finally {
      setRescheduleSlotLoading(false);
    }
  }, [meetingType, rescheduleBooking, rescheduleDate, rescheduleTimezone]);

  useEffect(() => {
    if (!rescheduleBooking) return;
    void loadRescheduleSlots();
  }, [loadRescheduleSlots, rescheduleBooking, rescheduleDate, rescheduleTimezone]);

  const handleReschedule = async () => {
    if (!meetingType || !rescheduleBooking || !rescheduleSelection) return;
    setRescheduleSaving(true);
    try {
      const response = await fetch('/api/schedule/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reschedule',
          bookingId: rescheduleBooking.id,
          meetingTypeId: meetingType.id,
          date: rescheduleDate,
          timezone: rescheduleTimezone || meetingType.timezoneDefault,
          startsAtUtc: rescheduleSelection.startsAtUtc,
        }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? 'Unable to reschedule booking.');
      }
      setRescheduleBooking(null);
      await loadSchedule();
    } catch (err) {
      setRescheduleSlotError(
        err instanceof Error ? err.message : 'Unable to reschedule booking.',
      );
    } finally {
      setRescheduleSaving(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="space-y-6">
        <div className="h-24 animate-pulse rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)]" />
        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <div className="h-96 animate-pulse rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)]" />
          <div className="space-y-5">
            <div className="h-40 animate-pulse rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)]" />
            <div className="h-40 animate-pulse rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)]" />
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6">
        <p className="text-sm text-[var(--c-b42318)]">{error}</p>
        <button
          type="button"
          onClick={() => void loadSchedule()}
          className="mt-4 rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)]"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!meetingType) {
    return null;
  }

  return (
    <div className="schedule-page space-y-8">
      <header className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
            Scheduling
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-[var(--c-1f1f1d)]">
            Schedule Settings
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--c-6f6c65)]">
            Manage meeting types, availability rules, and booking windows.
          </p>
        </div>
        <div className="schedule-time-badge-card rounded-3xl border border-[var(--c-ecebe7)] bg-[linear-gradient(135deg,var(--c-ffffff),var(--c-f7f7f5))] p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <TimeBadge label="Melbourne" timeZone="Australia/Melbourne" />
            <TimeBadge label="Sacramento" timeZone="America/Los_Angeles" />
          </div>
        </div>
      </header>
      <section className="schedule-hero rounded-3xl border border-[var(--c-ecebe7)] bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(252,252,251,0.85))] p-8 shadow-[0_26px_60px_-40px_rgba(0,0,0,0.25)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
          Scheduling
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-[var(--c-1f1f1d)]">
              Booking Setup
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--c-6f6c65)]">
              Manage multiple meeting types and availability for each admin account.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="rounded-full border border-[var(--sidebar-accent-bg)] bg-[var(--sidebar-accent-bg)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
            <button
              type="button"
              onClick={() => setDeleteMeetingTypeOpen(true)}
              className="rounded-full border border-[var(--c-c8102e)] bg-[var(--c-ffffff)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-c8102e)] transition hover:bg-[var(--c-fff1f3)]"
            >
              Delete
            </button>
          </div>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="schedule-hero-card rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
              Meeting Type
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              <select
                value={meetingType.id}
                onChange={event => setSelectedMeetingTypeId(event.target.value)}
                className="w-full rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
              >
                {meetingTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              <div className="flex w-full flex-wrap gap-2">
                <input
                  value={newMeetingTypeName}
                  onChange={event => setNewMeetingTypeName(event.target.value)}
                  placeholder="New Meeting Type"
                  className="flex-1 rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => void handleCreateMeetingType()}
                  className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
          {shareUrl ? (
            <div className="schedule-hero-card rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                Shareable Link
              </p>
              <input
                value={shareUrl}
                readOnly
                className="mt-2 w-full rounded-2xl border border-[var(--c-e5e3dd)] bg-[var(--c-fcfcfb)] px-3 py-2 text-xs text-[var(--c-1f1f1d)]"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => window.open(shareUrl, '_blank', 'noopener,noreferrer')}
                  className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[var(--c-c8102e)] hover:text-[var(--c-c8102e)]"
                >
                  Open Link
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!shareUrl) return;
                    const fallbackCopy = () => {
                      const textarea = document.createElement('textarea');
                      textarea.value = shareUrl;
                      textarea.setAttribute('readonly', '');
                      textarea.style.position = 'fixed';
                      textarea.style.opacity = '0';
                      document.body.appendChild(textarea);
                      textarea.select();
                      try {
                        document.execCommand('copy');
                      } catch {
                        // ignore
                      }
                      document.body.removeChild(textarea);
                    };
                    if (navigator.clipboard?.writeText) {
                      try {
                        await navigator.clipboard.writeText(shareUrl);
                      } catch {
                        fallbackCopy();
                      }
                    } else {
                      fallbackCopy();
                    }
                  }}
                  className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[var(--c-c8102e)] hover:text-[var(--c-c8102e)]"
                >
                  Copy Link
                </button>
              </div>
            </div>
          ) : null}
        </div>
        {scheduleSettings ? (
          <div className="mt-4 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
              Global Availability
            </p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Primary Timezone
                <select
                  value={scheduleSettings.primaryTimezone}
                  onChange={event =>
                    updateScheduleSettings('primaryTimezone', event.target.value)
                  }
                  className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                >
                  {TIMEZONES.map(zone => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                </select>
              </label>
              <div className="sm:col-span-2 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3">
                <label className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  <input
                    type="checkbox"
                    checked={scheduleSettings.travelModeEnabled}
                    onChange={event =>
                      updateScheduleSettings('travelModeEnabled', event.target.checked)
                    }
                    className="h-5 w-5 rounded border-[var(--c-e5e3dd)] text-[var(--c-c8102e)] accent-[var(--c-c8102e)]"
                  />
                  Use a different timezone (Travel Mode)
                </label>
                {scheduleSettings.travelModeEnabled ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                      Travel Timezone
                      <select
                        value={scheduleSettings.travelTimezone ?? scheduleSettings.primaryTimezone}
                        onChange={event =>
                          updateScheduleSettings('travelTimezone', event.target.value)
                        }
                        className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                      >
                        {TIMEZONES.map(zone => (
                          <option key={zone} value={zone}>
                            {zone}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-[10px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                      Start Date
                      <input
                        type="date"
                        value={scheduleSettings.travelStartDate ?? ''}
                        onChange={event =>
                          updateScheduleSettings('travelStartDate', event.target.value)
                        }
                        className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                      />
                    </label>
                    <label className="text-[10px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                      End Date
                      <input
                        type="date"
                        value={scheduleSettings.travelEndDate ?? ''}
                        onChange={event =>
                          updateScheduleSettings('travelEndDate', event.target.value)
                        }
                        className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                      />
                    </label>
                  </div>
                ) : null}
              </div>
              <div className="sm:col-span-2 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3">
                <label className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  <input
                    type="checkbox"
                    checked={scheduleSettings.globalUnavailable}
                    onChange={event =>
                      updateScheduleSettings('globalUnavailable', event.target.checked)
                    }
                    className="h-5 w-5 rounded border-[var(--c-e5e3dd)] text-[var(--c-c8102e)] accent-[var(--c-c8102e)]"
                  />
                  Global Unavailable (greys all timeslots)
                </label>
              </div>
            </div>
          </div>
        ) : null}
        {scheduleSettings &&
        detectedTimeZone &&
        detectedTimeZone !== scheduleSettings.primaryTimezone ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--c-e5e3dd)] bg-[var(--c-fcfcfb)] px-4 py-3 text-sm text-[var(--c-6f6c65)]">
            <p>
              You appear to be in {detectedTimeZone}. Switch timezone?
            </p>
            <button
              type="button"
              onClick={() => updateScheduleSettings('primaryTimezone', detectedTimeZone)}
              className="rounded-full border border-[var(--c-c8102e)] bg-[var(--c-ffffff)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-c8102e)] transition hover:bg-[var(--c-fff1f3)]"
            >
              Switch to {detectedTimeZone}
            </button>
          </div>
        ) : null}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <div className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
              Meeting Settings
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Meeting Name
                <input
                  value={meetingType.name}
                  onChange={event => updateMeetingType('name', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                />
              </label>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Location / Method
                <input
                  value={meetingType.location}
                  onChange={event => updateMeetingType('location', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                />
              </label>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Duration (minutes)
                <input
                  type="number"
                  min={10}
                  step={5}
                  value={meetingType.durationMinutes}
                  onChange={event =>
                    updateMeetingType('durationMinutes', Number(event.target.value))
                  }
                  className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {[15, 30, 45, 60].map(value => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => updateMeetingType('durationMinutes', value)}
                      className={`schedule-duration-pill rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                        meetingType.durationMinutes === value
                          ? 'border-[var(--c-3a3935)] bg-[var(--c-3a3935)] text-white'
                          : 'border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] text-[var(--c-6f6c65)]'
                      }`}
                    >
                      {value}m
                    </button>
                  ))}
                </div>
              </label>
              <div className="sm:col-span-2 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3">
                <label className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  <input
                    type="checkbox"
                    checked={meetingType.allowPublicReschedule}
                    onChange={event =>
                      updateMeetingType('allowPublicReschedule', event.target.checked)
                    }
                    className="h-5 w-5 rounded border-[var(--c-e5e3dd)] text-[var(--c-c8102e)] accent-[var(--c-c8102e)]"
                  />
                  Allow public reschedule/cancel
                </label>
              </div>
              <div className="sm:col-span-2 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3">
                <label className="my-6 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  <input
                    type="checkbox"
                    checked={meetingType.showSimplyMusicHeader}
                    onChange={event => {
                      const nextChecked = event.target.checked;
                      setMeetingType(current => {
                        if (!current) return current;
                        return {
                          ...current,
                          showSimplyMusicHeader: nextChecked,
                          simplyMusicSubheaderText:
                            nextChecked && !current.simplyMusicSubheaderText
                              ? 'Set up a One-On-One Zoom Call with Simply Music’s Founder, Neil Moore'
                              : current.simplyMusicSubheaderText,
                        };
                      });
                    }}
                    className="h-5 w-5 rounded border-[var(--c-e5e3dd)] text-[var(--c-c8102e)] accent-[var(--c-c8102e)]"
                  />
                  Show Simply Music Header
                </label>
                {meetingType.showSimplyMusicHeader ? (
                  <label className="mt-3 block text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                    Sub-Header Text
                    <input
                      value={meetingType.simplyMusicSubheaderText}
                      onChange={event =>
                        updateMeetingType(
                          'simplyMusicSubheaderText',
                          event.target.value,
                        )
                      }
                      placeholder="Add a short supporting line"
                      className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                    />
                  </label>
                ) : null}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
              Time Settings
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Buffer Before (minutes)
                <select
                  value={meetingType.bufferBeforeMinutes}
                  onChange={event =>
                    updateMeetingType('bufferBeforeMinutes', Number(event.target.value))
                  }
                  className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                >
                  {[0, 5, 10, 15].map(value => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Buffer After (minutes)
                <select
                  value={meetingType.bufferAfterMinutes}
                  onChange={event =>
                    updateMeetingType('bufferAfterMinutes', Number(event.target.value))
                  }
                  className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                >
                  {[0, 5, 10, 15].map(value => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              <div className="space-y-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Minimum Notice
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      type="number"
                      min={0}
                      value={minNoticeDays}
                      onChange={event => {
                        const days = Number(event.target.value);
                        updateMeetingType(
                          'minNoticeMinutes',
                          Math.max(0, days) * 24 * 60 + minNoticeHours * 60,
                        );
                      }}
                      className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                    />
                    <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                      Days
                    </p>
                  </div>
                  <div>
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={minNoticeHours}
                      onChange={event => {
                        const hours = Number(event.target.value);
                        updateMeetingType(
                          'minNoticeMinutes',
                          minNoticeDays * 24 * 60 + Math.min(23, Math.max(0, hours)) * 60,
                        );
                      }}
                      className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                    />
                    <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                      Hours
                    </p>
                  </div>
                </div>
              </div>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Max Horizon (days)
                <input
                  type="number"
                  min={7}
                  step={7}
                  value={meetingType.maxHorizonDays}
                  onChange={event =>
                    updateMeetingType('maxHorizonDays', Number(event.target.value))
                  }
                  className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                />
              </label>
              <div className="sm:col-span-2 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3">
                <label className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  <input
                    type="checkbox"
                    checked={meetingType.noOvernightSlots}
                    onChange={event =>
                      updateMeetingType('noOvernightSlots', event.target.checked)
                    }
                    className="h-5 w-5 rounded border-[var(--c-e5e3dd)] text-[var(--c-c8102e)] accent-[var(--c-c8102e)]"
                  />
                  No Overnight Time Slots
                </label>
              </div>
              <div className="sm:col-span-2 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3">
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  Availability Mode
                  <select
                    value={meetingType.availabilityMode}
                    onChange={event => {
                      const nextMode = event.target.value as MeetingType['availabilityMode'];
                      setMeetingType(current => {
                        if (!current) return current;
                        const next = { ...current, availabilityMode: nextMode };
                        if (nextMode === 'daily_limit' && next.dailyLimit <= 0) {
                          next.dailyLimit = 4;
                        }
                        if (nextMode === 'busy' && next.busyBufferPercent <= 0) {
                          next.busyBufferPercent = 60;
                        }
                        return next;
                      });
                    }}
                    className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                  >
                    <option value="all">All Time Slots Available</option>
                    <option value="busy">Busy Buffer</option>
                    <option value="daily_limit">Daily Limit Cap</option>
                  </select>
                </label>
                <div className="mt-3 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3 text-sm text-[var(--c-6f6c65)]">
                  {meetingType.availabilityMode === 'all' ? (
                    <p>
                      Shows every slot that fits your windows, buffers, and booking
                      rules.
                    </p>
                  ) : null}
                  {meetingType.availabilityMode === 'busy' ? (
                    <div className="space-y-2">
                      <p>
                        Hides about {meetingType.busyBufferPercent}% of slots per day
                        in a consistent pattern so availability feels selective.
                      </p>
                      <label className="text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                        Busy Buffer (% hidden)
                        <input
                          type="number"
                          min={10}
                          max={90}
                          step={5}
                          value={meetingType.busyBufferPercent}
                          onChange={event =>
                            updateMeetingType(
                              'busyBufferPercent',
                              Number(event.target.value),
                            )
                          }
                          className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          (updateMeetingType(
                            'busyPatternVersion',
                            (meetingType.busyPatternVersion || 1) + 1,
                          ),
                          setBusyPatternMessage('Busy pattern regenerated.'))
                        }
                        className="mt-3 rounded-full border border-[var(--c-1f1f1d)] bg-[var(--c-1f1f1d)] px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--c-ffffff)] transition hover:brightness-110"
                      >
                        Regenerate Busy Pattern
                      </button>
                      {busyPatternMessage ? (
                        <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                          {busyPatternMessage}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  {meetingType.availabilityMode === 'daily_limit' ? (
                    <div className="space-y-2">
                      <p>
                        Only the first N available slots per day are shown; the rest
                        are hidden.
                      </p>
                      <label className="text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                        Daily Limit
                        <input
                          type="number"
                          min={1}
                          max={24}
                          value={meetingType.dailyLimit}
                          onChange={event =>
                            updateMeetingType('dailyLimit', Number(event.target.value))
                          }
                          className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-sm text-[var(--c-1f1f1d)]"
                        />
                      </label>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
                  Weekly Availability
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                  Open Booking Windows
                </h2>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {DAYS.map(day => (
                <div
                  key={day.index}
                  className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                      {day.label}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddWindow(day.index)}
                        className="schedule-action-pill rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[var(--c-c8102e)] hover:text-[var(--c-c8102e)]"
                      >
                        Add Window
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddWeeklyBlackout(day.index)}
                        className="schedule-action-pill schedule-action-pill--dark rounded-full border border-[var(--c-1f1f1d)] bg-[var(--c-1f1f1d)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--c-ffffff)] transition hover:brightness-110"
                      >
                        Add Blackout
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    {availabilityByDay[day.index]?.length
                      ? availabilityByDay[day.index].map(window => (
                          <div
                            key={window.id}
                            className="schedule-window-row flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--c-e5e3dd)] bg-white px-3 py-2 text-xs"
                          >
                          <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                            Start
                            <button
                              type="button"
                              onClick={() =>
                                openTimeModal({
                                  kind: 'window',
                                  id: window.id,
                                  startMinutes: window.startTimeMinutes,
                                  endMinutes: window.endTimeMinutes,
                                })
                              }
                              className="schedule-time-pill inline-flex items-center gap-2 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-1 text-xs text-[var(--c-1f1f1d)]"
                            >
                              <svg
                                aria-hidden="true"
                                viewBox="0 0 24 24"
                                className="h-3.5 w-3.5 text-[var(--c-7a776f)]"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <circle cx="12" cy="12" r="8" />
                                <path d="M12 7v5l3 2" />
                              </svg>
                              {formatTimeLabel(window.startTimeMinutes)}
                            </button>
                          </label>
                          <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                            End
                            <button
                              type="button"
                              onClick={() =>
                                openTimeModal({
                                  kind: 'window',
                                  id: window.id,
                                  startMinutes: window.startTimeMinutes,
                                  endMinutes: window.endTimeMinutes,
                                })
                              }
                              className="schedule-time-pill inline-flex items-center gap-2 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-1 text-xs text-[var(--c-1f1f1d)]"
                            >
                              <svg
                                aria-hidden="true"
                                viewBox="0 0 24 24"
                                className="h-3.5 w-3.5 text-[var(--c-7a776f)]"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <circle cx="12" cy="12" r="8" />
                                <path d="M12 7v5l3 2" />
                              </svg>
                              {formatTimeLabel(window.endTimeMinutes)}
                            </button>
                          </label>
                            <button
                              type="button"
                              onClick={() => removeWindow(window.id)}
                              className="ml-auto text-[10px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]"
                            >
                              Remove
                            </button>
                          </div>
                        ))
                      : null}
                    {weeklyBlackoutsByDay[day.index]?.length
                      ? weeklyBlackoutsByDay[day.index].map(block => (
                          <div
                            key={block.id}
                            className="schedule-blackout-row flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--c-1f1f1d)] bg-[var(--c-1f1f1d)] px-3 py-2 text-xs"
                          >
                            <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[rgba(255,255,255,0.72)]">
                              Start
                              <button
                                type="button"
                                onClick={() =>
                                  openTimeModal({
                                    kind: 'weeklyBlackout',
                                    id: block.id,
                                    startMinutes: block.startTimeMinutes,
                                    endMinutes: block.endTimeMinutes,
                                  })
                                }
                                className="schedule-time-pill inline-flex items-center gap-2 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-1 text-xs text-[var(--c-1f1f1d)]"
                              >
                                <svg
                                  aria-hidden="true"
                                  viewBox="0 0 24 24"
                                  className="h-3.5 w-3.5 text-[var(--c-7a776f)]"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.6"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <circle cx="12" cy="12" r="8" />
                                  <path d="M12 7v5l3 2" />
                                </svg>
                                {formatTimeLabel(block.startTimeMinutes)}
                              </button>
                            </label>
                            <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[rgba(255,255,255,0.72)]">
                            End
                            <button
                              type="button"
                                onClick={() =>
                                  openTimeModal({
                                    kind: 'weeklyBlackout',
                                    id: block.id,
                                    startMinutes: block.startTimeMinutes,
                                    endMinutes: block.endTimeMinutes,
                                  })
                                }
                              className="schedule-time-pill inline-flex items-center gap-2 rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-1 text-xs text-[var(--c-1f1f1d)]"
                            >
                                <svg
                                  aria-hidden="true"
                                  viewBox="0 0 24 24"
                                  className="h-3.5 w-3.5 text-[var(--c-7a776f)]"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.6"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <circle cx="12" cy="12" r="8" />
                                  <path d="M12 7v5l3 2" />
                                </svg>
                                {formatTimeLabel(block.endTimeMinutes)}
                              </button>
                            </label>
                            <button
                              type="button"
                              onClick={() => removeWeeklyBlackout(block.id)}
                              className="ml-auto text-[10px] uppercase tracking-[0.2em] text-[rgba(255,255,255,0.72)]"
                            >
                              Remove
                            </button>
                          </div>
                        ))
                      : null}
                    {!availabilityByDay[day.index]?.length &&
                    !weeklyBlackoutsByDay[day.index]?.length ? (
                      <p className="text-xs text-[var(--c-9a9892)]">
                        No availability set.
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
                  Week At A Glance
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                  Availability Snapshot
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWeekStart(addDays(weekStart, -7))}
                  className="rounded-full border border-[var(--c-e5e3dd)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setWeekStart(addDays(weekStart, 7))}
                  className="rounded-full border border-[var(--c-e5e3dd)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
                >
                  Next
                </button>
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              {Array.from({ length: 7 }).map((_, index) => {
                const date = addDays(weekStart, index);
                const slots = weekSlots[date] ?? [];
                const openSlots = slots.filter(slot => !slot.isBusy);
                const dayBookings = bookings.filter(
                  booking => toTimeZoneDate(booking.startsAtUtc, meetingType.timezoneDefault) === date,
                );
                const dayBlackouts = blackouts.filter(
                  block => toTimeZoneDate(block.startsAtUtc, meetingType.timezoneDefault) === date,
                );
                const dayIndex = getWeekdayIndexInTimeZone(
                  date,
                  meetingType.timezoneDefault,
                );
                const recurringBlackouts =
                  dayBookings.length > 0 ? weeklyBlackoutsByDay[dayIndex] ?? [] : [];
                const dayWindows = availabilityByDay[dayIndex] ?? [];
                const isOutsideAvailability = (booking: Booking) => {
                  const startMinutes = getMinutesInTimeZone(
                    booking.startsAtUtc,
                    meetingType.timezoneDefault,
                  );
                  const endMinutes = getMinutesInTimeZone(
                    booking.endsAtUtc,
                    meetingType.timezoneDefault,
                  );
                  const busyStart = startMinutes - meetingType.bufferBeforeMinutes;
                  const busyEnd = endMinutes + meetingType.bufferAfterMinutes;
                  const withinWindow = dayWindows.some(
                    window =>
                      startMinutes >= window.startTimeMinutes &&
                      endMinutes <= window.endTimeMinutes,
                  );
                  if (!withinWindow) return true;
                  return recurringBlackouts.some(
                    block =>
                      busyStart < block.endTimeMinutes &&
                      busyEnd > block.startTimeMinutes,
                  );
                };
                const totalBlackouts = dayBlackouts.length + recurringBlackouts.length;
                return (
                  <div
                    key={date}
                    className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                        {formatDateLabel(date, meetingType.timezoneDefault)}
                      </p>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                        {weekLoading
                          ? 'Loading...'
                          : `${openSlots.length} open slots`}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                      {dayBookings.length ? (
                        <span className="rounded-full border border-[var(--c-e5e3dd)] bg-white px-2 py-1">
                          {dayBookings.length} booked
                        </span>
                      ) : (
                        <span className="rounded-full border border-[var(--c-e5e3dd)] bg-white px-2 py-1">
                          No bookings
                        </span>
                      )}
                      {totalBlackouts ? (
                        <span className="rounded-full border border-[var(--c-1f1f1d)] bg-[var(--c-1f1f1d)] px-2 py-1 text-white">
                          {totalBlackouts} blackout
                        </span>
                      ) : null}
                    </div>
                    {dayBookings.length ? (
                      <div className="mt-3 space-y-2">
                        {dayBookings.slice(0, 3).map(item => {
                          const needsReschedule = isOutsideAvailability(item);
                          return (
                          <div
                            key={item.id}
                            className="schedule-glance-item flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--c-e5e3dd)] bg-white px-3 py-2 text-xs text-[var(--c-6f6c65)]"
                          >
                              <span>
                                {formatDateTime(item.startsAtUtc, meetingType.timezoneDefault)} ·{' '}
                                {item.name}
                              </span>
                              {needsReschedule ? (
                                <button
                                  type="button"
                                  onClick={() => openReschedule(item)}
                                  className="rounded-full border border-[var(--c-c8102e)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--c-c8102e)] transition hover:bg-[var(--c-fff1f3)]"
                                >
                                  Reschedule
                                </button>
                              ) : null}
                            </div>
                          );
                        })}
                        {dayBookings.length > 3 ? (
                          <p className="text-xs text-[var(--c-9a9892)]">
                            +{dayBookings.length - 3} more
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                    {dayBlackouts.length ? (
                      <div className="mt-3 space-y-2">
                        {dayBlackouts.slice(0, 3).map(block => (
                          <div
                            key={block.id}
                            className="schedule-glance-blackout rounded-xl border border-[var(--c-1f1f1d)] bg-[var(--c-1f1f1d)] px-3 py-2 text-xs text-white"
                          >
                            Blackout · {formatDateTime(block.startsAtUtc, meetingType.timezoneDefault)} -{' '}
                            {formatDateTime(block.endsAtUtc, meetingType.timezoneDefault)}
                          </div>
                        ))}
                        {dayBlackouts.length > 3 ? (
                          <p className="text-xs text-[var(--c-9a9892)]">
                            +{dayBlackouts.length - 3} more
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                    {recurringBlackouts.length ? (
                      <div className="mt-3 space-y-2">
                        {recurringBlackouts.slice(0, 3).map(block => (
                          <div
                            key={block.id}
                            className="schedule-glance-blackout rounded-xl border border-[var(--c-1f1f1d)] bg-[var(--c-1f1f1d)] px-3 py-2 text-xs text-white"
                          >
                            Weekly Blackout · {formatTimeLabel(block.startTimeMinutes)} -{' '}
                            {formatTimeLabel(block.endTimeMinutes)}
                          </div>
                        ))}
                        {recurringBlackouts.length > 3 ? (
                          <p className="text-xs text-[var(--c-9a9892)]">
                            +{recurringBlackouts.length - 3} more
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
              Upcoming Bookings
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
              Scheduled Meetings
            </h2>
            <div className="mt-4 space-y-3">
              {bookings.length ? (
                bookings.map(booking => (
                  <div
                    key={booking.id}
                    className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                          {booking.name}
                        </p>
                        <p className="mt-1 text-xs text-[var(--c-6f6c65)]">
                          {formatDateTime(booking.startsAtUtc, meetingType.timezoneDefault)}
                        </p>
                      </div>
                      <span className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                        {booking.status}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-[var(--c-6f6c65)]">{booking.email}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openReschedule(booking)}
                        className="rounded-full border border-[var(--c-c8102e)] bg-[var(--c-ffffff)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--c-c8102e)] transition hover:bg-[var(--c-fff1f3)]"
                      >
                        Reschedule
                      </button>
                      <button
                        type="button"
                        onClick={() => setCancelBooking(booking)}
                        className="rounded-full border border-[var(--c-c8102e)] bg-[var(--c-c8102e)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition hover:brightness-110"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[var(--c-9a9892)]">No upcoming bookings.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
              Blackouts
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
              Blacked Out Dates
            </h2>
            <div className="mt-4 grid gap-3">
              <div className="grid gap-3">
                <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-3 shadow-[0_14px_30px_-24px_rgba(47,40,35,0.35)]">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        const prevMonth =
                          blackoutCalendarMonth.month === 1
                            ? 12
                            : blackoutCalendarMonth.month - 1;
                        const prevYear =
                          blackoutCalendarMonth.month === 1
                            ? blackoutCalendarMonth.year - 1
                            : blackoutCalendarMonth.year;
                        setBlackoutCalendarMonth({ year: prevYear, month: prevMonth });
                      }}
                      className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[var(--c-3a3935)] hover:text-[var(--c-3a3935)]"
                      aria-label="Previous month"
                    >
                      Prev
                    </button>
                    <div className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                      {formatMonthLabel(
                        blackoutCalendarMonth.year || Number(getTodayInTimeZone(meetingType.timezoneDefault).split('-')[0]),
                        blackoutCalendarMonth.month || Number(getTodayInTimeZone(meetingType.timezoneDefault).split('-')[1]),
                        meetingType.timezoneDefault,
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextMonth =
                          blackoutCalendarMonth.month === 12
                            ? 1
                            : blackoutCalendarMonth.month + 1;
                        const nextYear =
                          blackoutCalendarMonth.month === 12
                            ? blackoutCalendarMonth.year + 1
                            : blackoutCalendarMonth.year;
                        setBlackoutCalendarMonth({ year: nextYear, month: nextMonth });
                      }}
                      className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[var(--c-3a3935)] hover:text-[var(--c-3a3935)]"
                      aria-label="Next month"
                    >
                      Next
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-7 gap-2 text-[10px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 grid grid-cols-7 gap-2">
                    {(() => {
                      const today = getTodayInTimeZone(meetingType.timezoneDefault);
                      const [fallbackYear, fallbackMonth] = today.split('-').map(Number);
                      const year = blackoutCalendarMonth.year || fallbackYear;
                      const month = blackoutCalendarMonth.month || fallbackMonth;
                      const daysInMonth = getDaysInMonth(year, month);
                      const firstDate = `${year}-${String(month).padStart(2, '0')}-01`;
                      const firstDayIndex = getWeekdayIndexInTimeZone(
                        firstDate,
                        meetingType.timezoneDefault,
                      );
                      const blanks = Array.from({ length: firstDayIndex });
                      const days = Array.from({ length: daysInMonth }, (_, index) => {
                        const dayNumber = index + 1;
                        const dateValue = `${year}-${String(month).padStart(2, '0')}-${String(
                          dayNumber,
                        ).padStart(2, '0')}`;
                        const isSelected = blackoutSelectedDates.includes(dateValue);
                        return (
                          <button
                            key={dateValue}
                            type="button"
                            onClick={event => {
                              if (event.shiftKey && blackoutRangeAnchor) {
                                setBlackoutSelectedDates(
                                  buildDateRange(blackoutRangeAnchor, dateValue),
                                );
                                return;
                              }
                              if (event.metaKey || event.ctrlKey) {
                                setBlackoutSelectedDates(current => {
                                  if (current.includes(dateValue)) {
                                    return current.filter(item => item !== dateValue);
                                  }
                                  return [...current, dateValue];
                                });
                                setBlackoutRangeAnchor(dateValue);
                                return;
                              }
                              setBlackoutSelectedDates([dateValue]);
                              setBlackoutRangeAnchor(dateValue);
                            }}
                            className={`h-10 rounded-2xl text-sm font-semibold transition ${
                              isSelected
                                ? 'bg-[var(--c-2d6a4f)] text-white shadow-[0_10px_18px_-12px_rgba(45,106,79,0.6)]'
                                : 'border border-transparent text-[var(--c-1f1f1d)] hover:border-[var(--c-3a3935)] hover:bg-[var(--c-f7f7f5)]'
                            }`}
                          >
                            {dayNumber}
                          </button>
                        );
                      });
                      return [
                        ...blanks.map((_, index) => <div key={`blank-${index}`} />),
                        ...days,
                      ];
                    })()}
                  </div>
                  <div className="mt-3 text-center text-xs text-[var(--c-6f6c65)]">
                    {blackoutSelectedDates.length
                      ? `Selected ${blackoutSelectedDates.length} date${
                          blackoutSelectedDates.length === 1 ? '' : 's'
                        }`
                      : 'SELECT DATES TO BLOCK OFF'}
                  </div>
                  <p className="mt-2 text-center text-[10px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                    Click for single · Shift for range · Cmd/Ctrl for multi
                  </p>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                    Start Time
                    <button
                      type="button"
                      onClick={() =>
                        openTimeModal({
                          kind: 'blackoutForm',
                          startMinutes: timeToMinutes(blackoutForm.startTime),
                          endMinutes: timeToMinutes(blackoutForm.endTime),
                        })
                      }
                      className="schedule-time-pill mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-center text-sm"
                    >
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="h-4 w-4 text-[var(--c-7a776f)]"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="8" />
                        <path d="M12 7v5l3 2" />
                      </svg>
                      {formatTimeLabel(timeToMinutes(blackoutForm.startTime))}
                    </button>
                  </label>
                  <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                    End Time
                    <button
                      type="button"
                      disabled={blackoutForm.allDay}
                      onClick={() =>
                        openTimeModal({
                          kind: 'blackoutForm',
                          startMinutes: timeToMinutes(blackoutForm.startTime),
                          endMinutes: timeToMinutes(blackoutForm.endTime),
                        })
                      }
                      className="schedule-time-pill mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-center text-sm disabled:cursor-not-allowed disabled:bg-[var(--c-f1f1ef)] disabled:text-[var(--c-9a9892)]"
                    >
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="h-4 w-4 text-[var(--c-7a776f)]"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="8" />
                        <path d="M12 7v5l3 2" />
                      </svg>
                      {formatTimeLabel(timeToMinutes(blackoutForm.endTime))}
                    </button>
                  </label>
                </div>
                <div className="py-5">
                  <label className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                    <input
                      type="checkbox"
                      checked={blackoutForm.allDay}
                      onChange={event =>
                        setBlackoutForm(current => ({
                          ...current,
                          allDay: event.target.checked,
                        }))
                      }
                      className="h-5 w-5 rounded border-[var(--c-e5e3dd)] text-[var(--c-c8102e)] accent-[var(--c-c8102e)]"
                    />
                    Set entire day to busy
                  </label>
                </div>
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  Note
                  <input
                    type="text"
                    value={blackoutForm.note}
                    onChange={event =>
                      setBlackoutForm(current => ({
                        ...current,
                        note: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={() => void handleAddBlackout()}
                className="rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={blackoutSelectedDates.length === 0}
              >
                Add Blackout
              </button>
            </div>
            <div className="mt-5 space-y-3">
              {blackouts.length ? (
                blackouts.map(block => (
                  <div
                    key={block.id}
                    className="schedule-blackout-item rounded-2xl border border-[var(--c-1f1f1d)] bg-[var(--c-1f1f1d)] p-4 text-white"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">
                          {block.note || 'Blackout'}
                        </p>
                        <p className="mt-1 text-xs text-[rgba(255,255,255,0.75)]">
                          {formatDateTime(block.startsAtUtc, meetingType.timezoneDefault)} -{' '}
                          {formatDateTime(block.endsAtUtc, meetingType.timezoneDefault)}
                        </p>
                        {block.allDay ? (
                          <span className="mt-2 inline-flex rounded-full border border-white/25 bg-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-white">
                            All Day
                          </span>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleDeleteBlackout(block.id)}
                        className="text-[10px] uppercase tracking-[0.2em] text-white/70 transition hover:text-white"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[var(--c-9a9892)]">No blackout periods yet.</p>
              )}
            </div>
          </div>

        </div>
      </section>

      {rescheduleBooking ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setRescheduleBooking(null)}
          />
          <div className="relative w-full max-w-2xl rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                  Reschedule
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                  Choose a new time
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRescheduleBooking(null)}
                className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
              >
                Close
              </button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Timezone
                <select
                  value={rescheduleTimezone}
                  onChange={event => setRescheduleTimezone(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-sm"
                >
                  {[rescheduleTimezone, ...TIMEZONES.filter(zone => zone !== rescheduleTimezone)].map(zone => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Date
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={event => setRescheduleDate(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm"
                />
              </label>
            </div>
            <div className="mt-4 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3 text-sm text-[var(--c-6f6c65)]">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                Current Appointment
              </p>
              <p className="mt-2">
                Your time: {formatDateTime(rescheduleBooking.startsAtUtc, rescheduleTimezone)}
              </p>
              <p className="mt-1">
                Client time:{' '}
                {formatDateTime(
                  rescheduleBooking.startsAtUtc,
                  rescheduleBooking.bookingTimezone ?? meetingType.timezoneDefault,
                )}
              </p>
            </div>
            <div className="mt-4">
              {rescheduleSlotLoading ? (
                <div className="grid grid-cols-2 gap-2">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={`reslot-${index}`}
                      className="h-10 animate-pulse rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)]"
                    />
                  ))}
                </div>
              ) : rescheduleSlots.length ? (
                <div className="grid grid-cols-2 gap-2">
                  {rescheduleSlots.map(slot => (
                    <button
                      key={slot.startsAtUtc}
                      type="button"
                      onClick={() => setRescheduleSelection(slot)}
                      className={`rounded-2xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                        rescheduleSelection?.startsAtUtc === slot.startsAtUtc
                          ? 'border-[var(--c-c8102e)] bg-[var(--c-fff1f3)] text-[var(--c-c8102e)]'
                          : 'border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] text-[var(--c-6f6c65)]'
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--c-6f6c65)]">
                  No times available. Try another date.
                </p>
              )}
            </div>
            {rescheduleSelection ? (
              <div className="mt-4 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-3 text-sm text-[var(--c-6f6c65)]">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                  Selected Slot
                </p>
                <p className="mt-2">
                  Your time:{' '}
                  {formatDateTime(rescheduleSelection.startsAtUtc, rescheduleTimezone)}
                </p>
                <p className="mt-1">
                  Client time:{' '}
                  {formatDateTime(
                    rescheduleSelection.startsAtUtc,
                    rescheduleBooking.bookingTimezone ?? meetingType.timezoneDefault,
                  )}
                </p>
              </div>
            ) : null}
            {rescheduleSlotError ? (
              <p className="mt-3 text-sm text-[var(--c-b42318)]">{rescheduleSlotError}</p>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void loadRescheduleSlots()}
                className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
              >
                Refresh Slots
              </button>
              <button
                type="button"
                onClick={() => void handleReschedule()}
                disabled={!rescheduleSelection || rescheduleSaving}
                className="rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {rescheduleSaving ? 'Saving...' : 'Confirm Reschedule'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {cancelBooking ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setCancelBooking(null)}
          />
          <div className="relative w-full max-w-md rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-xl">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
              Cancel Booking
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
              Are you sure?
            </h3>
            <p className="mt-3 text-sm text-[var(--c-6f6c65)]">
              This will cancel the appointment for {cancelBooking.name} scheduled on{' '}
              {formatDateTime(cancelBooking.startsAtUtc, meetingType.timezoneDefault)}.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setCancelBooking(null)}
                className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleCancelBooking(cancelBooking.id);
                  setCancelBooking(null);
                }}
                className="rounded-full border border-[var(--c-c8102e)] bg-[var(--c-c8102e)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:brightness-110"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {deleteMeetingTypeOpen && meetingType ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDeleteMeetingTypeOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-xl">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
              Delete Meeting Type
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
              Are you sure?
            </h3>
            <p className="mt-3 text-sm text-[var(--c-6f6c65)]">
              This will permanently remove “{meetingType.name}” and all its availability,
              blackouts, and bookings.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteMeetingTypeOpen(false)}
                className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
              >
                Keep
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteMeetingType()}
                className="rounded-full border border-[var(--c-c8102e)] bg-[var(--c-c8102e)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:brightness-110"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {timeModalOpen && timeModalContext ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setTimeModalOpen(false)}
        >
          <div
            className="w-full max-w-3xl rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.5)]"
            onClick={event => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                  Select Times
                </p>
                <p className="mt-2 text-base text-[var(--c-6f6c65)]">
                  Choose start and end time.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                  Start Time
                </p>
                {(() => {
                  const parts = minutesToParts(timeModalContext.startMinutes);
                  return (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <select
                        value={parts.hour12}
                        onChange={event =>
                          setTimeModalContext(current =>
                            current
                              ? {
                                  ...current,
                                  startMinutes: partsToMinutes(
                                    Number(event.target.value),
                                    parts.minute,
                                    parts.meridiem as 'AM' | 'PM',
                                  ),
                                }
                              : current,
                          )
                        }
                        className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-base text-[var(--c-1f1f1d)]"
                      >
                        {Array.from({ length: 12 }).map((_, index) => {
                          const hour = index + 1;
                          return (
                            <option key={`start-hour-${hour}`} value={hour}>
                              {String(hour).padStart(2, '0')}
                            </option>
                          );
                        })}
                      </select>
                      <select
                        value={parts.minute}
                        onChange={event =>
                          setTimeModalContext(current =>
                            current
                              ? {
                                  ...current,
                                  startMinutes: partsToMinutes(
                                    parts.hour12,
                                    Number(event.target.value),
                                    parts.meridiem as 'AM' | 'PM',
                                  ),
                                }
                              : current,
                          )
                        }
                        className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-base text-[var(--c-1f1f1d)]"
                      >
                        {[0, 15, 30, 45].map(value => (
                          <option key={`start-min-${value}`} value={value}>
                            {String(value).padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                      <select
                        value={parts.meridiem}
                        onChange={event =>
                          setTimeModalContext(current =>
                            current
                              ? {
                                  ...current,
                                  startMinutes: partsToMinutes(
                                    parts.hour12,
                                    parts.minute,
                                    event.target.value as 'AM' | 'PM',
                                  ),
                                }
                              : current,
                          )
                        }
                        className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-base text-[var(--c-1f1f1d)]"
                      >
                        {['AM', 'PM'].map(period => (
                          <option key={`start-${period}`} value={period}>
                            {period}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })()}
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                  End Time
                </p>
                {(() => {
                  const parts = minutesToParts(timeModalContext.endMinutes);
                  return (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <select
                        value={parts.hour12}
                        onChange={event =>
                          setTimeModalContext(current =>
                            current
                              ? {
                                  ...current,
                                  endMinutes: partsToMinutes(
                                    Number(event.target.value),
                                    parts.minute,
                                    parts.meridiem as 'AM' | 'PM',
                                  ),
                                }
                              : current,
                          )
                        }
                        className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-base text-[var(--c-1f1f1d)]"
                      >
                        {Array.from({ length: 12 }).map((_, index) => {
                          const hour = index + 1;
                          return (
                            <option key={`end-hour-${hour}`} value={hour}>
                              {String(hour).padStart(2, '0')}
                            </option>
                          );
                        })}
                      </select>
                      <select
                        value={parts.minute}
                        onChange={event =>
                          setTimeModalContext(current =>
                            current
                              ? {
                                  ...current,
                                  endMinutes: partsToMinutes(
                                    parts.hour12,
                                    Number(event.target.value),
                                    parts.meridiem as 'AM' | 'PM',
                                  ),
                                }
                              : current,
                          )
                        }
                        className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-base text-[var(--c-1f1f1d)]"
                      >
                        {[0, 15, 30, 45].map(value => (
                          <option key={`end-min-${value}`} value={value}>
                            {String(value).padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                      <select
                        value={parts.meridiem}
                        onChange={event =>
                          setTimeModalContext(current =>
                            current
                              ? {
                                  ...current,
                                  endMinutes: partsToMinutes(
                                    parts.hour12,
                                    parts.minute,
                                    event.target.value as 'AM' | 'PM',
                                  ),
                                }
                              : current,
                          )
                        }
                        className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-base text-[var(--c-1f1f1d)]"
                      >
                        {['AM', 'PM'].map(period => (
                          <option key={`end-${period}`} value={period}>
                            {period}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setTimeModalOpen(false)}
                className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyTimeModal}
                disabled={timeModalContext.endMinutes <= timeModalContext.startMinutes}
                className="rounded-full border border-[var(--sidebar-accent-bg)] bg-[var(--sidebar-accent-bg)] px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:border-[var(--c-e5e3dd)] disabled:bg-[var(--c-f1f1ef)] disabled:text-[var(--c-9c978f)]"
              >
                Apply Times
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
