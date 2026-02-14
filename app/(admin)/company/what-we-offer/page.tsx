const featureSections = [
  {
    title: 'Unified Customer & Student Management',
    description:
      'Bring all contacts, leads, and student profiles into a single system of record.',
    bullets: [
      'Lead status and engagement history',
      'Student lifecycle stages (Lead -> Trial -> Enrolled -> Active -> At Risk -> Alumni)',
      'Communication history and preferences',
      'Tags, notes, follow-ups, and reminders',
      'A true CRM that replaces fragmented address books with structured relationships and insight',
    ],
  },
  {
    title: 'Structured Learning Management System',
    description: 'Centralized curriculum delivery with real-time progress tracking.',
    bullets: [
      'Course and lesson hierarchy',
      'Video, document, and multimedia support',
      'Completion metrics and engagement reporting',
      'Certification and gating workflows',
      'Permissions and access control',
      'Build lesson packs any time to create new revenue quickly',
      'Not just hosted PDFs and links — a system that tracks mastery and completion',
    ],
  },
  {
    title: 'Integrated Learning + CRM Workflows',
    description: 'Your CRM and LMS work as one platform.',
    bullets: [
      'Automatic learner enrollment based on status',
      'CRM data flows into learning pathways',
      'Personalized reminder and follow-up sequences',
      'Support ticket insight linked to training progress',
    ],
  },
  {
    title: 'Impactful Analytics & Reporting',
    description: 'Actionable insights for leadership.',
    bullets: [
      'Real-time dashboards for student activity',
      'Course completion and engagement trends',
      'Certification progress and compliance tracking',
      'Drilldowns by region, teacher, and cohort',
      'Metrics that connect learning outcomes back to business goals',
      'You move from intuition to evidence-based decision-making',
    ],
  },
  {
    title: 'Teacher Performance & Support Tools',
    description: 'Empower your instructors with clarity.',
    bullets: [
      "Dashboard of their students' progress",
      'Alerts for at-risk learners',
      'Quick access to messaging and resource sharing',
      'Support ticket triage linked to specific learners',
      'A system that helps teachers see performance and take action',
    ],
  },
  {
    title: 'Compliance, Certification & Gating Logic',
    description: 'Ensure quality everywhere.',
    bullets: [
      'Required milestones before access advances',
      'Training version control',
      'Audit logs of completions and updates',
      'Automated certificate generation',
      'This elevates your curriculum from loose files to a controlled learning engine',
    ],
  },
  {
    title: 'Seamless Integrations',
    description: 'Connect with your ecosystem.',
    bullets: [
      'SSO and authentication support',
      'Payment processors and billing feeds',
      'Email and communication tools',
      'External analytics and BI tools',
      'A platform that fits into your world instead of replacing it',
    ],
  },
  {
    title: 'Notifications & Engagement Automation',
    description: 'Keep learners moving forward.',
    bullets: [
      'Automated email and in-platform prompts',
      'Custom alerts for milestone completion or inactivity',
      'Configurable lifecycle campaigns',
      'Gently nudging people through their journey without manual intervention',
    ],
  },
  {
    title: 'Centralized Admin Controls',
    description: 'Complete oversight with enterprise-ready governance.',
    bullets: [
      'Role-based access',
      'Data export and security guardrails',
      'Audit history and reporting',
      'Multi-region administration',
      "Giving leadership the control, clarity, and peace of mind they're missing today",
    ],
  },
];

const impactAreas = [
  'Marketing and enrollment',
  'Learning progression',
  'Certification and compliance',
  'Teacher success',
  'Support and engagement',
  'Organizational reporting',
];

export default function CompanyWhatWeOfferPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-6 py-8 shadow-sm md:px-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
              What We Offer
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-[var(--c-1f1f1d)] md:text-4xl">
              The platform built for modern learning organizations
            </h1>
            <p className="mt-4 max-w-2xl text-base text-[var(--c-6f6c65)]">
              A unified platform that blends CRM, learning delivery, and analytics so teams
              can manage relationships, track mastery, and move students forward with
              confidence.
            </p>
          </div>
          <a
            href="/company/features-overview"
            className="inline-flex items-center justify-center rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-ffffff)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] transition hover:bg-[var(--sidebar-accent-bg)] hover:text-[var(--sidebar-accent-text)]"
          >
            Back
          </a>
        </div>
      </section>

      <div className="space-y-6">
        {featureSections.map((section, index) => (
          <article
            key={section.title}
            className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm md:p-8"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-fafafa)] text-[11px] font-semibold text-[var(--c-6f6c65)]">
                    {index + 1}
                  </span>
                  Feature
                </div>
                <h2 className="mt-3 text-2xl font-semibold text-[var(--c-1f1f1d)]">
                  {section.title}
                </h2>
                <p className="mt-3 max-w-3xl text-base text-[var(--c-6f6c65)]">
                  {section.description}
                </p>
              </div>
            </div>
            <ul className="mt-5 grid gap-3 md:grid-cols-2">
              {section.bullets.map(bullet => (
                <li
                  key={bullet}
                  className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] px-4 py-3 text-sm text-[var(--c-3a3935)]"
                >
                  {bullet}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <section className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-6 py-8 shadow-sm md:px-10">
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
              Why This Matters
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--c-1f1f1d)]">
              From scattered tools to one cohesive platform
            </h2>
            <p className="mt-3 max-w-3xl text-base text-[var(--c-6f6c65)]">
              Today&apos;s setup uses scattered tools that don&apos;t talk to each other, so no
              one sees the full picture. What we deliver is continuity of experience,
              strategic insight, and operational confidence across every team.
            </p>
          </div>
          <ul className="grid gap-3 md:grid-cols-2">
            {impactAreas.map(area => (
              <li
                key={area}
                className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] px-4 py-3 text-sm text-[var(--c-3a3935)]"
              >
                {area}
              </li>
            ))}
          </ul>
          <p className="text-sm text-[var(--c-6f6c65)]">
            All from one cohesive platform.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-fafafa)] px-6 py-6 text-sm text-[var(--c-6f6c65)] shadow-sm md:px-10">
        More to come.
      </section>
    </div>
  );
}
