import React from 'react';
import { Chessboard, PieceDropHandlerArgs, SquareHandlerArgs } from 'react-chessboard';
import { Arrow } from '../types/arrows';
import { getCustomPieces } from './customPieces';

interface ChessBoardProps {
  chessPosition: string;
  arrows: Arrow[];
  lightSquareColor: string;
  darkSquareColor: string;
  sourceSquare: string | null;
  targetSquare: string | null;
  selectedSquare: string | null;
  onPieceDrop: (args: PieceDropHandlerArgs) => boolean;
  onSquareClick: (args: SquareHandlerArgs) => void;
  onSquareRightClick: (args: SquareHandlerArgs) => void;
  boardOrientation?: 'white' | 'black';
  theme: 'dark' | 'light';
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
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
  boardOrientation = 'white',
  theme,
}) => {
  const customPieces = getCustomPieces(theme);

  const chessboardOptions = {
    onPieceDrop,
    onSquareClick,
    onSquareRightClick,
    arrows,
    id: 'chessboard-options',
    position: chessPosition,
    boardOrientation,
    ...(customPieces && { pieces: customPieces }),
    allowDrawingArrows: false,
    arrowOptions: {
      color: 'yellow',
      secondaryColor: 'red',
      tertiaryColor: 'blue',
      arrowLengthReducerDenominator: 1000,
      sameTargetArrowLengthReducerDenominator: 3,
      arrowWidthDenominator: 8,
      activeArrowWidthMultiplier: 1.5,
      opacity: 0.9,
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
