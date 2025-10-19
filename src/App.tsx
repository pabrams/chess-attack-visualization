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
import './App.css';

const App = () => {
  const chessGame = useChessGame();
  const theme = useTheme();
  const arrows = useArrows();
  const { rating, incrementRating, decrementRating } = useRating();

  const { drillState, handleDrillStart, handleDrillTimeUp } = useDrill({
    chessGame,
    incrementRating,
    decrementRating,
  });

  const handleSquareRightClick = ({ square }: SquareHandlerArgs) => {
    arrows.showAttackersForSquare(
      square,
      chessGame.getAttackers,
      theme.currentThemeColors.whiteArrowColor,
      theme.currentThemeColors.blackArrowColor
    );
  };

  const handlePieceDrop = ({ sourceSquare, targetSquare }: PieceDropHandlerArgs) => {
    if (!targetSquare) {
      return false;
    }
    return chessGame.makeMove(sourceSquare, targetSquare);
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

      <div
        data-testid="app-container"
        className="app-container"
        style={{
          backgroundColor: theme.currentThemeColors.pageBackgroundColor,
          color: theme.currentThemeColors.pageForegroundColor,
        }}
      >
        <div data-testid="arrows-list" className="arrows-list">
          {arrows.arrows.map(({ startSquare, endSquare, color }, i) => (
            <div key={i}>
              start: {startSquare}, end: {endSquare}, color: {color}
            </div>
          ))}
        </div>

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
                isAtFinalPosition={chessGame.isAtFinalPosition}
                onPieceDrop={handlePieceDrop}
                onSquareRightClick={handleSquareRightClick}
                onMoveComplete={handleMoveComplete}
                isPuzzleAutoPlaying={chessGame.puzzleState.active && !chessGame.puzzleState.isPlayerTurn}
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
