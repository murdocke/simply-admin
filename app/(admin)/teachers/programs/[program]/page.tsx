import LockedSectionCard from '../../../components/locked-section-card';
import { getLessonSections, getLessonTypes } from '@/lib/lesson-data';

const toProgramSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export default async function TeacherProgramPage({
  params,
  searchParams,
}: {
  params: Promise<{ program: string }>;
  searchParams?: Promise<{ mode?: string }>;
}) {
  const lessonTypes = getLessonTypes();
  const lessonSections = getLessonSections();
  const { program } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const modeQuery =
    resolvedSearchParams?.mode === 'teaching' ? 'teaching' : 'training';
  const programName =
    lessonTypes.find(type => toProgramSlug(type) === program) ?? null;
  const sectionData =
    programName && lessonSections[programName as keyof typeof lessonSections]
      ? (lessonSections[programName as keyof typeof lessonSections] as
          | string[]
          | Record<string, string[]>)
      : [];
  const sections = Array.isArray(sectionData)
    ? sectionData
    : Object.values(sectionData).flat();
  const splitIndex = Math.ceil(sections.length / 2);
  const columnOne = sections.slice(0, splitIndex);
  const columnTwo = sections.slice(splitIndex);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="md:max-w-[50%]">
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
        </div>
        <div className="flex items-end justify-end">
          <a
            href={`/teachers?mode=${modeQuery}`}
            className="inline-flex items-center justify-center rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
          >
            Back
          </a>
        </div>
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
                      href={`/teachers/programs/${toProgramSlug(programName)}/${toProgramSlug(section)}?mode=${modeQuery}`}
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
                      href={`/teachers/programs/${toProgramSlug(programName)}/${toProgramSlug(section)}?mode=${modeQuery}`}
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
                          href={`/teachers/programs/${toProgramSlug(programName)}/${toProgramSlug(section)}?mode=${modeQuery}`}
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
