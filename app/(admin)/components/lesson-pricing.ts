import { slugifyLessonValue } from './lesson-utils';

export const STUDENT_SECTION_PRICE = 29;
export const TEACHER_SECTION_PRICE = 79;
const PRICE_OVERRIDES_KEY = 'sm_section_price_overrides';

const TEACHER_SECTION_PRICE_OVERRIDES = new Map(
  [
    ['Level 2', 125],
    ['Level 3', 125],
    ['Level 4', 125],
    ['Level 5', 125],
    ['Level 6', 125],
    ['Level 7', 125],
    ['Level 8', 125],
    ['Level 9', 125],
    ['Level 10', 50],
    ['Level 11', 50],
    ['Level 12', 50],
    ['Level 13', 50],
    ['Level 14', 50],
    ['Level 15', 50],
    ['Level 16', 50],
    ['Level 17', 50],
    ['Level 18', 50],
    ['Understanding Scale & Key', 45],
    ['Curriculum Guide', 45],
    ['Blues Infusion Program', 50],
    ['Teacher Collection Vol. 1 - Compositions by Simply Music Teachers', 30],
    ['Playing in the Moment', 12.5],
    ['Practice for the Busy Person', 12.5],
    ['Playlist Management', 15],
    ['Tune Toolkit - Comp & Improv Vol. 1', 50],
    ['Tune Toolkit - Comp & Improv Vol. 2', 50],
    ['Foundation Duets & Variations Vol. 1', 30],
    ['The Chord Drill', 15],
    ['Songs for Children', 30],
    ['Songs for Christmas', 30],
    ['Songs for Everyone', 30],
    ['Music for Christmas & New Year', 30],
    ['Foundation Duets & Variations Vol. 2', 30],
    ["Read 'n' Play Vol. 1 - Rhythm", 15],
    ['A White & Blue Christmas', 5],
    ["Read 'n' Play Vol. 2 - Pitch", 15],
    ['Developing Studio Policies', 9],
    ['Dealing with Parents', 9],
    ['Managing Shared Lessons', 9],
    ['Managing Practice Time', 9],
    ['Teaching Arrangements 1', 9],
    ['Teaching Arrangements 2', 9],
    ['Getting the Most out of Accompaniments', 9],
    ['Using the Pedal', 9],
    ['Teaching Foundation Level 4', 9],
    ['Teaching Time for More Music', 9],
    ['Teaching Jazz Clues', 9],
    ['Arrangements 1', 35],
    ['Arrangements 2', 35],
    ['Arrangements 3', 35],
    ['Accompaniment 1', 85],
    ['Accompaniment 2', 85],
    ['Accompaniment Variations', 35],
    ['Blues & Improvisation', 40],
    ['Reading Rhythm', 85],
    ['Reading Notes', 85],
    ['Time for More Music', 85],
    ['Jazz Clues', 85],
  ].map(([name, price]) => [slugifyLessonValue(name), price]),
);

const normalizeSectionName = (value?: string | null) => {
  if (!value) return '';
  return value
    .replace(/\s*[-–—]\s*License$/i, '')
    .replace(/\s+License$/i, '')
    .replace(/^TWS:\s*/i, '')
    .replace(/\s*&\s*the\s+/i, ' & ')
    .trim();
};

type PriceOverride = {
  student?: number;
  teacher?: number;
};

let overridesLoaded = false;
const runtimeOverrides = new Map<string, PriceOverride>();

const makeOverrideKey = (program?: string, section?: string) => {
  const programSlug = program ? slugifyLessonValue(program) : '';
  const sectionSlug = section
    ? slugifyLessonValue(normalizeSectionName(section))
    : '';
  return `${programSlug}::${sectionSlug}`;
};

const loadOverrides = (force = false) => {
  if (!force && overridesLoaded) return;
  if (typeof window === 'undefined') return;
  overridesLoaded = true;
  try {
    const stored = window.localStorage.getItem(PRICE_OVERRIDES_KEY);
    if (!stored) return;
    const parsed = JSON.parse(stored) as Record<string, PriceOverride>;
    Object.entries(parsed ?? {}).forEach(([key, value]) => {
      if (!value || typeof value !== 'object') return;
      runtimeOverrides.set(key, value);
    });
  } catch {
    // ignore storage errors
  }
};

