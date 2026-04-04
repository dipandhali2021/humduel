import { describe, it, expect } from 'vitest';
import {
  normalizeAudioData,
  downsampleWaveform,
  generateIdleWaveform,
} from '@/lib/waveform';

describe('normalizeAudioData', () => {
  it('maps silence (byte 128) to 0', () => {
    const data = new Uint8Array([128]);
    const result = normalizeAudioData(data);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(0);
  });

  it('maps max byte (255) to ~1.0', () => {
    const data = new Uint8Array([255]);
    const result = normalizeAudioData(data);
    // (255 - 128) / 128 = 127 / 128 ≈ 0.992
    expect(result[0]).toBeCloseTo(127 / 128, 5);
  });

  it('maps min byte (0) to ~1.0', () => {
    const data = new Uint8Array([0]);
    const result = normalizeAudioData(data);
    // |0 - 128| / 128 = 128 / 128 = 1.0
    expect(result[0]).toBeCloseTo(1.0, 5);
  });

  it('maps a mid-high byte (192) to ~0.5', () => {
    const data = new Uint8Array([192]);
    const result = normalizeAudioData(data);
    // |192 - 128| / 128 = 64 / 128 = 0.5
    expect(result[0]).toBeCloseTo(0.5, 5);
  });

  it('handles an empty Uint8Array and returns an empty array', () => {
    const data = new Uint8Array([]);
    const result = normalizeAudioData(data);
    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('preserves the length of the input array', () => {
    const data = new Uint8Array([100, 128, 200, 50, 255]);
    const result = normalizeAudioData(data);
    expect(result).toHaveLength(5);
  });

  it('produces values in the range [0, 1] for all possible byte values', () => {
    const allBytes = new Uint8Array(256);
    for (let i = 0; i < 256; i++) allBytes[i] = i;
    const result = normalizeAudioData(allBytes);
    for (const val of result) {
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(1);
    }
  });
});

describe('downsampleWaveform', () => {
  it('downsamples an array of 100 values to 50 bars', () => {
    const data = Array.from({ length: 100 }, (_, i) => i / 100);
    const result = downsampleWaveform(data, 50);
    expect(result).toHaveLength(50);
  });

  it('produces averaged values when downsampling', () => {
    // 4 identical pairs → each output bar should equal that pair value
    const data = [0.2, 0.2, 0.6, 0.6];
    const result = downsampleWaveform(data, 2);
    expect(result).toHaveLength(2);
    expect(result[0]).toBeCloseTo(0.2, 5);
    expect(result[1]).toBeCloseTo(0.6, 5);
  });

  it('upsamples an array of 10 values to 50 bars via interpolation', () => {
    const data = Array.from({ length: 10 }, (_, i) => i / 9);
    const result = downsampleWaveform(data, 50);
    expect(result).toHaveLength(50);
    // First element should equal data[0] = 0
    expect(result[0]).toBeCloseTo(0, 5);
    // Last element should equal data[9] = 1
    expect(result[49]).toBeCloseTo(1, 5);
  });

  it('returns a copy of the array when lengths match', () => {
    const data = [0.1, 0.5, 0.9];
    const result = downsampleWaveform(data, 3);
    expect(result).toHaveLength(3);
    expect(result).toEqual(data);
    // Must be a copy, not the same reference
    expect(result).not.toBe(data);
  });

  it('returns an array of zeros when given an empty input', () => {
    const result = downsampleWaveform([], 10);
    expect(result).toHaveLength(10);
    expect(result.every((v) => v === 0)).toBe(true);
  });

  it('returns an empty array when targetBars is 0', () => {
    const result = downsampleWaveform([1, 2, 3], 0);
    expect(result).toHaveLength(0);
  });

  it('output values are within [0, 1] when inputs are within [0, 1]', () => {
    const data = Array.from({ length: 64 }, () => Math.random());
    const result = downsampleWaveform(data, 30);
    for (const val of result) {
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(1);
    }
  });
});

describe('generateIdleWaveform', () => {
  it('returns an array of the requested length', () => {
    expect(generateIdleWaveform(60)).toHaveLength(60);
    expect(generateIdleWaveform(1)).toHaveLength(1);
    expect(generateIdleWaveform(0)).toHaveLength(0);
  });

  it('all values are between 0 and 1', () => {
    const result = generateIdleWaveform(200);
    for (const val of result) {
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(1);
    }
  });

  it('all values are in the small-amplitude idle range [0.03, 0.25]', () => {
    // Run several times to account for randomness
    for (let run = 0; run < 5; run++) {
      const result = generateIdleWaveform(64);
      for (const val of result) {
        expect(val).toBeGreaterThanOrEqual(0.03);
        expect(val).toBeLessThanOrEqual(0.25);
      }
    }
  });

  it('returns an Array (not a Uint8Array or other typed array)', () => {
    const result = generateIdleWaveform(32);
    expect(Array.isArray(result)).toBe(true);
  });
});
