export type LessonPackStatus = 'draft' | 'published';
export type LessonPackAudience = 'student' | 'teacher';
export type LessonPackBlockVisibility = 'student' | 'teacher' | 'both';

export type LessonPackBlockType =
  | 'heading'
  | 'richText'
  | 'image'
  | 'pdf'
  | 'soundSlice'
  | 'linkExternal'
  | 'linkInternal';

export type LessonPackBlock = {
  id: string;
  type: LessonPackBlockType;
  visibility: LessonPackBlockVisibility;
  order: number;
  data: Record<string, unknown>;
};

export type LessonPack = {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  coverImage?: string;
  tags: string[];
  price?: number;
  status: LessonPackStatus;
  createdAt: string;
  updatedAt: string;
  blocks: LessonPackBlock[];
};

export const LESSON_PACKS_KEY = 'sm-lesson-packs';

export const emptyLessonPack = (): LessonPack => {
  const now = new Date().toISOString();
  return {
    id: `pack-${Math.random().toString(36).slice(2, 10)}`,
    title: 'Untitled Lesson Pack',
    subtitle: '',
    description: '',
    coverImage: '',
    tags: [],
    price: undefined,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    blocks: [],
  };
};

export const loadLessonPacks = (): LessonPack[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = window.localStorage.getItem(LESSON_PACKS_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as LessonPack[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveLessonPacks = (packs: LessonPack[]) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LESSON_PACKS_KEY, JSON.stringify(packs));
  } catch {
    // ignore
  }
};
