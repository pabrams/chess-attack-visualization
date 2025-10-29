import React from 'react';
import { Square } from 'chess.js';
import { PieceDropHandlerArgs, SquareHandlerArgs } from 'react-chessboard';
import { Arrow } from '../types/arrows';
import { PuzzleAttempt, PlayerColor } from '../types/drill';
import { ChessBoard } from './ChessBoard';
import { InfoPanelLayout } from './InfoPanelLayout';
import styles from './Layout.module.css';

interface LayoutProps {
  chessPosition: string;
  arrows: Arrow[];
  sourceSquare: Square | null;
  targetSquare: Square | null;
  selectedSquare: Square | null;
  legalMoves: Square[];
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
  chessPosition,
  arrows,
  sourceSquare,
  targetSquare,
  selectedSquare,
  legalMoves,
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
            chessPosition={chessPosition}
            arrows={arrows}
            sourceSquare={sourceSquare}
            targetSquare={targetSquare}
            selectedSquare={selectedSquare}
            legalMoves={legalMoves}
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
