import { useCallback, useEffect } from 'react';
import { Chess, Square } from 'chess.js';
import { LichessPuzzle } from '../types/lichess';
import type { ChessGame } from './useChessGame';
import { usePuzzleLoader } from './usePuzzleLoader';
import { usePuzzleQueue, SOLVE_COMPLETION_DELAY_MS } from './usePuzzleQueue';

interface UseDrillProps {
  chessGame: ChessGame;
  rating: number;
  onResultRecorded: (success: boolean, puzzleRating: number, puzzleId: string) => void;
  onPuzzleResult: () => void;
}

export const useDrill = ({ chessGame, rating, onResultRecorded, onPuzzleResult }: UseDrillProps) => {
  // Load puzzles from JSON files
  const { puzzles, userColor, loadPuzzles } = usePuzzleLoader({ rating });

  // Manage which puzzle is current and advance through the queue
  const { currentPuzzle, advanceToNextPuzzle } = usePuzzleQueue({ puzzles });

  // Load initial puzzles on mount
  useEffect(() => {
    loadPuzzles();
  }, [loadPuzzles]);

  // Set up puzzle on board when current puzzle changes
  const loadPuzzleOnBoard = useCallback((puzzle: LichessPuzzle) => {
    const setupMove = (puzzle as any)._setupMove;
    const fen = (puzzle as any)._fen;

    console.log('[useDrill] loadPuzzleOnBoard', puzzle.puzzle.id, 'setupMove:', setupMove, 'fen:', fen);

    if (!setupMove || !fen) return;

    const initialChess = new Chess(fen);
    const success = chessGame.loadPgn(initialChess.pgn());
    console.log('[useDrill] loadPgn result:', success);
    if (!success) return;

    // Apply the setup move after a brief delay
    setTimeout(() => {
      console.log('[useDrill] applying setup move after 600ms');
      const tempChess = new Chess(fen);
      const from = setupMove.substring(0, 2);
      const to = setupMove.substring(2, 4);
      const promotion = setupMove.length > 4 ? setupMove.substring(4) : undefined;

      const move = tempChess.move({ from, to, promotion: promotion as any });
      if (move) {
        chessGame.loadPgn(tempChess.pgn());
        console.log('[useDrill] setup move applied');
      }
    }, 600);
  }, [chessGame]);

  // Set up board when puzzle loads
  useEffect(() => {
    if (currentPuzzle) {
      console.log('[useDrill] currentPuzzle changed to', currentPuzzle.puzzle.id);
      loadPuzzleOnBoard(currentPuzzle);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPuzzle]);

  const handlePuzzleMove = useCallback((sourceSquare: Square, targetSquare: Square, promotion?: string) => {
    if (!currentPuzzle) return null;

    console.log('[useDrill] makeMove', sourceSquare, 'to', targetSquare);
    const move = chessGame.makeMove(sourceSquare, targetSquare, promotion);
    if (!move) return move;

    const expectedMove = currentPuzzle.puzzle.solution[0];
    const isCorrect = move.lan === expectedMove;
    console.log('[useDrill] move lan:', move.lan, 'expected:', expectedMove, 'isCorrect:', isCorrect);

    if (!isCorrect) {
      console.log('[useDrill] Move incorrect, undoing');
      chessGame.undoLastMove();
      // Record failure and advance after delay
      setTimeout(() => {
        console.log('[useDrill] Recording failure and advancing');
        onResultRecorded(false, currentPuzzle.puzzle.rating, currentPuzzle.puzzle.id);
        advanceToNextPuzzle();
      }, SOLVE_COMPLETION_DELAY_MS);
      onPuzzleResult();
      return null;
    }

    console.log('[useDrill] Move correct, will advance after', SOLVE_COMPLETION_DELAY_MS, 'ms');
    // Record success and advance after delay
    setTimeout(() => {
      console.log('[useDrill] Recording success and advancing');
      onResultRecorded(true, currentPuzzle.puzzle.rating, currentPuzzle.puzzle.id);
      advanceToNextPuzzle();
    }, SOLVE_COMPLETION_DELAY_MS);
    onPuzzleResult();
    return move;
  }, [currentPuzzle, chessGame, onResultRecorded, onPuzzleResult, advanceToNextPuzzle]);

  return {
    drillState: {
      userColor,
      currentPuzzle,
    },
    handlePuzzleMove,
  };
};
