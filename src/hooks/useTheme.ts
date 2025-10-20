import { useState, useEffect } from 'react';
import { ThemeColors } from '../types/theme';

const LIGHT_THEME_COLORS: ThemeColors = {
  pageBackgroundColor: '#ffffff',
  pageForegroundColor: '#000000',
  lightSquareColor: '#ffffff',
  darkSquareColor: '#cccccc',
  whiteArrowColor: '#ff0000',
  blackArrowColor: '#0000ff'
};

const DARK_THEME_COLORS: ThemeColors = {
  pageBackgroundColor: '#000000',
  pageForegroundColor: '#ffffff',
  lightSquareColor: '#444444',
  darkSquareColor: '#000000',
  whiteArrowColor: '#ff0000',
  blackArrowColor: '#0000ff'
};

export const useTheme = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    return savedTheme || 'dark';
  });

  const currentThemeColors = theme === 'dark' ? DARK_THEME_COLORS : LIGHT_THEME_COLORS;

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Apply theme to body element
  useEffect(() => {
    document.body.style.backgroundColor = currentThemeColors.pageBackgroundColor;
    document.body.style.color = currentThemeColors.pageForegroundColor;
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    document.body.style.transition = 'background-color 0.2s ease';
  }, [currentThemeColors]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return {
    theme,
    currentThemeColors,
    toggleTheme,
  };
};
