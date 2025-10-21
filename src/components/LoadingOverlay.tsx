import React, { useState, useEffect } from 'react';
import styles from './LoadingOverlay.module.css';

export const LoadingOverlay: React.FC = () => {
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowOverlay(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (!showOverlay) {
    return null;
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.text}>
        Loading puzzles...
      </div>
    </div>
  );
};
