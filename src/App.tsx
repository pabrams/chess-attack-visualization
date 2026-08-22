import { useCallback, useEffect, useState, useContext } from 'react';
import { Square } from 'chess.js';
import { SquareHandlerArgs } from 'react-chessboard';
import { useChessGame } from './hooks/useChessGame';
import { ThemeContext } from './hooks/useTheme';
import { useArrows } from './hooks/useArrows';
import { useRating, RatingStorageMode, RATING_MODE_STORAGE_KEY } from './hooks/useRating';
import { useDrill } from './hooks/useDrill';
import { useMoveHandler } from './hooks/useMoveHandler';
import { usePuzzleResults } from './hooks/usePuzzleResults';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useLichessAuth } from './hooks/useLichessAuth';
import {
  DEFAULT_NEXT_PUZZLE_DELAY_MS,
  DEFAULT_PUZZLE_DIFFICULTY,
  NEXT_PUZZLE_DELAY_STORAGE_KEY,
  PUZZLE_DIFFICULTY_STORAGE_KEY,
  PuzzleDifficulty,
} from './types/settings';
import Header from './components/Header';
import { Layout } from './components/Layout';
import { PromotionDialog } from './components/PromotionDialog';
import './App.css';

const App = () => {
  const chessGame = useChessGame();
  const { theme, currentThemeColors, toggleTheme } = useContext(ThemeContext)!;
  const { token, user, lichessPuzzleRating, scopeError, justLoggedIn, reportScopeError } = useLichessAuth();
  const [attackerDisplay, setAttackerDisplay] = useState<{ square: Square; whiteCount: number; blackCount: number } | null>(null);

  const [ratingStorage, setRatingStorage] = useLocalStorage<RatingStorageMode>(
    RATING_MODE_STORAGE_KEY,
    'local'
  );

  const [difficulty, setDifficulty] = useLocalStorage<PuzzleDifficulty>(
    PUZZLE_DIFFICULTY_STORAGE_KEY,
    DEFAULT_PUZZLE_DIFFICULTY
  );

  const [nextPuzzleDelayMs, setNextPuzzleDelayMs] = useLocalStorage<number | null>(
    NEXT_PUZZLE_DELAY_STORAGE_KEY,
    DEFAULT_NEXT_PUZZLE_DELAY_MS
  );

  useEffect(function preferLichessRatingAfterLogin() {
    if (justLoggedIn) setRatingStorage('lichess');
  }, [justLoggedIn, setRatingStorage]);

  const { rating, usingLichess, syncError, applyResult } = useRating({
    mode: ratingStorage,
    token,
    lichessPuzzleRating,
    onScopeError: reportScopeError,
  });

  const { attempts, lastResult, recordResult } = usePuzzleResults({ applyResult });

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

  const showPuzzleOutcomeVisuals = useCallback(() => {
    arrows.showCheckmaters();
  }, [arrows]);

  const resetVisualsForNextPuzzle = useCallback(() => {
    arrows.clearArrows();
  }, [arrows]);

  const { drillState, handlePuzzleMove, loadNextPuzzle } = useDrill({
    chessGame,
    token,
    onPuzzleResult: recordResult,
    triggerPuzzleOutcomeVisuals: showPuzzleOutcomeVisuals,
    onLoadNext: resetVisualsForNextPuzzle,
    onScopeError: reportScopeError,
    difficulty,
    nextPuzzleDelayMs,
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
    onMoveComplete: showPuzzleOutcomeVisuals,
    fen: chessGame.fen,
  });

  const lastMove = chessGame.getLastMove();
  const sourceSquare = lastMove ? lastMove.from : null;
  const targetSquare = lastMove ? lastMove.to : null;

  const ratingNotice = scopeError
    ? 'Your Lichess login predates the puzzle permissions this app now needs. Log out and back in to update permissions.'
    : syncError;

  return (
    <>
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        ratingStorage={ratingStorage}
        onSetRatingStorage={setRatingStorage}
        difficulty={difficulty}
        onSetDifficulty={setDifficulty}
        nextPuzzleDelayMs={nextPuzzleDelayMs}
        onSetNextPuzzleDelayMs={setNextPuzzleDelayMs}
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
          onLoadFen={chessGame.loadFen}
          ratingSourceLabel={usingLichess ? `Lichess (${user?.username ?? 'synced'})` : 'This browser'}
          ratingNotice={ratingNotice}
          isAwaitingNextPuzzle={drillState.isAwaitingNext}
          onLoadNextPuzzle={loadNextPuzzle}
        />
      </div>
    </>
  );
};

export default App;
