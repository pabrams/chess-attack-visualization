import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useChessGame } from '../../src/hooks/useChessGame';

describe('useChessGame', () => {
  it('should initialize with starting position', () => {
    const { result } = renderHook(() => useChessGame());

    expect(result.current.chessPosition).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    expect(result.current.getLastMove()).toBeNull();
  });

  it('should make a valid move', () => {
    const { result } = renderHook(() => useChessGame());

    act(() => {
      const move = result.current.makeMove('e2', 'e4');
      expect(move).toBeTruthy();
      expect(move?.from).toBe('e2');
      expect(move?.to).toBe('e4');
    });

    expect(result.current.chessPosition).toBe('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1');
    expect(result.current.getLastMove()?.from).toBe('e2');
    expect(result.current.getLastMove()?.to).toBe('e4');
  });

  it('should reject invalid moves', () => {
    const { result } = renderHook(() => useChessGame());

    act(() => {
      const move = result.current.makeMove('e2', 'e5');
      expect(move).toBeNull();
    });

    expect(result.current.chessPosition).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    expect(result.current.getLastMove()).toBeNull();
  });

  it('should load a PGN', () => {
    const { result } = renderHook(() => useChessGame());

    act(() => {
      const success = result.current.loadPgn('1. e4 e5 2. Nf3');
      expect(success).toBe(true);
    });

    expect(result.current.getLastMove()?.san).toBe('Nf3');
  });

  it('should undo a move', () => {
    const { result } = renderHook(() => useChessGame());

    // Make a move
    act(() => {
      result.current.makeMove('e2', 'e4');
    });

    expect(result.current.chessPosition).toBe('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1');

    // Undo it
    act(() => {
      const success = result.current.undoLastMove();
      expect(success).toBe(true);
    });

    expect(result.current.chessPosition).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    expect(result.current.getLastMove()).toBeNull();
  });
});
