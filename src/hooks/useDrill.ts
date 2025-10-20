import { useState, useCallback, useEffect, useRef } from 'react';
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
}

interface UseDrillProps {
  chessGame: ChessGame;
  rating: number;
  addPoints: (playerRating: number, puzzleRating: number, success: boolean) => void;
}

export const useDrill = ({ chessGame, rating, addPoints }: UseDrillProps) => {
  const [drillState, setDrillState] = useState<DrillState>({
    active: false,
    loading: false,
    puzzleQueue: [],
    playerColor: 'white',
    currentPuzzle: null,
  });

  const [puzzleState, setPuzzleState] = useState<PuzzleState>({
    active: false,
    solution: [],
    completed: false,
    failed: false,
  });

  const [puzzleAttempts, setPuzzleAttempts] = useState<PuzzleAttempt[]>([]);
  const [lastPuzzleResult, setLastPuzzleResult] = useState<'success' | 'failure' | null>(null);

  // Use ref to break circular dependency between recordPuzzleResult and loadNextDrillPuzzle
  const loadNextDrillPuzzleRef = useRef<(() => void) | undefined>(undefined);

  const loadPuzzleAttemptsFromStorage = useCallback(() => {
    const stored = localStorage.getItem('puzzleAttempts');
    if (stored) {
      try {
        setPuzzleAttempts(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to load puzzle attempts:', error);
      }
    }
  }, []);

  useEffect(() => {
    loadPuzzleAttemptsFromStorage();
  }, [loadPuzzleAttemptsFromStorage]);

  const savePuzzleAttempt = useCallback((attempt: PuzzleAttempt) => {
    setPuzzleAttempts(prev => {
      const updated = [attempt, ...prev];
      localStorage.setItem('puzzleAttempts', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const recordPuzzleResult = useCallback((success: boolean, puzzleRating: number, puzzleId: string) => {
    const ratingChange = calculateRatingChange(rating, puzzleRating, success);
    addPoints(rating, puzzleRating, success);
    setLastPuzzleResult(success ? 'success' : 'failure');

    savePuzzleAttempt({
      puzzleId,
      puzzleRating,
      ratingChange,
      timestamp: Date.now(),
      success,
    });

    loadNextDrillPuzzleRef.current?.();
  }, [rating, addPoints, savePuzzleAttempt]);

  const resetPuzzleState = useCallback(() => {
    setPuzzleState({
      active: false,
      solution: [],
      completed: false,
      failed: false,
    });
  }, []);

  const startPuzzle = useCallback((puzzle: LichessPuzzle) => {
    setPuzzleState({
      active: true,
      solution: puzzle.puzzle.solution,
      completed: false,
      failed: false,
      puzzleStartTime: Date.now(),
    });
  }, []);

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
          startPuzzle(puzzle);
        }
      }
    });
  }, [chessGame, startPuzzle]);

  const loadNextDrillPuzzle = useCallback(() => {
    setDrillState(prev => {
      if (prev.puzzleQueue.length === 0) {
        console.error('Puzzle queue is empty!');
        return prev;
      }

      const [puzzle, ...remainingQueue] = prev.puzzleQueue;

      resetPuzzleState();
      initializePuzzleFromFen(puzzle as any);

      return {
        ...prev,
        puzzleQueue: remainingQueue,
        currentPuzzle: puzzle as any,
      };
    });
  }, [resetPuzzleState, initializePuzzleFromFen]);

  // Keep ref up to date
  loadNextDrillPuzzleRef.current = loadNextDrillPuzzle;

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

  const handleDrillStart = async () => {
    const playerColor = selectRandomPlayerColor();

    setDrillState({
      active: true,
      loading: true,
      puzzleQueue: [],
      playerColor,
      currentPuzzle: null,
    });
    setLastPuzzleResult(null);

    try {
      const playerLevel = getLevelFromRating(rating);
      const colorPrefix = playerColor === 'white' ? 'w' : 'b';
      const puzzleFile = `/visualize-chessboard-territory/lichess_db_puzzle-${colorPrefix}-one-move-${playerLevel}.json`;

      console.log(`Loading ${playerColor} puzzles for level ${playerLevel} (rating: ${rating}) from ${puzzleFile}...`);
      const response = await fetch(puzzleFile);

      if (!response.ok) {
        throw new Error(`Failed to load puzzle file: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const shuffled = data.puzzles.sort(() => Math.random() - 0.5).slice(0, 200);
      const puzzles = convertToLichessPuzzleFormat(shuffled);

      setDrillState(prev => ({
        ...prev,
        loading: false,
        puzzleQueue: puzzles,
      }));

      loadNextDrillPuzzle();
    } catch (error) {
      console.error('Error loading puzzles:', error);
      setDrillState(prev => ({
        ...prev,
        loading: false,
        active: false,
      }));
    }
  };

  const handleDrillTimeUp = useCallback(() => {
    setDrillState({
      active: false,
      loading: false,
      puzzleQueue: [],
      playerColor: 'white',
      currentPuzzle: null,
    });
    setPuzzleState({
      active: false,
      solution: [],
      completed: false,
      failed: false,
    });
  }, []);

  const markPuzzleAsFailed = useCallback(() => {
    chessGame.undoLastMove();
    setPuzzleState(prev => ({
      ...prev,
      failed: true,
    }));
  }, [chessGame]);

  const markPuzzleAsCompleted = useCallback(() => {
    setPuzzleState(prev => ({
      ...prev,
      completed: true,
    }));
  }, []);

  const isMoveCorrect = (move: any, expectedMove: string): boolean => {
    return move.lan === expectedMove;
  };

  const handlePuzzleMove = useCallback((sourceSquare: string, targetSquare: string, promotion?: string) => {
    if (!puzzleState.active) {
      return chessGame.makeMove(sourceSquare, targetSquare, promotion);
    }

    const move = chessGame.makeMove(sourceSquare, targetSquare, promotion);

    if (!move) {
      return move;
    }

    const expectedMove = puzzleState.solution[0];

    if (!isMoveCorrect(move, expectedMove)) {
      markPuzzleAsFailed();
      return null;
    }

    markPuzzleAsCompleted();
    return move;
  }, [puzzleState.active, puzzleState.solution, chessGame, markPuzzleAsFailed, markPuzzleAsCompleted]);

  // Watch for puzzle completion or failure
  const hasRecordedRef = useRef(false);

  useEffect(() => {
    if (!drillState.active || hasRecordedRef.current || !drillState.currentPuzzle) {
      return;
    }

    const puzzleRating = drillState.currentPuzzle.puzzle.rating;
    const puzzleId = drillState.currentPuzzle.puzzle.id;

    if (puzzleState.completed) {
      hasRecordedRef.current = true;
      recordPuzzleResult(true, puzzleRating, puzzleId);
      hasRecordedRef.current = false;
    } else if (puzzleState.failed) {
      hasRecordedRef.current = true;
      recordPuzzleResult(false, puzzleRating, puzzleId);
      hasRecordedRef.current = false;
    }
  }, [puzzleState.completed, puzzleState.failed, drillState.active, drillState.currentPuzzle, recordPuzzleResult]);

  return {
    drillState,
    puzzleState,
    puzzleAttempts,
    lastPuzzleResult,
    handleDrillStart,
    handleDrillTimeUp,
    handlePuzzleMove,
  };
};
