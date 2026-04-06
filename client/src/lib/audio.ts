/**
 * Audio utility functions for HumDuel.
 * All pure/async helpers — no React imports, no side effects beyond what
 * the caller explicitly requests.
 */

/**
 * Format a duration in seconds to "m:ss" display string.
 * Returns "0:00" for NaN, Infinity, or negative values.
 *
 * Examples:
 *   formatTime(8)    → "0:08"
 *   formatTime(83)   → "1:23"
 *   formatTime(NaN)  → "0:00"
 */
export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) {
    return '0:00';
  }
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Create an AudioContext, handling the webkit-prefixed variant for older
 * Safari versions.
 */
export function createAudioContext(options?: AudioContextOptions): AudioContext {
  const AudioCtx =
    window.AudioContext ??
     
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

  if (!AudioCtx) {
    throw new Error('Web Audio API is not supported in this browser.');
  }

  return new AudioCtx(options) as AudioContext;
}

/**
 * Return the best supported audio MIME type for recording/playback.
 * Priority: opus in webm → plain webm → mp4 → ogg → empty string (unknown).
 */
export function getSupportedMimeType(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/ogg',
  ];

  if (typeof MediaRecorder === 'undefined') {
    // Non-recording environment (SSR tests, etc.) — return a sensible default
    return 'audio/webm';
  }

  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }

  return '';
}

/**
 * Read a Blob as an ArrayBuffer.
 * Thin Promise wrapper around the FileReader API.
 */
export function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error ?? new Error('FileReader error'));
    reader.readAsArrayBuffer(blob);
  });
}

/**
 * Decode an audio Blob into an array of normalized amplitude values suitable
 * for static waveform visualization.
 *
 * Steps:
 *  1. Blob → ArrayBuffer
 *  2. OfflineAudioContext.decodeAudioData → AudioBuffer
 *  3. Extract channel 0 (Float32Array, values in [-1, 1])
 *  4. Downsample to `barCount` bars by averaging absolute values in each group
 *  5. Normalize the entire result to [0, 1] relative to the loudest bar
 *
 * @param blob      - Audio Blob (webm, mp4, ogg, etc.)
 * @param barCount  - Number of output bars (default 64)
 * @returns         - Array of length `barCount` with values in [0, 1]
 */
export async function extractWaveformFromBlob(
  blob: Blob,
  barCount = 64,
): Promise<number[]> {
  if (barCount <= 0) return [];

  const arrayBuffer = await blobToArrayBuffer(blob);

  // OfflineAudioContext needs at least 1 sample; use a minimal valid context.
  // We only need mono channel data so 1 channel is fine.
  const sampleRate = 44100;
  const offlineCtx = new OfflineAudioContext(1, sampleRate, sampleRate);

  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await offlineCtx.decodeAudioData(arrayBuffer);
  } catch {
    // Decode failed (truncated / unsupported codec) — return flat waveform
    return new Array(barCount).fill(0.05) as number[];
  }

  const channelData = audioBuffer.getChannelData(0); // Float32Array, [-1, 1]
  const totalSamples = channelData.length;
  const groupSize = Math.max(1, Math.floor(totalSamples / barCount));

  const bars: number[] = new Array(barCount) as number[];
  for (let i = 0; i < barCount; i++) {
    const start = i * groupSize;
    const end = Math.min(start + groupSize, totalSamples);
    let sum = 0;
    for (let j = start; j < end; j++) {
      sum += Math.abs(channelData[j] ?? 0);
    }
    bars[i] = sum / (end - start);
  }

  // Normalize to [0, 1] relative to the peak bar so the waveform fills nicely
  const peak = Math.max(...bars);
  if (peak > 0) {
    for (let i = 0; i < bars.length; i++) {
      bars[i] = (bars[i] ?? 0) / peak;
    }
  }

  return bars;
}
