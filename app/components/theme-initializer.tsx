'use client';

import { useEffect } from 'react';
import { normalizeTheme, THEME_STORAGE_KEY } from './theme';

export default function ThemeInitializer() {
  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    const nextTheme = normalizeTheme(stored);
    document.documentElement.dataset.theme = nextTheme;
  }, []);

  return null;
}
