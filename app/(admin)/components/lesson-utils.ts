export const slugifyLessonValue = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const makeLessonId = (programName: string, sectionName: string) =>
  `${slugifyLessonValue(programName)}::${slugifyLessonValue(sectionName)}`;
