'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { Space_Grotesk } from 'next/font/google';

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

const WEEKDAY_TO_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] });

type MeetingType = {
  id: string;
  name: string;
  durationMinutes: number;
  timezoneDefault: string;
  location: string;
  allowPublicReschedule: boolean;
  showSimplyMusicHeader: boolean;
  simplyMusicSubheaderText: string;
  noOvernightSlots: boolean;
};

type Slot = {
  startsAtUtc: string;
  endsAtUtc: string;
  label: string;
  meetingStartLocal: string;
  isBusy?: boolean;
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

const addDays = (date: string, days: number) => {
  const [year, month, day] = date.split('-').map(Number);
  const base = new Date(Date.UTC(year, month - 1, day));
  base.setUTCDate(base.getUTCDate() + days);
  const yyyy = base.getUTCFullYear();
  const mm = String(base.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(base.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const getWeekdayIndexInTimeZone = (date: string, timeZone: string) => {
  const [year, month, day] = date.split('-').map(Number);
  const sample = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
  }).format(sample);
  return WEEKDAY_TO_INDEX[weekday] ?? 0;
};

const getDaysInMonth = (year: number, month: number) =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();

const formatMonthLabel = (year: number, month: number, timeZone: string) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: 'long',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, 1, 12, 0, 0)));

const formatDateTime = (iso: string, timeZone: string) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone,
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(iso));

