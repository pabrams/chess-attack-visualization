import { useState, useRef } from 'react';
import { Chess, Square, Move } from 'chess.js';

export const useChessGame = () => {
  const chessGameRef = useRef(new Chess());
  const [chessPosition, setChessPosition] = useState(chessGameRef.current.fen());
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);

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
        return null;
      }

      setChessPosition(chessGameRef.current.fen());
      setMoveHistory(prev => [...prev, move]);
      return move;
    } catch (e) {
      console.error(e);
      return null;
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

  const undoLastMove = () => {
    const move = chessGameRef.current.undo();
    if (move) {
      setChessPosition(chessGameRef.current.fen());
      setMoveHistory(chessGameRef.current.history({ verbose: true }));
      return true;
    }
    return false;
  };

  const getAttackers = (square: Square, color: 'w' | 'b') => {
    return chessGameRef.current.attackers(square, color, true);
  };

  const getPieceAt = (square: string) => {
    return chessGameRef.current.get(square as Square);
  };

  const getLegalMoves = (square: string): string[] => {
    const moves = chessGameRef.current.moves({ square: square as Square, verbose: true });
    return moves.map(move => move.to);
  };

  const findPiece = (piece: { type: string; color: 'w' | 'b' }) => {
    return chessGameRef.current.findPiece({ type: piece.type as any, color: piece.color });
  };

  const getTurn = (): 'w' | 'b' => {
    return chessGameRef.current.turn();
  };

  return {
    chessPosition,
    getLastMove,
    makeMove,
    undoLastMove,
    loadPgn,
    getAttackers,
    getPieceAt,
    getLegalMoves,
    findPiece,
    getTurn,
  };
};

export type ChessGame = ReturnType<typeof useChessGame>;