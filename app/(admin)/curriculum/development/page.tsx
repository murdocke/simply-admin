import { CurriculumGroupView } from '../[group]/page';

type DevelopmentPageProps = {
  searchParams?: { key?: string };
};

export default function DevelopmentPage({ searchParams }: DevelopmentPageProps) {
  return (
    <CurriculumGroupView groupKey="development" searchParams={searchParams} />
  );
}
