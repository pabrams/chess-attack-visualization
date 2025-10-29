import { useState, useEffect, useRef, useCallback } from 'react';
import { PuzzleAttempt } from '../types/drill';
import { calculateRatingChange } from '../utils/ratingCalculation';

interface UsePuzzleResultsProps {
  rating: number;
  onPointsAdded: (puzzleRating: number, success: boolean) => void;
}

function loadInitialAttempts(): PuzzleAttempt[] {
  const stored = localStorage.getItem('puzzleAttempts');

  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to parse puzzle attempts from localStorage:', error);
    }
  }
  return [];
}

export const usePuzzleResults = ({ rating, onPointsAdded }: UsePuzzleResultsProps) => {
  const [attempts, setAttempts] = useState<PuzzleAttempt[]>(loadInitialAttempts());
  const [lastResult, setLastResult] = useState<boolean | null>(null);

  const isFirstRenderRef = useRef(true);

  // Persist attempts to localStorage
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    localStorage.setItem('puzzleAttempts', JSON.stringify(attempts));
  }, [attempts]);

  const recordResult = useCallback((success: boolean, puzzleRating: number, puzzleId: string) => {
    const ratingChange = calculateRatingChange(rating, puzzleRating, success);

    const attempt: PuzzleAttempt = {
      puzzleId,
      puzzleRating,
      ratingChange,
      timestamp: Date.now(),
      success,
    };

    setAttempts(prev => [attempt, ...prev]);
    setLastResult(success);
    onPointsAdded(puzzleRating, success);
  }, [rating, onPointsAdded]);

  return {
    attempts,
    lastResult,
    recordResult,
  };
};
