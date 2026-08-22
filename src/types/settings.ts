
/**
 * Lichess puzzle difficulty. Signed in, it shifts the band by 300 points per
 * step from the player's own puzzle rating; signed out there is no rating to
 * shift from, so it shifts a fixed band (1300-1600 at normal) instead.
 */
export type PuzzleDifficulty = 'easiest' | 'easier' | 'normal' | 'harder' | 'hardest';

export const PUZZLE_DIFFICULTIES: readonly PuzzleDifficulty[] = [
  'easiest',
  'easier',
  'normal',
  'harder',
  'hardest',
];

export const DEFAULT_PUZZLE_DIFFICULTY: PuzzleDifficulty = 'easiest';
export const PUZZLE_DIFFICULTY_STORAGE_KEY = 'puzzleDifficulty';

export interface NextPuzzleDelayOption {
  ms: number | null;
  label: string;
}

export const NEXT_PUZZLE_DELAYS: readonly NextPuzzleDelayOption[] = [
  { ms: 0, label: 'None' },
  { ms: 1000, label: '1s' },
  { ms: 2000, label: '2s' },
  { ms: 5000, label: '5s' },
  { ms: null, label: 'Infinite' },
];

export const DEFAULT_NEXT_PUZZLE_DELAY_MS: number | null = 1000;
export const NEXT_PUZZLE_DELAY_STORAGE_KEY = 'nextPuzzleDelayMs';

/** Shown on the board while the drill waits for a click at the longest setting. */
export const NEXT_PUZZLE_PROMPT = 'Click to load the next puzzle';

export const difficultyIndex = (difficulty: PuzzleDifficulty): number => {
  const index = PUZZLE_DIFFICULTIES.indexOf(difficulty);
  return index === -1 ? PUZZLE_DIFFICULTIES.indexOf(DEFAULT_PUZZLE_DIFFICULTY) : index;
};

export const nextPuzzleDelayIndex = (ms: number | null): number => {
  const index = NEXT_PUZZLE_DELAYS.findIndex(option => option.ms === ms);
  return index === -1 ? NEXT_PUZZLE_DELAYS.findIndex(o => o.ms === DEFAULT_NEXT_PUZZLE_DELAY_MS) : index;
};
