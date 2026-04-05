import { usePWAInstall } from '@/hooks/usePWAInstall';

export function PWAInstallPrompt() {
  const { canInstall, install, dismiss } = usePWAInstall();

  if (!canInstall) return null;

  return (
    <div
      role="banner"
      className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-[480px] rounded-xl bg-surface-elevated p-4 shadow-lg ring-1 ring-primary/20"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-2xl" aria-hidden="true">
          🎵
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-headline font-semibold text-sm text-white">
            Install HumDuel
          </p>
          <p className="text-xs text-on-surface-muted mt-0.5">
            Add to your home screen for the best experience
          </p>
        </div>
        <button
          onClick={dismiss}
          className="flex-shrink-0 text-on-surface-muted hover:text-white transition-colors p-1"
          aria-label="Dismiss install prompt"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={dismiss}
          className="flex-1 rounded-lg px-3 py-2 text-sm font-medium text-on-surface-muted hover:bg-surface-hover transition-colors"
        >
          Not now
        </button>
        <button
          onClick={install}
          className="flex-1 rounded-lg px-3 py-2 text-sm font-semibold bg-primary text-white hover:bg-primary/90 transition-colors"
        >
          Install
        </button>
      </div>
    </div>
  );
}
