import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render } from '@testing-library/react';
import { useCallback } from 'react';
import { Square } from 'chess.js';
import { useChessGame } from '../src/hooks/useChessGame';
import { useRating, RatingStorageMode } from '../src/hooks/useRating';
import { usePuzzleResults } from '../src/hooks/usePuzzleResults';
import { useDrill } from '../src/hooks/useDrill';
import puzzles from './puzzles.json';

let api: any = {};

interface HarnessProps {
  mode?: RatingStorageMode;
  token?: string | null;
}

const Harness = ({ mode = 'local', token = null }: HarnessProps) => {
  const chessGame = useChessGame();
  const { rating, applyResult, usingLichess } = useRating({
    mode, token, lichessPuzzleRating: null,
  });
  const { attempts, recordResult } = usePuzzleResults({ applyResult });
  const noop = useCallback(() => {}, []);
  const { drillState, handlePuzzleMove } = useDrill({
    chessGame, token, onPuzzleResult: recordResult,
    triggerPuzzleOutcomeVisuals: noop, onLoadNext: noop,
  });
  api = { attempts, handlePuzzleMove, drillState, rating, usingLichess };
  return null;
};

const settle = async (ms = 1500) => {
  await act(async () => { await vi.advanceTimersByTimeAsync(ms); });
};

/** Plays the solution to the puzzle currently on the board. */
const solveCurrent = async () => {
  const puzzle = api.drillState.currentPuzzle;
  const sol = puzzle.puzzle.solution[0];
  await act(async () => {
    api.handlePuzzleMove(sol.slice(0, 2) as Square, sol.slice(2, 4) as Square, sol[4]);
  });
  await settle();
};

const mockBatch = (body: any = { puzzles }) =>
  vi.fn(async () => ({ ok: true, status: 200, json: async () => body })) as any;

describe('drill', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => { vi.useRealTimers(); });

  it('records every attempt, including past the size of one fetched batch', async () => {
    globalThis.fetch = mockBatch();
    render(<Harness />);
    await settle(10);

    for (let i = 0; i < 60; i++) {
      expect(api.drillState.currentPuzzle, `no puzzle at iteration ${i}`).toBeTruthy();
      await solveCurrent();
      expect(api.attempts.length).toBe(i + 1);
    }

    expect(JSON.parse(localStorage.getItem('puzzleAttempts')!)).toHaveLength(60);
  });

  it('only ever serves mate-in-1 puzzles', async () => {
    const contaminated = {
      puzzles: [
        { ...puzzles[0], puzzle: { ...puzzles[0].puzzle, id: 'bad1', themes: ['fork'] } },
        { ...puzzles[1], puzzle: { ...puzzles[1].puzzle, id: 'bad2', themes: ['mateIn1'], solution: ['e2e4', 'e7e5'] } },
        puzzles[2],
      ],
    };
    globalThis.fetch = mockBatch(contaminated);
    render(<Harness />);
    await settle(10);

    expect(api.drillState.puzzles.map((p: any) => p.puzzle.id)).toEqual([puzzles[2].puzzle.id]);
  });

  it('drops non-mate-in-1 puzzles cached by an earlier build', async () => {
    localStorage.setItem('monkeydrillState', JSON.stringify({
      puzzles: [{ ...puzzles[0], puzzle: { ...puzzles[0].puzzle, themes: ['fork'] } }],
    }));
    globalThis.fetch = mockBatch();
    render(<Harness />);
    await settle(10);

    expect(api.drillState.puzzles.every((p: any) => p.puzzle.themes.includes('mateIn1'))).toBe(true);
  });

  it('retries instead of stalling when Lichess rate-limits the batch request', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 429, json: async () => ({}) })
      .mockResolvedValue({ ok: true, status: 200, json: async () => ({ puzzles }) });
    globalThis.fetch = fetchMock as any;

    render(<Harness />);
    await settle(10);
    expect(api.drillState.currentPuzzle).toBeUndefined();

    await settle(70_000);
    expect(api.drillState.currentPuzzle).toBeTruthy();
    expect(fetchMock.mock.calls.length).toBeGreaterThan(1);
  });

  it('sends the auth token so Lichess serves unseen puzzles', async () => {
    const fetchMock = mockBatch();
    globalThis.fetch = fetchMock;
    render(<Harness token="tok123" />);
    await settle(10);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/puzzle/batch/mateIn1');
    expect((init.headers as any).Authorization).toBe('Bearer tok123');
  });

  it('falls back to anonymous puzzles when the token lacks the puzzle scopes', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) })
      .mockResolvedValue({ ok: true, status: 200, json: async () => ({ puzzles }) });
    globalThis.fetch = fetchMock as any;

    render(<Harness token="stale" />);
    await settle(10);

    expect(api.drillState.currentPuzzle).toBeTruthy();
    expect((fetchMock.mock.calls[1][1].headers as any).Authorization).toBeUndefined();
  });
});

describe('rating storage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => { vi.useRealTimers(); });

  it('keeps the rating in localStorage when set to local', async () => {
    globalThis.fetch = mockBatch();
    render(<Harness mode="local" token="tok" />);
    await settle(10);
    await solveCurrent();

    expect(api.usingLichess).toBe(false);
    expect(Number(JSON.parse(localStorage.getItem('monkeyDrill_userRating')!))).toBeGreaterThan(1);
    // No POST was made to Lichess.
    expect((globalThis.fetch as any).mock.calls.every((c: any[]) => !c[1]?.method)).toBe(true);
  });

  it('reports solves to Lichess and shows the rating it returns', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: any) => {
      if (init?.method === 'POST') {
        return {
          ok: true, status: 200,
          json: async () => ({
            puzzles: [],
            glicko: { rating: 1543.7, deviation: 60 },
            rounds: [{ id: JSON.parse(init.body).solutions[0].id, win: true, ratingDiff: 7 }],
          }),
        };
      }
      return { ok: true, status: 200, json: async () => ({ puzzles }) };
    });
    globalThis.fetch = fetchMock as any;

    render(<Harness mode="lichess" token="tok" />);
    await settle(10);

    const solvedId = api.drillState.currentPuzzle.puzzle.id;
    await solveCurrent();

    const post = fetchMock.mock.calls.find(c => (c[1] as any)?.method === 'POST')!;
    expect(post[0]).toContain('/api/puzzle/batch/mateIn1');
    expect(JSON.parse((post[1] as any).body)).toEqual({
      solutions: [{ id: solvedId, win: true, rated: true }],
    });

    expect(api.usingLichess).toBe(true);
    expect(api.rating).toBe(1544);
    expect(api.attempts[0].ratingChange).toBe(7);
    expect(api.attempts[0].syncedToLichess).toBe(true);
  });

  it('still records the attempt when the Lichess sync fails', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: any) => {
      if (init?.method === 'POST') throw new Error('offline');
      return { ok: true, status: 200, json: async () => ({ puzzles }) };
    });
    globalThis.fetch = fetchMock as any;

    render(<Harness mode="lichess" token="tok" />);
    await settle(10);
    await solveCurrent();

    expect(api.attempts).toHaveLength(1);
    expect(api.attempts[0].syncedToLichess).toBe(false);
    expect(api.attempts[0].ratingChange).not.toBe(0);
  });
});
