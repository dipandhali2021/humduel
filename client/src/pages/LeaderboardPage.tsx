import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import PageContainer from '@/components/layout/PageContainer';
import { getLeaderboard } from '@/lib/api';
import type { LeaderboardResponse, LeaderboardEntryResponse } from '@/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const USER_ID_KEY = 'humduel:userId';

const MEDAL_COLORS: Record<number, string> = {
  1: '#FFD700',
  2: '#C0C0C0',
  3: '#CD7F32',
};

const MEDAL_BG: Record<number, string> = {
  1: 'rgba(255,215,0,0.12)',
  2: 'rgba(192,192,192,0.12)',
  3: 'rgba(205,127,50,0.12)',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

function formatDate(iso: string): string {
  // iso is YYYY-MM-DD
  const [year, month, day] = iso.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function isoDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function todayIso(): string {
  return isoDateString(new Date());
}

function offsetDate(base: string, days: number): string {
  const [y, m, d] = base.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days);
  return isoDateString(dt);
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const ChevronLeftIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M15 18L9 12L15 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ChevronRightIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M9 18L15 12L9 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const TrophyIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M8 21H16M12 17V21M7 4H17M6 4C6 4 4 4 4 7C4 10 7 12 12 12C17 12 20 10 20 7C20 4 18 4 18 4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7 4L6 7M17 4L18 7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M12 12V17"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LeaderboardSkeleton() {
  return (
    <div className="animate-pulse space-y-4 pt-2">
      {/* Date nav skeleton */}
      <div className="flex items-center justify-between py-2">
        <div className="w-8 h-8 rounded-full bg-surface-elevated" />
        <div className="h-5 w-36 rounded bg-surface-elevated" />
        <div className="w-8 h-8 rounded-full bg-surface-elevated" />
      </div>

      {/* Podium skeleton */}
      <div className="flex items-end justify-center gap-3 pt-4 pb-2">
        {[80, 100, 72].map((h, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-2"
            style={{ width: 88 }}
          >
            <div className="w-12 h-12 rounded-full bg-surface-elevated" />
            <div className="w-full rounded-t-lg bg-surface-elevated" style={{ height: h }} />
          </div>
        ))}
      </div>

      {/* Rows skeleton */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-14 rounded-xl bg-surface-elevated" />
      ))}
    </div>
  );
}

// ─── Podium ───────────────────────────────────────────────────────────────────

interface PodiumEntryProps {
  entry: LeaderboardEntryResponse;
  isCurrentUser: boolean;
}

const PODIUM_ORDER = [2, 1, 3]; // visual left-to-right order: silver, gold, bronze
const PODIUM_HEIGHT: Record<number, number> = { 1: 96, 2: 76, 3: 60 };

function PodiumSection({
  entries,
  currentUserId,
}: {
  entries: LeaderboardEntryResponse[];
  currentUserId: string | null;
}) {
  const top3 = entries.slice(0, 3);

  return (
    <div
      className="flex items-end justify-center gap-2 pt-2 pb-0"
      aria-label="Top 3 players"
    >
      {PODIUM_ORDER.map((rank) => {
        const entry = top3.find((e) => e.rank === rank);
        if (!entry) return <div key={rank} style={{ width: 96 }} />;

        const color = MEDAL_COLORS[rank] ?? '#A0A0B8';
        const bgColor = MEDAL_BG[rank] ?? 'rgba(160,160,184,0.10)';
        const isCurrentUser = entry.userId === currentUserId;
        const height = PODIUM_HEIGHT[rank] ?? 60;

        return (
          <PodiumEntry
            key={rank}
            entry={entry}
            isCurrentUser={isCurrentUser}
            color={color}
            bgColor={bgColor}
            height={height}
          />
        );
      })}
    </div>
  );
}

