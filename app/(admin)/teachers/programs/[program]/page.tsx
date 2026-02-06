import lessonTypes from '../../students/lesson-data/lesson-types.json';
import lessonSections from '../../students/lesson-data/lesson-sections.json';

const toProgramSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export default async function TeacherProgramPage({
  params,
}: {
  params: Promise<{ program: string }>;
}) {
  const { program } = await params;
  const programName =
    lessonTypes.find(type => toProgramSlug(type) === program) ?? null;
  const sections =
    programName && lessonSections[programName as keyof typeof lessonSections]
      ? lessonSections[programName as keyof typeof lessonSections]
      : [];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
          Program Library
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
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {sections.map(section => (
                <a
                  key={section}
                  href={`/teachers/programs/${toProgramSlug(programName)}/${toProgramSlug(section)}`}
                  className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3 text-sm text-[var(--c-3a3935)] transition hover:border-[color:var(--c-c8102e)]/30 hover:bg-[var(--c-ffffff)]"
                >
                  <p className="font-medium">{section}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                    View materials
                  </p>
                </a>
              ))}
            </div>
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
