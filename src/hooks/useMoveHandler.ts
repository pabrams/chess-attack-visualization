import { useReducer, useCallback, useEffect } from 'react';
import { Square, Color, Move } from 'chess.js';
import { PieceDropHandlerArgs, SquareHandlerArgs } from 'react-chessboard';
import type { ChessGame } from './useChessGame';

export const isBackRank = (square: Square): boolean =>
  square[1] === '8' || square[1] === '1';

interface UseMoveHandlerProps {
  chessGame: ChessGame;
  handlePuzzleMove: (sourceSquare: Square, targetSquare: Square, promotion?: string) => Move | null;
  onMoveComplete: () => void;
  fen?: string;
}

interface MoveHandlerState {
  selectedSquare: Square | null;
  pendingPromotion: {
    sourceSquare: Square;
    targetSquare: Square;
    pieceColor: Color;
  } | null;
}

type MoveHandlerAction =
  | { type: 'SELECT_SQUARE'; payload: Square }
  | { type: 'CLEAR_SQUARE' }
  | { type: 'SET_PENDING_PROMOTION'; payload: { sourceSquare: Square; targetSquare: Square; pieceColor: Color } }
  | { type: 'CLEAR_PENDING_PROMOTION' };

const initialState: MoveHandlerState = {
  selectedSquare: null,
  pendingPromotion: null,
};

const moveHandlerReducer = (state: MoveHandlerState, action: MoveHandlerAction): MoveHandlerState => {
  switch (action.type) {
    case 'SELECT_SQUARE':
      return { ...state, selectedSquare: action.payload };
    case 'CLEAR_SQUARE':
      return { ...state, selectedSquare: null };
    case 'SET_PENDING_PROMOTION':
      return { ...state, pendingPromotion: action.payload };
    case 'CLEAR_PENDING_PROMOTION':
      return { ...state, pendingPromotion: null };
    default:
      return state;
  }
};

export const useMoveHandler = ({ chessGame, handlePuzzleMove, onMoveComplete, fen }: UseMoveHandlerProps) => {
  const [state, dispatch] = useReducer(moveHandlerReducer, initialState);

  // Clear selection and promotion when puzzle changes (FEN changes)
  useEffect(() => {
    dispatch({ type: 'CLEAR_SQUARE' });
    dispatch({ type: 'CLEAR_PENDING_PROMOTION' });
  }, [fen]);

  const legalMoves = state.selectedSquare ? chessGame.getLegalMoves(state.selectedSquare) : [];

  const isPawnPromotion = useCallback((sourceSquare: Square, targetSquare: Square): boolean => {
    const piece = chessGame.getPieceAt(sourceSquare);
    if (!piece) return false;

    const isPawn = piece.type === 'p';
    return isPawn && isBackRank(targetSquare);
  }, [chessGame]);

  const attemptMove = useCallback((sourceSquare: Square, targetSquare: Square): boolean => {
    if (isPawnPromotion(sourceSquare, targetSquare)) {
      const piece = chessGame.getPieceAt(sourceSquare)!;
      dispatch({ type: 'SET_PENDING_PROMOTION', payload: { sourceSquare, targetSquare, pieceColor: piece.color } });
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
      dispatch({ type: 'SELECT_SQUARE', payload: square });
    }
  }, [chessGame]);

  const executeSelectedMove = useCallback((targetSquare: Square) => {
    if (!state.selectedSquare) return;

    const sourceSquare = state.selectedSquare;
    dispatch({ type: 'CLEAR_SQUARE' });

    if (sourceSquare === targetSquare) return;

    attemptMove(sourceSquare, targetSquare);
  }, [state.selectedSquare, attemptMove]);

  const handleSquareClick = useCallback(({ square }: SquareHandlerArgs) => {
    if (!state.selectedSquare) {
      selectPieceForMove(square as Square);
    } else {
      executeSelectedMove(square as Square);
    }
  }, [state.selectedSquare, selectPieceForMove, executeSelectedMove]);

  const handlePieceDrop = useCallback(({ sourceSquare, targetSquare }: PieceDropHandlerArgs) => {
    if (!targetSquare) {
      return false;
    }

    return attemptMove(sourceSquare as Square, targetSquare as Square);
  }, [attemptMove]);

  const handlePromotionSelect = useCallback((promotionPiece: 'q' | 'r' | 'b' | 'n') => {
    if (!state.pendingPromotion) return;

    const { sourceSquare, targetSquare } = state.pendingPromotion;
    const move = handlePuzzleMove(sourceSquare, targetSquare, promotionPiece);

    dispatch({ type: 'CLEAR_PENDING_PROMOTION' });

    if (move) {
      onMoveComplete();
    }
  }, [state.pendingPromotion, handlePuzzleMove, onMoveComplete]);

  return {
    selectedSquare: state.selectedSquare,
    legalMoves: legalMoves,
    pendingPromotion: state.pendingPromotion,
    handleSquareClick: handleSquareClick,
    handlePieceDrop: handlePieceDrop,
    handlePromotionSelect: handlePromotionSelect,
  };
};
