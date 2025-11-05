import React from 'react';
import { Color as PieceColor } from 'chess.js';
import { ThemeMode } from '../types';
import styles from './PromotionDialog.module.css';

interface PromotionDialogProps {
  color: PieceColor;
  onSelect: (piece: 'q' | 'r' | 'b' | 'n') => void;
  theme: ThemeMode;
}

export const PromotionDialog: React.FC<PromotionDialogProps> = (props) => {
  const pieces = [
    { type: 'q' as const, symbol: props.color === 'w' ? '♕' : '♛', name: 'Queen' },
    { type: 'r' as const, symbol: props.color === 'w' ? '♖' : '♜', name: 'Rook' },
    { type: 'b' as const, symbol: props.color === 'w' ? '♗' : '♝', name: 'Bishop' },
    { type: 'n' as const, symbol: props.color === 'w' ? '♘' : '♞', name: 'Knight' },
  ];

  return (
    <div className={styles.overlay}>
      <div className={`${styles.dialog} ${props.theme === 'dark' ? styles.dark : ''}`}>
        <h3>Choose promotion piece:</h3>
        <div className={styles.pieces}>
          {pieces.map(({ type, symbol, name }) => (
            <button
              key={type}
              className={styles.button}
              onClick={() => props.onSelect(type)}
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
