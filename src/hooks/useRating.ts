import { useCallback, useState } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { calculateRatingChange } from '../utils/ratingCalculation';
import { LichessScopeError, submitPuzzleSolution } from '../services/lichessPuzzles';

const RATING_STORAGE_KEY = 'monkeyDrill_userRating';
export const RATING_MODE_STORAGE_KEY = 'chessAttack_ratingStorageMode';
const DEFAULT_RATING = 1;

export type RatingStorageMode = 'local' | 'lichess';

export interface UseRatingProps {
  mode: RatingStorageMode;
  token: string | null;
  lichessPuzzleRating: number | null;
  onScopeError?: () => void;
}

export interface RatingResult {
  ratingChange: number;
  /** False when a Lichess sync was attempted but did not go through. */
  synced: boolean;
}

export const useRating = ({ mode, token, lichessPuzzleRating, onScopeError }: UseRatingProps) => {
  const [localRating, setLocalRating] = useLocalStorage<number>(RATING_STORAGE_KEY, DEFAULT_RATING);
  const [syncedRating, setSyncedRating] = useState<number | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const usingLichess = mode === 'lichess' && !!token;
  const remoteRating = syncedRating ?? lichessPuzzleRating;
  const rating = usingLichess && remoteRating !== null ? remoteRating : localRating;

  const applyLocalResult = useCallback((puzzleRating: number, success: boolean) => {
    const points = calculateRatingChange(localRating, puzzleRating, success);

    let newRating = Math.ceil(localRating + points);
    if (newRating > 9999) newRating = 9999;
    if (newRating < 1) newRating = 1;

    setLocalRating(newRating);
    return points;
  }, [localRating, setLocalRating]);

  const applyResult = useCallback(async (
    puzzleId: string,
    puzzleRating: number,
    success: boolean
  ): Promise<RatingResult> => {
    // The local rating is always kept up to date
    const localChange = applyLocalResult(puzzleRating, success);

    if (!usingLichess) {
      return { ratingChange: localChange, synced: false };
    }

    try {
      const result = await submitPuzzleSolution(token!, puzzleId, success);
      setSyncError(null);

      if (typeof result.glicko?.rating === 'number') {
        setSyncedRating(Math.round(result.glicko.rating));
      }

      const round = result.rounds?.find(r => r.id === puzzleId) ?? result.rounds?.[0];
      return {
        ratingChange: typeof round?.ratingDiff === 'number' ? round.ratingDiff : localChange,
        synced: true,
      };
    } catch (error) {
      if (error instanceof LichessScopeError) {
        onScopeError?.();
        setSyncError('Lichess rejected the token. Log in again to sync your rating.');
      } else {
        console.error('Failed to sync rating to Lichess:', error);
        setSyncError('Could not reach Lichess. Rating change was kept locally.');
      }
      return { ratingChange: localChange, synced: false };
    }
  }, [applyLocalResult, usingLichess, token, onScopeError]);

  return {
    rating,
    localRating,
    /** True when the displayed rating is the one Lichess holds. */
    usingLichess,
    syncError,
    applyResult,
  };
};
