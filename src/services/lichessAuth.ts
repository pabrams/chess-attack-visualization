import { LichessPuzzle } from '../types/lichess';

const LICHESS_HOST = 'https://lichess.org';
const CLIENT_ID = 'visualize-chessboard-territory';

// Manual PKCE implementation
function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, Array.from(array)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function generateCodeChallenge(verifier: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export const login = async () => {
  // Clear any existing code verifier first
  sessionStorage.removeItem('codeVerifier');
  
  try {
    // Generate PKCE challenge manually
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    if (!codeVerifier || !codeChallenge) {
      console.error('PKCE generation failed!');
      return;
    }

    const redirectUri = window.location.origin;
    const authUrl = new URL(`${LICHESS_HOST}/oauth`);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', 'preference:read');
    authUrl.searchParams.set('code_challenge_method', 'S256');
    authUrl.searchParams.set('code_challenge', codeChallenge);

    // Store verifier in session storage
    sessionStorage.setItem('codeVerifier', codeVerifier);
    window.location.href = authUrl.toString();
  } catch (error) {
    console.error('Error in login function:', error);
  }
};

export const handleRedirect = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');

  const codeVerifier = sessionStorage.getItem('codeVerifier');

  if (code && codeVerifier) {
    const redirectUri = window.location.origin;
    const tokenUrl = `${LICHESS_HOST}/api/token`;

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
      window.history.replaceState({}, document.title, window.location.pathname);
      sessionStorage.removeItem('codeVerifier');
      return data.access_token;
    } else {
      const errorText = await response.text();
      console.error('Failed to exchange authorization code for access token');
      console.error('Response status:', response.status);
      console.error('Response body:', errorText);
      // Clean up the URL and session storage
      window.history.replaceState({}, document.title, window.location.pathname);
      sessionStorage.removeItem('codeVerifier');
      return null;
    }
  } else {
1    // Clean up URL if there's a code but no verifier (corrupted state)
    if (code) {
      console.log('Cleaning up URL with orphaned authorization code');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }
  return null;
};

export const fetchPuzzle = async (params?: {
  themes?: string | string[];
  rating?: number;
  color?: 'white' | 'black';
  player?: string;
}): Promise<LichessPuzzle | null> => {
  try {
    const url = new URL(`${LICHESS_HOST}/api/puzzle/next`);

    if (params) {
      if (params.themes) {
        const themes = Array.isArray(params.themes) ? params.themes.join(',') : params.themes;
        url.searchParams.set('themes', themes);
      }
      if (params.rating) {
        url.searchParams.set('rating', params.rating.toString());
      }
      if (params.color) {
        url.searchParams.set('color', params.color);
      }
      if (params.player) {
        url.searchParams.set('player', params.player);
      }
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const puzzle: LichessPuzzle = await response.json();
      return puzzle;
    } else {
      console.error('Failed to fetch puzzle:', response.status, response.statusText);
      return null;
    }
  } catch (error) {
    console.error('Error fetching puzzle:', error);
    return null;
  }
};

export const fetchPuzzleBatch = async (nb: number = 50, retries: number = 3): Promise<LichessPuzzle[]> => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const url = new URL(`${LICHESS_HOST}/api/puzzle/batch/mix`);
      url.searchParams.set('nb', nb.toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/x-ndjson',
        },
      });

      if (response.ok) {
        const text = await response.text();
        // Parse NDJSON
        const puzzles = text
          .trim()
          .split('\n')
          .filter(line => line.trim())
          .map(line => JSON.parse(line) as LichessPuzzle);
        return puzzles;
      } else if (response.status === 429) {
        // Rate limited - wait with exponential backoff
        const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s, 8s
        console.warn(`Rate limited (429), waiting ${waitTime}ms before retry ${attempt + 1}/${retries}`);
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      } else {
        console.error('Failed to fetch puzzle batch:', response.status, response.statusText);
        return [];
      }
    } catch (error) {
      console.error('Error fetching puzzle batch:', error);
      if (attempt < retries) {
        const waitTime = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      return [];
    }
  }
  return [];
};

export const fetchSingleMovePuzzles = async (targetCount: number = 100): Promise<LichessPuzzle[]> => {
  const singleMovePuzzles: LichessPuzzle[] = [];
  const batchSize = 50;
  const maxBatches = Math.min(3, Math.ceil(targetCount / 5)); // Limit to 3 batches max

  for (let i = 0; i < maxBatches && singleMovePuzzles.length < targetCount; i++) {
    const batch = await fetchPuzzleBatch(batchSize);
    const filtered = batch.filter(puzzle => {
      const isSingleMove = puzzle.puzzle.solution.length === 1;
      return isSingleMove;
    });
    console.log(`Batch ${i + 1}/${maxBatches}: Got ${batch.length} puzzles, filtered to ${filtered.length} single-move puzzles (total: ${singleMovePuzzles.length + filtered.length})`);
    singleMovePuzzles.push(...filtered);

    // Add delay between batches to avoid rate limiting - wait 3 seconds between batches
    if (i < maxBatches - 1 && singleMovePuzzles.length < targetCount) {
      console.log('Waiting 3 seconds before next batch to avoid rate limiting...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  console.log(`Finished fetching: ${singleMovePuzzles.length} single-move puzzles`);
  return singleMovePuzzles.slice(0, targetCount);
};
