import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUser } from '@/hooks/useUser';
import type { UserResponse, UserStatsResponse } from '@/types';

// ---------------------------------------------------------------------------
// Mock @/lib/api
// ---------------------------------------------------------------------------

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return {
    ...actual,
    createUser: vi.fn(),
    updateUser: vi.fn(),
    getUser: vi.fn(),
    getUserStats: vi.fn(),
  };
});

import {
  createUser as apiCreateUser,
  updateUser as apiUpdateUser,
  getUser as apiGetUser,
  getUserStats as apiGetUserStats,
} from '@/lib/api';

const mockCreateUser = vi.mocked(apiCreateUser);
const mockUpdateUser = vi.mocked(apiUpdateUser);
const mockGetUser = vi.mocked(apiGetUser);
const mockGetUserStats = vi.mocked(apiGetUserStats);

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const USER_ID_KEY = 'humduel:userId';

const baseUser: UserResponse = {
  id: 'user-123',
  nickname: 'MelodyMaster',
  avatar: 'M',
  createdAt: '2026-01-01T00:00:00Z',
};

const baseStats: UserStatsResponse = {
  userId: 'user-123',
  nickname: 'MelodyMaster',
  gamesPlayed: 10,
  gamesWon: 7,
  winRate: 0.7,
  currentStreak: 3,
  bestStreak: 5,
  avgTimeSeconds: 45,
  recentGames: [
    {
      date: '2026-04-05',
      puzzleNumber: 42,
      correct: true,
      attemptsUsed: 2,
      timeTakenSeconds: 30,
    },
  ],
};

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  localStorage.clear();
  mockCreateUser.mockReset();
  mockUpdateUser.mockReset();
  mockGetUser.mockReset();
  mockGetUserStats.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// isNewUser
// ---------------------------------------------------------------------------

describe('useUser — isNewUser', () => {
  it('returns isNewUser=true when no userId in localStorage', async () => {
    // No userId stored
    const { result } = renderHook(() => useUser());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isNewUser).toBe(true);
    expect(result.current.user).toBeNull();
    expect(result.current.stats).toBeNull();
  });

  it('does not call API when no userId is stored', async () => {
    const { result } = renderHook(() => useUser());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockGetUser).not.toHaveBeenCalled();
    expect(mockGetUserStats).not.toHaveBeenCalled();
  });

  it('returns isNewUser=false when userId exists and user is loaded', async () => {
    localStorage.setItem(USER_ID_KEY, 'user-123');
    mockGetUser.mockResolvedValue(baseUser);
    mockGetUserStats.mockResolvedValue(baseStats);

    const { result } = renderHook(() => useUser());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isNewUser).toBe(false);
    expect(result.current.user).toEqual(baseUser);
  });
});

// ---------------------------------------------------------------------------
// Loading user and stats
// ---------------------------------------------------------------------------

