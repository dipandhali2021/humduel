import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  rateMetric,
  observeLCP,
  observeFID,
  observeCLS,
  observeFCP,
  getTTFB,
  usePerformance,
} from '@/hooks/usePerformance';

// ── rateMetric ───────────────────────────────────────────────────────────────

describe('rateMetric', () => {
  it('rates LCP ≤ 2500 as good', () => {
    expect(rateMetric('LCP', 0)).toBe('good');
    expect(rateMetric('LCP', 1200)).toBe('good');
    expect(rateMetric('LCP', 2500)).toBe('good');
  });

  it('rates LCP between 2500 and 4000 as needs-improvement', () => {
    expect(rateMetric('LCP', 2501)).toBe('needs-improvement');
    expect(rateMetric('LCP', 3500)).toBe('needs-improvement');
    expect(rateMetric('LCP', 4000)).toBe('needs-improvement');
  });

  it('rates LCP > 4000 as poor', () => {
    expect(rateMetric('LCP', 4001)).toBe('poor');
    expect(rateMetric('LCP', 10000)).toBe('poor');
  });

  it('rates FID ≤ 100 as good', () => {
    expect(rateMetric('FID', 0)).toBe('good');
    expect(rateMetric('FID', 50)).toBe('good');
    expect(rateMetric('FID', 100)).toBe('good');
  });

  it('rates FID between 100 and 300 as needs-improvement', () => {
    expect(rateMetric('FID', 101)).toBe('needs-improvement');
    expect(rateMetric('FID', 200)).toBe('needs-improvement');
    expect(rateMetric('FID', 300)).toBe('needs-improvement');
  });

  it('rates FID > 300 as poor', () => {
    expect(rateMetric('FID', 301)).toBe('poor');
  });

  it('rates CLS ≤ 0.1 as good', () => {
    expect(rateMetric('CLS', 0)).toBe('good');
    expect(rateMetric('CLS', 0.05)).toBe('good');
    expect(rateMetric('CLS', 0.1)).toBe('good');
  });

  it('rates CLS between 0.1 and 0.25 as needs-improvement', () => {
    expect(rateMetric('CLS', 0.11)).toBe('needs-improvement');
    expect(rateMetric('CLS', 0.2)).toBe('needs-improvement');
    expect(rateMetric('CLS', 0.25)).toBe('needs-improvement');
  });

  it('rates CLS > 0.25 as poor', () => {
    expect(rateMetric('CLS', 0.26)).toBe('poor');
    expect(rateMetric('CLS', 1)).toBe('poor');
  });

  it('rates FCP ≤ 1800 as good', () => {
    expect(rateMetric('FCP', 1000)).toBe('good');
    expect(rateMetric('FCP', 1800)).toBe('good');
  });

  it('rates FCP between 1800 and 3000 as needs-improvement', () => {
    expect(rateMetric('FCP', 1801)).toBe('needs-improvement');
    expect(rateMetric('FCP', 3000)).toBe('needs-improvement');
  });

  it('rates FCP > 3000 as poor', () => {
    expect(rateMetric('FCP', 3001)).toBe('poor');
  });

  it('rates TTFB ≤ 800 as good', () => {
    expect(rateMetric('TTFB', 0)).toBe('good');
    expect(rateMetric('TTFB', 800)).toBe('good');
  });

  it('rates TTFB between 800 and 1800 as needs-improvement', () => {
    expect(rateMetric('TTFB', 801)).toBe('needs-improvement');
    expect(rateMetric('TTFB', 1800)).toBe('needs-improvement');
  });

  it('rates TTFB > 1800 as poor', () => {
    expect(rateMetric('TTFB', 1801)).toBe('poor');
  });
});

// ── Observer functions ───────────────────────────────────────────────────────

