import LessonLibrarySection from '../../../../components/lesson-library-section';

export default async function CompanyProgramSectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ program: string; section: string }>;
  searchParams: Promise<{ material?: string; part?: string }>;
}) {
  const { program, section } = await params;
  const { material, part } = (await searchParams) ?? {};

  return (
    <LessonLibrarySection
      basePath="/company/lesson-library"
      programSlug={program}
      sectionSlug={section}
      showLocks={false}
      backToRoot
      material={material}
      part={part}
    />
  );
}
