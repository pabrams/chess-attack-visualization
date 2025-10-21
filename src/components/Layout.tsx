import React from 'react';
import { PieceDropHandlerArgs, SquareHandlerArgs } from 'react-chessboard';
import { Arrow } from '../types/arrows';
import { PuzzleAttempt } from '../types/drill';
import { ChessBoard } from './ChessBoard';
import { InfoPanelLayout } from './InfoPanelLayout';
import styles from './Layout.module.css';

interface LayoutProps {
  theme: 'dark' | 'light';
  chessPosition: string;
  arrows: Arrow[];
  lightSquareColor: string;
  darkSquareColor: string;
  sourceSquare: string | null;
  targetSquare: string | null;
  selectedSquare: string | null;
  legalMoves: string[];
  onPieceDrop: (args: PieceDropHandlerArgs) => boolean;
  onSquareClick: (args: SquareHandlerArgs) => void;
  onSquareRightClick: (args: SquareHandlerArgs) => void;
  boardOrientation: 'white' | 'black';
  puzzleAttempts: PuzzleAttempt[];
  rating: number;
  lastPuzzleResult: boolean | null;
  playerColor: 'white' | 'black';
  whiteArrowColor: string;
  blackArrowColor: string;
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
  legalMoves,
  onPieceDrop,
  onSquareClick,
  onSquareRightClick,
  boardOrientation,
  puzzleAttempts,
  rating,
  lastPuzzleResult,
  playerColor,
  whiteArrowColor,
  blackArrowColor,
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
            legalMoves={legalMoves}
            onPieceDrop={onPieceDrop}
            onSquareClick={onSquareClick}
            onSquareRightClick={onSquareRightClick}
            boardOrientation={boardOrientation}
            theme={theme}
          />
        </div>

        <div className={styles.infoPanels}>
          <InfoPanelLayout
            attempts={puzzleAttempts}
            theme={theme}
            rating={rating}
            lastResult={lastPuzzleResult}
            playerColor={playerColor}
            whiteArrowColor={whiteArrowColor}
            blackArrowColor={blackArrowColor}
          />
        </div>
      </div>
    </div>
  );
};
