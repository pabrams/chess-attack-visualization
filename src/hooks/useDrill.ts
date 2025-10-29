import { useState, useCallback, useEffect, useRef } from 'react';
import { Square, Move } from 'chess.js';
import { LichessPuzzle } from '../types/lichess';
import { PuzzleAttempt, UserColor } from '../types/drill';
import type { ChessGame } from './useChessGame';
import { getLevelFromRating, calculateRatingChange } from '../utils/ratingCalculation';
import { sampleArray } from '../utils/arrayUtils';

interface RawPuzzle {
  id: string;
  rating: number;
  themes: string[];
  fen: string;
  solution: string;
  setupMove: string;
  gameUrl: string;
}

interface UseDrillProps {
  chessGame: ChessGame;
  rating: number;
  addPoints: (puzzleRating: number, success: boolean) => void;
}

const selectRandomUserColor = (): UserColor => {
  return Math.random() < 0.5 ? 'white' : 'black';
};

const convertToLichessPuzzleFormat = (rawPuzzles: RawPuzzle[]): LichessPuzzle[] => {
  return rawPuzzles.map((p: RawPuzzle) => ({
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
  } as LichessPuzzle & { _fen?: string; _setupMove?: string }));
};

function loadInitialState(): PuzzleAttempt[] {
  const stored = localStorage.getItem('puzzleAttempts');

  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to parse puzzle attempts from localStorage:', error);
    }
  }
  return [];
}