function PodiumEntry({
  entry,
  isCurrentUser,
  color,
  bgColor,
  height,
}: PodiumEntryProps & { color: string; bgColor: string; height: number }) {
  return (
    <div className="flex flex-col items-center gap-1.5" style={{ width: 96 }}>
      {/* Avatar */}
      <div
        className="relative flex-shrink-0"
        aria-hidden="true"
      >
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center font-headline font-bold text-lg uppercase"
          style={{
            background: bgColor,
            color,
            border: `2px solid ${color}`,
            boxShadow: isCurrentUser ? `0 0 0 3px rgba(124,58,237,0.5)` : undefined,
          }}
        >
          {entry.nickname.charAt(0)}
        </div>
        {/* Rank badge */}
        <div
          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center font-label font-bold text-[10px]"
          style={{ background: color, color: '#1E1B2E' }}
        >
          {entry.rank}
        </div>
      </div>

      {/* Name */}
      <span
        className="font-label text-xs text-center leading-tight max-w-full truncate px-1 font-medium"
        style={{ color: isCurrentUser ? '#7C3AED' : '#A0A0B8' }}
        title={entry.nickname}
      >
        {entry.nickname}
      </span>

      {/* Podium bar */}
      <div
        className="w-full rounded-t-lg flex flex-col items-center justify-end pb-2 gap-0.5"
        style={{ height, background: bgColor, borderTop: `2px solid ${color}` }}
      >
        <span className="font-label text-[11px] font-semibold" style={{ color }}>
          {entry.attemptsUsed}/6
        </span>
        <span className="font-label text-[10px] text-on-surface-muted">
          {formatTime(entry.timeTakenSeconds)}
        </span>
      </div>
    </div>
  );
}

// ─── Rankings row ─────────────────────────────────────────────────────────────

