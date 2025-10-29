import { Color as PieceColor, Square } from 'chess.js';

/**
 * Inverts a chess notation color (w -> b, b -> w)
 */
export const invertColor = (color: PieceColor): PieceColor =>
  color === 'w' ? 'b' : 'w';

export const isBackRank = (square: Square): boolean =>
  square[1] === '8' || square[1] === '1';
