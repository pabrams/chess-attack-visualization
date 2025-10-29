import React from 'react';
import { Square } from 'chess.js';
import { PieceDropHandlerArgs, SquareHandlerArgs } from 'react-chessboard';
import { Arrow } from '../types/arrows';
import { PuzzleAttempt, PlayerColor } from '../types/drill';
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
  boardOrientation: PlayerColor;
  puzzleAttempts: PuzzleAttempt[];
  rating: number;
  lastPuzzleResult: boolean | null;
  playerColor: PlayerColor;
}

export const Layout: React.FC<LayoutProps> = ({
  fen,
  arrows,
  lastMove,
  pendingMove,
  onPieceDrop,
  onSquareClick,
  onSquareRightClick,
  boardOrientation,
  puzzleAttempts,
  rating,
  lastPuzzleResult,
  playerColor,
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
            boardOrientation={boardOrientation}
          />
        </div>

        <div className={styles.infoPanels}>
          <InfoPanelLayout
            attempts={puzzleAttempts}
            rating={rating}
            lastResult={lastPuzzleResult}
            playerColor={playerColor}
          />
        </div>
      </div>
    </div>
  );
};
