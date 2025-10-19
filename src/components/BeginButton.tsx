import React from 'react';
import styles from './BeginButton.module.css';

interface BeginButtonProps {
  onClick: () => void;
}

export const BeginButton: React.FC<BeginButtonProps> = ({ onClick }) => {
  return (
    <div className={styles.overlay}>
      <button
        onClick={onClick}
        data-testid="beginButton"
        title="Begin Drill Puzzles"
        className={styles.button}
      >
        <span>Begin</span>
      </button>
    </div>
  );
};
