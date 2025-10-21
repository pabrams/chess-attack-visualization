export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString();
};

export const formatFullTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

export const constructPuzzleUrl = (puzzleId: string): string => {
  return `https://lichess.org/training/${puzzleId}`;
};

