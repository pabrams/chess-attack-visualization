import React from 'react';
import { Chessboard, PieceDropHandlerArgs, SquareHandlerArgs } from 'react-chessboard';
import { Arrow } from '../types/arrows';
import { PlayerColor } from '../types/drill';
import { useThemeContext } from '../contexts/ThemeContext';
import { getCustomPieces } from './customPieces';

interface ChessBoardProps {
  chessPosition: string;
  arrows: Arrow[];
  sourceSquare: string | null;
  targetSquare: string | null;
  selectedSquare: string | null;
  legalMoves: string[];
  onPieceDrop: (args: PieceDropHandlerArgs) => boolean;
  onSquareClick: (args: SquareHandlerArgs) => void;
  onSquareRightClick: (args: SquareHandlerArgs) => void;
  boardOrientation?: PlayerColor;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  chessPosition,
  arrows,
  sourceSquare,
  targetSquare,
  selectedSquare,
  legalMoves,
  onPieceDrop,
  onSquareClick,
  onSquareRightClick,
  boardOrientation = 'white',
}) => {
  const { theme, currentThemeColors } = useThemeContext();
  const customPieces = getCustomPieces(theme);

  const legalMoveStyles = legalMoves.reduce((styles, square) => {
    styles[square] = {
      background: 'radial-gradient(circle, rgba(0, 0, 0, 0.3) 25%, transparent 25%)',
      borderRadius: '50%',
    };
    return styles;
  }, {} as Record<string, any>);

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
      backgroundColor: currentThemeColors.darkSquareColor,
      border: 'none',
    },
    lightSquareStyle: {
      backgroundColor: currentThemeColors.lightSquareColor,
      border: 'none',
    },
    squareStyles: {
      ...legalMoveStyles,
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
