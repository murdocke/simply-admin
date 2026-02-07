import Link from 'next/link';
import lessonTypes from '../../teachers/students/lesson-data/lesson-types.json';
import lessonSections from '../../teachers/students/lesson-data/lesson-sections.json';
import LockedSectionCard from '../../components/locked-section-card';
import LessonCartPurchaseButton from '../../components/lesson-cart-actions';

const toProgramSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

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

      <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
              Curriculum
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
              Program Library
            </h2>
            <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
              Browse each program and open a section to see materials.
            </p>
          </div>
          <div className="md:pt-4">
            <LessonCartPurchaseButton />
          </div>
        </div>
        <div className="mt-6 space-y-6">
          {lessonTypes
            .filter(
              type =>
                type !== 'Learn-at-Home' && type !== 'Simply Music Gateway',
            )
            .map(type => {
            const sectionData =
              lessonSections[type as keyof typeof lessonSections];
            const sections = Array.isArray(sectionData)
              ? sectionData
              : sectionData
                ? Object.values(sectionData).flat()
                : [];
            return (
              <div
                key={type}
                id={type === 'Development Program' ? 'development-program' : undefined}
                className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="w-full">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                      {type}
                    </p>
                    <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                      {sections.length > 0
                        ? 'Choose a section to view materials.'
                        : 'No sections available yet.'}
                    </p>
                    {type === 'Extensions Program' ? (
                      <p className="mt-3 text-sm text-[var(--c-6f6c65)]">
                        The Extensions Program is a further collection of
                        pieces that provide additional source material for both
                        beginning or more advanced students. It consists of new
                        or re-purposed compositions and arrangements, many of
                        which have two or three presentation versions provided,
                        each pertaining to students who may be at different
                        stages of their learning.
                      </p>
                    ) : null}
                  </div>
                  <div className="sm:pt-1">
                    <Link
                      href={`/students/lesson-library/${toProgramSlug(type)}`}
                      className="inline-flex items-center whitespace-nowrap rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-1.5 text-[12px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
                    >
                      View all
                    </Link>
                  </div>
                </div>
                {sections.length > 0 ? (
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                    {Array.isArray(sectionData) ? (
                      <>
                        <div className="min-w-0 space-y-4">
                          {sections
                            .slice(0, Math.ceil(sections.length / 2))
                            .map(section => (
                                <LockedSectionCard
                                  key={section}
                                  programName={type}
                                  sectionName={section}
                                  href={`/students/lesson-library/${toProgramSlug(type)}/${toProgramSlug(section)}`}
                                />
                              ))}
                          </div>
                          <div className="min-w-0 space-y-4">
                            {sections
                              .slice(Math.ceil(sections.length / 2))
                              .map(section => (
                                <LockedSectionCard
                                  key={section}
                                  programName={type}
                                  sectionName={section}
                                  href={`/students/lesson-library/${toProgramSlug(type)}/${toProgramSlug(section)}`}
                                />
                              ))}
                          </div>
                        </>
                      ) : (
                      <div className="col-span-full space-y-10">
                        {Object.entries(sectionData ?? {}).map(
                          ([group, groupSections]) => (
                            <div key={group} className="space-y-4">
                              <p className="text-sm font-semibold tracking-[0.2em] text-white">
                                {group}
                              </p>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                  {groupSections.map(section => (
                                    <LockedSectionCard
                                      key={section}
                                      programName={type}
                                      sectionName={section}
                                      href={`/students/lesson-library/${toProgramSlug(type)}/${toProgramSlug(section)}`}
                                    />
                                  ))}
                                </div>
                              </div>
                            ),
                        )}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                Special Needs Program
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--c-1f1f1d)]">
                Simply Music Gateway
              </p>
              <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                The Simply Music Gateway Program is a playing-based piano
                method designed for anybody with special needs and learning
                differences, including those on the Autism spectrum, as well
                as those with learning disabilities, neurological dysfunction,
                developmental delays, and ADHD.
              </p>
              <div className="mt-4">
                <LockedSectionCard
                  programName="Simply Music Gateway"
                  sectionName="Materials"
                  href={`/students/lesson-library/${toProgramSlug('Simply Music Gateway')}/${toProgramSlug('Materials')}`}
                />
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                Self-Study Programs
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-1.5 text-xs font-semibold text-[var(--c-1f1f1d)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]">
                  Music &amp; Creativity
                </button>
                <Link
                  href={`/students/lesson-library/${toProgramSlug('Learn-at-Home')}/${toProgramSlug('Materials')}`}
                  className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-3 py-1.5 text-xs font-semibold text-[var(--c-1f1f1d)] transition hover:border-[color:var(--c-c8102e)]/40 hover:text-[var(--c-c8102e)]"
                >
                  Learn-at-Home
                </Link>
              </div>
              <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                Many students who complete our self-study programs continue
                into lessons with a Simply Music Teacher. So you are aware of
                the content provided, you may access these programs for
                reference in case you acquire a self-study student.
                </p>
                <p className="mt-3 text-sm text-[var(--c-6f6c65)]">
                  We highly recommend that you create your own free Music &amp;
                  Creativity Program (MAC) account and familiarize yourself
                  with the contents. MAC replaces a prior self-study course,
                the Learn-at-Home Program (LAH), that was produced and
                released in 1999.
              </p>
              <p className="mt-3 text-sm text-[var(--c-6f6c65)]">
                For more information on self-study programs please review the
                Extras portion of Module 10 of the Initial Teacher Training
                Program (ITTP).
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
