import { useWaveform } from '@/hooks/useWaveform';

export interface WaveformCanvasProps {
  /** Live mode: pass the AnalyserNode from useAudioRecorder */
  analyserNode?: AnalyserNode | null;
  /** Static mode: pass a saved normalized waveform array */
  waveformData?: number[];
  mode: 'live' | 'static';
  /** Canvas height in CSS pixels. Default: 120 */
  height?: number;
  /** Three-stop gradient: [left, center, right]. Default: violet → blue → pink */
  gradient?: [string, string, string];
  /** Width of each bar in CSS pixels. Default: 3 */
  barWidth?: number;
  /** Gap between bars in CSS pixels. Default: 2 */
  barGap?: number;
  className?: string;
}

const DEFAULT_GRADIENT: [string, string, string] = ['#7C3AED', '#3B82F6', '#EC4899'];

/**
 * WaveformCanvas
 *
 * Renders an audio waveform as a series of vertical gradient bars on a <canvas>.
 *
 * - **live mode**: drives a requestAnimationFrame loop reading from `analyserNode`.
 *   When no analyserNode is provided yet, displays a subtle idle animation.
 * - **static mode**: renders `waveformData` once; re-renders when data changes.
 *
 * Fully responsive via ResizeObserver and DPI-aware (retina display safe).
 * Respects `prefers-reduced-motion`.
 */
export function WaveformCanvas({
  analyserNode = null,
  waveformData,
  mode,
  height = 120,
  gradient = DEFAULT_GRADIENT,
  barWidth = 3,
  barGap = 2,
  className,
}: WaveformCanvasProps) {
  const { canvasRef } = useWaveform({
    analyserNode,
    mode,
    staticData: waveformData,
    height,
    gradient,
    barWidth,
    barGap,
  });

  return (
    <canvas
      ref={canvasRef}
      // The canvas element fills its container horizontally.
      // Height is controlled via inline style to match the `height` prop.
      // Width/height attributes are set in JS (DPR-aware); CSS size controls layout.
      style={{ height: `${height}px` }}
      className={`block w-full${className ? ` ${className}` : ''}`}
      aria-label={mode === 'live' ? 'Live audio waveform' : 'Audio waveform preview'}
      role="img"
    />
  );
}

export default WaveformCanvas;
