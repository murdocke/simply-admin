export default function LibraryPage() {
  const categories = [
    {
      title: 'Curriculum Content',
      items: [
        'Foundation & Development',
        'General Curriculum',
        'Miscellaneous',
        'Special Programs',
        'Supplemental Programs',
      ],
    },
    {
      title: 'Educational Concepts',
      items: ['Core Conversations', 'Other Resources'],
    },
    {
      title: 'Managing Your Business',
      items: ['Financial', 'Forms & Resources', 'General Business', 'Legals'],
    },
    {
      title: 'Managing Your Classes',
      items: ['Curriculum Execution', 'Managing Students', 'Shared Lessons'],
    },
    {
      title: 'Marketing & Advertising',
      items: ['Introductory Sessions'],
    },
    {
      title: 'Promotional Materials & Resources',
      items: ['Talking About Simply Music'],
    },
    {
      title: 'Music in the Media',
      items: ['Special Needs', 'Teacher Growth'],
    },
    {
      title: 'Glossary',
      items: ['Acronyms & Abbreviations', 'Core Tenets', 'Terms of Art'],
    },
    {
      title: 'Managing Relationships',
      items: ['Improving Communication Skills', 'Mindset', 'Teacher Status & Experience'],
    },
    {
      title: 'Updates',
      items: ['Curriculum Updates & Corrections', 'Simply Music Updates'],
    },
    {
      title: 'Using MAC in Your Studio',
      items: ['Music & Creativity (MAC) Resources'],
    },
  ];

  const recent = [
    {
      date: '02.21.25',
      title: 'Tech Update & Important New Opportunities',
      links: [
        { label: "Neil's Update - Tech Update & Important New Opportunities", type: 'Video' },
        { label: '02.21.25 Update - Transcript (PDF)', type: 'PDF' },
      ],
      foundIn: ['Simply Music Updates', 'Updates'],
    },
    {
      date: '01.26.25',
      title: 'New Platform, Messaging & Marketing',
      links: [
        { label: "Neil's Update - New Platform, Messaging & Marketing", type: 'Video' },
        { label: '01.17.25 Update - Transcript (PDF)', type: 'PDF' },
      ],
      foundIn: ['Simply Music Updates', 'Updates'],
    },
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-[var(--c-ecebe7)] bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(252,252,251,0.8))] p-7 shadow-[0_26px_60px_-40px_rgba(0,0,0,0.25)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-c8102e)]">
          Library
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-[var(--c-1f1f1d)]">
          Library Hub
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-[var(--c-6f6c65)]">
          Use the search bar or explore categories to find resources, updates, and
          reference materials for your studio.
        </p>
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-[var(--c-ecebe7)] bg-white p-3 shadow-sm sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-3 rounded-xl border border-[var(--c-e5e3dd)] bg-[var(--c-fafafa)] px-4 py-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--c-e5e3dd)] bg-white text-[var(--c-6f6c65)]">
              ⌕
            </span>
            <input
              className="w-full bg-transparent text-sm text-[var(--c-1f1f1d)] outline-none"
              placeholder="Search Library..."
            />
          </div>
          <button className="rounded-full border border-[var(--c-c8102e)] bg-[var(--c-c8102e)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:brightness-110">
            Search
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--c-ecebe7)] bg-white p-7 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] text-xl text-[var(--c-6f6c65)]">
            ⌂
          </span>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
              Library Categories
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
              Browse By Topic
            </h2>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categories.map(category => (
            <div
              key={category.title}
              className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-5"
            >
              <p className="text-sm font-semibold text-[var(--c-1f1f1d)]">
                {category.title}
              </p>
              <div className="mt-4 flex flex-col gap-2 text-sm text-[var(--c-6f6c65)]">
                {category.items.map(item => (
                  <button
                    key={item}
                    className="flex items-center justify-between rounded-xl border border-transparent px-3 py-2 text-left transition hover:border-[var(--c-e5e3dd)] hover:bg-white"
                  >
                    <span>{item}</span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--c-9a9892)]">
                      View
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--c-ecebe7)] bg-white p-7 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-f7f7f5)] text-xl text-[var(--c-6f6c65)]">
            ≡
          </span>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
              Recently Added
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--c-1f1f1d)]">
              Fresh Updates
            </h2>
          </div>
        </div>
        <div className="mt-6 grid gap-4">
          {recent.map(item => (
            <div
              key={item.title}
              className="rounded-2xl border border-[var(--c-ecebe7)] bg-[var(--c-fcfcfb)] p-5"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
                    {item.date}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-[var(--c-1f1f1d)]">
                    {item.title}
                  </h3>
                </div>
                <span className="rounded-full border border-[var(--c-e5e3dd)] bg-white px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                  Update
                </span>
              </div>
              <div className="mt-4 flex flex-col gap-2 text-sm text-[var(--c-6f6c65)]">
                {item.links.map(link => (
                  <div
                    key={link.label}
                    className="flex items-center justify-between rounded-xl border border-[var(--c-ecebe7)] bg-white px-3 py-2"
                  >
                    <span>{link.label}</span>
                    <span className="rounded-full border border-[var(--c-e5e3dd)] bg-[var(--c-fafafa)] px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]">
                      {link.type}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[var(--c-6f6c65)]">
                <span className="uppercase tracking-[0.3em] text-[var(--c-9a9892)]">
                  Found in
                </span>
                {item.foundIn.map(tag => (
                  <span
                    key={tag}
                    className="rounded-full border border-[var(--c-e5e3dd)] bg-white px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--c-6f6c65)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
