/**
 * Board and square styling
 * Colors are defined in variables.css, these objects structure them for use
 */

const getCSSVar = (varName: string): string => {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
};

export const BOARD_STYLES = {
  LEGAL_MOVE: () => ({
    background: getCSSVar('--board-legal-move-bg'),
    borderRadius: '50%',
  }),

  LAST_MOVE: () => ({
    backgroundColor: getCSSVar('--board-last-move-bg'),
  }),

  PENDING_MOVE: () => ({
    backgroundColor: getCSSVar('--board-pending-move-bg'),
  }),

  SQUARE_DEFAULTS: {
    border: 'none',
  },
} as const;
