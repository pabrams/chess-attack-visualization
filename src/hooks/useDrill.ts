import { useReducer, useCallback, useEffect, useRef } from 'react';
import { Square, Move, Chess } from 'chess.js';
import { LichessPuzzle } from '../types/lichess';
import { UserColor } from '../types/drill';
import type { ChessGame } from './useChessGame';
import { getLevelFromRating } from '../utils/ratingCalculation';
import { sampleArray } from '../utils/arrayUtils';
import { convertToLichessPuzzleFormat, type RawPuzzle } from '../utils/puzzleUtils';

export const SOLVE_COMPLETION_DELAY_MS = 1000;

interface UseDrillProps {
  chessGame: ChessGame;
  rating: number;
  onResultRecorded: (success: boolean, puzzleRating: number, puzzleId: string) => void;
  onPuzzleResult: () => void;
  onPuzzleLoad?: () => void;
}

interface DrillState {
  userColor: UserColor;
  puzzles: LichessPuzzle[];
  currentPuzzle: LichessPuzzle | null;
}

type DrillAction =
  | { type: 'INITIALIZE_COLOR'; payload: UserColor }
  | { type: 'LOAD_PUZZLES'; payload: LichessPuzzle[] }
  | { type: 'ADVANCE_PUZZLE'; payload: LichessPuzzle | null };

const initialState: DrillState = {
  userColor: 'white',
  puzzles: [],
  currentPuzzle: null,
};

const drillReducer = (state: DrillState, action: DrillAction): DrillState => {
  switch (action.type) {
    case 'INITIALIZE_COLOR':
      return { ...state, userColor: action.payload };
    case 'LOAD_PUZZLES':
      return { ...state, puzzles: action.payload };
    case 'ADVANCE_PUZZLE': {
      const [, ...remaining] = state.puzzles;
      return {
        ...state,
        puzzles: remaining,
        currentPuzzle: action.payload,
      };
    }
    default:
      return state;
  }
};

const selectRandomUserColor = (): UserColor => {
  return Math.random() < 0.5 ? 'white' : 'black';
};

export const useDrill = ({ chessGame, rating, onResultRecorded, onPuzzleResult, onPuzzleLoad }: UseDrillProps) => {
  const [state, dispatch] = useReducer(drillReducer, initialState);

  const initialRatingRef = useRef(rating);

  useEffect(() => {
    const loadPuzzles = async () => {
      const newUserColor = selectRandomUserColor();
      dispatch({ type: 'INITIALIZE_COLOR', payload: newUserColor });

      try {
        const playerLevel = getLevelFromRating(initialRatingRef.current);
        const colorPrefix = newUserColor === 'white' ? 'w' : 'b';
        const puzzleFile = `${import.meta.env.BASE_URL}lichess_db_puzzle-${colorPrefix}-one-move-${playerLevel}.json`;
        const response = await fetch(puzzleFile);

        if (!response.ok) {
          throw new Error(`Failed to load puzzle file: ${response.status} ${response.statusText}`);
        }

        const data = await response.json() as { puzzles: RawPuzzle[] };
        const sampled = sampleArray(data.puzzles, 200);
        const converted = convertToLichessPuzzleFormat(sampled);

        dispatch({ type: 'LOAD_PUZZLES', payload: converted });
        if (converted.length > 0) {
          dispatch({ type: 'ADVANCE_PUZZLE', payload: converted[0] });
          loadPuzzleOnBoard(converted[0]);
        }
      } catch (error) {
        console.error('Error loading puzzles:', error);
      }
    };

    loadPuzzles();
  }, []);

  const loadPuzzleOnBoard = useCallback((puzzle: LichessPuzzle) => {
    const setupMove = (puzzle as any)._setupMove;
    const fen = (puzzle as any)._fen;

    if (!setupMove || !fen) return;

    const success = chessGame.loadPgn(new Chess(fen).pgn());
    if (!success) return;

    setTimeout(() => {
      const tempChess = new Chess(fen);
      const from = setupMove.substring(0, 2);
      const to = setupMove.substring(2, 4);
      const promotion = setupMove.length > 4 ? setupMove.substring(4) : undefined;

      const move = tempChess.move({ from, to, promotion: promotion as any });
      if (move) {
        chessGame.loadPgn(tempChess.pgn());
        onPuzzleLoad?.();
      }
    }, 600);
  }, [chessGame, onPuzzleLoad]);

  const recordResultAndLoadNext = useCallback((success: boolean) => {
    if (!state.currentPuzzle) return;

    onResultRecorded(success, state.currentPuzzle.puzzle.rating, state.currentPuzzle.puzzle.id);

    setTimeout(() => {
      const [, ...remaining] = state.puzzles;
      const next = remaining[0] ?? null;
      dispatch({ type: 'ADVANCE_PUZZLE', payload: next });
      if (next) {
        loadPuzzleOnBoard(next);
      }
    }, SOLVE_COMPLETION_DELAY_MS);
  }, [state, onResultRecorded, loadPuzzleOnBoard]);

  const handlePuzzleMove = useCallback((sourceSquare: Square, targetSquare: Square, promotion?: string) => {
    if (!state.currentPuzzle) return null;

    const move = chessGame.makeMove(sourceSquare, targetSquare, promotion);
    if (!move) return move;

    const expectedMove = state.currentPuzzle.puzzle.solution[0];
    const isCorrect = move.lan === expectedMove;

    if (!isCorrect) {
      chessGame.undoLastMove();
      recordResultAndLoadNext(false);
      onPuzzleResult();
      return null;
    }

    recordResultAndLoadNext(true);
    onPuzzleResult();
    return move;
  }, [state.currentPuzzle, chessGame, onPuzzleResult, recordResultAndLoadNext]);

  return {
    drillState: {
      userColor: state.userColor,
      currentPuzzle: state.currentPuzzle,
    },
    handlePuzzleMove,
  };
};
