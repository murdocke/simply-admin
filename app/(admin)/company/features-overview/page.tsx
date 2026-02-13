const featureSections = [
  {
    id: 'teacher-command-center',
    label: 'Simply Music Teacher Area',
    description:
      'A single view of today, this week, and teaching priorities so instructors can focus on momentum instead of admin work.',
    heroImage: '/reference/feature-simply-music-teacher-area.png',
    highlights: [
      'At-a-glance teaching load, lesson flow, and open tasks',
      'Quick links to student profiles, lesson plans, and communications',
      'Built-in context to keep every student interaction personalized',
    ],
    cta: 'Open Teacher Dashboard',
    href: '/teachers/dashboard',
    viewRole: 'teacher',
  },
  {
    id: 'student-progress',
    label: 'Student Progress Area',
    description:
      'A clear, motivating view of growth that keeps students and teachers aligned on goals, wins, and next steps.',
    heroImage: '/reference/feature-student-progress-area.png',
    highlights: [
      'Progress snapshots with measurable milestones',
      'Shared goals and targets that sync with teacher plans',
      'Activity history that ties practice to outcomes',
    ],
    cta: 'Open Student Dashboard',
    href: '/students/dashboard',
    viewRole: 'student',
  },
  {
    id: 'lesson-orchestration',
    label: 'Lesson Orchestration',
    description:
      'Lesson plans, materials, and next-lesson cues stay connected so every session feels intentional.',
    heroImage: '/reference/feature-lesson-orchestration.png',
    highlights: [
      'Lesson part sequencing that keeps the flow moving',
      'Teacher notes, reminders, and next-lesson prompts',
      'Reusable materials that scale across studios',
    ],
    cta: 'Jump to Teaching Tools',
    href: '/teachers/students',
    viewRole: 'teacher',
  },
  {
    id: 'practice-momentum',
    label: 'Practice Momentum',
    description:
      'Practice tracking and encouragement live right where students need it, with teachers guiding the rhythm.',
    heroImage: '/reference/feature-practice-momentum.png',
    highlights: [
      'Practice prompts and streaks that build confidence',
      'Teacher visibility into what students are doing between lessons',
      'Encouragement loops that keep students engaged',
    ],
    cta: 'See Student View',
    href: '/students/dashboard',
    viewRole: 'student',
  },
  {
    id: 'teacher-student-connection',
    label: 'Teacher-Student Connection',
    description:
      'Every interaction stays connected across messaging, lesson notes, and progress updates.',
    heroImage: '/reference/feature-teacher-student-connection.png',
    highlights: [
      'Teacher-to-student messages with context attached',
      'Shared notes that flow directly into future lessons',
      'Communication history that keeps everyone aligned',
    ],
    cta: 'Open Communications',
    href: '/teachers/communications',
    viewRole: 'teacher',
  },
  {
    id: 'mobile-companion',
    label: 'iOS + Android Companion App',
    title: (
      <>
        iOS + Android
        <br />
        Companion App
      </>
    ),
    sideTitle: (
      <>
        iOS + Android
        <br />
        Companion App
      </>
    ),
    description:
      'A mobile companion that keeps teachers and students connected on the go with quick check-ins and lesson-ready materials.',
    heroImage: '/reference/feature-mobile-companion.png',
    highlights: [
      'Fast updates before and after each lesson',
      'Practice reminders and encouragement from anywhere',
      'Seamless sync with web dashboards',
    ],
    cta: 'Open Student Dashboard',
    href: '/students/dashboard',
    viewRole: 'student',
  },
  {
    id: 'expandable-platform',
    label: 'Expandable Platform',
    description:
      'Every feature is designed to scale with new lesson packs, new experiences, and future integrations.',
    heroImage: '/reference/feature-expandable-platform.png',
    highlights: [
      'Modular content and lesson frameworks',
      'Room for new programs, metrics, and partnerships',
      'Designed to grow without losing clarity',
    ],
    cta: 'Return to Teacher View',
    href: '/teachers/dashboard',
    viewRole: 'teacher',
  },
];

