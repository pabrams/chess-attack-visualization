import { useState, useRef } from 'react';
import { Chess, Square, Move, Color } from 'chess.js';

export const useChessGame = () => {
  const chessGameRef = useRef(new Chess());
  const [fen, setFen] = useState(chessGameRef.current.fen());
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);

  const getLastMove = () => {
    if (moveHistory.length === 0) {
      return null;
    }
    const lastMove = moveHistory[moveHistory.length - 1];
    return {
      from: lastMove.from,
      to: lastMove.to,
    };
  };

  const makeMove = (sourceSquare: Square, targetSquare: Square, promotion?: string) => {
    try {
      const moveOptions: { from: Square; to: Square; promotion?: string } = {
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

      setFen(chessGameRef.current.fen());
      setMoveHistory(prev => [...prev, move]);
      return move;
    } catch (e) {
      console.debug('Invalid move attempted:', e);
      return null;
    }
  };

  const loadPgn = (pgn: string) => {
    try {
      chessGameRef.current.loadPgn(pgn);
      setFen(chessGameRef.current.fen());
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
      setFen(chessGameRef.current.fen());
      setMoveHistory(chessGameRef.current.history({ verbose: true }));
      return true;
    }
    return false;
  };

  const getAttackers = (square: Square, color: Color) => {
    return chessGameRef.current.attackers(square, color, true);
  };

  const getPieceAt = (square: Square) => {
    return chessGameRef.current.get(square);
  };

  const getLegalMoves = (square: Square): Square[] => {
    const moves = chessGameRef.current.moves({ square, verbose: true });
    return moves.map(move => move.to);
  };

  const findPiece = (piece: { type: string; color: Color }) => {
    return chessGameRef.current.findPiece({ type: piece.type as 'p' | 'n' | 'b' | 'r' | 'q' | 'k', color: piece.color });
  };

  const getTurn = (): Color => {
    return chessGameRef.current.turn();
  };

  return {
    fen,
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