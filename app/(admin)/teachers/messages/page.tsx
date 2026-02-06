export default function TeacherMessagesPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
          Teachers
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--c-1f1f1d)]">
          Messages
        </h1>
        <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
          Conversation threads with students and studio staff.
        </p>
      </header>

      <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
        <p className="text-sm text-[var(--c-6f6c65)]">
          Placeholder view for messages.
        </p>
      </section>
    </div>
  );
}
