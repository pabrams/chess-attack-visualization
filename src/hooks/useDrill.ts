import { useReducer, useCallback, useEffect, useRef } from 'react';
import { LichessPuzzle } from '../types/lichess';
import { PuzzleAttempt } from '../types/drill';
import type { ChessGame } from './useChessGame';
import { getLevelFromRating, calculateRatingChange } from '../utils/ratingCalculation';

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
  playerColor: 'white' | 'black';
  currentPuzzle: (LichessPuzzle & { _gameUrl?: string }) | null;
  puzzleState: PuzzleState;
  puzzleAttempts: PuzzleAttempt[];
  lastPuzzleResult: boolean | null;
}

type DrillAction =
  | { type: 'START_LOADING'; playerColor: 'white' | 'black' }
  | { type: 'PUZZLES_LOADED'; puzzles: LichessPuzzle[] }
  | { type: 'LOAD_NEXT_PUZZLE' }
  | { type: 'PUZZLE_STARTED'; puzzle: LichessPuzzle }
  | { type: 'PUZZLE_COMPLETED' }
  | { type: 'PUZZLE_FAILED' }
  | { type: 'PUZZLE_RESULT_RECORDED'; attempt: PuzzleAttempt; wasSuccess: boolean }
  | { type: 'LOADING_ERROR' }
  | { type: 'LOAD_ATTEMPTS'; attempts: PuzzleAttempt[] };

interface UseDrillProps {
  chessGame: ChessGame;
  rating: number;
  addPoints: (puzzleRating: number, success: boolean) => void;
}

const initialState: DrillState = {
  active: false,
  loading: false,
  puzzleQueue: [],
  playerColor: 'white',
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
        // Preserve puzzle attempts history when starting a new drill
        puzzleAttempts: state.puzzleAttempts,
        active: true,
        loading: true,
        playerColor: action.playerColor,
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
        puzzleState: {
          active: false,
          solution: [],
          completed: false,
          failed: false,
        },
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
        puzzleState: {
          active: false,
          solution: [],
          completed: false,
          failed: false,
        },
      };

    case 'LOADING_ERROR':
      return {
        ...state,
        loading: false,
        active: false,
      };

    case 'LOAD_ATTEMPTS':
      return {
        ...state,
        puzzleAttempts: action.attempts,
      };

    default:
      return state;
  }
}

const selectRandomPlayerColor = (): 'white' | 'black' => {
  return Math.random() < 0.5 ? 'white' : 'black';
};

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
    _gameUrl: p.gameUrl,
  } as any));
};

export const useDrill = ({ chessGame, rating, addPoints }: UseDrillProps) => {
  const [state, dispatch] = useReducer(drillReducer, initialState);
  
  // Track the initial rating to avoid restarting drill when rating changes
  const initialRatingRef = useRef(rating);
  
  // Load puzzle attempts from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('puzzleAttempts');
    if (stored) {
      try {
        const attempts = JSON.parse(stored);
        dispatch({ type: 'LOAD_ATTEMPTS', attempts });
      } catch (error) {
        console.error('Failed to load puzzle attempts:', error);
      }
    }
  }, []);

  // Save puzzle attempts to localStorage whenever they change
  useEffect(() => {
    if (state.puzzleAttempts.length > 0) {
      localStorage.setItem('puzzleAttempts', JSON.stringify(state.puzzleAttempts));
    }
  }, [state.puzzleAttempts]);

  // Initialize puzzle from FEN
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

  // Load next puzzle - this is called after recording a result
  const loadNextPuzzle = useCallback(() => {
    dispatch({ type: 'LOAD_NEXT_PUZZLE' });
  }, []);

  // Effect to initialize puzzle when currentPuzzle changes (but not active yet)
  useEffect(() => {
    if (state.currentPuzzle && !state.puzzleState.active) {
      initializePuzzleFromFen(state.currentPuzzle as any);
    }
  }, [state.currentPuzzle, state.puzzleState.active, initializePuzzleFromFen]);

  // Record puzzle result and load next puzzle
  const recordPuzzleResult = useCallback((success: boolean, puzzleRating: number, puzzleId: string) => {
    const ratingChange = calculateRatingChange(rating, puzzleRating, success);
    
    // Update external rating
    addPoints(puzzleRating, success);
    
    // Create attempt record
    const attempt: PuzzleAttempt = {
      puzzleId,
      puzzleRating,
      ratingChange,
      timestamp: Date.now(),
      success,
    };

    // Dispatch result
    dispatch({ type: 'PUZZLE_RESULT_RECORDED', attempt, wasSuccess: success });
    
    // Load next puzzle after a small delay to allow UI to update
    setTimeout(() => {
      loadNextPuzzle();
    }, 0);
  }, [rating, addPoints, loadNextPuzzle]);

  // Watch for puzzle completion or failure and record result
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

    // Record the result
    recordPuzzleResult(completed, puzzleRating, puzzleId);
  }, [state.puzzleState.completed, state.puzzleState.failed, state.active, state.currentPuzzle, recordPuzzleResult]);

  // Start drill on mount
  useEffect(() => {
    const startDrill = async () => {
      const playerColor = selectRandomPlayerColor();

      dispatch({ type: 'START_LOADING', playerColor });

      try {
        const playerLevel = getLevelFromRating(initialRatingRef.current);
        const colorPrefix = playerColor === 'white' ? 'w' : 'b';
        const puzzleFile = `/visualize-chessboard-territory/lichess_db_puzzle-${colorPrefix}-one-move-${playerLevel}.json`;

        console.log(`Loading ${playerColor} puzzles for level ${playerLevel} (rating: ${initialRatingRef.current}) from ${puzzleFile}...`);
        const response = await fetch(puzzleFile);

        if (!response.ok) {
          throw new Error(`Failed to load puzzle file: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const shuffled = data.puzzles.sort(() => Math.random() - 0.5).slice(0, 200);
        const puzzles = convertToLichessPuzzleFormat(shuffled);

        dispatch({ type: 'PUZZLES_LOADED', puzzles });
        
        // Load the first puzzle
        loadNextPuzzle();
      } catch (error) {
        console.error('Error loading puzzles:', error);
        dispatch({ type: 'LOADING_ERROR' });
      }
    };

    startDrill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

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

  const handlePuzzleMove = useCallback((sourceSquare: string, targetSquare: string, promotion?: string) => {
    if (!state.puzzleState.active) {
      return chessGame.makeMove(sourceSquare, targetSquare, promotion);
    }

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
      playerColor: state.playerColor,
      currentPuzzle: state.currentPuzzle,
    },
    puzzleState: state.puzzleState,
    puzzleAttempts: state.puzzleAttempts,
    lastPuzzleResult: state.lastPuzzleResult,
    handlePuzzleMove,
  };
};
