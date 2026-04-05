import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDailyChallenge } from '@/hooks/useDailyChallenge';
import type { DailyChallengeResponse, DailyGuessResponse, DailyResultResponse } from '@/types';

// ---------------------------------------------------------------------------
// Mock @/lib/api
// ---------------------------------------------------------------------------

vi.mock('@/lib/api', () => ({
  getDailyChallenge: vi.fn(),
  getDailyResult: vi.fn(),
  submitDailyGuess: vi.fn(),
}));

import {
  getDailyChallenge,
  getDailyResult,
  submitDailyGuess,
} from '@/lib/api';

const mockGetDailyChallenge = vi.mocked(getDailyChallenge);
const mockGetDailyResult = vi.mocked(getDailyResult);
const mockSubmitDailyGuess = vi.mocked(submitDailyGuess);

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const baseChallenge: DailyChallengeResponse = {
  date: '2026-04-05',
  puzzleNumber: 42,
  songHint: 'This song was released in the 1970s',
  maxAttempts: 6,
  attemptsUsed: 0,
  completed: false,
  correct: null,
};

const completedChallenge: DailyChallengeResponse = {
  ...baseChallenge,
  completed: true,
  correct: true,
  attemptsUsed: 2,
};

const baseResult: DailyResultResponse = {
  date: '2026-04-05',
  puzzleNumber: 42,
  completed: true,
  correct: true,
  attemptsUsed: 2,
  maxAttempts: 6,
  timeTakenSeconds: 30,
  song: { title: 'Bohemian Rhapsody', artist: 'Queen', spotifyId: null, albumArt: null, previewUrl: null },
  shareText: 'HumDuel #42 2/6',
};

const correctGuessResponse: DailyGuessResponse = {
  correct: true,
  attemptsUsed: 1,
  attemptsRemaining: 5,
  maxAttempts: 6,
  timeTakenSeconds: 15,
  song: { title: 'Bohemian Rhapsody', artist: 'Queen', spotifyId: null, albumArt: null, previewUrl: null },
};

