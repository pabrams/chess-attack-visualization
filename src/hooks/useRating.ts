import { useState, useEffect } from 'react';
import { calculateRatingChange } from '../utils/ratingCalculation';

const RATING_STORAGE_KEY = 'monkeyDrill_userRating';
const DEFAULT_RATING = 300;

export const useRating = () => {
  const [rating, setRating] = useState<number>(() => {
    // Load from localStorage on init
    const stored = localStorage.getItem(RATING_STORAGE_KEY);
    if (stored) {
      const parsed = parseFloat(stored);
      return isNaN(parsed) ? DEFAULT_RATING : parsed;
    }
    return DEFAULT_RATING;
  });

  // Save to localStorage whenever rating changes
  useEffect(() => {
    localStorage.setItem(RATING_STORAGE_KEY, rating.toString());
  }, [rating]);

  const addPoints = (playerRating: number, puzzleRating: number, success: boolean) => {
    const points = calculateRatingChange(playerRating, puzzleRating, success);

    let newRating = Math.ceil(playerRating + points);
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
