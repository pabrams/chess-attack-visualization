import { useState } from 'react';
import { Square, Color as PieceColor } from 'chess.js';
import { Arrow } from '../types/arrows';
import { createArrowsFromAttackers, createArrowsForSquaresAroundTarget } from '../utils/arrowUtils';
import { getAdjacentSquares } from '../utils/squareUtils';
import { invertColor } from '../utils/chessPieceUtils';
import type { ChessGame } from './useChessGame';

export const useArrows = () => {
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [lastClickedSquare, setLastClickedSquare] = useState<Square | null>(null);

  const clearArrows = () => {
    setArrows([]);
    setLastClickedSquare(null);
  };

  const addArrows = (newArrows: Arrow[]) => {
    setArrows(prev => [...prev, ...newArrows]);
  };

  const showAttackersForSquare = (
    square: Square,
    getAttackers: (square: Square, color: PieceColor) => Square[],
    whiteArrowColor: string,
    blackArrowColor: string
  ) => {
    if (square === lastClickedSquare && arrows.length > 0) {
      clearArrows();
    } else {
      const newArrows: Arrow[] = [];

      const whiteAttackers = getAttackers(square, 'w');
      newArrows.push(
        ...createArrowsFromAttackers(whiteAttackers, square, whiteArrowColor)
      );

      const blackAttackers = getAttackers(square, 'b');
      newArrows.push(
        ...createArrowsFromAttackers(blackAttackers, square, blackArrowColor)
      );

      setArrows(newArrows);
      setLastClickedSquare(square);
    }
  };

  const showCheckmaters = (
    chessGame: ChessGame,
    currentThemeColors: { whiteArrowColor: string; blackArrowColor: string }
  ) => {
    const checksColor = chessGame.getTurn();
    const checkmatingColor = invertColor(checksColor);

    const kingSquares = chessGame.findPiece({ type: 'k', color: checksColor });
    const kingSquare = kingSquares[0];

    if (!kingSquare) {
      return;
    }

    const arrowColor = checkmatingColor === 'w' ? currentThemeColors.whiteArrowColor : currentThemeColors.blackArrowColor;
    const newArrows: Arrow[] = [];

    // Show who's attacking the king
    const kingAttackers = chessGame.getAttackers(kingSquare, checkmatingColor);
    newArrows.push(...createArrowsFromAttackers(kingAttackers, kingSquare, arrowColor));

    // Show who's attacking the squares around the king
    const aroundSquares = getAdjacentSquares(kingSquare);
    newArrows.push(
      ...createArrowsForSquaresAroundTarget(
        aroundSquares,
        chessGame.getAttackers,
        checkmatingColor,
        chessGame.getPieceAt,
        arrowColor
      )
    );

    addArrows(newArrows);
  };

  return {
    arrows,
    clearArrows,
    showAttackersForSquare,
    addArrows,
    showCheckmaters,
  };
};
