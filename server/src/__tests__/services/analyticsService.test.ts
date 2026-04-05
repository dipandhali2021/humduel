/**
 * Unit tests for analyticsService.ts
 *
 * Tests the analytics abstraction layer: event tracking, backend swapping,
 * console and noop backends, and payload structure.
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  trackEvent,
  setBackend,
  getBackend,
  consoleBackend,
  noopBackend,
  type AnalyticsBackend,
  type AnalyticsPayload,
  type AnalyticsEvent,
} from '../../services/analyticsService.js';

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

let originalBackend: AnalyticsBackend;

beforeEach(() => {
  originalBackend = getBackend();
});

afterEach(() => {
  setBackend(originalBackend);
  vi.restoreAllMocks();
});

// ===========================================================================
// trackEvent
// ===========================================================================

describe('trackEvent', () => {
  it('calls the active backend with the correct event name', () => {
    const spy: AnalyticsPayload[] = [];
    setBackend({ track: (p) => spy.push(p) });

    trackEvent('game_started');

    expect(spy).toHaveLength(1);
    expect(spy[0]!.event).toBe('game_started');
  });

  it('includes an ISO-8601 timestamp', () => {
    const spy: AnalyticsPayload[] = [];
    setBackend({ track: (p) => spy.push(p) });

    trackEvent('guess_made');

    expect(spy[0]!.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('forwards optional properties', () => {
    const spy: AnalyticsPayload[] = [];
    setBackend({ track: (p) => spy.push(p) });

    trackEvent('game_won', { attempts: 3, puzzleNumber: 5 });

    expect(spy[0]!.properties).toEqual({ attempts: 3, puzzleNumber: 5 });
  });

  it('forwards optional sessionId', () => {
    const spy: AnalyticsPayload[] = [];
    setBackend({ track: (p) => spy.push(p) });

    trackEvent('game_lost', undefined, 'sess-abc');

    expect(spy[0]!.sessionId).toBe('sess-abc');
  });

  it('sets properties to undefined when not provided', () => {
    const spy: AnalyticsPayload[] = [];
    setBackend({ track: (p) => spy.push(p) });

    trackEvent('daily_played');

    expect(spy[0]!.properties).toBeUndefined();
  });

  it('sets sessionId to undefined when not provided', () => {
    const spy: AnalyticsPayload[] = [];
    setBackend({ track: (p) => spy.push(p) });

    trackEvent('challenge_shared');

    expect(spy[0]!.sessionId).toBeUndefined();
  });

  it('tracks all supported event types', () => {
    const spy: AnalyticsPayload[] = [];
    setBackend({ track: (p) => spy.push(p) });

    const events: AnalyticsEvent[] = [
      'game_started',
      'guess_made',
      'game_won',
      'game_lost',
      'challenge_shared',
      'daily_played',
    ];

    events.forEach((e) => trackEvent(e));

    expect(spy).toHaveLength(6);
    expect(spy.map((p) => p.event)).toEqual(events);
  });

  it('can track multiple events sequentially', () => {
    const spy: AnalyticsPayload[] = [];
    setBackend({ track: (p) => spy.push(p) });

    trackEvent('game_started', { mode: 'daily' });
    trackEvent('guess_made', { attempt: 1 });
    trackEvent('game_won', { attempts: 1 });

    expect(spy).toHaveLength(3);
  });

  it('passes boolean properties correctly', () => {
    const spy: AnalyticsPayload[] = [];
    setBackend({ track: (p) => spy.push(p) });

    trackEvent('game_won', { firstTry: true });

    expect(spy[0]!.properties!['firstTry']).toBe(true);
  });

  it('passes string properties correctly', () => {
    const spy: AnalyticsPayload[] = [];
    setBackend({ track: (p) => spy.push(p) });

    trackEvent('game_started', { mode: 'challenge' });

    expect(spy[0]!.properties!['mode']).toBe('challenge');
  });
});

// ===========================================================================
// setBackend / getBackend
// ===========================================================================

describe('setBackend / getBackend', () => {
  it('replaces the active backend', () => {
    const custom: AnalyticsBackend = { track: vi.fn() };
    setBackend(custom);

    expect(getBackend()).toBe(custom);
  });

  it('new backend receives events after swap', () => {
    const first = { track: vi.fn() };
    const second = { track: vi.fn() };

    setBackend(first);
    trackEvent('game_started');

    setBackend(second);
    trackEvent('game_won');

    expect(first.track).toHaveBeenCalledTimes(1);
    expect(second.track).toHaveBeenCalledTimes(1);
  });

  it('old backend stops receiving events after swap', () => {
    const old = { track: vi.fn() };
    const replacement = { track: vi.fn() };

    setBackend(old);
    trackEvent('game_started');

    setBackend(replacement);
    trackEvent('game_won');
    trackEvent('game_lost');

    expect(old.track).toHaveBeenCalledTimes(1);
  });
});

// ===========================================================================
// consoleBackend
// ===========================================================================

describe('consoleBackend', () => {
  it('logs to console.log', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    consoleBackend.track({
      event: 'game_started',
      timestamp: new Date().toISOString(),
    });

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith(
      '[analytics]',
      'game_started',
      expect.anything(),
    );
  });

  it('logs properties when provided', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    consoleBackend.track({
      event: 'guess_made',
      properties: { attempt: 2 },
      timestamp: new Date().toISOString(),
    });

    expect(logSpy).toHaveBeenCalledWith('[analytics]', 'guess_made', {
      attempt: 2,
    });
  });

  it('logs empty object when no properties', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    consoleBackend.track({
      event: 'daily_played',
      timestamp: new Date().toISOString(),
    });

    expect(logSpy).toHaveBeenCalledWith('[analytics]', 'daily_played', {});
  });
});

// ===========================================================================
// noopBackend
// ===========================================================================

describe('noopBackend', () => {
  it('does not throw', () => {
    expect(() =>
      noopBackend.track({
        event: 'game_started',
        timestamp: new Date().toISOString(),
      }),
    ).not.toThrow();
  });

  it('does not log to console', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    noopBackend.track({
      event: 'game_won',
      timestamp: new Date().toISOString(),
    });

    expect(logSpy).not.toHaveBeenCalled();
  });
});