const quickLinks = [
  {
    label: 'Teacher',
    href: '/teachers/dashboard',
    viewRole: 'teacher',
  },
  {
    label: 'Student',
    href: '/students/dashboard',
    viewRole: 'student',
  },
  {
    label: 'This Week',
    href: '/teachers/this-week',
    viewRole: 'teacher',
  },
  {
    label: 'Teaching',
    href: '/teachers?mode=teaching',
    viewRole: 'teacher',
  },
  {
    label: 'Training',
    href: '/teachers?mode=training',
    viewRole: 'teacher',
  },
  {
    label: 'Communications',
    href: '/teachers/communications',
    viewRole: 'teacher',
  },
  {
    label: 'Schedule',
    href: '/teachers/schedule',
    viewRole: 'teacher',
  },
  {
    label: 'Messages',
    href: '/teachers/messages',
    viewRole: 'teacher',
  },
  {
    label: 'Lesson Pack Builder',
    href: '/lesson-pack-builder',
  },
];

const withFeaturesReturn = (href: string, viewRole?: 'teacher' | 'student') => {
  const hasQuery = href.includes('?');
  const base = hasQuery ? `${href}&from=features-overview` : `${href}?from=features-overview`;
  if (!viewRole) return base;
  return `${base}&view=${viewRole}`;
};

export default function CompanyFeaturesOverviewPage() {
  return (
    <div className="space-y-10" id="top">
      <section className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-6 py-8 shadow-sm md:px-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
              Features Overview
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-[var(--c-1f1f1d)] md:text-4xl">
              The teacher + student experience, end to end.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-[var(--c-6f6c65)]">
              A guided walkthrough of the platform features built for real
              teaching flow, student momentum, and lasting connection. Jump
              between sections, open the live dashboards, and keep the
              experience moving.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {quickLinks.map(link => (
              <a
                key={link.label}
                href={withFeaturesReturn(link.href, link.viewRole)}
                className="inline-flex items-center justify-center rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)] transition hover:brightness-110"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <div className="space-y-4 rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] p-6 text-sm text-[var(--c-6f6c65)] lg:sticky lg:top-10">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
              Quick Jump
            </p>
            <p className="mt-3 text-base font-semibold text-[var(--c-1f1f1d)]">
              Move fast through the tour
            </p>
          </div>
          <div className="space-y-2">
            {featureSections.map(section => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="block rounded-lg border border-transparent px-3 py-2 text-sm font-medium text-[var(--c-3a3935)] transition hover:border-[var(--sidebar-accent-border)] hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)]"
              >
                {section.sideTitle ?? section.label}
              </a>
            ))}
          </div>
          <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-4 text-xs">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
              Focus Areas
            </p>
            <p className="mt-3 text-sm text-[var(--c-6f6c65)]">
              Teacher & student experiences first, with clear handoffs and
              interaction points highlighted throughout.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {featureSections.map(section => (
            <article
              key={section.id}
              id={section.id}
              className="overflow-hidden rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] shadow-sm"
            >
              <div className="grid items-stretch md:grid-cols-[220px_1fr]">
                <div className="flex flex-col rounded-l-3xl border-b border-[var(--c-ecebe7)] bg-[var(--c-f1f1ef)] p-0 md:border-b-0 md:border-r">
                  {section.heroImage ? (
                    <div
                      className="relative h-full min-h-[220px] w-full overflow-hidden rounded-l-3xl bg-[var(--c-ffffff)] bg-cover bg-center"
                      style={{ backgroundImage: `url(${section.heroImage})` }}
                    >
                    </div>
                  ) : null}
                </div>
                <div className="px-6 py-6 md:px-10 md:py-8">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-[var(--c-1f1f1d)]">
                        {section.title ?? section.label}
                      </h2>
                      <p className="mt-3 max-w-2xl text-base text-[var(--c-6f6c65)]">
                        {section.description}
                      </p>
                    </div>
                    <a
                      href={withFeaturesReturn(section.href, section.viewRole)}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-full border border-[var(--sidebar-accent-border)] bg-[var(--sidebar-accent-bg)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--sidebar-accent-text)] transition hover:brightness-110"
                    >
                      {section.cta}
                    </a>
                  </div>
                  <div className="mt-6 grid gap-3 md:grid-cols-3">
                    {section.highlights.map(highlight => (
                      <div
                        key={highlight}
                        className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] px-4 py-3 text-sm text-[var(--c-3a3935)]"
                      >
                        {highlight}
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <a
                      href="#top"
                      className="inline-flex items-center justify-center rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)]"
                    >
                      Back to Top
                    </a>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
