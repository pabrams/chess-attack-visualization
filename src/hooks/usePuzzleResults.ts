import { useState, useCallback, useRef } from 'react';
import { PuzzleAttempt } from '../types/drill';
import { useLocalStorage } from './useLocalStorage';
import type { RatingResult } from './useRating';

export const ATTEMPTS_STORAGE_KEY = 'puzzleAttempts';

interface UsePuzzleResultsProps {
  applyResult: (puzzleId: string, puzzleRating: number, success: boolean) => Promise<RatingResult>;
}

const createAttemptId = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const usePuzzleResults = ({ applyResult }: UsePuzzleResultsProps) => {
  const [attempts, setAttempts] = useLocalStorage<PuzzleAttempt[]>(ATTEMPTS_STORAGE_KEY, []);
  const [lastResult, setLastResult] = useState<boolean | null>(null);
  const applyResultRef = useRef(applyResult);
  applyResultRef.current = applyResult;

  const recordResult = useCallback((success: boolean, puzzleRating: number, puzzleId: string) => {
    const attemptId = createAttemptId();

    setAttempts(prev => [{
      attemptId,
      puzzleId,
      puzzleRating,
      ratingChange: 0,
      timestamp: Date.now(),
      success,
    }, ...prev]);
    setLastResult(success);

    applyResultRef.current(puzzleId, puzzleRating, success).then(({ ratingChange, synced }) => {
      setAttempts(prev => prev.map(attempt =>
        attempt.attemptId === attemptId
          ? { ...attempt, ratingChange, syncedToLichess: synced }
          : attempt
      ));
    });
  }, [setAttempts]);

  return {
    attempts,
    lastResult,
    recordResult,
  };
};
