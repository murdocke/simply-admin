'use client';

const THREADS = [
  {
    subject: 'Kenzie progress check-in',
    preview: 'She is nearly ready for the Level 3 milestone...'
  },
  {
    subject: 'Keira practice routine',
    preview: 'Try the 10-10-10 warmup this week.'
  },
  {
    subject: 'Reschedule request',
    preview: 'Looking at Thursday or Friday afternoon.'
  },
];

export default function ParentMessagesPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
          Parent Portal
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--c-1f1f1d)]">
          Messages
        </h1>
        <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
          Keep track of conversations with your teacher and studio team.
        </p>
      </header>

      <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
            Message Threads
          </p>
          <button className="rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)]">
            New Message
          </button>
        </div>
        <div className="mt-5 space-y-3">
          {THREADS.map(thread => (
            <div
              key={thread.subject}
              className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-4"
            >
              <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                {thread.subject}
              </p>
              <p className="mt-2 text-xs text-[var(--c-6f6c65)]">
                {thread.preview}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
