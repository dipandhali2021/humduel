import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createChallenge,
  getChallenge,
  submitGuess,
  getChallengeResult,
  healthCheck,
  ApiError,
} from '@/lib/api';

// ---------------------------------------------------------------------------
// Mock fetch globally
// ---------------------------------------------------------------------------

const mockFetch = vi.fn();
global.fetch = mockFetch;

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

// ---------------------------------------------------------------------------
// createChallenge
// ---------------------------------------------------------------------------

describe('createChallenge', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends a POST request to /api/challenges', async () => {
    const responseBody = {
      id: 'abc123',
      challengeUrl: 'http://localhost:3001/challenge/abc123',
      expiresAt: '2025-01-01T00:00:00Z',
      createdAt: '2024-12-31T00:00:00Z',
    };
    mockFetch.mockReturnValueOnce(mockOkResponse(responseBody));

    await createChallenge({
      audio: new Blob(['audio'], { type: 'audio/webm' }),
      waveformData: [0.1, 0.5, 0.8],
      songTitle: 'Bohemian Rhapsody',
      songArtist: 'Queen',
      durationSeconds: 12,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/api/challenges');
    expect(init.method).toBe('POST');
  });

  it('sends FormData with correct fields', async () => {
    const responseBody = {
      id: 'abc123',
      challengeUrl: 'http://localhost:3001/challenge/abc123',
      expiresAt: '2025-01-01T00:00:00Z',
      createdAt: '2024-12-31T00:00:00Z',
    };
    mockFetch.mockReturnValueOnce(mockOkResponse(responseBody));

    const audio = new Blob(['audio'], { type: 'audio/webm' });
    const waveformData = [0.1, 0.5, 0.8];

    await createChallenge({
      audio,
      waveformData,
      songTitle: 'Bohemian Rhapsody',
      songArtist: 'Queen',
      durationSeconds: 12,
      creatorAlias: 'TestUser',
    });

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const form = init.body as FormData;

    expect(form.get('songTitle')).toBe('Bohemian Rhapsody');
    expect(form.get('songArtist')).toBe('Queen');
    expect(form.get('durationSeconds')).toBe('12');
    expect(form.get('creatorAlias')).toBe('TestUser');
    expect(form.get('waveformData')).toBe(JSON.stringify(waveformData));
  });

  it('omits creatorAlias from FormData when undefined', async () => {
    const responseBody = {
      id: 'abc123',
      challengeUrl: 'http://localhost:3001/challenge/abc123',
      expiresAt: '2025-01-01T00:00:00Z',
      createdAt: '2024-12-31T00:00:00Z',
    };
    mockFetch.mockReturnValueOnce(mockOkResponse(responseBody));

    await createChallenge({
      audio: new Blob(['audio'], { type: 'audio/webm' }),
      waveformData: [0.1],
      songTitle: 'Hey Jude',
      songArtist: 'The Beatles',
      durationSeconds: 8,
    });

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const form = init.body as FormData;
    expect(form.get('creatorAlias')).toBeNull();
  });

  it('returns the parsed response body on success', async () => {
    const responseBody = {
      id: 'xyz789',
      challengeUrl: 'http://localhost:3001/challenge/xyz789',
      expiresAt: '2025-01-01T00:00:00Z',
      createdAt: '2024-12-31T00:00:00Z',
    };
    mockFetch.mockReturnValueOnce(mockOkResponse(responseBody));

    const result = await createChallenge({
      audio: new Blob(['audio'], { type: 'audio/webm' }),
      waveformData: [0.5],
      songTitle: 'Imagine',
      songArtist: 'John Lennon',
      durationSeconds: 10,
    });

    expect(result).toEqual(responseBody);
  });

  it('throws ApiError on non-ok response with JSON error body', async () => {
    mockFetch.mockReturnValueOnce(
      mockErrorResponse(422, { error: 'Audio too large', code: 'AUDIO_TOO_LARGE' }),
    );

    await expect(
      createChallenge({
        audio: new Blob(['audio'], { type: 'audio/webm' }),
        waveformData: [],
        songTitle: 'Test',
        songArtist: 'Test',
        durationSeconds: 5,
      }),
    ).rejects.toThrow(ApiError);
  });

  it('throws ApiError with correct status and code', async () => {
    mockFetch.mockReturnValueOnce(
      mockErrorResponse(422, { error: 'Audio too large', code: 'AUDIO_TOO_LARGE' }),
    );

    try {
      await createChallenge({
        audio: new Blob(['audio'], { type: 'audio/webm' }),
        waveformData: [],
        songTitle: 'Test',
        songArtist: 'Test',
        durationSeconds: 5,
      });
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(422);
      expect(apiErr.code).toBe('AUDIO_TOO_LARGE');
      expect(apiErr.message).toBe('Audio too large');
    }
  });
});

