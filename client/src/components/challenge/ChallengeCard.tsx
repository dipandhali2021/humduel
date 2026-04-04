import { WaveformCanvas } from '@/components/audio/WaveformCanvas';

export interface ChallengeCardProps {
  title: string;
  subtitle?: string;
  waveformData: number[];
  showPlayButton?: boolean;
  onPlay?: () => void;
  onClick?: () => void;
  className?: string;
}

/**
 * ChallengeCard
 *
 * Displays a saved challenge with a static waveform preview, an optional play
 * button overlay, and title / subtitle text.
 *
 * - Clicking the card fires `onClick`; clicking the play button fires `onPlay`
 *   (and stops propagation so both can be used independently).
 * - Hover state adds a subtle violet ring.
 * - Fully keyboard accessible when `onClick` or `onPlay` are provided.
 */
export function ChallengeCard({
  title,
  subtitle,
  waveformData,
  showPlayButton = false,
  onPlay,
  onClick,
  className,
}: ChallengeCardProps) {
  const isClickable = Boolean(onClick);

  return (
    <article
      role={isClickable ? 'button' : 'article'}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={[
        'bg-surface-elevated rounded-xl p-4',
        'transition-all duration-200',
        isClickable
          ? 'cursor-pointer hover:ring-2 hover:ring-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50'
          : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Waveform + play button overlay */}
      <div className="relative mb-3">
        <WaveformCanvas
          mode="static"
          waveformData={waveformData}
          height={80}
          className="rounded-lg overflow-hidden"
        />

        {showPlayButton && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              type="button"
              aria-label={`Play ${title}`}
              onClick={(e) => {
                e.stopPropagation();
                onPlay?.();
              }}
              className={[
                'w-10 h-10 rounded-full',
                'bg-surface/70 backdrop-blur-sm',
                'flex items-center justify-center',
                'text-white',
                'transition-all duration-150',
                'hover:bg-surface/90 hover:scale-110',
                'active:scale-95',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
              ].join(' ')}
            >
              {/* Triangle play icon — pure SVG, no icon library dependency */}
              <svg
                viewBox="0 0 16 16"
                fill="currentColor"
                className="w-4 h-4 translate-x-px"
                aria-hidden="true"
              >
                <path d="M3 2.5a.5.5 0 0 1 .765-.424l10 5.5a.5.5 0 0 1 0 .848l-10 5.5A.5.5 0 0 1 3 13.5v-11Z" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Text content */}
      <div className="space-y-0.5">
        <h3 className="font-headline text-lg text-on-surface leading-tight truncate">
          {title}
        </h3>
        {subtitle && (
          <p className="font-label text-sm text-on-surface-muted leading-tight truncate">
            {subtitle}
          </p>
        )}
      </div>
    </article>
  );
}

export default ChallengeCard;
