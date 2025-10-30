import { useState, useCallback, useEffect, useRef } from 'react';
import { Square, Move } from 'chess.js';
import { LichessPuzzle } from '../types/lichess';
import { UserColor } from '../types/drill';
import type { ChessGame } from './useChessGame';
import { getLevelFromRating } from '../utils/ratingCalculation';
import { sampleArray } from '../utils/arrayUtils';

export const SOLVE_COMPLETION_DELAY_MS = 1500;

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
  onResultRecorded: (success: boolean, puzzleRating: number, puzzleId: string) => void;
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

export const useDrill = ({ chessGame, rating, onResultRecorded }: UseDrillProps) => {
  const [userColor, setUserColor] = useState<UserColor>('white');
  const [puzzleQueue, setPuzzleQueue] = useState<LichessPuzzle[]>([]);
  const [currentPuzzle, setCurrentPuzzle] = useState<LichessPuzzle | null>(null);
  const [puzzleActive, setPuzzleActive] = useState(false);
  const [puzzleSolution, setPuzzleSolution] = useState<string[]>([]);
  const [puzzleCompleted, setPuzzleCompleted] = useState(false);
  const [puzzleFailed, setPuzzleFailed] = useState(false);
  const [puzzleStartTime, setPuzzleStartTime] = useState<number | undefined>();

  const initialRatingRef = useRef(rating);
  const prevPuzzleRef = useRef<LichessPuzzle | null>(null);

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

      const success = chessGame.loadPgn(new Chess(fen).pgn());

      if (!success) {
        return;
      }

      setTimeout(() => {
        const tempChess = new Chess(fen);
        const from = setupMove.substring(0, 2);
        const to = setupMove.substring(2, 4);
        const promotion = setupMove.length > 4 ? setupMove.substring(4) : undefined;

        const move = tempChess.move({ from, to, promotion: promotion as 'q' | 'r' | 'b' | 'n' | undefined });

        if (move) {
          const pgn = tempChess.pgn();
          const setupSuccess = chessGame.loadPgn(pgn);

          if (setupSuccess) {
            setPuzzleActive(true);
            setPuzzleSolution(puzzle.puzzle.solution);
            setPuzzleCompleted(false);
            setPuzzleFailed(false);
            setPuzzleStartTime(Date.now());
          }
        }
      }, 600);
    });
  }, [chessGame]);

  // Initialize new puzzle when currentPuzzle changes
  // prevPuzzleRef prevents re-initialization when effect re-runs due to initializePuzzleFromFen changing
  useEffect(() => {
    if (currentPuzzle && currentPuzzle !== prevPuzzleRef.current) {
      prevPuzzleRef.current = currentPuzzle;
      initializePuzzleFromFen(currentPuzzle as LichessPuzzle & { _setupMove?: string; _fen?: string });
    }
  }, [currentPuzzle, initializePuzzleFromFen]);

  // Handle puzzle completion/failure: record result and load next puzzle
  useEffect(() => {
    if (!currentPuzzle || (!puzzleCompleted && !puzzleFailed)) {
      return;
    }

    const handlePuzzleEnd = () => {
      const puzzleRating = currentPuzzle.puzzle.rating;
      const puzzleId = currentPuzzle.puzzle.id;
      const success = puzzleCompleted;

      onResultRecorded(success, puzzleRating, puzzleId);
      resetPuzzleState();

      setPuzzleQueue(queue => {
        if (queue.length === 0) {
          console.error('Puzzle queue is empty!');
          return queue;
        }

        const [nextPuzzle, ...remainingQueue] = queue;
        setCurrentPuzzle(nextPuzzle);
        return remainingQueue;
      });
    };

    const delayMs = puzzleCompleted ? SOLVE_COMPLETION_DELAY_MS : 0;
    const timer = setTimeout(handlePuzzleEnd, delayMs);

    return () => clearTimeout(timer);
  }, [puzzleCompleted, puzzleFailed, currentPuzzle, onResultRecorded, resetPuzzleState, puzzleQueue]);

  // Initialize drill on mount
  useEffect(() => {
    const startDrill = async () => {
      const newUserColor = selectRandomUserColor();
      setUserColor(newUserColor);

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
        if (puzzles.length > 0) {
          setCurrentPuzzle(puzzles[0]);
          setPuzzleQueue(puzzles.slice(1));
        }
      } catch (error) {
        console.error('Error loading puzzles:', error);
      }
    };

    startDrill();
  }, []);

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
    handlePuzzleMove,
  };
};
