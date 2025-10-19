import React from 'react';

interface PuzzleInfoProps {
  rating?: number;
  themes?: string[];
  gameUrl?: string;
  theme: 'dark' | 'light';
}

export const PuzzleInfo: React.FC<PuzzleInfoProps> = ({ rating, themes, gameUrl, theme: colorTheme }) => {

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        padding: '0.75rem',
        backgroundColor: colorTheme === 'dark' ? '#1a1a1a' : '#ffffff',
        border: `1px solid ${colorTheme === 'dark' ? '#444' : '#e0e0e0'}`,
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        minHeight: '140px',
        maxHeight: '240px',
        overflow: 'auto',
      }}
    >
      {/* Rating section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{
          color: colorTheme === 'dark' ? '#aaaaaa' : '#666666',
          fontSize: '0.9rem',
        }}>
          Rating:
        </span>
        {rating && gameUrl ? (
          <a
            href={gameUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: colorTheme === 'dark' ? '#ffd700' : '#ff8c00',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = 'underline';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = 'none';
            }}
          >
            {rating}
          </a>
        ) : rating ? (
          <span style={{
            color: colorTheme === 'dark' ? '#ffd700' : '#ff8c00',
            fontSize: '1.1rem',
            fontWeight: 'bold',
          }}>
            {rating}
          </span>
        ) : (
          <span style={{
            color: colorTheme === 'dark' ? '#666666' : '#999999',
            fontSize: '0.9rem',
            fontStyle: 'italic',
          }}>
            —
          </span>
        )}
      </div>

    </div>
  );
};
