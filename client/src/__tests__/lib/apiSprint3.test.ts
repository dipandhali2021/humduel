import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getDailyChallenge,
  submitDailyGuess,
  getDailyResult,
  getLeaderboard,
  createUser,
  getUser,
  updateUser,
  getUserStats,
  searchSongs,
  ApiError,
} from '@/lib/api';

// ---------------------------------------------------------------------------
// Mock fetch globally
// ---------------------------------------------------------------------------

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockOkResponse(body: unknown) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(body),
  } as Response);
}

function mockErrorResponse(status: number, body: unknown) {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

function mockErrorResponseNonJson(status: number) {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.reject(new SyntaxError('not JSON')),
  } as Response);
}

// ─── Shared beforeEach / afterEach ────────────────────────────────────────────

beforeEach(() => {
  mockFetch.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// getDailyChallenge
// ---------------------------------------------------------------------------

describe('getDailyChallenge', () => {
  const challengeBody = {
    date: '2026-04-05',
    puzzleNumber: 42,
    songHint: 'A British rock anthem',
    maxAttempts: 6,
    attemptsUsed: 0,
    completed: false,
    correct: null,
  };

  it('sends a GET request with sessionId as a query parameter', async () => {
    mockFetch.mockReturnValueOnce(mockOkResponse(challengeBody));

    await getDailyChallenge('session-abc');

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain('/api/daily');
    expect(url).toContain('sessionId=session-abc');
  });

  it('returns the parsed challenge response on success', async () => {
    mockFetch.mockReturnValueOnce(mockOkResponse(challengeBody));

    const result = await getDailyChallenge('session-abc');
    expect(result).toEqual(challengeBody);
  });

  it('throws ApiError on non-ok response', async () => {
    mockFetch.mockReturnValueOnce(
      mockErrorResponse(404, { error: 'No puzzle today', code: 'NOT_FOUND' }),
    );

    await expect(getDailyChallenge('session-abc')).rejects.toThrow(ApiError);
  });

  it('URL-encodes the sessionId in the query string', async () => {
    mockFetch.mockReturnValueOnce(mockOkResponse(challengeBody));

    await getDailyChallenge('session with spaces');

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain('session+with+spaces');
  });
});

// ---------------------------------------------------------------------------
// submitDailyGuess
// ---------------------------------------------------------------------------

describe('submitDailyGuess', () => {
  const guessBody = {
    correct: false,
    attemptsUsed: 1,
    attemptsRemaining: 5,
    maxAttempts: 6,
    timeTakenSeconds: null,
    song: null,
  };

  it('sends a POST to /api/daily/guess', async () => {
    mockFetch.mockReturnValueOnce(mockOkResponse(guessBody));

    await submitDailyGuess('Bohemian Rhapsody', 'session-abc');

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/api/daily/guess');
    expect(init.method).toBe('POST');
  });

  it('sends correct JSON body with guess and sessionId', async () => {
    mockFetch.mockReturnValueOnce(mockOkResponse(guessBody));

    await submitDailyGuess('Bohemian Rhapsody', 'session-abc');

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' });
    const parsed = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(parsed.guess).toBe('Bohemian Rhapsody');
    expect(parsed.sessionId).toBe('session-abc');
  });

  it('includes userId in the body when provided', async () => {
    mockFetch.mockReturnValueOnce(mockOkResponse(guessBody));

    await submitDailyGuess('Imagine', 'session-xyz', 'user-123');

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const parsed = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(parsed.userId).toBe('user-123');
  });

  it('sends userId as undefined when not provided', async () => {
    mockFetch.mockReturnValueOnce(mockOkResponse(guessBody));

    await submitDailyGuess('Hey Jude', 'session-xyz');

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const parsed = JSON.parse(init.body as string) as Record<string, unknown>;
    // JSON.stringify drops undefined values, so userId won't appear
    expect(parsed).not.toHaveProperty('userId');
  });

  it('returns parsed guess response on success', async () => {
    mockFetch.mockReturnValueOnce(mockOkResponse(guessBody));

    const result = await submitDailyGuess('Bohemian Rhapsody', 'session-abc');
    expect(result).toEqual(guessBody);
  });

  it('throws ApiError on 400 response', async () => {
    mockFetch.mockReturnValueOnce(
      mockErrorResponse(400, { error: 'Guess cannot be empty', code: 'VALIDATION_ERROR' }),
    );

    await expect(submitDailyGuess('', 'session-abc')).rejects.toThrow(ApiError);
  });
});

// ---------------------------------------------------------------------------
// getDailyResult
// ---------------------------------------------------------------------------

describe('getDailyResult', () => {
  const resultBody = {
    date: '2026-04-05',
    puzzleNumber: 42,
    completed: true,
    correct: true,
    attemptsUsed: 2,
    maxAttempts: 6,
    timeTakenSeconds: 30,
    song: {
      title: 'Bohemian Rhapsody',
      artist: 'Queen',
      spotifyId: null,
      albumArt: null,
      previewUrl: null,
    },
    shareText: 'HumDuel #42 2/6',
  };

  it('sends a GET request to /api/daily/result with sessionId query param', async () => {
    mockFetch.mockReturnValueOnce(mockOkResponse(resultBody));

    await getDailyResult('session-abc');

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain('/api/daily/result');
    expect(url).toContain('sessionId=session-abc');
  });

  it('returns parsed result response on success', async () => {
    mockFetch.mockReturnValueOnce(mockOkResponse(resultBody));

    const result = await getDailyResult('session-abc');
    expect(result).toEqual(resultBody);
  });

  it('throws ApiError when session is not found', async () => {
    mockFetch.mockReturnValueOnce(
      mockErrorResponse(404, { error: 'Session not found', code: 'SESSION_NOT_FOUND' }),
    );

    try {
      await getDailyResult('missing-session');
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(404);
      expect(apiErr.code).toBe('SESSION_NOT_FOUND');
    }
  });
});

// ---------------------------------------------------------------------------
// getLeaderboard
// ---------------------------------------------------------------------------

describe('getLeaderboard', () => {
  const leaderboardBody = {
    date: '2026-04-05',
    puzzleNumber: 42,
    entries: [],
  };

  it('calls /api/leaderboard with no date query param when date is omitted', async () => {
    mockFetch.mockReturnValueOnce(mockOkResponse(leaderboardBody));

    await getLeaderboard();

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain('/api/leaderboard');
    expect(url).not.toContain('date=');
  });

  it('includes date query param when date is provided', async () => {
    mockFetch.mockReturnValueOnce(mockOkResponse(leaderboardBody));

    await getLeaderboard('2026-04-05');

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain('/api/leaderboard');
    expect(url).toContain('date=2026-04-05');
  });

  it('returns parsed leaderboard response', async () => {
    const body = {
      ...leaderboardBody,
      entries: [
        {
          rank: 1,
          nickname: 'AliceRocks',
          userId: 'user-alice',
          attemptsUsed: 1,
          timeTakenSeconds: 12,
          completedAt: '2026-04-05T10:00:00Z',
        },
      ],
    };
    mockFetch.mockReturnValueOnce(mockOkResponse(body));

    const result = await getLeaderboard('2026-04-05');
    expect(result).toEqual(body);
  });

  it('throws ApiError on non-ok response', async () => {
    mockFetch.mockReturnValueOnce(
      mockErrorResponse(500, { error: 'Internal server error', code: 'SERVER_ERROR' }),
    );

    await expect(getLeaderboard('2026-04-05')).rejects.toThrow(ApiError);
  });
});

// ---------------------------------------------------------------------------
// createUser
// ---------------------------------------------------------------------------

describe('createUser', () => {
  const userBody = {
    id: 'user-123',
    nickname: 'MelodyMaster',
    avatar: 'M',
    createdAt: '2026-01-15T00:00:00Z',
  };

  it('sends a POST to /api/users with the correct JSON body', async () => {
    mockFetch.mockReturnValueOnce(mockOkResponse(userBody));

    await createUser('MelodyMaster');

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/api/users');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' });
    const parsed = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(parsed.nickname).toBe('MelodyMaster');
  });

  it('returns the created user on success', async () => {
    mockFetch.mockReturnValueOnce(mockOkResponse(userBody));

    const result = await createUser('MelodyMaster');
    expect(result).toEqual(userBody);
  });

  it('throws ApiError on 409 conflict (nickname taken)', async () => {
    mockFetch.mockReturnValueOnce(
      mockErrorResponse(409, { error: 'Nickname already taken', code: 'NICKNAME_CONFLICT' }),
    );

    try {
      await createUser('TakenName');
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(409);
      expect(apiErr.code).toBe('NICKNAME_CONFLICT');
    }
  });
});

