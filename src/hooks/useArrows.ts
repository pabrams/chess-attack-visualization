import { useState, useCallback } from 'react';
import { Square, Color as PieceColor } from 'chess.js';
import { SquareHandlerArgs } from 'react-chessboard';
import { Arrow } from '../types/arrows';
import { createArrowsFromAttackers, createArrowsForSquaresAroundTarget } from '../utils/arrowUtils';
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
  const [lastClickedSquare, setLastClickedSquare] = useState<Square | null>(null);

  const clearArrows = useCallback(() => {
    setArrows([]);
    setLastClickedSquare(null);
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
    if (clickedSquare === lastClickedSquare && arrows.length > 0) {
      clearArrows();
    } else {
      showAttackersForSquare(clickedSquare);
      setLastClickedSquare(clickedSquare);
    }
  }, [lastClickedSquare, arrows.length, showAttackersForSquare, clearArrows]);

  const showCheckmaters = useCallback(() => {
    const checksColor = chessGame.getTurn();
    const checkmatingColor = invertColor(checksColor);

    const kingSquares = chessGame.findPiece({ type: 'k', color: checksColor });
    const kingSquare = kingSquares[0];

    if (!kingSquare) {
      return;
    }

    const arrowColor = checkmatingColor === 'w' ? whiteArrowColor : blackArrowColor;
    const newArrows: Arrow[] = [];

    const kingAttackers = chessGame.getAttackers(kingSquare, checkmatingColor);
    newArrows.push(...createArrowsFromAttackers(kingAttackers, kingSquare, arrowColor));

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
  }, [chessGame, whiteArrowColor, blackArrowColor, addArrows]);

  return {
    arrows,
    clearArrows,
    showAttackersForSquare,
    addArrows,
    showCheckmaters,
    handleSquareRightClick,
  };
};
