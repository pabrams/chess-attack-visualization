import React from 'react';
import { PuzzleAttempt } from '../types/drill';
import styles from './InfoPanelLayout.module.css';

interface InfoPanelLayoutProps {
  attempts: PuzzleAttempt[];
  theme: 'dark' | 'light';
  rating: number;
  lastResult: 'success' | 'failure' | null;
}

export const InfoPanelLayout: React.FC<InfoPanelLayoutProps> = ({ attempts, theme, rating, lastResult }) => {
  const sortedAttempts = [...attempts].sort((a, b) => b.timestamp - a.timestamp);

  const attemptedCount = attempts.length;
  const succeededCount = attempts.filter(a => a.success).length;
  const successRatio = attemptedCount > 0 ? (succeededCount / attemptedCount) : 0;

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className={styles.wrapper}>
      <fieldset className={styles.playerInfoContainer}>
        <legend>Player Info</legend>
        <div className={styles.playerInfoContent}>
          <div className={styles.ratingSection}>
            <span className={styles.ratingLabel}>Rating</span>
            <span className={`${styles.ratingValue} ${lastResult === 'success' ? styles.ratingSuccess : lastResult === 'failure' ? styles.ratingFailure : ''}`}>{rating}</span>
          </div>
          <div className={styles.puzzleStats}>
            <span className={styles.puzzleStatsLabel}>Puzzles:</span>
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
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Rating</th>
                <th>Points</th>
                <th>Result</th>
                <th>Timestamp</th>
              </tr>
            </thead>
          <tbody>
            {sortedAttempts.map((attempt, index) => (
              <tr key={index} className={theme === 'dark' ? styles.darkRow : styles.lightRow}>
                <td>
                  <a
                    href={attempt.puzzleUrl}
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
                <td>
                  <span className={attempt.success ? styles.success : styles.failure}>
                    {attempt.success ? '✓' : '✗'}
                  </span>
                </td>
                <td>{formatTimestamp(attempt.timestamp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sortedAttempts.length === 0 && (
          <div className={styles.emptyState}>
            No puzzle attempts yet
          </div>
        )}
        </div>
      </fieldset>
    </div>
  );
};
