import Link from 'next/link';
import lessonTypes from '../teachers/students/lesson-data/lesson-types.json';
import lessonSections from '../teachers/students/lesson-data/lesson-sections.json';
import lessonMaterials from '../teachers/students/lesson-data/lesson-materials.json';
import MaterialsGrid from './materials/materials-grid';
import LessonSectionGate from './lesson-section-gate';

const toProgramSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

type LessonLibrarySectionProps = {
  basePath: string;
  programSlug: string;
  sectionSlug: string;
  showLocks?: boolean;
  backToRoot?: boolean;
  material?: string | string[];
  part?: string | string[];
};

export default function LessonLibrarySection({
  basePath,
  programSlug,
  sectionSlug,
  showLocks = true,
  backToRoot = false,
  material,
  part,
}: LessonLibrarySectionProps) {
  const programName =
    lessonTypes.find(type => toProgramSlug(type) === programSlug) ?? null;
  const sectionData =
    programName && lessonSections[programName as keyof typeof lessonSections]
      ? lessonSections[programName as keyof typeof lessonSections]
      : [];
  const availableSections = Array.isArray(sectionData)
    ? sectionData
    : Object.values(sectionData).flat();
  const sectionName =
    programName && availableSections.length > 0
      ? availableSections.find(item => toProgramSlug(item) === sectionSlug) ?? null
      : null;
  const materials =
    programName && sectionName
      ? lessonMaterials[
          `${programName}|${sectionName}` as keyof typeof lessonMaterials
        ] ?? []
      : [];
  const initialMaterial =
    typeof material === 'string'
      ? material
      : Array.isArray(material)
        ? material[0]
        : undefined;
  const initialPart =
    typeof part === 'string' ? part : Array.isArray(part) ? part[0] : undefined;

  const content = materials.length > 0 ? (
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
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-3 md:max-w-[50%]">
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
          <div className="flex items-end justify-end">
            <Link
              href={
                backToRoot ? basePath : `${basePath}/${toProgramSlug(programName)}`
              }
              className="inline-flex items-center justify-center rounded-full border border-[var(--c-ecebe7)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[var(--c-c8102e)] hover:text-[var(--c-c8102e)]"
            >
              Back
            </Link>
          </div>
        ) : null}
      </header>

      {programName && sectionName ? (
        showLocks ? (
          <LessonSectionGate programName={programName} sectionName={sectionName}>
            {content}
          </LessonSectionGate>
        ) : (
          content
        )
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
