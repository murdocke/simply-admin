import { slugifyLessonValue } from './lesson-utils';

export const PRACTICE_SELECTIONS_KEY = 'sm_practice_hub_selected_items_v1';
export const PRACTICE_FOCUS_KEY = 'sm_practice_hub_focus_items_v1';
export const PRACTICE_CLIPBOARD_KEY = 'sm_practice_hub_clipboard_v1';

export const makePracticeMaterialId = (
  program: string,
  section: string,
  material: string,
) =>
  `${slugifyLessonValue(program)}::${slugifyLessonValue(section)}::${slugifyLessonValue(material)}`;

export const getPracticeSelectionsKey = (scope?: string | null) => {
  if (!scope) return PRACTICE_SELECTIONS_KEY;
  return `${PRACTICE_SELECTIONS_KEY}:${scope}`;
};

export const getPracticeFocusKey = (scope?: string | null) => {
  if (!scope) return PRACTICE_FOCUS_KEY;
  return `${PRACTICE_FOCUS_KEY}:${scope}`;
};
