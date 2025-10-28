import { Color as PieceColor } from 'chess.js';
import { PlayerColor } from '../types/drill';

/**
 * Inverts a chess notation color (w -> b, b -> w)
 */
export const invertColor = (color: PieceColor): PieceColor =>
  color === 'w' ? 'b' : 'w';

export const isBackRank = (square: string): boolean =>
  square[1] === '8' || square[1] === '1';

/**
 * Gets the board orientation for react-chessboard during a drill.
 *
 * During active drills, we invert the playerColor parameter because react-chessboard's
 * orientation prop uses a double-negative: passing 'black' displays the board with
 * white on the bottom (white player's perspective). This is confusing but we keep it
 * for backward compatibility with how the board is currently displayed.
 */
export const getBoardOrientation = (
  active: boolean,
  playerColor: PlayerColor
): PlayerColor => {
  if (!active) return 'white';
  return playerColor === 'white' ? 'black' : 'white';
};
