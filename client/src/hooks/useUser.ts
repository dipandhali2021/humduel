import { useState, useEffect, useCallback } from 'react';
import {
  createUser as apiCreateUser,
  updateUser as apiUpdateUser,
  getUser as apiGetUser,
  getUserStats as apiGetUserStats,
} from '@/lib/api';
import type { UserResponse, UserStatsResponse } from '@/types';

const USER_ID_KEY = 'humduel:userId';

export interface UseUserReturn {
  user: UserResponse | null;
  stats: UserStatsResponse | null;
  loading: boolean;
  error: string | null;
  isNewUser: boolean;
  createUser: (nickname: string) => Promise<void>;
  updateUser: (nickname: string) => Promise<void>;
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [stats, setStats] = useState<UserStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine whether there is a stored userId on mount.
  const storedUserId = localStorage.getItem(USER_ID_KEY);
  const isNewUser = user === null && !loading && storedUserId === null;

  // ── Load user + stats on mount ──────────────────────────────────────────────
  useEffect(() => {
    const userId = localStorage.getItem(USER_ID_KEY);

    if (!userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    setLoading(true);
    setError(null);

    Promise.all([apiGetUser(userId), apiGetUserStats(userId)])
      .then(([userData, statsData]) => {
        if (cancelled) return;
        setUser(userData);
        setStats(statsData);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : 'Failed to load profile.';
        setError(message);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // ── createUser ──────────────────────────────────────────────────────────────
  const createUser = useCallback(async (nickname: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const newUser = await apiCreateUser(nickname);
      localStorage.setItem(USER_ID_KEY, newUser.id);

      // Fetch stats for the new user (will be empty but consistent).
      const newStats = await apiGetUserStats(newUser.id);
      setUser(newUser);
      setStats(newStats);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to create profile.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── updateUser ──────────────────────────────────────────────────────────────
  const updateUser = useCallback(async (nickname: string): Promise<void> => {
    const userId = localStorage.getItem(USER_ID_KEY);
    if (!userId) return;

    setError(null);

    try {
      const updatedUser = await apiUpdateUser(userId, nickname);
      setUser(updatedUser);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to update profile.';
      setError(message);
      throw err; // Re-throw so calling code can handle it.
    }
  }, []);

  return {
    user,
    stats,
    loading,
    error,
    isNewUser,
    createUser,
    updateUser,
  };
}
