import { useState } from 'react';
import { PuzzleAttempt } from '../types/drill';

const LAZY_RECORD_COUNT = 24;

export const usePuzzleStats = (attempts: PuzzleAttempt[]) => {
  const sortedAttempts = [...attempts].sort((a, b) => b.timestamp - a.timestamp);

  const [displayCount, setDisplayCount] = useState(LAZY_RECORD_COUNT);
  const effectiveDisplayCount = sortedAttempts.length < displayCount ? LAZY_RECORD_COUNT : displayCount;

  const handleLoadMore = () => {
    setDisplayCount(prev => Math.min(prev + LAZY_RECORD_COUNT, sortedAttempts.length));
  };

  const visibleAttempts = sortedAttempts.slice(0, effectiveDisplayCount);

  const attemptedCount = attempts.length;
  const succeededCount = attempts.filter(a => a.success).length;
  const successRatio = attemptedCount > 0 ? (succeededCount / attemptedCount) : 0;

  return {
    sortedAttempts,
    visibleAttempts,
    displayCount: effectiveDisplayCount,
    attemptedCount,
    succeededCount,
    successRatio,
    handleLoadMore,
  };
};

