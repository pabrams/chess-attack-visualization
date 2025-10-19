import React, { ReactNode } from 'react';
import './TimerContainer.css';

interface TimerContainerProps {
  children: ReactNode;
}

export const TimerContainer: React.FC<TimerContainerProps> = ({ children }) => {
  return (
    <div className="timer-wrapper">
      {children}
    </div>
  );
};
