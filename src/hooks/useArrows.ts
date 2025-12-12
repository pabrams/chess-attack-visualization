import { useState, useCallback, useEffect } from 'react';
import { Square, Color as PieceColor } from 'chess.js';
import { SquareHandlerArgs } from 'react-chessboard';
import { Arrow, Mark } from '../types/arrows';
import { createArrowsFromAttackers, createArrowsForSquaresAroundKing } from '../utils/arrowUtils';
import { getAdjacentSquares } from '../utils/squareUtils';
import { invertColor } from '../utils/chessPieceUtils';
import type { ChessGame } from './useChessGame';

interface UseArrowsProps {
  chessGame: ChessGame;
}

export const useArrows = ({ chessGame }: UseArrowsProps) => {
  const getCSSVar = (name: string) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  const whiteArrowColor = getCSSVar('--chess-white-arrow');
  const blackArrowColor = getCSSVar('--chess-black-arrow');
  const [arrows, setArrows] = useState<Arrow[]>([]);

  const clearArrows = useCallback(() => {
    setArrows([]);
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

    newArrows.sort((a, b) => {
      const aLen = Math.pow(a.endSquare.charCodeAt(0) - a.startSquare.charCodeAt(0), 2) +
                   Math.pow(parseInt(a.endSquare[1]) - parseInt(a.startSquare[1]), 2);
      const bLen = Math.pow(b.endSquare.charCodeAt(0) - b.startSquare.charCodeAt(0), 2) +
                   Math.pow(parseInt(b.endSquare[1]) - parseInt(b.startSquare[1]), 2);
      return aLen - bLen;
    });

    setArrows(newArrows);
  }, [chessGame, whiteArrowColor, blackArrowColor]);

  const handleSquareRightClick = useCallback(({ square }: SquareHandlerArgs) => {
    const clickedSquare = square as Square;
    showAttackersForSquare(clickedSquare);
  }, [showAttackersForSquare]);

  const showCheckmaters = useCallback(() => {
    if (!chessGame.isCheckmate()) {
      clearArrows();
      return;
    }

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
    const { arrows: escapeArrows } = createArrowsForSquaresAroundKing(
      aroundSquares,
      chessGame.getAttackers,
      checkmatingColor,
      chessGame.getPieceAt,
      arrowColor,
    );

    newArrows.push(...escapeArrows);

    const arrowEndSquares = new Set<Square>();

    newArrows.slice(0, kingAttackers.length).forEach(arrow => {
      arrowEndSquares.add(arrow.endSquare);
    });

    escapeArrows.forEach(arrow => {
      arrowEndSquares.add(arrow.endSquare);
    });

    setArrows(newArrows);
  }, [chessGame, whiteArrowColor, blackArrowColor, clearArrows]);

  // When board position changes, clear and re-evaluate for checkmate
  useEffect(() => {
    clearArrows();
    showCheckmaters();
  }, [chessGame.fen, clearArrows, showCheckmaters]);

  return {
    arrows,
    clearArrows,
    showCheckmaters,
    handleSquareRightClick,
  };
};
