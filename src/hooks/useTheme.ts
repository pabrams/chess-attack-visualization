import { useState, useEffect, useRef } from 'react';
import { ThemeColors } from '../types/theme';

const LIGHT_THEME_COLORS: ThemeColors = {
  pageBackgroundColor: '#f8f9fa',
  pageForegroundColor: '#000000',
  lightSquareColor: '#ffffff',
  darkSquareColor: '#777777',
  whiteArrowColor: '#ff0000',
  blackArrowColor: '#0000ff'
};

const DARK_THEME_COLORS: ThemeColors = {
  pageBackgroundColor: '#0a0a0a',
  pageForegroundColor: '#ffffff',
  lightSquareColor: '#dddddd',
  darkSquareColor: '#444444',
  whiteArrowColor: '#ff0000',
  blackArrowColor: '#0000ff'
};

export const useTheme = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    return savedTheme || 'dark';
  });

  const currentThemeColors = theme === 'dark' ? DARK_THEME_COLORS : LIGHT_THEME_COLORS;

  // Save theme to localStorage when it changes, but handle initial render correctly
  const isInitialRender = useRef(true);
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      // Only save to localStorage on initial render if no theme was previously saved
      const savedTheme = localStorage.getItem('theme');
      if (!savedTheme) {
        localStorage.setItem('theme', theme);
      }
      return;
    }
    // For subsequent renders, always save the theme
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