function RankingRow({
  entry,
  isCurrentUser,
}: {
  entry: LeaderboardEntryResponse;
  isCurrentUser: boolean;
}) {
  return (
    <div
      className={[
        'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-150',
        isCurrentUser
          ? 'bg-primary/10 ring-1 ring-primary/40'
          : 'bg-surface-elevated',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-current={isCurrentUser ? 'true' : undefined}
    >
      {/* Rank */}
      <span
        className="font-label text-sm font-bold w-6 text-center flex-shrink-0"
        style={{ color: MEDAL_COLORS[entry.rank] ?? '#A0A0B8' }}
      >
        {entry.rank}
      </span>

      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center font-headline font-bold text-sm flex-shrink-0 uppercase"
        style={{
          background: MEDAL_BG[entry.rank] ?? 'rgba(160,160,184,0.08)',
          color: MEDAL_COLORS[entry.rank] ?? '#A0A0B8',
          border: `1.5px solid ${MEDAL_COLORS[entry.rank] ?? '#A0A0B8'}`,
        }}
        aria-hidden="true"
      >
        {entry.nickname.charAt(0)}
      </div>

      {/* Nickname */}
      <span
        className={[
          'font-body text-sm flex-1 min-w-0 truncate',
          isCurrentUser ? 'text-white font-semibold' : 'text-on-surface-muted',
        ].join(' ')}
      >
        {entry.nickname}
        {isCurrentUser && (
          <span className="ml-1.5 font-label text-[10px] text-primary font-medium">
            (you)
          </span>
        )}
      </span>

      {/* Attempts */}
      <span className="font-label text-sm text-on-surface-muted flex-shrink-0">
        {entry.attemptsUsed}/6
      </span>

      {/* Time */}
      <span className="font-label text-sm text-on-surface-muted flex-shrink-0 w-14 text-right">
        {formatTime(entry.timeTakenSeconds)}
      </span>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ date }: { date: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <span className="text-5xl leading-none" role="img" aria-label="No entries">
        🎵
      </span>
      <div className="space-y-1">
        <p className="font-headline text-lg font-semibold text-white">
          No completions yet
        </p>
        <p className="font-body text-sm text-on-surface-muted">
          Be the first to complete the puzzle for {formatDate(date)}!
        </p>
      </div>
    </div>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <span className="text-5xl leading-none" role="img" aria-label="Error">
        😕
      </span>
      <div className="space-y-1">
        <p className="font-headline text-lg font-semibold text-white">
          Could not load leaderboard
        </p>
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

// ─── Main page ────────────────────────────────────────────────────────────────

type PageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; data: LeaderboardResponse };

const LeaderboardPage = () => {
  const [selectedDate, setSelectedDate] = useState<string>(todayIso());
  const [state, setState] = useState<PageState>({ status: 'loading' });
  const currentUserId = localStorage.getItem(USER_ID_KEY);

  const loadLeaderboard = useCallback(
    async (date: string) => {
      setState({ status: 'loading' });
      try {
        const data = await getLeaderboard(date);
        setState({ status: 'loaded', data });
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Something went wrong.';
        setState({ status: 'error', message });
      }
    },
    [],
  );

  useEffect(() => {
    void loadLeaderboard(selectedDate);
  }, [selectedDate, loadLeaderboard]);

  const today = todayIso();
  const canGoForward = selectedDate < today;

  const goBack = () => setSelectedDate((d) => offsetDate(d, -1));
  const goForward = () => {
    if (canGoForward) setSelectedDate((d) => offsetDate(d, 1));
  };

  // ── Puzzle badge label ──────────────────────────────────────────────────────
  const puzzleNumber =
    state.status === 'loaded' ? state.data.puzzleNumber : null;

  return (
    <>
      <Header title="Leaderboard" />
      <PageContainer>
        {/* ── Date navigation ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between py-2 mb-2">
          <button
            type="button"
            onClick={goBack}
            aria-label="Previous day"
            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-muted hover:text-white hover:bg-surface-hover transition-colors duration-150"
          >
            <ChevronLeftIcon />
          </button>

          <div className="flex flex-col items-center gap-0.5">
            <span className="font-headline text-sm font-semibold text-white">
              {formatDate(selectedDate)}
            </span>
            {puzzleNumber !== null && (
              <span className="font-label text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                Daily #{puzzleNumber}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={goForward}
            disabled={!canGoForward}
            aria-label="Next day"
            className={[
              'w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-150',
              canGoForward
                ? 'text-on-surface-muted hover:text-white hover:bg-surface-hover'
                : 'text-on-surface-muted/30 cursor-not-allowed',
            ].join(' ')}
          >
            <ChevronRightIcon />
          </button>
        </div>

        {/* ── Content ─────────────────────────────────────────────────────── */}
        {state.status === 'loading' && <LeaderboardSkeleton />}

        {state.status === 'error' && (
          <ErrorState
            message={state.message}
            onRetry={() => void loadLeaderboard(selectedDate)}
          />
        )}

        {state.status === 'loaded' && state.data.entries.length === 0 && (
          <EmptyState date={selectedDate} />
        )}

        {state.status === 'loaded' && state.data.entries.length > 0 && (
          <div className="space-y-4">
            {/* Podium */}
            {state.data.entries.length >= 1 && (
              <section aria-label="Top players podium">
                <PodiumSection
                  entries={state.data.entries}
                  currentUserId={currentUserId}
                />
              </section>
            )}

            {/* Divider + heading */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex-1 h-px bg-surface-elevated" />
              <div className="flex items-center gap-1.5 text-on-surface-muted">
                <TrophyIcon />
                <span className="font-label text-xs font-semibold uppercase tracking-widest">
                  Rankings
                </span>
              </div>
              <div className="flex-1 h-px bg-surface-elevated" />
            </div>

            {/* Table header */}
            <div className="flex items-center gap-3 px-4 pb-1">
              <span className="font-label text-[11px] text-on-surface-muted w-6 text-center">
                #
              </span>
              <span className="w-8 flex-shrink-0" />
              <span className="font-label text-[11px] text-on-surface-muted flex-1">
                Player
              </span>
              <span className="font-label text-[11px] text-on-surface-muted flex-shrink-0">
                Tries
              </span>
              <span className="font-label text-[11px] text-on-surface-muted flex-shrink-0 w-14 text-right">
                Time
              </span>
            </div>

            {/* Rows */}
            <div className="space-y-2">
              {state.data.entries.map((entry) => (
                <RankingRow
                  key={entry.userId}
                  entry={entry}
                  isCurrentUser={entry.userId === currentUserId}
                />
              ))}
            </div>

            {/* Footer note */}
            <p className="font-label text-[11px] text-on-surface-muted text-center pt-2 pb-1">
              {state.data.entries.length} player
              {state.data.entries.length !== 1 ? 's' : ''} completed today's puzzle
            </p>
          </div>
        )}
      </PageContainer>
    </>
  );
};

export default LeaderboardPage;
