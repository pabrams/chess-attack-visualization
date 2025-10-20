import { useState } from 'react';
import { PieceDropHandlerArgs, SquareHandlerArgs } from 'react-chessboard';
import { useChessGame } from './hooks/useChessGame';
import { useTheme } from './hooks/useTheme';
import { useArrows } from './hooks/useArrows';
import { useRating } from './hooks/useRating';
import { useDrill } from './hooks/useDrill';
import Header from './components/Header';
import { DrillLayout } from './components/DrillLayout';
import { LoadingOverlay } from './components/LoadingOverlay';
import { PromotionDialog } from './components/PromotionDialog';
import './App.css';

const App = () => {
  const chessGame = useChessGame();
  const theme = useTheme();
  const arrows = useArrows();
  const { rating, addPoints } = useRating();

  const { drillState, puzzleAttempts, lastPuzzleResult, handleDrillStart, handleDrillTimeUp, handlePuzzleMove } = useDrill({
    chessGame,
    rating,
    addPoints,
  });

  const [pendingPromotion, setPendingPromotion] = useState<{
    sourceSquare: string;
    targetSquare: string;
    pieceColor: 'w' | 'b';
  } | null>(null);

  // Click-to-move state
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);

  const handleSquareRightClick = ({ square }: SquareHandlerArgs) => {
    arrows.showAttackersForSquare(
      square,
      chessGame.getAttackers,
      theme.currentThemeColors.whiteArrowColor,
      theme.currentThemeColors.blackArrowColor
    );
  };

  // Helper function to attempt a move and handle pawn promotion
  const attemptMove = (sourceSquare: string, targetSquare: string): boolean => {
    // Check for pawn promotion
    const piece = chessGame.getPieceAt(sourceSquare);
    if (piece) {
      const isPawn = piece.type === 'p';
      const isBackRank = targetSquare[1] === '8' || targetSquare[1] === '1';

      if (isPawn && isBackRank) {
        setPendingPromotion({ sourceSquare, targetSquare, pieceColor: piece.color });
        return false; // Don't complete the move yet - wait for promotion selection
      }
    }

    // Regular move (not a promotion)
    const move = handlePuzzleMove(sourceSquare, targetSquare);
    if (move) {
      handleMoveComplete();
      return true;
    }
    return false;
  };

  const handleSquareClick = ({ square }: SquareHandlerArgs) => {
    if (!selectedSquare) {
      // First click - select the piece if it's movable
      const piece = chessGame.getPieceAt(square);
      if (piece) {
        setSelectedSquare(square);
      }
    } else {
      // Second click - attempt to move
      const sourceSquare = selectedSquare;
      const targetSquare = square;

      // Clear selection regardless of move success
      setSelectedSquare(null);

      // If clicking the same square, just deselect
      if (sourceSquare === targetSquare) {
        return;
      }

      attemptMove(sourceSquare, targetSquare);
    }
  };

  const handlePieceDrop = ({ sourceSquare, targetSquare }: PieceDropHandlerArgs) => {
    if (!targetSquare) {
      return false;
    }

    return attemptMove(sourceSquare, targetSquare);
  };

  const handlePromotionSelect = (promotionPiece: 'q' | 'r' | 'b' | 'n') => {
    if (!pendingPromotion) return;

    const { sourceSquare, targetSquare } = pendingPromotion;
    const move = handlePuzzleMove(sourceSquare, targetSquare, promotionPiece);

    setPendingPromotion(null);

    if (move) {
      handleMoveComplete();
    }
  };

  const handleMoveComplete = () => {
    arrows.clearArrows();
  };

  const lastMove = chessGame.getLastMove();
  const sourceSquare = lastMove ? lastMove.from : null;
  const targetSquare = lastMove ? lastMove.to : null;

  return (
    <>
      <Header
        theme={theme.theme}
        onToggleTheme={theme.toggleTheme}
      />

      {drillState.loading && <LoadingOverlay />}

      {pendingPromotion && (
        <PromotionDialog
          color={pendingPromotion.pieceColor}
          onSelect={handlePromotionSelect}
          theme={theme.theme}
        />
      )}

      <div
        data-testid="app-container"
        className="app-container"
        style={{
          backgroundColor: theme.currentThemeColors.pageBackgroundColor,
          color: theme.currentThemeColors.pageForegroundColor,
        }}
      >

        <DrillLayout
          theme={theme.theme}
          isDrillActive={drillState.active && !drillState.loading}
          onTimeUp={handleDrillTimeUp}
          chessPosition={chessGame.chessPosition}
          arrows={arrows.arrows}
          lightSquareColor={theme.currentThemeColors.lightSquareColor}
          darkSquareColor={theme.currentThemeColors.darkSquareColor}
          sourceSquare={sourceSquare}
          targetSquare={targetSquare}
          selectedSquare={selectedSquare}
          isAtFinalPosition={chessGame.isAtFinalPosition}
          onPieceDrop={handlePieceDrop}
          onSquareClick={handleSquareClick}
          onSquareRightClick={handleSquareRightClick}
          onMoveComplete={handleMoveComplete}
          boardOrientation={drillState.active ? (drillState.playerColor === 'white' ? 'black' : 'white') : 'white'}
          showBeginButton={!drillState.active && !drillState.loading}
          onBeginClick={handleDrillStart}
          puzzleAttempts={puzzleAttempts}
          rating={rating}
          lastPuzzleResult={lastPuzzleResult}
        />
      </div>
    </>
  );
};

export default App;
