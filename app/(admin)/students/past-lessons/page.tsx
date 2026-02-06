export default function StudentPastLessonsPage() {
  const recentLessons = [
    {
      title: "Piano Foundations: Touch & Dynamics",
      date: "Feb 4, 2026",
      duration: "42 min",
      focus: "Dynamics",
    },
    {
      title: "Chord Voicings & Left Hand",
      date: "Jan 28, 2026",
      duration: "38 min",
      focus: "Voicings",
    },
    {
      title: "Metronome Flow Session",
      date: "Jan 21, 2026",
      duration: "35 min",
      focus: "Timing",
    },
    {
      title: "Arpeggio Shapes in G",
      date: "Jan 14, 2026",
      duration: "40 min",
      focus: "Arpeggios",
    },
    {
      title: "Smooth Pedal Transitions",
      date: "Jan 7, 2026",
      duration: "36 min",
      focus: "Pedal",
    },
    {
      title: "Warm-up Scales & Tone",
      date: "Dec 31, 2025",
      duration: "30 min",
      focus: "Scales",
    },
  ];

  const lessonHistory = [
    {
      id: "L-201",
      title: "Warm-Up Rituals: Five-Finger Patterns",
      date: "Dec 18, 2025",
      duration: "29 min",
      coach: "Ms. Rivera",
      rating: "Excellent",
    },
    {
      id: "L-200",
      title: "Left-Hand Stability: Root-Position Chords",
      date: "Dec 11, 2025",
      duration: "31 min",
      coach: "Ms. Rivera",
      rating: "Great",
    },
    {
      id: "L-199",
      title: "Pedal Basics: Clean Transitions",
      date: "Dec 4, 2025",
      duration: "33 min",
      coach: "Ms. Rivera",
      rating: "On Track",
    },
    {
      id: "L-198",
      title: "Simple Accompaniment: Broken Chords",
      date: "Nov 27, 2025",
      duration: "28 min",
      coach: "Ms. Rivera",
      rating: "Great",
    },
    {
      id: "L-197",
      title: "Dynamics Map: Soft vs. Strong Touch",
      date: "Nov 20, 2025",
      duration: "34 min",
      coach: "Ms. Rivera",
      rating: "Excellent",
    },
    {
      id: "L-196",
      title: "Sight-Reading: Hands Together Level 1",
      date: "Nov 13, 2025",
      duration: "30 min",
      coach: "Ms. Rivera",
      rating: "On Track",
    },
    {
      id: "L-195",
      title: "Scale Checkpoint: C Major Fluency",
      date: "Nov 6, 2025",
      duration: "32 min",
      coach: "Ms. Rivera",
      rating: "Great",
    },
    {
      id: "L-194",
      title: "Rhythm & Counting: Quarter + Eighth Notes",
      date: "Oct 30, 2025",
      duration: "27 min",
      coach: "Ms. Rivera",
      rating: "Excellent",
    },
    {
      id: "L-193",
      title: "Chord Shapes: Triads in C & G",
      date: "Oct 23, 2025",
      duration: "29 min",
      coach: "Ms. Rivera",
      rating: "Great",
    },
    {
      id: "L-192",
      title: "Tempo Control: Building a Steady Pulse",
      date: "Oct 16, 2025",
      duration: "31 min",
      coach: "Ms. Rivera",
      rating: "On Track",
    },
    {
      id: "L-191",
      title: "Legato vs. Staccato Touch",
      date: "Oct 9, 2025",
      duration: "28 min",
      coach: "Ms. Rivera",
      rating: "Excellent",
    },
    {
      id: "L-190",
      title: "Hand Position Check-In",
      date: "Oct 2, 2025",
      duration: "26 min",
      coach: "Ms. Rivera",
      rating: "Great",
    },
    {
      id: "L-189",
      title: "Chord Transitions: I–IV–V in C",
      date: "Sep 25, 2025",
      duration: "30 min",
      coach: "Ms. Rivera",
      rating: "On Track",
    },
    {
      id: "L-188",
      title: "Dynamics Drill: Crescendo Practice",
      date: "Sep 18, 2025",
      duration: "33 min",
      coach: "Ms. Rivera",
      rating: "Excellent",
    },
    {
      id: "L-187",
      title: "Scale Work: G Major, Hands Together",
      date: "Sep 11, 2025",
      duration: "29 min",
      coach: "Ms. Rivera",
      rating: "Great",
    },
    {
      id: "L-186",
      title: "Rhythm Reading: Simple Syncopation",
      date: "Sep 4, 2025",
      duration: "31 min",
      coach: "Ms. Rivera",
      rating: "On Track",
    },
    {
      id: "L-185",
      title: "Chord Voicings: Open Fifths",
      date: "Aug 28, 2025",
      duration: "28 min",
      coach: "Ms. Rivera",
      rating: "Excellent",
    },
    {
      id: "L-184",
      title: "Arpeggios: C Major Pattern",
      date: "Aug 21, 2025",
      duration: "27 min",
      coach: "Ms. Rivera",
      rating: "Great",
    },
    {
      id: "L-183",
      title: "Tone & Balance: Melodic Emphasis",
      date: "Aug 14, 2025",
      duration: "30 min",
      coach: "Ms. Rivera",
      rating: "On Track",
    },
  ];

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
          Students
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold text-[var(--c-1f1f1d)]">
            Past Lessons
          </h1>
          <span className="rounded-full border border-[var(--c-e6eef8)] bg-[var(--c-f5f9ff)] px-3 py-1 text-xs font-semibold tracking-wide text-[var(--c-28527a)]">
            History of my lessons
          </span>
        </div>
        <p className="text-sm text-[var(--c-6f6c65)]">
          Quick glance at the last six lessons, plus full history below.
        </p>
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--c-6f6c65)]">
            Last 6 Lessons
          </p>
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--c-6f6c65)]">
            3 per row
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recentLessons.map((lesson) => (
            <div
              key={lesson.title}
              className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-5 shadow-sm transition hover:-translate-y-1"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--c-c8102e)]">
                    Past Lesson
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-[var(--c-1f1f1d)]">
                    {lesson.title}
                  </h2>
                </div>
                <span className="rounded-full border border-[var(--c-efe7d5)] bg-[var(--c-fff7e8)] px-3 py-1 text-xs font-semibold text-[var(--c-7a4a17)]">
                  {lesson.duration}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                  {lesson.date}
                </span>
                <span className="rounded-full border border-[var(--c-e8efe9)] bg-[var(--c-f6fbf7)] px-3 py-1 text-xs font-semibold text-[var(--c-2d6a4f)]">
                  Focus: {lesson.focus}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-[var(--c-c8102e)]">
              Lesson History
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--c-1f1f1d)]">
              All Past Lessons
            </h2>
          </div>
          <span className="rounded-full border border-[var(--c-d9e2ef)] bg-[var(--c-f5f9ff)] px-3 py-1 text-xs font-semibold text-[var(--c-28527a)]">
            Showing 19 more
          </span>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--c-ecebe7)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--c-faf9f6)] text-xs uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
              <tr>
                <th className="px-4 py-3 font-semibold">Lesson</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Duration</th>
                <th className="px-4 py-3 font-semibold">Teacher</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {lessonHistory.map((lesson) => (
                <tr
                  key={lesson.id}
                  className="border-t border-[var(--c-ecebe7)] text-[var(--c-1f1f1d)]"
                >
                  <td className="px-4 py-3 font-semibold">{lesson.title}</td>
                  <td className="px-4 py-3 text-[var(--c-6f6c65)]">{lesson.date}</td>
                  <td className="px-4 py-3">{lesson.duration}</td>
                  <td className="px-4 py-3 text-[var(--c-6f6c65)]">{lesson.coach}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-[var(--c-e8efe9)] bg-[var(--c-f6fbf7)] px-3 py-1 text-xs font-semibold text-[var(--c-2d6a4f)]">
                      {lesson.rating}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
