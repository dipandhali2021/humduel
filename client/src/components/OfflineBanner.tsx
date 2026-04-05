import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="alert"
      className="fixed top-0 left-0 right-0 z-[60] bg-warning/90 py-2 px-4 text-center"
    >
      <p className="text-xs font-semibold text-surface">
        You're offline. Some features may be unavailable.
      </p>
    </div>
  );
}
