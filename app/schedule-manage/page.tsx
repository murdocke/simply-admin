'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';

const TIMEZONES = [
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'Europe/London',
  'Europe/Paris',
  'Australia/Sydney',
  'Pacific/Auckland',
];

type Booking = {
  id: string;
  meetingTypeId: string;
  startsAtUtc: string;
  endsAtUtc: string;
  name: string;
  email: string;
  notes: string;
  status: string;
  publicToken: string;
  bookingTimezone: string | null;
  zoomJoinUrl: string | null;
  zoomStartUrl: string | null;
  createdAt: string;
  meetingName: string;
  meetingLocation: string;
};

type Slot = {
  startsAtUtc: string;
  endsAtUtc: string;
  label: string;
  meetingStartLocal: string;
  isBusy?: boolean;
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

const formatDateTime = (iso: string, timeZone: string) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone,
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(iso));

export default function ScheduleManagePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [timeZone, setTimeZone] = useState('UTC');
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [timeModalOpen, setTimeModalOpen] = useState(false);
  const [pendingSlot, setPendingSlot] = useState<Slot | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    if (!timeModalOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setTimeModalOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [timeModalOpen]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!token) return;
      setStatus('loading');
      try {
        const url = new URL('/api/schedule/manage', window.location.origin);
        url.searchParams.set('token', token);
        const response = await fetch(url.toString(), { cache: 'no-store' });
        if (!response.ok) throw new Error('Unable to load booking.');
        const data = (await response.json()) as { booking: Booking };
        if (!active) return;
        setBooking(data.booking);
        const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const initialZone = detected || 'UTC';
        setTimeZone(initialZone);
        setSelectedDate(getTodayInTimeZone(initialZone));
        setStatus('ready');
      } catch (err) {
        if (!active) return;
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Unable to load booking.');
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    let active = true;
    const loadSlots = async () => {
      if (!booking || !selectedDate) return;
      setSlotsLoading(true);
      try {
        const url = new URL('/api/schedule/slots', window.location.origin);
        url.searchParams.set('meetingTypeId', booking.meetingTypeId);
        url.searchParams.set('date', selectedDate);
        url.searchParams.set('timezone', timeZone);
        const response = await fetch(url.toString(), { cache: 'no-store' });
        if (!response.ok) throw new Error('Unable to load slots.');
        const data = (await response.json()) as { days: Array<{ slots: Slot[] }> };
        if (!active) return;
        setSlots(data.days?.[0]?.slots ?? []);
        setSelectedSlot(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unable to load slots.');
      } finally {
        if (active) setSlotsLoading(false);
      }
    };
    void loadSlots();
    return () => {
      active = false;
    };
  }, [booking, selectedDate, timeZone]);

  const bookingSummary = useMemo(() => {
    if (!booking) return '';
    return `${booking.meetingName} · ${booking.meetingLocation}`;
  }, [booking]);

  const handleCancel = async () => {
    if (!token) return;
    setSaving(true);
    setActionMessage('');
    try {
      const response = await fetch('/api/schedule/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', token }),
      });
      if (!response.ok) throw new Error('Unable to cancel booking.');
      setActionMessage('Your booking has been canceled.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to cancel booking.');
    } finally {
      setSaving(false);
    }
  };

  const handleReschedule = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !selectedSlot) return;
    setSaving(true);
    setActionMessage('');
    try {
      const response = await fetch('/api/schedule/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reschedule',
          token,
          date: selectedDate,
          timezone: timeZone,
          startsAtUtc: selectedSlot.startsAtUtc,
        }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? 'Unable to reschedule.');
      }
      setActionMessage('Your booking has been rescheduled.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reschedule.');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-24 animate-pulse rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)]" />
        <div className="h-96 animate-pulse rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)]" />
      </div>
    );
  }

  if (status === 'error' || !booking) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6">
        <p className="text-sm text-[var(--c-b42318)]">{error || 'Booking not found.'}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
          Manage Booking
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--c-1f1f1d)]">
          {booking.meetingName}
        </h1>
        <p className="mt-2 text-sm text-[var(--c-6f6c65)]">{bookingSummary}</p>
        <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
          Current time: {formatDateTime(booking.startsAtUtc, timeZone)}
        </p>
        {actionMessage ? (
          <div className="mt-4 rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3 text-sm text-[var(--c-6f6c65)]">
            {actionMessage}
          </div>
        ) : null}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">Reschedule</p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
            Pick a new time
          </h2>
          <div className="mt-4 grid gap-3">
            <label className="text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
              Timezone
              <select
                value={timeZone}
                onChange={event => setTimeZone(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-2 text-sm"
              >
                {[timeZone, ...TIMEZONES.filter(zone => zone !== timeZone)].map(zone => (
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
                value={selectedDate}
                onChange={event => setSelectedDate(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[var(--c-ecebe7)] px-3 py-2 text-sm"
              />
            </label>
          </div>
          <div className="mt-4">
            {slotsLoading ? (
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={`slot-${index}`}
                    className="h-10 animate-pulse rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)]"
                  />
                ))}
              </div>
            ) : slots.length ? (
              <div className="grid grid-cols-2 gap-2">
                {slots.map(slot => (
                  <button
                    key={slot.startsAtUtc}
                    type="button"
                    disabled={slot.isBusy}
                    onClick={() => {
                      if (!slot.isBusy) {
                        setPendingSlot(slot);
                        setTimeModalOpen(true);
                      }
                    }}
                    className={`rounded-2xl border px-3 py-2 text-sm font-semibold uppercase tracking-[0.2em] transition-colors duration-150 ${
                      selectedSlot?.startsAtUtc === slot.startsAtUtc
                        ? 'border-[var(--c-c8102e)] bg-[var(--c-fff1f3)] text-[var(--c-c8102e)]'
                        : slot.isBusy
                          ? 'border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] text-[var(--c-9a9892)] opacity-70'
                          : 'border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] text-[var(--c-6f6c65)] hover:border-[var(--c-3a3935)] hover:bg-[var(--c-f7f7f5)] hover:text-[var(--c-3a3935)] hover:shadow-[0_6px_18px_-12px_rgba(27,22,18,0.35)]'
                    }`}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--c-6f6c65)]">No times available.</p>
            )}
          </div>
          <form className="mt-4" onSubmit={handleReschedule}>
            <button
              type="submit"
              disabled={!selectedSlot || saving}
              className="rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? 'Saving...' : 'Confirm Reschedule'}
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">Cancel</p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
            Need to cancel?
          </h2>
          <p className="mt-3 text-sm text-[var(--c-6f6c65)]">
            You can cancel your booking here. We will notify the host automatically.
          </p>
          <button
            type="button"
            onClick={() => void handleCancel()}
            disabled={saving}
            className="mt-4 rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
          >
            Cancel Booking
          </button>
        </div>
      </section>
      {timeModalOpen ? (
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
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                  Select a time
                </p>
                <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                  {selectedDate
                    ? formatDateTime(`${selectedDate}T12:00:00Z`, timeZone)
                    : 'Pick a date'}{' '}
                  · {timeZone}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTimeModalOpen(false)}
                className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
              >
                Close
              </button>
            </div>

            <div className="mt-5">
              {slotsLoading ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {Array.from({ length: 9 }).map((_, index) => (
                    <div
                      key={`slot-modal-skeleton-${index}`}
                      className="h-10 animate-pulse rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)]"
                    />
                  ))}
                </div>
              ) : slots.length ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {slots.map(slot => (
                    <button
                      key={slot.startsAtUtc}
                      type="button"
                      disabled={slot.isBusy}
                      onClick={() => {
                        if (!slot.isBusy) setPendingSlot(slot);
                      }}
                      className={`rounded-2xl border px-3 py-2 text-sm font-semibold uppercase tracking-[0.2em] transition-colors duration-150 ${
                        pendingSlot?.startsAtUtc === slot.startsAtUtc
                          ? 'border-[var(--c-c8102e)] bg-[var(--c-fff1f3)] text-[var(--c-c8102e)]'
                          : slot.isBusy
                            ? 'border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] text-[var(--c-9a9892)] opacity-70'
                            : 'border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] text-[var(--c-6f6c65)] hover:border-[var(--c-3a3935)] hover:bg-[var(--c-f7f7f5)] hover:text-[var(--c-3a3935)] hover:shadow-[0_6px_18px_-12px_rgba(27,22,18,0.35)]'
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

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setTimeModalOpen(false)}
                className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!pendingSlot || pendingSlot.isBusy) return;
                  setSelectedSlot(pendingSlot);
                  setTimeModalOpen(false);
                }}
                disabled={!pendingSlot || pendingSlot.isBusy}
                className="rounded-full border border-[var(--c-c8102e)] bg-[var(--c-c8102e)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:border-[var(--c-e5e3dd)] disabled:bg-[var(--c-f1f1ef)] disabled:text-[var(--c-9c978f)]"
              >
                Use This Time
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
