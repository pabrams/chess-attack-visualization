import { Arrow } from '../types/arrows';
import { Square } from 'chess.js';

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
