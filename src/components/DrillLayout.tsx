import React, { ReactNode } from 'react';
import styles from './DrillLayout.module.css';

interface DrillLayoutProps {
  timer: ReactNode;
  board: ReactNode;
  puzzleInfo: ReactNode;
  scoreboard: ReactNode;
}

export const DrillLayout: React.FC<DrillLayoutProps> = ({
  timer,
  board,
  puzzleInfo,
  scoreboard,
}) => {
  return (
    <div className={styles.layout}>
      <div className={styles.boardResults}>
        <div className={styles.board}>
          {board}
        </div>

        <div className={styles.infoPanels}>
          <div className={styles.timer}>
            {timer}
          </div>
          <div className={styles.scoreboard}>
            {scoreboard}
          </div>
          <div className={styles.puzzleInfo}>
            {puzzleInfo}
          </div>
        </div>
      </div>
    </div>
  );
};
