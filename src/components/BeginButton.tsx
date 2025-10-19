import React from 'react';
import './BeginButton.css';

interface BeginButtonProps {
  onClick: () => void;
}

export const BeginButton: React.FC<BeginButtonProps> = ({ onClick }) => {
  return (
    <div className="begin-button-overlay">
      <button
        onClick={onClick}
        data-testid="beginButton"
        title="Begin Drill Puzzles"
        className="begin-button"
      >
        <span>Begin</span>
      </button>
    </div>
  );
};
