/**
 * Board and square styling constants
 * Consolidates all hardcoded colors and styles for easy theming
 */

export const BOARD_STYLES = {
  LEGAL_MOVE: {
    background: 'radial-gradient(circle, rgba(0, 0, 0, 0.3) 25%, transparent 25%)',
    borderRadius: '50%',
  },

  LAST_MOVE: {
    backgroundColor: 'rgba(255, 255, 0, 0.4)',
  },

  PENDING_MOVE: {
    backgroundColor: 'rgba(0, 255, 0, 0.5)',
  },

  SQUARE_DEFAULTS: {
    border: 'none',
  },
} as const;
