import { useReducer, useEffect, useCallback } from 'react';
import { LichessUser } from '../types/lichess';
import { handleRedirect } from '../services/lichessAuth';
import { useLocalStorage } from './useLocalStorage';

const LICHESS_HOST = 'https://lichess.org';

interface AuthState {
  token: string | null;
  user: LichessUser | null;
  loading: boolean;
}

type AuthAction =
  | { type: 'SET_TOKEN'; payload: string | null }
  | { type: 'SET_USER'; payload: LichessUser | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGOUT' };

const initialState: AuthState = {
  token: null,
  user: null,
  loading: true,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_TOKEN':
      return { ...state, token: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'LOGOUT':
      return { ...state, token: null, user: null };
    default:
      return state;
  }
};

export const useLichessAuth = () => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [persistedToken, setPersistedToken] = useLocalStorage<string | null>('lichessToken', null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const accessToken = await handleRedirect();
        if (accessToken) {
          dispatch({ type: 'SET_TOKEN', payload: accessToken });
          setPersistedToken(accessToken);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initAuth();
  }, [setPersistedToken]);

  const logout = useCallback(() => {
    dispatch({ type: 'LOGOUT' });
    setPersistedToken(null);
  }, [setPersistedToken]);

  useEffect(() => {
    if (!state.token) {
      dispatch({ type: 'SET_USER', payload: null });
      return;
    }

    const fetchUser = async () => {
      try {
        const response = await fetch(`${LICHESS_HOST}/api/account`, {
          headers: {
            'Authorization': `Bearer ${state.token}`,
          },
        });

        if (!response.ok) {
          logout();
          return;
        }

        const userData = await response.json();
        dispatch({ type: 'SET_USER', payload: userData });
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        logout();
      }
    };

    fetchUser();
  }, [state.token, logout]);

  return { token: state.token, user: state.user, loading: state.loading, logout };
};
