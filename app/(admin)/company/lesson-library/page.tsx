import LessonLibraryView from '../../components/lesson-library-view';

export default function CompanyLessonLibraryPage() {
  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="md:max-w-[50%]">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
            Company
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-[var(--c-1f1f1d)]">
            Curriculum Library
          </h1>
          <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
            A complete view of everything available to teachers and students.
          </p>
        </div>
        <div className="md:pb-1">
          <a
            href="/lesson-pack-builder"
            className="inline-flex items-center justify-center rounded-full border border-[var(--c-1f1f1d)] bg-[var(--c-ffffff)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--c-1f1f1d)] transition hover:border-[var(--c-c8102e)] hover:text-[var(--c-c8102e)]"
          >
            Build Lesson Pack
          </a>
        </div>
      </header>

      <LessonLibraryView
        basePath="/company/lesson-library"
        showLocks={false}
        showPricing
      />
    </div>
  );
}
