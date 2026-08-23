import React, { createContext, ReactNode, useMemo } from 'react';
import { ThemeMode, ThemeColors } from '../types';
import { useLocalStorage } from './useLocalStorage';

interface ThemeContextValue {
  theme: ThemeMode;
  currentThemeColors: ThemeColors;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useLocalStorage<ThemeMode>('theme', 'dark');

  const currentThemeColors = useMemo(() => {
    const colors = {
      light: {
        pageBackgroundColor: '#ffffff',
        pageForegroundColor: '#000000',
        lightSquareColor: '#f0d9b5',
        darkSquareColor: '#b58863',
        arrowBorderColor: '#000000',
        headerBackgroundColor: '#ffffff',
        headerTextColor: '#000000',
      },
      dark: {
        pageBackgroundColor: '#000000',
        pageForegroundColor: '#ffffff',
        lightSquareColor: '#444444',
        darkSquareColor: '#000000',
        arrowBorderColor: '#ffffff',
        headerBackgroundColor: '#000000',
        headerTextColor: '#ffffff',
      }
    };
    return colors[theme];
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, currentThemeColors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
