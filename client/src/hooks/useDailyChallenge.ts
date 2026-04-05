import { useState, useEffect, useCallback, useRef } from 'react';
import { nanoid } from 'nanoid';
import {
  getDailyChallenge,
  getDailyResult,
  submitDailyGuess as apiSubmitDailyGuess,
} from '@/lib/api';
import type {
  DailyChallengeResponse,
  DailyGuessResponse,
  DailyResultResponse,
} from '@/types';

// ─── Local storage key helpers ─────────────────────────────────────────────────

/**
 * Build the localStorage key for today's daily session ID.
 * Format: humduel:daily:YYYY-MM-DD (UTC date keeps it consistent across timezones)
 */
function getDailySessionKey(): string {
  const today = new Date();
  const yyyy = today.getUTCFullYear();
  const mm = String(today.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(today.getUTCDate()).padStart(2, '0');
  return `humduel:daily:${yyyy}-${mm}-${dd}`;
}

function getOrCreateDailySessionId(): string {
  const key = getDailySessionKey();
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const id = nanoid();
  localStorage.setItem(key, id);
  return id;
}

function getUserId(): string | undefined {
  return localStorage.getItem('humduel:userId') ?? undefined;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseDailyChallengeReturn {
  /** Today's challenge metadata. Null while loading or on error. */
  challenge: DailyChallengeResponse | null;
  /** True during the initial challenge fetch. */
  loading: boolean;
  /** Human-readable error, or null when healthy. */
  error: string | null;
  /** Full ordered history of guesses submitted this session (oldest first). */
  guesses: DailyGuessResponse[];
  /** The most recent guess response, or null if none submitted yet. */
  latestGuess: DailyGuessResponse | null;
  /** True once the player guessed correctly or exhausted all attempts. */
  isComplete: boolean;
  /** True if the player guessed the song correctly. */
  isCorrect: boolean;
  /** Number of attempts remaining (0 when round is over). */
  attemptsRemaining: number;
  /** Max attempts allowed for today's puzzle. */
  maxAttempts: number;
  /** Stable session ID for this player's daily session. */
  sessionId: string;
  /** True while a guess is being submitted. */
  submitting: boolean;
  /** Non-fatal error message from the last submit attempt. Clears on next submit. */
  submitError: string | null;
  /** Final result data (revealed after completion). Null until loaded. */
  result: DailyResultResponse | null;
  /** True while the result is being fetched after completion. */
  loadingResult: boolean;
  /** Submit a song guess. No-ops if already complete or currently submitting. */
  submitGuess: (guess: string) => Promise<void>;
  /** Clears submitError state. */
  clearSubmitError: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDailyChallenge(): UseDailyChallengeReturn {
  const [challenge, setChallenge] = useState<DailyChallengeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guesses, setGuesses] = useState<DailyGuessResponse[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<DailyResultResponse | null>(null);
  const [loadingResult, setLoadingResult] = useState(false);

  // Compute the session ID once and hold it stable across renders — useRef
  // prevents re-computation in React StrictMode double-invocation.
  const sessionIdRef = useRef<string | null>(null);
  if (sessionIdRef.current === null) {
    sessionIdRef.current = getOrCreateDailySessionId();
  }
  const sessionId = sessionIdRef.current;

  // ── Load challenge on mount ──────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    getDailyChallenge(sessionId)
      .then((data) => {
        if (cancelled) return;
        setChallenge(data);
        setLoading(false);

        // If the server already knows this session is complete (player
        // refreshed mid-session or previously completed), mark as done
        // and immediately fetch the result.
        if (data.completed) {
          setIsComplete(true);
          setIsCorrect(data.correct === true);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : 'Failed to load today\'s puzzle.';
        setError(message);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  // ── Load result whenever isComplete becomes true ─────────────────────────────

  useEffect(() => {
    if (!isComplete) return;

    let cancelled = false;
    setLoadingResult(true);

    getDailyResult(sessionId)
      .then((data) => {
        if (cancelled) return;
        setResult(data);
        setLoadingResult(false);
      })
      .catch(() => {
        if (cancelled) return;
        // Result fetch failure is non-fatal; the UI can still show partial info.
        setLoadingResult(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isComplete, sessionId]);

  // ── Derived values ───────────────────────────────────────────────────────────

  const latestGuess: DailyGuessResponse | null =
    guesses.length > 0 ? (guesses[guesses.length - 1] ?? null) : null;

  const maxAttempts = challenge?.maxAttempts ?? 6;

  const attemptsRemaining: number = (() => {
    if (latestGuess !== null) return latestGuess.attemptsRemaining;
    if (challenge !== null) return challenge.maxAttempts - challenge.attemptsUsed;
    return maxAttempts;
  })();

  // ── submitGuess ──────────────────────────────────────────────────────────────

  const submitGuess = useCallback(
    async (guess: string): Promise<void> => {
      if (isComplete || submitting) return;

      setSubmitError(null);
      setSubmitting(true);

      try {
        const userId = getUserId();
        const response = await apiSubmitDailyGuess(guess, sessionId, userId);

        setGuesses((prev) => [...prev, response]);

        if (response.correct || response.attemptsRemaining === 0) {
          setIsComplete(true);
          setIsCorrect(response.correct);
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to submit guess. Please try again.';
        setSubmitError(message);
      } finally {
        setSubmitting(false);
      }
    },
    [isComplete, submitting, sessionId],
  );

  const clearSubmitError = useCallback(() => {
    setSubmitError(null);
  }, []);

  return {
    challenge,
    loading,
    error,
    guesses,
    latestGuess,
    isComplete,
    isCorrect,
    attemptsRemaining,
    maxAttempts,
    sessionId,
    submitting,
    submitError,
    result,
    loadingResult,
    submitGuess,
    clearSubmitError,
  };
}
