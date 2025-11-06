import { useState, useCallback, useRef } from 'react';
import { LichessPuzzle } from '../types/lichess';
import { UserColor } from '../types/drill';
import { getLevelFromRating } from '../utils/ratingCalculation';
import { sampleArray } from '../utils/arrayUtils';
import { convertToLichessPuzzleFormat, type RawPuzzle } from '../utils/puzzleUtils';

interface UsePuzzleLoaderProps {
  rating: number;
}

interface LoaderState {
  isLoading: boolean;
  error: string | null;
  puzzles: LichessPuzzle[];
  userColor: UserColor;
}

export const usePuzzleLoader = ({ rating }: UsePuzzleLoaderProps) => {
  const [state, setState] = useState<LoaderState>({
    isLoading: true,
    error: null,
    puzzles: [],
    userColor: 'white',
  });

  const initialRatingRef = useRef(rating);
  const loadedRef = useRef(false);

  const selectRandomUserColor = useCallback((): UserColor => {
    return Math.random() < 0.5 ? 'white' : 'black';
  }, []);

  const loadPuzzles = useCallback(async () => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const userColor = selectRandomUserColor();
      const playerLevel = getLevelFromRating(initialRatingRef.current);
      const colorPrefix = userColor === 'white' ? 'w' : 'b';
      const puzzleFile = `/lichess_db_puzzle-${colorPrefix}-one-move-${playerLevel}.json`;

      const response = await fetch(puzzleFile);
      if (!response.ok) {
        throw new Error(`Failed to load puzzle file: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as { puzzles: RawPuzzle[] };
      const sampled = sampleArray(data.puzzles, 200);
      const converted = convertToLichessPuzzleFormat(sampled);

      setState({
        isLoading: false,
        error: null,
        puzzles: converted,
        userColor,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error loading puzzles';
      console.error('Error loading puzzles:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        puzzles: [],
      }));
    }
  }, [selectRandomUserColor]);

  return {
    isLoading: state.isLoading,
    error: state.error,
    puzzles: state.puzzles,
    userColor: state.userColor,
    loadPuzzles,
  };
};
