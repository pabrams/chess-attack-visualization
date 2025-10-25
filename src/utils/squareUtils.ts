/**
 * Get all squares adjacent to a given square (up to 8 surrounding squares)
 * @param square - Chess square in algebraic notation (e.g., 'e4')
 * @returns Array of adjacent square coordinates within board bounds
 */
export const getAdjacentSquares = (square: string): string[] => {
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0); // 0-7
  const rank = parseInt(square[1]) - 1; // 0-7

  const adjacentSquares: string[] = [];

  for (let f = file - 1; f <= file + 1; f++) {
    for (let r = rank - 1; r <= rank + 1; r++) {
      // Stay within board bounds and exclude the original square
      if (f >= 0 && f <= 7 && r >= 0 && r <= 7 && !(f === file && r === rank)) {
        const adjacentSquare = String.fromCharCode('a'.charCodeAt(0) + f) + (r + 1);
        adjacentSquares.push(adjacentSquare);
      }
    }
  }

  return adjacentSquares;
};
