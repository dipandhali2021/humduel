export interface TimerProps {
  seconds: number;
  maxSeconds: number;
  isActive: boolean;
}

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function Timer({ seconds, maxSeconds, isActive }: TimerProps) {
  const isNearLimit = seconds > maxSeconds * 0.8;

  return (
    <div
      className={`font-label tabular-nums text-2xl font-semibold transition-colors duration-200 ${
        isNearLimit ? 'text-warning' : 'text-on-surface'
      } ${isActive ? 'opacity-100' : 'opacity-50'}`}
      aria-live="polite"
      aria-label={`Recording time: ${formatTime(seconds)} of ${formatTime(maxSeconds)}`}
    >
      {formatTime(seconds)}
      <span className="text-on-surface-muted text-base font-normal ml-1">
        / {formatTime(maxSeconds)}
      </span>
    </div>
  );
}
