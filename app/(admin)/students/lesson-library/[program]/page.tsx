import LessonLibraryProgram from '../../../components/lesson-library-program';

export default async function StudentProgramPage({
  params,
}: {
  params: Promise<{ program: string }>;
}) {
  const { program } = await params;
  return (
    <LessonLibraryProgram
      basePath="/students/lesson-library"
      programSlug={program}
      showLocks
    />
  );
}