export const useDrill = ({ chessGame, rating, addPoints }: UseDrillProps) => {
  // Drill state
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userColor, setUserColor] = useState<UserColor>('white');
  const [puzzleQueue, setPuzzleQueue] = useState<LichessPuzzle[]>([]);
  const [currentPuzzle, setCurrentPuzzle] = useState<LichessPuzzle | null>(null);

  // Puzzle state
  const [puzzleActive, setPuzzleActive] = useState(false);
  const [puzzleSolution, setPuzzleSolution] = useState<string[]>([]);
  const [puzzleCompleted, setPuzzleCompleted] = useState(false);
  const [puzzleFailed, setPuzzleFailed] = useState(false);
  const [puzzleStartTime, setPuzzleStartTime] = useState<number | undefined>();

  // Results
  const [puzzleAttempts, setPuzzleAttempts] = useState<PuzzleAttempt[]>(loadInitialState());
  const [lastPuzzleResult, setLastPuzzleResult] = useState<boolean | null>(null);

  const initialRatingRef = useRef(rating);
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    localStorage.setItem('puzzleAttempts', JSON.stringify(puzzleAttempts));
  }, [puzzleAttempts]);

  const resetPuzzleState = useCallback(() => {
    setPuzzleActive(false);
    setPuzzleSolution([]);
    setPuzzleCompleted(false);
    setPuzzleFailed(false);
    setPuzzleStartTime(undefined);
  }, []);

  const initializePuzzleFromFen = useCallback((puzzle: LichessPuzzle & { _setupMove?: string; _fen?: string }) => {
    import('chess.js').then(({ Chess }) => {
      const setupMove = puzzle._setupMove!;
      const fen = puzzle._fen!;

      const tempChess = new Chess(fen);
      const from = setupMove.substring(0, 2);
      const to = setupMove.substring(2, 4);
      const promotion = setupMove.length > 4 ? setupMove.substring(4) : undefined;

      const move = tempChess.move({ from, to, promotion: promotion as 'q' | 'r' | 'b' | 'n' | undefined });

      if (move) {
        const pgn = tempChess.pgn();
        const success = chessGame.loadPgn(pgn);

        if (success) {
          setPuzzleActive(true);
          setPuzzleSolution(puzzle.puzzle.solution);
          setPuzzleCompleted(false);
          setPuzzleFailed(false);
          setPuzzleStartTime(Date.now());
        }
      }
    });
  }, [chessGame]);

  const loadNextPuzzle = useCallback(() => {
    setPuzzleQueue(queue => {
      if (queue.length === 0) {
        console.error('Puzzle queue is empty!');
        return queue;
      }

      const [nextPuzzle, ...remainingQueue] = queue;
      setCurrentPuzzle(nextPuzzle);
      resetPuzzleState();
      return remainingQueue;
    });
  }, [resetPuzzleState]);

  // Track the previous puzzle to know when a new one is loaded
  const prevPuzzleRef = useRef<LichessPuzzle | null>(null);

  useEffect(() => {
    if (currentPuzzle && currentPuzzle !== prevPuzzleRef.current) {
      prevPuzzleRef.current = currentPuzzle;
      initializePuzzleFromFen(currentPuzzle as LichessPuzzle & { _setupMove?: string; _fen?: string });
    }
  }, [currentPuzzle, initializePuzzleFromFen]);

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

    setPuzzleAttempts(prev => [attempt, ...prev]);
    setLastPuzzleResult(success);
    resetPuzzleState();

    // Only delay on successful solve to show checkmate threats; fail immediately to next puzzle
    const delayMs = success ? 5000 : 0;
    setTimeout(() => {
      loadNextPuzzle();
    }, delayMs);
  }, [rating, addPoints, resetPuzzleState, loadNextPuzzle]);

  useEffect(() => {
    if (!active || !currentPuzzle) {
      return;
    }

    if (!puzzleCompleted && !puzzleFailed) {
      return;
    }

    const puzzleRating = currentPuzzle.puzzle.rating;
    const puzzleId = currentPuzzle.puzzle.id;
    recordPuzzleResult(puzzleCompleted, puzzleRating, puzzleId);
  }, [puzzleCompleted, puzzleFailed, active, currentPuzzle, recordPuzzleResult]);

  useEffect(() => {
    const startDrill = async () => {
      const newUserColor = selectRandomUserColor();
      setUserColor(newUserColor);
      setActive(true);
      setLoading(true);

      try {
        const playerLevel = getLevelFromRating(initialRatingRef.current);
        const colorPrefix = newUserColor === 'white' ? 'w' : 'b';
        const puzzleFile = `/lichess_db_puzzle-${colorPrefix}-one-move-${playerLevel}.json`;
        const response = await fetch(puzzleFile);

        if (!response.ok) {
          throw new Error(`Failed to load puzzle file: ${response.status} ${response.statusText}`);
        }

        const data = await response.json() as { puzzles: RawPuzzle[] };
        const sampled = sampleArray(data.puzzles, 200);
        const puzzles = convertToLichessPuzzleFormat(sampled);

        setPuzzleQueue(puzzles);
        setLoading(false);
        loadNextPuzzle();
      } catch (error) {
        console.error('Error loading puzzles:', error);
        setLoading(false);
        setActive(false);
      }
    };

    startDrill();
  }, [loadNextPuzzle]);

  const isMoveCorrect = (move: Move, expectedMove: string): boolean => {
    return move.lan === expectedMove;
  };

  const handlePuzzleMove = useCallback((sourceSquare: Square, targetSquare: Square, promotion?: string) => {
    const move = chessGame.makeMove(sourceSquare, targetSquare, promotion);

    if (!move) {
      return move;
    }

    const expectedMove = puzzleSolution[0];

    if (!isMoveCorrect(move, expectedMove)) {
      chessGame.undoLastMove();
      setPuzzleFailed(true);
      return null;
    }

    setPuzzleCompleted(true);
    return move;
  }, [puzzleSolution, chessGame]);

  return {
    drillState: {
      active,
      loading,
      puzzleQueue,
      userColor,
      currentPuzzle,
    },
    puzzleState: {
      active: puzzleActive,
      solution: puzzleSolution,
      completed: puzzleCompleted,
      failed: puzzleFailed,
      puzzleStartTime,
    },
    puzzleAttempts,
    lastPuzzleResult,
    handlePuzzleMove,
  };
};
