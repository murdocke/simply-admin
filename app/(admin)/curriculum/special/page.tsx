import { CurriculumGroupView } from '../[group]/page';

type SpecialPageProps = {
  searchParams?: { key?: string };
};

export default function SpecialPage({ searchParams }: SpecialPageProps) {
  return (
    <CurriculumGroupView groupKey="special" searchParams={searchParams} />
  );
}
