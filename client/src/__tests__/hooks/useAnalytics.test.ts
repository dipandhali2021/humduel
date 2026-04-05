/**
 * Unit tests for useAnalytics hook and opt-out helpers.
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useAnalytics,
  isAnalyticsOptedOut,
  setAnalyticsOptOut,
} from '@/hooks/useAnalytics';

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ===========================================================================
// Opt-out helpers
// ===========================================================================

describe('isAnalyticsOptedOut', () => {
  it('returns false by default (no key in localStorage)', () => {
    expect(isAnalyticsOptedOut()).toBe(false);
  });

  it('returns true when opt-out key is set to "true"', () => {
    localStorage.setItem('humduel:analyticsOptOut', 'true');
    expect(isAnalyticsOptedOut()).toBe(true);
  });

  it('returns false when opt-out key is set to something other than "true"', () => {
    localStorage.setItem('humduel:analyticsOptOut', 'false');
    expect(isAnalyticsOptedOut()).toBe(false);
  });
});

describe('setAnalyticsOptOut', () => {
  it('sets opt-out key to "true" when called with true', () => {
    setAnalyticsOptOut(true);
    expect(localStorage.getItem('humduel:analyticsOptOut')).toBe('true');
  });

  it('removes opt-out key when called with false', () => {
    localStorage.setItem('humduel:analyticsOptOut', 'true');
    setAnalyticsOptOut(false);
    expect(localStorage.getItem('humduel:analyticsOptOut')).toBeNull();
  });

  it('calling setAnalyticsOptOut(true) then (false) results in not opted out', () => {
    setAnalyticsOptOut(true);
    setAnalyticsOptOut(false);
    expect(isAnalyticsOptedOut()).toBe(false);
  });

  it('calling setAnalyticsOptOut(false) then (true) results in opted out', () => {
    setAnalyticsOptOut(false);
    setAnalyticsOptOut(true);
    expect(isAnalyticsOptedOut()).toBe(true);
  });
});

// ===========================================================================
// useAnalytics hook
// ===========================================================================

describe('useAnalytics', () => {
  it('returns a track function', () => {
    const { result } = renderHook(() => useAnalytics());
    expect(typeof result.current.track).toBe('function');
  });

  it('logs to console in dev mode when not opted out', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.track('game_started');
    });

    expect(logSpy).toHaveBeenCalledWith(
      '[analytics]',
      'game_started',
      expect.anything(),
    );
  });

  it('does not log when user has opted out', () => {
    setAnalyticsOptOut(true);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.track('game_started');
    });

    expect(logSpy).not.toHaveBeenCalled();
  });

  it('passes properties to console.log', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.track('guess_made', { attempt: 1 });
    });

    expect(logSpy).toHaveBeenCalledWith('[analytics]', 'guess_made', {
      attempt: 1,
    });
  });

  it('logs empty object when no properties given', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.track('daily_played');
    });

    expect(logSpy).toHaveBeenCalledWith('[analytics]', 'daily_played', {});
  });

  it('can track multiple events', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.track('game_started');
      result.current.track('guess_made', { attempt: 1 });
      result.current.track('game_won', { attempts: 1 });
    });

    expect(logSpy).toHaveBeenCalledTimes(3);
  });

  it('respects opt-out change between calls', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.track('game_started');
    });
    expect(logSpy).toHaveBeenCalledTimes(1);

    setAnalyticsOptOut(true);

    act(() => {
      result.current.track('guess_made');
    });
    // Should still be 1 — second call was suppressed
    expect(logSpy).toHaveBeenCalledTimes(1);
  });

  it('resumes tracking when opt-out is cleared', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    setAnalyticsOptOut(true);

    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.track('game_started');
    });
    expect(logSpy).toHaveBeenCalledTimes(0);

    setAnalyticsOptOut(false);

    act(() => {
      result.current.track('game_won');
    });
    expect(logSpy).toHaveBeenCalledTimes(1);
  });

  it('track function reference is stable across re-renders', () => {
    const { result, rerender } = renderHook(() => useAnalytics());
    const first = result.current.track;
    rerender();
    expect(result.current.track).toBe(first);
  });
});
