import { useState, useEffect, useCallback } from 'react';
import { LichessUser } from '../types/lichess';
import { handleRedirect } from '../services/lichessAuth';

const LICHESS_HOST = 'https://lichess.org';

export const useLichessAuth = () => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<LichessUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const accessToken = await handleRedirect();
        const tokenToUse = accessToken || localStorage.getItem('lichessToken');

        if (tokenToUse && accessToken) {
          localStorage.setItem('lichessToken', accessToken);
        }

        setToken(tokenToUse);
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('lichessToken');
  }, []);

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
