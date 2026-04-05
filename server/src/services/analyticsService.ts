/**
 * Analytics Service — privacy-aware event tracking abstraction.
 *
 * Ships with a console backend for development and a no-op backend for
 * production until a real provider (e.g. PostHog, Plausible) is wired up.
 * The abstraction lets us swap backends without touching call sites.
 */

// ─── Event types ─────────────────────────────────────────────────────────────

export type AnalyticsEvent =
  | 'game_started'
  | 'guess_made'
  | 'game_won'
  | 'game_lost'
  | 'challenge_shared'
  | 'daily_played';

export interface AnalyticsPayload {
  event: AnalyticsEvent;
  /** Anonymised session/user identifier — never PII. */
  sessionId?: string;
  /** Optional structured properties (no PII). */
  properties?: Record<string, string | number | boolean>;
  timestamp: string;
}

// ─── Backend interface ───────────────────────────────────────────────────────

export interface AnalyticsBackend {
  track(payload: AnalyticsPayload): void;
}

// ─── Built-in backends ───────────────────────────────────────────────────────

/** Logs events to stdout — useful in development. */
export const consoleBackend: AnalyticsBackend = {
  track(payload) {
    console.log('[analytics]', payload.event, payload.properties ?? {});
  },
};

/** Silently discards events — used when analytics are disabled. */
export const noopBackend: AnalyticsBackend = {
  track() {
    // intentionally empty
  },
};

// ─── Service singleton ───────────────────────────────────────────────────────

let backend: AnalyticsBackend =
  process.env['NODE_ENV'] === 'production' ? noopBackend : consoleBackend;

/** Replace the active analytics backend at runtime. */
export function setBackend(b: AnalyticsBackend): void {
  backend = b;
}

/** Return the currently active backend (mainly for testing). */
export function getBackend(): AnalyticsBackend {
  return backend;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Track an analytics event. Attaches an ISO-8601 timestamp automatically.
 *
 * All data must be non-PII:
 * - sessionId: opaque string (nanoid), not an email/IP
 * - properties: counts, durations, puzzle numbers — never names or IPs
 */
export function trackEvent(
  event: AnalyticsEvent,
  properties?: Record<string, string | number | boolean>,
  sessionId?: string,
): void {
  const payload: AnalyticsPayload = {
    event,
    sessionId,
    properties,
    timestamp: new Date().toISOString(),
  };
  backend.track(payload);
}
