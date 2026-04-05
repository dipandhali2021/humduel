import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } from '../config.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SpotifyTrackResult {
  title: string;
  artist: string;
  spotifyId: string | null;
  albumArt: string | null;
  previewUrl: string | null;
}

// ---------------------------------------------------------------------------
// Local song catalog fallback (mirrors client/src/lib/songCatalog.ts)
// ---------------------------------------------------------------------------

interface LocalSong {
  title: string;
  artist: string;
}

const LOCAL_CATALOG: LocalSong[] = [
  // Classic Rock & Pop
  { title: 'Bohemian Rhapsody', artist: 'Queen' },
  { title: "Don't Stop Me Now", artist: 'Queen' },
  { title: 'We Will Rock You', artist: 'Queen' },
  { title: 'Hotel California', artist: 'Eagles' },
  { title: 'Stairway to Heaven', artist: 'Led Zeppelin' },
  { title: 'Smells Like Teen Spirit', artist: 'Nirvana' },
  { title: 'Yesterday', artist: 'The Beatles' },
  { title: 'Let It Be', artist: 'The Beatles' },
  { title: 'Hey Jude', artist: 'The Beatles' },
  { title: 'Come Together', artist: 'The Beatles' },
  { title: 'Purple Haze', artist: 'Jimi Hendrix' },
  { title: 'Sweet Home Alabama', artist: 'Lynyrd Skynyrd' },
  { title: 'Born to Run', artist: 'Bruce Springsteen' },
  { title: 'Like a Rolling Stone', artist: 'Bob Dylan' },
  { title: 'Imagine', artist: 'John Lennon' },
  { title: 'Piano Man', artist: 'Billy Joel' },
  { title: 'Uptown Girl', artist: 'Billy Joel' },

  // 80s & 90s Pop / R&B
  { title: 'Billie Jean', artist: 'Michael Jackson' },
  { title: 'Thriller', artist: 'Michael Jackson' },
  { title: 'Beat It', artist: 'Michael Jackson' },
  { title: 'Man in the Mirror', artist: 'Michael Jackson' },
  { title: 'I Will Always Love You', artist: 'Whitney Houston' },
  { title: 'Greatest Love of All', artist: 'Whitney Houston' },
  { title: 'Like a Virgin', artist: 'Madonna' },
  { title: 'Material Girl', artist: 'Madonna' },
  { title: "Papa Don't Preach", artist: 'Madonna' },
  { title: 'Take On Me', artist: 'a-ha' },
  { title: "Don't You (Forget About Me)", artist: 'Simple Minds' },
  { title: "Sweet Child O' Mine", artist: "Guns N' Roses" },
  { title: 'November Rain', artist: "Guns N' Roses" },
  { title: 'Under the Bridge', artist: 'Red Hot Chili Peppers' },
  { title: 'Losing My Religion', artist: 'R.E.M.' },
  { title: 'Everybody Hurts', artist: 'R.E.M.' },
  { title: 'No Scrubs', artist: 'TLC' },
  { title: 'Waterfalls', artist: 'TLC' },
  { title: 'I Want It That Way', artist: 'Backstreet Boys' },
  { title: 'Baby One More Time', artist: 'Britney Spears' },

  // 2000s Hits
  { title: 'Crazy in Love', artist: 'Beyoncé' },
  { title: 'Single Ladies', artist: 'Beyoncé' },
  { title: 'Halo', artist: 'Beyoncé' },
  { title: 'Yeah!', artist: 'Usher' },
  { title: 'Confessions Part II', artist: 'Usher' },
  { title: 'In Da Club', artist: '50 Cent' },
  { title: 'Hey Ya!', artist: 'OutKast' },
  { title: 'Lose Yourself', artist: 'Eminem' },
  { title: 'Without Me', artist: 'Eminem' },
  { title: 'Rolling in the Deep', artist: 'Adele' },
  { title: 'Someone Like You', artist: 'Adele' },
  { title: 'Hello', artist: 'Adele' },
  { title: 'Umbrella', artist: 'Rihanna' },
  { title: 'We Found Love', artist: 'Rihanna' },
  { title: 'Diamonds', artist: 'Rihanna' },
  { title: 'Just Dance', artist: 'Lady Gaga' },
  { title: 'Poker Face', artist: 'Lady Gaga' },
  { title: 'Bad Romance', artist: 'Lady Gaga' },
  { title: 'Love Story', artist: 'Taylor Swift' },
  { title: 'You Belong with Me', artist: 'Taylor Swift' },

  // 2010s Modern Hits
  { title: 'Shape of You', artist: 'Ed Sheeran' },
  { title: 'Thinking Out Loud', artist: 'Ed Sheeran' },
  { title: 'Perfect', artist: 'Ed Sheeran' },
  { title: 'Photograph', artist: 'Ed Sheeran' },
  { title: 'Shake It Off', artist: 'Taylor Swift' },
  { title: 'Blank Space', artist: 'Taylor Swift' },
  { title: 'Anti-Hero', artist: 'Taylor Swift' },
  { title: 'Bad Guy', artist: 'Billie Eilish' },
  { title: 'Happier Than Ever', artist: 'Billie Eilish' },
  { title: 'Ocean Eyes', artist: 'Billie Eilish' },
  { title: 'Blinding Lights', artist: 'The Weeknd' },
  { title: 'Starboy', artist: 'The Weeknd' },
  { title: 'Save Your Tears', artist: 'The Weeknd' },
  { title: "Can't Feel My Face", artist: 'The Weeknd' },
  { title: "God's Plan", artist: 'Drake' },
  { title: 'Hotline Bling', artist: 'Drake' },
  { title: 'One Dance', artist: 'Drake' },
  { title: 'HUMBLE.', artist: 'Kendrick Lamar' },
  { title: 'All the Stars', artist: 'Kendrick Lamar' },
  { title: 'Uptown Funk', artist: 'Mark Ronson ft. Bruno Mars' },
  { title: "That's What I Like", artist: 'Bruno Mars' },
  { title: '24K Magic', artist: 'Bruno Mars' },
  { title: 'Locked Out of Heaven', artist: 'Bruno Mars' },
  { title: 'Happy', artist: 'Pharrell Williams' },
  { title: 'Get Lucky', artist: 'Daft Punk ft. Pharrell Williams' },
  { title: 'Somebody That I Used to Know', artist: 'Gotye ft. Kimbra' },
  { title: 'Call Me Maybe', artist: 'Carly Rae Jepsen' },
  { title: 'Stay', artist: 'Rihanna ft. Mikky Ekko' },

  // 2020s Hits
  { title: 'Levitating', artist: 'Dua Lipa' },
  { title: "Don't Start Now", artist: 'Dua Lipa' },
  { title: 'Physical', artist: 'Dua Lipa' },
  { title: 'drivers license', artist: 'Olivia Rodrigo' },
  { title: 'good 4 u', artist: 'Olivia Rodrigo' },
  { title: 'brutal', artist: 'Olivia Rodrigo' },
  { title: 'Industry Baby', artist: 'Lil Nas X ft. Jack Harlow' },
  { title: 'Montero (Call Me By Your Name)', artist: 'Lil Nas X' },
  { title: 'As It Was', artist: 'Harry Styles' },
  { title: 'Watermelon Sugar', artist: 'Harry Styles' },
  { title: 'Heat Waves', artist: 'Glass Animals' },
  { title: 'Stay', artist: 'The Kid LAROI & Justin Bieber' },
  { title: 'Peaches', artist: 'Justin Bieber ft. Daniel Caesar & Giveon' },
  { title: 'Easy On Me', artist: 'Adele' },
  { title: 'abcdefu', artist: 'GAYLE' },

  // Country
  { title: 'Jolene', artist: 'Dolly Parton' },
  { title: 'Friends in Low Places', artist: 'Garth Brooks' },
  { title: 'Humble and Kind', artist: 'Tim McGraw' },
  { title: 'Old Town Road', artist: 'Lil Nas X ft. Billy Ray Cyrus' },
  { title: 'Body Like a Back Road', artist: 'Sam Hunt' },
];