describe('observeLCP', () => {
  let originalPO: typeof PerformanceObserver;

  beforeEach(() => {
    originalPO = globalThis.PerformanceObserver;
  });

  afterEach(() => {
    globalThis.PerformanceObserver = originalPO;
  });

  it('returns undefined when PerformanceObserver is unavailable', () => {
    // @ts-expect-error – testing missing API
    delete globalThis.PerformanceObserver;
    expect(observeLCP(vi.fn())).toBeUndefined();
  });

  it('calls callback with LCP metric when entries are observed', () => {
    const cb = vi.fn();
    let observerCb: (list: { getEntries: () => { startTime: number }[] }) => void;

    globalThis.PerformanceObserver = vi.fn().mockImplementation((callback) => {
      observerCb = callback;
      return { observe: vi.fn(), disconnect: vi.fn() };
    }) as unknown as typeof PerformanceObserver;

    const cleanup = observeLCP(cb);
    expect(cleanup).toBeTypeOf('function');

    // Simulate observer firing
    observerCb!({ getEntries: () => [{ startTime: 1500 }] });
    expect(cb).toHaveBeenCalledWith({
      name: 'LCP',
      value: 1500,
      rating: 'good',
    });
  });

  it('returns a cleanup function that disconnects the observer', () => {
    const disconnectFn = vi.fn();
    globalThis.PerformanceObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      disconnect: disconnectFn,
    })) as unknown as typeof PerformanceObserver;

    const cleanup = observeLCP(vi.fn());
    cleanup!();
    expect(disconnectFn).toHaveBeenCalled();
  });

  it('returns undefined when observer.observe throws', () => {
    globalThis.PerformanceObserver = vi.fn().mockImplementation(() => ({
      observe: () => { throw new Error('Not supported'); },
      disconnect: vi.fn(),
    })) as unknown as typeof PerformanceObserver;

    expect(observeLCP(vi.fn())).toBeUndefined();
  });
});

describe('observeFID', () => {
  let originalPO: typeof PerformanceObserver;

  beforeEach(() => {
    originalPO = globalThis.PerformanceObserver;
  });

  afterEach(() => {
    globalThis.PerformanceObserver = originalPO;
  });

  it('returns undefined when PerformanceObserver is unavailable', () => {
    // @ts-expect-error – testing missing API
    delete globalThis.PerformanceObserver;
    expect(observeFID(vi.fn())).toBeUndefined();
  });

  it('calls callback with FID metric from first-input entries', () => {
    const cb = vi.fn();
    let observerCb: (list: { getEntries: () => { processingStart: number; startTime: number }[] }) => void;

    globalThis.PerformanceObserver = vi.fn().mockImplementation((callback) => {
      observerCb = callback;
      return { observe: vi.fn(), disconnect: vi.fn() };
    }) as unknown as typeof PerformanceObserver;

    observeFID(cb);
    observerCb!({ getEntries: () => [{ processingStart: 150, startTime: 100 }] });

    expect(cb).toHaveBeenCalledWith({
      name: 'FID',
      value: 50,
      rating: 'good',
    });
  });
});

describe('observeCLS', () => {
  let originalPO: typeof PerformanceObserver;

  beforeEach(() => {
    originalPO = globalThis.PerformanceObserver;
  });

  afterEach(() => {
    globalThis.PerformanceObserver = originalPO;
  });

  it('returns undefined when PerformanceObserver is unavailable', () => {
    // @ts-expect-error – testing missing API
    delete globalThis.PerformanceObserver;
    expect(observeCLS(vi.fn())).toBeUndefined();
  });

  it('accumulates layout shift values excluding recent input', () => {
    const cb = vi.fn();
    let observerCb: (list: { getEntries: () => { hadRecentInput: boolean; value: number }[] }) => void;

    globalThis.PerformanceObserver = vi.fn().mockImplementation((callback) => {
      observerCb = callback;
      return { observe: vi.fn(), disconnect: vi.fn() };
    }) as unknown as typeof PerformanceObserver;

    observeCLS(cb);

    // First batch: 0.05 shift (no recent input)
    observerCb!({ getEntries: () => [{ hadRecentInput: false, value: 0.05 }] });
    expect(cb).toHaveBeenLastCalledWith(expect.objectContaining({ name: 'CLS', value: 0.05 }));

    // Second batch: 0.03 shift + one with recent input (should be ignored)
    observerCb!({
      getEntries: () => [
        { hadRecentInput: false, value: 0.03 },
        { hadRecentInput: true, value: 0.5 },
      ],
    });
    expect(cb).toHaveBeenLastCalledWith(expect.objectContaining({
      name: 'CLS',
      value: expect.closeTo(0.08, 5),
    }));
  });
});

