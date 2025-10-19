import React, { useState, useEffect } from 'react';
import './LoadingOverlay.css';

export const LoadingOverlay: React.FC = () => {
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    // Only show the overlay if loading takes longer than 500ms
    const timer = setTimeout(() => {
      setShowOverlay(true);
    }, 500);

    // Clean up timer if component unmounts before 500ms
    return () => clearTimeout(timer);
  }, []);

  // Don't render anything until 500ms has passed
  if (!showOverlay) {
    return null;
  }

  return (
    <div className="loading-overlay">
      <div className="loading-text">
        Loading puzzles...
      </div>
    </div>
  );
};
