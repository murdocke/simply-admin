import Link from 'next/link';
import lessonTypes from '../teachers/students/lesson-data/lesson-types.json';
import lessonSections from '../teachers/students/lesson-data/lesson-sections.json';
import LockedSectionCard from './locked-section-card';

const toProgramSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

type LessonLibraryProgramProps = {
  basePath: string;
  programSlug: string;
  showLocks?: boolean;
};

function UnlockedSectionCard({
  sectionName,
  href,
  className = '',
}: {
  sectionName: string;
  href: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`block w-full rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] text-left transition hover:border-white hover:bg-[var(--c-fcfcfb)] ${className}`}
    >
      <div className="px-4 py-3">
        <p className="text-sm font-medium text-[var(--c-1f1f1d)]">
          {sectionName}
        </p>
        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[var(--c-2d6a4f)]">
          View materials
        </p>
      </div>
    </Link>
  );
}

export default function LessonLibraryProgram({
  basePath,
  programSlug,
  showLocks = true,
}: LessonLibraryProgramProps) {
  const programName =
    lessonTypes.find(type => toProgramSlug(type) === programSlug) ?? null;
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

  const renderSectionCard = (sectionName: string) => {
    const href = `${basePath}/${toProgramSlug(programName ?? programSlug)}/${toProgramSlug(sectionName)}`;
    return showLocks && programName ? (
      <LockedSectionCard
        programName={programName}
        sectionName={sectionName}
        href={href}
        className="rounded-xl px-4 py-3"
      />
    ) : (
      <UnlockedSectionCard sectionName={sectionName} href={href} />
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="md:max-w-[50%]">
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
        </div>
        <div className="flex items-end justify-end">
          <Link
            href={basePath}
            className="inline-flex items-center justify-center rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
          >
            Back
          </Link>
        </div>
      </header>
      <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
        {programName ? (
          sections.length > 0 ? (
            Array.isArray(sectionData) ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-6">
                <div className="min-w-0 space-y-3">
                  {columnOne.map(section => (
                    <div key={section}>{renderSectionCard(section)}</div>
                  ))}
                </div>
                <div className="min-w-0 space-y-3">
                  {columnTwo.map(section => (
                    <div key={section}>{renderSectionCard(section)}</div>
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
                        <div key={section}>{renderSectionCard(section)}</div>
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
