import { useState, useRef } from 'react';
import Header from '@/components/layout/Header';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useUser } from '@/hooks/useUser';
import type { RecentGame } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(seconds: number | null): string {
  if (seconds === null) return '—';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

function formatShortDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatMemberSince(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function clampNickname(value: string): string {
  return value.slice(0, 20);
}

function validateNickname(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return 'Nickname cannot be empty.';
  if (trimmed.length < 2) return 'Nickname must be at least 2 characters.';
  if (trimmed.length > 20) return 'Nickname must be 20 characters or fewer.';
  return null;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const PencilIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M18.5 2.50023C18.8978 2.1024 19.4374 1.87891 20 1.87891C20.5626 1.87891 21.1022 2.1024 21.5 2.50023C21.8978 2.89805 22.1213 3.43762 22.1213 4.00023C22.1213 4.56284 21.8978 5.1024 21.5 5.50023L12 15.0002L8 16.0002L9 12.0002L18.5 2.50023Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CheckIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M20 6L9 17L4 12"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const XIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M18 6L6 18M6 6L18 18"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const FireIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M12 2C12 2 7 7 7 12C7 14.2091 8.79086 16 11 16C8.79086 16 7 17.7909 7 20C7 21.1046 7.89543 22 9 22H15C16.1046 22 17 21.1046 17 20C17 17.7909 15.2091 16 13 16C15.2091 16 17 14.2091 17 12C17 9 15 6 12 2Z"
      fill="currentColor"
    />
  </svg>
);

const TrophyIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M8 21H16M12 17V21"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M5 4H19C19 4 19 11 12 14C5 11 5 4 5 4Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5 4C5 4 3 4 3 7C3 9.5 5 11 5 11"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M19 4C19 4 21 4 21 7C21 9.5 19 11 19 11"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const ClockIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle
      cx="12"
      cy="12"
      r="9"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M12 7V12L15 15"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-5 pt-2">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-surface-elevated" />
        <div className="space-y-2 flex-1">
          <div className="h-5 w-32 rounded bg-surface-elevated" />
          <div className="h-4 w-24 rounded bg-surface-elevated" />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-surface-elevated" />
        ))}
      </div>

      {/* Avg time */}
      <div className="h-16 rounded-xl bg-surface-elevated" />

      {/* Recent games */}
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-surface-elevated" />
        ))}
      </div>
    </div>
  );
}

// ─── Create profile form ──────────────────────────────────────────────────────

