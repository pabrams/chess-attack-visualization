import React from 'react';
import { useLichessAuth } from '../hooks/useLichessAuth';
import { login } from '../services/lichessAuth';
import { SettingsMenu } from './SettingsMenu';
import styles from './Header.module.css';

interface HeaderProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ theme, onToggleTheme }) => {
  const { user, loading, logout } = useLichessAuth();

  return (
    <header className={`${styles.header} ${theme === 'light' ? styles.headerLight : ''}`}>
      <div className={styles.titleSection}>
        <h1 className={`${styles.title} ${theme === 'light' ? styles.titleLight : ''}`}>Monkey Drill</h1>
      </div>

      <div className={styles.actions}>

        {loading ? (
          <div className={styles.loading}>Loading...</div>
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
