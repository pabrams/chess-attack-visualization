import { useReducer, useCallback, useEffect, useRef, useState } from 'react';
import { Square, Chess } from 'chess.js';
import { LichessPuzzle } from '../types/lichess';
import { UserColor } from '../types/drill';
import {
  DEFAULT_NEXT_PUZZLE_DELAY_MS,
  DEFAULT_PUZZLE_DIFFICULTY,
  PuzzleDifficulty,
} from '../types/settings';
import type { ChessGame } from './useChessGame';
import {
  LichessRateLimitError,
  LichessScopeError,
  fetchPuzzleBatch,
  filterMateInOne,
} from '../services/lichessPuzzles';

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
  difficulty?: PuzzleDifficulty;
  nextPuzzleDelayMs?: number | null;
}

interface DrillState {
  puzzles: LichessPuzzle[];
}

type DrillAction =
  | { type: 'APPEND_PUZZLES'; payload: { puzzles: LichessPuzzle[] } }
  | { type: 'ADVANCE_PUZZLE' }
  | { type: 'CLEAR_PUZZLES' };

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
    case 'CLEAR_PUZZLES':
      return { ...state, puzzles: [] };
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
  difficulty = DEFAULT_PUZZLE_DIFFICULTY,
  nextPuzzleDelayMs = DEFAULT_NEXT_PUZZLE_DELAY_MS,
}: UseDrillProps) => {
  const [state, dispatch] = useReducer(drillReducer, initialState, initDrillState);
  const [isAwaitingNext, setIsAwaitingNext] = useState(false);
  const isFetching = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tokenRef = useRef(token);
  tokenRef.current = token;
  const onScopeErrorRef = useRef(onScopeError);
  onScopeErrorRef.current = onScopeError;
  const difficultyRef = useRef(difficulty);
  const nextPuzzleDelayRef = useRef(nextPuzzleDelayMs);
  nextPuzzleDelayRef.current = nextPuzzleDelayMs;
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAwaitingNextRef = useRef(isAwaitingNext);
  isAwaitingNextRef.current = isAwaitingNext;
  const queueGeneration = useRef(0);

  useEffect(function persistQueueToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to cache the puzzle queue:', error);
    }
  }, [state]);

  useEffect(() => () => {
    if (retryTimer.current) clearTimeout(retryTimer.current);
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
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

    const generation = queueGeneration.current;
    try {
      const token = tokenRef.current;
      let result;
      try {
        result = await fetchPuzzleBatch(token, BATCH_SIZE, difficultyRef.current);
      } catch (error) {
        // A token without the puzzle scopes 401s every request, so fall back to
        // anonymous puzzles rather than leaving the board empty.
        if (error instanceof LichessScopeError && token) {
          onScopeErrorRef.current?.();
          result = await fetchPuzzleBatch(null, BATCH_SIZE, difficultyRef.current);
        } else {
          throw error;
        }
      }

      if (generation !== queueGeneration.current) return;

      const queued = new Set(stateRef.current.puzzles.map(p => p.puzzle.id));
      const fresh = result.puzzles.filter(p => !queued.has(p.puzzle.id));

      if (fresh.length > 0) {
        dispatch({ type: 'APPEND_PUZZLES', payload: { puzzles: fresh } });
      } else if (result.puzzles.length > 0 && stateRef.current.puzzles.length === 0) {
        // While signed out, play anonymous puzzle batch
        dispatch({ type: 'APPEND_PUZZLES', payload: { puzzles: result.puzzles } });
      } else {
        scheduleRetry(ERROR_BACKOFF_MS);
      }
    } catch (error) {
      console.error('Failed to fetch puzzles:', error);
      scheduleRetry(error instanceof LichessRateLimitError ? RATE_LIMIT_BACKOFF_MS : ERROR_BACKOFF_MS);
    } finally {
      isFetching.current = false;
      if (generation !== queueGeneration.current) fetchPuzzles();
    }
  }, []);

  useEffect(function restockOnDifficultyChange() {
    if (difficultyRef.current === difficulty) return;
    difficultyRef.current = difficulty;
    queueGeneration.current += 1;

    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
    setIsAwaitingNext(false);
    dispatch({ type: 'CLEAR_PUZZLES' });
  }, [difficulty]);

  useEffect(function keepQueueNonEmpty() {
    if (state.puzzles.length <= REFILL_THRESHOLD) {
      fetchPuzzles();
    }
  }, [state.puzzles.length, fetchPuzzles]);

  const currentPuzzleId = state.puzzles[0]?.puzzle.id;
  useEffect(function putPuzzleOnBoard() {
    const current = state.puzzles[0];
    if (current) loadBoard(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPuzzleId]);
  
  const loadNextPuzzle = useCallback(() => {
    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
    setIsAwaitingNext(false);
    dispatch({ type: 'ADVANCE_PUZZLE' });
  }, []);

  const processPuzzleResult = useCallback((success: boolean) => {
    const current = state.puzzles[0];
    if (!current) return;

    onPuzzleResult(success, current.puzzle.rating, current.puzzle.id);

    const delay = nextPuzzleDelayRef.current;
    if (delay === null) {
      setIsAwaitingNext(true);
      return;
    }

    advanceTimer.current = setTimeout(() => {
      advanceTimer.current = null;
      dispatch({ type: 'ADVANCE_PUZZLE' });
    }, delay);
  }, [state.puzzles, onPuzzleResult]);

  const handlePuzzleMove = useCallback((sourceSquare: Square, targetSquare: Square, promotion?: string) => {
    const current = state.puzzles[0];
    if (!current || isAwaitingNextRef.current) return null;

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
    drillState: { ...state, userColor, currentPuzzle, isAwaitingNext },
    handlePuzzleMove,
    loadNextPuzzle,
  };
};
