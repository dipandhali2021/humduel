import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useId,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ChangeEvent,
} from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useDailyChallenge } from '@/hooks/useDailyChallenge';
import { shareResult } from '@/lib/share';
import { searchSongs } from '@/lib/songCatalog';
import type { CatalogSong } from '@/lib/songCatalog';

// ─── Inline SVG icons ─────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CrossIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9H4.5a2.5 2.5 0 000 5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 000 5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0012 0V2z" />
    </svg>
  );
}

function MusicNoteIcon() {
  return (
    <svg
      width="20"
      height="20"
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

function SpinnerIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
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
  );
}

// ─── Countdown timer hook ─────────────────────────────────────────────────────

/**
 * Returns a formatted HH:MM:SS countdown string until the next midnight UTC.
 * Updates every second.
 */
function useCountdownToMidnightUTC(): string {
  const [timeLeft, setTimeLeft] = useState<string>(() => computeCountdown());

  useEffect(() => {
    const tick = () => setTimeLeft(computeCountdown());
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return timeLeft;
}

function computeCountdown(): string {
  const now = new Date();
  const midnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  );
  const diffMs = midnight.getTime() - now.getTime();

  if (diffMs <= 0) return '00:00:00';

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((v) => String(v).padStart(2, '0'))
    .join(':');
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingView() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 py-24"
      role="status"
      aria-live="polite"
    >
      <SpinnerIcon className="w-10 h-10 text-primary" />
      <p className="font-body text-base text-on-surface-muted">Loading today's puzzle...</p>
    </div>
  );
}

// ─── Error view ───────────────────────────────────────────────────────────────

interface ErrorViewProps {
  message: string;
  onRetry: () => void;
}

