import React, { useState, useContext } from 'react';
import { ThemeMode } from '../types';
import { ThemeContext } from '../hooks/useTheme';
import { RatingStorageMode } from '../hooks/useRating';

interface SettingsMenuProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  isLoggedIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  username?: string;
  ratingStorage: RatingStorageMode;
  onSetRatingStorage: (mode: RatingStorageMode) => void;
}

const RATING_STORAGE_OPTIONS: Array<{ value: RatingStorageMode; label: string; hint: string }> = [
  { value: 'local', label: 'This browser', hint: 'Rating is kept in localStorage on this device' },
  { value: 'lichess', label: 'My Lichess account', hint: 'Solved puzzles are reported to Lichess, which owns the rating' },
];

export const SettingsMenu: React.FC<SettingsMenuProps> = (props) => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentThemeColors } = useContext(ThemeContext)!;

  return (
    <div
      style={{ position: 'relative', display: 'inline-block', paddingBottom: '10px' }}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          color: currentThemeColors.headerTextColor,
          display: 'flex',
          alignItems: 'center',
        }}
        aria-label="Settings"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24" />
        </svg>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: '100%',
          backgroundColor: currentThemeColors.headerBackgroundColor,
          border: `1px solid ${currentThemeColors.headerTextColor}`,
          borderRadius: '8px',
          padding: '8px',
          minWidth: '200px',
          zIndex: 1000,
        }}>
          <button
            style={{
              width: '100%',
              padding: '12px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: currentThemeColors.headerTextColor,
              fontSize: '14px',
            }}
            onClick={() => {
              setIsOpen(false);
              props.onToggleTheme();
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center' }}>
              {props.theme === 'dark' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </span>
            <span style={{ color: currentThemeColors.headerTextColor }}>{props.theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>

          <div
            style={{
              padding: '12px',
              borderTop: `1px solid ${currentThemeColors.headerTextColor}33`,
              borderBottom: `1px solid ${currentThemeColors.headerTextColor}33`,
              margin: '4px 0',
              color: currentThemeColors.headerTextColor,
              fontSize: '14px',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '8px' }}>Save rating to</div>
            <div role="radiogroup" aria-label="Rating storage" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {RATING_STORAGE_OPTIONS.map(option => {
                const disabled = option.value === 'lichess' && !props.isLoggedIn;
                return (
                  <label
                    key={option.value}
                    title={disabled ? 'Log in with Lichess to sync your rating' : option.hint}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      opacity: disabled ? 0.5 : 1,
                    }}
                  >
                    <input
                      type="radio"
                      name="rating-storage"
                      value={option.value}
                      checked={props.ratingStorage === option.value}
                      disabled={disabled}
                      onChange={() => props.onSetRatingStorage(option.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                );
              })}
            </div>
            {!props.isLoggedIn && (
              <div style={{ marginTop: '6px', fontSize: '12px', opacity: 0.75 }}>
                Log in with Lichess to sync your rating there.
              </div>
            )}
          </div>

          <button
            style={{
              width: '100%',
              padding: '12px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: currentThemeColors.headerTextColor,
              fontSize: '14px',
            }}
            onClick={() => {
              setIsOpen(false);
              if (props.isLoggedIn) {
                props.onLogout();
              } else {
                props.onLogin();
              }
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center' }}>
              {props.isLoggedIn ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
              )}
            </span>
            <span style={{ color: currentThemeColors.headerTextColor }}>
              {props.isLoggedIn ? (props.username ? `Logout (${props.username})` : 'Logout') : 'Login with Lichess'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
