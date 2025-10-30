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

export const Layout: React.FC<LayoutProps> = (props) => {
  return (
    <div className={styles.layout}>
      <div className={styles.boardResults}>
        <div className={styles.board}>
          <ChessBoard
            fen={props.fen}
            arrows={props.arrows}
            lastMove={props.lastMove}
            pendingMove={props.pendingMove}
            onPieceDrop={props.onPieceDrop}
            onSquareClick={props.onSquareClick}
            onSquareRightClick={props.onSquareRightClick}
            boardOrientation={props.userColor}
          />
        </div>

        <div className={styles.infoPanels}>
          <InfoPanelLayout
            attempts={props.puzzleAttempts}
            rating={props.rating}
            lastResult={props.lastPuzzleResult}
            userColor={props.userColor}
          />
        </div>
      </div>
    </div>
  );
};
