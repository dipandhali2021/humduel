import { describe, it, expect } from 'vitest';
import { formatTime } from '@/lib/audio';

describe('formatTime', () => {
  it('formats 0 seconds as "0:00"', () => {
    expect(formatTime(0)).toBe('0:00');
  });

  it('formats 8 seconds as "0:08"', () => {
    expect(formatTime(8)).toBe('0:08');
  });

  it('formats 59 seconds as "0:59"', () => {
    expect(formatTime(59)).toBe('0:59');
  });

  it('formats 60 seconds as "1:00"', () => {
    expect(formatTime(60)).toBe('1:00');
  });

  it('formats 65 seconds as "1:05"', () => {
    expect(formatTime(65)).toBe('1:05');
  });

  it('formats 83 seconds as "1:23"', () => {
    expect(formatTime(83)).toBe('1:23');
  });

  it('formats 3600 seconds as "60:00"', () => {
    expect(formatTime(3600)).toBe('60:00');
  });

  it('truncates fractional seconds toward zero', () => {
    expect(formatTime(8.9)).toBe('0:08');
  });

  it('returns "0:00" for NaN', () => {
    expect(formatTime(NaN)).toBe('0:00');
  });

  it('returns "0:00" for Infinity', () => {
    expect(formatTime(Infinity)).toBe('0:00');
  });

  it('returns "0:00" for negative Infinity', () => {
    expect(formatTime(-Infinity)).toBe('0:00');
  });

  it('returns "0:00" for negative values', () => {
    expect(formatTime(-1)).toBe('0:00');
    expect(formatTime(-100)).toBe('0:00');
  });

  it('zero-pads single-digit seconds', () => {
    const result = formatTime(5);
    expect(result).toBe('0:05');
    expect(result[result.indexOf(':') + 1]).toBe('0');
  });
});
