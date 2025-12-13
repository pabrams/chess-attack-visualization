import React from 'react';
import { Square } from 'chess.js';
import { Chessboard, PieceDropHandlerArgs, SquareHandlerArgs } from 'react-chessboard';
import { Arrow, Mark } from '../types/arrows';
import { UserColor } from '../types/drill';
import { useTheme } from '../hooks/useTheme';
import { getCustomPieces } from './customPieces';
import { CustomArrowOverlay } from './CustomArrowOverlay';

const getCSSVar = (varName: string): string => {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
};

const BOARD_STYLES = {
  LEGAL_MOVE: () => ({
    background: getCSSVar('--board-legal-move-bg'),
    borderRadius: '50%',
  }),

  LAST_MOVE: () => ({
    backgroundColor: getCSSVar('--board-last-move-bg'),
  }),

  PENDING_MOVE: () => ({
    backgroundColor: getCSSVar('--board-pending-move-bg'),
  }),

  SQUARE_DEFAULTS: {
    border: 'none',
  },
} as const;

interface ChessBoardProps {
  fen: string;
  arrows: Arrow[];
  marks?: Mark[];
  lastMove: { from: Square; to: Square } | null;
  pendingMove: { sourceSquare: Square; legalTargets: Square[] } | null;
  onPieceDrop: (args: PieceDropHandlerArgs) => boolean;
  onSquareClick: (args: SquareHandlerArgs) => void;
  onSquareRightClick: (args: SquareHandlerArgs) => void;
  boardOrientation?: UserColor;
}

export const ChessBoard: React.FC<ChessBoardProps> = (props) => {
  const { theme, currentThemeColors } = useTheme();
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
    styles[square] = BOARD_STYLES.LEGAL_MOVE();
    return styles;
  }, {} as Record<Square, React.CSSProperties>) : {};

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
      ...BOARD_STYLES.SQUARE_DEFAULTS,
    },
    lightSquareStyle: {
      backgroundColor: currentThemeColors.lightSquareColor,
      ...BOARD_STYLES.SQUARE_DEFAULTS,
    },
    squareStyles: {
      ...legalMoveStyles,
      ...(props.lastMove ? {
        [props.lastMove.from]: BOARD_STYLES.LAST_MOVE(),
        [props.lastMove.to]: BOARD_STYLES.LAST_MOVE(),
      } : {}),
      ...(props.pendingMove ? { [props.pendingMove.sourceSquare]: BOARD_STYLES.PENDING_MOVE() } : {}),
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
          arrowBorderColor={currentThemeColors.arrowBorderColor}
        />
      )}
    </div>
  );
};
