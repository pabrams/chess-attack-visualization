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
  const [marks, setMarks] = useState<Mark[]>([]);

  const clearArrows = useCallback(() => {
    setArrows([]);
    setMarks([]);
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
    newMarks.push(...escapeMarks.map(mark => ({ ...mark, color: defendingArrowColor })));

    const arrowEndSquares = new Set<Square>();

    // From king attacker arrows
    newArrows.slice(0, kingAttackers.length).forEach(arrow => {
      arrowEndSquares.add(arrow.endSquare);
    });

    escapeArrows.forEach(arrow => {
      arrowEndSquares.add(arrow.endSquare);
    });

    arrowEndSquares.forEach(square => {
      const markExists = newMarks.some(mark => mark.square === square);
      if (!markExists) {
        newMarks.push({ square, color: arrowColor });
      }
    });

    // Sort by arrow length so longer arrows are drawn last (on top)
    newArrows.sort((a, b) => {
      const aLen = Math.pow(a.endSquare.charCodeAt(0) - a.startSquare.charCodeAt(0), 2) +
                   Math.pow(parseInt(a.endSquare[1]) - parseInt(a.startSquare[1]), 2);
      const bLen = Math.pow(b.endSquare.charCodeAt(0) - b.startSquare.charCodeAt(0), 2) +
                   Math.pow(parseInt(b.endSquare[1]) - parseInt(b.startSquare[1]), 2);
      return aLen - bLen;
    });

    setArrows(newArrows);
    setMarks(newMarks);
  }, [chessGame, whiteArrowColor, blackArrowColor, clearArrows]);

  // When board position changes, clear and re-evaluate for checkmate
  useEffect(() => {
    clearArrows();
    showCheckmaters();
  }, [chessGame.fen, clearArrows, showCheckmaters]);

  return {
    arrows,
    marks,
    clearArrows,
    showCheckmaters,
    handleSquareRightClick,
  };
};
