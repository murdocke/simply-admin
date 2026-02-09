export default function SupportPage() {
  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
            Support
          </p>
          <h1 className="text-3xl font-semibold text-[var(--c-1f1f1d)] mt-2">
            Customer Support Channel
          </h1>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            Triage teacher questions, manage tickets, and follow through to resolution.
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-4 py-3 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)] shadow-sm">
          Queue snapshot · Feb 9, 2026
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Open Tickets
          </p>
          <p className="text-4xl font-semibold mt-3 text-[var(--c-1f1f1d)]">
            48
          </p>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            12 overdue · 6 waiting on teacher
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Avg First Reply
          </p>
          <p className="text-4xl font-semibold mt-3 text-[var(--c-1f1f1d)]">
            3h 18m
          </p>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            Goal: under 4 hours
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Resolved This Week
          </p>
          <p className="text-4xl font-semibold mt-3 text-[var(--c-1f1f1d)]">
            132
          </p>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            +18% versus last week
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                Ticket Intake
              </p>
              <h2 className="text-lg font-semibold text-[var(--c-1f1f1d)] mt-2">
                New Teacher Request
              </h2>
              <p className="text-sm text-[var(--c-6f6c65)] mt-2">
                Capture issues from email, phone, or portal and convert them into a ticket.
              </p>
            </div>
            <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-1 text-xs text-[var(--c-6f6c65)]">
              Auto-tagging on
            </span>
          </div>
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3 text-sm text-[var(--c-6f6c65)]">
              Teacher or studio name
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3 text-sm text-[var(--c-6f6c65)]">
                Issue type
              </div>
              <div className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3 text-sm text-[var(--c-6f6c65)]">
                Priority
              </div>
            </div>
            <div className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-4 text-sm text-[var(--c-6f6c65)]">
              Describe the request in a sentence or two...
            </div>
            <div className="flex flex-wrap gap-2">
              {['Billing', 'Curriculum', 'Tech Support', 'Training'].map(tag => (
                <span
                  key={tag}
                  className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
                >
                  {tag}
                </span>
              ))}
            </div>
            <button className="rounded-full bg-[var(--c-c8102e)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-white">
              Create Ticket
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                Live Queue
              </p>
              <h2 className="text-lg font-semibold text-[var(--c-1f1f1d)] mt-2">
                Active Conversations
              </h2>
              <p className="text-sm text-[var(--c-6f6c65)] mt-2">
                Teachers currently waiting for a response.
              </p>
            </div>
            <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-1 text-xs text-[var(--c-6f6c65)]">
              18 waiting
            </span>
          </div>
          <div className="mt-6 space-y-3">
            {[
              {
                name: 'Alicia Rhodes',
                topic: 'Billing discrepancy - February invoice',
                status: 'Waiting 12m',
              },
              {
                name: 'Marcus Hill',
                topic: 'Student transfer approval request',
                status: 'Waiting 27m',
              },
              {
                name: 'Sasha Kim',
                topic: 'Unable to access Practice Mode',
                status: 'Waiting 42m',
              },
              {
                name: 'Theo Vasquez',
                topic: 'Licensing renewal confirmation',
                status: 'Waiting 1h 08m',
              },
            ].map(item => (
              <div
                key={item.name}
                className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3 text-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[var(--c-1f1f1d)]">
                      {item.name}
                    </p>
                    <p className="text-xs text-[var(--c-6f6c65)]">
                      {item.topic}
                    </p>
                  </div>
                  <span className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] px-3 py-1 text-xs text-[var(--c-6f6c65)]">
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
              Ticket Pipeline
            </p>
            <h2 className="text-lg font-semibold text-[var(--c-1f1f1d)] mt-2">
              Support Queue Overview
            </h2>
            <p className="text-sm text-[var(--c-6f6c65)] mt-2">
              Track tickets from intake to resolution with status, owner, and SLA.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
            {['All', 'Billing', 'Tech', 'Curriculum', 'Training'].map(filter => (
              <span
                key={filter}
                className="rounded-full border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-3 py-1"
              >
                {filter}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--c-ecebe7)]">
          <div className="grid grid-cols-12 gap-2 bg-[var(--c-f7f7f5)] px-4 py-3 text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
            <div className="col-span-3">Teacher</div>
            <div className="col-span-3">Issue</div>
            <div className="col-span-2">Priority</div>
            <div className="col-span-2">Owner</div>
            <div className="col-span-2">Status</div>
          </div>
          <div className="divide-y divide-[var(--c-ecebe7)]">
            {[
              {
                teacher: 'Lena Hart',
                issue: 'Invoice mismatch for February',
                priority: 'High',
                owner: 'J. Moreno',
                status: 'Open 1d',
              },
              {
                teacher: 'Marco Ruiz',
                issue: 'Student portal login failure',
                priority: 'Urgent',
                owner: 'S. Patel',
                status: 'Escalated',
              },
              {
                teacher: 'Priya Nair',
                issue: 'Curriculum access request',
                priority: 'Normal',
                owner: 'R. Williams',
                status: 'In progress',
              },
              {
                teacher: 'Devon Lee',
                issue: 'License renewal question',
                priority: 'Normal',
                owner: 'N. Reed',
                status: 'Awaiting teacher',
              },
              {
                teacher: 'Sofia Park',
                issue: 'Billing update for new students',
                priority: 'High',
                owner: 'M. Chen',
                status: 'Open 4h',
              },
              {
                teacher: 'Ethan Cole',
                issue: 'Practice Mode audio issue',
                priority: 'Normal',
                owner: 'A. Torres',
                status: 'In progress',
              },
            ].map(ticket => (
              <div
                key={ticket.teacher}
                className="grid grid-cols-12 items-center gap-2 px-4 py-4 text-sm"
              >
                <div className="col-span-3">
                  <p className="font-medium text-[var(--c-1f1f1d)]">
                    {ticket.teacher}
                  </p>
                  <p className="text-xs text-[var(--c-9a9892)]">
                    Updated 2 hours ago
                  </p>
                </div>
                <div className="col-span-3 text-[var(--c-6f6c65)]">
                  {ticket.issue}
                </div>
                <div className="col-span-2">
                  <span className="rounded-full border border-[var(--c-e5e3dd)] px-3 py-1 text-xs text-[var(--c-6f6c65)]">
                    {ticket.priority}
                  </span>
                </div>
                <div className="col-span-2 text-[var(--c-6f6c65)]">
                  {ticket.owner}
                </div>
                <div className="col-span-2">
                  <span className="rounded-full border border-[var(--c-e5e3dd)] px-3 py-1 text-xs text-[var(--c-6f6c65)]">
                    {ticket.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm lg:col-span-2">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Knowledge Base
          </p>
          <h2 className="text-lg font-semibold text-[var(--c-1f1f1d)] mt-2">
            Most Asked Topics
          </h2>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            Use articles to resolve tickets faster and keep teachers informed.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            {[
              'How billing credits work',
              'Student transfer checklist',
              'Practice Mode troubleshooting',
              'Teacher onboarding steps',
              'Curriculum access FAQs',
              'License renewal timeline',
            ].map(item => (
              <div
                key={item}
                className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3 text-sm text-[var(--c-3a3935)]"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
            Escalations
          </p>
          <h2 className="text-lg font-semibold text-[var(--c-1f1f1d)] mt-2">
            Needs Leadership Attention
          </h2>
          <p className="text-sm text-[var(--c-6f6c65)] mt-2">
            Tickets that exceed SLA or require policy decisions.
          </p>
          <div className="mt-5 space-y-3">
            {[
              'Chargeback dispute • 2 days',
              'Teacher termination request',
              'Curriculum licensing exception',
              'Multiple studio outage',
            ].map(item => (
              <div
                key={item}
                className="rounded-xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] px-4 py-3 text-sm text-[var(--c-3a3935)]"
              >
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
