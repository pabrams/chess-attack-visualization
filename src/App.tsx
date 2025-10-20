import { useState } from 'react';
import { PieceDropHandlerArgs, SquareHandlerArgs } from 'react-chessboard';
import { useChessGame } from './hooks/useChessGame';
import { useTheme } from './hooks/useTheme';
import { useArrows } from './hooks/useArrows';
import { useRating } from './hooks/useRating';
import { useDrill } from './hooks/useDrill';
import { ChessBoard } from './components/ChessBoard';
import Header from './components/Header';
import { DrillTimer } from './components/DrillTimer';
import { DrillScoreboard } from './components/DrillScoreboard';
import { PuzzleInfo } from './components/PuzzleInfo';
import { DrillLayout } from './components/DrillLayout';
import { BeginButton } from './components/BeginButton';
import { LoadingOverlay } from './components/LoadingOverlay';
import { TimerContainer } from './components/TimerContainer';
import { PromotionDialog } from './components/PromotionDialog';
import './App.css';

const App = () => {
  const chessGame = useChessGame();
  const theme = useTheme();
  const arrows = useArrows();
  const { rating, addPoints } = useRating();

  const { drillState, handleDrillStart, handleDrillTimeUp, handlePuzzleMove } = useDrill({
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
          timer={
            <TimerContainer>
              <DrillTimer onTimeUp={handleDrillTimeUp} theme={theme.theme} isActive={drillState.active && !drillState.loading} />
            </TimerContainer>
          }
          board={
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <ChessBoard
                theme={theme.theme}
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
                isPuzzleAutoPlaying={false}
                boardOrientation={drillState.active ? (drillState.playerColor === 'white' ? 'black' : 'white') : 'white'}
              />


              {!drillState.active && !drillState.loading && (
                <BeginButton onClick={handleDrillStart} />
              )}
            </div>
          }
          puzzleInfo={
            <PuzzleInfo
              rating={drillState.currentPuzzle?.puzzle.rating}
              themes={drillState.currentPuzzle?.puzzle.themes}
              gameUrl={(drillState.currentPuzzle as any)?._gameUrl}
              theme={theme.theme}
            />
          }
          scoreboard={
            <DrillScoreboard results={drillState.results} theme={theme.theme} rating={rating} />
          }
        />
      </div>
    </>
  );
};

export default App;
