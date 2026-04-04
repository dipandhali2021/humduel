import { useRef, useCallback } from 'react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { WaveformCanvas } from '@/components/audio/WaveformCanvas';
import { formatTime } from '@/lib/audio';

export interface AudioPlayerProps {
  /** Audio source URL — blob: from recording or https: from server. */
  url: string;
  /** Pre-computed waveform bar data (values 0–1) for static display. */
  waveformData?: number[];
  /** If true, show the waveform canvas above the controls. Default: true. */
  showWaveform?: boolean;
  /** Called when audio reaches its natural end. */
  onEnd?: () => void;
  /** Additional CSS classes on the root element. */
  className?: string;
  /**
   * Compact mode: single row with play/pause + progress + time.
   * Full mode (default): waveform canvas above the controls.
   */
  compact?: boolean;
}

// ---------------------------------------------------------------------------
// Icon components — inline SVGs, no external library
// ---------------------------------------------------------------------------

function PlayIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      {/* Triangle shifted right slightly so it visually centres in the circle */}
      <polygon points="8,4 20,12 8,20" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface PlayButtonProps {
  isPlaying: boolean;
  onToggle: () => void;
  size?: 'sm' | 'lg';
  /** Extra Tailwind classes */
  className?: string;
}

function PlayButton({ isPlaying, onToggle, size = 'lg', className = '' }: PlayButtonProps) {
  const dim = size === 'lg' ? 'w-14 h-14' : 'w-10 h-10';
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isPlaying ? 'Pause' : 'Play'}
      className={[
        dim,
        'rounded-full flex items-center justify-center flex-shrink-0',
        'bg-primary/80 hover:bg-primary text-white',
        'transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
        'active:scale-95',
        className,
      ].join(' ')}
    >
      {isPlaying ? <PauseIcon /> : <PlayIcon />}
    </button>
  );
}

interface ProgressBarProps {
  progress: number;   // 0–1
  duration: number;   // seconds
  onSeek: (time: number) => void;
  className?: string;
}

function ProgressBar({ progress, duration, onSeek, className = '' }: ProgressBarProps) {
  const barRef = useRef<HTMLDivElement>(null);

  const calculateTime = useCallback(
    (clientX: number): number => {
      const bar = barRef.current;
      if (!bar || duration <= 0) return 0;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return ratio * duration;
    },
    [duration],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      onSeek(calculateTime(e.clientX));
    },
    [calculateTime, onSeek],
  );

  // Dragging support: track pointermove while pointer is down
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const bar = barRef.current;
      if (!bar) return;

      bar.setPointerCapture(e.pointerId);

      const handleMove = (moveE: PointerEvent) => {
        onSeek(calculateTime(moveE.clientX));
      };
      const handleUp = () => {
        bar.removeEventListener('pointermove', handleMove);
        bar.removeEventListener('pointerup', handleUp);
      };

      bar.addEventListener('pointermove', handleMove);
      bar.addEventListener('pointerup', handleUp);
    },
    [calculateTime, onSeek],
  );

  const fillPercent = Math.round(progress * 10000) / 100; // 2 decimal places

  return (
    <div
      ref={barRef}
      role="slider"
      aria-label="Seek audio"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      tabIndex={0}
      className={[
        'relative h-1 rounded-full bg-surface-hover cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        className,
      ].join(' ')}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      // Keyboard seeking: left/right arrow ±5 s
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') onSeek(Math.min((progress * duration) + 5, duration));
        if (e.key === 'ArrowLeft')  onSeek(Math.max((progress * duration) - 5, 0));
      }}
    >
      {/* Filled portion */}
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-100"
        style={{ width: `${fillPercent}%` }}
        aria-hidden="true"
      />
      {/* Thumb indicator */}
      <div
        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary shadow-md -ml-1.5"
        style={{ left: `${fillPercent}%` }}
        aria-hidden="true"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function AudioPlayer({
  url,
  waveformData,
  showWaveform = true,
  onEnd,
  className = '',
  compact = false,
}: AudioPlayerProps) {
  const { isPlaying, currentTime, duration, progress, analyserNode, toggle, seek } =
    useAudioPlayer({ url, onEnd });

  const timeLabel = `${formatTime(currentTime)} / ${formatTime(duration)}`;

  if (compact) {
    // -----------------------------------------------------------------------
    // Compact mode: single row
    // -----------------------------------------------------------------------
    return (
      <div
        className={[
          'flex items-center gap-3 w-full',
          className,
        ].join(' ')}
      >
        <PlayButton isPlaying={isPlaying} onToggle={toggle} size="sm" />

        <ProgressBar
          progress={progress}
          duration={duration}
          onSeek={seek}
          className="flex-1"
        />

        <span className="font-label text-xs text-on-surface-muted tabular-nums whitespace-nowrap">
          {timeLabel}
        </span>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Full mode: waveform + centred play button + progress bar + time
  // -------------------------------------------------------------------------
  return (
    <div className={['flex flex-col gap-3 w-full', className].join(' ')}>
      {/* Waveform area */}
      {showWaveform && (
        <div className="relative w-full rounded-xl overflow-hidden bg-surface-elevated">
          <WaveformCanvas
            analyserNode={isPlaying ? analyserNode : null}
            waveformData={waveformData}
            mode={isPlaying && analyserNode ? 'live' : 'static'}
            height={80}
          />

          {/* Centred play/pause overlay button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <PlayButton
              isPlaying={isPlaying}
              onToggle={toggle}
              size="lg"
              className="shadow-lg"
            />
          </div>
        </div>
      )}

      {/* Progress bar + time row */}
      <div className="flex flex-col gap-1.5 w-full px-1">
        <ProgressBar progress={progress} duration={duration} onSeek={seek} />

        <div className="flex justify-between">
          <span className="font-label text-xs text-on-surface-muted tabular-nums">
            {formatTime(currentTime)}
          </span>
          <span className="font-label text-xs text-on-surface-muted tabular-nums">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* If waveform is hidden, show a standalone play button */}
      {!showWaveform && (
        <div className="flex items-center gap-3 w-full">
          <PlayButton isPlaying={isPlaying} onToggle={toggle} size="lg" />
          <span className="font-label text-xs text-on-surface-muted tabular-nums">
            {timeLabel}
          </span>
        </div>
      )}
    </div>
  );
}

export default AudioPlayer;
