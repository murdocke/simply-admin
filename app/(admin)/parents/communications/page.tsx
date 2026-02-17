'use client';

const COMMUNICATIONS = [
  {
    title: 'Studio update',
    date: 'Feb 12',
    body: 'Next week we will focus on dynamics and touch. Please bring practice journals.',
  },
  {
    title: 'Practice challenge',
    date: 'Feb 10',
    body: 'Complete three focused 20-minute sessions this week. Track streaks in the app.',
  },
  {
    title: 'Recital save-the-date',
    date: 'Feb 7',
    body: 'Spring recital is scheduled for March 23. More details coming soon.',
  },
];

export default function ParentCommunicationsPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
          Parent Portal
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--c-1f1f1d)]">
          Communications
        </h1>
        <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
          Studio announcements, practice challenges, and upcoming events.
        </p>
      </header>

      <section className="grid gap-4">
        {COMMUNICATIONS.map(item => (
          <article
            key={item.title}
            className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--c-1f1f1d)]">
                {item.title}
              </h2>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                {item.date}
              </span>
            </div>
            <p className="mt-3 text-sm text-[var(--c-6f6c65)]">{item.body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
