import { useState, useEffect, useCallback } from 'react';
import { LichessUser } from '../types/lichess';
import { handleRedirect } from '../services/lichessAuth';
import { useLocalStorage } from './useLocalStorage';

const LICHESS_HOST = 'https://lichess.org';

export const useLichessAuth = () => {
  const [token, setToken] = useLocalStorage<string | null>('lichessToken', null);
  const [user, setUser] = useState<LichessUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const accessToken = await handleRedirect();
        if (accessToken) {
          setToken(accessToken);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [setToken]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, [setToken]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }

    const fetchUser = async () => {
      try {
        const response = await fetch(`${LICHESS_HOST}/api/account`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          logout();
          return;
        }

        const userData = await response.json();
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        logout();
      }
    };

    fetchUser();
  }, [token, logout]);

  return { token, user, loading, logout };
};
