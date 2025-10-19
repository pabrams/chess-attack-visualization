import React, { ReactNode } from 'react';
import styles from './TimerContainer.module.css';

interface TimerContainerProps {
  children: ReactNode;
}

export const TimerContainer: React.FC<TimerContainerProps> = ({ children }) => {
  return (
    <div className={styles.wrapper}>
      {children}
    </div>
  );
};
