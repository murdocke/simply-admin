'use client';

import { useApiData } from './use-api-data';

export type LessonTypes = string[];
export type LessonSections = Record<string, unknown>;
export type LessonMaterials = Record<string, string[]>;
export type LessonParts = Record<string, string[]>;

export const useLessonData = () => {
  const { data: typesData } = useApiData<{ types: LessonTypes }>(
    '/api/lesson-data/types',
    { types: [] },
  );
  const { data: sectionsData } = useApiData<{ sections: LessonSections }>(
    '/api/lesson-data/sections',
    { sections: {} },
  );
  const { data: materialsData } = useApiData<{ materials: LessonMaterials }>(
    '/api/lesson-data/materials',
    { materials: {} },
  );
  const { data: partsData } = useApiData<{ parts: LessonParts }>(
    '/api/lesson-data/parts',
    { parts: {} },
  );

  return {
    lessonTypes: typesData.types ?? [],
    lessonSections: sectionsData.sections ?? {},
    lessonMaterials: materialsData.materials ?? {},
    lessonParts: partsData.parts ?? {},
  };
};
