import { RefObject, useEffect } from 'react';

/**
 * Stops touch-derived compatibility mouse events inside `ref` from reaching React.
 *
 * Browsers replay a tap as mousedown/mouseup/click so mouse-only pages keep
 * working. react-chessboard drags with dnd-kit, which registers a mouse sensor
 * with no activation threshold, so that replayed mousedown starts a drag the
 * instant it arrives - and the browser then never emits the click that should
 * have followed it. onSquareClick therefore never fired on a touchscreen, which
 * left dragging as the only way to move a piece.
 *
 * Swallowing the replayed mousedown/mouseup in the capture phase, before React
 * dispatches them to the board, keeps that sensor asleep and lets the click
 * through. Touch dragging is unaffected: it runs off dnd-kit's pointer sensor,
 * which sees the real pointerdown and never goes through this path.
 */
const COMPAT_MOUSE_WINDOW_MS = 700;

export const useSuppressTouchCompatMouse = (ref: RefObject<HTMLElement | null>): void => {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let lastTouchEndAt = -Infinity;

    const noteTouchEnd = (event: TouchEvent) => {
      lastTouchEndAt = event.timeStamp;
    };

    const swallowIfReplayedFromTouch = (event: MouseEvent) => {
      // sourceCapabilities answers this directly but only exists on Chromium;
      // elsewhere fall back to "a touch just ended here", which is the only way
      // one of these can be a replay.
      const firesTouchEvents = (
        event as MouseEvent & { sourceCapabilities?: { firesTouchEvents?: boolean } }
      ).sourceCapabilities?.firesTouchEvents;
      const isReplay = firesTouchEvents ?? event.timeStamp - lastTouchEndAt < COMPAT_MOUSE_WINDOW_MS;

      if (isReplay) event.stopPropagation();
    };

    element.addEventListener('touchend', noteTouchEnd, { capture: true, passive: true });
    element.addEventListener('mousedown', swallowIfReplayedFromTouch, true);
    element.addEventListener('mouseup', swallowIfReplayedFromTouch, true);

    return () => {
      element.removeEventListener('touchend', noteTouchEnd, true);
      element.removeEventListener('mousedown', swallowIfReplayedFromTouch, true);
      element.removeEventListener('mouseup', swallowIfReplayedFromTouch, true);
    };
  }, [ref]);
};
