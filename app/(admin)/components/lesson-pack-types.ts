export type LessonPackStatus = 'draft' | 'published';
export type LessonPackSubjectLink = {
  label: string;
  url: string;
};

export type LessonPackSubject = {
  id: string;
  subjectNumber: number;
  title: string;
  body: string;
  headerImageUrl: string;
  headerVideoUrl: string;
  inlineVideoUrl: string;
  inlinePdfUrl: string;
  links: LessonPackSubjectLink[];
  soundSliceUrl: string;
  soundSlicePlacement: 'header' | 'body';
  soundSliceHeight: number;
  order: number;
};

export type LessonPack = {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  coverImage?: string;
  tags: string[];
  priceTeacher?: number;
  priceStudent?: number;
  subjectCount?: number;
  status: LessonPackStatus;
  createdAt: string;
  updatedAt: string;
  subjects: LessonPackSubject[];
};

const createEmptyLinks = (): LessonPackSubjectLink[] => [
  { label: '', url: '' },
  { label: '', url: '' },
  { label: '', url: '' },
];

export const createLessonSubject = (
  order: number,
  subjectNumber: number,
): LessonPackSubject => ({
  id: `subject-${Math.random().toString(36).slice(2, 10)}`,
  subjectNumber,
  title: 'UNTITLED LESSON SUBJECT',
  body: '',
  headerImageUrl: '',
  headerVideoUrl: '',
  inlineVideoUrl: '',
  inlinePdfUrl: '',
  links: createEmptyLinks(),
  soundSliceUrl: '',
  soundSlicePlacement: 'header',
  soundSliceHeight: 420,
  order,
});

export const emptyLessonPack = (): LessonPack => {
  const now = new Date().toISOString();
  return {
    id: `pack-${Math.random().toString(36).slice(2, 10)}`,
    title: 'Untitled Lesson Pack',
    subtitle: '',
    description: '',
    coverImage: '',
    tags: [],
    priceTeacher: undefined,
    priceStudent: undefined,
    subjectCount: 1,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    subjects: [],
  };
};
