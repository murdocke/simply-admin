import Link from 'next/link';

export default function StudentWhatToPracticePage() {
  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
          Students
        </p>
        <h1 className="text-3xl font-semibold text-[var(--c-1f1f1d)]">
          What To Practice
        </h1>
        <p className="text-sm text-[var(--c-6f6c65)]">
          This content now lives in Practice Hub.
        </p>
      </header>

      <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
              Head to Practice Hub to view your teacher’s plan.
            </p>
            <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
              Everything from the old What To Practice page is now there.
            </p>
          </div>
          <Link
            href="/students/practice-hub"
            className="rounded-full bg-[var(--c-111111)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white"
          >
            Open Practice Hub
          </Link>
        </div>
      </section>
    </div>
  );
}
