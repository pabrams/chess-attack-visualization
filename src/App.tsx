import { useCallback, useState, useContext } from 'react';
import { Square } from 'chess.js';
import { SquareHandlerArgs } from 'react-chessboard';
import { useChessGame } from './hooks/useChessGame';
import { ThemeContext } from './hooks/useTheme';
import { useArrows } from './hooks/useArrows';
import { useRating } from './hooks/useRating';
import { useDrill } from './hooks/useDrill';
import { useMoveHandler } from './hooks/useMoveHandler';
import { usePuzzleResults } from './hooks/usePuzzleResults';
import Header from './components/Header';
import { Layout } from './components/Layout';
import { PromotionDialog } from './components/PromotionDialog';
import './App.css';

const App = () => {
  const chessGame = useChessGame();
  const { theme, currentThemeColors, toggleTheme } = useContext(ThemeContext)!;
  const { rating, addPoints } = useRating();
  const [attackerDisplay, setAttackerDisplay] = useState<{ square: Square; whiteCount: number; blackCount: number } | null>(null);

  const { attempts, lastResult, recordResult } = usePuzzleResults({
    rating,
    onPointsAdded: addPoints,
  });

  const arrows = useArrows({
    chessGame,
  });

  const handleSquareRightClick = useCallback((args: SquareHandlerArgs) => {
    if (!args.square) return;

    const clickedSquare = args.square as Square;

    // If clicking the same square again, clear the attacker display
    if (attackerDisplay && attackerDisplay.square === clickedSquare) {
      setAttackerDisplay(null);
      return;
    }

    const whiteAttackers = chessGame.getAttackers(clickedSquare, 'w');
    const blackAttackers = chessGame.getAttackers(clickedSquare, 'b');

    setAttackerDisplay({
      square: clickedSquare,
      whiteCount: whiteAttackers.length,
      blackCount: blackAttackers.length,
    });

    if (arrows.attackerArrows.length > 0 && arrows.attackerArrows.every(arrow =>
      arrow.endSquare === clickedSquare
    )) {
      arrows.clearArrows();
    } else {
      arrows.handleSquareRightClick(args);
    }
  }, [arrows, attackerDisplay, chessGame]);

  const handlePuzzleResult = useCallback(() => {
    arrows.showCheckmaters();
  }, [arrows]);

  const handleLoadNextPuzzle = useCallback(() => {
    arrows.clearArrows();
  }, [arrows]);

  const { drillState, handlePuzzleMove } = useDrill({
    chessGame,
    rating,
    onResultRecorded: recordResult,
    onPuzzleResult: handlePuzzleResult,
    onPuzzleLoad: handleLoadNextPuzzle,
  });

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
    onMoveComplete: handlePuzzleResult,
    fen: chessGame.fen,
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
          attackerArrows={arrows.attackerArrows}
          checkmateArrows={arrows.checkmateArrows}
          checkmateMarks={arrows.checkmateMarks}
          attackerDisplay={attackerDisplay}
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
