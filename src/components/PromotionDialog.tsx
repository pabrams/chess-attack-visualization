import React from 'react';
import { Color as PieceColor } from 'chess.js';
import styles from './PromotionDialog.module.css';

interface PromotionDialogProps {
  color: PieceColor;
  onSelect: (piece: 'q' | 'r' | 'b' | 'n') => void;
  theme: 'dark' | 'light';
}

export const PromotionDialog: React.FC<PromotionDialogProps> = ({ color, onSelect, theme }) => {
  const pieces = [
    { type: 'q' as const, symbol: color === 'w' ? '♕' : '♛', name: 'Queen' },
    { type: 'r' as const, symbol: color === 'w' ? '♖' : '♜', name: 'Rook' },
    { type: 'b' as const, symbol: color === 'w' ? '♗' : '♝', name: 'Bishop' },
    { type: 'n' as const, symbol: color === 'w' ? '♘' : '♞', name: 'Knight' },
  ];

  return (
    <div className={styles.overlay}>
      <div className={`${styles.dialog} ${theme === 'dark' ? styles.dark : ''}`}>
        <h3>Choose promotion piece:</h3>
        <div className={styles.pieces}>
          {pieces.map(({ type, symbol, name }) => (
            <button
              key={type}
              className={styles.button}
              onClick={() => onSelect(type)}
              title={name}
            >
              {symbol}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
