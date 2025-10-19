
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import '@testing-library/jest-dom';
import App from '../src/App';
let moveToSimulate: { sourceSquare: string; targetSquare: string; piece: { pieceType: string; isSparePiece: boolean } } | null = null;

vi.mock('react-chessboard', () => ({
  Chessboard: ({ options = {} }: any) => {
    const { onSquareRightClick } = options;

    return (
      <div
        data-testid="chessboard"
        data-position={options.position ?? ''}
        onClick={() => {
          if (options.onPieceDrop && moveToSimulate) {
            options.onPieceDrop(moveToSimulate);
          }
        }}
      >
        {/* Render squares with data-square attributes for testing */}
        <div 
          data-square="e2" 
          data-column="e" 
          data-row="2" 
          style={{ width: '50px', height: '50px' }}
          onContextMenu={(e) => {
            e.preventDefault();
            if (onSquareRightClick) {
              onSquareRightClick({ square: 'e2', piece: { pieceType: 'p' } });
            }
          }}
        >
          e2 square
        </div>
        <div>Mocked Chessboard</div>
      </div>
    );
  },
}));
describe('App', () => {
  beforeEach(() => {
    moveToSimulate = null;
  });

  it('renders chessboard with initial position', () => {
    render(<App />);
    const chessboard = screen.getByTestId('chessboard');
    expect(chessboard).toBeInTheDocument();
    expect(chessboard).toHaveAttribute(
      'data-position',
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    );
  });


  it('updates chess position when valid move is made', () => {
    render(<App />);
    const chessboard = screen.getByTestId('chessboard');
    const initialPosition = chessboard.getAttribute('data-position');

    moveToSimulate = {
      sourceSquare: 'e2',
      targetSquare: 'e4',
      piece: { pieceType: 'pawn', isSparePiece: false },
    };

    fireEvent.click(chessboard);
    const newPosition = chessboard.getAttribute('data-position');
    expect(newPosition).not.toBe(initialPosition);
  });
});

describe('Board Position Tests', () => {
  const testBoardPosition = (
    description: string,
    expectedFen: string,
    movesToMake: Array<{ sourceSquare: string; targetSquare: string; piece: { pieceType: string; isSparePiece: boolean } }> = []
  ) => {
    it(description, () => {
      render(<App />);
      const chessboard = screen.getByTestId('chessboard');

      movesToMake.forEach(move => {
        moveToSimulate = move;
        fireEvent.click(chessboard);
      });

      expect(chessboard).toHaveAttribute('data-position', expectedFen);
    });
  };

  testBoardPosition(
    'confirms starting position matches starting FEN',
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  );

  testBoardPosition(
    'confirms position after 1.e4 matches expected FEN',
    'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    [
      {
        sourceSquare: 'e2',
        targetSquare: 'e4',
        piece: { pieceType: 'pawn', isSparePiece: false }
      }
    ]
  );

  testBoardPosition(
    'confirms position after 1.e4 d5 matches expected FEN',
    'rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
    [
      {
        sourceSquare: 'e2',
        targetSquare: 'e4',
        piece: { pieceType: 'pawn', isSparePiece: false }
      },
      {
        sourceSquare: 'd7',
        targetSquare: 'd5',
        piece: { pieceType: 'pawn', isSparePiece: false }
      }
    ]
  );

  testBoardPosition(
    'confirms position after 1.Nf3 matches expected FEN',
    'rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R b KQkq - 1 1',
    [
      {
        sourceSquare: 'g1',
        targetSquare: 'f3',
        piece: { pieceType: 'knight', isSparePiece: false }
      }
    ]
  );
});
