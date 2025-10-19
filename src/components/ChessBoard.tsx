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
  isAtFinalPosition: boolean;
  onPieceDrop: (args: PieceDropHandlerArgs) => boolean;
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
  onPieceDrop,
  onSquareRightClick,
  onMoveComplete,
  isPuzzleAutoPlaying = false,
  boardOrientation = 'white',
}) => {
  const handlePieceDrop = (args: PieceDropHandlerArgs) => {
    // Disable piece drops during puzzle auto-play
    if (isPuzzleAutoPlaying) {
      return false;
    }

    const success = onPieceDrop(args);
    if (success) {
      onMoveComplete();
    }
    return success;
  };

  const chessboardOptions = {
    onPieceDrop: handlePieceDrop,
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
      arrowLengthReducerDenominator: 4,
      sameTargetArrowLengthReducerDenominator: 2,
      arrowWidthDenominator: 10,
      activeArrowWidthMultiplier: 1.5,
      opacity: 0.5,
      activeOpacity: 0.6,
    },
    boardStyle: {
      width: '100%',
      height: '100%',
      outline: `3px dashed ${lightSquareColor}`,
      outlineOffset: '2px',
      boxShadow: theme === 'dark'
        ? '0 8px 32px rgba(0, 0, 0, 0.8)'
        : '0 8px 32px rgba(0, 0, 0, 0.15)',
      borderRadius: '8px',
      overflow: 'hidden',
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
    },
  };

  return (
    <Chessboard 
      options={chessboardOptions} 
      data-testid="chessboard" 
    />
  );
};
