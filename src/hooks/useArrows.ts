import { useState, useCallback } from 'react';
import { Square, Color as PieceColor } from 'chess.js';
import { SquareHandlerArgs } from 'react-chessboard';
import { Arrow, Mark } from '../types/arrows';
import { createArrowsFromAttackers, createArrowsForSquaresAroundKing } from '../utils/arrowUtils';
import { getAdjacentSquares } from '../utils/squareUtils';
import { invertColor } from '../utils/chessPieceUtils';
import type { ChessGame } from './useChessGame';

interface UseArrowsProps {
  chessGame: ChessGame;
  whiteArrowColor: string;
  blackArrowColor: string;
}

export const useArrows = ({ chessGame, whiteArrowColor, blackArrowColor }: UseArrowsProps) => {
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);

  const clearArrows = useCallback(() => {
    setArrows([]);
    setMarks([]);
  }, []);

  const addArrows = useCallback((newArrows: Arrow[]) => {
    setArrows(prev => [...prev, ...newArrows]);
  }, []);

  const showAttackersForSquare = useCallback((square: Square) => {
    const newArrows: Arrow[] = [];

    const whiteAttackers = chessGame.getAttackers(square, 'w');
    newArrows.push(
      ...createArrowsFromAttackers(whiteAttackers, square, whiteArrowColor)
    );

    const blackAttackers = chessGame.getAttackers(square, 'b');
    newArrows.push(
      ...createArrowsFromAttackers(blackAttackers, square, blackArrowColor)
    );

    setArrows(newArrows);
  }, [chessGame, whiteArrowColor, blackArrowColor]);

  const handleSquareRightClick = useCallback(({ square }: SquareHandlerArgs) => {
    const clickedSquare = square as Square;
    showAttackersForSquare(clickedSquare);
  }, [showAttackersForSquare]);

  const showCheckmaters = useCallback(() => {
    const checksColor = chessGame.getTurn();
    const checkmatingColor = invertColor(checksColor);

    const kingSquares = chessGame.findPiece({ type: 'k', color: checksColor });
    const kingSquare = kingSquares[0];

    if (!kingSquare) {
      return;
    }

    const arrowColor = checkmatingColor === 'w' ? whiteArrowColor : blackArrowColor;
    const defendingColor = checksColor;
    const defendingArrowColor = defendingColor === 'w' ? whiteArrowColor : blackArrowColor;

    const newArrows: Arrow[] = [];
    const newMarks: Mark[] = [];

    const kingAttackers = chessGame.getAttackers(kingSquare, checkmatingColor);
    newArrows.push(...createArrowsFromAttackers(kingAttackers, kingSquare, arrowColor));

    const aroundSquares = getAdjacentSquares(kingSquare);
    const { arrows: escapeArrows, marks: escapeMarks } = createArrowsForSquaresAroundKing(
      aroundSquares,
      chessGame.getAttackers,
      checkmatingColor,
      chessGame.getPieceAt,
      arrowColor,
      defendingColor
    );

    newArrows.push(...escapeArrows);
    // Add marks with defending color instead of attacking color
    newMarks.push(...escapeMarks.map(mark => ({ ...mark, color: defendingArrowColor })));

    setArrows(newArrows);
    setMarks(newMarks);
  }, [chessGame, whiteArrowColor, blackArrowColor]);

  const showCheckmatersWithDelay = useCallback((delayMs: number) => {
    showCheckmaters();
    setTimeout(() => {
      clearArrows();
    }, delayMs);
  }, [showCheckmaters, clearArrows]);

  return {
    arrows,
    marks,
    clearArrows,
    showCheckmaters,
    showCheckmatersWithDelay,
    handleSquareRightClick,
  };
};