// ---------------------------------------------------------------------------
// getUser
// ---------------------------------------------------------------------------

describe('getUser', () => {
  const userBody = {
    id: 'user-123',
    nickname: 'MelodyMaster',
    avatar: 'M',
    createdAt: '2026-01-15T00:00:00Z',
  };

  it('sends a GET request to /api/users/:id with the correct URL', async () => {
    mockFetch.mockReturnValueOnce(mockOkResponse(userBody));

    await getUser('user-123');

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain('/api/users/user-123');
  });

  it('URL-encodes the user ID', async () => {
    mockFetch.mockReturnValueOnce(mockOkResponse(userBody));

    await getUser('user/with/slashes');

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain('user%2Fwith%2Fslashes');
  });

  it('returns the parsed user on success', async () => {
    mockFetch.mockReturnValueOnce(mockOkResponse(userBody));

    const result = await getUser('user-123');
    expect(result).toEqual(userBody);
  });

  it('throws ApiError on 404 not found', async () => {
    mockFetch.mockReturnValueOnce(
      mockErrorResponse(404, { error: 'User not found', code: 'NOT_FOUND' }),
    );

    await expect(getUser('nonexistent')).rejects.toThrow(ApiError);
  });
});

// ---------------------------------------------------------------------------
// updateUser
// ---------------------------------------------------------------------------

