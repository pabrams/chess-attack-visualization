import { useMemo, useEffect } from 'react';
import { ThemeMode, ThemeColors } from '../types';
import { useLocalStorage } from './useLocalStorage';

export const useTheme = () => {
  const [theme, setTheme] = useLocalStorage<ThemeMode>(
    'theme',
    'dark',
    (value) => (value === 'light' ? 'light' : 'dark'),
    (value) => value
  );

  const currentThemeColors = useMemo(() => {
    // Read CSS variables based on current theme
    const getCSSVar = (name: string) =>
      getComputedStyle(document.documentElement).getPropertyValue(name).trim();

    return {
      pageBackgroundColor: getCSSVar('--chess-page-bg'),
      pageForegroundColor: getCSSVar('--chess-page-fg'),
      lightSquareColor: getCSSVar('--chess-light-square'),
      darkSquareColor: getCSSVar('--chess-dark-square'),
      whiteArrowColor: getCSSVar('--chess-white-arrow'),
      blackArrowColor: getCSSVar('--chess-black-arrow'),
      arrowBorderColor: getCSSVar('--chess-arrow-border'),
    } as ThemeColors;
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
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