export default function ScheduleMeetingPage() {
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug');
  const meetingTypeId = searchParams.get('meetingTypeId');
  const userToken = searchParams.get('token');
  const hasUserToken = Boolean(userToken);
  const [meetingType, setMeetingType] = useState<MeetingType | null>(null);
  const [timeZone, setTimeZone] = useState<string>('UTC');
  const [selectedDate, setSelectedDate] = useState('');
  const [calendarMonth, setCalendarMonth] = useState({ year: 0, month: 0 });
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [monthSlots, setMonthSlots] = useState<Record<string, Slot[]>>({});
  const [monthSlotsLoading, setMonthSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [formState, setFormState] = useState({ name: '', email: '', notes: '' });
  const [confirmation, setConfirmation] = useState<Booking | null>(null);
  const [manageLink, setManageLink] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  const isEmailValid = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  useEffect(() => {
    let active = true;
    const loadMeetingType = async () => {
      try {
        const url = new URL('/api/schedule/availability', window.location.origin);
        if (slug) url.searchParams.set('slug', slug);
        if (meetingTypeId) url.searchParams.set('meetingTypeId', meetingTypeId);
        url.searchParams.set('public', '1');
        const response = await fetch(url.toString(), { cache: 'no-store' });
        if (!response.ok) throw new Error('Unable to load meeting type.');
        const data = (await response.json()) as { meetingType: MeetingType };
        if (!active) return;
        setMeetingType(data.meetingType);
        const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const initialZone = detected || data.meetingType.timezoneDefault;
        setTimeZone(initialZone);
        const today = getTodayInTimeZone(initialZone);
        setSelectedDate(today);
        const [year, month] = today.split('-').map(Number);
        setCalendarMonth({ year, month });
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unable to load meeting type.');
      }
    };
    void loadMeetingType();
    return () => {
      active = false;
    };
  }, [slug, meetingTypeId]);

  useEffect(() => {
    if (!selectedDate) return;
    const [year, month] = selectedDate.split('-').map(Number);
    setCalendarMonth(current =>
      current.year !== year || current.month !== month ? { year, month } : current,
    );
  }, [selectedDate]);

  useEffect(() => {
    let active = true;
    const loadSlots = async () => {
      if (!meetingType || !selectedDate) return;
      setSlotsLoading(true);
      setBookingError('');
      try {
        const url = new URL('/api/schedule/slots', window.location.origin);
        url.searchParams.set('date', selectedDate);
        url.searchParams.set('timezone', timeZone);
        if (slug) url.searchParams.set('slug', slug);
        if (meetingTypeId) url.searchParams.set('meetingTypeId', meetingTypeId);
        const response = await fetch(url.toString(), { cache: 'no-store' });
        if (!response.ok) throw new Error('Unable to load slots.');
        const data = (await response.json()) as { days: Array<{ slots: Slot[] }> };
        if (!active) return;
        const nextSlots = data.days?.[0]?.slots ?? [];
        if (selectedDate === getTodayInTimeZone(timeZone) && nextSlots.length === 0) {
          setSelectedDate(addDays(selectedDate, 1));
          return;
        }
        setSlots(nextSlots);
        setSelectedSlot(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unable to load available slots.');
      } finally {
        if (active) setSlotsLoading(false);
      }
    };
    void loadSlots();
    return () => {
      active = false;
    };
  }, [meetingType, selectedDate, timeZone, slug, meetingTypeId]);

  useEffect(() => {
    let active = true;
    const loadMonthSlots = async () => {
      if (!meetingType || !calendarMonth.year || !calendarMonth.month) return;
      setMonthSlotsLoading(true);
      try {
        const startDate = `${calendarMonth.year}-${String(calendarMonth.month).padStart(
          2,
          '0',
        )}-01`;
        const days = getDaysInMonth(calendarMonth.year, calendarMonth.month);
        const url = new URL('/api/schedule/slots', window.location.origin);
        url.searchParams.set('startDate', startDate);
        url.searchParams.set('days', String(days));
        url.searchParams.set('timezone', timeZone);
        if (slug) url.searchParams.set('slug', slug);
        if (meetingTypeId) url.searchParams.set('meetingTypeId', meetingTypeId);
        const response = await fetch(url.toString(), { cache: 'no-store' });
        if (!response.ok) throw new Error('Unable to load month slots.');
        const data = (await response.json()) as { days: Array<{ date: string; slots: Slot[] }> };
        if (!active) return;
        const next: Record<string, Slot[]> = {};
        data.days?.forEach(day => {
          next[day.date] = day.slots ?? [];
        });
        setMonthSlots(next);
      } catch {
        if (!active) return;
        setMonthSlots({});
      } finally {
        if (active) setMonthSlotsLoading(false);
      }
    };
    void loadMonthSlots();
    return () => {
      active = false;
    };
  }, [meetingType, calendarMonth, timeZone, slug, meetingTypeId]);


  const meetingSummary = useMemo(() => {
    if (!meetingType) return '';
    return `${meetingType.name} · ${meetingType.durationMinutes} minutes`;
  }, [meetingType]);

  const requireContactInfo = !hasUserToken;
  const canConfirmBooking =
    !!selectedSlot &&
    !bookingLoading &&
    (!requireContactInfo ||
      (formState.name.trim().length > 0 && isEmailValid(formState.email)));

  const handleSelectSlot = (slot: Slot) => {
    if (slot.isBusy) return;
    setSelectedSlot(slot);
  };

  const handleBooking = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedSlot || !meetingType) return;
    setBookingError('');
    setBookingLoading(true);
    try {
      const response = await fetch('/api/schedule/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingTypeId: meetingType.id,
          slug,
          date: selectedDate,
          timezone: timeZone,
          startsAtUtc: selectedSlot.startsAtUtc,
          name: formState.name,
          email: formState.email,
          notes: formState.notes,
        }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? 'Unable to book this time.');
      }
      const data = (await response.json()) as { booking: Booking };
      setConfirmation(data.booking);
      if (data.booking.publicToken && typeof window !== 'undefined') {
        const link = `${window.location.origin}/schedule-manage?token=${data.booking.publicToken}`;
        setManageLink(link);
      } else {
        setManageLink(null);
      }
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Unable to book this time.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (error) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6">
        <p className="text-sm text-[var(--c-b42318)]">{error}</p>
      </div>
    );
  }

  if (!meetingType) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-24 animate-pulse rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)]" />
        <div className="h-96 animate-pulse rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)]" />
      </div>
    );
  }

  if (confirmation) {
    return (
      <div className="mx-auto max-w-3xl pt-6">
        {meetingType.showSimplyMusicHeader ? (
          <div className="mb-6 text-center">
            <p
              className={`${spaceGrotesk.className} text-4xl font-semibold tracking-tight text-[var(--c-1f1f1d)] sm:text-6xl`}
            >
              Simply Music
            </p>
            <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-[var(--c-c8102e)]" />
            {meetingType.simplyMusicSubheaderText ? (
              <p className="mt-4 text-lg text-[var(--c-6f6c65)] sm:text-xl">
                {meetingType.simplyMusicSubheaderText}
              </p>
            ) : null}
          </div>
        ) : null}
        <div className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-8 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
            Confirmed
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-[var(--c-1f1f1d)]">
            You are booked!
          </h1>
          <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
            We sent a confirmation to {confirmation.email}.
          </p>
          <div className="mt-6 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-4">
            <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
              {meetingSummary}
            </p>
            <p className="mt-1 text-sm text-[var(--c-6f6c65)]">
              {formatDateTime(confirmation.startsAtUtc, timeZone)}
            </p>
            <p className="mt-2 text-xs text-[var(--c-9a9892)]">
              Join link will appear once Zoom is connected.
            </p>
            {manageLink ? (
              <p className="mt-2 text-xs text-[var(--c-6f6c65)]">
                Need to reschedule or cancel? Use your manage link:{' '}
                <span className="font-semibold">{manageLink}</span>
              </p>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pt-6">
      {meetingType.showSimplyMusicHeader ? (
        <div className="text-center">
          <p
            className={`${spaceGrotesk.className} text-4xl font-semibold tracking-tight text-[var(--c-1f1f1d)] sm:text-6xl`}
          >
            Simply Music
          </p>
          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-[var(--c-c8102e)]" />
          {meetingType.simplyMusicSubheaderText ? (
            <p className="mt-4 text-lg text-[var(--c-6f6c65)] sm:text-xl">
              {meetingType.simplyMusicSubheaderText}
            </p>
          ) : null}
        </div>
      ) : null}
      <section className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
          Book a Meeting
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--c-1f1f1d)]">
          {meetingType.name}
        </h1>
        <p className="mt-2 text-lg font-semibold text-[var(--c-6f6c65)]">
          {meetingSummary} · {meetingType.location}
        </p>
      </section>

      <section className="grid items-stretch gap-5 lg:grid-cols-[1.1fr_1fr] lg:grid-rows-[auto_auto]">
        <div className="space-y-5 lg:col-start-1 lg:row-start-1">
          <div className="h-full rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
              Step 1
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
              Choose a date
            </h2>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-[var(--c-e5e3dd)] bg-[var(--c-fcfcfb)] px-4 py-3 text-sm text-[var(--c-6f6c65)]">
                Times shown in your timezone: <span className="font-semibold">{timeZone}</span>
              </div>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Timezone
                <div className="relative mt-2">
                  <select
                    value={timeZone}
                    onChange={event => {
                      setTimeZone(event.target.value);
                    }}
                    className="w-full appearance-none rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 pr-10 text-sm text-[var(--c-1f1f1d)]"
                  >
                    {[timeZone, ...TIMEZONES.filter(zone => zone !== timeZone)].map(zone => (
                      <option key={zone} value={zone}>
                        {zone}
                      </option>
                    ))}
                  </select>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--c-9a9892)]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 8l4 4 4-4" />
                  </svg>
                </div>
              </label>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                Date
                <div className="mt-2 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-3 shadow-[0_14px_30px_-24px_rgba(47,40,35,0.45)]">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        const prevMonth = calendarMonth.month === 1 ? 12 : calendarMonth.month - 1;
                        const prevYear =
                          calendarMonth.month === 1 ? calendarMonth.year - 1 : calendarMonth.year;
                        setCalendarMonth({ year: prevYear, month: prevMonth });
                      }}
                      className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[var(--c-3a3935)] hover:text-[var(--c-3a3935)]"
                      aria-label="Previous month"
                    >
                      Prev
                    </button>
                    <div className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                      {formatMonthLabel(calendarMonth.year, calendarMonth.month, timeZone)}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextMonth = calendarMonth.month === 12 ? 1 : calendarMonth.month + 1;
                        const nextYear =
                          calendarMonth.month === 12 ? calendarMonth.year + 1 : calendarMonth.year;
                        setCalendarMonth({ year: nextYear, month: nextMonth });
                      }}
                      className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[var(--c-3a3935)] hover:text-[var(--c-3a3935)]"
                      aria-label="Next month"
                    >
                      Next
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-7 gap-2 text-[10px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                    {WEEKDAYS.map(day => (
                      <div key={day} className="text-center">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 grid grid-cols-7 gap-2">
                    {(() => {
                      const { year, month } = calendarMonth;
                      const daysInMonth = getDaysInMonth(year, month);
                      const firstDate = `${year}-${String(month).padStart(2, '0')}-01`;
                      const firstDayIndex = getWeekdayIndexInTimeZone(firstDate, timeZone);
                      const today = getTodayInTimeZone(timeZone);
                      const maxDate = meetingType
                        ? addDays(today, meetingType.maxHorizonDays)
                        : today;
                      const blanks = Array.from({ length: firstDayIndex });
                      const days = Array.from({ length: daysInMonth }, (_, index) => {
                        const dayNumber = index + 1;
                        const dateValue = `${year}-${String(month).padStart(2, '0')}-${String(
                          dayNumber,
                        ).padStart(2, '0')}`;
                        const isSelected = dateValue === selectedDate;
                        const isPast = dateValue < today;
                        const isTooFar = dateValue > maxDate;
                        const daySlots = monthSlots[dateValue] ?? [];
                        const hasOpenSlots = daySlots.some(slot => !slot.isBusy);
                        const hasSlots =
                          meetingType?.availabilityMode === 'busy'
                            ? daySlots.length > 0
                            : hasOpenSlots;
                        const noSlots = !monthSlotsLoading && !hasSlots;
                        const isDisabled = isPast || isTooFar || noSlots;
                        return (
                          <button
                            key={dateValue}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => {
                              if (!isDisabled) setSelectedDate(dateValue);
                            }}
                            className={`h-10 rounded-2xl text-sm font-semibold transition ${
                              isSelected
                                ? 'bg-[var(--c-2d6a4f)] text-white shadow-[0_10px_18px_-12px_rgba(45,106,79,0.6)]'
                                : isDisabled
                                  ? 'border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] text-[var(--c-9a9892)] opacity-70'
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
                  <div className="mt-3 text-xs text-[var(--c-6f6c65)]">
                    Selected: <span className="font-semibold">{selectedDate}</span>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm lg:col-start-1 lg:row-start-2">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
            Step 2
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
            Select a time
          </h2>
          {slotsLoading ? (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={`slot-skeleton-${index}`}
                  className="h-10 animate-pulse rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)]"
                />
              ))}
            </div>
          ) : slots.length ? (
            <div className="mt-4 grid grid-cols-2 gap-2">
                {slots.map(slot => (
                  <button
                    key={slot.startsAtUtc}
                    type="button"
                    disabled={slot.isBusy}
                    onClick={() => {
                      if (!slot.isBusy) handleSelectSlot(slot);
                    }}
                    className={`rounded-2xl border px-3 py-2 text-sm font-semibold uppercase tracking-[0.2em] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-c8102e)] ${
                      selectedSlot?.startsAtUtc === slot.startsAtUtc
                        ? 'border-[var(--c-2d6a4f)] bg-[var(--c-e7eddc)] text-[var(--c-2d6a4f)]'
                      : slot.isBusy
                        ? 'border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] text-[var(--c-9a9892)] opacity-70'
                        : 'border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] text-[var(--c-6f6c65)] hover:border-[var(--c-3a3935)] hover:bg-[var(--c-f7f7f5)] hover:text-[var(--c-3a3935)] hover:shadow-[0_6px_18px_-12px_rgba(27,22,18,0.35)]'
                  }`}
                  aria-pressed={selectedSlot?.startsAtUtc === slot.startsAtUtc}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-[var(--c-6f6c65)]">
              No times available. Try another date.
            </p>
          )}
        </div>

        <div className="h-full rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm lg:col-start-2 lg:row-start-1">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
            Step 3
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
            Enter your details
          </h2>
          {selectedSlot ? (
            <div className="mt-4 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                Selected Time
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--c-1f1f1d)]">
                {formatDateTime(selectedSlot.startsAtUtc, timeZone)}
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-[var(--c-6f6c65)]">
              Pick a time to continue.
            </p>
          )}
          <form className="mt-4 grid gap-3" onSubmit={handleBooking}>
            <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
              Name
              <input
                type="text"
                value={formState.name}
                onChange={event =>
                  setFormState(current => ({ ...current, name: event.target.value }))
                }
                required={requireContactInfo}
                className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
              Email
              <input
                type="email"
                value={formState.email}
                onChange={event =>
                  setFormState(current => ({ ...current, email: event.target.value }))
                }
                required={requireContactInfo}
                className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
              Notes (optional)
              <textarea
                value={formState.notes}
                onChange={event =>
                  setFormState(current => ({ ...current, notes: event.target.value }))
                }
                className="mt-2 min-h-[90px] w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm"
              />
            </label>
            {bookingError ? (
              <p className="text-sm text-[var(--c-b42318)]" role="alert">
                {bookingError}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={!canConfirmBooking}
              className="rounded-full border border-[var(--c-2d6a4f)] bg-[var(--c-2d6a4f)] px-4 py-2 text-2xl font-semibold uppercase tracking-[0.2em] text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:border-[var(--c-e5e3dd)] disabled:bg-[var(--c-f1f1ef)] disabled:text-[var(--c-9c978f)]"
            >
              {bookingLoading ? 'Booking...' : 'Confirm Booking'}
            </button>
          </form>
        </div>
        <div className="hidden lg:block lg:col-start-2 lg:row-start-2" />
      </section>
    </div>
  );
}
