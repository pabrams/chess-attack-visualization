import React, { useContext } from 'react';
import { ThemeMode } from '../types';
import { ThemeContext } from '../hooks/useTheme';
import { useLichessAuth } from '../hooks/useLichessAuth';
import { login } from '../services/lichessAuth';
import { SettingsMenu } from './SettingsMenu';

interface HeaderProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = (props) => {
  const { user, loading, logout } = useLichessAuth();
  const { currentThemeColors } = useContext(ThemeContext)!;

  return (
    <header style={{
      width: '100%',
      backgroundColor: currentThemeColors.headerBackgroundColor,
      padding: '10px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: `2px solid ${currentThemeColors.headerBackgroundColor}`,
      boxSizing: 'border-box',
    }}>
      <div style={{ color: currentThemeColors.headerTextColor,display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>Chess Attack Visualization Drill</h1>
        <p>Right-click a square to show attackers</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {loading ? (
          <div style={{ color: currentThemeColors.headerTextColor, fontSize: '14px' }}>Loading...</div>
        ) : (
          <SettingsMenu
            theme={props.theme}
            onToggleTheme={props.onToggleTheme}
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
