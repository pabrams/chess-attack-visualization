import React from 'react';
import { useLichessAuth } from '../hooks/useLichessAuth';
import { login } from '../services/lichessAuth';
import { SettingsMenu } from './SettingsMenu';
import './Header.css';

interface HeaderProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ theme, onToggleTheme }) => {
  const { user, loading, logout } = useLichessAuth();

  return (
    <header>
      <div className="header-title-section">
        <h1 className="header-title">Monkey Drill</h1>
      </div>

      <div className="header-actions">
        {/* Settings menu with auth */}
        {loading ? (
          <div className="header-loading">Loading...</div>
        ) : (
          <SettingsMenu
            theme={theme}
            onToggleTheme={onToggleTheme}
            isLoggedIn={!!user}
            onLogin={login}
            onLogout={logout}
            username={user?.username}
          />
        )}
      </div>
    </header>
  );
};

export default Header;
