import { useState, useCallback, useEffect, useRef } from 'react';
import { Square, Move } from 'chess.js';
import { LichessPuzzle } from '../types/lichess';
import { UserColor } from '../types/drill';
import type { ChessGame } from './useChessGame';
import { getLevelFromRating } from '../utils/ratingCalculation';
import { sampleArray } from '../utils/arrayUtils';
import { convertToLichessPuzzleFormat, type RawPuzzle } from '../utils/puzzleUtils';

export const SOLVE_COMPLETION_DELAY_MS = 1000;

interface UseDrillProps {
  chessGame: ChessGame;
  rating: number;
  onResultRecorded: (success: boolean, puzzleRating: number, puzzleId: string) => void;
  onPuzzleResult: () => void;
}

const selectRandomUserColor = (): UserColor => {
  return Math.random() < 0.5 ? 'white' : 'black';
};

export const useDrill = ({ chessGame, rating, onResultRecorded, onPuzzleResult }: UseDrillProps) => {
  const [userColor, setUserColor] = useState<UserColor>('white');
  const [puzzles, setPuzzles] = useState<LichessPuzzle[]>([]);
  const [currentPuzzle, setCurrentPuzzle] = useState<LichessPuzzle | null>(null);

  const initialRatingRef = useRef(rating);

  // Load puzzles on mount
  useEffect(() => {
    const loadPuzzles = async () => {
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
        const converted = convertToLichessPuzzleFormat(sampled);

        setPuzzles(converted);
        if (converted.length > 0) {
          setCurrentPuzzle(converted[0]);
          loadPuzzleOnBoard(converted[0]);
        }
      } catch (error) {
        console.error('Error loading puzzles:', error);
      }
    };

    loadPuzzles();
  }, []);

  const loadPuzzleOnBoard = useCallback((puzzle: LichessPuzzle) => {
    import('chess.js').then(({ Chess }) => {
      const setupMove = (puzzle as any)._setupMove;
      const fen = (puzzle as any)._fen;

      if (!setupMove || !fen) return;

      const success = chessGame.loadPgn(new Chess(fen).pgn());
      if (!success) return;

      setTimeout(() => {
        const tempChess = new Chess(fen);
        const from = setupMove.substring(0, 2);
        const to = setupMove.substring(2, 4);
        const promotion = setupMove.length > 4 ? setupMove.substring(4) : undefined;

        const move = tempChess.move({ from, to, promotion: promotion as any });
        if (move) {
          chessGame.loadPgn(tempChess.pgn());
        }
      }, 600);
    });
  }, [chessGame]);

  const recordResultAndLoadNext = useCallback((success: boolean) => {
    if (!currentPuzzle) return;

    onResultRecorded(success, currentPuzzle.puzzle.rating, currentPuzzle.puzzle.id);

    setTimeout(() => {
      setPuzzles(prev => {
        const [, ...remaining] = prev;
        const next = remaining[0];
        if (next) {
          setCurrentPuzzle(next);
          loadPuzzleOnBoard(next);
        }
        return remaining;
      });
    }, SOLVE_COMPLETION_DELAY_MS);
  }, [currentPuzzle, onResultRecorded, loadPuzzleOnBoard]);

  const handlePuzzleMove = useCallback((sourceSquare: Square, targetSquare: Square, promotion?: string) => {
    if (!currentPuzzle) return null;

    const move = chessGame.makeMove(sourceSquare, targetSquare, promotion);
    if (!move) return move;

    const expectedMove = currentPuzzle.puzzle.solution[0];
    const isCorrect = move.lan === expectedMove;

    if (!isCorrect) {
      chessGame.undoLastMove();
      recordResultAndLoadNext(false);
      onPuzzleResult();
      return null;
    }

    recordResultAndLoadNext(true);
    onPuzzleResult();
    return move;
  }, [currentPuzzle, chessGame, onPuzzleResult, recordResultAndLoadNext]);

  return {
    drillState: {
      userColor,
      currentPuzzle,
    },
    handlePuzzleMove,
  };
};
