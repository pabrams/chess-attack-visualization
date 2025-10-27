
export const getEnemyColor = (playerColor: 'white' | 'black'): 'w' | 'b' =>
  playerColor === 'white' ? 'b' : 'w';

export const invertColor = (color: 'w' | 'b'): 'w' | 'b' =>
  color === 'w' ? 'b' : 'w';

export const isBackRank = (square: string): boolean =>
  square[1] === '8' || square[1] === '1';

export const getBoardOrientation = (
  active: boolean,
  playerColor: 'white' | 'black'
): 'white' | 'black' => {
  if (!active) return 'white';
  return playerColor === 'white' ? 'black' : 'white';
};
