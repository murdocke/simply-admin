export default function StudentDashboardPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-[#c8102e]">
          Students
        </p>
        <h1 className="text-3xl font-semibold text-[#1f1f1d] mt-2">
          Dashboard
        </h1>
        <p className="text-sm text-[#6f6c65] mt-2">
          Your practice snapshot will live here.
        </p>
      </header>

      <section className="rounded-2xl border border-[#ecebe7] bg-white p-6 shadow-sm">
        <p className="text-sm text-[#6f6c65]">
          Add practice goals, lesson notes, and progress updates when ready.
        </p>
      </section>
    </div>
  );
}
