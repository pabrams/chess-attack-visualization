import { useState, useEffect } from 'react';
import { Square } from 'chess.js';
import { SquareHandlerArgs } from 'react-chessboard';
import { useChessGame } from './hooks/useChessGame';
import { useThemeContext } from './contexts/ThemeContext';
import { useArrows } from './hooks/useArrows';
import { useRating } from './hooks/useRating';
import { useDrill, SOLVE_COMPLETION_DELAY_MS } from './hooks/useDrill';
import { useMoveHandler } from './hooks/useMoveHandler';
import { usePuzzleResults } from './hooks/usePuzzleResults';
import Header from './components/Header';
import { Layout } from './components/Layout';
import { PromotionDialog } from './components/PromotionDialog';
import './App.css';

const App = () => {
  const chessGame = useChessGame();
  const { theme, currentThemeColors, toggleTheme } = useThemeContext();
  const { rating, addPoints } = useRating();

  const { attempts, lastResult, recordResult } = usePuzzleResults({
    rating,
    onPointsAdded: addPoints,
  });

  const { drillState, puzzleState, handlePuzzleMove } = useDrill({
    chessGame,
    rating,
    onResultRecorded: recordResult,
  });

  const arrows = useArrows({
    chessGame,
    whiteArrowColor: currentThemeColors.whiteArrowColor,
    blackArrowColor: currentThemeColors.blackArrowColor,
  });

  const [lastClickedSquare, setLastClickedSquare] = useState<Square | null>(null);

  const handleSquareRightClick = (args: SquareHandlerArgs) => {
    if (!args.square) return;

    const clickedSquare = args.square as Square;
    if (clickedSquare === lastClickedSquare && arrows.arrows.length > 0) {
      arrows.clearArrows();
      setLastClickedSquare(null);
    } else {
      arrows.handleSquareRightClick(args);
      setLastClickedSquare(clickedSquare);
    }
  };

  const handleMoveComplete = () => {
    if (drillState.active) {
      arrows.showCheckmaters();
    } else {
      arrows.clearArrows();
    }
  };

  useEffect(() => {
    if (puzzleState.completed || puzzleState.failed) {
      const timer = setTimeout(() => {
        arrows.clearArrows();
      }, SOLVE_COMPLETION_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [puzzleState.completed, puzzleState.failed, arrows]);

  const {
    selectedSquare,
    legalMoves,
    pendingPromotion,
    handleSquareClick,
    handlePieceDrop,
    handlePromotionSelect,
  } = useMoveHandler({
    chessGame,
    handlePuzzleMove,
    onMoveComplete: handleMoveComplete,
  });

  const lastMove = chessGame.getLastMove();
  const sourceSquare = lastMove ? lastMove.from : null;
  const targetSquare = lastMove ? lastMove.to : null;

  return (
    <>
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {pendingPromotion && (
        <PromotionDialog
          color={pendingPromotion.pieceColor}
          onSelect={handlePromotionSelect}
          theme={theme}
        />
      )}

      <div
        data-testid="app-container"
        className="app-container"
        style={{
          backgroundColor: currentThemeColors.pageBackgroundColor,
          color: currentThemeColors.pageForegroundColor,
        }}
      >

        <Layout
          fen={chessGame.fen}
          arrows={arrows.arrows}
          lastMove={
            sourceSquare && targetSquare
              ? { from: sourceSquare, to: targetSquare }
              : null
          }
          pendingMove={
            selectedSquare
              ? { sourceSquare: selectedSquare, legalTargets: legalMoves }
              : null
          }
          onPieceDrop={handlePieceDrop}
          onSquareClick={handleSquareClick}
          onSquareRightClick={handleSquareRightClick}
          puzzleAttempts={attempts}
          rating={rating}
          lastPuzzleResult={lastResult}
          userColor={drillState.userColor}
        />
      </div>
    </>
  );
};

export default App;
