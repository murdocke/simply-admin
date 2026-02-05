export default function TeacherDashboardPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-[#c8102e]">
          Teachers
        </p>
        <h1 className="text-3xl font-semibold text-[#1f1f1d] mt-2">
          Dashboard
        </h1>
        <p className="text-sm text-[#6f6c65] mt-2">
          Your studio snapshot will live here.
        </p>
      </header>

      <section className="rounded-2xl border border-[#ecebe7] bg-white p-6 shadow-sm">
        <p className="text-sm text-[#6f6c65]">
          Add schedule, student highlights, and lesson notes when ready.
        </p>
      </section>
    </div>
  );
}