describe('updateUser', () => {
  const updatedUserBody = {
    id: 'user-123',
    nickname: 'NewNickname',
    avatar: 'N',
    createdAt: '2026-01-15T00:00:00Z',
  };

  it('sends a PUT request to /api/users/:id with the correct URL', async () => {
    mockFetch.mockReturnValueOnce(mockOkResponse(updatedUserBody));

    await updateUser('user-123', 'NewNickname');

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/api/users/user-123');
    expect(init.method).toBe('PUT');
  });

  it('sends correct JSON body with the new nickname', async () => {
    mockFetch.mockReturnValueOnce(mockOkResponse(updatedUserBody));

    await updateUser('user-123', 'NewNickname');

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' });
    const parsed = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(parsed.nickname).toBe('NewNickname');
  });

  it('returns the updated user on success', async () => {
    mockFetch.mockReturnValueOnce(mockOkResponse(updatedUserBody));

    const result = await updateUser('user-123', 'NewNickname');
    expect(result).toEqual(updatedUserBody);
  });

  it('throws ApiError on 400 validation error', async () => {
    mockFetch.mockReturnValueOnce(
      mockErrorResponse(400, { error: 'Invalid nickname', code: 'VALIDATION_ERROR' }),
    );

    try {
      await updateUser('user-123', '');
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(400);
      expect(apiErr.code).toBe('VALIDATION_ERROR');
      expect(apiErr.message).toBe('Invalid nickname');
    }
  });

  it('throws ApiError on non-JSON error response', async () => {
    mockFetch.mockReturnValueOnce(mockErrorResponseNonJson(503));

    try {
      await updateUser('user-123', 'Nickname');
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(503);
      expect(apiErr.code).toBe('503');
    }
  });
});

// ---------------------------------------------------------------------------
// getUserStats
// ---------------------------------------------------------------------------

describe('getUserStats', () => {
  const statsBody = {
    userId: 'user-123',
    nickname: 'MelodyMaster',
    gamesPlayed: 10,
    gamesWon: 7,
    winRate: 0.7,
    currentStreak: 3,
    bestStreak: 5,
    avgTimeSeconds: 45,
    recentGames: [],
  };

  it('sends a GET request to /api/users/:id/stats', async () => {
    mockFetch.mockReturnValueOnce(mockOkResponse(statsBody));

    await getUserStats('user-123');

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain('/api/users/user-123/stats');
  });

  it('URL-encodes the user ID in the stats URL', async () => {
    mockFetch.mockReturnValueOnce(mockOkResponse(statsBody));

    await getUserStats('user id with spaces');

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain('user%20id%20with%20spaces');
  });

  it('returns parsed stats response on success', async () => {
    mockFetch.mockReturnValueOnce(mockOkResponse(statsBody));

    const result = await getUserStats('user-123');
    expect(result).toEqual(statsBody);
  });

  it('throws ApiError on 404 not found', async () => {
    mockFetch.mockReturnValueOnce(
      mockErrorResponse(404, { error: 'User not found', code: 'NOT_FOUND' }),
    );

    await expect(getUserStats('nonexistent')).rejects.toThrow(ApiError);
  });
});

// ---------------------------------------------------------------------------
// searchSongs
// ---------------------------------------------------------------------------

describe('searchSongs', () => {
  const searchResultBody = [
    {
      title: 'Bohemian Rhapsody',
      artist: 'Queen',
      spotifyId: 'spotify-123',
      albumArt: 'https://example.com/art.jpg',
      previewUrl: 'https://example.com/preview.mp3',
    },
  ];

  it('sends a GET request to /api/songs/search with query param q', async () => {
    mockFetch.mockReturnValueOnce(mockOkResponse(searchResultBody));

    await searchSongs('bohemian');

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain('/api/songs/search');
    expect(url).toContain('q=bohemian');
  });

  it('URL-encodes the search query', async () => {
    mockFetch.mockReturnValueOnce(mockOkResponse(searchResultBody));

    await searchSongs('bohemian rhapsody');

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain('q=bohemian+rhapsody');
  });

  it('returns the array of search results on success', async () => {
    mockFetch.mockReturnValueOnce(mockOkResponse(searchResultBody));

    const result = await searchSongs('bohemian');
    expect(result).toEqual(searchResultBody);
  });

  it('returns an empty array when no results match', async () => {
    mockFetch.mockReturnValueOnce(mockOkResponse([]));

    const result = await searchSongs('xyznonexistent');
    expect(result).toEqual([]);
  });

  it('throws ApiError on server error', async () => {
    mockFetch.mockReturnValueOnce(
      mockErrorResponse(500, { error: 'Search service unavailable', code: 'SEARCH_ERROR' }),
    );

    try {
      await searchSongs('anything');
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(500);
      expect(apiErr.code).toBe('SEARCH_ERROR');
    }
  });
});
