import { useEffect, useRef, useCallback } from 'react';

// ── Core Web Vitals metric types ─────────────────────────────────────────────

export interface WebVitalsMetric {
  name: 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

export type MetricCallback = (metric: WebVitalsMetric) => void;

// ── Thresholds (from https://web.dev/vitals/) ────────────────────────────────

const THRESHOLDS: Record<WebVitalsMetric['name'], [number, number]> = {
  LCP: [2500, 4000],
  FID: [100, 300],
  CLS: [0.1, 0.25],
  FCP: [1800, 3000],
  TTFB: [800, 1800],
};

/** Rate a raw metric value as good / needs-improvement / poor. */
export function rateMetric(
  name: WebVitalsMetric['name'],
  value: number,
): WebVitalsMetric['rating'] {
  const [good, poor] = THRESHOLDS[name];
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

// ── Observer-based metric collection ─────────────────────────────────────────

/** Observe Largest Contentful Paint. */
export function observeLCP(cb: MetricCallback): (() => void) | undefined {
  if (typeof PerformanceObserver === 'undefined') return undefined;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) {
        const value = last.startTime;
        cb({ name: 'LCP', value, rating: rateMetric('LCP', value) });
      }
    });
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
    return () => observer.disconnect();
  } catch {
    return undefined;
  }
}

/** Observe First Input Delay. */
export function observeFID(cb: MetricCallback): (() => void) | undefined {
  if (typeof PerformanceObserver === 'undefined') return undefined;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceEventTiming[];
      const first = entries[0];
      if (first) {
        const value = first.processingStart - first.startTime;
        cb({ name: 'FID', value, rating: rateMetric('FID', value) });
      }
    });
    observer.observe({ type: 'first-input', buffered: true });
    return () => observer.disconnect();
  } catch {
    return undefined;
  }
}

/** Observe Cumulative Layout Shift. */
export function observeCLS(cb: MetricCallback): (() => void) | undefined {
  if (typeof PerformanceObserver === 'undefined') return undefined;

  try {
    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & { hadRecentInput?: boolean; value?: number })[]) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value ?? 0;
        }
      }
      cb({ name: 'CLS', value: clsValue, rating: rateMetric('CLS', clsValue) });
    });
    observer.observe({ type: 'layout-shift', buffered: true });
    return () => observer.disconnect();
  } catch {
    return undefined;
  }
}

/** Observe First Contentful Paint. */
export function observeFCP(cb: MetricCallback): (() => void) | undefined {
  if (typeof PerformanceObserver === 'undefined') return undefined;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcp = entries.find((e) => e.name === 'first-contentful-paint');
      if (fcp) {
        const value = fcp.startTime;
        cb({ name: 'FCP', value, rating: rateMetric('FCP', value) });
      }
    });
    observer.observe({ type: 'paint', buffered: true });
    return () => observer.disconnect();
  } catch {
    return undefined;
  }
}

/** Read TTFB from Navigation Timing API. */
export function getTTFB(): WebVitalsMetric | null {
  if (typeof performance === 'undefined') return null;

  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (!nav) return null;

  const value = nav.responseStart - nav.requestStart;
  return { name: 'TTFB', value, rating: rateMetric('TTFB', value) };
}

// ── React hook ───────────────────────────────────────────────────────────────

/**
 * Collects all Core Web Vitals and reports them via a callback.
 *
 * Usage:
 * ```ts
 * usePerformance((metric) => {
 *   console.log(`${metric.name}: ${metric.value} (${metric.rating})`);
 * });
 * ```
 */
export function usePerformance(onMetric?: MetricCallback): void {
  const cbRef = useRef(onMetric);
  cbRef.current = onMetric;

  const report = useCallback((metric: WebVitalsMetric) => {
    cbRef.current?.(metric);
  }, []);

  useEffect(() => {
    const cleanups: ((() => void) | undefined)[] = [
      observeLCP(report),
      observeFID(report),
      observeCLS(report),
      observeFCP(report),
    ];

    // TTFB is available immediately from Navigation Timing
    const ttfb = getTTFB();
    if (ttfb) report(ttfb);

    return () => {
      cleanups.forEach((cleanup) => cleanup?.());
    };
  }, [report]);
}
