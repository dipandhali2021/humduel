import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import PageContainer from '@/components/layout/PageContainer';
import { GuessResult, GuessResultSkeleton } from '@/components/challenge/GuessResult';
import { getChallengeResult } from '@/lib/api';
import { generateShareText, shareResult } from '@/lib/share';
import type { ChallengeResultResponse } from '@/types';

// ─── Error state ──────────────────────────────────────────────────────────────

interface ErrorViewProps {
  message: string;
  onRetry: () => void;
}

function ErrorView({ message, onRetry }: ErrorViewProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <span className="text-5xl leading-none" role="img" aria-label="Error">
        😕
      </span>
      <div className="space-y-2">
        <h2 className="font-headline text-xl font-bold text-on-surface">
          Could not load result
        </h2>
        <p className="font-body text-sm text-on-surface-muted">{message}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="font-label text-sm font-medium text-primary hover:text-primary/80 transition-colors duration-150 underline underline-offset-4"
      >
        Try again
      </button>
    </div>
  );
}

// ─── Result page ──────────────────────────────────────────────────────────────

type PageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; result: ChallengeResultResponse };

const ResultPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const sessionId = searchParams.get('session') ?? '';

  const [state, setState] = useState<PageState>({ status: 'loading' });

  // Prevent double-fetch in strict mode
  const fetchedRef = useRef(false);

  const loadResult = useCallback(async () => {
    if (!id) {
      setState({ status: 'error', message: 'Missing challenge ID.' });
      return;
    }

    setState({ status: 'loading' });

    try {
      const result = await getChallengeResult(id, sessionId);

      // If the session has not finished, redirect back so the player can keep guessing.
      if (!result.completed) {
        navigate(`/challenge/${encodeURIComponent(id)}`, { replace: true });
        return;
      }

      setState({ status: 'loaded', result });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setState({ status: 'error', message });
    }
  }, [id, sessionId, navigate]);

  useEffect(() => {
    // Guard against React 18 strict-mode double-invocation in development
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    void loadResult();
  }, [loadResult]);

  // ── Share handler ──────────────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    if (state.status !== 'loaded' || !id) return;

    const { result } = state;
    const { correct, attemptsUsed, maxAttempts } = result;

    // Build the guess-result boolean array for the share text
    const guessResults: boolean[] = (() => {
      const used = attemptsUsed ?? 0;
      if (used === 0) return [];
      if (correct) return [...Array(used - 1).fill(false), true];
      return Array(used).fill(false);
    })();

    const text = generateShareText({
      correct: correct ?? false,
      attemptsUsed: attemptsUsed ?? 0,
      maxAttempts,
      challengeId: id,
      guessResults,
    });

    await shareResult(text);
  }, [id, state]);

  // ── Navigate to recording flow ─────────────────────────────────────────────
  const handleCreateChallenge = useCallback(() => {
    navigate('/record');
  }, [navigate]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <Header showBack title="Result" />
      <PageContainer>
        {state.status === 'loading' && <GuessResultSkeleton />}

        {state.status === 'error' && (
          <ErrorView
            message={state.message}
            onRetry={() => {
              fetchedRef.current = false;
              void loadResult();
            }}
          />
        )}

        {state.status === 'loaded' && (
          <GuessResult
            result={state.result}
            onShare={handleShare}
            onCreateChallenge={handleCreateChallenge}
          />
        )}
      </PageContainer>
    </>
  );
};

export default ResultPage;
