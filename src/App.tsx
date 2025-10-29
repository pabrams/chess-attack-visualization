import { useState } from 'react';
import { Square } from 'chess.js';
import { SquareHandlerArgs } from 'react-chessboard';
import { useChessGame } from './hooks/useChessGame';
import { useThemeContext } from './contexts/ThemeContext';
import { useArrows } from './hooks/useArrows';
import { useRating } from './hooks/useRating';
import { useDrill } from './hooks/useDrill';
import { useMoveHandler } from './hooks/useMoveHandler';
import Header from './components/Header';
import { Layout } from './components/Layout';
import { LoadingOverlay } from './components/LoadingOverlay';
import { PromotionDialog } from './components/PromotionDialog';
import './App.css';

const App = () => {
  const chessGame = useChessGame();
  const { theme, currentThemeColors, toggleTheme } = useThemeContext();
  const { rating, addPoints } = useRating();

  const { drillState, puzzleAttempts, lastPuzzleResult, handlePuzzleMove } = useDrill({
    chessGame,
    rating,
    addPoints,
  });

  const arrows = useArrows({
    chessGame,
    whiteArrowColor: currentThemeColors.whiteArrowColor,
    blackArrowColor: currentThemeColors.blackArrowColor,
  });

  const [lastClickedSquare, setLastClickedSquare] = useState<Square | null>(null);

  const handleSquareRightClick = ({ square }: SquareHandlerArgs) => {
    const clickedSquare = square as Square;
    if (clickedSquare === lastClickedSquare && arrows.arrows.length > 0) {
      arrows.clearArrows();
      setLastClickedSquare(null);
    } else {
      arrows.handleSquareRightClick({ square });
      setLastClickedSquare(clickedSquare);
    }
  };

  const handleMoveComplete = () => {
    if (drillState.active) {
      arrows.showCheckmaters();
      setTimeout(() => {
        arrows.clearArrows();
      }, 5000);
    } else {
      arrows.clearArrows();
    }
  };

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

      {drillState.loading && <LoadingOverlay />}

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
          puzzleAttempts={puzzleAttempts}
          rating={rating}
          lastPuzzleResult={lastPuzzleResult}
          userColor={drillState.userColor}
        />
      </div>
    </>
  );
};

export default App;
