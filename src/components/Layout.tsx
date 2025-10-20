import React from 'react';
import { PieceDropHandlerArgs, SquareHandlerArgs } from 'react-chessboard';
import { Arrow } from '../types/arrows';
import { PuzzleAttempt } from '../types/drill';
import { ChessBoard } from './ChessBoard';
import { InfoPanelLayout } from './InfoPanelLayout';
import styles from './Layout.module.css';

interface LayoutProps {
  theme: 'dark' | 'light';

  // Board props
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
  boardOrientation: 'white' | 'black';

  // Info panel props
  puzzleAttempts: PuzzleAttempt[];
  rating: number;
  lastPuzzleResult: 'success' | 'failure' | null;
}

export const Layout: React.FC<LayoutProps> = ({
  theme,
  chessPosition,
  arrows,
  lightSquareColor,
  darkSquareColor,
  sourceSquare,
  targetSquare,
  selectedSquare,
  isAtFinalPosition,
  onPieceDrop,
  onSquareClick,
  onSquareRightClick,
  onMoveComplete,
  boardOrientation,
  puzzleAttempts,
  rating,
  lastPuzzleResult,
}) => {
  return (
    <div className={styles.layout}>
      <div className={styles.boardResults}>
        <div className={styles.board}>
          <ChessBoard
            chessPosition={chessPosition}
            arrows={arrows}
            lightSquareColor={lightSquareColor}
            darkSquareColor={darkSquareColor}
            sourceSquare={sourceSquare}
            targetSquare={targetSquare}
            selectedSquare={selectedSquare}
            isAtFinalPosition={isAtFinalPosition}
            onPieceDrop={onPieceDrop}
            onSquareClick={onSquareClick}
            onSquareRightClick={onSquareRightClick}
            onMoveComplete={onMoveComplete}
            isPuzzleAutoPlaying={false}
            boardOrientation={boardOrientation}
          />
        </div>

        <div className={styles.infoPanels}>
          <InfoPanelLayout
            attempts={puzzleAttempts}
            theme={theme}
            rating={rating}
            lastResult={lastPuzzleResult}
          />
        </div>
      </div>
    </div>
  );
};
