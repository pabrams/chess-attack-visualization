import { RefObject, useLayoutEffect, useState } from 'react';

/**
 * Tracks the rendered width of an element.
 *
 * Uses a ResizeObserver rather than a window `resize` listener so the width
 * also stays correct when the element is resized by layout changes that leave
 * the window alone: a sibling panel growing, a webfont loading, a scrollbar
 * appearing, or an orientation media query flipping the flex direction.
 *
 * Measures in a layout effect so the first paint already has the real width
 * instead of flashing the fallback.
 */
export const useElementWidth = (
  ref: RefObject<HTMLElement | null>,
  fallbackWidth: number
): number => {
  const [width, setWidth] = useState(fallbackWidth);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return;

    // ResizeObserver reports the current size as soon as it starts observing,
    // so there is no separate initial measurement to make.
    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    observer.observe(element);

    return () => observer.disconnect();
  }, [ref]);

  return width;
};
