import React from 'react';
import styles from './PuzzleInfo.module.css';

interface PuzzleInfoProps {
  rating?: number;
  themes?: string[];
  gameUrl?: string;
  theme?: 'dark' | 'light';
}

export const PuzzleInfo: React.FC<PuzzleInfoProps> = ({ rating }) => {

  return (
    <div className={styles.info}>
      <div>
        Puzzle rating: {rating ? rating : '—'}
      </div>
    </div>
  );
};