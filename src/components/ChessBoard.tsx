import React from 'react';
import { Square } from 'chess.js';
import { Chessboard, PieceDropHandlerArgs, SquareHandlerArgs } from 'react-chessboard';
import { Arrow } from '../types/arrows';
import { UserColor } from '../types/drill';
import { useThemeContext } from '../contexts/ThemeContext';
import { getCustomPieces } from './customPieces';
import { CustomArrowOverlay } from './CustomArrowOverlay';
import { OPACITY } from '../constants/opacity';

interface ChessBoardProps {
  fen: string;
  arrows: Arrow[];
  marks?: any[];
  lastMove: { from: Square; to: Square } | null;
  pendingMove: { sourceSquare: Square; legalTargets: Square[] } | null;
  onPieceDrop: (args: PieceDropHandlerArgs) => boolean;
  onSquareClick: (args: SquareHandlerArgs) => void;
  onSquareRightClick: (args: SquareHandlerArgs) => void;
  boardOrientation?: UserColor;
}

export const ChessBoard: React.FC<ChessBoardProps> = (props) => {
  const { theme, currentThemeColors } = useThemeContext();
  const customPieces = getCustomPieces(theme);
  const [boardSize, setBoardSize] = React.useState(400);
  const boardContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleResize = () => {
      if (boardContainerRef.current) {
        const size = boardContainerRef.current.offsetWidth;
        setBoardSize(size);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const legalMoveStyles = props.pendingMove ? props.pendingMove.legalTargets.reduce((styles, square) => {
    styles[square] = {
      background: 'radial-gradient(circle, rgba(0, 0, 0, 0.3) 25%, transparent 25%)',
      borderRadius: '50%',
    };
    return styles;
  }, {} as Record<string, any>) : {};

  const chessboardOptions = {
    onPieceDrop: props.onPieceDrop,
    onSquareClick: props.onSquareClick,
    onSquareRightClick: props.onSquareRightClick,
    arrows: [],
    id: 'chessboard-options',
    position: props.fen,
    boardOrientation: props.boardOrientation ?? 'white',
    ...(customPieces && { pieces: customPieces }),
    allowDrawingArrows: false,
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
      ...(props.lastMove ? {
        [props.lastMove.from]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
        [props.lastMove.to]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
      } : {}),
      ...(props.pendingMove ? { [props.pendingMove.sourceSquare]: { backgroundColor: 'rgba(0, 255, 0, 0.5)' } } : {}),
    },
  };

  return (
    <div
      ref={boardContainerRef}
      style={{ position: 'relative', display: 'inline-block', width: '100%' }}
    >
      <Chessboard
        options={chessboardOptions}
        data-testid="chessboard"
      />
      {boardSize > 0 && (
        <CustomArrowOverlay
          arrows={props.arrows}
          marks={props.marks}
          boardSize={boardSize}
          boardOrientation={props.boardOrientation ?? 'white'}
          opacity={OPACITY.ARROW}
          isDarkTheme={theme === 'dark'}
        />
      )}
    </div>
  );
};
