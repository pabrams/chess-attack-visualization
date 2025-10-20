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

  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);

  const handleSquareRightClick = ({ square }: SquareHandlerArgs) => {
    arrows.showAttackersForSquare(
      square,
      chessGame.getAttackers,
      theme.currentThemeColors.whiteArrowColor,
      theme.currentThemeColors.blackArrowColor
    );
  };

  const isPawnPromotion = (sourceSquare: string, targetSquare: string): boolean => {
    const piece = chessGame.getPieceAt(sourceSquare);
    if (!piece) return false;

    const isPawn = piece.type === 'p';
    const isBackRank = targetSquare[1] === '8' || targetSquare[1] === '1';

    return isPawn && isBackRank;
  };

  const attemptMove = (sourceSquare: string, targetSquare: string): boolean => {
    if (isPawnPromotion(sourceSquare, targetSquare)) {
      const piece = chessGame.getPieceAt(sourceSquare)!;
      setPendingPromotion({ sourceSquare, targetSquare, pieceColor: piece.color });
      return false;
    }

    const move = handlePuzzleMove(sourceSquare, targetSquare);
    if (move) {
      handleMoveComplete();
      return true;
    }
    return false;
  };

  const selectPieceForMove = (square: string) => {
    const piece = chessGame.getPieceAt(square);
    if (piece) {
      setSelectedSquare(square);
    }
  };

  const executeSelectedMove = (targetSquare: string) => {
    if (!selectedSquare) return;

    const sourceSquare = selectedSquare;
    setSelectedSquare(null);

    if (sourceSquare === targetSquare) return;

    attemptMove(sourceSquare, targetSquare);
  };

  const handleSquareClick = ({ square }: SquareHandlerArgs) => {
    if (!selectedSquare) {
      selectPieceForMove(square);
    } else {
      executeSelectedMove(square);
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
