import { useState, useCallback } from 'react';
import { WaveformCanvas } from '@/components/audio/WaveformCanvas';
import { Button } from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import type { ChallengeResultResponse } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GuessResultProps {
  result: ChallengeResultResponse;
  onShare: () => void;
  onCreateChallenge: () => void;
}

// ─── Toast notification ───────────────────────────────────────────────────────

interface ToastProps {
  message: string;
}

function Toast({ message }: ToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        'fixed bottom-28 left-1/2 -translate-x-1/2',
        'bg-surface-elevated border border-primary/30',
        'text-white font-label text-sm font-medium',
        'px-5 py-3 rounded-xl shadow-lg',
        'animate-fade-in-up',
        'z-50',
        'whitespace-nowrap',
      ].join(' ')}
    >
      {message}
    </div>
  );
}

// ─── Wordle squares ───────────────────────────────────────────────────────────

/**
 * Build the boolean attempt array from result data.
 *   correct + N attempts  → (N-1) false squares, then 1 true square
 *   incorrect + N attempts → N false squares
 */
function buildAttempts(
  correct: boolean | null,
  attemptsUsed: number | null,
): boolean[] {
  const used = attemptsUsed ?? 0;
  if (used === 0) return [];
  if (correct) {
    return [...Array(used - 1).fill(false), true];
  }
  return Array(used).fill(false);
}

interface WordleSquaresProps {
  correct: boolean | null;
  attemptsUsed: number | null;
}

function WordleSquares({ correct, attemptsUsed }: WordleSquaresProps) {
  const attempts = buildAttempts(correct, attemptsUsed);
  if (attempts.length === 0) return null;

  return (
    <div
      className="flex gap-1.5"
      aria-label={
        correct
          ? `Guessed correctly in ${attemptsUsed} attempts`
          : `Did not guess correctly after ${attemptsUsed} attempts`
      }
    >
      {attempts.map((hit, i) => (
        <span
          key={i}
          role="img"
          aria-label={hit ? 'Correct guess' : 'Wrong guess'}
          className="text-2xl leading-none select-none"
        >
          {hit ? '🟩' : '🟥'}
        </span>
      ))}
    </div>
  );
}

// ─── Time formatter ───────────────────────────────────────────────────────────

