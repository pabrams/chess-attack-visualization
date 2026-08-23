import { useEffect, useState } from 'react';

const COARSE_POINTER_QUERY = '(pointer: coarse)';

const matchCoarsePointer = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia(COARSE_POINTER_QUERY).matches;

/**
 * Whether the primary pointer is coarse (finger/stylus) rather than a mouse.
 */
export const useCoarsePointer = (): boolean => {
  const [isCoarse, setIsCoarse] = useState(matchCoarsePointer);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const query = window.matchMedia(COARSE_POINTER_QUERY);
    const update = () => setIsCoarse(query.matches);
    update();

    // Safari below 14 only has the deprecated addListener form.
    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', update);
      return () => query.removeEventListener('change', update);
    }
    query.addListener(update);
    return () => query.removeListener(update);
  }, []);

  return isCoarse;
};
