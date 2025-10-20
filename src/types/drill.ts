export interface PuzzleAttempt {
  puzzleId: string;
  puzzleUrl: string;
  puzzleRating: number;
  ratingChange: number;
  timestamp: number;
  success: boolean;
}
