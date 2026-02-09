import LessonLibraryView from '../../components/lesson-library-view';

export default function StudentLessonLibraryPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
          Students
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--c-1f1f1d)]">
          Lesson Library
        </h1>
        <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
          Explore the curriculum and open a section to start learning.
        </p>
      </header>

      <LessonLibraryView basePath="/students/lesson-library" showCartButton />
    </div>
  );
}
