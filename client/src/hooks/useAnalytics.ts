/**
 * useAnalytics — React hook for privacy-aware client-side event tracking.
 *
 * Reads the opt-out flag from localStorage so events are silently dropped
 * when the user has disabled analytics.  All tracked data is non-PII.
 */

import { useCallback } from 'react';

// ─── Event types (mirrors server AnalyticsEvent) ─────────────────────────────

export type AnalyticsEvent =
  | 'game_started'
  | 'guess_made'
  | 'game_won'
  | 'game_lost'
  | 'challenge_shared'
  | 'daily_played';

// ─── Opt-out helpers ─────────────────────────────────────────────────────────

const OPT_OUT_KEY = 'humduel:analyticsOptOut';

export function isAnalyticsOptedOut(): boolean {
  return localStorage.getItem(OPT_OUT_KEY) === 'true';
}

export function setAnalyticsOptOut(optOut: boolean): void {
  if (optOut) {
    localStorage.setItem(OPT_OUT_KEY, 'true');
  } else {
    localStorage.removeItem(OPT_OUT_KEY);
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export interface UseAnalyticsReturn {
  /** Track an analytics event (no-ops if user opted out). */
  track: (
    event: AnalyticsEvent,
    properties?: Record<string, string | number | boolean>,
  ) => void;
}

export function useAnalytics(): UseAnalyticsReturn {
  const track = useCallback(
    (
      event: AnalyticsEvent,
      properties?: Record<string, string | number | boolean>,
    ) => {
      if (isAnalyticsOptedOut()) return;

      // In development, log to console; in production this would POST to the
      // analytics endpoint or a third-party SDK.
      if (import.meta.env.DEV) {
        console.log('[analytics]', event, properties ?? {});
      }

      // Future: send to /api/analytics endpoint
      // void fetch(`${API_BASE}/api/analytics`, { ... });
    },
    [],
  );

  return { track };
}
