import { useState } from 'react';
import { Square } from 'chess.js';
import { Arrow } from '../types/arrows';
import { createArrowsFromAttackers } from '../utils/arrowUtils';

export const useArrows = () => {
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [lastClickedSquare, setLastClickedSquare] = useState<string | null>(null);

  const clearArrows = () => {
    setArrows([]);
    setLastClickedSquare(null);
  };

  const addArrows = (newArrows: Arrow[]) => {
    setArrows(prev => [...prev, ...newArrows]);
  };

  const showAttackersForSquare = (
    square: string,
    getAttackers: (square: Square, color: 'w' | 'b') => Square[],
    whiteArrowColor: string,
    blackArrowColor: string
  ) => {
    if (square === lastClickedSquare && arrows.length > 0) {
      clearArrows();
    } else {
      const newArrows: Arrow[] = [];

      const whiteAttackers = getAttackers(square as Square, 'w');
      newArrows.push(
        ...createArrowsFromAttackers(whiteAttackers, square, whiteArrowColor)
      );

      const blackAttackers = getAttackers(square as Square, 'b');
      newArrows.push(
        ...createArrowsFromAttackers(blackAttackers, square, blackArrowColor)
      );

      setArrows(newArrows);
      setLastClickedSquare(square);
    }
  };

  return {
    arrows,
    clearArrows,
    showAttackersForSquare,
    addArrows,
  };
};
