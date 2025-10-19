import React, { useState, useEffect } from 'react';

interface DrillTimerProps {
  onTimeUp: () => void;
  theme: 'dark' | 'light';
  isActive: boolean;
}

export const DrillTimer: React.FC<DrillTimerProps> = ({ onTimeUp, isActive }) => {
  const threeMinutesInSeconds = 3 * 60;
  const [timeLeft, setTimeLeft] = useState(threeMinutesInSeconds);

  useEffect(() => {
    if (!isActive) {
      setTimeLeft(threeMinutesInSeconds);
      return;
    }

    if (timeLeft === 0) {
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp, isActive]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isLowTime = timeLeft <= 30;

  return (
    <div
      style={{
        fontWeight: 'bold',
        color: isLowTime && isActive ? '#ff3333' : 'inherit',
      }}
    >
      {minutes}:{seconds.toString().padStart(2, '0')}
    </div>
  );
};
