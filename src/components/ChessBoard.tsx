import React from 'react';
import { Square } from 'chess.js';
import { Chessboard, PieceDropHandlerArgs, SquareHandlerArgs } from 'react-chessboard';
import { Arrow } from '../types/arrows';
import { UserColor } from '../types/drill';
import { useThemeContext } from '../contexts/ThemeContext';
import { getCustomPieces } from './customPieces';
import { CustomArrowOverlay } from './CustomArrowOverlay';
import { BOARD_STYLES } from '../constants/boardStyles';

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
    styles[square] = BOARD_STYLES.LEGAL_MOVE;
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
      ...BOARD_STYLES.SQUARE_DEFAULTS,
    },
    lightSquareStyle: {
      backgroundColor: currentThemeColors.lightSquareColor,
      ...BOARD_STYLES.SQUARE_DEFAULTS,
    },
    squareStyles: {
      ...legalMoveStyles,
      ...(props.lastMove ? {
        [props.lastMove.from]: BOARD_STYLES.LAST_MOVE,
        [props.lastMove.to]: BOARD_STYLES.LAST_MOVE,
      } : {}),
      ...(props.pendingMove ? { [props.pendingMove.sourceSquare]: BOARD_STYLES.PENDING_MOVE } : {}),
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
          isDarkTheme={theme === 'dark'}
        />
      )}
    </div>
  );
};
