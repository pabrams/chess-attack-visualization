import { useReducer, useCallback, useRef } from 'react';
import { LichessPuzzle } from '../types/lichess';

export const SOLVE_COMPLETION_DELAY_MS = 1000;

interface PuzzleQueueState {
  current: LichessPuzzle | null;
  remaining: LichessPuzzle[];
}

type PuzzleQueueAction =
  | { type: 'INITIALIZE'; payload: LichessPuzzle[] }
  | { type: 'ADVANCE' };

const initialState: PuzzleQueueState = {
  current: null,
  remaining: [],
};

const puzzleQueueReducer = (state: PuzzleQueueState, action: PuzzleQueueAction): PuzzleQueueState => {
  switch (action.type) {
    case 'INITIALIZE': {
      const puzzles = action.payload;
      const newState = {
        current: puzzles[0] ?? null,
        remaining: puzzles.slice(1),
      };
      console.log('[puzzleQueueReducer] INITIALIZE: setting current to', newState.current?.puzzle?.id, 'with', newState.remaining.length, 'remaining');
      return newState;
    }
    case 'ADVANCE': {
      const next = state.remaining[0] ?? null;
      const newRemaining = state.remaining.slice(1);
      const newState = {
        current: next,
        remaining: newRemaining,
      };
      console.log('[puzzleQueueReducer] ADVANCE: setting current to', newState.current?.puzzle?.id, 'with', newState.remaining.length, 'remaining');
      return newState;
    }
    default:
      return state;
  }
};

interface UsePuzzleQueueProps {
  puzzles: LichessPuzzle[];
}

export const usePuzzleQueue = ({ puzzles }: UsePuzzleQueueProps) => {
  const [state, dispatch] = useReducer(puzzleQueueReducer, initialState);
  const initializedRef = useRef(false);

  // Initialize queue synchronously when puzzles are loaded
  if (puzzles.length > 0 && !initializedRef.current) {
    initializedRef.current = true;
    console.log('[usePuzzleQueue] INITIALIZE with', puzzles.length, 'puzzles, first puzzle id:', puzzles[0]?.puzzle?.id);
    dispatch({ type: 'INITIALIZE', payload: puzzles });
  }

  const advanceToNextPuzzle = useCallback(() => {
    console.log('[usePuzzleQueue] ADVANCE called, state before:', {
      currentId: state.current?.puzzle?.id,
      remainingCount: state.remaining.length,
      nextPuzzleId: state.remaining[0]?.puzzle?.id,
    });
    dispatch({ type: 'ADVANCE' });
  }, []);

  console.log('[usePuzzleQueue] render: current:', state.current?.puzzle?.id, 'remaining:', state.remaining.length);

  return {
    currentPuzzle: state.current,
    remainingCount: state.remaining.length,
    advanceToNextPuzzle,
  };
};
