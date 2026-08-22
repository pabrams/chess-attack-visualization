import { useState, useCallback, useEffect } from 'react';
import { Square, Color as PieceColor, Piece } from 'chess.js';
import { SquareHandlerArgs } from 'react-chessboard';
import { Arrow, Mark } from '../types/arrows';
import type { ChessGame } from './useChessGame';

interface UseArrowsProps {
  chessGame: ChessGame;
}

export const useArrows = ({ chessGame }: UseArrowsProps) => {
  const whiteArrowColor = '#bb0000';
  const blackArrowColor = '#0066cc';
  const [attackerArrows, setAttackerArrows] = useState<Arrow[]>([]);
  const [checkmateArrows, setCheckmateArrows] = useState<Arrow[]>([]);
  const [checkmateMarks, setCheckmateMarks] = useState<Mark[]>([]);

  const clearArrows = useCallback(() => {
    setAttackerArrows([]);
    setCheckmateArrows([]);
    setCheckmateMarks([]);
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

    setAttackerArrows(newArrows);
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

    const newMarks: Mark[] = aroundSquares
      .filter(square => {
        const piece = chessGame.getPieceAt(square);
        return piece && piece.color === checksColor;
      })
      .map(square => ({
        square,
        color: arrowColor,
      }));

    setCheckmateArrows(newArrows);
    setCheckmateMarks(newMarks);
  }, [chessGame, whiteArrowColor, blackArrowColor, clearArrows]);

  useEffect(() => {
    clearArrows();
    showCheckmaters();
  }, [chessGame.fen, clearArrows, showCheckmaters]);

  return {
    attackerArrows,
    checkmateArrows,
    checkmateMarks,
    clearArrows,
    showCheckmaters,
    handleSquareRightClick,
  };
};


const createArrow = (
  fromSquare: Square,
  toSquare: Square,
  color: string
): Arrow => ({
  startSquare: fromSquare,
  endSquare: toSquare,
  color,
});

const createArrowsFromAttackers = (
  attackerSquares: Square[],
  targetSquare: Square,
  arrowColor: string
): Arrow[] =>
  attackerSquares.map(attackerSquare =>
    createArrow(attackerSquare, targetSquare, arrowColor)
  );

const createArrowsForSquaresAroundKing = (
  targetSquares: Square[],
  getAttackers: (square: Square, color: PieceColor) => Square[],
  attackingColor: PieceColor,
  getPieceAt: (square: Square) => Piece | undefined,
  arrowColor: string
): { arrows: Arrow[] } => {
  const arrows: Arrow[] = [];
  for (const square of targetSquares) {
    const piece = getPieceAt(square);
    if (!piece || piece.color === attackingColor) {
      const attackers = getAttackers(square, attackingColor);
      arrows.push(...createArrowsFromAttackers(attackers, square, arrowColor));
    }
  }

  return { arrows };
};

const invertColor = (color: PieceColor): PieceColor =>
  color === 'w' ? 'b' : 'w';

const getAdjacentSquares = (square: Square): Square[] => {
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0); // 0-7
  const rank = parseInt(square[1]) - 1; // 0-7

  const adjacentSquares: Square[] = [];

  for (let f = file - 1; f <= file + 1; f++) {
    for (let r = rank - 1; r <= rank + 1; r++) {
      if (f >= 0 && f <= 7 && r >= 0 && r <= 7 && !(f === file && r === rank)) {
        const adjacentSquare = String.fromCharCode('a'.charCodeAt(0) + f) + (r + 1);
        adjacentSquares.push(adjacentSquare as Square);
      }
    }
  }

  return adjacentSquares;
};