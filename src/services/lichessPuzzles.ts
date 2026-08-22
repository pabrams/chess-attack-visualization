import { LichessPuzzle } from '../types/lichess';

const LICHESS_HOST = 'https://lichess.org';

/**
 * The only puzzle angle this app currently drills.
 */
export const PUZZLE_ANGLE = 'mateIn1';
export const PUZZLE_THEME = 'mateIn1';
export const PUZZLE_DIFFICULTY = 'easiest';

export class LichessScopeError extends Error {
  constructor() {
    super('Lichess token is missing the puzzle scopes');
    this.name = 'LichessScopeError';
  }
}

export class LichessRateLimitError extends Error {
  constructor() {
    super('Rate limited by Lichess');
    this.name = 'LichessRateLimitError';
  }
}

export interface PuzzleGlicko {
  rating: number;
  deviation: number;
  provisional?: boolean;
}

export interface PuzzleRound {
  id: string;
  win: boolean;
  ratingDiff: number;
}

export interface PuzzleBatchResponse {
  puzzles: LichessPuzzle[];
  glicko?: PuzzleGlicko;
  rounds?: PuzzleRound[];
}

export const isMateInOne = (puzzle: LichessPuzzle | undefined | null): boolean =>
  !!puzzle &&
  !!puzzle.puzzle &&
  Array.isArray(puzzle.puzzle.themes) &&
  puzzle.puzzle.themes.includes(PUZZLE_THEME) &&
  Array.isArray(puzzle.puzzle.solution) &&
  puzzle.puzzle.solution.length === 1 &&
  typeof puzzle.game?.pgn === 'string';

export const filterMateInOne = (puzzles: unknown): LichessPuzzle[] =>
  Array.isArray(puzzles) ? (puzzles as LichessPuzzle[]).filter(isMateInOne) : [];

const authHeaders = (token: string | null): HeadersInit =>
  token ? { Authorization: `Bearer ${token}` } : {};

const parseBatch = async (response: Response): Promise<PuzzleBatchResponse> => {
  if (response.status === 401 || response.status === 403) throw new LichessScopeError();
  if (response.status === 429) throw new LichessRateLimitError();
  if (!response.ok) throw new Error(`Lichess responded ${response.status}`);

  const data = await response.json();
  return {
    puzzles: filterMateInOne(data?.puzzles),
    glicko: data?.glicko,
    rounds: data?.rounds,
  };
};

export const fetchPuzzleBatch = async (
  token: string | null,
  nb = 50
): Promise<PuzzleBatchResponse> => {
  const url = `${LICHESS_HOST}/api/puzzle/batch/${PUZZLE_ANGLE}?nb=${nb}&difficulty=${PUZZLE_DIFFICULTY}`;
  return parseBatch(await fetch(url, { headers: authHeaders(token) }));
};

export const submitPuzzleSolution = async (
  token: string,
  puzzleId: string,
  win: boolean
): Promise<PuzzleBatchResponse> => {
  const url = `${LICHESS_HOST}/api/puzzle/batch/${PUZZLE_ANGLE}?nb=0`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ solutions: [{ id: puzzleId, win, rated: true }] }),
  });
  return parseBatch(response);
};