describe('useUser — loading user and stats', () => {
  it('fetches user and stats when userId exists in localStorage', async () => {
    localStorage.setItem(USER_ID_KEY, 'user-123');
    mockGetUser.mockResolvedValue(baseUser);
    mockGetUserStats.mockResolvedValue(baseStats);

    const { result } = renderHook(() => useUser());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockGetUser).toHaveBeenCalledWith('user-123');
    expect(mockGetUserStats).toHaveBeenCalledWith('user-123');
    expect(result.current.user).toEqual(baseUser);
    expect(result.current.stats).toEqual(baseStats);
  });

  it('starts with loading=true when userId is present', () => {
    localStorage.setItem(USER_ID_KEY, 'user-123');
    mockGetUser.mockReturnValue(new Promise(() => {})); // never resolves
    mockGetUserStats.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useUser());
    expect(result.current.loading).toBe(true);
  });

  it('clears loading and sets error on API failure', async () => {
    localStorage.setItem(USER_ID_KEY, 'user-123');
    mockGetUser.mockRejectedValue(new Error('User not found'));
    mockGetUserStats.mockResolvedValue(baseStats);

    const { result } = renderHook(() => useUser());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('User not found');
    expect(result.current.user).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// createUser
// ---------------------------------------------------------------------------

describe('useUser — createUser', () => {
  it('calls apiCreateUser with the given nickname', async () => {
    mockCreateUser.mockResolvedValue(baseUser);
    mockGetUserStats.mockResolvedValue(baseStats);

    const { result } = renderHook(() => useUser());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createUser('MelodyMaster');
    });

    expect(mockCreateUser).toHaveBeenCalledWith('MelodyMaster');
  });

  it('stores the new user ID in localStorage', async () => {
    mockCreateUser.mockResolvedValue(baseUser);
    mockGetUserStats.mockResolvedValue(baseStats);

    const { result } = renderHook(() => useUser());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createUser('MelodyMaster');
    });

    expect(localStorage.getItem(USER_ID_KEY)).toBe('user-123');
  });

  it('sets user and stats after createUser succeeds', async () => {
    mockCreateUser.mockResolvedValue(baseUser);
    mockGetUserStats.mockResolvedValue(baseStats);

    const { result } = renderHook(() => useUser());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createUser('MelodyMaster');
    });

    expect(result.current.user).toEqual(baseUser);
    expect(result.current.stats).toEqual(baseStats);
  });

  it('fetches stats for the new user after creation', async () => {
    mockCreateUser.mockResolvedValue(baseUser);
    mockGetUserStats.mockResolvedValue(baseStats);

    const { result } = renderHook(() => useUser());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createUser('MelodyMaster');
    });

    expect(mockGetUserStats).toHaveBeenCalledWith('user-123');
  });

  it('sets error and clears loading when createUser fails', async () => {
    mockCreateUser.mockRejectedValue(new Error('Nickname taken'));

    const { result } = renderHook(() => useUser());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createUser('TakenName');
    });

    expect(result.current.error).toBe('Nickname taken');
    expect(result.current.loading).toBe(false);
    expect(localStorage.getItem(USER_ID_KEY)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// updateUser
// ---------------------------------------------------------------------------

describe('useUser — updateUser', () => {
  it('calls apiUpdateUser with userId and new nickname', async () => {
    localStorage.setItem(USER_ID_KEY, 'user-123');
    mockGetUser.mockResolvedValue(baseUser);
    mockGetUserStats.mockResolvedValue(baseStats);

    const updatedUser: UserResponse = { ...baseUser, nickname: 'NewName' };
    mockUpdateUser.mockResolvedValue(updatedUser);

    const { result } = renderHook(() => useUser());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateUser('NewName');
    });

    expect(mockUpdateUser).toHaveBeenCalledWith('user-123', 'NewName');
  });

  it('refreshes user data after successful update', async () => {
    localStorage.setItem(USER_ID_KEY, 'user-123');
    mockGetUser.mockResolvedValue(baseUser);
    mockGetUserStats.mockResolvedValue(baseStats);

    const updatedUser: UserResponse = { ...baseUser, nickname: 'NewName' };
    mockUpdateUser.mockResolvedValue(updatedUser);

    const { result } = renderHook(() => useUser());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateUser('NewName');
    });

    expect(result.current.user?.nickname).toBe('NewName');
  });

  it('sets error and re-throws when updateUser fails', async () => {
    localStorage.setItem(USER_ID_KEY, 'user-123');
    mockGetUser.mockResolvedValue(baseUser);
    mockGetUserStats.mockResolvedValue(baseStats);
    mockUpdateUser.mockRejectedValue(new Error('Update failed'));

    const { result } = renderHook(() => useUser());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Catch the re-throw so we can also verify state was set
    let caughtError: unknown;
    await act(async () => {
      try {
        await result.current.updateUser('BadName');
      } catch (err) {
        caughtError = err;
      }
    });

    expect(caughtError).toBeInstanceOf(Error);
    expect((caughtError as Error).message).toBe('Update failed');
    expect(result.current.error).toBe('Update failed');
  });

  it('does nothing when no userId is in localStorage', async () => {
    // No userId set
    const { result } = renderHook(() => useUser());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateUser('NewName');
    });

    expect(mockUpdateUser).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// API error handling
// ---------------------------------------------------------------------------

describe('useUser — API errors', () => {
  it('handles non-Error rejection with fallback message on load', async () => {
    localStorage.setItem(USER_ID_KEY, 'user-123');
    mockGetUser.mockRejectedValue('some non-error object');
    mockGetUserStats.mockResolvedValue(baseStats);

    const { result } = renderHook(() => useUser());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Failed to load profile.');
  });

  it('handles non-Error rejection with fallback message during createUser', async () => {
    mockCreateUser.mockRejectedValue(42);

    const { result } = renderHook(() => useUser());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createUser('Someone');
    });

    expect(result.current.error).toBe('Failed to create profile.');
  });
});
