import React from 'react';
import { PieceDropHandlerArgs, SquareHandlerArgs } from 'react-chessboard';
import { Arrow } from '../types/arrows';
import { PuzzleAttempt } from '../types/drill';
import { ChessBoard } from './ChessBoard';
import { DrillTimer } from './DrillTimer';
import { TimerContainer } from './TimerContainer';
import { InfoPanelLayout } from './InfoPanelLayout';
import { BeginButton } from './BeginButton';
import styles from './DrillLayout.module.css';

interface DrillLayoutProps {
  // Timer props
  theme: 'dark' | 'light';
  isDrillActive: boolean;
  onTimeUp: () => void;

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
  showBeginButton: boolean;
  onBeginClick: () => void;

  // Info panel props
  puzzleAttempts: PuzzleAttempt[];
  rating: number;
  lastPuzzleResult: 'success' | 'failure' | null;
}

export const DrillLayout: React.FC<DrillLayoutProps> = ({
  theme,
  isDrillActive,
  onTimeUp,
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
  showBeginButton,
  onBeginClick,
  puzzleAttempts,
  rating,
  lastPuzzleResult,
}) => {
  return (
    <div className={styles.layout}>
      <div className={styles.boardResults}>
        <div className={styles.board}>
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <ChessBoard
              theme={theme}
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

            {showBeginButton && (
              <BeginButton onClick={onBeginClick} />
            )}
          </div>
        </div>

        <div className={styles.infoPanels}>
          <div className={styles.timer}>
            <TimerContainer>
              <DrillTimer onTimeUp={onTimeUp} theme={theme} isActive={isDrillActive} />
            </TimerContainer>
          </div>
          <div className={styles.puzzleHistory}>
            <InfoPanelLayout
              attempts={puzzleAttempts}
              theme={theme}
              rating={rating}
              lastResult={lastPuzzleResult}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
