import { Arrow } from '../types/arrows';
import { Square, Color } from 'chess.js';

/**
 * Creates a single arrow from one square to another
 */
const createArrow = (
  fromSquare: string,
  toSquare: string,
  color: string
): Arrow => ({
  startSquare: fromSquare,
  endSquare: toSquare,
  color,
});

/**
 * Creates arrows from multiple attacker squares to a target square
 */
export const createArrowsFromAttackers = (
  attackerSquares: Square[],
  targetSquare: string,
  arrowColor: string
): Arrow[] =>
  attackerSquares.map(attackerSquare =>
    createArrow(attackerSquare as string, targetSquare, arrowColor)
  );

/**
 * Creates arrows showing attackers of squares around a center square
 * Useful for checkmate visualization
 *
 * Shows arrows to:
 * - Empty squares (king can move there)
 * - Squares with enemy pieces (king can capture if not defended)
 *
 * Does NOT show arrows to squares with the king's own pieces
 */
export const createArrowsForSquaresAroundTarget = (
  targetSquares: string[],
  getAttackers: (square: Square, color: Color) => Square[],
  attackingColor: Color,
  getPieceAt: (square: string) => any,
  arrowColor: string
): Arrow[] => {
  const arrows: Arrow[] = [];

  for (const square of targetSquares) {
    const piece = getPieceAt(square);
    if (!piece || piece.color === attackingColor) {
      const attackers = getAttackers(square as Square, attackingColor);
      arrows.push(...createArrowsFromAttackers(attackers, square, arrowColor));
    }
  }

  return arrows;
};
