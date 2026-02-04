import CartPanel from '../components/cart-panel';

export default function StudentsPage() {
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#c8102e]">
            Students
          </p>
          <h1 className="text-3xl font-semibold text-[#1f1f1d] mt-2">
            Learning + Practicing
          </h1>
          <p className="text-sm text-[#6f6c65] mt-2">
            Keep students progressing with clear learning paths.
          </p>
        </div>
        <div className="flex rounded-full border border-[#ecebe7] bg-white p-1 text-xs uppercase tracking-[0.2em] text-[#6f6c65] shadow-sm">
          <button className="rounded-full bg-[#c8102e] px-4 py-2 text-white">
            Learning
          </button>
          <button className="rounded-full px-4 py-2">Practicing</button>
        </div>
      </header>

      <section
        id="current-lesson"
        className="rounded-2xl border border-[#ecebe7] bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-[#1f1f1d]">Current Lesson</h2>
        <p className="text-sm text-[#6f6c65] mt-2">
          Your next session and focus pieces.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          {[
            'Foundation Level 4',
            'Lead Sheet: Morning Light',
            'Listening assignment',
            'Warmup checklist',
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
          id="what-to-practice"
          className="rounded-2xl border border-[#ecebe7] bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-[#1f1f1d]">
            What To Practice
          </h2>
          <p className="text-sm text-[#6f6c65] mt-2">
            Daily focus to keep momentum strong.
          </p>
          <div className="mt-5 space-y-3">
            {[
              'Chord transitions — 10 min',
              'Rhythm drill — 8 min',
              'Song focus — 12 min',
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
          id="past-lessons"
          className="rounded-2xl border border-[#ecebe7] bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-[#1f1f1d]">Past Lessons</h2>
          <p className="text-sm text-[#6f6c65] mt-2">
            Revisit notes and recordings.
          </p>
          <div className="mt-5 space-y-3">
            {['Lesson 12', 'Lesson 11', 'Lesson 10'].map(item => (
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section
          id="practice-hub"
          className="rounded-2xl border border-[#ecebe7] bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-[#1f1f1d]">Practice Hub</h2>
          <p className="text-sm text-[#6f6c65] mt-2">
            Tools to keep you consistent.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            {['Timer &amp; Focus Mode', 'Practice Streaks', 'Sound Library'].map(
              item => (
                <div
                  key={item}
                  className="rounded-xl border border-[#ecebe7] bg-[#fcfcfb] px-4 py-3 text-sm text-[#3a3935]"
                >
                  {item}
                </div>
              ),
            )}
          </div>
        </section>

        <section
          id="ask-question"
          className="rounded-2xl border border-[#ecebe7] bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-[#1f1f1d]">
            Ask A Question
          </h2>
          <p className="text-sm text-[#6f6c65] mt-2">
            Message your teacher or support team.
          </p>
          <div className="mt-5 rounded-xl border border-[#ecebe7] bg-[#fcfcfb] px-4 py-3 text-sm text-[#6f6c65]">
            Type your question...
          </div>
          <div className="mt-4 space-y-3">
            {['Recent: How to pace Lesson 12?', 'Pending replies: 2'].map(
              item => (
                <div
                  key={item}
                  className="rounded-xl border border-[#ecebe7] bg-white px-4 py-3 text-sm text-[#3a3935]"
                >
                  {item}
                </div>
              ),
            )}
          </div>
        </section>
      </div>

      <section
        id="my-account"
        className="rounded-2xl border border-[#ecebe7] bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-[#1f1f1d]">My Account</h2>
        <p className="text-sm text-[#6f6c65] mt-2">
          Manage your profile, billing, and learning preferences.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            { label: 'Membership', value: 'Active' },
            { label: 'Next Lesson', value: 'Feb 12' },
            { label: 'Payment Method', value: 'Visa •••• 2048' },
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

      <CartPanel context="student" />
    </div>
  );
}
