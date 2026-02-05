export default function StudentWhatToPracticePage() {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-[#c8102e]">
          Students
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold text-[#1f1f1d]">
            What To Practice
          </h1>
          <span className="rounded-full border border-[#e6eef8] bg-[#f5f9ff] px-3 py-1 text-xs font-semibold tracking-wide text-[#28527a]">
            Updated Feb 4, 2026
          </span>
        </div>
        <p className="text-sm text-[#6f6c65]">
          Your teacher’s practice plan, with guided piano lessons and links to
          the full lesson pages.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-[#ecebe7] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[#c8102e]">
                  Teacher Plan
                </p>
                <h2 className="mt-2 text-xl font-semibold text-[#1f1f1d]">
                  Week 6 • Piano Touch &amp; Dynamics
                </h2>
                <p className="mt-2 text-sm text-[#6f6c65]">
                  Focus on consistent touch, smooth hand shifts, and shaping
                  dynamics through the phrase.
                </p>
              </div>
              <span className="rounded-full border border-[#efe7d5] bg-[#fff7e8] px-3 py-1 text-xs font-semibold text-[#7a4a17]">
                Target: 25 min/day
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#efe7d5] bg-[#fff7e8] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#7a4a17]">
                  Practice Days
                </p>
                <p className="mt-2 text-sm font-semibold text-[#1f1f1d]">
                  Mon • Wed • Sat
                </p>
              </div>
              <div className="rounded-2xl border border-[#e8efe9] bg-[#f6fbf7] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#2d6a4f]">
                  Focus Skill
                </p>
                <p className="mt-2 text-sm font-semibold text-[#1f1f1d]">
                  Dynamic control
                </p>
              </div>
              <div className="rounded-2xl border border-[#e6eef8] bg-[#f5f9ff] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#28527a]">
                  Tempo Goal
                </p>
                <p className="mt-2 text-sm font-semibold text-[#1f1f1d]">
                  88 BPM
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[#ecebe7] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.25em] text-[#6f6c65]">
                What To Practice
              </p>
              <span className="rounded-full border border-[#e8efe9] bg-[#f6fbf7] px-3 py-1 text-xs font-semibold text-[#2d6a4f]">
                Teacher Assigned
              </span>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#ecebe7] bg-[#faf9f6] p-4">
                <div>
                  <p className="text-sm font-semibold text-[#1f1f1d]">
                    Warm-up scales in C &amp; G
                  </p>
                  <p className="text-xs text-[#6f6c65]">
                    5 minutes, focus on evenness.
                  </p>
                </div>
                <span className="rounded-full border border-[#d9e2ef] bg-white px-3 py-1 text-xs font-semibold text-[#1f1f1d]">
                  Daily
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#ecebe7] bg-[#faf9f6] p-4">
                <div>
                  <p className="text-sm font-semibold text-[#1f1f1d]">
                    Lesson piece: “Morning Light”
                  </p>
                  <p className="text-xs text-[#6f6c65]">
                    Hands together, add dynamics.
                  </p>
                </div>
                <span className="rounded-full border border-[#efe7d5] bg-[#fff7e8] px-3 py-1 text-xs font-semibold text-[#7a4a17]">
                  12 minutes
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#ecebe7] bg-[#faf9f6] p-4">
                <div>
                  <p className="text-sm font-semibold text-[#1f1f1d]">
                    Dynamics drill: soft-to-loud arcs
                  </p>
                  <p className="text-xs text-[#6f6c65]">
                    6 repetitions with metronome.
                  </p>
                </div>
                <span className="rounded-full border border-[#e6eef8] bg-[#f5f9ff] px-3 py-1 text-xs font-semibold text-[#28527a]">
                  8 minutes
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[#ecebe7] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.25em] text-[#c8102e]">
                Video Lessons
              </p>
              <span className="text-xs font-semibold uppercase tracking-wide text-[#6f6c65]">
                Tap to open full lesson
              </span>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "Piano Touch & Dynamics",
                  subtitle: "Watch before practice",
                },
                {
                  title: "Hand Position Check-in",
                  subtitle: "Mini lesson • 6 min",
                },
                {
                  title: "Metronome Challenge",
                  subtitle: "Tempo ladder",
                },
              ].map((lesson) => (
                <a
                  key={lesson.title}
                  href="/students/current-lesson"
                  className="group overflow-hidden rounded-2xl border border-[#ecebe7] bg-[#111111] text-white shadow-sm transition hover:-translate-y-1"
                >
                  <div className="relative h-36 bg-gradient-to-br from-[#1f1f1d] via-[#2d2b25] to-[#3a342a]">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_60%)]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/50 bg-white/10 text-lg font-semibold">
                        ▶
                      </div>
                    </div>
                    <span className="absolute left-3 top-3 rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
                      Video
                    </span>
                  </div>
                  <div className="space-y-2 p-4">
                    <p className="text-sm font-semibold">{lesson.title}</p>
                    <p className="text-xs text-white/70">{lesson.subtitle}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-[#ecebe7] bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.25em] text-[#6f6c65]">
              Practice Checklist
            </p>
            <div className="mt-4 space-y-3 text-sm text-[#1f1f1d]">
              {[
                "Posture check and relaxed shoulders",
                "Even tone across both hands",
                "Dynamics mapped in pencil",
                "Record one run-through",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-[#ecebe7] bg-[#faf9f6] px-4 py-3"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[#c8102e] text-[10px] font-bold text-[#c8102e]">
                    ✓
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-[#ecebe7] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.25em] text-[#c8102e]">
                Resources
              </p>
              <span className="rounded-full border border-[#d9e2ef] bg-[#f5f9ff] px-3 py-1 text-xs font-semibold text-[#28527a]">
                For this week
              </span>
            </div>
            <div className="mt-4 space-y-3">
              <a
                href="/students/current-lesson"
                className="flex items-center justify-between rounded-2xl border border-[#ecebe7] bg-[#faf9f6] px-4 py-3 text-sm text-[#1f1f1d] transition hover:-translate-y-0.5"
              >
                <span>Lesson overview</span>
                <span className="text-xs text-[#6f6c65]">View</span>
              </a>
              <a
                href="/students/current-lesson"
                className="flex items-center justify-between rounded-2xl border border-[#ecebe7] bg-[#faf9f6] px-4 py-3 text-sm text-[#1f1f1d] transition hover:-translate-y-0.5"
              >
                <span>Practice track</span>
                <span className="text-xs text-[#6f6c65]">Listen</span>
              </a>
              <a
                href="/students/current-lesson"
                className="flex items-center justify-between rounded-2xl border border-[#ecebe7] bg-[#faf9f6] px-4 py-3 text-sm text-[#1f1f1d] transition hover:-translate-y-0.5"
              >
                <span>Sheet music notes</span>
                <span className="text-xs text-[#6f6c65]">Open</span>
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-[#ecebe7] bg-gradient-to-br from-[#111111] via-[#1f1f1d] to-[#2b2b27] p-6 text-white shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-[#f8d58a]">
              Next Lesson
            </p>
            <h3 className="mt-3 text-lg font-semibold">Chord Voicings</h3>
            <p className="mt-2 text-sm text-[#efece6]">
              Scheduled for Feb 11, 2026. Prep by reviewing the cadence chart
              and left-hand voicing shapes.
            </p>
            <button className="mt-5 w-full rounded-2xl bg-white/10 px-4 py-2 text-sm font-semibold text-white">
              Preview Lesson
            </button>
          </div>
        </aside>
      </section>
    </div>
  );
}
