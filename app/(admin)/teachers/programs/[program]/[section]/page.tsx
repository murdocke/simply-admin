import lessonTypes from '../../../students/lesson-data/lesson-types.json';
import lessonSections from '../../../students/lesson-data/lesson-sections.json';
import lessonMaterials from '../../../students/lesson-data/lesson-materials.json';

const toProgramSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export default async function TeacherProgramSectionPage({
  params,
}: {
  params: Promise<{ program: string; section: string }>;
}) {
  const { program, section } = await params;
  const programName =
    lessonTypes.find(type => toProgramSlug(type) === program) ?? null;
  const availableSections =
    programName && lessonSections[programName as keyof typeof lessonSections]
      ? lessonSections[programName as keyof typeof lessonSections]
      : [];
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
    <div className="space-y-8">
      <header className="flex flex-col gap-3">
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
      </header>

      <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
        {programName && sectionName ? (
          materials.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {materials.map(material => (
                <div
                  key={material}
                  className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3 text-sm text-[var(--c-3a3935)]"
                >
                  {material}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--c-6f6c65)]">
              No materials listed yet for this section.
            </p>
          )
        ) : (
          <p className="text-sm text-[var(--c-6f6c65)]">
            Choose a section from the program library to view materials.
          </p>
        )}
      </section>
    </div>
  );
}