// ---------------------------------------------------------------------------
// getChallenge
// ---------------------------------------------------------------------------

describe('getChallenge', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('calls the correct URL with GET method (implicit)', async () => {
    const challengeData = {
      id: 'abc123',
      audioUrl: 'http://example.com/audio.webm',
      waveformData: [0.1, 0.5],
      durationSeconds: 10,
      creatorAlias: 'Creator',
      guessCount: 5,
      completionCount: 2,
      maxAttempts: 6,
      expiresAt: '2025-01-01T00:00:00Z',
      createdAt: '2024-12-31T00:00:00Z',
    };
    mockFetch.mockReturnValueOnce(mockOkResponse(challengeData));

    await getChallenge('abc123');

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain('/api/challenges/abc123');
  });

  it('URL-encodes the challenge ID', async () => {
    mockFetch.mockReturnValueOnce(mockOkResponse({}));

    await getChallenge('id with spaces');

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain('id%20with%20spaces');
  });

  it('returns the parsed challenge response', async () => {
    const challengeData = {
      id: 'test-id',
      audioUrl: 'http://example.com/audio.webm',
      waveformData: [0.3, 0.7],
      durationSeconds: 15,
      creatorAlias: null,
      guessCount: 0,
      completionCount: 0,
      maxAttempts: 6,
      expiresAt: '2025-01-01T00:00:00Z',
      createdAt: '2024-12-31T00:00:00Z',
    };
    mockFetch.mockReturnValueOnce(mockOkResponse(challengeData));

    const result = await getChallenge('test-id');
    expect(result).toEqual(challengeData);
  });

  it('throws ApiError with server error code on 404', async () => {
    mockFetch.mockReturnValueOnce(
      mockErrorResponse(404, { error: 'Challenge not found', code: 'NOT_FOUND' }),
    );

    try {
      await getChallenge('nonexistent');
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(404);
      expect(apiErr.code).toBe('NOT_FOUND');
    }
  });

  it('falls back to numeric code when error body has no code field', async () => {
    mockFetch.mockReturnValueOnce(
      mockErrorResponse(500, { error: 'Internal error' }),
    );

    try {
      await getChallenge('some-id');
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(500);
      expect(apiErr.code).toBe('500');
    }
  });

  it('uses HTTP status string as code when body is non-JSON', async () => {
    mockFetch.mockReturnValueOnce(mockErrorResponseNonJson(503));

    try {
      await getChallenge('some-id');
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
// submitGuess
// ---------------------------------------------------------------------------

describe('submitGuess', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('sends a POST to the correct guess endpoint', async () => {
    mockFetch.mockReturnValueOnce(
      mockOkResponse({
        correct: false,
        attemptsUsed: 1,
        attemptsRemaining: 5,
        maxAttempts: 6,
        timeTakenSeconds: 10,
        song: null,
      }),
    );

    await submitGuess('challenge-id', 'Bohemian Rhapsody', 'session-abc');

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain('/api/challenges/challenge-id/guess');
  });

  it('sends JSON body with guess and sessionId', async () => {
    mockFetch.mockReturnValueOnce(
      mockOkResponse({
        correct: true,
        attemptsUsed: 2,
        attemptsRemaining: 4,
        maxAttempts: 6,
        timeTakenSeconds: 25,
        song: { title: 'Bohemian Rhapsody', artist: 'Queen', spotifyId: null, albumArt: null, previewUrl: null },
      }),
    );

    await submitGuess('ch-1', 'Bohemian Rhapsody', 'sess-xyz');

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' });

    const parsed = JSON.parse(init.body as string) as { guess: string; sessionId: string };
    expect(parsed.guess).toBe('Bohemian Rhapsody');
    expect(parsed.sessionId).toBe('sess-xyz');
  });

  it('returns parsed guess response on success', async () => {
    const guessResponse = {
      correct: true,
      attemptsUsed: 1,
      attemptsRemaining: 5,
      maxAttempts: 6,
      timeTakenSeconds: 8,
      song: {
        title: 'Imagine',
        artist: 'John Lennon',
        spotifyId: null,
        albumArt: null,
        previewUrl: null,
      },
    };
    mockFetch.mockReturnValueOnce(mockOkResponse(guessResponse));

    const result = await submitGuess('ch-2', 'Imagine', 'sess-1');
    expect(result).toEqual(guessResponse);
  });

  it('handles 400 validation errors by throwing ApiError', async () => {
    mockFetch.mockReturnValueOnce(
      mockErrorResponse(400, { error: 'Guess cannot be empty', code: 'VALIDATION_ERROR' }),
    );

    try {
      await submitGuess('ch-3', '', 'sess-2');
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(400);
      expect(apiErr.code).toBe('VALIDATION_ERROR');
      expect(apiErr.message).toBe('Guess cannot be empty');
    }
  });

  it('URL-encodes the challenge ID in the guess endpoint', async () => {
    mockFetch.mockReturnValueOnce(
      mockOkResponse({ correct: false, attemptsUsed: 1, attemptsRemaining: 5, maxAttempts: 6, timeTakenSeconds: 5, song: null }),
    );

    await submitGuess('id/with/slashes', 'Song', 'sess');

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain('id%2Fwith%2Fslashes');
  });
});

// ---------------------------------------------------------------------------
// getChallengeResult
// ---------------------------------------------------------------------------

describe('getChallengeResult', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('sends sessionId as a query parameter', async () => {
    mockFetch.mockReturnValueOnce(
      mockOkResponse({
        challengeId: 'ch-1',
        completed: true,
        correct: true,
        attemptsUsed: 2,
        maxAttempts: 6,
        timeTakenSeconds: 30,
        song: null,
        shareText: null,
        waveformData: [],
        creatorAlias: null,
        completionCount: 5,
        guessCount: 10,
      }),
    );

    await getChallengeResult('ch-1', 'my-session');

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain('sessionId=my-session');
    expect(url).toContain('/api/challenges/ch-1/result');
  });

  it('returns the parsed result response', async () => {
    const resultData = {
      challengeId: 'ch-1',
      completed: true,
      correct: false,
      attemptsUsed: 6,
      maxAttempts: 6,
      timeTakenSeconds: null,
      song: { title: 'Hotel California', artist: 'Eagles', spotifyId: null, albumArt: null, previewUrl: null },
      shareText: '🎵 HumDuel\n\nI couldn\'t guess this one!',
      waveformData: [0.5, 0.8],
      creatorAlias: 'SomeCreator',
      completionCount: 3,
      guessCount: 20,
    };
    mockFetch.mockReturnValueOnce(mockOkResponse(resultData));

    const result = await getChallengeResult('ch-1', 'session-abc');
    expect(result).toEqual(resultData);
  });

  it('throws ApiError on non-ok result response', async () => {
    mockFetch.mockReturnValueOnce(
      mockErrorResponse(404, { error: 'Session not found', code: 'SESSION_NOT_FOUND' }),
    );

    await expect(getChallengeResult('ch-1', 'missing-session')).rejects.toThrow(ApiError);
  });
});

// ---------------------------------------------------------------------------
// healthCheck
// ---------------------------------------------------------------------------

describe('healthCheck', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('calls the /health endpoint', async () => {
    mockFetch.mockReturnValueOnce(mockOkResponse({ status: 'ok' }));

    await healthCheck();

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain('/health');
  });

  it('returns the parsed health status', async () => {
    mockFetch.mockReturnValueOnce(mockOkResponse({ status: 'ok' }));

    const result = await healthCheck();
    expect(result).toEqual({ status: 'ok' });
  });

  it('throws ApiError when the server is unhealthy (non-ok response)', async () => {
    mockFetch.mockReturnValueOnce(mockErrorResponse(503, { error: 'Service unavailable' }));

    await expect(healthCheck()).rejects.toThrow(ApiError);
  });
});

// ---------------------------------------------------------------------------
// ApiError class
// ---------------------------------------------------------------------------

describe('ApiError', () => {
  it('has the correct name property', () => {
    const err = new ApiError(404, 'NOT_FOUND', 'Resource not found');
    expect(err.name).toBe('ApiError');
  });

  it('stores status, code, and message', () => {
    const err = new ApiError(400, 'BAD_REQUEST', 'Invalid input');
    expect(err.status).toBe(400);
    expect(err.code).toBe('BAD_REQUEST');
    expect(err.message).toBe('Invalid input');
  });

  it('is an instance of Error', () => {
    const err = new ApiError(500, 'SERVER_ERROR', 'Oops');
    expect(err).toBeInstanceOf(Error);
  });
});
