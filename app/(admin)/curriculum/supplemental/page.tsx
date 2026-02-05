import { CurriculumGroupView } from '../[group]/page';

type SupplementalPageProps = {
  searchParams?: { key?: string };
};

export default function SupplementalPage({ searchParams }: SupplementalPageProps) {
  return (
    <CurriculumGroupView groupKey="supplemental" searchParams={searchParams} />
  );
}
