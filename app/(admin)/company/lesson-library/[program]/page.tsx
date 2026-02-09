import CompanyLessonLibraryProgram from '../../../components/company-lesson-library-program';

export default async function CompanyProgramPage({
  params,
}: {
  params: Promise<{ program: string }>;
}) {
  const { program } = await params;
  return <CompanyLessonLibraryProgram programSlug={program} />;
}
