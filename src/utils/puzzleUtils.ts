import { LichessPuzzle } from '../types/lichess';

export interface RawPuzzle {
  id: string;
  rating: number;
  themes: string[];
  fen: string;
  solution: string;
  setupMove: string;
  gameUrl: string;
}

export const convertToLichessPuzzleFormat = (rawPuzzles: RawPuzzle[]): LichessPuzzle[] => {
  return rawPuzzles.map((p: RawPuzzle) => ({
    game: {
      pgn: '',
      id: p.gameUrl.split('/')[3] || p.id,
    },
    puzzle: {
      id: p.id,
      initialPly: 0,
      plays: 0,
      rating: p.rating,
      solution: [p.solution],
      themes: p.themes,
    },
    _fen: p.fen,
    _setupMove: p.setupMove,
  } as LichessPuzzle & { _fen?: string; _setupMove?: string }));
};
