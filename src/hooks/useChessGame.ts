import { useState, useRef } from 'react';
import { Chess, Square, Move } from 'chess.js';

interface PuzzleState {
  active: boolean;
  solution: string[]; // Single move in UCI format (e.g., ['e2e4'])
  completed: boolean;
  failed: boolean;
  puzzleStartTime?: number;
}

export const useChessGame = () => {
  const chessGameRef = useRef(new Chess());
  const [chessPosition, setChessPosition] = useState(chessGameRef.current.fen());
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [puzzleState, setPuzzleState] = useState<PuzzleState>({
    active: false,
    solution: [],
    completed: false,
    failed: false,
  });

  const getLastMove = () => {
    if (moveHistory.length === 0) {
      return null;
    }
    const lastMove = moveHistory[moveHistory.length - 1];
    return {
      from: lastMove.from,
      to: lastMove.to,
      promotion: lastMove.promotion,
      san: lastMove.san,
    };
  };

  const makeMove = (sourceSquare: string, targetSquare: string, promotion?: string) => {
    try {
      const moveOptions: any = {
        from: sourceSquare,
        to: targetSquare,
      };

      if (promotion) {
        moveOptions.promotion = promotion;
      }

      const move = chessGameRef.current.move(moveOptions);

      if (!move) {
        return false;
      }

      if (puzzleState.active) {
        const expectedMove = puzzleState.solution[0];
        const playerMove = move.lan;
        if (playerMove !== expectedMove) {
          // Wrong move - undo it and mark as failed
          chessGameRef.current.undo();
          setPuzzleState(prev => ({
            ...prev,
            failed: true,
          }));
          return false;
        }

        // Correct move!
        setChessPosition(chessGameRef.current.fen());
        setMoveHistory(prev => [...prev, move]);

        // Puzzle completed! (all our puzzles are one-move only)
        setPuzzleState(prev => ({
          ...prev,
          completed: true,
        }));

        return true;
      }

      setChessPosition(chessGameRef.current.fen());
      setMoveHistory(prev => [...prev, move]);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const loadPgn = (pgn: string) => {
    try {
      chessGameRef.current.loadPgn(pgn);
      setChessPosition(chessGameRef.current.fen());
      setMoveHistory(chessGameRef.current.history({ verbose: true }));
      return true;
    } catch (e) {
      console.error('Failed to load PGN:', e);
      return false;
    }
  };

  const startPuzzle = (solution: string[]) => {
    setPuzzleState({
      active: true,
      solution,
      completed: false,
      failed: false,
      puzzleStartTime: Date.now(),
    });
  };

  const exitPuzzleMode = () => {
    setPuzzleState({
      active: false,
      solution: [],
      completed: false,
      failed: false,
    });
  };

  // Note: Opponent move auto-play removed - all puzzles are one-move only
  // The opponent's setup move is handled manually in useDrill before starting the puzzle

  const getAttackers = (square: Square, color: 'w' | 'b') => {
    return chessGameRef.current.attackers(square, color);
  };

  return {
    chessPosition,
    isAtFinalPosition: chessGameRef.current.isGameOver(),
    getLastMove,
    makeMove,
    loadPgn,
    getAttackers,
    puzzleState,
    startPuzzle,
    exitPuzzleMode,
  };
};
