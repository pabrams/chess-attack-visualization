import { createContext, useContext, useReducer, useEffect, useCallback, useRef, ReactNode } from 'react';
import { LichessUser } from '../types/lichess';
import { handleRedirect, revokeToken } from '../services/lichessAuth';
import { useLocalStorage } from './useLocalStorage';

const LICHESS_HOST = 'https://lichess.org';

interface AuthState {
  token: string | null;
  user: LichessUser | null;
  loading: boolean;
  /** Set when Lichess rejects the token, e.g. it predates the puzzle scopes. */
  scopeError: boolean;
}

type AuthAction =
  | { type: 'INIT_AUTH' }
  | { type: 'AUTH_SUCCESS'; payload: { token: string | null; user: LichessUser | null } }
  | { type: 'AUTH_FAILED' }
  | { type: 'USER_FETCHED'; payload: LichessUser }
  | { type: 'SCOPE_ERROR' }
  | { type: 'LOGOUT' };

const initialState: AuthState = {
  token: null,
  user: null,
  loading: true,
  scopeError: false,
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
        scopeError: false,
      };
    case 'AUTH_FAILED':
      return { token: null, user: null, loading: false, scopeError: false };
    case 'USER_FETCHED':
      return { ...state, user: action.payload, loading: false };
    case 'SCOPE_ERROR':
      return { ...state, scopeError: true };
    case 'LOGOUT':
      return { token: null, user: null, loading: false, scopeError: false };
    default:
      return state;
  }
};

export interface LichessAuth {
  token: string | null;
  user: LichessUser | null;
  loading: boolean;
  scopeError: boolean;
  /** The account's Lichess puzzle rating, when it is known. */
  lichessPuzzleRating: number | null;
  logout: () => void;
  reportScopeError: () => void;
}

const LichessAuthContext = createContext<LichessAuth | null>(null);

const useLichessAuthState = (): LichessAuth => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [persistedToken, setPersistedToken] = useLocalStorage<string | null>('lichessToken', null);
  const initializedRef = useRef(false);

  const fetchUserData = useCallback(async (token: string): Promise<LichessUser | null> => {
    try {
      const response = await fetch(`${LICHESS_HOST}/api/account`, {
        headers: { 'Authorization': `Bearer ${token}` },
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
    const token = state.token ?? persistedToken;
    dispatch({ type: 'LOGOUT' });
    setPersistedToken(null);
    if (token) revokeToken(token);
  }, [state.token, persistedToken, setPersistedToken]);

  const reportScopeError = useCallback(() => {
    dispatch({ type: 'SCOPE_ERROR' });
  }, []);

  useEffect(function initAuth() {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(function getUserDataForNewToken() {
    if (!state.token) {
      return;
    }

    const fetchUser = async () => {
      const user = await fetchUserData(state.token!);
      if (user) {
        dispatch({ type: 'USER_FETCHED', payload: user });
      }
    };

    fetchUser();
  }, [state.token, fetchUserData]);

  const lichessPuzzleRating = state.user?.perfs?.puzzle?.rating ?? null;

  return {
    token: state.token,
    user: state.user,
    loading: state.loading,
    scopeError: state.scopeError,
    lichessPuzzleRating,
    logout,
    reportScopeError,
  };
};

export const LichessAuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useLichessAuthState();
  return <LichessAuthContext.Provider value={auth}>{children}</LichessAuthContext.Provider>;
};

/**
 * Shared auth state. Must be rendered under a {@link LichessAuthProvider} so
 * the OAuth redirect is only exchanged once per page load.
 */
export const useLichessAuth = (): LichessAuth => {
  const auth = useContext(LichessAuthContext);
  if (!auth) throw new Error('useLichessAuth must be used within a LichessAuthProvider');
  return auth;
};
