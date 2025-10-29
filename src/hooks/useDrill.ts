import { useReducer, useCallback, useEffect, useRef } from 'react';
import { Square } from 'chess.js';
import { LichessPuzzle } from '../types/lichess';
import { PuzzleAttempt, UserColor } from '../types/drill';
import type { ChessGame } from './useChessGame';
import { getLevelFromRating, calculateRatingChange } from '../utils/ratingCalculation';
import { sampleArray } from '../utils/arrayUtils';

interface PuzzleState {
  active: boolean;
  solution: string[]; // Single move in UCI format (e.g., ['e2e4'])
  completed: boolean;
  failed: boolean;
  puzzleStartTime?: number;
}

interface DrillState {
  active: boolean;
  loading: boolean;
  puzzleQueue: LichessPuzzle[];
  userColor: UserColor;
  currentPuzzle: LichessPuzzle | null;
  puzzleState: PuzzleState;
  puzzleAttempts: PuzzleAttempt[];
  lastPuzzleResult: boolean | null;
}

type DrillAction =
  | { type: 'START_LOADING'; userColor: UserColor }
  | { type: 'PUZZLES_LOADED'; puzzles: LichessPuzzle[] }
  | { type: 'LOAD_NEXT_PUZZLE' }
  | { type: 'PUZZLE_STARTED'; puzzle: LichessPuzzle }
  | { type: 'PUZZLE_COMPLETED' }
  | { type: 'PUZZLE_FAILED' }
  | { type: 'PUZZLE_RESULT_RECORDED'; attempt: PuzzleAttempt; wasSuccess: boolean }
  | { type: 'LOADING_ERROR' };

interface UseDrillProps {
  chessGame: ChessGame;
  rating: number;
  addPoints: (puzzleRating: number, success: boolean) => void;
}

const initialState: DrillState = {
  active: false,
  loading: false,
  puzzleQueue: [],
  userColor: 'white',
  currentPuzzle: null,
  puzzleState: {
    active: false,
    solution: [],
    completed: false,
    failed: false,
  },
  puzzleAttempts: [],
  lastPuzzleResult: null,
};

function drillReducer(state: DrillState, action: DrillAction): DrillState {
  switch (action.type) {
    case 'START_LOADING':
      return {
        ...initialState,
        puzzleAttempts: state.puzzleAttempts,
        active: true,
        loading: true,
        userColor: action.userColor,
        lastPuzzleResult: null,
      };

    case 'PUZZLES_LOADED':
      return {
        ...state,
        loading: false,
        puzzleQueue: action.puzzles,
      };

    case 'LOAD_NEXT_PUZZLE': {
      const [nextPuzzle, ...remainingQueue] = state.puzzleQueue;

      if (!nextPuzzle) {
        console.error('Puzzle queue is empty!');
        return state;
      }

      return {
        ...state,
        puzzleQueue: remainingQueue,
        currentPuzzle: nextPuzzle as any,
        puzzleState: createEmptyPuzzleState(),
      };
    }

    case 'PUZZLE_STARTED':
      return {
        ...state,
        puzzleState: {
          active: true,
          solution: action.puzzle.puzzle.solution,
          completed: false,
          failed: false,
          puzzleStartTime: Date.now(),
        },
      };

    case 'PUZZLE_COMPLETED':
      return {
        ...state,
        puzzleState: {
          ...state.puzzleState,
          completed: true,
        },
      };

    case 'PUZZLE_FAILED':
      return {
        ...state,
        puzzleState: {
          ...state.puzzleState,
          failed: true,
        },
      };

    case 'PUZZLE_RESULT_RECORDED':
      return {
        ...state,
        puzzleAttempts: [action.attempt, ...state.puzzleAttempts],
        lastPuzzleResult: action.wasSuccess,
        puzzleState: createEmptyPuzzleState(),
      };

    case 'LOADING_ERROR':
      return {
        ...state,
        loading: false,
        active: false,
      };

    default:
      return state;
  }
}

const selectRandomUserColor = (): UserColor => {
  return Math.random() < 0.5 ? 'white' : 'black';
};

const createEmptyPuzzleState = (): PuzzleState => ({
  active: false,
  solution: [],
  completed: false,
  failed: false,
});

const convertToLichessPuzzleFormat = (rawPuzzles: any[]): LichessPuzzle[] => {
  return rawPuzzles.map((p: any) => ({
    game: {
      pgn: '',
      id: p.gameUrl.split('/')[3] || p.id,
    },
    puzzle: {
      id: p.id,
      initialPly: 0,
      plays: 0,
      rating: p.rating,
      solution: [p.solution],
      themes: p.themes,
    },
    _fen: p.fen,
    _setupMove: p.setupMove,
  } as any));
};

function loadInitialState(): DrillState {
  const stored = localStorage.getItem('puzzleAttempts');
  
  if (stored) {
    try {
      const attempts = JSON.parse(stored);
      return {
        ...initialState,
        puzzleAttempts: attempts,
      };
    } catch (error) {
      console.error('Failed to parse puzzle attempts from localStorage:', error);
    }
  }
  return initialState;
}

