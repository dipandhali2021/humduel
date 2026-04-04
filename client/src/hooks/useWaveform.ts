import { useRef, useEffect, useCallback, useState } from 'react';
import {
  normalizeAudioData,
  downsampleWaveform,
  generateIdleWaveform,
  createWaveformGradient,
  drawWaveformBars,
} from '@/lib/waveform';

const DEFAULT_GRADIENT: [string, string, string] = ['#7C3AED', '#3B82F6', '#EC4899'];
const DEFAULT_BAR_WIDTH = 3;
const DEFAULT_BAR_GAP = 2;
const IDLE_INTERVAL_MS = 120; // how often the idle animation regenerates bars

export interface UseWaveformOptions {
  analyserNode: AnalyserNode | null;
  mode: 'live' | 'static';
  staticData?: number[];
  height?: number;
  gradient?: [string, string, string];
  barWidth?: number;
  barGap?: number;
}

export interface UseWaveformReturn {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isAnimating: boolean;
}

/**
 * Manages all Canvas-based waveform rendering lifecycle:
 *   - ResizeObserver for responsive, DPR-aware sizing
 *   - requestAnimationFrame loop for live mode
 *   - Idle animation when no analyserNode is present
 *   - Static rendering for saved waveform data
 *   - Respects prefers-reduced-motion
 */
export function useWaveform({
  analyserNode,
  mode,
  staticData,
  height: _height,
  gradient = DEFAULT_GRADIENT,
  barWidth = DEFAULT_BAR_WIDTH,
  barGap = DEFAULT_BAR_GAP,
}: UseWaveformOptions): UseWaveformReturn {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Stable refs so animation callbacks always see current values
  const analyserRef = useRef(analyserNode);
  const staticDataRef = useRef(staticData);
  const modeRef = useRef(mode);
  const gradientRef = useRef(gradient);
  const barWidthRef = useRef(barWidth);
  const barGapRef = useRef(barGap);

  analyserRef.current = analyserNode;
  staticDataRef.current = staticData;
  modeRef.current = mode;
  gradientRef.current = gradient;
  barWidthRef.current = barWidth;
  barGapRef.current = barGap;

  // Track canvas logical dimensions (after DPR scaling)
  const dimsRef = useRef({ width: 0, height: 0 });

  // rAF / interval handle refs for cleanup
  const rafRef = useRef<number>(0);
  const idleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const idleDataRef = useRef<number[]>([]);

  // Check reduced-motion once (stable for the component lifetime)
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  ).current;

  /** Compute the number of bars that fit in the current canvas width. */
  const barCount = useCallback((): number => {
    const bw = barWidthRef.current;
    const bg = barGapRef.current;
    return Math.max(1, Math.floor(dimsRef.current.width / (bw + bg)));
  }, []);

  /** (Re-)create gradient using current canvas width and gradient colors. */
  const makeGradient = useCallback(
    (ctx: CanvasRenderingContext2D): CanvasGradient =>
      createWaveformGradient(ctx, dimsRef.current.width, gradientRef.current),
    [],
  );

  /** Draw one frame — works for both live and idle paths. */
  const renderFrame = useCallback(
    (ctx: CanvasRenderingContext2D, data: number[]) => {
      const { width, height } = dimsRef.current;
      const grad = makeGradient(ctx);
      const count = barCount();
      const prepared = downsampleWaveform(data, count);
      drawWaveformBars(
        ctx,
        prepared,
        width,
        height,
        grad,
        barWidthRef.current,
        barGapRef.current,
      );
    },
    [barCount, makeGradient],
  );

  /** Stop any running animation loops. */
  const stopAnimation = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    if (idleTimerRef.current !== null) {
      clearInterval(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    setIsAnimating(false);
  }, []);

  /** Start the live rAF loop reading from the AnalyserNode. */
  const startLiveLoop = useCallback(
    (ctx: CanvasRenderingContext2D, analyser: AnalyserNode) => {
      const buffer = new Uint8Array(analyser.fftSize);

      const loop = () => {
        analyser.getByteTimeDomainData(buffer);
        const normalized = normalizeAudioData(buffer);
        renderFrame(ctx, normalized);
        rafRef.current = requestAnimationFrame(loop);
      };

      setIsAnimating(true);
      rafRef.current = requestAnimationFrame(loop);
    },
    [renderFrame],
  );

  /** Start the idle animation (periodic regeneration of random small bars). */
  const startIdleAnimation = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      // Seed initial idle data
      idleDataRef.current = generateIdleWaveform(barCount());
      renderFrame(ctx, idleDataRef.current);

      if (prefersReducedMotion) {
        // Just show a static gentle idle state — no animation
        return;
      }

      setIsAnimating(true);
      idleTimerRef.current = setInterval(() => {
        idleDataRef.current = generateIdleWaveform(barCount());
        renderFrame(ctx, idleDataRef.current);
      }, IDLE_INTERVAL_MS);
    },
    [barCount, prefersReducedMotion, renderFrame],
  );

  /** Render static data once (no animation). */
  const renderStatic = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const data = staticDataRef.current ?? [];
      renderFrame(ctx, data);
    },
    [renderFrame],
  );

  // -------------------------------------------------------------------------
  // ResizeObserver — keeps canvas DPR-aware and triggers a re-render on resize
  // -------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height: containerHeight } = entry.contentRect;
        const dpr = window.devicePixelRatio || 1;
        const logicalHeight = _height ?? containerHeight;

        // Update the canvas bitmap size
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(logicalHeight * dpr);

        // Store logical dimensions for rendering math
        dimsRef.current = { width, height: logicalHeight };

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Scale context once for DPR — all drawing uses CSS pixel coords
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Immediately re-draw so the canvas is never blank after resize
        const currentMode = modeRef.current;
        const currentAnalyser = analyserRef.current;

        if (currentMode === 'static') {
          renderStatic(ctx);
        } else if (currentMode === 'live' && currentAnalyser) {
          // Live loop will pick up the new size on the next frame automatically
          // Just do a single preview draw here
          const buf = new Uint8Array(currentAnalyser.fftSize);
          currentAnalyser.getByteTimeDomainData(buf);
          renderFrame(ctx, normalizeAudioData(buf));
        } else {
          // Idle
          idleDataRef.current = generateIdleWaveform(barCount());
          renderFrame(ctx, idleDataRef.current);
        }
      }
    });

    observer.observe(canvas);
    return () => observer.disconnect();
  }, [_height, barCount, renderFrame, renderStatic]);

  // -------------------------------------------------------------------------
  // Main animation orchestrator — runs when mode / analyserNode change
  // -------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Stop whatever was running before
    stopAnimation();

    if (mode === 'live') {
      if (analyserNode) {
        if (prefersReducedMotion) {
          // Single static frame from the analyser, no loop
          const buf = new Uint8Array(analyserNode.fftSize);
          analyserNode.getByteTimeDomainData(buf);
          renderFrame(ctx, normalizeAudioData(buf));
        } else {
          startLiveLoop(ctx, analyserNode);
        }
      } else {
        // No mic yet — show idle animation
        startIdleAnimation(ctx);
      }
    } else {
      // Static mode
      renderStatic(ctx);
    }

    return stopAnimation;
  }, [
    mode,
    analyserNode,
    prefersReducedMotion,
    stopAnimation,
    startLiveLoop,
    startIdleAnimation,
    renderStatic,
    renderFrame,
  ]);

  // -------------------------------------------------------------------------
  // Re-render when staticData changes (static mode only)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (mode !== 'static') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    renderStatic(ctx);
  }, [mode, staticData, renderStatic]);

  return { canvasRef, isAnimating };
}
