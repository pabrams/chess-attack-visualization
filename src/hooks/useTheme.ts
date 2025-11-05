import { useMemo, useEffect } from 'react';
import { ThemeMode } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { DARK_THEME_COLORS, LIGHT_THEME_COLORS } from '../config/themeColors';

export const useTheme = () => {
  const [theme, setTheme] = useLocalStorage<ThemeMode>(
    'theme',
    'dark',
    (value) => (value === 'light' ? 'light' : 'dark'),
    (value) => value
  );

  const currentThemeColors = useMemo(
    () => theme === 'dark' ? DARK_THEME_COLORS : LIGHT_THEME_COLORS,
    [theme]
  );

  useEffect(() => {
    document.body.className = `theme-${theme}`;
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return {
    theme,
    currentThemeColors,
    toggleTheme,
  };
};
