import { useState, useCallback, useEffect, useRef } from 'react';
import { LichessPuzzle } from '../types/lichess';
import { DrillResult } from '../components/DrillScoreboard';

interface DrillState {
  active: boolean;
  loading: boolean;
  results: DrillResult[];
  puzzleQueue: LichessPuzzle[];
  playerColor: 'white' | 'black';
  currentPuzzle: (LichessPuzzle & { _gameUrl?: string }) | null;
}

interface UseDrillProps {
  chessGame: any; // TODO: type this properly
  incrementRating: () => void;
  decrementRating: () => void;
}

export const useDrill = ({ chessGame, incrementRating, decrementRating }: UseDrillProps) => {
  const [drillState, setDrillState] = useState<DrillState>({
    active: false,
    loading: false,
    results: [],
    puzzleQueue: [],
    playerColor: 'white',
    currentPuzzle: null,
  });

  const loadNextDrillPuzzle = useCallback(() => {
    setDrillState(prev => {
      if (prev.puzzleQueue.length === 0) {
        console.error('Puzzle queue is empty!');
        return prev;
      }

      const [puzzle, ...remainingQueue] = prev.puzzleQueue;

      chessGame.exitPuzzleMode();

      // Load from FEN and make the setup move manually to avoid state sync issues
      import('chess.js').then(({ Chess }) => {
        const setupMove = (puzzle as any)._setupMove;
        const fen = (puzzle as any)._fen;

        const tempChess = new Chess(fen);
        const from = setupMove.substring(0, 2);
        const to = setupMove.substring(2, 4);
        const promotion = setupMove.length > 4 ? setupMove.substring(4) : undefined;

        const move = tempChess.move({ from, to, promotion: promotion as any });

        if (move) {
          const pgn = tempChess.pgn();
          const success = chessGame.loadPgn(pgn);

          if (success) {
            chessGame.startPuzzleMode(puzzle.puzzle.solution, () => {
              // On wrong move: record failure and load next puzzle
              const timeMs = Date.now() - (chessGame.puzzleState.puzzleStartTime || Date.now());
              decrementRating();
              setDrillState(prev => ({
                ...prev,
                results: [...prev.results, { success: false, timeMs }],
              }));
              loadNextDrillPuzzle();
            });
          }
        }
      });
   
      return {
        ...prev,
        puzzleQueue: remainingQueue,
        currentPuzzle: puzzle as any,
      };
    });
  }, [chessGame, decrementRating]);

  const handleDrillStart = async () => {
    // Randomly select white or black
    const playerColor: 'white' | 'black' = Math.random() < 0.5 ? 'white' : 'black';

    setDrillState({
      active: true,
      loading: true,
      results: [],
      puzzleQueue: [],
      playerColor,
      currentPuzzle: null,
    });

    try {
      const puzzleFile = playerColor === 'white'
        ? '/visualize-chessboard-territory/lichess_db_puzzle-w-one-move-neophyte.json'
        : '/visualize-chessboard-territory/lichess_db_puzzle-b-one-move-neophyte.json';
      console.log(`Loading ${playerColor} puzzles from ${puzzleFile}...`);
      const response = await fetch(puzzleFile);
      const data = await response.json();

      const shuffled = data.puzzles.sort(() => Math.random() - 0.5).slice(0, 200);

      // Convert to LichessPuzzle format
      const puzzles = shuffled.map((p: any) => ({
        game: {
          pgn: '',
          id: p.gameUrl.split('/')[3] || p.id,
        },
        puzzle: {
          id: p.id,
          initialPly: 0,
          plays: 0,
          rating: p.rating,
          solution: [p.solution], // Single move solution
          themes: p.themes,
        },
        _fen: p.fen,
        _setupMove: p.setupMove,
        _gameUrl: p.gameUrl,
      }));

      setDrillState(prev => ({
        ...prev,
        loading: false,
        puzzleQueue: puzzles,
      }));

      loadNextDrillPuzzle();
    } catch (error) {
      console.error('Error loading puzzles:', error);
      setDrillState(prev => ({
        ...prev,
        loading: false,
        active: false,
      }));
    }
  };

  const handleDrillTimeUp = useCallback(() => {
    // Save results to localStorage
    const drillResults = {
      timestamp: Date.now(),
      results: drillState.results,
    };
    const existingResults = JSON.parse(localStorage.getItem('drillResults') || '[]');
    localStorage.setItem('drillResults', JSON.stringify([...existingResults, drillResults]));

    // End drill mode
    setDrillState({
      active: false,
      loading: false,
      results: [],
      puzzleQueue: [],
      playerColor: 'white',
      currentPuzzle: null,
    });
    chessGame.exitPuzzleMode();
  }, [drillState.results, chessGame]);

  // Watch for puzzle completion in drill mode
  const hasRecordedRef = useRef(false);

  useEffect(() => {
    if (drillState.active && chessGame.puzzleState.completed && !hasRecordedRef.current) {
      hasRecordedRef.current = true;

      // Record success and load next puzzle
      const timeMs = Date.now() - (chessGame.puzzleState.puzzleStartTime || Date.now());
      incrementRating();
      setDrillState(prev => ({
        ...prev,
        results: [...prev.results, { success: true, timeMs }],
      }));

      hasRecordedRef.current = false;
      loadNextDrillPuzzle();
    }
  }, [chessGame.puzzleState.completed, drillState.active, loadNextDrillPuzzle, incrementRating]);

  return {
    drillState,
    handleDrillStart,
    handleDrillTimeUp,
  };
};
