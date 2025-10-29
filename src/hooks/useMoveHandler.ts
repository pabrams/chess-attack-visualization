import { useState, useCallback } from 'react';
import { Square, Color } from 'chess.js';
import { PieceDropHandlerArgs, SquareHandlerArgs } from 'react-chessboard';
import { isBackRank } from '../utils/chessPieceUtils';
import type { ChessGame } from './useChessGame';

interface UseMoveHandlerProps {
  chessGame: ChessGame;
  handlePuzzleMove: (sourceSquare: Square, targetSquare: Square, promotion?: string) => any;
  onMoveComplete: () => void;
}

export const useMoveHandler = ({ chessGame, handlePuzzleMove, onMoveComplete }: UseMoveHandlerProps) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{
    sourceSquare: Square;
    targetSquare: Square;
    pieceColor: Color;
  } | null>(null);

  const legalMoves = selectedSquare ? chessGame.getLegalMoves(selectedSquare) : [];

  const isPawnPromotion = useCallback((sourceSquare: Square, targetSquare: Square): boolean => {
    const piece = chessGame.getPieceAt(sourceSquare);
    if (!piece) return false;

    const isPawn = piece.type === 'p';
    return isPawn && isBackRank(targetSquare);
  }, [chessGame]);

  const attemptMove = useCallback((sourceSquare: Square, targetSquare: Square): boolean => {
    if (isPawnPromotion(sourceSquare, targetSquare)) {
      const piece = chessGame.getPieceAt(sourceSquare)!;
      setPendingPromotion({ sourceSquare, targetSquare, pieceColor: piece.color });
      return false;
    }

    const move = handlePuzzleMove(sourceSquare, targetSquare);
    if (move) {
      onMoveComplete();
      return true;
    }
    return false;
  }, [isPawnPromotion, chessGame, handlePuzzleMove, onMoveComplete]);

  const selectPieceForMove = useCallback((square: Square) => {
    const piece = chessGame.getPieceAt(square);
    if (piece) {
      setSelectedSquare(square);
    }
  }, [chessGame]);

  const executeSelectedMove = useCallback((targetSquare: Square) => {
    if (!selectedSquare) return;

    const sourceSquare = selectedSquare;
    setSelectedSquare(null);

    if (sourceSquare === targetSquare) return;

    attemptMove(sourceSquare, targetSquare);
  }, [selectedSquare, attemptMove]);

  const handleSquareClick = useCallback(({ square }: SquareHandlerArgs) => {
    if (!selectedSquare) {
      selectPieceForMove(square as Square);
    } else {
      executeSelectedMove(square as Square);
    }
  }, [selectedSquare, selectPieceForMove, executeSelectedMove]);

  const handlePieceDrop = useCallback(({ sourceSquare, targetSquare }: PieceDropHandlerArgs) => {
    if (!targetSquare) {
      return false;
    }

    return attemptMove(sourceSquare as Square, targetSquare as Square);
  }, [attemptMove]);

  const handlePromotionSelect = useCallback((promotionPiece: 'q' | 'r' | 'b' | 'n') => {
    if (!pendingPromotion) return;

    const { sourceSquare, targetSquare } = pendingPromotion;
    const move = handlePuzzleMove(sourceSquare, targetSquare, promotionPiece);

    setPendingPromotion(null);

    if (move) {
      onMoveComplete();
    }
  }, [pendingPromotion, handlePuzzleMove, onMoveComplete]);

  return {
    selectedSquare,
    legalMoves,
    pendingPromotion,
    handleSquareClick,
    handlePieceDrop,
    handlePromotionSelect,
  };
};