export const useDrill = ({ chessGame, rating, addPoints }: UseDrillProps) => {
  const [state, dispatch] = useReducer(drillReducer, undefined, loadInitialState);
  const initialRatingRef = useRef(rating);
  const isFirstRenderRef = useRef(true);
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    
    localStorage.setItem('puzzleAttempts', JSON.stringify(state.puzzleAttempts));
  }, [state.puzzleAttempts]);

  const initializePuzzleFromFen = useCallback((puzzle: LichessPuzzle & { _setupMove?: string; _fen?: string }) => {
    import('chess.js').then(({ Chess }) => {
      const setupMove = puzzle._setupMove!;
      const fen = puzzle._fen!;

      const tempChess = new Chess(fen);
      const from = setupMove.substring(0, 2);
      const to = setupMove.substring(2, 4);
      const promotion = setupMove.length > 4 ? setupMove.substring(4) : undefined;

      const move = tempChess.move({ from, to, promotion: promotion as any });

      if (move) {
        const pgn = tempChess.pgn();
        const success = chessGame.loadPgn(pgn);

        if (success) {
          dispatch({ type: 'PUZZLE_STARTED', puzzle });
        }
      }
    });
  }, [chessGame]);

  const loadNextPuzzle = useCallback(() => {
    dispatch({ type: 'LOAD_NEXT_PUZZLE' });
  }, []);

  // Track the previous puzzle to know when a new one is loaded (not just when state changes)
  const prevPuzzleRef = useRef<LichessPuzzle | null>(null);

  useEffect(() => {
    // Only initialize when the puzzle actually changes (new puzzle from queue), not when puzzle state changes
    if (state.currentPuzzle && state.currentPuzzle !== prevPuzzleRef.current) {
      prevPuzzleRef.current = state.currentPuzzle;
      initializePuzzleFromFen(state.currentPuzzle as any);
    }
  }, [state.currentPuzzle, initializePuzzleFromFen]);

  const recordPuzzleResult = useCallback((success: boolean, puzzleRating: number, puzzleId: string) => {
    const ratingChange = calculateRatingChange(rating, puzzleRating, success);
    
    addPoints(puzzleRating, success);
    
    const attempt: PuzzleAttempt = {
      puzzleId,
      puzzleRating,
      ratingChange,
      timestamp: Date.now(),
      success,
    };

    dispatch({ type: 'PUZZLE_RESULT_RECORDED', attempt, wasSuccess: success });

    // Only delay on successful solve to show checkmate threats; fail immediately to next puzzle
    const delayMs = success ? 5000 : 0;
    setTimeout(() => {
      loadNextPuzzle();
    }, delayMs);
  }, [rating, addPoints, loadNextPuzzle]);

  useEffect(() => {
    if (!state.active || !state.currentPuzzle) {
      return;
    }

    const { completed, failed } = state.puzzleState;
    if (!completed && !failed) {
      return;
    }
    const puzzleRating = state.currentPuzzle.puzzle.rating;
    const puzzleId = state.currentPuzzle.puzzle.id;
    recordPuzzleResult(completed, puzzleRating, puzzleId);
  }, [state.puzzleState.completed, state.puzzleState.failed, state.active, state.currentPuzzle, recordPuzzleResult]);

  useEffect(() => {
    const startDrill = async () => {
      const userColor = selectRandomUserColor();

      dispatch({ type: 'START_LOADING', userColor });

      try {
        const playerLevel = getLevelFromRating(initialRatingRef.current);
        const colorPrefix = userColor === 'white' ? 'w' : 'b';
        const puzzleFile = `/lichess_db_puzzle-${colorPrefix}-one-move-${playerLevel}.json`;
        const response = await fetch(puzzleFile);

        if (!response.ok) {
          throw new Error(`Failed to load puzzle file: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const sampled = sampleArray(data.puzzles, 200);
        const puzzles = convertToLichessPuzzleFormat(sampled);

        dispatch({ type: 'PUZZLES_LOADED', puzzles });

        loadNextPuzzle();
      } catch (error) {
        console.error('Error loading puzzles:', error);
        dispatch({ type: 'LOADING_ERROR' });
      }
    };

    startDrill();
  }, []);

  const markPuzzleAsFailed = useCallback(() => {
    chessGame.undoLastMove();
    dispatch({ type: 'PUZZLE_FAILED' });
  }, [chessGame]);

  const markPuzzleAsCompleted = useCallback(() => {
    dispatch({ type: 'PUZZLE_COMPLETED' });
  }, []);

  const isMoveCorrect = (move: any, expectedMove: string): boolean => {
    return move.lan === expectedMove;
  };

  const handlePuzzleMove = useCallback((sourceSquare: Square, targetSquare: Square, promotion?: string) => {

    const move = chessGame.makeMove(sourceSquare, targetSquare, promotion);

    if (!move) {
      return move;
    }

    const expectedMove = state.puzzleState.solution[0];

    if (!isMoveCorrect(move, expectedMove)) {
      markPuzzleAsFailed();
      return null;
    }

    markPuzzleAsCompleted();
    return move;
  }, [state.puzzleState.active, state.puzzleState.solution, chessGame, markPuzzleAsFailed, markPuzzleAsCompleted]);

  return {
    drillState: {
      active: state.active,
      loading: state.loading,
      puzzleQueue: state.puzzleQueue,
      userColor: state.userColor,
      currentPuzzle: state.currentPuzzle,
    },
    puzzleState: state.puzzleState,
    puzzleAttempts: state.puzzleAttempts,
    lastPuzzleResult: state.lastPuzzleResult,
    handlePuzzleMove,
  };
};
