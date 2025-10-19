import React, { useState } from 'react';

interface SettingsMenuProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  isLoggedIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  username?: string;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({
  theme,
  onToggleTheme,
  isLoggedIn,
  onLogin,
  onLogout,
  username,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Gear icon button */}
      <button
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#E0E0E0',
        }}
        aria-label="Settings"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div>
          <button
            onClick={() => {
              setIsOpen(false);
              onToggleTheme();
            }}
          >
            toggle theme
          </button>

          {/* Login/Logout */}
          <button
            onClick={() => {
              setIsOpen(false);
              if (isLoggedIn) {
                onLogout();
              } else {
                onLogin();
              }
            }}
          >
            {isLoggedIn ? (
              <>
                <span>{username ? `Logout (${username})` : 'Logout'}</span>
              </>
            ) : (
              <>
                <span>Login with Lichess</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
