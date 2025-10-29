import React from 'react';
import { Square } from 'chess.js';
import { PieceDropHandlerArgs, SquareHandlerArgs } from 'react-chessboard';
import { Arrow } from '../types/arrows';
import { PuzzleAttempt, UserColor } from '../types/drill';
import { ChessBoard } from './ChessBoard';
import { InfoPanelLayout } from './InfoPanelLayout';
import styles from './Layout.module.css';

interface LayoutProps {
  fen: string;
  arrows: Arrow[];
  lastMove: { from: Square; to: Square } | null;
  pendingMove: { sourceSquare: Square; legalTargets: Square[] } | null;
  onPieceDrop: (args: PieceDropHandlerArgs) => boolean;
  onSquareClick: (args: SquareHandlerArgs) => void;
  onSquareRightClick: (args: SquareHandlerArgs) => void;
  puzzleAttempts: PuzzleAttempt[];
  rating: number;
  lastPuzzleResult: boolean | null;
  userColor: UserColor;
}

export const Layout: React.FC<LayoutProps> = ({
  fen,
  arrows,
  lastMove,
  pendingMove,
  onPieceDrop,
  onSquareClick,
  onSquareRightClick,
  puzzleAttempts,
  rating,
  lastPuzzleResult,
  userColor,
}) => {
  return (
    <div className={styles.layout}>
      <div className={styles.boardResults}>
        <div className={styles.board}>
          <ChessBoard
            fen={fen}
            arrows={arrows}
            lastMove={lastMove}
            pendingMove={pendingMove}
            onPieceDrop={onPieceDrop}
            onSquareClick={onSquareClick}
            onSquareRightClick={onSquareRightClick}
            boardOrientation={userColor}
          />
        </div>

        <div className={styles.infoPanels}>
          <InfoPanelLayout
            attempts={puzzleAttempts}
            rating={rating}
            lastResult={lastPuzzleResult}
            userColor={userColor}
          />
        </div>
      </div>
    </div>
  );
};
