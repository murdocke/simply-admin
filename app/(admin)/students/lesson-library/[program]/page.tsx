import lessonTypes from '../../../teachers/students/lesson-data/lesson-types.json';
import lessonSections from '../../../teachers/students/lesson-data/lesson-sections.json';
import LockedSectionCard from '../../../components/locked-section-card';

const toProgramSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export default async function StudentProgramPage({
  params,
}: {
  params: Promise<{ program: string }>;
}) {
  const { program } = await params;
  const programName =
    lessonTypes.find(type => toProgramSlug(type) === program) ?? null;
  const sectionData =
    programName && lessonSections[programName as keyof typeof lessonSections]
      ? lessonSections[programName as keyof typeof lessonSections]
      : [];
  const sections = Array.isArray(sectionData)
    ? sectionData
    : Object.values(sectionData).flat();
  const splitIndex = Math.ceil(sections.length / 2);
  const columnOne = sections.slice(0, splitIndex);
  const columnTwo = sections.slice(splitIndex);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
          Curriculum
        </p>
        <h1 className="text-3xl font-semibold text-[var(--c-1f1f1d)]">
          {programName ?? 'Program'}
        </h1>
        <p className="text-sm text-[var(--c-6f6c65)]">
          {programName
            ? 'Lesson sections available for this program.'
            : 'This program could not be found.'}
        </p>
      </header>

      <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
        {programName ? (
          sections.length > 0 ? (
            Array.isArray(sectionData) ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-6">
                <div className="min-w-0 space-y-3">
                  {columnOne.map(section => (
                    <LockedSectionCard
                      key={section}
                      programName={programName}
                      sectionName={section}
                      href={`/students/lesson-library/${toProgramSlug(programName)}/${toProgramSlug(section)}`}
                      className="rounded-xl px-4 py-3"
                    />
                  ))}
                </div>
                <div className="min-w-0 space-y-3">
                  {columnTwo.map(section => (
                    <LockedSectionCard
                      key={section}
                      programName={programName}
                      sectionName={section}
                      href={`/students/lesson-library/${toProgramSlug(programName)}/${toProgramSlug(section)}`}
                      className="rounded-xl px-4 py-3"
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-10">
                {Object.entries(sectionData).map(([group, groupSections]) => (
                  <div key={group} className="space-y-4">
                    <p className="text-sm font-semibold tracking-[0.2em] text-white">
                      {group}
                    </p>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-6">
                        {groupSections.map(section => (
                        <LockedSectionCard
                          key={section}
                          programName={programName}
                          sectionName={section}
                          href={`/students/lesson-library/${toProgramSlug(programName)}/${toProgramSlug(section)}`}
                          className="rounded-xl px-4 py-3"
                        />
                        ))}
                      </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <p className="text-sm text-[var(--c-6f6c65)]">
              No lesson sections yet for this program.
            </p>
          )
        ) : (
          <p className="text-sm text-[var(--c-6f6c65)]">
            Choose a program from the library to view its sections.
          </p>
        )}
      </section>
    </div>
  );
}
