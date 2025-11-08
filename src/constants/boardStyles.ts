/**
 * Board and square styling constants
 * Consolidates all hardcoded colors and styles for easy theming
 */

export const BOARD_STYLES = {
  // Legal move indicator
  LEGAL_MOVE: {
    background: 'radial-gradient(circle, rgba(0, 0, 0, 0.3) 25%, transparent 25%)',
    borderRadius: '50%',
  },

  // Last move highlighting
  LAST_MOVE: {
    backgroundColor: 'rgba(255, 255, 0, 0.4)',
  },

  // Pending move (source square)
  PENDING_MOVE: {
    backgroundColor: 'rgba(0, 255, 0, 0.5)',
  },

  // Square styling defaults
  SQUARE_DEFAULTS: {
    border: 'none',
  },
} as const;
