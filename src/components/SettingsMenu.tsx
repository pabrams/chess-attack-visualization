import React, { useState } from 'react';
import { ThemeMode } from '../types';
import styles from './SettingsMenu.module.css';

interface SettingsMenuProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  isLoggedIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  username?: string;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = (props) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={styles.container}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className={`${styles.gearButton} ${props.theme === 'light' ? styles.gearButtonLight : ''}`} aria-label="Settings">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24" />
        </svg>
      </button>

      {isOpen && (
        <div className={`${styles.dropdown} ${props.theme === 'light' ? styles.dropdownLight : ''}`}>
          <button
            className={`${styles.menuButton} ${styles.themeButton} ${props.theme === 'light' ? `${styles.menuButtonLight} ${styles.themeButtonLight}` : ''}`}
            onClick={() => {
              setIsOpen(false);
              props.onToggleTheme();
            }}
          >
            <span className={styles.icon}>
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
            <span>{props.theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <button
            className={`${styles.menuButton} ${props.theme === 'light' ? styles.menuButtonLight : ''}`}
            onClick={() => {
              setIsOpen(false);
              if (props.isLoggedIn) {
                props.onLogout();
              } else {
                props.onLogin();
              }
            }}
          >
            <span className={styles.icon}>
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
            <span>
              {props.isLoggedIn ? (props.username ? `Logout (${props.username})` : 'Logout') : 'Login with Lichess'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
