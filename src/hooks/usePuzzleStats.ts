import { useMemo, useState } from 'react';
import { PuzzleAttempt } from '../types/drill';

const LAZY_RECORD_COUNT = 24;

export const usePuzzleStats = (attempts: PuzzleAttempt[]) => {
  const sortedAttempts = useMemo(
    () => [...attempts].sort((a, b) => b.timestamp - a.timestamp),
    [attempts]
  );

  const total = sortedAttempts.length;
  const [hiddenOlderCount, setHiddenOlderCount] = useState(() =>
    Math.max(0, attempts.length - LAZY_RECORD_COUNT)
  );

  const displayCount = Math.min(total, Math.max(LAZY_RECORD_COUNT, total - hiddenOlderCount));

  const handleLoadMore = () => {
    setHiddenOlderCount(prev => Math.max(0, prev - LAZY_RECORD_COUNT));
  };

  const visibleAttempts = sortedAttempts.slice(0, displayCount);

  const attemptedCount = total;
  const succeededCount = attempts.filter(a => a.success).length;
  const successRatio = attemptedCount > 0 ? (succeededCount / attemptedCount) : 0;

  return {
    sortedAttempts,
    visibleAttempts,
    displayCount,
    attemptedCount,
    succeededCount,
    successRatio,
    handleLoadMore,
  };
};
