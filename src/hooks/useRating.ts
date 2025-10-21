import { useState, useEffect } from 'react';
import { calculateRatingChange } from '../utils/ratingCalculation';

const RATING_STORAGE_KEY = 'monkeyDrill_userRating';
const DEFAULT_RATING = 1;

export const useRating = () => {
  const [rating, setRating] = useState<number>(() => {
    const stored = localStorage.getItem(RATING_STORAGE_KEY);
    if (stored) {
      const parsed = parseFloat(stored);
      return isNaN(parsed) ? DEFAULT_RATING : parsed;
    }
    return DEFAULT_RATING;
  });

  useEffect(() => {
    localStorage.setItem(RATING_STORAGE_KEY, rating.toString());
  }, [rating]);

  const addPoints = (puzzleRating: number, success: boolean) => {
    const points = calculateRatingChange(rating, puzzleRating, success);

    let newRating = Math.ceil(rating + points);
    if (newRating > 9999) newRating = 9999;
    if (newRating < 1) newRating = 1;

    setRating(newRating);
  };

  const resetRating = () => {
    setRating(DEFAULT_RATING);
  };

  return {
    rating,
    addPoints,
    resetRating,
  };
};
