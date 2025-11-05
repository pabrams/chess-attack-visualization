import { useReducer, useEffect, useCallback, useRef } from 'react';
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
  | { type: 'INIT_AUTH' }
  | { type: 'AUTH_SUCCESS'; payload: { token: string | null; user: LichessUser | null } }
  | { type: 'AUTH_FAILED' }
  | { type: 'USER_FETCHED'; payload: LichessUser }
  | { type: 'LOGOUT' };

const initialState: AuthState = {
  token: null,
  user: null,
  loading: true,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'INIT_AUTH':
      return { ...state, loading: true };
    case 'AUTH_SUCCESS':
      return {
        token: action.payload.token,
        user: action.payload.user,
        loading: false,
      };
    case 'AUTH_FAILED':
      return {
        token: null,
        user: null,
        loading: false,
      };
    case 'USER_FETCHED':
      return { ...state, user: action.payload, loading: false };
    case 'LOGOUT':
      return { token: null, user: null, loading: false };
    default:
      return state;
  }
};

export const useLichessAuth = () => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [persistedToken, setPersistedToken] = useLocalStorage<string | null>('lichessToken', null);
  const initializedRef = useRef(false);

  const fetchUserData = useCallback(async (token: string): Promise<LichessUser | null> => {
    try {
      const response = await fetch(`${LICHESS_HOST}/api/account`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      return null;
    }
  }, []);

  const logout = useCallback(() => {
    dispatch({ type: 'LOGOUT' });
    setPersistedToken(null);
  }, [setPersistedToken]);

  // Initialize auth on mount - check for OAuth redirect only
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initializeAuth = async () => {
      dispatch({ type: 'INIT_AUTH' });

      try {
        const accessToken = await handleRedirect();

        if (accessToken) {
          // New token from OAuth - save and fetch user
          setPersistedToken(accessToken);
          const user = await fetchUserData(accessToken);
          dispatch({ type: 'AUTH_SUCCESS', payload: { token: accessToken, user } });
        } else {
          // No new token - just restore persisted state without fetching
          dispatch({ type: 'AUTH_SUCCESS', payload: { token: persistedToken, user: null } });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        dispatch({ type: 'AUTH_FAILED' });
      }
    };

    initializeAuth();
  }, []);

  // Fetch user data only when token changes (new login or logout)
  useEffect(() => {
    if (!state.token) {
      return; // No token, nothing to fetch
    }

    const fetchUser = async () => {
      const user = await fetchUserData(state.token!);
      if (user) {
        dispatch({ type: 'USER_FETCHED', payload: user });
      }
    };

    fetchUser();
  }, [state.token, fetchUserData]);

  return { token: state.token, user: state.user, loading: state.loading, logout };
};
