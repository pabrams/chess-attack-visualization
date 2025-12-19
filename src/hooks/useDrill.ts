import { useReducer, useCallback, useEffect, useRef } from 'react';
import { Square, Chess } from 'chess.js';
import { LichessPuzzle } from '../types/lichess';
import { UserColor } from '../types/drill';
import type { ChessGame } from './useChessGame';
import { useLocalStorage } from './useLocalStorage';

const SOLVE_COMPLETION_DELAY_MS = 1000;
const STORAGE_KEY = 'monkeydrillState';

interface UseDrillProps {
  chessGame: ChessGame;
  rating: number;
  onPuzzleResult: (success: boolean, puzzleRating: number, puzzleId: string) => void;
  triggerPuzzleOutcomeVisuals: () => void;
  onLoadNext?: () => void;
}

interface DrillState {
  puzzles: LichessPuzzle[];
}

type DrillAction =
  | { type: 'LOAD_NEW_PUZZLES'; payload: { puzzles: LichessPuzzle[] } }
  | { type: 'ADVANCE_PUZZLE' };

const initialState: DrillState = {
  puzzles: []
};

const initDrillState = (defaultState: DrillState): DrillState => {
  if (typeof window === 'undefined') return defaultState;
  try {
    const item = window.localStorage.getItem(STORAGE_KEY);
    return item ? JSON.parse(item) : defaultState;
  } catch {
    return defaultState;
  }
};

const drillReducer = (state: DrillState, action: DrillAction): DrillState => {
  switch (action.type) {
    case 'LOAD_NEW_PUZZLES':
      return { ...state, puzzles: action.payload.puzzles };
    case 'ADVANCE_PUZZLE':
      return { ...state, puzzles: state.puzzles.slice(1) };
    default:
      return state;
  }
};

export const useDrill = ({ chessGame, onPuzzleResult, triggerPuzzleOutcomeVisuals, onLoadNext }: UseDrillProps) => {
  const [state, dispatch] = useReducer(drillReducer, initialState, initDrillState);
  const [rateLimitTime, setRateLimitTime] = useLocalStorage<number>('monkeydrillRateLimitTime', 0);
  const isFetching = useRef(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);


  const loadBoard = useCallback((puzzle: LichessPuzzle) => {
    if (!puzzle) return;
    const chess = new Chess();
    chess.loadPgn(puzzle.game.pgn);
    chessGame.loadPgn(chess.pgn());
    onLoadNext?.();
  }, [chessGame, onLoadNext]);

  const fetchPuzzles = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;

    if (rateLimitTime > 0) {
      alert("Rate limit exceeded. Waiting...");
      await new Promise(resolve => setTimeout(resolve, rateLimitTime));
      setRateLimitTime(0);
    }

    try {
      const response = await fetch('https://lichess.org/api/puzzle/batch/matein1?nb=50&difficulty=easiest');
      if (response.status === 429) {
        setRateLimitTime(65000);
        return;
      }

      const data = await response.json();
      const puzzles = data.puzzles as LichessPuzzle[];

      if (puzzles.length > 0) {
        dispatch({ type: 'LOAD_NEW_PUZZLES', payload: { puzzles } });
        loadBoard(puzzles[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      isFetching.current = false;
    }
  }, [rateLimitTime, setRateLimitTime, loadBoard]);

  useEffect(() => {
    if (state.puzzles.length > 0) {
      loadBoard(state.puzzles[0]);
    } else {
      fetchPuzzles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const processPuzzleResult = useCallback((success: boolean) => {
    const current = state.puzzles[0];
    if (!current) return;

    onPuzzleResult(success, current.puzzle.rating, current.puzzle.id);

    setTimeout(() => {
      const next = state.puzzles[1];
      dispatch({ type: 'ADVANCE_PUZZLE' });

      if (next) {
        loadBoard(next);
      } else {
        fetchPuzzles();
      }
    }, SOLVE_COMPLETION_DELAY_MS);
  }, [state.puzzles, onPuzzleResult, loadBoard, fetchPuzzles]);

  const handlePuzzleMove = useCallback((sourceSquare: Square, targetSquare: Square, promotion?: string) => {
    const current = state.puzzles[0];
    if (!current) return null;

    const move = chessGame.makeMove(sourceSquare, targetSquare, promotion);
    if (!move) return null;

    if (move.lan !== current.puzzle.solution[0]) {
      chessGame.undoLastMove();
      processPuzzleResult(false);
    } else {
      processPuzzleResult(true);
    }

    triggerPuzzleOutcomeVisuals();
    return move;
  }, [state.puzzles, chessGame, triggerPuzzleOutcomeVisuals, processPuzzleResult]);

  const currentPuzzle = state.puzzles[0];
  const userColor: UserColor = currentPuzzle
    ? (currentPuzzle.puzzle.initialPly % 2 === 0 ? 'black' : 'white')
    : 'white';

  return { drillState: { ...state, userColor }, handlePuzzleMove };
};