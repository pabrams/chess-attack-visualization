import React from 'react';
import styles from './DrillScoreboard.module.css';
import { DrillResult } from '../types/drill';
import { getLevelFromRating, formatLevelName } from '../utils/ratingCalculation';

interface DrillScoreboardProps {
  results: DrillResult[];
  theme: 'dark' | 'light';
  rating: number;
}

export const DrillScoreboard: React.FC<DrillScoreboardProps> = ({ results, theme, rating }) => {
  const solvedCount = results.filter((r) => r.success).length;
  const attemptedCount = results.length;
  const level = getLevelFromRating(rating);

  return (
    <div className={styles.container}>
      <fieldset className={styles.statsCol}>
        <legend>Player</legend>
        <div>
          Rating: {rating}
        </div>
        <div>
          Level: {formatLevelName(level)}
        </div>
        <div>
          Solved: {solvedCount}/{attemptedCount}
        </div>
      </fieldset>
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
