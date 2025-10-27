/**
 * Shuffles an array in-place using Fisher-Yates shuffle
 * @param array - The array to shuffle
 * @returns A new shuffled array
 */
const shuffleArray = <T,>(array: T[]): T[] =>
  [...array].sort(() => Math.random() - 0.5);

/**
 * Takes a random sample of n elements from an array
 * @param array - The array to sample from
 * @param n - The number of elements to sample
 * @returns A new array with n randomly sampled elements
 */
export const sampleArray = <T,>(array: T[], n: number): T[] =>
  shuffleArray(array).slice(0, n);
