import { useState, useCallback, useEffect, useRef } from 'react';
import { Square, Move } from 'chess.js';
import { LichessPuzzle } from '../types/lichess';
import { UserColor } from '../types/drill';
import type { ChessGame } from './useChessGame';
import { getLevelFromRating } from '../utils/ratingCalculation';
import { sampleArray } from '../utils/arrayUtils';
import { convertToLichessPuzzleFormat, type RawPuzzle } from '../utils/puzzleUtils';

export const SOLVE_COMPLETION_DELAY_MS = 1500;

interface UseDrillProps {
  chessGame: ChessGame;
  rating: number;
  onResultRecorded: (success: boolean, puzzleRating: number, puzzleId: string) => void;
}

const selectRandomUserColor = (): UserColor => {
  return Math.random() < 0.5 ? 'white' : 'black';
};

interface PuzzleState {
  active: boolean;
  solution: string[];
  completed: boolean;
  failed: boolean;
  startTime: number | undefined;
}

const initialPuzzleState: PuzzleState = {
  active: false,
  solution: [],
  completed: false,
  failed: false,
  startTime: undefined,
};

export const useDrill = ({ chessGame, rating, onResultRecorded }: UseDrillProps) => {
  const [userColor, setUserColor] = useState<UserColor>('white');
  const [puzzleQueue, setPuzzleQueue] = useState<LichessPuzzle[]>([]);
  const [currentPuzzle, setCurrentPuzzle] = useState<LichessPuzzle | null>(null);
  const [puzzleState, setPuzzleState] = useState<PuzzleState>(initialPuzzleState);

  const initialRatingRef = useRef(rating);
  const prevPuzzleRef = useRef<LichessPuzzle | null>(null);

  const resetPuzzleState = useCallback(() => {
    setPuzzleState(initialPuzzleState);
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
            setPuzzleState({
              active: true,
              solution: puzzle.puzzle.solution,
              completed: false,
              failed: false,
              startTime: Date.now(),
            });
          }
        }
      }, 600);
    });
  }, [chessGame]);

  useEffect(() => {
    if (currentPuzzle && currentPuzzle !== prevPuzzleRef.current) {
      prevPuzzleRef.current = currentPuzzle;
      initializePuzzleFromFen(currentPuzzle as LichessPuzzle & { _setupMove?: string; _fen?: string });
    }
  }, [currentPuzzle, initializePuzzleFromFen]);

  // Handle puzzle completion/failure: record result and load next puzzle
  useEffect(() => {
    if (!currentPuzzle || (!puzzleState.completed && !puzzleState.failed)) {
      return;
    }

    const handlePuzzleEnd = () => {
      const puzzleRating = currentPuzzle.puzzle.rating;
      const puzzleId = currentPuzzle.puzzle.id;
      const success = puzzleState.completed;

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

    const delayMs = puzzleState.completed ? SOLVE_COMPLETION_DELAY_MS : 0;
    const timer = setTimeout(handlePuzzleEnd, delayMs);

    return () => clearTimeout(timer);
  }, [puzzleState.completed, puzzleState.failed, currentPuzzle, onResultRecorded, resetPuzzleState, puzzleQueue]);

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

    const expectedMove = puzzleState.solution[0];

    if (!isMoveCorrect(move, expectedMove)) {
      chessGame.undoLastMove();
      setPuzzleState(prev => ({ ...prev, failed: true }));
      return null;
    }

    setPuzzleState(prev => ({ ...prev, completed: true }));
    return move;
  }, [puzzleState.solution, chessGame]);

  return {
    drillState: {
      puzzleQueue,
      userColor,
      currentPuzzle,
    },
    puzzleState,
    handlePuzzleMove,
  };
};
