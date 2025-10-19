import React from 'react';

interface PuzzleInfoProps {
  rating?: number;
  themes?: string[];
  gameUrl?: string;
  theme?: 'dark' | 'light';
}

export const PuzzleInfo: React.FC<PuzzleInfoProps> = ({ rating }) => {
  return (
    <fieldset>
      <legend>Puzzle</legend>
      <div>
        Rating: {rating ? rating : '—'}
      </div>
    </fieldset>
  )
};