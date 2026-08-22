import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InfoPanelLayout } from '../src/components/InfoPanelLayout';
import { ThemeProvider } from '../src/hooks/useTheme';
import { PuzzleAttempt } from '../src/types/drill';

/** `n` attempts, newest first, matching how usePuzzleResults prepends them. */
const mkAttempts = (n: number): PuzzleAttempt[] =>
  Array.from({ length: n }, (_, i) => ({
    attemptId: `a${n - i}`,
    puzzleId: `p${n - i}`,
    puzzleRating: 800,
    ratingChange: 1,
    timestamp: 1_000_000 + (n - i),
    success: true,
  }));

const panel = (attempts: PuzzleAttempt[]) => (
  <ThemeProvider>
    <InfoPanelLayout
      attempts={attempts}
      rating={1234}
      lastResult={null}
      userColor="white"
      onLoadFen={() => true}
      ratingSourceLabel="This browser"
      ratingNotice={null}
    />
  </ThemeProvider>
);

const rowCount = () => document.querySelectorAll('tbody tr').length;
const newestPuzzleId = () => document.querySelector('tbody tr a')?.textContent;

describe('puzzle history panel', () => {
  it('keeps showing newly recorded attempts past the initial page size', () => {
    // Regression: the visible row count used to freeze at 24, so the history
    // looked like it had stopped recording once you got past that many puzzles.
    const { rerender } = render(panel(mkAttempts(1)));

    for (const n of [10, 24, 25, 40, 120]) {
      rerender(panel(mkAttempts(n)));
      expect(rowCount()).toBe(n);
      expect(newestPuzzleId()).toBe(`p${n}`);
    }

    expect(screen.getByText('1234')).toBeInTheDocument();
  });

  it('collapses an existing long history on mount and expands on demand', () => {
    render(panel(mkAttempts(100)));

    expect(rowCount()).toBe(24);
    const more = screen.getByRole('button', { name: /show older attempts/i });
    expect(more).toHaveTextContent('(24 of 100)');

    fireEvent.click(more);
    expect(rowCount()).toBe(48);
  });

  it('keeps new attempts visible after older ones have been expanded', () => {
    const { rerender } = render(panel(mkAttempts(100)));
    fireEvent.click(screen.getByRole('button', { name: /show older attempts/i }));
    expect(rowCount()).toBe(48);

    rerender(panel(mkAttempts(105)));
    expect(rowCount()).toBe(53);
    expect(newestPuzzleId()).toBe('p105');
  });

  it('reports the full attempt total regardless of how many rows are shown', () => {
    const { container } = render(panel(mkAttempts(100)));
    expect(rowCount()).toBe(24);
    // "Success Rate" reads 100 / 100 even though only 24 rows are rendered.
    expect(container.querySelector('[class*="puzzleStatsValue"]')?.textContent)
      .toContain('100');
  });

  it('shows where the rating is stored', () => {
    render(panel(mkAttempts(1)));
    expect(screen.getByText(/saved to This browser/i)).toBeInTheDocument();
  });
});
