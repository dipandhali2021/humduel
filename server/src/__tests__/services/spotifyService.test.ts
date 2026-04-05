/**
 * Unit tests for spotifyService.ts
 *
 * Mocking strategy:
 *   - `config.js` is mocked so credentials can be toggled per test group.
 *   - `fetch` is replaced with a vi.fn() stub so no real HTTP calls occur.
 *
 * The module is imported fresh for each credential scenario using
 * vi.resetModules() + dynamic import so the module-level tokenCache is reset.
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Shared fetch mock — must be defined before vi.mock() factories run.
// ---------------------------------------------------------------------------

const mockFetch = vi.fn<typeof fetch>();

vi.stubGlobal('fetch', mockFetch);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTokenResponse(expiresIn = 3600): Response {
  return new Response(
    JSON.stringify({ access_token: 'test-token', expires_in: expiresIn }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

function makeSearchResponse(items: object[]): Response {
  return new Response(
    JSON.stringify({ tracks: { items } }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

function makeSpotifyTrackItem(overrides: Partial<{
  id: string;
  name: string;
  preview_url: string | null;
  artistName: string;
  images: Array<{ url: string; width: number; height: number }>;
}> = {}) {
  const {
    id = 'spotify-id-1',
    name = 'Bohemian Rhapsody',
    preview_url = 'https://preview.example.com/1.mp3',
    artistName = 'Queen',
    images = [
      { url: 'https://img.example.com/large.jpg', width: 640, height: 640 },
      { url: 'https://img.example.com/medium.jpg', width: 300, height: 300 },
      { url: 'https://img.example.com/small.jpg', width: 64, height: 64 },
    ],
  } = overrides;

  return {
    id,
    name,
    preview_url,
    artists: [{ name: artistName }],
    album: { images },
  };
}

// ---------------------------------------------------------------------------
// isConfigured()
// ---------------------------------------------------------------------------

describe('isConfigured()', () => {
  it('returns true when both credentials are non-empty', async () => {
    vi.resetModules();
    vi.doMock('../../config.js', () => ({
      SPOTIFY_CLIENT_ID: 'client-id',
      SPOTIFY_CLIENT_SECRET: 'client-secret',
    }));
    const { isConfigured } = await import('../../services/spotifyService.js');
    expect(isConfigured()).toBe(true);
  });

  it('returns false when SPOTIFY_CLIENT_ID is empty', async () => {
    vi.resetModules();
    vi.doMock('../../config.js', () => ({
      SPOTIFY_CLIENT_ID: '',
      SPOTIFY_CLIENT_SECRET: 'client-secret',
    }));
    const { isConfigured } = await import('../../services/spotifyService.js');
    expect(isConfigured()).toBe(false);
  });

  it('returns false when SPOTIFY_CLIENT_SECRET is empty', async () => {
    vi.resetModules();
    vi.doMock('../../config.js', () => ({
      SPOTIFY_CLIENT_ID: 'client-id',
      SPOTIFY_CLIENT_SECRET: '',
    }));
    const { isConfigured } = await import('../../services/spotifyService.js');
    expect(isConfigured()).toBe(false);
  });

  it('returns false when both credentials are empty', async () => {
    vi.resetModules();
    vi.doMock('../../config.js', () => ({
      SPOTIFY_CLIENT_ID: '',
      SPOTIFY_CLIENT_SECRET: '',
    }));
    const { isConfigured } = await import('../../services/spotifyService.js');
    expect(isConfigured()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// searchTracks() — local catalog fallback (no credentials)
// ---------------------------------------------------------------------------

describe('searchTracks() — local catalog fallback', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doMock('../../config.js', () => ({
      SPOTIFY_CLIENT_ID: '',
      SPOTIFY_CLIENT_SECRET: '',
    }));
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not call fetch when credentials are absent', async () => {
    const { searchTracks } = await import('../../services/spotifyService.js');
    await searchTracks('Queen');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns local results matching title', async () => {
    const { searchTracks } = await import('../../services/spotifyService.js');
    const results = await searchTracks('Bohemian');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toBe('Bohemian Rhapsody');
    expect(results[0].artist).toBe('Queen');
  });

  it('returns local results matching artist', async () => {
    const { searchTracks } = await import('../../services/spotifyService.js');
    const results = await searchTracks('Taylor Swift');
    expect(results.length).toBeGreaterThan(0);
    results.forEach((r) => expect(r.artist).toBe('Taylor Swift'));
  });

  it('returns results with null Spotify-specific fields', async () => {
    const { searchTracks } = await import('../../services/spotifyService.js');
    const results = await searchTracks('Adele');
    expect(results.length).toBeGreaterThan(0);
    results.forEach((r) => {
      expect(r.spotifyId).toBeNull();
      expect(r.albumArt).toBeNull();
      expect(r.previewUrl).toBeNull();
    });
  });

  it('respects the limit parameter', async () => {
    const { searchTracks } = await import('../../services/spotifyService.js');
    const results = await searchTracks('a', 3);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it('returns empty array for unmatched query', async () => {
    const { searchTracks } = await import('../../services/spotifyService.js');
    const results = await searchTracks('zzz_no_match_zzz_xyz');
    expect(results).toEqual([]);
  });

  it('is case-insensitive', async () => {
    const { searchTracks } = await import('../../services/spotifyService.js');
    const lower = await searchTracks('queen');
    const upper = await searchTracks('QUEEN');
    expect(lower.length).toBe(upper.length);
    expect(lower.map((r) => r.title)).toEqual(upper.map((r) => r.title));
  });

  it('returns at most 10 results by default', async () => {
    const { searchTracks } = await import('../../services/spotifyService.js');
    const results = await searchTracks('the');
    expect(results.length).toBeLessThanOrEqual(10);
  });
});

// ---------------------------------------------------------------------------
// searchTracks() — Spotify configured
// ---------------------------------------------------------------------------

describe('searchTracks() — Spotify API path', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doMock('../../config.js', () => ({
      SPOTIFY_CLIENT_ID: 'test-client-id',
      SPOTIFY_CLIENT_SECRET: 'test-client-secret',
    }));
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('requests a token using Basic auth and client_credentials grant', async () => {
    const trackItem = makeSpotifyTrackItem();
    mockFetch
      .mockResolvedValueOnce(makeTokenResponse())
      .mockResolvedValueOnce(makeSearchResponse([trackItem]));

    const { searchTracks } = await import('../../services/spotifyService.js');
    await searchTracks('Queen');

    const tokenCall = mockFetch.mock.calls[0];
    expect(tokenCall[0]).toBe('https://accounts.spotify.com/api/token');

    const tokenInit = tokenCall[1] as RequestInit;
    expect(tokenInit.method).toBe('POST');
    expect((tokenInit.headers as Record<string, string>)['Authorization']).toMatch(
      /^Basic /,
    );
    const encoded = (tokenInit.headers as Record<string, string>)['Authorization'].slice(6);
    const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
    expect(decoded).toBe('test-client-id:test-client-secret');
    expect(tokenInit.body).toBe('grant_type=client_credentials');
  });

  it('searches the /v1/search endpoint with Bearer token', async () => {
    const trackItem = makeSpotifyTrackItem();
    mockFetch
      .mockResolvedValueOnce(makeTokenResponse())
      .mockResolvedValueOnce(makeSearchResponse([trackItem]));

    const { searchTracks } = await import('../../services/spotifyService.js');
    await searchTracks('Queen', 5);

    const searchCall = mockFetch.mock.calls[1];
    const searchUrl = searchCall[0] as string;
    expect(searchUrl).toContain('https://api.spotify.com/v1/search');
    expect(searchUrl).toContain('q=Queen');
    expect(searchUrl).toContain('type=track');
    expect(searchUrl).toContain('limit=5');

    const searchInit = searchCall[1] as RequestInit;
    expect((searchInit.headers as Record<string, string>)['Authorization']).toBe(
      'Bearer test-token',
    );
  });

  it('maps Spotify track items to SpotifyTrackResult', async () => {
    const trackItem = makeSpotifyTrackItem({
      id: 'spotify-abc',
      name: 'Bohemian Rhapsody',
      preview_url: 'https://preview.example.com/br.mp3',
      artistName: 'Queen',
      images: [
        { url: 'https://img.example.com/large.jpg', width: 640, height: 640 },
        { url: 'https://img.example.com/small.jpg', width: 64, height: 64 },
      ],
    });

    mockFetch
      .mockResolvedValueOnce(makeTokenResponse())
      .mockResolvedValueOnce(makeSearchResponse([trackItem]));

    const { searchTracks } = await import('../../services/spotifyService.js');
    const results = await searchTracks('Bohemian Rhapsody');

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      title: 'Bohemian Rhapsody',
      artist: 'Queen',
      spotifyId: 'spotify-abc',
      // Smallest image is last in Spotify's array
      albumArt: 'https://img.example.com/small.jpg',
      previewUrl: 'https://preview.example.com/br.mp3',
    });
  });

  it('sets albumArt to null when the album has no images', async () => {
    const trackItem = makeSpotifyTrackItem({ images: [] });
    mockFetch
      .mockResolvedValueOnce(makeTokenResponse())
      .mockResolvedValueOnce(makeSearchResponse([trackItem]));

    const { searchTracks } = await import('../../services/spotifyService.js');
    const results = await searchTracks('Queen');
    expect(results[0].albumArt).toBeNull();
  });

  it('maps preview_url to null when absent', async () => {
    const trackItem = makeSpotifyTrackItem({ preview_url: null });
    mockFetch
      .mockResolvedValueOnce(makeTokenResponse())
      .mockResolvedValueOnce(makeSearchResponse([trackItem]));

    const { searchTracks } = await import('../../services/spotifyService.js');
    const results = await searchTracks('Queen');
    expect(results[0].previewUrl).toBeNull();
  });

  it('falls back to local catalog when token request fails (network error)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { searchTracks } = await import('../../services/spotifyService.js');
    const results = await searchTracks('Queen');

    // Local catalog contains Queen songs
    expect(results.length).toBeGreaterThan(0);
    results.forEach((r) => {
      expect(r.spotifyId).toBeNull();
    });
  });

  it('falls back to local catalog when token endpoint returns non-200', async () => {
    mockFetch.mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }));

    const { searchTracks } = await import('../../services/spotifyService.js');
    const results = await searchTracks('Queen');

    expect(results.length).toBeGreaterThan(0);
    results.forEach((r) => expect(r.spotifyId).toBeNull());
  });

  it('falls back to local catalog when search endpoint returns non-200', async () => {
    mockFetch
      .mockResolvedValueOnce(makeTokenResponse())
      .mockResolvedValueOnce(new Response('Server Error', { status: 500 }));

    const { searchTracks } = await import('../../services/spotifyService.js');
    const results = await searchTracks('Queen');

    expect(results.length).toBeGreaterThan(0);
    results.forEach((r) => expect(r.spotifyId).toBeNull());
  });

  it('falls back to local catalog when search fetch throws', async () => {
    mockFetch
      .mockResolvedValueOnce(makeTokenResponse())
      .mockRejectedValueOnce(new Error('Connection refused'));

    const { searchTracks } = await import('../../services/spotifyService.js');
    const results = await searchTracks('Drake');

    expect(results.length).toBeGreaterThan(0);
    results.forEach((r) => expect(r.spotifyId).toBeNull());
  });

  it('falls back to local catalog when search response body is malformed JSON', async () => {
    mockFetch
      .mockResolvedValueOnce(makeTokenResponse())
      .mockResolvedValueOnce(
        new Response('not-json', { status: 200, headers: { 'Content-Type': 'application/json' } }),
      );

    const { searchTracks } = await import('../../services/spotifyService.js');
    const results = await searchTracks('Drake');

    expect(results.length).toBeGreaterThan(0);
    results.forEach((r) => expect(r.spotifyId).toBeNull());
  });

  it('reuses a cached token on a second call (only one token request total)', async () => {
    const trackItem = makeSpotifyTrackItem();
    mockFetch
      .mockResolvedValueOnce(makeTokenResponse(3600))
      .mockResolvedValueOnce(makeSearchResponse([trackItem]))
      .mockResolvedValueOnce(makeSearchResponse([trackItem]));

    const { searchTracks } = await import('../../services/spotifyService.js');
    await searchTracks('Queen');
    await searchTracks('Adele');

    // First call: token + search; second call: search only (token cached)
    expect(mockFetch).toHaveBeenCalledTimes(3);
    const urls = mockFetch.mock.calls.map((c) => c[0] as string);
    expect(urls.filter((u) => u === 'https://accounts.spotify.com/api/token')).toHaveLength(1);
  });

  it('handles multiple track items in the response', async () => {
    const items = [
      makeSpotifyTrackItem({ id: 'id-1', name: 'Song A', artistName: 'Artist A' }),
      makeSpotifyTrackItem({ id: 'id-2', name: 'Song B', artistName: 'Artist B' }),
      makeSpotifyTrackItem({ id: 'id-3', name: 'Song C', artistName: 'Artist C' }),
    ];
    mockFetch
      .mockResolvedValueOnce(makeTokenResponse())
      .mockResolvedValueOnce(makeSearchResponse(items));

    const { searchTracks } = await import('../../services/spotifyService.js');
    const results = await searchTracks('Song', 3);

    expect(results).toHaveLength(3);
    expect(results[0].spotifyId).toBe('id-1');
    expect(results[1].spotifyId).toBe('id-2');
    expect(results[2].spotifyId).toBe('id-3');
  });

  it('returns empty array when Spotify returns no items', async () => {
    mockFetch
      .mockResolvedValueOnce(makeTokenResponse())
      .mockResolvedValueOnce(makeSearchResponse([]));

    const { searchTracks } = await import('../../services/spotifyService.js');
    const results = await searchTracks('zzz_no_results_zzz');
    expect(results).toEqual([]);
  });
});
