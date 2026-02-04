import CartPanel from '../components/cart-panel';

export default function TeachersPage() {
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#c8102e]">
            Teachers
          </p>
          <h1 className="text-3xl font-semibold text-[#1f1f1d] mt-2">
            Training + Teaching Hub
          </h1>
          <p className="text-sm text-[#6f6c65] mt-2">
            One place for curriculum, coaching, and studio resources.
          </p>
        </div>
        <div className="flex rounded-full border border-[#ecebe7] bg-white p-1 text-xs uppercase tracking-[0.2em] text-[#6f6c65] shadow-sm">
          <button className="rounded-full bg-[#c8102e] px-4 py-2 text-white">
            Training
          </button>
          <button className="rounded-full px-4 py-2">Teaching</button>
        </div>
      </header>

      <section
        id="students"
        className="rounded-2xl border border-[#ecebe7] bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-[#1f1f1d]">Students</h2>
        <p className="text-sm text-[#6f6c65] mt-2">
          Active student roster and progress highlights.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          {[
            'Active Students',
            'New Requests',
            'Lesson Notes',
            'Progress Snapshots',
          ].map(item => (
            <div
              key={item}
              className="rounded-xl border border-[#ecebe7] bg-[#fcfcfb] px-4 py-3 text-sm text-[#3a3935]"
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section
          id="this-week"
          className="rounded-2xl border border-[#ecebe7] bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-[#1f1f1d]">This Week</h2>
          <p className="text-sm text-[#6f6c65] mt-2">
            Upcoming lessons, recitals, and studio moments.
          </p>
          <div className="mt-5 space-y-3">
            {[
              '12 lessons scheduled',
              '2 new student intakes',
              'Studio check-in on Friday',
            ].map(item => (
              <div
                key={item}
                className="rounded-xl border border-[#ecebe7] bg-[#fcfcfb] px-4 py-3 text-sm text-[#3a3935]"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section
          id="schedule"
          className="rounded-2xl border border-[#ecebe7] bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-[#1f1f1d]">Schedule</h2>
          <p className="text-sm text-[#6f6c65] mt-2">
            Manage weekly blocks and upcoming sessions.
          </p>
          <div className="mt-5 space-y-3">
            {[
              'Mon–Wed: Evening sessions',
              'Thu: Studio admin hours',
              'Sat: Group lesson block',
            ].map(item => (
              <div
                key={item}
                className="rounded-xl border border-[#ecebe7] bg-[#fcfcfb] px-4 py-3 text-sm text-[#3a3935]"
              >
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>

      <section
        id="lesson-fees"
        className="rounded-2xl border border-[#ecebe7] bg-white p-6 shadow-sm"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#1f1f1d]">Lesson Fees</h2>
            <p className="text-sm text-[#6f6c65] mt-2">
              Track billing, payments, and pricing tiers.
            </p>
          </div>
          <span className="rounded-full border border-[#ecebe7] bg-[#fcfcfb] px-3 py-1 text-xs text-[#6f6c65]">
            Next payout Feb 18
          </span>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            { label: 'Weekly Fees', value: '$2,140' },
            { label: 'Overdue', value: '$320' },
            { label: 'Avg. Lesson', value: '$48' },
          ].map(item => (
            <div
              key={item.label}
              className="rounded-xl border border-[#ecebe7] bg-[#fcfcfb] px-4 py-4"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-[#c8102e]">
                {item.label}
              </p>
              <p className="text-2xl font-semibold text-[#1f1f1d] mt-2">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <CartPanel context="teacher" />
    </div>
  );
}