const readOverrideFromStorage = (key: string) => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(PRICE_OVERRIDES_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as Record<string, PriceOverride>;
    const value = parsed?.[key];
    if (!value || typeof value !== 'object') return null;
    runtimeOverrides.set(key, value);
    return value;
  } catch {
    return null;
  }
};

const persistOverrides = () => {
  if (typeof window === 'undefined') return;
  try {
    const payload: Record<string, PriceOverride> = {};
    runtimeOverrides.forEach((value, key) => {
      payload[key] = value;
    });
    window.localStorage.setItem(PRICE_OVERRIDES_KEY, JSON.stringify(payload));
    window.dispatchEvent(new Event('sm-pricing-updated'));
  } catch {
    // ignore storage errors
  }
};

export const setSectionPriceOverrides = (
  program?: string,
  section?: string,
  prices?: PriceOverride,
) => {
  loadOverrides();
  const key = makeOverrideKey(program, section);
  if (!key) return;
  if (!prices) return;
  runtimeOverrides.set(key, prices);
  persistOverrides();
};

export const hydrateSectionPriceOverrides = async () => {
  if (typeof window === 'undefined') return;
  try {
    const response = await fetch('/api/pricing-overrides');
    if (!response.ok) return;
    const data = (await response.json()) as {
      overrides?: Record<string, PriceOverride>;
    };
    runtimeOverrides.clear();
    Object.entries(data.overrides ?? {}).forEach(([key, value]) => {
      if (!value || typeof value !== 'object') return;
      runtimeOverrides.set(key, value);
    });
    overridesLoaded = true;
    persistOverrides();
  } catch {
    // ignore fetch errors
  }
};

export const saveSectionPriceOverrides = async (
  program?: string,
  section?: string,
  prices?: PriceOverride,
) => {
  setSectionPriceOverrides(program, section, prices);
  if (typeof window === 'undefined') return;
  try {
    await fetch('/api/pricing-overrides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        program,
        section,
        student: prices?.student,
        teacher: prices?.teacher,
      }),
    });
  } catch {
    // ignore fetch errors
  }
};

export const getSectionPriceOverride = (
  role?: string | null,
  program?: string,
  section?: string,
) => {
  loadOverrides();
  const key = makeOverrideKey(program, section);
  const override = runtimeOverrides.get(key) ?? readOverrideFromStorage(key);
  if (!override) return null;
  if (role === 'teacher') return override.teacher ?? null;
  return override.student ?? null;
};

export const refreshSectionPriceOverrides = () => {
  runtimeOverrides.clear();
  overridesLoaded = false;
  loadOverrides(true);
};

export const getSectionPriceForRole = (
  role?: string | null,
  program?: string,
  section?: string,
) => {
  const override = getSectionPriceOverride(role, program, section);
  if (override != null) return override;
  const programSlug = program ? slugifyLessonValue(program) : '';
  const sectionSlug = section
    ? slugifyLessonValue(normalizeSectionName(section))
    : '';
  if (programSlug === slugifyLessonValue('Simply Music Gateway')) {
    return 125;
  }
  if (role === 'teacher') {
    if (sectionSlug === 'level-1') {
      return 0;
    }
    const override = TEACHER_SECTION_PRICE_OVERRIDES.get(sectionSlug);
    if (override) return override;
    return TEACHER_SECTION_PRICE;
  }
  return STUDENT_SECTION_PRICE;
};

export const isTeacherAutoUnlocked = (program?: string, section?: string) => {
  if (!program || !section) return false;
  const sectionSlug = slugifyLessonValue(normalizeSectionName(section));
  return sectionSlug === 'level-1';
};

export const formatTeacherPriceLabel = (
  program?: string,
  section?: string,
) => {
  if (isTeacherAutoUnlocked(program, section)) return 'Included';
  return formatCurrency(getSectionPriceForRole('teacher', program, section));
};

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
