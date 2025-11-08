import { Arrow, Mark } from '../types/arrows';
import { Square, Color } from 'chess.js';


const createArrow = (
  fromSquare: Square,
  toSquare: Square,
  color: string
): Arrow => ({
  startSquare: fromSquare,
  endSquare: toSquare,
  color,
});


export const createArrowsFromAttackers = (
  attackerSquares: Square[],
  targetSquare: Square,
  arrowColor: string
): Arrow[] =>
  attackerSquares.map(attackerSquare =>
    createArrow(attackerSquare, targetSquare, arrowColor)
  );


export const createArrowsForSquaresAroundKing = (
  targetSquares: Square[],
  getAttackers: (square: Square, color: Color) => Square[],
  attackingColor: Color,
  getPieceAt: (square: Square) => any,
  arrowColor: string,
  defendingColor?: Color
): { arrows: Arrow[]; marks: Mark[] } => {
  const arrows: Arrow[] = [];
  const marks: Mark[] = [];

  for (const square of targetSquares) {
    const piece = getPieceAt(square);
    if (!piece || piece.color === attackingColor) {
      const attackers = getAttackers(square, attackingColor);
      arrows.push(...createArrowsFromAttackers(attackers, square, arrowColor));
    } else if (defendingColor && piece.color === defendingColor) {
      // Add a mark for squares with defending pieces
      marks.push({ square, color: arrowColor });
    }
  }

  return { arrows, marks };
};