function ErrorView({ message, onRetry }: ErrorViewProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-6 py-20 px-4 text-center"
      role="alert"
    >
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
          Could not load puzzle
        </h2>
        <p className="font-body text-sm text-on-surface-muted max-w-xs">{message}</p>
      </div>
      <Button variant="secondary" size="md" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

// ─── Attempt indicators ───────────────────────────────────────────────────────

interface AttemptDotsProps {
  maxAttempts: number;
  attemptsUsed: number;
  isComplete: boolean;
  isCorrect: boolean;
}

/**
 * Renders a row of circles:
 * - Filled green on the final attempt when correct
 * - Filled red for each wrong attempt
 * - Hollow for unused attempts
 */
function AttemptDots({
  maxAttempts,
  attemptsUsed,
  isComplete,
  isCorrect,
}: AttemptDotsProps) {
  return (
    <div className="flex items-center gap-2" role="img" aria-label={`${attemptsUsed} of ${maxAttempts} attempts used`}>
      {Array.from({ length: maxAttempts }).map((_, i) => {
        const isUsed = i < attemptsUsed;
        const isLastUsed = i === attemptsUsed - 1;
        const wasCorrect = isUsed && isComplete && isCorrect && isLastUsed;
        const wasWrong = isUsed && !wasCorrect;

        return (
          <span
            key={i}
            className={[
              'w-3 h-3 rounded-full border-2 transition-all duration-300',
              wasCorrect
                ? 'bg-success border-success'
                : wasWrong
                ? 'bg-error border-error'
                : 'bg-transparent border-on-surface-muted/40',
            ].join(' ')}
          />
        );
      })}
    </div>
  );
}

// ─── Song hint card ───────────────────────────────────────────────────────────

interface SongHintCardProps {
  hint: string;
}

function SongHintCard({ hint }: SongHintCardProps) {
  return (
    <Card variant="elevated" className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-secondary/15 flex items-center justify-center text-secondary">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </span>
        <span className="font-label text-xs font-semibold text-on-surface-muted uppercase tracking-wide">
          Song Hint
        </span>
      </div>
      <p className="font-body text-sm text-on-surface leading-relaxed pl-9">{hint}</p>
    </Card>
  );
}

// ─── Guess search input with autocomplete ────────────────────────────────────

interface GuessInputProps {
  onSubmit: (guess: string) => void;
  disabled: boolean;
  submitting: boolean;
}

function GuessInput({ onSubmit, disabled, submitting }: GuessInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<CatalogSong[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  // Debounced local catalog search
  const triggerSearch = useCallback((query: string) => {
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      const results = searchSongs(query);
      setSuggestions(results);
      setIsDropdownOpen(results.length > 0 && query.trim().length > 0);
      setActiveIndex(-1);
    }, 200);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setInputValue(value);
    triggerSearch(value);
  }

  function handleSelectSuggestion(song: CatalogSong) {
    const label = `${song.title} — ${song.artist}`;
    setInputValue(label);
    setIsDropdownOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || disabled || submitting) return;
    onSubmit(trimmed);
    setInputValue('');
    setSuggestions([]);
    setIsDropdownOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
    if (!isDropdownOpen) {
      if (e.key === 'Enter') handleSubmit();
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0,
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1,
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          const song = suggestions[activeIndex];
          if (song) handleSelectSuggestion(song);
        } else {
          handleSubmit();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsDropdownOpen(false);
        setActiveIndex(-1);
        break;
    }
  }

  const isSubmitDisabled = disabled || submitting || inputValue.trim().length === 0;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div ref={containerRef} className="relative">
        {/* Input row */}
        <div
          className={[
            'flex items-center gap-2 px-3 py-3 rounded-xl',
            'bg-surface-elevated border',
            isDropdownOpen
              ? 'border-primary/60 ring-1 ring-primary/30'
              : 'border-surface-hover',
            'transition-all duration-150',
            disabled ? 'opacity-50' : '',
          ].join(' ')}
        >
          <span className="text-on-surface-muted flex-shrink-0">
            <SearchIcon />
          </span>
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={isDropdownOpen}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={
              activeIndex >= 0 ? `${listboxId}-item-${activeIndex}` : undefined
            }
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0 && inputValue.trim().length > 0) {
                setIsDropdownOpen(true);
              }
            }}
            disabled={disabled}
            placeholder="Search for a song..."
            className={[
              'flex-1 min-w-0 bg-transparent outline-none',
              'font-body text-base text-on-surface',
              'placeholder:text-on-surface-muted',
            ].join(' ')}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        {/* Dropdown suggestions */}
        {isDropdownOpen && suggestions.length > 0 && (
          <ul
            id={listboxId}
            role="listbox"
            aria-label="Song suggestions"
            className={[
              'absolute left-0 right-0 top-full mt-1 z-50',
              'bg-surface-elevated border border-surface-hover rounded-xl',
              'shadow-lg overflow-hidden',
              'divide-y divide-surface-hover/50',
            ].join(' ')}
          >
            {suggestions.map((song, index) => (
              <li
                key={`${song.title}-${song.artist}`}
                id={`${listboxId}-item-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                onPointerDown={(e) => {
                  e.preventDefault();
                  handleSelectSuggestion(song);
                }}
                className={[
                  'flex flex-col px-4 py-3 cursor-pointer',
                  'transition-colors duration-100',
                  index === activeIndex
                    ? 'bg-primary/20 text-white'
                    : 'hover:bg-surface-hover',
                ].join(' ')}
              >
                <span className="font-label text-sm font-medium text-on-surface leading-tight">
                  {song.title}
                </span>
                <span className="font-body text-xs text-on-surface-muted leading-tight mt-0.5">
                  {song.artist}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={isSubmitDisabled}
        isLoading={submitting}
        className="w-full mt-3"
      >
        {submitting ? 'Submitting...' : 'Guess'}
      </Button>
    </form>
  );
}

// ─── Previous guesses list ────────────────────────────────────────────────────

interface PreviousGuessesProps {
  guesses: Array<{ correct: boolean; label: string }>;
}

function PreviousGuesses({ guesses }: PreviousGuessesProps) {
  if (guesses.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="font-label text-xs font-semibold text-on-surface-muted uppercase tracking-wide">
        Your Guesses
      </h3>
      <ul className="flex flex-col gap-1.5" role="list">
        {guesses.map((guess, index) => (
          <li
            key={index}
            className={[
              'flex items-center gap-3 px-3 py-2.5 rounded-xl border',
              guess.correct
                ? 'bg-success/10 border-success/30'
                : 'bg-error/10 border-error/20',
            ].join(' ')}
          >
            <span
              className={[
                'flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white',
                guess.correct ? 'bg-success' : 'bg-error',
              ].join(' ')}
              aria-hidden="true"
            >
              {guess.correct ? <CheckIcon /> : <CrossIcon />}
            </span>
            <span className="flex-1 min-w-0 font-label text-sm text-on-surface leading-tight block truncate">
              {guess.label}
            </span>
            <span className="font-label text-xs text-on-surface-muted flex-shrink-0">
              #{index + 1}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Result / completion section ──────────────────────────────────────────────

type ShareStatus = 'idle' | 'sharing' | 'copied' | 'shared';

interface ResultSectionProps {
  isCorrect: boolean;
  songTitle: string;
  songArtist: string;
  attemptsUsed: number;
  maxAttempts: number;
  timeTakenSeconds: number | null;
  shareText: string;
  onViewLeaderboard: () => void;
}

function ResultSection({
  isCorrect,
  songTitle,
  songArtist,
  attemptsUsed,
  maxAttempts,
  timeTakenSeconds,
  shareText,
  onViewLeaderboard,
}: ResultSectionProps) {
  const [shareStatus, setShareStatus] = useState<ShareStatus>('idle');

  const handleShare = useCallback(async () => {
    setShareStatus('sharing');
    try {
      const outcome = await shareResult(shareText);
      setShareStatus(outcome === 'shared' ? 'shared' : 'copied');
      // Reset button label after 2.5s
      setTimeout(() => setShareStatus('idle'), 2500);
    } catch {
      setShareStatus('idle');
    }
  }, [shareText]);

  const shareButtonLabel =
    shareStatus === 'sharing'
      ? 'Sharing...'
      : shareStatus === 'copied'
      ? 'Copied to clipboard!'
      : shareStatus === 'shared'
      ? 'Shared!'
      : 'Share Result';

  return (
    <div className="flex flex-col gap-4">
      {/* Win / Lose banner */}
      <div
        className={[
          'flex items-center gap-4 px-4 py-4 rounded-xl border',
          isCorrect
            ? 'bg-success/15 border-success/30'
            : 'bg-error/15 border-error/30',
        ].join(' ')}
        role="status"
        aria-live="polite"
      >
        <span
          className={[
            'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white',
            isCorrect ? 'bg-success' : 'bg-error',
          ].join(' ')}
          aria-hidden="true"
        >
          {isCorrect ? <CheckIcon size={18} /> : <CrossIcon size={18} />}
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="font-headline text-base font-bold text-on-surface">
            {isCorrect ? 'You got it!' : 'Better luck tomorrow!'}
          </span>
          <span className="font-body text-xs text-on-surface-muted">
            {isCorrect
              ? `Solved in ${attemptsUsed} of ${maxAttempts} attempts`
              : `Used all ${maxAttempts} attempts`}
            {timeTakenSeconds !== null && (
              <> &middot; {formatTime(timeTakenSeconds)}</>
            )}
          </span>
        </div>
      </div>

      {/* Song reveal card */}
      <Card variant="elevated" className="flex flex-col gap-3">
        <p className="font-label text-xs font-semibold text-on-surface-muted uppercase tracking-wide">
          Today's Song
        </p>
        <div className="flex items-center gap-3">
          <span className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <MusicNoteIcon />
          </span>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="font-headline text-base font-semibold text-on-surface leading-tight truncate">
              {songTitle}
            </span>
            <span className="font-body text-sm text-on-surface-muted leading-tight truncate">
              {songArtist}
            </span>
          </div>
        </div>
      </Card>

      {/* Action buttons */}
      <div className="flex flex-col gap-3">
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={() => void handleShare()}
          isLoading={shareStatus === 'sharing'}
          disabled={shareStatus === 'sharing'}
        >
          <ShareIcon />
          {shareButtonLabel}
        </Button>

        <Button
          variant="secondary"
          size="md"
          className="w-full"
          onClick={onViewLeaderboard}
        >
          <TrophyIcon />
          View Leaderboard
        </Button>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

// ─── Result loading placeholder ───────────────────────────────────────────────

function ResultLoadingPlaceholder() {
  return (
    <div className="flex flex-col items-center gap-2 py-6" role="status" aria-live="polite">
      <SpinnerIcon className="w-6 h-6 text-primary" />
      <p className="font-body text-sm text-on-surface-muted">Loading result...</p>
    </div>
  );
}

// ─── Status bar (attempt dots + countdown) ────────────────────────────────────

interface StatusBarProps {
  maxAttempts: number;
  attemptsUsed: number;
  isComplete: boolean;
  isCorrect: boolean;
}

function StatusBar({ maxAttempts, attemptsUsed, isComplete, isCorrect }: StatusBarProps) {
  const countdown = useCountdownToMidnightUTC();

  return (
    <div className="flex items-center justify-between py-2">
      <AttemptDots
        maxAttempts={maxAttempts}
        attemptsUsed={attemptsUsed}
        isComplete={isComplete}
        isCorrect={isCorrect}
      />
      <div className="flex flex-col items-end gap-0.5">
        <span className="font-label text-[10px] text-on-surface-muted uppercase tracking-wide leading-none">
          Next puzzle
        </span>
        <span
          className="font-headline text-sm font-semibold text-on-surface tabular-nums"
          aria-label={`Next puzzle in ${countdown}`}
        >
          {countdown}
        </span>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

const DailyPage = () => {
  const navigate = useNavigate();

  const {
    challenge,
    loading,
    error,
    guesses,
    isComplete,
    isCorrect,
    attemptsRemaining,
    maxAttempts,
    submitting,
    submitError,
    result,
    loadingResult,
    submitGuess,
    clearSubmitError,
  } = useDailyChallenge();

  // Retry: navigate(0) forces a full remount which recreates the hook's effect
  const handleRetry = useCallback(() => {
    navigate(0);
  }, [navigate]);

  const handleViewLeaderboard = useCallback(() => {
    navigate('/app/leaderboard');
  }, [navigate]);

  // Dismiss submit error when the user starts typing again
  // (handled via clearSubmitError being called on the next submit)

  // ── Derived values ─────────────────────────────────────────────────────────

  const puzzleNumber = challenge?.puzzleNumber ?? null;
  const songHint = challenge?.songHint ?? '';
  const attemptsUsed = maxAttempts - attemptsRemaining;

  // Format guesses for display — use the song field from the guess response,
  // falling back to a numbered placeholder.
  const formattedGuesses = guesses.map((g, i) => ({
    correct: g.correct,
    label:
      g.song !== null
        ? `${g.song.title} — ${g.song.artist}`
        : `Guess ${i + 1}`,
  }));

  // Format today's date for the header
  const today = new Date();
  const dateLabel = today.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <Header
        showBack
        title={puzzleNumber !== null ? `Daily Puzzle #${puzzleNumber}` : 'Daily Puzzle'}
        rightElement={
          <span className="font-label text-xs text-on-surface-muted">{dateLabel}</span>
        }
      />

      <PageContainer>
        {/* Loading state */}
        {loading && <LoadingView />}

        {/* Error state */}
        {!loading && error && (
          <ErrorView message={error} onRetry={handleRetry} />
        )}

        {/* Main content */}
        {!loading && !error && challenge && (
          <div className="flex flex-col gap-5 pt-1">
            {/* Status bar: attempt dots + countdown */}
            <StatusBar
              maxAttempts={maxAttempts}
              attemptsUsed={attemptsUsed}
              isComplete={isComplete}
              isCorrect={isCorrect}
            />

            {/* Song hint */}
            <SongHintCard hint={songHint} />

            {/* Attempt counter label */}
            <div className="flex items-center justify-between">
              <span className="font-label text-sm text-on-surface-muted">
                {isComplete
                  ? 'Puzzle complete'
                  : attemptsRemaining === 0
                  ? 'All attempts used'
                  : `Attempt ${attemptsUsed + 1} of ${maxAttempts}`}
              </span>
              {!isComplete && (
                <span className="font-label text-xs text-on-surface-muted">
                  {attemptsRemaining} remaining
                </span>
              )}
            </div>

            {/* Submit error notification */}
            {submitError && (
              <div
                className="flex items-start gap-3 px-4 py-3 rounded-xl bg-error/10 border border-error/20"
                role="alert"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-error flex-shrink-0 mt-0.5"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div className="flex flex-1 items-start justify-between gap-2">
                  <p className="font-body text-sm text-error">{submitError}</p>
                  <button
                    type="button"
                    onClick={clearSubmitError}
                    className="flex-shrink-0 text-on-surface-muted hover:text-white transition-colors"
                    aria-label="Dismiss error"
                  >
                    <CrossIcon size={12} />
                  </button>
                </div>
              </div>
            )}

            {/* Guessing area (hidden when complete) */}
            {!isComplete && (
              <Card variant="elevated">
                <GuessInput
                  onSubmit={(guess) => void submitGuess(guess)}
                  disabled={isComplete}
                  submitting={submitting}
                />
              </Card>
            )}

            {/* Previous guesses */}
            {formattedGuesses.length > 0 && (
              <PreviousGuesses guesses={formattedGuesses} />
            )}

            {/* Result section */}
            {isComplete && (
              <>
                {loadingResult ? (
                  <ResultLoadingPlaceholder />
                ) : result ? (
                  <ResultSection
                    isCorrect={isCorrect}
                    songTitle={result.song.title}
                    songArtist={result.song.artist}
                    attemptsUsed={result.attemptsUsed}
                    maxAttempts={result.maxAttempts}
                    timeTakenSeconds={result.timeTakenSeconds}
                    shareText={result.shareText}
                    onViewLeaderboard={handleViewLeaderboard}
                  />
                ) : (
                  /* Fallback when result fetch silently failed */
                  <Card variant="elevated" className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={[
                          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white',
                          isCorrect ? 'bg-success' : 'bg-error',
                        ].join(' ')}
                        aria-hidden="true"
                      >
                        {isCorrect ? <CheckIcon size={16} /> : <CrossIcon size={16} />}
                      </span>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-headline text-base font-semibold text-on-surface">
                          {isCorrect ? 'You got it!' : 'Better luck tomorrow!'}
                        </span>
                        <span className="font-body text-xs text-on-surface-muted">
                          {isCorrect
                            ? `Solved in ${attemptsUsed} of ${maxAttempts} attempts`
                            : `Used all ${maxAttempts} attempts`}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="md"
                      className="w-full"
                      onClick={handleViewLeaderboard}
                    >
                      <TrophyIcon />
                      View Leaderboard
                    </Button>
                  </Card>
                )}
              </>
            )}
          </div>
        )}
      </PageContainer>
    </>
  );
};

export default DailyPage;
