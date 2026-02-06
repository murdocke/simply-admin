export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'sm_theme';

export const normalizeTheme = (value: string | null): ThemeMode =>
  value === 'dark' ? 'dark' : 'light';
