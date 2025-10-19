import React, { ReactNode } from 'react';
import './DrillLayout.css';

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
    <div className="responsive-layout">
      <div className="board-results-wrapper">
        <div className="timer-container">
          {timer}
        </div>

        <div className="board-container">
          {board}
        </div>

        <div className="info-panels-wrapper">
          <div className="puzzle-info-container">
            {puzzleInfo}
          </div>
          <div className="scoreboard-container">
            {scoreboard}
          </div>
        </div>
      </div>
    </div>
  );
};
