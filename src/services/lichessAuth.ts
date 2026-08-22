const LICHESS_HOST = 'https://lichess.org';
const CLIENT_ID = 'chess-attack-visualization';

// puzzle:read  -> batches of puzzles the user has never seen before
// puzzle:write -> report solved puzzles so Lichess updates the account rating
export const REQUIRED_SCOPES = 'puzzle:read puzzle:write';

const CODE_VERIFIER_KEY = 'codeVerifier';
const STATE_KEY = 'oauthState';

function toBase64Url(base64: string): string {
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function generateRandomToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return toBase64Url(btoa(String.fromCharCode.apply(null, Array.from(array))));
}

async function generateCodeChallenge(verifier: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return toBase64Url(btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(digest)))));
}

const clearPendingLogin = () => {
  sessionStorage.removeItem(CODE_VERIFIER_KEY);
  sessionStorage.removeItem(STATE_KEY);
};

export const login = async () => {
  clearPendingLogin();

  try {
    const codeVerifier = generateRandomToken();
    const state = generateRandomToken();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    if (!codeVerifier || !codeChallenge) {
      console.error('PKCE generation failed!');
      return;
    }

    const redirectUri = window.location.origin + window.location.pathname;
    const authUrl = new URL(`${LICHESS_HOST}/oauth`);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', REQUIRED_SCOPES);
    authUrl.searchParams.set('code_challenge_method', 'S256');
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('state', state);

    sessionStorage.setItem(CODE_VERIFIER_KEY, codeVerifier);
    sessionStorage.setItem(STATE_KEY, state);
    window.location.href = authUrl.toString();
  } catch (error) {
    console.error('Error in login function:', error);
  }
};

export const handleRedirect = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const returnedState = urlParams.get('state');
  const oauthError = urlParams.get('error');

  if (!code && !oauthError) return null;

  const stripQueryString = () =>
    window.history.replaceState({}, document.title, window.location.pathname);

  if (oauthError) {
    stripQueryString();
    clearPendingLogin();
    throw new Error(`Lichess denied authorization: ${oauthError}`);
  }

  const codeVerifier = sessionStorage.getItem(CODE_VERIFIER_KEY);
  const expectedState = sessionStorage.getItem(STATE_KEY);
  if (!expectedState || returnedState !== expectedState) {
    stripQueryString();
    clearPendingLogin();
    throw new Error('OAuth state mismatch - ignoring this redirect');
  }

  let accessToken = null;

  if (codeVerifier) {
    const redirectUri = window.location.origin + window.location.pathname;
    const tokenUrl = `${LICHESS_HOST}/api/token`;

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: CLIENT_ID,
          code_verifier: codeVerifier,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        accessToken = data.access_token;
      } else {
        const errorText = await response.text();
        console.error('Token exchange failed:', response.status, errorText);
      }
    } catch (error) {
      console.error('Network error during token exchange:', error);
    }
  }

  stripQueryString();
  clearPendingLogin();

  return accessToken;
};

export const revokeToken = async (token: string): Promise<void> => {
  try {
    await fetch(`${LICHESS_HOST}/api/token`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    console.error('Failed to revoke Lichess token:', error);
  }
};
