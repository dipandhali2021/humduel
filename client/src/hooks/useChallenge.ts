import { useState, useEffect, useCallback, useRef } from 'react';
import { nanoid } from 'nanoid';
import { getChallenge, submitGuess as apiSubmitGuess } from '@/lib/api';
import type { ChallengeResponse, GuessResponse } from '@/types';

// localStorage key helpers — scoped per challenge so multiple challenges
// don't clobber each other.
function sessionStorageKey(challengeId: string): string {
  return `humduel:session:${challengeId}`;
}

function getOrCreateSessionId(challengeId: string): string {
  const key = sessionStorageKey(challengeId);
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const id = nanoid();
  localStorage.setItem(key, id);
  return id;
}

// ─── Return type ─────────────────────────────────────────────────────────────

export interface UseChallengeReturn {
  /** The loaded challenge metadata (no song answer). Null while loading. */
  challenge: ChallengeResponse | null;
  /** True while the initial challenge fetch is in flight. */
  loading: boolean;
  /** Human-readable error message, or null if no error. */
  error: string | null;
  /** The most recent guess result, or null if no guess has been submitted yet. */
  guessResult: GuessResponse | null;
  /** Full history of every guess submitted this session (oldest first). */
  guesses: GuessResponse[];
  /** Stable session ID generated once per challenge and persisted in localStorage. */
  sessionId: string;
  /** Submit a guess. No-ops if the challenge is already complete. */
  submitGuess: (guess: string) => Promise<void>;
  /** True once the player guesses correctly or exhausts all attempts. */
  isComplete: boolean;
  /** Number of attempts remaining (0 when the round is over). */
  attemptsRemaining: number;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useChallenge(challengeId: string): UseChallengeReturn {
  const [challenge, setChallenge] = useState<ChallengeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guesses, setGuesses] = useState<GuessResponse[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  // Initialise sessionId once from localStorage (or create a new one).
  // useRef ensures the value is computed only on the first render even in
  // React StrictMode double-invocation, without causing extra state updates.
  const sessionIdRef = useRef<string | null>(null);
  if (sessionIdRef.current === null) {
    sessionIdRef.current = getOrCreateSessionId(challengeId);
  }
  const sessionId = sessionIdRef.current;

  // ── Load challenge on mount (or when challengeId changes) ──────────────────
  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);
    setChallenge(null);
    setGuesses([]);
    setIsComplete(false);

    getChallenge(challengeId)
      .then((data) => {
        if (cancelled) return;
        setChallenge(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Failed to load challenge.';
        setError(message);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [challengeId]);

  // ── Derived values ─────────────────────────────────────────────────────────

  const latestGuess: GuessResponse | null = guesses.length > 0 ? (guesses[guesses.length - 1] ?? null) : null;

  const attemptsRemaining: number = (() => {
    if (latestGuess) return latestGuess.attemptsRemaining;
    if (challenge) return challenge.maxAttempts;
    return 0;
  })();

  // ── submitGuess ────────────────────────────────────────────────────────────

  const submitGuess = useCallback(
    async (guess: string): Promise<void> => {
      if (isComplete) return;

      try {
        const result = await apiSubmitGuess(challengeId, guess, sessionId);

        setGuesses((prev) => [...prev, result]);

        if (result.correct || result.attemptsRemaining === 0) {
          setIsComplete(true);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to submit guess.';
        setError(message);
      }
    },
    [challengeId, isComplete, sessionId],
  );

  return {
    challenge,
    loading,
    error,
    guessResult: latestGuess,
    guesses,
    sessionId,
    submitGuess,
    isComplete,
    attemptsRemaining,
  };
}
