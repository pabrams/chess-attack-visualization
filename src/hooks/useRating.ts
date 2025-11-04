import { useLocalStorage } from './useLocalStorage';
import { calculateRatingChange } from '../utils/ratingCalculation';

const RATING_STORAGE_KEY = 'monkeyDrill_userRating';
const DEFAULT_RATING = 1;

export const useRating = () => {
  const [rating, setRating] = useLocalStorage<number>(
    RATING_STORAGE_KEY,
    DEFAULT_RATING,
    (value) => {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? DEFAULT_RATING : parsed;
    },
    (value) => value.toString()
  );

  const addPoints = (puzzleRating: number, success: boolean) => {
    const points = calculateRatingChange(rating, puzzleRating, success);

    let newRating = Math.ceil(rating + points);
    if (newRating > 9999) newRating = 9999;
    if (newRating < 1) newRating = 1;

    setRating(newRating);
  };

  return {
    rating,
    addPoints,
  };
};
