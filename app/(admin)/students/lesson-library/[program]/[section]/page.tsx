import lessonTypes from '../../../../teachers/students/lesson-data/lesson-types.json';
import lessonSections from '../../../../teachers/students/lesson-data/lesson-sections.json';
import lessonMaterials from '../../../../teachers/students/lesson-data/lesson-materials.json';
import MaterialsGrid from '../../../../components/materials/materials-grid';
import LessonSectionGate from '../../../../components/lesson-section-gate';

const toProgramSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export default async function StudentProgramSectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ program: string; section: string }>;
  searchParams: Promise<{ material?: string; part?: string }>;
}) {
  const { program, section } = await params;
  const { material, part } = (await searchParams) ?? {};
  const programName =
    lessonTypes.find(type => toProgramSlug(type) === program) ?? null;
  const sectionData =
    programName && lessonSections[programName as keyof typeof lessonSections]
      ? lessonSections[programName as keyof typeof lessonSections]
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
  const initialMaterial =
    typeof material === 'string' ? material : Array.isArray(material) ? material[0] : undefined;
  const initialPart =
    typeof part === 'string' ? part : Array.isArray(part) ? part[0] : undefined;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
          Curriculum
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
          <a
            href={`/students/lesson-library/${toProgramSlug(programName)}`}
            className="mt-2 inline-flex items-center justify-center rounded-full border border-[var(--c-ecebe7)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[var(--c-c8102e)] hover:text-[var(--c-c8102e)] sm:mt-0"
          >
            Back
          </a>
        ) : null}
      </header>

      {programName && sectionName ? (
        <LessonSectionGate programName={programName} sectionName={sectionName}>
          {materials.length > 0 ? (
            <MaterialsGrid
              materials={materials}
              mode="learning"
              initialMaterial={initialMaterial}
              initialPart={initialPart}
            />
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
