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
  | { type: 'SET_STATE'; payload: DrillState }
  | { type: 'LOAD_NEW_PUZZLES'; payload: { puzzles: LichessPuzzle[]; userColor: UserColor } }
  | { type: 'ADVANCE_PUZZLE' };

const initialState: DrillState = {
  userColor: 'white',
  puzzles: [],
  currentPuzzle: null,
};

const initDrillState = (defaultState: DrillState): DrillState => {
  if (typeof window === 'undefined') return defaultState;
  try {
    const item = window.localStorage.getItem(STORAGE_KEY);
    const state = item ? JSON.parse(item) : defaultState;
    return state;
  } catch (error) {
    return defaultState;
  }
};

const drillReducer = (state: DrillState, action: DrillAction): DrillState => {
  switch (action.type) {
    case 'SET_STATE':
      return action.payload;
    case 'LOAD_NEW_PUZZLES':
      const { puzzles, userColor } = action.payload;
      return {
        ...state,
        userColor,
        puzzles,
        currentPuzzle: puzzles.length > 0 ? puzzles[0] : null,
      };
    case 'ADVANCE_PUZZLE': {
      const nextPuzzles = state.puzzles.slice(1);
      return {
        ...state,
        puzzles: nextPuzzles,
        currentPuzzle: nextPuzzles.length > 0 ? nextPuzzles[0] : null,
      };
    }
    default:
      return state;
  }
};

const selectRandomUserColor = (): UserColor => {
  return Math.random() < 0.5 ? 'white' : 'black';
};

export const useDrill = ({ chessGame, onResultRecorded, onPuzzleResult, onPuzzleLoad }: UseDrillProps) => {
  const [state, dispatch] = useReducer(drillReducer, initialState, initDrillState);
  const [rateLimitTime, setRateLimitTime] = useLocalStorage<number>('monkeydrillRateLimitTime', 0);
  
  const isFetching = useRef(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const loadBoard = useCallback((puzzle: LichessPuzzle) => {
    if (!puzzle) return;
    const chess = new Chess();
    chess.loadPgn(puzzle.game.pgn);
    chessGame.loadPgn(chess.pgn());
    onPuzzleLoad?.();
  }, [chessGame, onPuzzleLoad]);

  const fetchPuzzles = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;

    let targetColor = state.userColor || selectRandomUserColor();

    if (rateLimitTime > 0) {
      alert("Rate limit exceeded. Waiting before fetching new puzzles.");
      await sleep(rateLimitTime);
      setRateLimitTime(0);
    }

    try {
      const url = 'https://lichess.org/api/puzzle/batch/matein1?nb=50&difficulty=easiest';
      const response = await fetch(url, { 
        headers: { 
          'Accept': 'application/json',
          'User-Agent': 'MonkeyDrill/1.0 (codemonkeyfromspace@gmail.com)'
        } 
      });

      if (response.status === 429) {
        setRateLimitTime(65000);
        return;
      }

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      
      const data = await response.json();
      const rawPuzzles = data.puzzles as LichessPuzzle[];

      if (rawPuzzles.length === 0) return;


      let coloredPuzzles = rawPuzzles.filter(p => 
        p.puzzle.initialPly % 2 === (targetColor === 'black' ? 0 : 1)
      );

      // If no puzzles found for color, flip color and try again with same batch
      if (coloredPuzzles.length === 0) {
        throw new Error(`Error: no puzzles found for color ${targetColor}`);
      }

      dispatch({ 
        type: 'LOAD_NEW_PUZZLES', 
        payload: { puzzles: coloredPuzzles, userColor: targetColor } 
      });

      if (coloredPuzzles.length > 0) {
        loadBoard(coloredPuzzles[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      isFetching.current = false;
    }
  }, [state.userColor, rateLimitTime, setRateLimitTime, loadBoard]);

  useEffect(() => {
    if (state.currentPuzzle) {
      loadBoard(state.currentPuzzle);
    } else if (state.puzzles.length === 0) {
      fetchPuzzles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const recordResultAndLoadNext = useCallback((success: boolean) => {
    if (!state.currentPuzzle) return;

    onResultRecorded(success, state.currentPuzzle.puzzle.rating, state.currentPuzzle.puzzle.id);

    setTimeout(() => {
      const nextPuzzle = state.puzzles[1];

      if (!nextPuzzle) {
        dispatch({ type: 'ADVANCE_PUZZLE' }); 
        fetchPuzzles();
      } else {
        dispatch({ type: 'ADVANCE_PUZZLE' });
        loadBoard(nextPuzzle);
      }
    }, SOLVE_COMPLETION_DELAY_MS);
  }, [state.puzzles, state.currentPuzzle, onResultRecorded, loadBoard, fetchPuzzles]);

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
    drillState: state,
    handlePuzzleMove,
  };
};