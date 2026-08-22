import { useReducer, useCallback, useEffect, useRef } from 'react';
import { Square, Chess } from 'chess.js';
import { LichessPuzzle } from '../types/lichess';
import { UserColor } from '../types/drill';
import type { ChessGame } from './useChessGame';
import {
  LichessRateLimitError,
  LichessScopeError,
  fetchPuzzleBatch,
  filterMateInOne,
} from '../services/lichessPuzzles';

const SOLVE_COMPLETION_DELAY_MS = 1000;
const STORAGE_KEY = 'monkeydrillState';
const BATCH_SIZE = 50;
/** Refill before the queue runs dry so the drill never stalls between batches. */
const REFILL_THRESHOLD = 5;
const RATE_LIMIT_BACKOFF_MS = 65000;
const ERROR_BACKOFF_MS = 5000;

interface UseDrillProps {
  chessGame: ChessGame;
  token: string | null;
  onPuzzleResult: (success: boolean, puzzleRating: number, puzzleId: string) => void;
  triggerPuzzleOutcomeVisuals: () => void;
  onLoadNext?: () => void;
  onScopeError?: () => void;
}

interface DrillState {
  puzzles: LichessPuzzle[];
}

type DrillAction =
  | { type: 'APPEND_PUZZLES'; payload: { puzzles: LichessPuzzle[] } }
  | { type: 'ADVANCE_PUZZLE' };

const initialState: DrillState = {
  puzzles: []
};

const initDrillState = (defaultState: DrillState): DrillState => {
  if (typeof window === 'undefined') return defaultState;
  try {
    const item = window.localStorage.getItem(STORAGE_KEY);
    if (!item) return defaultState;
    const parsed = JSON.parse(item);
    // Drop anything that isn't a mate in one.
    return { puzzles: filterMateInOne(parsed?.puzzles) };
  } catch {
    return defaultState;
  }
};

const drillReducer = (state: DrillState, action: DrillAction): DrillState => {
  switch (action.type) {
    case 'APPEND_PUZZLES':
      return { ...state, puzzles: [...state.puzzles, ...action.payload.puzzles] };
    case 'ADVANCE_PUZZLE':
      return { ...state, puzzles: state.puzzles.slice(1) };
    default:
      return state;
  }
};

export const useDrill = ({
  chessGame,
  token,
  onPuzzleResult,
  triggerPuzzleOutcomeVisuals,
  onLoadNext,
  onScopeError,
}: UseDrillProps) => {
  const [state, dispatch] = useReducer(drillReducer, initialState, initDrillState);
  const isFetching = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tokenRef = useRef(token);
  tokenRef.current = token;
  const onScopeErrorRef = useRef(onScopeError);
  onScopeErrorRef.current = onScopeError;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => () => {
    if (retryTimer.current) clearTimeout(retryTimer.current);
  }, []);

  const loadBoard = useCallback((puzzle: LichessPuzzle) => {
    if (!puzzle) return;
    const chess = new Chess();
    chess.loadPgn(puzzle.game.pgn);
    chessGame.loadPgn(chess.pgn());
    onLoadNext?.();
  }, [chessGame, onLoadNext]);

  const fetchPuzzles = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;

    if (retryTimer.current) {
      clearTimeout(retryTimer.current);
      retryTimer.current = null;
    }

    const scheduleRetry = (delay: number) => {
      retryTimer.current = setTimeout(() => {
        retryTimer.current = null;
        fetchPuzzles();
      }, delay);
    };

    try {
      const token = tokenRef.current;
      let result;
      try {
        result = await fetchPuzzleBatch(token, BATCH_SIZE);
      } catch (error) {
        // A token without the puzzle scopes 401s every request, so fall back to
        // anonymous puzzles rather than leaving the board empty.
        if (error instanceof LichessScopeError && token) {
          onScopeErrorRef.current?.();
          result = await fetchPuzzleBatch(null, BATCH_SIZE);
        } else {
          throw error;
        }
      }

      const queued = new Set(stateRef.current.puzzles.map(p => p.puzzle.id));
      const fresh = result.puzzles.filter(p => !queued.has(p.puzzle.id));

      if (fresh.length > 0) {
        dispatch({ type: 'APPEND_PUZZLES', payload: { puzzles: fresh } });
      } else if (result.puzzles.length > 0 && stateRef.current.puzzles.length === 0) {
        // Signed out, Lichess hands every client the same batch. Replaying it
        // beats leaving the board frozen with nothing to solve.
        dispatch({ type: 'APPEND_PUZZLES', payload: { puzzles: result.puzzles } });
      } else {
        scheduleRetry(ERROR_BACKOFF_MS);
      }
    } catch (error) {
      console.error('Failed to fetch puzzles:', error);
      scheduleRetry(error instanceof LichessRateLimitError ? RATE_LIMIT_BACKOFF_MS : ERROR_BACKOFF_MS);
    } finally {
      isFetching.current = false;
    }
  }, []);

  // Refill before the queue runs dry rather than after, so there is no gap
  // where a solved puzzle has nothing to advance to.
  useEffect(() => {
    if (state.puzzles.length <= REFILL_THRESHOLD) {
      fetchPuzzles();
    }
  }, [state.puzzles.length, fetchPuzzles]);

  const currentPuzzleId = state.puzzles[0]?.puzzle.id;
  useEffect(() => {
    const current = state.puzzles[0];
    if (current) loadBoard(current);
    // loadBoard is intentionally left out: it changes on every FEN update, and
    // re-running it here would reset the board mid-puzzle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPuzzleId]);

  const processPuzzleResult = useCallback((success: boolean) => {
    const current = state.puzzles[0];
    if (!current) return;

    onPuzzleResult(success, current.puzzle.rating, current.puzzle.id);

    setTimeout(() => {
      dispatch({ type: 'ADVANCE_PUZZLE' });
    }, SOLVE_COMPLETION_DELAY_MS);
  }, [state.puzzles, onPuzzleResult]);

  const handlePuzzleMove = useCallback((sourceSquare: Square, targetSquare: Square, promotion?: string) => {
    const current = state.puzzles[0];
    if (!current) return null;

    const move = chessGame.makeMove(sourceSquare, targetSquare, promotion);
    if (!move) return null;

    if (move.lan !== current.puzzle.solution[0]) {
      chessGame.undoLastMove();
      processPuzzleResult(false);
    } else {
      processPuzzleResult(true);
    }

    triggerPuzzleOutcomeVisuals();
    return move;
  }, [state.puzzles, chessGame, triggerPuzzleOutcomeVisuals, processPuzzleResult]);

  const currentPuzzle = state.puzzles[0];
  const userColor: UserColor = currentPuzzle
    ? (currentPuzzle.puzzle.initialPly % 2 === 0 ? 'black' : 'white')
    : 'white';

  return {
    drillState: { ...state, userColor, currentPuzzle },
    handlePuzzleMove,
  };
};
