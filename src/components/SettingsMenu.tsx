import React, { useState, useContext, useEffect, useRef } from 'react';
import { ThemeMode } from '../types';
import { ThemeContext } from '../hooks/useTheme';
import { RatingStorageMode } from '../hooks/useRating';
import {
  NEXT_PUZZLE_DELAYS,
  PUZZLE_DIFFICULTIES,
  PuzzleDifficulty,
  difficultyIndex,
  nextPuzzleDelayIndex,
} from '../types/settings';

interface SettingsMenuProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  isLoggedIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  username?: string;
  ratingStorage: RatingStorageMode;
  onSetRatingStorage: (mode: RatingStorageMode) => void;
  difficulty: PuzzleDifficulty;
  onSetDifficulty: (difficulty: PuzzleDifficulty) => void;
  nextPuzzleDelayMs: number | null;
  onSetNextPuzzleDelayMs: (ms: number | null) => void;
}

const capitalize = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);

const RATING_STORAGE_OPTIONS: Array<{ value: RatingStorageMode; label: string; hint: string }> = [
  { value: 'local', label: 'This browser', hint: 'Rating is kept in localStorage on this device' },
  { value: 'lichess', label: 'My Lichess account', hint: 'Solved puzzles are reported to Lichess, which owns the rating' },
];

export const SettingsMenu: React.FC<SettingsMenuProps> = (props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { currentThemeColors } = useContext(ThemeContext)!;

  // Close the menu when clicking outside of it or pressing Escape.
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const isTriggerActive = isHovered || isOpen;
  const difficultySliderValue = difficultyIndex(props.difficulty);
  const delaySliderValue = nextPuzzleDelayIndex(props.nextPuzzleDelayMs);

  const sectionStyle: React.CSSProperties = {
    padding: '12px',
    borderTop: `1px solid ${currentThemeColors.headerTextColor}33`,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    color: currentThemeColors.headerTextColor,
    fontSize: '14px',
  };
  const sectionLabelStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '8px',
    fontWeight: 600,
  };

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', display: 'inline-block', paddingBottom: '10px' }}
    >
      <button
        style={{
          background: isTriggerActive ? `${currentThemeColors.headerTextColor}22` : 'none',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          padding: '8px',
          color: currentThemeColors.headerTextColor,
          opacity: isTriggerActive ? 1 : 0.8,
          display: 'flex',
          alignItems: 'center',
          transition: 'background-color 0.15s ease, opacity 0.15s ease',
        }}
        aria-label="Settings"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(open => !open)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
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
          minWidth: '240px',
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

          <div style={sectionStyle}>
            <label htmlFor="puzzle-difficulty" style={sectionLabelStyle}>
              <span>Difficulty</span>
              <span style={{ fontWeight: 400 }}>{capitalize(props.difficulty)}</span>
            </label>
            <input
              id="puzzle-difficulty"
              type="range"
              min={0}
              max={PUZZLE_DIFFICULTIES.length - 1}
              step={1}
              value={difficultySliderValue}
              aria-valuetext={capitalize(props.difficulty)}
              onChange={event => props.onSetDifficulty(PUZZLE_DIFFICULTIES[Number(event.target.value)])}
              style={{ width: '100%' }}
            />
          </div>

          <div style={sectionStyle}>
            <label htmlFor="next-puzzle-delay" style={sectionLabelStyle}>
              <span>Delay before next puzzle</span>
              <span style={{ fontWeight: 400 }}>{NEXT_PUZZLE_DELAYS[delaySliderValue].label}</span>
            </label>
            <input
              id="next-puzzle-delay"
              type="range"
              min={0}
              max={NEXT_PUZZLE_DELAYS.length - 1}
              step={1}
              value={delaySliderValue}
              aria-valuetext={NEXT_PUZZLE_DELAYS[delaySliderValue].label}
              onChange={event => props.onSetNextPuzzleDelayMs(NEXT_PUZZLE_DELAYS[Number(event.target.value)].ms)}
              style={{ width: '100%' }}
            />
          </div>

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
