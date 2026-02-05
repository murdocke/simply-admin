import { CurriculumGroupView } from '../[group]/page';

type FoundationPageProps = {
  searchParams?: { key?: string };
};

export default function FoundationPage({ searchParams }: FoundationPageProps) {
  return (
    <CurriculumGroupView groupKey="foundation" searchParams={searchParams} />
  );
}
