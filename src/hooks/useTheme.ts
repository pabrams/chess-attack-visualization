import { useState, useEffect } from 'react';
import { ThemeColors } from '../types/theme';

const LIGHT_THEME_COLORS: ThemeColors = {
  pageBackgroundColor: '#ffffff',
  pageForegroundColor: '#000000',
  lightSquareColor: '#f0d9b5',
  darkSquareColor: '#b58863',
  whiteArrowColor: '#cc0033',
  blackArrowColor: '#0066cc'
};

const DARK_THEME_COLORS: ThemeColors = {
  pageBackgroundColor: '#000000',
  pageForegroundColor: '#ffffff',
  lightSquareColor: '#444444',
  darkSquareColor: '#000000',
  whiteArrowColor: '#aa0033',
  blackArrowColor: '#0044bb'
};

export const useTheme = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    return savedTheme || 'dark';
  });

  const currentThemeColors = theme === 'dark' ? DARK_THEME_COLORS : LIGHT_THEME_COLORS;

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

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
