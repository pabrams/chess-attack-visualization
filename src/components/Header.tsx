import React from 'react';
import { ThemeMode } from '../types';
import { useLichessAuth } from '../hooks/useLichessAuth';
import { login } from '../services/lichessAuth';
import { SettingsMenu } from './SettingsMenu';
import styles from './Header.module.css';

interface HeaderProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = (props) => {
  const { user, loading, logout } = useLichessAuth();

  return (
    <header className={`${styles.header} ${props.theme === 'light' ? styles.headerLight : ''}`}>
      <div className={styles.titleSection}>
        <img src="monkey.jpeg" alt="Monkey" className={styles.monkeyImage} />
        <h1 className={`${styles.title} ${props.theme === 'light' ? styles.titleLight : ''}`}>Monkey Drill</h1>
      </div>

      <div className={styles.actions}>

        {loading ? (
          <div className={styles.loading}>Loading...</div>
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
