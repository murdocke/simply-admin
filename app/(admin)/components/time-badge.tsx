'use client';

import { useEffect, useMemo, useState } from 'react';

export default function TimeBadge({
  label,
  timeZone,
}: {
  label: string;
  timeZone: string;
}) {
  const [now, setNow] = useState(() => new Date());
  const timeParts = useMemo(() => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      minute: '2-digit',
    }).formatToParts(now);
    const hour = parts.find(part => part.type === 'hour')?.value ?? '';
    const minute = parts.find(part => part.type === 'minute')?.value ?? '';
    const dayPeriod = parts.find(part => part.type === 'dayPeriod')?.value ?? '';
    return { hour, minute, dayPeriod };
  }, [now, timeZone]);
  const date = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        timeZone,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).format(now),
    [now, timeZone],
  );

  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = window.setInterval(tick, 1_000);
    return () => window.clearInterval(id);
  }, []);
  const isTick = now.getSeconds() % 2 === 0;

  return (
    <div className="select-none rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-3 shadow-sm">
      <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
        <span>{timeParts.hour}</span>
        <span
          className={`mx-1 inline-block transition-all duration-300 ${
            isTick ? 'scale-110 text-[var(--c-c8102e)]' : 'opacity-40'
          }`}
          aria-hidden
        >
          :
        </span>
        <span>{timeParts.minute}</span>
        {timeParts.dayPeriod ? (
          <span className="ml-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
            {timeParts.dayPeriod}
          </span>
        ) : null}
      </p>
      <p className="mt-1 text-xs text-[var(--c-6f6c65)]">{date}</p>
    </div>
  );
}