describe('observeFCP', () => {
  let originalPO: typeof PerformanceObserver;

  beforeEach(() => {
    originalPO = globalThis.PerformanceObserver;
  });

  afterEach(() => {
    globalThis.PerformanceObserver = originalPO;
  });

  it('returns undefined when PerformanceObserver is unavailable', () => {
    // @ts-expect-error – testing missing API
    delete globalThis.PerformanceObserver;
    expect(observeFCP(vi.fn())).toBeUndefined();
  });

  it('calls callback with FCP metric from paint entries', () => {
    const cb = vi.fn();
    let observerCb: (list: { getEntries: () => { name: string; startTime: number }[] }) => void;

    globalThis.PerformanceObserver = vi.fn().mockImplementation((callback) => {
      observerCb = callback;
      return { observe: vi.fn(), disconnect: vi.fn() };
    }) as unknown as typeof PerformanceObserver;

    observeFCP(cb);
    observerCb!({
      getEntries: () => [
        { name: 'first-paint', startTime: 800 },
        { name: 'first-contentful-paint', startTime: 1200 },
      ],
    });

    expect(cb).toHaveBeenCalledWith({
      name: 'FCP',
      value: 1200,
      rating: 'good',
    });
  });

  it('does not call callback when FCP entry is missing', () => {
    const cb = vi.fn();
    let observerCb: (list: { getEntries: () => { name: string; startTime: number }[] }) => void;

    globalThis.PerformanceObserver = vi.fn().mockImplementation((callback) => {
      observerCb = callback;
      return { observe: vi.fn(), disconnect: vi.fn() };
    }) as unknown as typeof PerformanceObserver;

    observeFCP(cb);
    observerCb!({ getEntries: () => [{ name: 'first-paint', startTime: 800 }] });

    expect(cb).not.toHaveBeenCalled();
  });
});

// ── getTTFB ──────────────────────────────────────────────────────────────────

describe('getTTFB', () => {
  it('returns TTFB metric from Navigation Timing API', () => {
    const originalGetEntries = performance.getEntriesByType;
    performance.getEntriesByType = vi.fn().mockReturnValue([
      { requestStart: 10, responseStart: 110 },
    ]);

    const result = getTTFB();
    expect(result).toEqual({
      name: 'TTFB',
      value: 100,
      rating: 'good',
    });

    performance.getEntriesByType = originalGetEntries;
  });

  it('returns null when no navigation entries exist', () => {
    const originalGetEntries = performance.getEntriesByType;
    performance.getEntriesByType = vi.fn().mockReturnValue([]);

    expect(getTTFB()).toBeNull();

    performance.getEntriesByType = originalGetEntries;
  });
});

// ── usePerformance hook ──────────────────────────────────────────────────────

describe('usePerformance', () => {
  let originalPO: typeof PerformanceObserver;

  beforeEach(() => {
    originalPO = globalThis.PerformanceObserver;
  });

  afterEach(() => {
    globalThis.PerformanceObserver = originalPO;
  });

  it('sets up observers and reports TTFB on mount', () => {
    const observeFns: ReturnType<typeof vi.fn>[] = [];
    const disconnectFns: ReturnType<typeof vi.fn>[] = [];

    globalThis.PerformanceObserver = vi.fn().mockImplementation(() => {
      const disconnect = vi.fn();
      disconnectFns.push(disconnect);
      const observe = vi.fn();
      observeFns.push(observe);
      return { observe, disconnect };
    }) as unknown as typeof PerformanceObserver;

    const originalGetEntries = performance.getEntriesByType;
    performance.getEntriesByType = vi.fn().mockReturnValue([
      { requestStart: 0, responseStart: 200 },
    ]);

    const onMetric = vi.fn();
    const { unmount } = renderHook(() => usePerformance(onMetric));

    // Should have created observers for LCP, FID, CLS, FCP
    expect(observeFns).toHaveLength(4);

    // TTFB should be reported immediately
    expect(onMetric).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'TTFB', value: 200 }),
    );

    // Cleanup disconnects all observers
    unmount();
    disconnectFns.forEach((fn) => expect(fn).toHaveBeenCalled());

    performance.getEntriesByType = originalGetEntries;
  });

  it('works without a callback (no-op)', () => {
    globalThis.PerformanceObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      disconnect: vi.fn(),
    })) as unknown as typeof PerformanceObserver;

    expect(() => renderHook(() => usePerformance())).not.toThrow();
  });
});
