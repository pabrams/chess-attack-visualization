import { useState, useRef, useMemo } from 'react';
import { Chess, Square, Color } from 'chess.js';

export const useChessGame = () => {
  const chessGameRef = useRef(new Chess());

  const [fen, setFen] = useState(chessGameRef.current.fen());

  const makeMove = (sourceSquare: Square, targetSquare: Square, promotion?: string) => {
    try {
      const move = chessGameRef.current.move({
        from: sourceSquare,
        to: targetSquare,
        promotion,
      });

      if (!move) {
        return null;
      }

      setFen(chessGameRef.current.fen());
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
      return true;
    } catch (e) {
      console.error('Failed to load PGN:', e);
      return false;
    }
  };

  const loadFen = (fenString: string) => {
    try {
      chessGameRef.current.load(fenString);
      setFen(chessGameRef.current.fen());
      return true;
    } catch (e) {
      console.error('Failed to load FEN:', e);
      return false;
    }
  };

  const undoLastMove = () => {
    const move = chessGameRef.current.undo();
    if (move) {
      setFen(chessGameRef.current.fen());
      return true;
    }
    return false;
  };

  const getLastMove = () => {
    const history = chessGameRef.current.history({ verbose: true });
    if (history.length === 0) {
      return null;
    }
    const lastMove = history[history.length - 1];
    return {
      from: lastMove.from,
      to: lastMove.to,
    };
  };

  const getAttackers = (square: Square, color: Color) => {
    return chessGameRef.current.attackers(square, color, true);
  };

  const getPieceAt = (square: Square) => {
    return chessGameRef.current.get(square);
  };

  const getLegalMoves = (square: Square): Square[] => {
    const moves = chessGameRef.current.moves({ square, verbose: true });
    return moves.map((move) => move.to);
  };

  const findPiece = (piece: { type: string; color: Color }) => {
    return chessGameRef.current.findPiece({
      type: piece.type as 'p' | 'n' | 'b' | 'r' | 'q' | 'k',
      color: piece.color,
    });
  };

  const getTurn = (): Color => {
    return chessGameRef.current.turn();
  };

  const isCheckmate = (): boolean => {
    return chessGameRef.current.isCheckmate();
  };

  return useMemo(
    () => ({
      fen,
      getLastMove,
      makeMove,
      undoLastMove,
      loadPgn,
      loadFen,
      getAttackers,
      getPieceAt,
      getLegalMoves,
      findPiece,
      getTurn,
      isCheckmate,
    }),
    [fen]
  );
};

export type ChessGame = ReturnType<typeof useChessGame>;
