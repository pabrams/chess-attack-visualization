import { useState } from 'react';
import { Square } from 'chess.js';
import { Arrow } from '../types/arrows';

export const useArrows = () => {
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [lastClickedSquare, setLastClickedSquare] = useState<string | null>(null);

  const clearArrows = () => {
    setArrows([]);
    setLastClickedSquare(null);
  };

  const showAttackersForSquare = (
    square: string,
    getAttackers: (square: Square, color: 'w' | 'b') => Square[],
    whiteArrowColor: string,
    blackArrowColor: string
  ) => {
    if (square === lastClickedSquare && arrows.length > 0) {
      // Clear arrows on second click of same square
      clearArrows();
    } else {
      const newArrows: Arrow[] = [];

      const whiteAttackers = getAttackers(square as Square, 'w');
      whiteAttackers.forEach((attackerSquare) => {
        newArrows.push({
          startSquare: attackerSquare,
          endSquare: square,
          color: whiteArrowColor,
        });
      });
      
      const blackAttackers = getAttackers(square as Square, 'b');
      blackAttackers.forEach((attackerSquare) => {
        newArrows.push({
          startSquare: attackerSquare,
          endSquare: square,
          color: blackArrowColor,
        });
      });

      setArrows(newArrows);
      setLastClickedSquare(square);
    }
  };

  return {
    arrows,
    lastClickedSquare,
    clearArrows,
    showAttackersForSquare,
  };
};
