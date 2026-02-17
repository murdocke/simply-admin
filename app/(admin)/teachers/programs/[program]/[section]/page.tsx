import MaterialsGrid from '../../../../components/materials/materials-grid';
import LessonSectionGate from '../../../../components/lesson-section-gate';
import {
  getLessonMaterials,
  getLessonSections,
  getLessonTypes,
} from '@/lib/lesson-data';

const toProgramSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export default async function TeacherProgramSectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ program: string; section: string }>;
  searchParams?: Promise<{ mode?: string }>;
}) {
  const lessonTypes = getLessonTypes();
  const lessonSections = getLessonSections();
  const lessonMaterials = getLessonMaterials();
  const { program, section } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const teacherMode =
    resolvedSearchParams?.mode === 'teaching' ? 'teaching' : 'training';
  const programName =
    lessonTypes.find(type => toProgramSlug(type) === program) ?? null;
  const sectionData =
    programName && lessonSections[programName as keyof typeof lessonSections]
      ? (lessonSections[programName as keyof typeof lessonSections] as
          | string[]
          | Record<string, string[]>)
      : [];
  const availableSections = Array.isArray(sectionData)
    ? sectionData
    : Object.values(sectionData).flat();
  const sectionName =
    programName && availableSections.length > 0
      ? availableSections.find(item => toProgramSlug(item) === section) ?? null
      : null;
  const materials =
    programName && sectionName
      ? lessonMaterials[
          `${programName}|${sectionName}` as keyof typeof lessonMaterials
        ] ?? []
      : [];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-3 md:max-w-[50%]">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
            Program Materials
          </p>
          <h1 className="text-3xl font-semibold text-[var(--c-1f1f1d)]">
            {sectionName ?? 'Section'}
          </h1>
          <p className="text-sm text-[var(--c-6f6c65)]">
            {programName && sectionName
              ? `${programName} materials for this section.`
              : 'This section could not be found.'}
          </p>
        </div>
        {programName ? (
          <div className="flex items-end justify-end">
            <a
              href={`/teachers?mode=${teacherMode}`}
              className="inline-flex items-center justify-center rounded-full border border-[var(--c-ecebe7)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[var(--c-c8102e)] hover:text-[var(--c-c8102e)]"
            >
              Back
            </a>
          </div>
        ) : null}
      </header>

      {programName && sectionName ? (
        <LessonSectionGate programName={programName} sectionName={sectionName}>
          {materials.length > 0 ? (
            <MaterialsGrid materials={materials} mode={teacherMode} />
          ) : (
            <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
              <p className="text-sm text-[var(--c-6f6c65)]">
                No materials listed yet for this section.
              </p>
            </section>
          )}
        </LessonSectionGate>
      ) : (
        <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <p className="text-sm text-[var(--c-6f6c65)]">
            Choose a section from the program library to view materials.
          </p>
        </section>
      )}
    </div>
  );
}
