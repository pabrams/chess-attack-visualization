import React, { useState, useEffect, useRef } from 'react';
import { PuzzleAttempt } from '../types/drill';
import { getLevelFromRating, formatLevelName } from '../utils/ratingCalculation';
import styles from './InfoPanelLayout.module.css';

interface InfoPanelLayoutProps {
  attempts: PuzzleAttempt[];
  theme: 'dark' | 'light';
  rating: number;
  lastResult: boolean | null;
  playerColor: 'white' | 'black';
  whiteArrowColor: string;
  blackArrowColor: string;
}

export const InfoPanelLayout: React.FC<InfoPanelLayoutProps> = ({ attempts, theme, rating, lastResult, playerColor, whiteArrowColor, blackArrowColor }) => {
  const level = getLevelFromRating(rating);
  const formattedLevel = formatLevelName(level);
  const sortedAttempts = [...attempts].sort((a, b) => b.timestamp - a.timestamp);

  const lazyRecordCount = 24;
  
  const [displayCount, setDisplayCount] = useState(lazyRecordCount);
  
  useEffect(() => {
    if (sortedAttempts.length < displayCount) {
      setDisplayCount(lazyRecordCount);
    }
  }, [sortedAttempts.length, displayCount]);
  
  const handleLoadMore = () => {
    setDisplayCount(prev => Math.min(prev + lazyRecordCount, sortedAttempts.length));
  };
  
  const visibleAttempts = sortedAttempts.slice(0, displayCount);

  const attemptedCount = attempts.length;
  const succeededCount = attempts.filter(a => a.success).length;
  const successRatio = attemptedCount > 0 ? (succeededCount / attemptedCount) : 0;

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const formatFullTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const constructPuzzleUrl = (puzzleId: string) => {
    return `https://lichess.org/training/${puzzleId}`;
  };

  return (
    <div className={styles.wrapper}>
      <fieldset className={styles.playerInfoContainer}>
        <legend>Monkey Drill Info</legend>
        <div className={styles.moveInstruction}>
          Move the <span style={{ color: playerColor === 'white' ? blackArrowColor : whiteArrowColor, fontWeight: 'bold' }}>
            {playerColor === 'white' ? 'Black' : 'White'}
          </span> pieces
        </div>
        <div className={styles.playerInfoContent}>
          <div className={styles.ratingSection}>
            <span className={styles.ratingLabel}>Rating</span>
            <span className={`${styles.ratingValue} ${lastResult === true ? styles.ratingSuccess : lastResult === false ? styles.ratingFailure : ''}`}>{rating}</span>
          </div>
          <div className={styles.puzzleStats}>
            <span className={styles.puzzleStatsLabel}>Success Rate</span>
            <span className={styles.puzzleStatsValue}>
              <span className={styles.succeededCount}>{succeededCount}</span>
              <span className={styles.separator}>/</span>
              <span>{attemptedCount}</span>
              <span className={styles.percentage}> ({(successRatio * 100).toFixed(1)}%)</span>
            </span>
          </div>
        </div>
      </fieldset>

      <fieldset className={styles.historyContainer}>
        <legend>Puzzle History</legend>
        <div className={styles.tableWrapper}>
          <table className={`${styles.table} ${theme === 'light' ? styles.tableLight : ''}`}>
            <thead>
              <tr>
                <th></th>
                <th>Lichess ID</th>
                <th>Puzzle Rating</th>
                <th>Points Gained</th>
                <th>Date</th>
              </tr>
            </thead>
          <tbody>
            {visibleAttempts.map((attempt, index) => (
              <tr key={index} className={theme === 'dark' ? styles.darkRow : styles.lightRow}>
                <td className={styles.rowNumber}>{sortedAttempts.length - index}</td>
                <td>
                  <a
                    href={constructPuzzleUrl(attempt.puzzleId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.puzzleLink}
                  >
                    {attempt.puzzleId}
                  </a>
                </td>
                <td>{attempt.puzzleRating}</td>
                <td
                  className={attempt.ratingChange >= 0 ? styles.positiveChange : styles.negativeChange}
                >
                  {attempt.ratingChange >= 0 ? '+' : ''}{attempt.ratingChange.toFixed(1)}
                </td>
                <td title={formatFullTimestamp(attempt.timestamp)}>
                  {formatDate(attempt.timestamp)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sortedAttempts.length === 0 && (
          <div className={styles.emptyState}>
            No puzzle attempts yet
          </div>
        )}
        {displayCount < sortedAttempts.length && (
          <div className={styles.loadingMore} onClick={handleLoadMore}>
            Click to load more... ({displayCount} of {sortedAttempts.length})
          </div>
        )}
        </div>
      </fieldset>
    </div>
  );
};
