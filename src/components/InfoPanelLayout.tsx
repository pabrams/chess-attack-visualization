import React, { useContext, useState } from 'react';
import { PuzzleAttempt, UserColor } from '../types/drill';
import { usePuzzleStats } from '../hooks/usePuzzleStats';
import { ThemeContext } from '../hooks/useTheme';
import styles from './InfoPanelLayout.module.css';

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString();
};

const formatFullTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

const constructPuzzleUrl = (puzzleId: string): string => {
  return `https://lichess.org/training/${puzzleId}`;
};

interface InfoPanelLayoutProps {
  attempts: PuzzleAttempt[];
  rating: number;
  lastResult: boolean | null;
  userColor: UserColor;
  onLoadFen: (fen: string) => boolean;
}

export const InfoPanelLayout: React.FC<InfoPanelLayoutProps> = (props) => {
  const { theme } = useContext(ThemeContext)!;
  const [fenInput, setFenInput] = useState('');
  const [fenError, setFenError] = useState<string | null>(null);

  const {
    sortedAttempts,
    visibleAttempts,
    displayCount,
    attemptedCount,
    succeededCount,
    successRatio,
    handleLoadMore,
  } = usePuzzleStats(props.attempts);

  const handleFenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFenError(null);

    const trimmedFen = fenInput.trim();
    if (!trimmedFen) {
      setFenError('Please enter a FEN string');
      return;
    }

    const success = props.onLoadFen(trimmedFen);
    if (success) {
      setFenInput('');
    } else {
      setFenError('Invalid FEN string');
    }
  };

  return (
    <div className={styles.wrapper}>
      <fieldset className={styles.playerInfoContainer}>
        <legend>Info</legend>
        <div className={styles.moveInstruction}>
          Move the{' '}
          <span
            style={{
              color: props.userColor === 'white' 
                ? 'var(--chess-white-arrow)' 
                : 'var(--chess-black-arrow)',
              fontWeight: 'bold',
              textTransform: 'capitalize' 
            }}
          >
            {props.userColor}
          </span>{' '}
          pieces
        </div>
        <div className={styles.playerInfoContent}>
          <div className={styles.ratingSection}>
            <span className={styles.ratingLabel}>Rating</span>
            <span className={`${styles.ratingValue} ${props.lastResult === true ? styles.ratingSuccess : props.lastResult === false ? styles.ratingFailure : ''}`}>{props.rating}</span>
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

      <fieldset className={styles.toolsContainer}>
        <legend>Tools</legend>
        <form onSubmit={handleFenSubmit} style={{ padding: '10px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="fen-input" style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
              Input FEN
            </label>
            <input
              id="fen-input"
              type="text"
              value={fenInput}
              onChange={(e) => setFenInput(e.target.value)}
              placeholder="Enter Forsythe-Edwards notation"
              style={{
                width: '100%',
                padding: '6px 8px',
                fontSize: '13px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                boxSizing: 'border-box',
              }}
            />
          </div>
          {fenError && (
            <div style={{ color: 'red', fontSize: '12px', marginBottom: '10px' }}>
              {fenError}
            </div>
          )}
          <button
            type="submit"
            style={{
              padding: '6px 12px',
              fontSize: '13px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Submit
          </button>
        </form>
      </fieldset>
    </div>
  );
};
