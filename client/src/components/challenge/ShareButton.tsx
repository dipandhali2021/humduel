import { useState, useCallback } from 'react';
import { shareResult } from '@/lib/share';

export interface ShareButtonProps {
  challengeUrl: string;
  challengeId: string;
  className?: string;
}

type FeedbackState = 'idle' | 'copied' | 'shared';

const FEEDBACK_DURATION_MS = 2500;

/**
 * ShareIcon
 *
 * Platform-neutral share icon (upload-arrow style). Rendered as an inline SVG
 * so there is no icon-library dependency.
 */
function ShareIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="flex-shrink-0"
    >
      <path
        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 1 1 0-2.684m0 2.684 6.632 3.316m-6.632-6 6.632-3.316m0 0a3 3 0 1 0 0-5.368 3 3 0 0 0 0 5.368Zm0 9.316a3 3 0 1 0 0 5.368 3 3 0 0 0 0-5.368Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="flex-shrink-0"
    >
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * ShareButton
 *
 * Shares the challenge URL using the Web Share API when available, with a
 * clipboard copy fallback for unsupported browsers.
 *
 * - Displays brief success feedback ("Shared!" / "Copied!") after the action.
 * - Full-width button with a violet-to-blue gradient border.
 * - Disables itself during and briefly after the share action to prevent
 *   duplicate triggers.
 */
export function ShareButton({ challengeUrl, challengeId: _challengeId, className = '' }: ShareButtonProps) {
  const [feedback, setFeedback] = useState<FeedbackState>('idle');
  const [isWorking, setIsWorking] = useState(false);

  const handleShare = useCallback(async () => {
    if (isWorking || feedback !== 'idle') return;
    setIsWorking(true);

    try {
      const result = await shareResult(challengeUrl);
      setFeedback(result === 'shared' ? 'shared' : 'copied');
    } catch {
      // User dismissed the native share sheet — treat as a no-op.
    } finally {
      setIsWorking(false);
    }

    // Reset to idle after the display window has elapsed.
    setTimeout(() => setFeedback('idle'), FEEDBACK_DURATION_MS);
  }, [challengeUrl, isWorking, feedback]);

  const isSuccess = feedback === 'copied' || feedback === 'shared';

  const label =
    feedback === 'shared'
      ? 'Shared!'
      : feedback === 'copied'
      ? 'Copied!'
      : 'Share Challenge';

  return (
    /*
     * The outer div acts as the gradient-border container:
     * p-px creates a 1-pixel-wide frame filled by the gradient.
     * The inner button sits on bg-surface so it visually "cuts out" the center,
     * leaving only the gradient rim visible.
     */
    <div
      className={[
        'p-px rounded-xl',
        isSuccess
          ? 'bg-gradient-to-r from-success to-success/70'
          : 'bg-gradient-to-r from-primary to-secondary',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <button
        type="button"
        onClick={() => void handleShare()}
        disabled={isWorking}
        aria-label={label}
        aria-live="polite"
        className={[
          'w-full flex items-center justify-center gap-2',
          'h-14 px-6 rounded-xl',
          'bg-surface font-label font-medium text-base',
          'transition-all duration-200',
          isSuccess ? 'text-success' : 'text-white',
          'hover:bg-surface-elevated',
          'active:scale-[0.98]',
          'disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        ].join(' ')}
      >
        {isSuccess ? <CheckIcon /> : <ShareIcon />}
        {label}
      </button>
    </div>
  );
}

export default ShareButton;
