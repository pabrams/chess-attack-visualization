import React, { createContext, useContext, ReactNode, useMemo, useEffect } from 'react';
import { ThemeMode, ThemeColors } from '../types';
import { useLocalStorage } from './useLocalStorage';

interface ThemeContextValue {
  theme: ThemeMode;
  currentThemeColors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useLocalStorage<ThemeMode>(
    'theme',
    'dark',
    (value) => (value === 'light' ? 'light' : 'dark'),
    (value) => value
  );

  const currentThemeColors = useMemo(() => {
    const getCSSVar = (name: string) =>
      getComputedStyle(document.documentElement).getPropertyValue(name).trim();

    return {
      pageBackgroundColor: getCSSVar('--chess-page-bg'),
      pageForegroundColor: getCSSVar('--chess-page-fg'),
      lightSquareColor: getCSSVar('--chess-light-square'),
      darkSquareColor: getCSSVar('--chess-dark-square'),
      arrowBorderColor: getCSSVar('--chess-arrow-border'),
    } as ThemeColors;
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const themeValue = {
    theme,
    currentThemeColors,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={themeValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

