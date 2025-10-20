export interface PuzzleAttempt {
  puzzleId: string;
  puzzleRating: number;
  ratingChange: number;
  timestamp: number;
  success: boolean;
}
