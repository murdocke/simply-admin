export default function StudentDashboardPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
          Students
        </p>
        <h1 className="text-3xl font-semibold text-[var(--c-1f1f1d)] mt-2">
          Dashboard
        </h1>
        <p className="text-sm text-[var(--c-6f6c65)] mt-2">
          Your practice snapshot will live here.
        </p>
      </header>

      <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
        <p className="text-sm text-[var(--c-6f6c65)]">
          Add practice goals, lesson notes, and progress updates when ready.
        </p>
      </section>
    </div>
  );
}
