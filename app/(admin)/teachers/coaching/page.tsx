export default function CoachingPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-[var(--c-ecebe7)] bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(252,252,251,0.8))] p-8 shadow-[0_26px_60px_-40px_rgba(0,0,0,0.25)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
          Coaching
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-[var(--c-1f1f1d)]">
          Build Your Teaching Momentum
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-[var(--c-6f6c65)]">
          Explore curated coaching options designed to sharpen delivery, boost
          studio leadership, and keep your teaching momentum strong.
        </p>
      </section>

      <section className="grid gap-5">
        {[
          {
            title: 'Ivory League Coaching',
            eyebrow: 'Coach Spotlight',
            pill: 'Approved Coaching',
            body:
              'Laurie Richards offers personalized coaching to sharpen teaching flow and studio leadership.',
            image: '/reference/SMDT-Coaching-Ivory-League.webp',
          },
          {
            title: "Music Teacher's Coach",
            eyebrow: 'Coach Spotlight',
            pill: 'Approved Coaching',
            body:
              'Robin Quinn Keehn shares a mastermind approach to build sustainable studio habits.',
            image: '/reference/SMDT-Coaching-Quitting-Culture.webp',
          },
          {
            title: 'Inspired Teacher Coaching',
            eyebrow: 'Coach Spotlight',
            pill: 'Approved Coaching',
            body:
              'Bernadette Ashby delivers tailored coaching to re-ignite your teaching energy.',
            image: '/reference/SMDT-Coaching-Inspired-Teacher.webp',
          },
        ].map(card => (
          <div
            key={card.title}
            className="group grid gap-6 overflow-hidden rounded-3xl border border-[var(--c-ecebe7)] bg-[var(--c-ffffff)] shadow-[0_18px_50px_-36px_rgba(0,0,0,0.35)] transition hover:-translate-y-1 hover:shadow-[0_30px_70px_-40px_rgba(0,0,0,0.45)] lg:grid-cols-[1.15fr_1.85fr] lg:items-stretch"
          >
            <div className="relative overflow-hidden bg-[var(--c-f7f7f5)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(200,16,46,0.18),transparent_60%)] opacity-0 transition group-hover:opacity-100" />
              <div className="mx-6 my-6 rounded-2xl bg-white p-6 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.3)]">
                <img
                  src={card.image}
                  alt=""
                  className="h-52 w-full object-contain transition duration-500 group-hover:scale-[1.03]"
                />
              </div>
            </div>
            <div className="flex flex-col gap-4 p-6 lg:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
                  {card.eyebrow}
                </span>
                <span className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-fafafa)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  {card.pill}
                </span>
              </div>
              <h2 className="text-3xl font-semibold text-[var(--c-1f1f1d)]">
                {card.title}
              </h2>
              <p className="text-base text-[var(--c-6f6c65)]">{card.body}</p>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-4">
                <span className="text-[11px] uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
                  Coaching Path
                </span>
                <button className="rounded-full border border-[var(--c-c8102e)] bg-[var(--c-c8102e)] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:brightness-110">
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