function CreateProfileForm({ onSubmit }: { onSubmit: (n: string) => Promise<void> }) {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateNickname(nickname);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onSubmit(nickname.trim());
    } catch {
      setError('Could not create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-2">
      {/* Illustration */}
      <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center text-primary">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
          <path
            d="M4 20C4 17.2386 7.58172 15 12 15C16.4183 15 20 17.2386 20 20"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="text-center space-y-1">
        <h2 className="font-headline text-2xl font-bold text-white">
          Create your profile
        </h2>
        <p className="font-body text-sm text-on-surface-muted">
          Pick a nickname to track your stats and appear on the leaderboard.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <Input
          label="Nickname"
          placeholder="e.g. MelodyMaster"
          value={nickname}
          error={error ?? undefined}
          maxLength={20}
          autoComplete="off"
          autoFocus
          onChange={(e) => {
            setNickname(clampNickname(e.target.value));
            if (error) setError(null);
          }}
        />
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={loading}
          className="w-full"
        >
          Create Profile
        </Button>
      </form>
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
          Could not load profile
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

// ─── Profile header ───────────────────────────────────────────────────────────

interface ProfileHeaderProps {
  nickname: string;
  avatar: string;
  createdAt: string;
  onEdit: () => void;
}

function ProfileHeader({ nickname, createdAt, onEdit }: ProfileHeaderProps) {
  return (
    <div className="flex items-center gap-4 py-2">
      {/* Avatar circle */}
      <div
        className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center font-headline font-bold text-2xl text-primary uppercase flex-shrink-0"
        aria-hidden="true"
      >
        {nickname.charAt(0)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-headline text-xl font-bold text-white truncate">
            {nickname}
          </span>
          <button
            type="button"
            onClick={onEdit}
            aria-label="Edit nickname"
            className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-on-surface-muted hover:text-white hover:bg-surface-hover transition-colors duration-150"
          >
            <PencilIcon />
          </button>
        </div>
        <span className="font-label text-xs text-on-surface-muted">
          Member since {formatMemberSince(createdAt)}
        </span>
      </div>
    </div>
  );
}

// ─── Edit nickname inline form ────────────────────────────────────────────────

function EditNicknameForm({
  currentNickname,
  onSave,
  onCancel,
}: {
  currentNickname: string;
  onSave: (n: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(currentNickname);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    const validationError = validateNickname(value);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (value.trim() === currentNickname) {
      onCancel();
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(value.trim());
    } catch {
      setError('Could not save. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="flex items-start gap-2 py-2">
      <div className="flex-1">
        <Input
          ref={inputRef}
          placeholder="Nickname"
          value={value}
          error={error ?? undefined}
          maxLength={20}
          autoFocus
          onChange={(e) => {
            setValue(clampNickname(e.target.value));
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void handleSave();
            if (e.key === 'Escape') onCancel();
          }}
        />
      </div>
      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={saving}
        aria-label="Save nickname"
        className="mt-2.5 w-9 h-9 rounded-full flex items-center justify-center text-success hover:bg-success/10 transition-colors duration-150 disabled:opacity-50 flex-shrink-0"
      >
        {saving ? (
          <svg
            className="animate-spin h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <CheckIcon />
        )}
      </button>
      <button
        type="button"
        onClick={onCancel}
        aria-label="Cancel editing"
        className="mt-2.5 w-9 h-9 rounded-full flex items-center justify-center text-on-surface-muted hover:text-white hover:bg-surface-hover transition-colors duration-150 flex-shrink-0"
      >
        <XIcon />
      </button>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  iconColor?: string;
  detail?: React.ReactNode;
}

function StatCard({ label, value, icon, iconColor, detail }: StatCardProps) {
  return (
    <Card className="flex flex-col gap-1 min-h-[88px]">
      <div className="flex items-center gap-1.5">
        {icon && (
          <span style={{ color: iconColor }} aria-hidden="true">
            {icon}
          </span>
        )}
        <span className="font-label text-xs text-on-surface-muted">{label}</span>
      </div>
      <span className="font-headline text-2xl font-bold text-white mt-auto">
        {value}
      </span>
      {detail && <div className="mt-1">{detail}</div>}
    </Card>
  );
}

// ─── Win rate bar ─────────────────────────────────────────────────────────────

function WinRateBar({ rate }: { rate: number }) {
  const pct = Math.min(100, Math.max(0, Math.round(rate * 100)));
  return (
    <div className="w-full">
      <div className="flex justify-between mb-1">
        <span className="font-label text-[10px] text-on-surface-muted">0%</span>
        <span className="font-label text-[10px] text-on-surface-muted">100%</span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-hover overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Win rate ${pct}%`}
        />
      </div>
    </div>
  );
}

// ─── Recent games ─────────────────────────────────────────────────────────────

function RecentGameRow({ game }: { game: RecentGame }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-elevated">
      {/* Result icon */}
      <div
        className={[
          'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
          game.correct ? 'bg-success/15 text-success' : 'bg-error/15 text-error',
        ].join(' ')}
        aria-label={game.correct ? 'Won' : 'Lost'}
      >
        {game.correct ? <CheckIcon /> : <XIcon size={14} />}
      </div>

      {/* Date + puzzle */}
      <div className="flex-1 min-w-0">
        <p className="font-label text-sm text-white font-medium">
          #{game.puzzleNumber}
        </p>
        <p className="font-label text-[11px] text-on-surface-muted">
          {formatShortDate(game.date)}
        </p>
      </div>

      {/* Attempts */}
      <span className="font-label text-sm text-on-surface-muted flex-shrink-0">
        {game.attemptsUsed}/6
      </span>

      {/* Time */}
      <span className="font-label text-sm text-on-surface-muted flex-shrink-0 w-14 text-right">
        {formatTime(game.timeTakenSeconds)}
      </span>
    </div>
  );
}

// ─── Stats view (loaded user) ─────────────────────────────────────────────────

interface StatsViewProps {
  nickname: string;
  avatar: string;
  createdAt: string;
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  currentStreak: number;
  bestStreak: number;
  avgTimeSeconds: number | null;
  recentGames: RecentGame[];
  onEditNickname: (nickname: string) => Promise<void>;
}

function StatsView({
  nickname,
  avatar,
  createdAt,
  gamesPlayed,
  winRate,
  currentStreak,
  bestStreak,
  avgTimeSeconds,
  recentGames,
  onEditNickname,
}: StatsViewProps) {
  const [editing, setEditing] = useState(false);

  const handleSave = async (n: string) => {
    await onEditNickname(n);
    setEditing(false);
  };

  return (
    <div className="space-y-5 pt-1">
      {/* Profile header */}
      {editing ? (
        <EditNicknameForm
          currentNickname={nickname}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <ProfileHeader
          nickname={nickname}
          avatar={avatar}
          createdAt={createdAt}
          onEdit={() => setEditing(true)}
        />
      )}

      {/* Stats grid */}
      <div>
        <h2 className="font-label text-xs font-semibold text-on-surface-muted uppercase tracking-widest mb-3">
          Stats
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Games Played" value={String(gamesPlayed)} />

          <StatCard
            label="Win Rate"
            value={`${Math.round(winRate * 100)}%`}
            detail={<WinRateBar rate={winRate} />}
          />

          <StatCard
            label="Current Streak"
            value={String(currentStreak)}
            icon={currentStreak > 0 ? <FireIcon /> : undefined}
            iconColor="#EC4899"
          />

          <StatCard
            label="Best Streak"
            value={String(bestStreak)}
            icon={bestStreak > 0 ? <TrophyIcon /> : undefined}
            iconColor="#FFD700"
          />
        </div>
      </div>

      {/* Avg time */}
      <Card className="flex items-center gap-3">
        <span className="text-secondary" aria-hidden="true">
          <ClockIcon />
        </span>
        <div>
          <p className="font-label text-xs text-on-surface-muted">
            Average Solve Time
          </p>
          <p className="font-headline text-xl font-bold text-white">
            {formatTime(avgTimeSeconds)}
          </p>
        </div>
      </Card>

      {/* Recent games */}
      <div>
        <h2 className="font-label text-xs font-semibold text-on-surface-muted uppercase tracking-widest mb-3">
          Recent Games
        </h2>

        {recentGames.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <span className="text-3xl leading-none" role="img" aria-label="No games">
              🎵
            </span>
            <p className="font-body text-sm text-on-surface-muted">
              No games played yet. Try today's daily challenge!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Column headers */}
            <div className="flex items-center gap-3 px-4 pb-1">
              <span className="w-7 flex-shrink-0" />
              <span className="font-label text-[11px] text-on-surface-muted flex-1">
                Puzzle
              </span>
              <span className="font-label text-[11px] text-on-surface-muted flex-shrink-0">
                Tries
              </span>
              <span className="font-label text-[11px] text-on-surface-muted flex-shrink-0 w-14 text-right">
                Time
              </span>
            </div>

            {recentGames.slice(0, 10).map((game) => (
              <RecentGameRow key={`${game.date}-${game.puzzleNumber}`} game={game} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const ProfilePage = () => {
  const { user, stats, loading, error, isNewUser, createUser, updateUser } =
    useUser();

  // The reload trigger: when the user navigates back or retries, we want a
  // fresh render. Since useUser loads on mount, we rely on page remount for
  // now and expose a simple inline retry via window.location.reload.
  const handleRetry = () => window.location.reload();

  return (
    <>
      <Header title="Profile" />
      <PageContainer>
        {/* Loading */}
        {loading && <ProfileSkeleton />}

        {/* Error */}
        {!loading && error && (
          <ErrorState message={error} onRetry={handleRetry} />
        )}

        {/* New user: no account yet */}
        {!loading && !error && isNewUser && (
          <CreateProfileForm onSubmit={createUser} />
        )}

        {/* Loaded user + stats */}
        {!loading && !error && user !== null && stats !== null && (
          <StatsView
            nickname={user.nickname}
            avatar={user.avatar}
            createdAt={user.createdAt}
            gamesPlayed={stats.gamesPlayed}
            gamesWon={stats.gamesWon}
            winRate={stats.winRate}
            currentStreak={stats.currentStreak}
            bestStreak={stats.bestStreak}
            avgTimeSeconds={stats.avgTimeSeconds}
            recentGames={stats.recentGames}
            onEditNickname={updateUser}
          />
        )}
      </PageContainer>
    </>
  );
};

export default ProfilePage;