function formatTime(seconds: number | null): string {
  if (seconds === null) return '—';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

// ─── Song info card ───────────────────────────────────────────────────────────

interface SongInfoCardProps {
  title: string;
  artist: string;
  albumArt: string | null;
}

function SongInfoCard({ title, artist, albumArt }: SongInfoCardProps) {
  const [imageError, setImageError] = useState(false);
  const showAlbumArt = albumArt !== null && !imageError;

  return (
    <Card variant="elevated" className="flex items-center gap-4">
      {showAlbumArt && (
        <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-surface-hover">
          <img
            src={albumArt!}
            alt={`${title} album art`}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <span className="text-xl leading-none mt-0.5 flex-shrink-0" aria-hidden="true">
            🎵
          </span>
          <div className="min-w-0">
            <p className="font-headline text-lg font-bold text-on-surface leading-tight truncate">
              {title}
            </p>
            <p className="font-label text-sm text-on-surface-muted leading-tight truncate mt-0.5">
              {artist}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── Stats row ────────────────────────────────────────────────────────────────

interface StatItemProps {
  icon: string;
  label: string;
  value: string;
}

function StatItem({ icon, label, value }: StatItemProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-base leading-none flex-shrink-0" aria-hidden="true">
        {icon}
      </span>
      <span className="font-label text-sm text-on-surface-muted">{label}</span>
      <span className="font-label text-sm font-semibold text-on-surface ml-auto">
        {value}
      </span>
    </div>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

export function GuessResultSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading result">
      {/* Heading placeholder */}
      <div className="flex flex-col items-center gap-3 pt-2">
        <div className="w-48 h-10 bg-surface-elevated rounded-xl" />
        <div className="w-32 h-4 bg-surface-elevated rounded-xl" />
      </div>

      {/* Waveform placeholder */}
      <div className="w-full h-24 bg-surface-elevated rounded-xl" />

      {/* Song card placeholder */}
      <div className="w-full h-20 bg-surface-elevated rounded-xl" />

      {/* Stats placeholders */}
      <div className="space-y-3">
        <div className="w-full h-5 bg-surface-elevated rounded-xl" />
        <div className="w-3/4 h-5 bg-surface-elevated rounded-xl" />
      </div>

      {/* Squares placeholder */}
      <div className="flex gap-1.5">
        {Array(6)
          .fill(null)
          .map((_, i) => (
            <div key={i} className="w-8 h-8 bg-surface-elevated rounded" />
          ))}
      </div>

      {/* Button placeholders */}
      <div className="space-y-3">
        <div className="w-full h-12 bg-surface-elevated rounded-xl" />
        <div className="w-full h-12 bg-surface-elevated rounded-xl" />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * GuessResult
 *
 * Displays the full outcome of a completed challenge session — song reveal,
 * waveform, attempt squares, community stats, and share / create CTAs.
 */
export function GuessResult({ result, onShare, onCreateChallenge }: GuessResultProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const {
    correct,
    attemptsUsed,
    maxAttempts,
    timeTakenSeconds,
    song,
    waveformData,
    guessCount,
    completionCount,
  } = result;

  const isCorrect = correct === true;

  // ── Toast helper ────────────────────────────────────────────────────────────
  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    const timer = setTimeout(() => setToastMessage(null), 2500);
    return () => clearTimeout(timer);
  }, []);

  // ── Share handler ────────────────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    setIsSharing(true);
    try {
      await onShare();
      showToast('Copied to clipboard!');
    } catch {
      showToast('Could not share — try again');
    } finally {
      setIsSharing(false);
    }
  }, [onShare, showToast]);

  // ── Heading ──────────────────────────────────────────────────────────────────
  const headingText = isCorrect ? 'Correct!' : 'Not this time';
  const headingColor = isCorrect ? 'text-emerald-400' : 'text-on-surface-muted';
  const headingEmoji = isCorrect ? '🎉' : '😔';

  return (
    <div className="space-y-6">
      {/* ── Result heading ─────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-1 pt-2" aria-live="polite">
        <span className="text-5xl leading-none" role="img" aria-hidden="true">
          {headingEmoji}
        </span>
        <h1
          className={`font-headline text-4xl font-bold tracking-tight ${headingColor} mt-2`}
        >
          {headingText}
        </h1>
        {!isCorrect && song && (
          <p className="font-body text-sm text-on-surface-muted mt-1">
            The answer was:
          </p>
        )}
      </div>

      {/* ── Song reveal ────────────────────────────────────────────────────── */}
      {song && (
        <SongInfoCard
          title={song.title}
          artist={song.artist}
          albumArt={song.albumArt}
        />
      )}

      {/* ── Waveform (only for correct guesses, to celebrate the melody) ───── */}
      {isCorrect && waveformData.length > 0 && (
        <Card variant="elevated" className="overflow-hidden">
          <WaveformCanvas
            mode="static"
            waveformData={waveformData}
            height={88}
          />
        </Card>
      )}

      {/* ── Performance stats ──────────────────────────────────────────────── */}
      <Card variant="elevated" className="space-y-3">
        {isCorrect && timeTakenSeconds !== null && (
          <StatItem
            icon="⏱️"
            label="Time taken"
            value={formatTime(timeTakenSeconds)}
          />
        )}

        {attemptsUsed !== null && (
          <StatItem
            icon="🎯"
            label="Attempts"
            value={`${attemptsUsed}/${maxAttempts}`}
          />
        )}

        {/* Wordle-style squares */}
        <div className="pt-1">
          <WordleSquares correct={correct} attemptsUsed={attemptsUsed} />
        </div>
      </Card>

      {/* ── Community stats ────────────────────────────────────────────────── */}
      <div>
        <p className="font-label text-xs text-on-surface-muted uppercase tracking-wider mb-3">
          Community
        </p>
        <Card variant="default" className="space-y-3">
          <StatItem
            icon="👥"
            label="Total guesses"
            value={String(guessCount)}
          />
          <StatItem
            icon="✅"
            label="Players who got it right"
            value={String(completionCount)}
          />
        </Card>
      </div>

      {/* ── Action buttons ─────────────────────────────────────────────────── */}
      <div className="space-y-3 pb-2">
        <Button
          variant="primary"
          size="lg"
          className="w-full gap-2"
          onClick={handleShare}
          isLoading={isSharing}
          aria-label="Share your result"
        >
          <span aria-hidden="true">📤</span>
          Share Result
        </Button>

        <Button
          variant="secondary"
          size="lg"
          className="w-full gap-2"
          onClick={onCreateChallenge}
          aria-label="Create your own humming challenge"
        >
          <span aria-hidden="true">🎤</span>
          {isCorrect ? 'Create Your Own' : 'Try Creating One'}
        </Button>
      </div>

      {/* ── Toast notification ─────────────────────────────────────────────── */}
      {toastMessage && <Toast message={toastMessage} />}
    </div>
  );
}

export default GuessResult;