const wrongGuessResponse: DailyGuessResponse = {
  correct: false,
  attemptsUsed: 1,
  attemptsRemaining: 5,
  maxAttempts: 6,
  timeTakenSeconds: null,
  song: null,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildSessionKey(): string {
  const today = new Date();
  const yyyy = today.getUTCFullYear();
  const mm = String(today.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(today.getUTCDate()).padStart(2, '0');
  return `humduel:daily:${yyyy}-${mm}-${dd}`;
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  localStorage.clear();
  mockGetDailyChallenge.mockReset();
  mockGetDailyResult.mockReset();
  mockSubmitDailyGuess.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Initial loading
// ---------------------------------------------------------------------------

describe('useDailyChallenge — loads challenge on mount', () => {
  it('starts with loading=true before the fetch resolves', () => {
    mockGetDailyChallenge.mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useDailyChallenge());
    expect(result.current.loading).toBe(true);
    expect(result.current.challenge).toBeNull();
  });

  it('sets challenge and clears loading after successful fetch', async () => {
    mockGetDailyChallenge.mockResolvedValue(baseChallenge);
    mockGetDailyResult.mockResolvedValue(baseResult);

    const { result } = renderHook(() => useDailyChallenge());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.challenge).toEqual(baseChallenge);
    expect(result.current.error).toBeNull();
  });

  it('calls getDailyChallenge with the session ID', async () => {
    mockGetDailyChallenge.mockResolvedValue(baseChallenge);

    const { result } = renderHook(() => useDailyChallenge());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockGetDailyChallenge).toHaveBeenCalledTimes(1);
    const [calledSessionId] = mockGetDailyChallenge.mock.calls[0] as [string];
    expect(typeof calledSessionId).toBe('string');
    expect(calledSessionId.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Session ID management
// ---------------------------------------------------------------------------

describe('useDailyChallenge — sessionId and localStorage', () => {
  it('generates a sessionId and stores it in localStorage', async () => {
    mockGetDailyChallenge.mockResolvedValue(baseChallenge);

    const { result } = renderHook(() => useDailyChallenge());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const key = buildSessionKey();
    const stored = localStorage.getItem(key);
    expect(stored).toBe(result.current.sessionId);
  });

  it('reuses an existing sessionId from localStorage', async () => {
    const key = buildSessionKey();
    const existingId = 'existing-session-id-123';
    localStorage.setItem(key, existingId);

    mockGetDailyChallenge.mockResolvedValue(baseChallenge);

    const { result } = renderHook(() => useDailyChallenge());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.sessionId).toBe(existingId);
    expect(mockGetDailyChallenge).toHaveBeenCalledWith(existingId);
  });

  it('reads userId from localStorage when submitting a guess', async () => {
    localStorage.setItem('humduel:userId', 'user-abc');
    mockGetDailyChallenge.mockResolvedValue(baseChallenge);
    mockSubmitDailyGuess.mockResolvedValue(wrongGuessResponse);

    const { result } = renderHook(() => useDailyChallenge());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.submitGuess('Imagine');
    });

    const [, , calledUserId] = mockSubmitDailyGuess.mock.calls[0] as [string, string, string | undefined];
    expect(calledUserId).toBe('user-abc');
  });

  it('passes undefined userId when no userId in localStorage', async () => {
    // localStorage is cleared in beforeEach
    mockGetDailyChallenge.mockResolvedValue(baseChallenge);
    mockSubmitDailyGuess.mockResolvedValue(wrongGuessResponse);

    const { result } = renderHook(() => useDailyChallenge());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.submitGuess('Imagine');
    });

    const [, , calledUserId] = mockSubmitDailyGuess.mock.calls[0] as [string, string, string | undefined];
    expect(calledUserId).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// submitGuess
// ---------------------------------------------------------------------------

describe('useDailyChallenge — submitGuess', () => {
  it('calls submitDailyGuess with the guess and session ID', async () => {
    mockGetDailyChallenge.mockResolvedValue(baseChallenge);
    mockSubmitDailyGuess.mockResolvedValue(wrongGuessResponse);

    const { result } = renderHook(() => useDailyChallenge());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.submitGuess('Hey Jude');
    });

    expect(mockSubmitDailyGuess).toHaveBeenCalledTimes(1);
    const [calledGuess, calledSessionId] = mockSubmitDailyGuess.mock.calls[0] as [string, string, string | undefined];
    expect(calledGuess).toBe('Hey Jude');
    expect(calledSessionId).toBe(result.current.sessionId);
  });

  it('appends the response to guesses array', async () => {
    mockGetDailyChallenge.mockResolvedValue(baseChallenge);
    mockSubmitDailyGuess.mockResolvedValue(wrongGuessResponse);

    const { result } = renderHook(() => useDailyChallenge());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.submitGuess('Wrong Song');
    });

    expect(result.current.guesses).toHaveLength(1);
    expect(result.current.guesses[0]).toEqual(wrongGuessResponse);
    expect(result.current.latestGuess).toEqual(wrongGuessResponse);
  });

  it('sets isComplete and isCorrect=true on a correct guess', async () => {
    mockGetDailyChallenge.mockResolvedValue(baseChallenge);
    mockSubmitDailyGuess.mockResolvedValue(correctGuessResponse);
    mockGetDailyResult.mockResolvedValue(baseResult);

    const { result } = renderHook(() => useDailyChallenge());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.submitGuess('Bohemian Rhapsody');
    });

    expect(result.current.isComplete).toBe(true);
    expect(result.current.isCorrect).toBe(true);
  });

  it('sets isComplete when attemptsRemaining reaches 0', async () => {
    mockGetDailyChallenge.mockResolvedValue(baseChallenge);
    const lastAttemptResponse: DailyGuessResponse = {
      ...wrongGuessResponse,
      attemptsUsed: 6,
      attemptsRemaining: 0,
    };
    mockSubmitDailyGuess.mockResolvedValue(lastAttemptResponse);
    mockGetDailyResult.mockResolvedValue(baseResult);

    const { result } = renderHook(() => useDailyChallenge());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.submitGuess('Wrong Song');
    });

    expect(result.current.isComplete).toBe(true);
    expect(result.current.isCorrect).toBe(false);
  });

  it('does not call API when already complete', async () => {
    mockGetDailyChallenge.mockResolvedValue(baseChallenge);
    mockSubmitDailyGuess.mockResolvedValue(correctGuessResponse);
    mockGetDailyResult.mockResolvedValue(baseResult);

    const { result } = renderHook(() => useDailyChallenge());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Complete the game
    await act(async () => {
      await result.current.submitGuess('Bohemian Rhapsody');
    });
    expect(result.current.isComplete).toBe(true);

    // Attempt to submit again
    mockSubmitDailyGuess.mockReset();
    await act(async () => {
      await result.current.submitGuess('Another Song');
    });

    expect(mockSubmitDailyGuess).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Completion state from server
// ---------------------------------------------------------------------------

describe('useDailyChallenge — server-side completion', () => {
  it('marks isComplete from challenge.completed on load', async () => {
    mockGetDailyChallenge.mockResolvedValue(completedChallenge);
    mockGetDailyResult.mockResolvedValue(baseResult);

    const { result } = renderHook(() => useDailyChallenge());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isComplete).toBe(true);
    expect(result.current.isCorrect).toBe(true);
  });

  it('fetches result when isComplete becomes true', async () => {
    mockGetDailyChallenge.mockResolvedValue(baseChallenge);
    mockSubmitDailyGuess.mockResolvedValue(correctGuessResponse);
    mockGetDailyResult.mockResolvedValue(baseResult);

    const { result } = renderHook(() => useDailyChallenge());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.submitGuess('Bohemian Rhapsody');
    });

    await waitFor(() => expect(result.current.result).toEqual(baseResult));
    expect(mockGetDailyResult).toHaveBeenCalledWith(result.current.sessionId);
  });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

describe('useDailyChallenge — error handling', () => {
  it('sets error when getDailyChallenge rejects', async () => {
    mockGetDailyChallenge.mockRejectedValue(new Error('Network failure'));

    const { result } = renderHook(() => useDailyChallenge());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Network failure');
    expect(result.current.challenge).toBeNull();
  });

  it('sets submitError when submitDailyGuess rejects', async () => {
    mockGetDailyChallenge.mockResolvedValue(baseChallenge);
    mockSubmitDailyGuess.mockRejectedValue(new Error('Server error'));

    const { result } = renderHook(() => useDailyChallenge());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.submitGuess('Bad Guess');
    });

    expect(result.current.submitError).toBe('Server error');
    expect(result.current.isComplete).toBe(false);
  });

  it('clearSubmitError clears the submitError state', async () => {
    mockGetDailyChallenge.mockResolvedValue(baseChallenge);
    mockSubmitDailyGuess.mockRejectedValue(new Error('Server error'));

    const { result } = renderHook(() => useDailyChallenge());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.submitGuess('Bad Guess');
    });
    expect(result.current.submitError).not.toBeNull();

    act(() => {
      result.current.clearSubmitError();
    });
    expect(result.current.submitError).toBeNull();
  });

  it('handles non-Error rejection gracefully with fallback message', async () => {
    mockGetDailyChallenge.mockRejectedValue('string error');

    const { result } = renderHook(() => useDailyChallenge());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("Failed to load today's puzzle.");
  });

  it('result fetch failure is non-fatal (loadingResult becomes false)', async () => {
    mockGetDailyChallenge.mockResolvedValue(baseChallenge);
    mockSubmitDailyGuess.mockResolvedValue(correctGuessResponse);
    mockGetDailyResult.mockRejectedValue(new Error('Result unavailable'));

    const { result } = renderHook(() => useDailyChallenge());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.submitGuess('Bohemian Rhapsody');
    });

    await waitFor(() => expect(result.current.loadingResult).toBe(false));
    expect(result.current.result).toBeNull();
    expect(result.current.isComplete).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Derived values
// ---------------------------------------------------------------------------

describe('useDailyChallenge — derived values', () => {
  it('exposes correct maxAttempts from challenge', async () => {
    mockGetDailyChallenge.mockResolvedValue(baseChallenge);

    const { result } = renderHook(() => useDailyChallenge());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.maxAttempts).toBe(6);
  });

  it('attemptsRemaining reflects challenge.maxAttempts - challenge.attemptsUsed initially', async () => {
    const challengeWithSomeAttempts: DailyChallengeResponse = {
      ...baseChallenge,
      attemptsUsed: 2,
    };
    mockGetDailyChallenge.mockResolvedValue(challengeWithSomeAttempts);

    const { result } = renderHook(() => useDailyChallenge());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.attemptsRemaining).toBe(4);
  });

  it('attemptsRemaining is updated from latest guess response', async () => {
    mockGetDailyChallenge.mockResolvedValue(baseChallenge);
    mockSubmitDailyGuess.mockResolvedValue(wrongGuessResponse); // attemptsRemaining: 5

    const { result } = renderHook(() => useDailyChallenge());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.submitGuess('Wrong Song');
    });

    expect(result.current.attemptsRemaining).toBe(5);
  });
});
