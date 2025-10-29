import { Square } from 'chess.js';

export interface Arrow {
  startSquare: Square;
  endSquare: Square;
  color: string;
}
