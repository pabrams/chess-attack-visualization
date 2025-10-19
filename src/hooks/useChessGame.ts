import { useState, useRef, useEffect } from 'react';
import { Chess, Square, Move } from 'chess.js';

interface PuzzleState {
  active: boolean;
  solution: string[]; // Array of moves in UCI format (e.g., ['e2e4', 'e7e5'])
  currentMoveIndex: number; // Index of the next expected move in the solution
  isPlayerTurn: boolean;
  completed: boolean;
  puzzleStartTime?: number;
  onWrongMove?: () => void;
}

export const useChessGame = () => {
  const chessGameRef = useRef(new Chess());
  const [chessPosition, setChessPosition] = useState(chessGameRef.current.fen());
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [puzzleState, setPuzzleState] = useState<PuzzleState>({
    active: false,
    solution: [],
    currentMoveIndex: 0,
    isPlayerTurn: false,
    completed: false,
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

      if (puzzleState.active && puzzleState.isPlayerTurn) {
        const expectedMove = puzzleState.solution[puzzleState.currentMoveIndex];
        const playerMove = move.lan;
        if (playerMove !== expectedMove) {
          // Wrong move - undo it
          chessGameRef.current.undo();
          if (puzzleState.onWrongMove) {
            puzzleState.onWrongMove();
          }
          return false;
        }

        // Correct move!
        setChessPosition(chessGameRef.current.fen());
        setMoveHistory(prev => [...prev, move]);

        // Check if this was the last move in the solution
        if (puzzleState.currentMoveIndex === puzzleState.solution.length - 1) {
          // Puzzle completed!
          setPuzzleState(prev => ({
            ...prev,
            completed: true,
            isPlayerTurn: false,
          }));
        } else {
          // More moves to go - increment index and set to opponent's turn
          setPuzzleState(prev => ({
            ...prev,
            currentMoveIndex: prev.currentMoveIndex + 1,
            isPlayerTurn: false,
          }));
        }

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

  const startPuzzleMode = (solution: string[], onWrongMove?: () => void) => {
    setPuzzleState({
      active: true,
      solution,
      currentMoveIndex: 0,
      isPlayerTurn: true,
      completed: false,
      puzzleStartTime: Date.now(),
      onWrongMove,
    });
  };

  const exitPuzzleMode = () => {
    setPuzzleState({
      active: false,
      solution: [],
      currentMoveIndex: 0,
      isPlayerTurn: false,
      completed: false,
      puzzleStartTime: undefined,
      onWrongMove: undefined,
    });
  };

  useEffect(() => {
    if (!puzzleState.active || puzzleState.isPlayerTurn || puzzleState.completed) {
      return;
    }

    const nextMove = puzzleState.solution[puzzleState.currentMoveIndex];
    if (!nextMove) {
      console.error('No move found in solution at index', puzzleState.currentMoveIndex);
      return;
    }

    // Parse the UCI move (e.g., "e2e4")
    const from = nextMove.substring(0, 2);
    const to = nextMove.substring(2, 4);
    const promotion = nextMove.length > 4 ? nextMove.substring(4) : undefined;

    const move = chessGameRef.current.move({
      from,
      to,
      promotion: promotion as 'q' | 'r' | 'b' | 'n' | undefined,
    });

    if (!move) {
      console.error('Failed to make opponent move:', nextMove);
      return;
    }

    setChessPosition(chessGameRef.current.fen());
    setMoveHistory(prev => [...prev, move]);

    // Now it's the player's turn
    setPuzzleState(prev => ({
      ...prev,
      currentMoveIndex: prev.currentMoveIndex + 1,
      isPlayerTurn: true,
    }));
  }, [puzzleState]);

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
    startPuzzleMode,
    exitPuzzleMode,
  };
};