// ---------------------------------------------------------------------------
// Token cache
// ---------------------------------------------------------------------------

interface TokenCache {
  accessToken: string;
  expiresAt: number; // Unix ms timestamp
}

let tokenCache: TokenCache | null = null;

const TOKEN_REFRESH_BUFFER_MS = 60_000; // refresh 60 s before expiry

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Fetch a new Client Credentials access token from Spotify.
 * Returns null when credentials are not configured.
 */
async function fetchAccessToken(): Promise<string | null> {
  if (!isConfigured()) {
    return null;
  }

  const credentials = Buffer.from(
    `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`,
  ).toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error(
      `Spotify token request failed: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };

  return data.access_token;
}

/**
 * Return a valid cached access token, refreshing it when necessary.
 * Returns null when Spotify is not configured or the request fails.
 */
async function getAccessToken(): Promise<string | null> {
  if (!isConfigured()) {
    return null;
  }

  const now = Date.now();

  if (
    tokenCache !== null &&
    tokenCache.expiresAt - TOKEN_REFRESH_BUFFER_MS > now
  ) {
    return tokenCache.accessToken;
  }

  const token = await fetchAccessToken();
  if (token === null) {
    return null;
  }

  // Spotify tokens are valid for 3600 s by default; store relative to now.
  tokenCache = {
    accessToken: token,
    // We don't have the exact expires_in here after refactor, so use 3600 s.
    expiresAt: now + 3600 * 1000,
  };

  return token;
}

/**
 * Search the local catalog with a case-insensitive partial match on title or
 * artist. Returns up to `limit` results with null Spotify-specific fields.
 */
function searchLocalCatalog(query: string, limit: number): SpotifyTrackResult[] {
  const lower = query.toLowerCase();
  return LOCAL_CATALOG.filter(
    (song) =>
      song.title.toLowerCase().includes(lower) ||
      song.artist.toLowerCase().includes(lower),
  )
    .slice(0, limit)
    .map((song) => ({
      title: song.title,
      artist: song.artist,
      spotifyId: null,
      albumArt: null,
      previewUrl: null,
    }));
}

// ---------------------------------------------------------------------------
// Spotify API response types (internal)
// ---------------------------------------------------------------------------

interface SpotifyImage {
  url: string;
  width: number | null;
  height: number | null;
}

interface SpotifyTrackItem {
  id: string;
  name: string;
  preview_url: string | null;
  artists: Array<{ name: string }>;
  album: {
    images: SpotifyImage[];
  };
}

interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrackItem[];
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns true when both SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are
 * non-empty strings in the environment.
 */
export function isConfigured(): boolean {
  return SPOTIFY_CLIENT_ID.length > 0 && SPOTIFY_CLIENT_SECRET.length > 0;
}

/**
 * Search for tracks matching `query`.
 *
 * When Spotify is configured and reachable, results come from the Spotify
 * Web API (/v1/search?type=track). On any failure — or when credentials are
 * absent — the function gracefully falls back to the local song catalog.
 *
 * @param query - The search string.
 * @param limit - Maximum number of results (default 10).
 */
export async function searchTracks(
  query: string,
  limit = 10,
): Promise<SpotifyTrackResult[]> {
  if (!isConfigured()) {
    return searchLocalCatalog(query, limit);
  }

  let accessToken: string | null;
  try {
    accessToken = await getAccessToken();
  } catch {
    return searchLocalCatalog(query, limit);
  }

  if (accessToken === null) {
    return searchLocalCatalog(query, limit);
  }

  const url = new URL('https://api.spotify.com/v1/search');
  url.searchParams.set('q', query);
  url.searchParams.set('type', 'track');
  url.searchParams.set('limit', String(limit));

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch {
    return searchLocalCatalog(query, limit);
  }

  if (!response.ok) {
    return searchLocalCatalog(query, limit);
  }

  let data: SpotifySearchResponse;
  try {
    data = (await response.json()) as SpotifySearchResponse;
  } catch {
    return searchLocalCatalog(query, limit);
  }

  const items = data.tracks?.items ?? [];

  return items.map((item) => {
    // Pick the smallest image (last in Spotify's array, ordered largest-first).
    const images = item.album?.images ?? [];
    const albumArt =
      images.length > 0 ? (images[images.length - 1].url ?? null) : null;

    return {
      title: item.name,
      artist: item.artists?.[0]?.name ?? 'Unknown Artist',
      spotifyId: item.id,
      albumArt,
      previewUrl: item.preview_url ?? null,
    };
  });
}
