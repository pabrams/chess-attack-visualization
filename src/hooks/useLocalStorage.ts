import { useState, useEffect } from 'react';

/**
 * Custom hook for managing localStorage with React state
 * Automatically persists state to localStorage and rehydrates on mount
 */
export const useLocalStorage = <T,>(
  key: string,
  initialValue: T,
  parse?: (value: string) => T,
  stringify?: (value: T) => string
): [T, (value: T | ((prev: T) => T)) => void] => {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        return parse ? parse(stored) : (JSON.parse(stored) as T);
      } catch (error) {
        console.error(`Failed to parse localStorage value for key "${key}":`, error);
        return initialValue;
      }
    }
    return initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, stringify ? stringify(value) : JSON.stringify(value));
  }, [key, value, stringify]);

  return [value, setValue];
};
