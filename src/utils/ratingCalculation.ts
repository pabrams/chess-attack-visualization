/**
 * Calculates the rating change based on puzzle performance
 *
 * @param playerRating - The player's current rating
 * @param puzzleRating - The rating of the puzzle attempted
 * @param success - Whether the player succeeded (true) or failed (false)
 * @returns The number of points to add to the player's rating (can be negative)
 */
export function calculateRatingChange(
  playerRating: number,
  puzzleRating: number,
  success: boolean
): number {

  const C = 200;
  const K = 32;
  const r_old = playerRating;
  const r_puzzle = puzzleRating;
  const result = success ? 1 : -1;
  const points = K * (result/2) + (K/( 4 * C)) * (r_puzzle - r_old);
  console.log('calculateRatingChange called with:', { playerRating, puzzleRating, success });
  console.log('calculated points:', points);
  return points;
}
