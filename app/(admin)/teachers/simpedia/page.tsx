export default function SimpediaPage() {
  const latestPosts = [
    {
      title: 'Why Teach Simply Music',
      excerpt:
        'A reflection on teaching philosophies and what makes Simply Music different in the studio.',
      tag: 'Teaching',
    },
    {
      title: 'Parent Support Kit',
      excerpt:
        'A practical kit you can share with parents to reinforce progress at home.',
      tag: 'Resources',
    },
    {
      title: 'Traditional Lessons and Pain/Injury',
      excerpt:
        'Exploring posture, movement, and sustainable practice techniques for students.',
      tag: 'Wellness',
    },
    {
      title: 'Here to Stay A Chords',
      excerpt:
        'Jazz Clue 2 questions and voicing ideas for “Here to Stay”.',
      tag: 'Repertoire',
    },
    {
      title: 'Shoo-fly as Blues Piece',
      excerpt:
        'Thoughts on arrangement flow and teaching sequence for Shoo-fly.',
      tag: 'Curriculum',
    },
    {
      title: 'High Five C Chord',
      excerpt:
        'Ideas for how to voice and teach the “C” chord in High Five.',
      tag: 'Technique',
    },
    {
      title: 'Piano Journey Journal',
      excerpt:
        'My adult student made this book with the help of chat GPT. He has included some inspiration messages for himself, some…',
      tag: 'Community',
    },
    {
      title: 'Shortening Rhythmic Phrases',
      excerpt:
        'I find that my students who don’t like to sing often shorten the ends of phrases in Dreams, Dog, Sleeping, Fur Elise, etc so they…',
      tag: 'Teaching',
    },
    {
      title: 'Explaining Enrollment Fees',
      excerpt:
        'Here’s a first! For those who have an initial or annual enrollment fee, have you ever had anyone ask you to “explain the enrollment…”',
      tag: 'Business',
    },
    {
      title: 'Teaching During Blackout',
      excerpt:
        'Any suggestions for in-person lessons while I have a black out? Won’t get power till after the lessons. Level 1 through to 3, kids,…',
      tag: 'Studio',
    },
    {
      title: 'Mooz Online Lessons',
      excerpt:
        'Anyone tried Mooz for online lessons? Thanks ahead of time for your sharing your thoughts. Yes. It’s great 👍 Equal quality to…',
      tag: 'Technology',
    },
    {
      title: 'Students Using Online Video Tutorials',
      excerpt:
        'What is your approach with young people who come to you after teaching themselves with online videos? I’ve encountered severa…',
      tag: 'Students',
    },
  ];

  return (
    <div className="space-y-8">
      <section
        className="relative overflow-hidden rounded-3xl border border-[var(--c-ecebe7)] p-8 text-white shadow-[0_30px_80px_-50px_rgba(0,0,0,0.6)]"
        style={{
          backgroundImage:
            "linear-gradient(135deg,rgba(24,24,26,0.82),rgba(45,48,55,0.78)), url('https://simpedia.info/wp-content/themes/musak/musak-simpedia/img/INFO-Banner-Front-Page.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(200,16,46,0.25),transparent_55%)]" />
        <div className="relative z-10 space-y-4">
          <p className="text-xs uppercase tracking-[0.4em] text-white/70">
            Simpedia
          </p>
          <h1 className="text-4xl font-semibold">
            Explore, Learn, and Ask
          </h1>
          <p className="max-w-2xl text-sm text-white/75">
            Search for teaching insights, studio resources, and community wisdom
            shared by Simply Music educators.
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white">
                ⌕
              </span>
              <input
                className="w-full bg-transparent text-sm text-white placeholder:text-white/60 outline-none"
                placeholder="Search posts and articles..."
              />
            </div>
            <button className="rounded-full border border-white/30 bg-white/15 px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-white/25">
              Search
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--c-ecebe7)] bg-white p-7 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] text-xl text-[var(--c-6f6c65)]">
            ≡
          </span>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
              Latest Posts
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
              Fresh From the Community
            </h2>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {latestPosts.map(post => (
            <div
              key={post.title}
              className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-5 transition hover:-translate-y-1 hover:bg-white hover:shadow-[0_18px_45px_-35px_rgba(0,0,0,0.4)]"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
                  {post.tag}
                </span>
                <span className="rounded-full border border-[var(--c-e5e3dd)] bg-white px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  New
                </span>
              </div>
              <h3 className="mt-3 text-xl font-semibold text-[var(--c-1f1f1d)]">
                {post.title}
              </h3>
              <p className="mt-2 text-sm text-[var(--c-6f6c65)]">
                {post.excerpt}
              </p>
              <button className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
                Read More
                <span className="text-base">→</span>
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
