import React from 'react';
import { Chessboard, PieceDropHandlerArgs, SquareHandlerArgs } from 'react-chessboard';
import { Arrow } from '../types/arrows';
import { customPieces } from './customPieces';

interface ChessBoardProps {
  theme: 'dark' | 'light';
  chessPosition: string;
  arrows: Arrow[];
  lightSquareColor: string;
  darkSquareColor: string;
  sourceSquare: string | null;
  targetSquare: string | null;
  selectedSquare: string | null;
  isAtFinalPosition: boolean;
  onPieceDrop: (args: PieceDropHandlerArgs) => boolean;
  onSquareClick: (args: SquareHandlerArgs) => void;
  onSquareRightClick: (args: SquareHandlerArgs) => void;
  onMoveComplete: () => void;
  isPuzzleAutoPlaying?: boolean;
  boardOrientation?: 'white' | 'black';
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  theme,
  chessPosition,
  arrows,
  lightSquareColor,
  darkSquareColor,
  sourceSquare,
  targetSquare,
  selectedSquare,
  onPieceDrop,
  onSquareClick,
  onSquareRightClick,
  onMoveComplete,
  isPuzzleAutoPlaying = false,
  boardOrientation = 'white',
}) => {
  const handlePieceDrop = (args: PieceDropHandlerArgs) => {
    if (isPuzzleAutoPlaying) {
      return false;
    }

    const success = onPieceDrop(args);
    if (success) {
      onMoveComplete();
    }
    return success;
  };

  const handleSquareClick = (args: SquareHandlerArgs) => {
    if (isPuzzleAutoPlaying) {
      return;
    }

    onSquareClick(args);
  };

  const chessboardOptions = {
    onPieceDrop: handlePieceDrop,
    onSquareClick: handleSquareClick,
    onSquareRightClick,
    arrows,
    id: 'chessboard-options',
    position: chessPosition,
    areDraggablePieces: !isPuzzleAutoPlaying,
    boardOrientation,
    pieces: customPieces,
    allowDrawingArrows: false,
    arrowOptions: {
      color: 'yellow',
      secondaryColor: 'red',
      tertiaryColor: 'blue',
      arrowLengthReducerDenominator: 1,
      sameTargetArrowLengthReducerDenominator: 2,
      arrowWidthDenominator: 8,
      activeArrowWidthMultiplier: 1.5,
      opacity: 1,
      activeOpacity: 0.6,
    },
    darkSquareStyle: {
      backgroundColor: darkSquareColor,
      border: 'none',
    },
    lightSquareStyle: {
      backgroundColor: lightSquareColor,
      border: 'none',
    },
    squareStyles: {
      ...(sourceSquare ? { [sourceSquare]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' } } : {}),
      ...(targetSquare ? { [targetSquare]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' } } : {}),
      ...(selectedSquare ? { [selectedSquare]: { backgroundColor: 'rgba(0, 255, 0, 0.5)' } } : {}),
    },
  };

  return (
    <Chessboard 
      options={chessboardOptions} 
      data-testid="chessboard" 
    />
  );
};
