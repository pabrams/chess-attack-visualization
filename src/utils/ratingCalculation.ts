import levelsData from '../../public/levels.json';

interface LevelBounds {
  lowerBound: number;
  upperBound: number;
}

type LevelsData = Record<string, LevelBounds>;

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

/**
 * Gets the player's level based on their rating
 *
 * @param rating - The player's rating
 * @returns The level name (e.g., "beginner", "expert", "grandmaster")
 */
export function getLevelFromRating(rating: number): string {
  const levels = levelsData as LevelsData;

  for (const [levelName, bounds] of Object.entries(levels)) {
    if (rating >= bounds.lowerBound && rating <= bounds.upperBound) {
      return levelName;
    }
  }

  // Fallback to "beginner" if no match found
  return 'beginner';
}

/**
 * Formats a level name for display (capitalizes and replaces hyphens with spaces)
 *
 * @param level - The level name (e.g., "candidate-master")
 * @returns The formatted level name (e.g., "Candidate Master")
 */
export function formatLevelName(level: string): string {
  return level
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
