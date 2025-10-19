import React from 'react';
import styles from './PuzzleInfo.module.css';

interface PuzzleInfoProps {
  rating?: number;
  themes?: string[];
  gameUrl?: string;
  theme: 'dark' | 'light';
}

export const PuzzleInfo: React.FC<PuzzleInfoProps> = ({ rating, gameUrl, theme: colorTheme }) => {

  return (
    <div className={styles.info}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>
          Rating:
        </span>
        {rating && gameUrl ? (
          <span>
            {rating}
          </span>
        ) : rating ? (
          <span>
            {rating}
          </span>
        ) : (
          <span>
            —
          </span>
        )}
      </div>

    </div>
  );
};
