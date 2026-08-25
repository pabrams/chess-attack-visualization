import { RefObject, useEffect, useRef } from 'react';
import { SquareHandlerArgs } from 'react-chessboard';

/**
 * Raises the board's right-click handler from a touch long-press.
 *
 * The attacker overlay hangs off onSquareRightClick, which react-chessboard
 * raises from a contextmenu event. Touch browsers disagree about long-press:
 * Android Chrome usually raises contextmenu, iOS Safari shows its own selection
 * callout and raises nothing at all. Timing the press here makes the gesture
 * behave the same on both.
 *
 * The native contextmenu is suppressed for the duration of a touch so the two
 * routes cannot both fire - the app's handler toggles the attacker display, so
 * a double fire would turn it on and straight back off. The click that the
 * browser replays after the press is swallowed too, otherwise lifting a finger
 * would also select the square underneath.
 */
const LONG_PRESS_MS = 500;
const MOVE_TOLERANCE_PX = 10;
const CONTEXTMENU_GRACE_MS = 700;

const readSquare = (target: EventTarget | null): SquareHandlerArgs | null => {
  if (!(target instanceof Element)) return null;

  const squareElement = target.closest('[data-square]');
  const square = squareElement?.getAttribute('data-square');
  if (!square) return null;

  const pieceType = squareElement?.querySelector('[data-piece]')?.getAttribute('data-piece');
  return { square, piece: pieceType ? { pieceType } : null };
};

export const useLongPressSquare = (
  ref: RefObject<HTMLElement | null>,
  onLongPress: (args: SquareHandlerArgs) => void
): void => {
  const handlerRef = useRef(onLongPress);
  handlerRef.current = onLongPress;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let timer: number | null = null;
    let origin: { x: number; y: number } | null = null;
    let touchingUntil = -Infinity;
    let swallowNextClick = false;

    const cancelPress = () => {
      if (timer !== null) {
        window.clearTimeout(timer);
        timer = null;
      }
      origin = null;
    };

    const handleTouchStart = (event: TouchEvent) => {
      cancelPress();
      swallowNextClick = false;
      touchingUntil = Infinity;

      // A second finger means a pinch or a stray palm, not a press.
      if (event.touches.length !== 1) return;

      const touch = event.touches[0];
      const args = readSquare(event.target);
      if (!args) return;

      origin = { x: touch.clientX, y: touch.clientY };
      timer = window.setTimeout(() => {
        timer = null;
        origin = null;
        swallowNextClick = true;
        handlerRef.current(args);
      }, LONG_PRESS_MS);
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!origin || event.touches.length !== 1) return;

      const touch = event.touches[0];
      const movedTooFar =
        Math.abs(touch.clientX - origin.x) > MOVE_TOLERANCE_PX ||
        Math.abs(touch.clientY - origin.y) > MOVE_TOLERANCE_PX;

      // Past the tolerance this is a drag, which the board handles itself.
      if (movedTooFar) cancelPress();
    };

    const handleTouchEnd = (event: TouchEvent) => {
      cancelPress();
      if (event.touches.length === 0) touchingUntil = event.timeStamp + CONTEXTMENU_GRACE_MS;
    };

    const handleContextMenu = (event: MouseEvent) => {
      // Leave a real right-click alone; only the touch-driven one is ours.
      if (event.timeStamp > touchingUntil) return;

      event.preventDefault();
      event.stopPropagation();
    };

    const handleClick = (event: MouseEvent) => {
      if (!swallowNextClick) return;

      swallowNextClick = false;
      event.preventDefault();
      event.stopPropagation();
    };

    element.addEventListener('touchstart', handleTouchStart, { capture: true, passive: true });
    element.addEventListener('touchmove', handleTouchMove, { capture: true, passive: true });
    element.addEventListener('touchend', handleTouchEnd, { capture: true, passive: true });
    element.addEventListener('touchcancel', handleTouchEnd, { capture: true, passive: true });
    element.addEventListener('contextmenu', handleContextMenu, true);
    element.addEventListener('click', handleClick, true);

    return () => {
      cancelPress();
      element.removeEventListener('touchstart', handleTouchStart, true);
      element.removeEventListener('touchmove', handleTouchMove, true);
      element.removeEventListener('touchend', handleTouchEnd, true);
      element.removeEventListener('touchcancel', handleTouchEnd, true);
      element.removeEventListener('contextmenu', handleContextMenu, true);
      element.removeEventListener('click', handleClick, true);
    };
  }, [ref]);
};
