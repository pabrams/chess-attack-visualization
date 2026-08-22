import React, { useContext, useMemo } from 'react';
import { Square } from 'chess.js';
import { Chessboard, PieceDropHandlerArgs, SquareHandlerArgs } from 'react-chessboard';
import { Arrow, Mark } from '../types/arrows';
import { UserColor } from '../types/drill';
import { ThemeContext } from '../hooks/useTheme';
import { useElementWidth } from '../hooks/useElementWidth';
import { getCustomPieces } from './customPieces';
import { CustomAttackerArrowOverlay } from './CustomAttackerArrowOverlay';
import { CustomCheckmateArrowOverlay } from './CustomCheckmateArrowOverlay';

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

const DEFAULT_BOARD_SIZE = 400;

interface ChessBoardProps {
  fen: string;
  attackerArrows: Arrow[];
  checkmateArrows: Arrow[];
  checkmateMarks: Mark[];
  attackerDisplay?: { square: Square; whiteCount: number; blackCount: number } | null;
  lastMove: { from: Square; to: Square } | null;
  pendingMove: { sourceSquare: Square; legalTargets: Square[] } | null;
  onPieceDrop: (args: PieceDropHandlerArgs) => boolean;
  onSquareClick: (args: SquareHandlerArgs) => void;
  onSquareRightClick: (args: SquareHandlerArgs) => void;
  boardOrientation?: UserColor;
}

export const ChessBoard: React.FC<ChessBoardProps> = (props) => {
  const { theme, currentThemeColors } = useContext(ThemeContext)!;
  // Rebuilding these on every render gave react-chessboard new piece component
  // identities every time, and each BOARD_STYLES call runs getComputedStyle,
  // forcing a style recalc per styled square.
  const customPieces = useMemo(() => getCustomPieces(theme), [theme]);
  const boardStyles = useMemo(() => ({
    legalMove: BOARD_STYLES.LEGAL_MOVE(),
    lastMove: BOARD_STYLES.LAST_MOVE(),
    pendingMove: BOARD_STYLES.PENDING_MOVE(),
  }), [theme]);
  const boardContainerRef = React.useRef<HTMLDivElement>(null);

  const boardSize = useElementWidth(boardContainerRef, DEFAULT_BOARD_SIZE);

  const legalMoveStyles = props.pendingMove ? props.pendingMove.legalTargets.reduce((styles, square) => {
    styles[square] = boardStyles.legalMove;
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
        [props.lastMove.from]: boardStyles.lastMove,
        [props.lastMove.to]: boardStyles.lastMove,
      } : {}),
      ...(props.pendingMove ? { [props.pendingMove.sourceSquare]: boardStyles.pendingMove } : {}),
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
        <>
          <CustomAttackerArrowOverlay
            arrows={props.attackerArrows}
            marks={[]}
            attackerDisplay={props.attackerDisplay}
            boardSize={boardSize}
            boardOrientation={props.boardOrientation ?? 'white'}
            arrowBorderColor={currentThemeColors.arrowBorderColor}
          />
          <CustomCheckmateArrowOverlay
            arrows={props.checkmateArrows}
            marks={props.checkmateMarks}
            attackerDisplay={null}
            boardSize={boardSize}
            boardOrientation={props.boardOrientation ?? 'white'}
            arrowBorderColor={currentThemeColors.arrowBorderColor}
          />
        </>
      )}
    </div>
  );
};
