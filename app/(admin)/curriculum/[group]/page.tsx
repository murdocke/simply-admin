export type CurriculumItem = {
  key: string;
  label: string;
  badge?: string;
};

export type CurriculumGroup = {
  title: string;
  subtitle: string;
  badge: string;
  items: CurriculumItem[];
};

export const curriculumGroups: Record<string, CurriculumGroup> = {
  foundation: {
    title: 'Foundation Program',
    subtitle: 'Levels 1-9 core progression and launch materials.',
    badge: 'FP',
    items: [
      { key: 'foundation-level-1', label: 'Foundation Level 1', badge: 'FL1' },
      { key: 'foundation-level-2', label: 'Foundation Level 2', badge: 'FL2' },
      { key: 'foundation-level-3', label: 'Foundation Level 3', badge: 'FL3' },
      { key: 'foundation-level-4', label: 'Foundation Level 4', badge: 'FL4' },
      { key: 'foundation-level-5', label: 'Foundation Level 5', badge: 'FL5' },
      { key: 'foundation-level-6', label: 'Foundation Level 6', badge: 'FL6' },
      { key: 'foundation-level-7', label: 'Foundation Level 7', badge: 'FL7' },
      { key: 'foundation-level-8', label: 'Foundation Level 8', badge: 'FL8' },
      { key: 'foundation-level-9', label: 'Foundation Level 9', badge: 'FL9' },
      {
        key: 'foundation-student-workshop',
        label: 'Student Workshop',
        badge: 'SW',
      },
    ],
  },
  development: {
    title: 'Development Program',
    subtitle: 'Levels 10-18 advancement, artistry, and performance readiness.',
    badge: 'DP',
    items: [
      { key: 'development-level-10', label: 'Development Level 10', badge: 'DP' },
      { key: 'development-level-11', label: 'Development Level 11', badge: 'DP' },
      { key: 'development-level-12', label: 'Development Level 12', badge: 'DP' },
      { key: 'development-level-13', label: 'Development Level 13', badge: 'DP' },
      { key: 'development-level-14', label: 'Development Level 14', badge: 'DP' },
      { key: 'development-level-15', label: 'Development Level 15', badge: 'DP' },
      { key: 'development-level-16', label: 'Development Level 16', badge: 'DP' },
      { key: 'development-level-17', label: 'Development Level 17', badge: 'DP' },
      { key: 'development-level-18', label: 'Development Level 18', badge: 'DP' },
    ],
  },
  special: {
    title: 'Special Programs',
    subtitle: 'Intensives, masterclasses, and event-based learning pathways.',
    badge: 'SP',
    items: [
      { key: 'special-masterclasses', label: 'Masterclasses', badge: 'SP' },
      { key: 'special-intensives', label: 'Intensives', badge: 'SP' },
      { key: 'special-artist-series', label: 'Artist Series', badge: 'SP' },
      { key: 'special-retreats', label: 'Studio Retreats', badge: 'SP' },
    ],
  },
  supplemental: {
    title: 'Supplemental Programs',
    subtitle: 'Teacher created programs and studio-built pathways.',
    badge: 'SU',
    items: [
      { key: 'supplemental-workshops', label: 'Workshops', badge: 'SU' },
      { key: 'supplemental-challenges', label: 'Studio Challenges', badge: 'SU' },
      { key: 'supplemental-seasonal', label: 'Seasonal Themes', badge: 'SU' },
      { key: 'supplemental-community', label: 'Community Showcases', badge: 'SU' },
    ],
  },
};

export const fallbackGroup: CurriculumGroup = {
  title: 'Curriculum',
  subtitle: 'Select a program to explore.',
  badge: 'SM',
  items: [],
};

type CurriculumGroupViewProps = {
  groupKey: string;
  searchParams?: { key?: string };
};

export function CurriculumGroupView({
  groupKey,
  searchParams,
}: CurriculumGroupViewProps) {
  const group = curriculumGroups[groupKey] ?? fallbackGroup;
  const selectedKey = searchParams?.key;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#c8102e]">
            Curriculum
          </p>
          <h1 className="text-3xl font-semibold text-[#1f1f1d] mt-2">
            {group.title}
          </h1>
          <p className="text-sm text-[#6f6c65] mt-2">{group.subtitle}</p>
        </div>
        {selectedKey ? (
          <span className="rounded-full border border-[#ecebe7] bg-white px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#6f6c65] shadow-sm">
            Key: {selectedKey}
          </span>
        ) : null}
      </header>

      <section className="rounded-2xl border border-[#ecebe7] bg-white p-6 shadow-sm">
        {group.items.length === 0 ? (
          <p className="text-sm text-[#6f6c65]">
            Pick a program from the curriculum library to view its levels.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {group.items.map(item => (
              <a
                key={item.key}
                href={`/curriculum/${groupKey}?key=${encodeURIComponent(
                  item.key,
                )}`}
                className="flex items-center gap-3 rounded-2xl border border-transparent p-2 transition hover:border-[#ecebe7] hover:bg-[#fafafa]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e11b22] text-xs font-semibold text-white">
                  {item.badge ?? group.badge}
                </div>
                <div className="text-sm font-medium text-[#5a5650]">
                  {item.label}
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

type CurriculumPageProps = {
  params: { group?: string };
  searchParams?: { key?: string };
};

export default function CurriculumGroupPage({
  params,
  searchParams,
}: CurriculumPageProps) {
  const groupKey = params.group ?? '';
  return (
    <CurriculumGroupView groupKey={groupKey} searchParams={searchParams} />
  );
}
