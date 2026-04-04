/**
 * Waveform utility functions for HumDuel audio visualization.
 * All pure functions — no side effects, no React imports.
 */

/**
 * Normalize raw audio byte data (0-255) to 0-1 range.
 * Audio time-domain data from Web Audio API is centered at 128 (silence).
 * We map the deviation from center to an absolute amplitude in [0, 1].
 */
export function normalizeAudioData(data: Uint8Array): number[] {
  const result: number[] = new Array(data.length);
  for (let i = 0; i < data.length; i++) {
    // Center at 128, take absolute deviation, normalize to [0, 1]
    result[i] = Math.abs(data[i] - 128) / 128;
  }
  return result;
}

/**
 * Downsample (or upsample) a waveform array to exactly `targetBars` points.
 * When downsampling: averages groups of source points.
 * When upsampling: linearly interpolates between source points.
 */
export function downsampleWaveform(data: number[], targetBars: number): number[] {
  if (data.length === 0 || targetBars <= 0) return new Array(targetBars).fill(0);
  if (data.length === targetBars) return data.slice();

  const result: number[] = new Array(targetBars);

  if (data.length > targetBars) {
    // Downsampling — average groups
    const ratio = data.length / targetBars;
    for (let i = 0; i < targetBars; i++) {
      const start = i * ratio;
      const end = start + ratio;
      const startIdx = Math.floor(start);
      const endIdx = Math.min(Math.ceil(end), data.length);
      let sum = 0;
      let count = 0;
      for (let j = startIdx; j < endIdx; j++) {
        sum += data[j];
        count++;
      }
      result[i] = count > 0 ? sum / count : 0;
    }
  } else {
    // Upsampling — linear interpolation
    const ratio = (data.length - 1) / Math.max(targetBars - 1, 1);
    for (let i = 0; i < targetBars; i++) {
      const pos = i * ratio;
      const lower = Math.floor(pos);
      const upper = Math.min(lower + 1, data.length - 1);
      const t = pos - lower;
      result[i] = data[lower] * (1 - t) + data[upper] * t;
    }
  }

  return result;
}

/**
 * Generate a random idle waveform for the "mic not started" animation.
 * Returns values in [0.05, 0.25] — small, organic-looking amplitudes.
 */
export function generateIdleWaveform(barCount: number): number[] {
  const result: number[] = new Array(barCount);
  for (let i = 0; i < barCount; i++) {
    // Use a sine wave base + small random jitter for a breathing feel
    const base = 0.05 + 0.1 * Math.sin((i / barCount) * Math.PI * 2);
    const jitter = (Math.random() - 0.5) * 0.06;
    result[i] = Math.max(0.03, Math.min(0.25, base + jitter));
  }
  return result;
}

/**
 * Create a left-to-right linear CanvasGradient for the three brand colors.
 */
export function createWaveformGradient(
  ctx: CanvasRenderingContext2D,
  width: number,
  colors: [string, string, string],
): CanvasGradient {
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, colors[0]);   // violet
  gradient.addColorStop(0.5, colors[1]); // blue
  gradient.addColorStop(1, colors[2]);   // pink
  return gradient;
}

/**
 * Draw a rounded rectangle path helper.
 * Falls back to manual arc-based path for environments without roundRect.
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
): void {
  const r = Math.min(radius, w / 2, h / 2);
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

/**
 * Draw one frame of waveform bars onto the canvas context.
 *
 * Each bar is centered vertically, extends both above and below the midline,
 * with rounded caps on both ends. Bars are filled using the provided gradient.
 *
 * @param ctx       - 2D rendering context (already scaled for DPR by caller)
 * @param data      - normalized amplitude values in [0, 1] (one per bar)
 * @param width     - logical canvas width in CSS pixels
 * @param height    - logical canvas height in CSS pixels
 * @param gradient  - pre-built CanvasGradient spanning the full width
 * @param barWidth  - width of each bar in CSS pixels
 * @param barGap    - gap between bars in CSS pixels
 */
export function drawWaveformBars(
  ctx: CanvasRenderingContext2D,
  data: number[],
  width: number,
  height: number,
  gradient: CanvasGradient,
  barWidth: number,
  barGap: number,
): void {
  ctx.clearRect(0, 0, width, height);

  if (data.length === 0) return;

  const centerY = height / 2;
  const minHalfHeight = 2; // 4px total minimum bar height
  const cornerRadius = 2;

  ctx.fillStyle = gradient;

  for (let i = 0; i < data.length; i++) {
    const x = i * (barWidth + barGap);

    // Clamp amplitude to [0, 1], compute half-height from center
    const amplitude = Math.max(0, Math.min(1, data[i]));
    const halfHeight = Math.max(minHalfHeight, amplitude * (height / 2));

    const barX = x;
    const barY = centerY - halfHeight;
    const barH = halfHeight * 2;

    ctx.beginPath();
    drawRoundedRect(ctx, barX, barY, barWidth, barH, cornerRadius);
    ctx.fill();
  }
}

/**
 * Capture a static waveform snapshot from a live AnalyserNode.
 * Returns normalized amplitude values ready for static rendering.
 */
export function captureWaveformSnapshot(
  analyser: AnalyserNode,
  barCount = 64,
): number[] {
  const buffer = new Uint8Array(analyser.fftSize);
  analyser.getByteTimeDomainData(buffer);
  const normalized = normalizeAudioData(buffer);
  return downsampleWaveform(normalized, barCount);
}
