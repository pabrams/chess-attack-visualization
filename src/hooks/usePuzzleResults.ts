import { useState, useCallback, useRef, useEffect } from 'react';
import { PuzzleAttempt } from '../types/drill';
import { calculateRatingChange } from '../utils/ratingCalculation';
import { useLocalStorage } from './useLocalStorage';

interface UsePuzzleResultsProps {
  rating: number;
  onPointsAdded: (puzzleRating: number, success: boolean) => void;
}

export const usePuzzleResults = ({ rating, onPointsAdded }: UsePuzzleResultsProps) => {
  const [attempts, setAttempts] = useLocalStorage<PuzzleAttempt[]>(
    'puzzleAttempts',
    [],
  );
  const [lastResult, setLastResult] = useState<boolean | null>(null);

  // Skip persisting on first render
  const isFirstRenderRef = useRef(true);
  const ratingRef = useRef(rating);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
    }
  }, []);

  useEffect(() => {
    ratingRef.current = rating;
  }, [rating]);

  const recordResult = useCallback((success: boolean, puzzleRating: number, puzzleId: string) => {
    const ratingChange = calculateRatingChange(ratingRef.current, puzzleRating, success);

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
  }, [onPointsAdded, setAttempts]);

  return {
    attempts,
    lastResult,
    recordResult,
  };
};
