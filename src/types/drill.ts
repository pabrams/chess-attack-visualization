export type UserColor = 'white' | 'black';

export interface PuzzleAttempt {
  /** Stable unique id for this attempt (the same puzzle can be drilled twice). */
  attemptId: string;
  puzzleId: string;
  puzzleRating: number;
  ratingChange: number;
  timestamp: number;
  success: boolean;
  /** True when the attempt was reported to Lichess and it updated the rating. */
  syncedToLichess?: boolean;
}
