import React from 'react';
import styles from './DrillScoreboard.module.css';

export interface DrillResult {
  success: boolean;
  timeMs: number;
}

interface DrillScoreboardProps {
  results: DrillResult[];
  theme: 'dark' | 'light';
  rating: number;
}

export const DrillScoreboard: React.FC<DrillScoreboardProps> = ({ results, theme, rating }) => {
  const solvedCount = results.filter((r) => r.success).length;
  const attemptedCount = results.length;

  return (
    <div
      className={styles.container}
      style={{
        backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
        border: `1px solid ${theme === 'dark' ? '#444' : '#e0e0e0'}`,
      }}
    >
      <div className={styles.statsRow}>
        <div
          className={`${styles.statBox} ${styles.solvedStat}`}
          style={{
            backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f5f5f5',
            color: theme === 'dark' ? '#ffffff' : '#000000',
          }}
        >
          Solved: {solvedCount}/{attemptedCount}
        </div>
        <div
          className={`${styles.statBox} ${styles.ratingStat}`}
          style={{
            backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f5f5f5',
            color: theme === 'dark' ? '#ffd700' : '#ff8c00',
          }}
        >
          Rating: {rating}
        </div>
      </div>
      <div className={styles.resultsGrid}>
        {results.map((result, index) => (
          <div
            key={index}
            className={styles.resultItem}
            style={{
              backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f5f5f5',
            }}
          >
            <span className={`${styles.checkmark} ${result.success ? styles.successCheckmark : styles.failureCheckmark}`}>
              {result.success ? '✓' : '✗'}
            </span>
            <span
              className={styles.timeText}
              style={{ color: theme === 'dark' ? '#ffffff' : '#000000' }}
            >
              {(result.timeMs / 1000).toFixed(1)}s
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
