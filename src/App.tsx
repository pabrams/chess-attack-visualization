import { useState } from 'react';
import { PieceDropHandlerArgs, SquareHandlerArgs } from 'react-chessboard';
import { Color } from 'chess.js';
import { useChessGame } from './hooks/useChessGame';
import { useThemeContext } from './contexts/ThemeContext';
import { useArrows } from './hooks/useArrows';
import { useRating } from './hooks/useRating';
import { useDrill } from './hooks/useDrill';
import { isBackRank, getBoardOrientation } from './utils/chessPieceUtils';
import Header from './components/Header';
import { Layout } from './components/Layout';
import { LoadingOverlay } from './components/LoadingOverlay';
import { PromotionDialog } from './components/PromotionDialog';
import './App.css';

const App = () => {
  const chessGame = useChessGame();
  const { theme, currentThemeColors, toggleTheme } = useThemeContext();
  const arrows = useArrows();
  const { rating, addPoints } = useRating();

  const { drillState, puzzleAttempts, lastPuzzleResult, handlePuzzleMove } = useDrill({
    chessGame,
    rating,
    addPoints,
  });

  const [pendingPromotion, setPendingPromotion] = useState<{
    sourceSquare: string;
    targetSquare: string;
    pieceColor: Color;
  } | null>(null);

  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const legalMoves = selectedSquare ? chessGame.getLegalMoves(selectedSquare) : [];

  const handleSquareRightClick = ({ square }: SquareHandlerArgs) => {
    arrows.showAttackersForSquare(
      square,
      chessGame.getAttackers,
      currentThemeColors.whiteArrowColor,
      currentThemeColors.blackArrowColor
    );
  };

  const isPawnPromotion = (sourceSquare: string, targetSquare: string): boolean => {
    const piece = chessGame.getPieceAt(sourceSquare);
    if (!piece) return false;

    const isPawn = piece.type === 'p';
    return isPawn && isBackRank(targetSquare);
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
    if (drillState.active) {
      arrows.showCheckmaters(chessGame, currentThemeColors);
      setTimeout(() => {
        arrows.clearArrows();
      }, 5000);
    } else {
      arrows.clearArrows();
    }
  };

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
          chessPosition={chessGame.chessPosition}
          arrows={arrows.arrows}
          sourceSquare={sourceSquare}
          targetSquare={targetSquare}
          selectedSquare={selectedSquare}
          legalMoves={legalMoves}
          onPieceDrop={handlePieceDrop}
          onSquareClick={handleSquareClick}
          onSquareRightClick={handleSquareRightClick}
          boardOrientation={getBoardOrientation(drillState.active, drillState.playerColor)}
          puzzleAttempts={puzzleAttempts}
          rating={rating}
          lastPuzzleResult={lastPuzzleResult}
          playerColor={drillState.playerColor}
        />
      </div>
    </>
  );
};

export default App;
