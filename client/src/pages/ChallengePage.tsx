import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChallenge } from '@/hooks/useChallenge';
import { AudioPlayer } from '@/components/audio/AudioPlayer';
import { GuessingForm } from '@/components/challenge/GuessingForm';
import { Button } from '@/components/ui/Button';
import Header from '@/components/layout/Header';
import PageContainer from '@/components/layout/PageContainer';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';

/** Delay (ms) before navigating to the result page after completion. */
const RESULT_NAV_DELAY_MS = 1500;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Ensure audio URL is absolute.
 * If the challenge returns a relative path like `/audio/abc.webm`, prepend the
 * API base so the browser can actually fetch it.
 */
function resolveAudioUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url;
  }
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------

function LoadingView() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 py-20"
      role="status"
      aria-live="polite"
    >
      {/* Spinner */}
      <svg
        className="animate-spin w-10 h-10 text-primary"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      <p className="font-body text-base text-on-surface-muted">
        Loading challenge...
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

interface ErrorViewProps {
  message: string;
  onRetry: () => void;
}

function ErrorView({ message, onRetry }: ErrorViewProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-5 py-20 px-4 text-center"
      role="alert"
    >
      {/* Error icon */}
      <div className="w-14 h-14 rounded-full bg-error/15 flex items-center justify-center">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-error"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <div className="flex flex-col gap-1.5">
        <h2 className="font-headline text-lg font-semibold text-on-surface">
          Could not load challenge
        </h2>
        <p className="font-body text-sm text-on-surface-muted max-w-xs">
          {message}
        </p>
      </div>

      <Button variant="secondary" size="md" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Completion banner
// ---------------------------------------------------------------------------

interface CompletionBannerProps {
  correct: boolean;
}

function CompletionBanner({ correct }: CompletionBannerProps) {
  return (
    <div
      className={[
        'flex items-center gap-3 px-4 py-3 rounded-xl',
        correct
          ? 'bg-success/15 border border-success/30'
          : 'bg-error/15 border border-error/30',
      ].join(' ')}
      role="status"
      aria-live="polite"
    >
      <span
        className={[
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white',
          correct ? 'bg-success' : 'bg-error',
        ].join(' ')}
        aria-hidden="true"
      >
        {correct ? (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        )}
      </span>
      <div className="flex flex-col gap-0.5">
        <span className="font-label text-sm font-semibold text-on-surface">
          {correct ? 'Correct!' : 'Better luck next time!'}
        </span>
        <span className="font-body text-xs text-on-surface-muted">
          Heading to results...
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Creator hero section
// ---------------------------------------------------------------------------

interface CreatorHeroProps {
  alias: string | null;
}

function CreatorHero({ alias }: CreatorHeroProps) {
  const name = alias?.trim() || 'Someone';

  return (
    <div className="flex flex-col items-center gap-1 py-2 text-center">
      {/* Avatar placeholder */}
      <div
        className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center"
        aria-hidden="true"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
      <p className="font-body text-sm text-on-surface-muted">
        <span className="font-semibold text-on-surface">{name}</span> challenged
        you!
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Music note icon for page header
// ---------------------------------------------------------------------------

function MusicNoteIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="text-primary"
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const ChallengePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Guard: id should always be present given the route config, but TypeScript
  // doesn't know that. We render nothing and let the router handle it.
  const challengeId = id ?? '';

  const {
    challenge,
    loading,
    error,
    guesses,
    sessionId,
    submitGuess,
    isComplete,
    attemptsRemaining,
  } = useChallenge(challengeId);

  // Navigate to results page 1.5 s after completion
  useEffect(() => {
    if (!isComplete || !challengeId) return;

    const timer = setTimeout(() => {
      navigate(`/result/${encodeURIComponent(challengeId)}?session=${encodeURIComponent(sessionId)}`);
    }, RESULT_NAV_DELAY_MS);

    return () => clearTimeout(timer);
  }, [isComplete, challengeId, sessionId, navigate]);

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------

  const audioUrl = challenge ? resolveAudioUrl(challenge.audioUrl) : '';
  const waveformData = challenge?.waveformData ?? [];
  const maxAttempts = challenge?.maxAttempts ?? 6;

  // The most recent guess result (for the completion banner)
  const latestGuess = guesses.length > 0 ? guesses[guesses.length - 1] : null;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      <Header
        showBack
        title="Challenge"
        rightElement={<MusicNoteIcon />}
      />

      <PageContainer>
        {/* Loading */}
        {loading && <LoadingView />}

        {/* Error */}
        {!loading && error && (
          <ErrorView
            message={error}
            onRetry={() => {
              // Navigate to same URL to trigger a full remount of the hook
              navigate(0);
            }}
          />
        )}

        {/* Ready */}
        {!loading && !error && challenge && (
          <div className="flex flex-col gap-5">
            {/* Creator intro */}
            <CreatorHero alias={challenge.creatorAlias} />

            {/* Audio player card */}
            <div className="bg-surface-elevated rounded-xl p-4 flex flex-col gap-3">
              <h2 className="font-headline text-base font-semibold text-on-surface leading-tight text-center">
                Listen and guess the song
              </h2>
              <AudioPlayer
                url={audioUrl}
                waveformData={waveformData.length > 0 ? waveformData : undefined}
                showWaveform
              />
            </div>

            {/* Completion banner (shown while waiting to navigate) */}
            {isComplete && latestGuess && (
              <CompletionBanner correct={latestGuess.correct} />
            )}

            {/* Guessing form */}
            <div className="bg-surface-elevated rounded-xl p-4">
              <GuessingForm
                onSubmit={submitGuess}
                disabled={isComplete}
                attemptsRemaining={attemptsRemaining}
                maxAttempts={maxAttempts}
                previousGuesses={guesses}
              />
            </div>

            {/* Challenge stats row */}
            <div className="flex items-center justify-center gap-6 py-1">
              <div className="flex flex-col items-center gap-0.5">
                <span className="font-headline text-lg font-bold text-on-surface">
                  {challenge.guessCount}
                </span>
                <span className="font-label text-xs text-on-surface-muted">
                  Guesses
                </span>
              </div>
              <div className="w-px h-8 bg-surface-hover" aria-hidden="true" />
              <div className="flex flex-col items-center gap-0.5">
                <span className="font-headline text-lg font-bold text-on-surface">
                  {challenge.completionCount}
                </span>
                <span className="font-label text-xs text-on-surface-muted">
                  Completions
                </span>
              </div>
              <div className="w-px h-8 bg-surface-hover" aria-hidden="true" />
              <div className="flex flex-col items-center gap-0.5">
                <span className="font-headline text-lg font-bold text-on-surface">
                  {maxAttempts}
                </span>
                <span className="font-label text-xs text-on-surface-muted">
                  Max Attempts
                </span>
              </div>
            </div>
          </div>
        )}
      </PageContainer>
    </>
  );
};

export default ChallengePage;
