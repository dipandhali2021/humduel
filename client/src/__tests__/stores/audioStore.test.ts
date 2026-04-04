import { describe, it, expect, beforeEach } from 'vitest';
import { useAudioStore } from '@/stores/audioStore';

// Reset the store to initial state before every test to ensure isolation.
beforeEach(() => {
  useAudioStore.getState().reset();
});

describe('audioStore — initial state', () => {
  it('has isRecording set to false', () => {
    expect(useAudioStore.getState().isRecording).toBe(false);
  });

  it('has audioBlob set to null', () => {
    expect(useAudioStore.getState().audioBlob).toBeNull();
  });

  it('has audioUrl set to null', () => {
    expect(useAudioStore.getState().audioUrl).toBeNull();
  });

  it('has waveformData as an empty array', () => {
    expect(useAudioStore.getState().waveformData).toEqual([]);
  });

  it('has duration set to 0', () => {
    expect(useAudioStore.getState().duration).toBe(0);
  });
});

describe('audioStore — setRecordingState', () => {
  it('sets isRecording to true', () => {
    useAudioStore.getState().setRecordingState(true);
    expect(useAudioStore.getState().isRecording).toBe(true);
  });

  it('toggles isRecording back to false', () => {
    useAudioStore.getState().setRecordingState(true);
    useAudioStore.getState().setRecordingState(false);
    expect(useAudioStore.getState().isRecording).toBe(false);
  });

  it('does not mutate other state fields when called', () => {
    const waveformData = [0.1, 0.2, 0.3];
    useAudioStore.getState().setWaveformData(waveformData);
    useAudioStore.getState().setRecordingState(true);

    expect(useAudioStore.getState().waveformData).toEqual(waveformData);
    expect(useAudioStore.getState().audioBlob).toBeNull();
  });
});

describe('audioStore — setWaveformData', () => {
  it('stores the provided array correctly', () => {
    const data = [0.1, 0.5, 0.9, 0.3];
    useAudioStore.getState().setWaveformData(data);
    expect(useAudioStore.getState().waveformData).toEqual(data);
  });

  it('replaces a previous waveformData value', () => {
    useAudioStore.getState().setWaveformData([0.1, 0.2]);
    useAudioStore.getState().setWaveformData([0.8, 0.9, 1.0]);
    expect(useAudioStore.getState().waveformData).toEqual([0.8, 0.9, 1.0]);
  });

  it('accepts an empty array', () => {
    useAudioStore.getState().setWaveformData([1, 2, 3]);
    useAudioStore.getState().setWaveformData([]);
    expect(useAudioStore.getState().waveformData).toEqual([]);
  });
});

describe('audioStore — setAudioBlob', () => {
  it('stores blob and url', () => {
    const blob = new Blob(['audio'], { type: 'audio/webm' });
    useAudioStore.getState().setAudioBlob(blob, 'blob:http://localhost/1');
    expect(useAudioStore.getState().audioBlob).toBe(blob);
    expect(useAudioStore.getState().audioUrl).toBe('blob:http://localhost/1');
  });

  it('accepts null blob and url to clear them', () => {
    const blob = new Blob(['audio'], { type: 'audio/webm' });
    useAudioStore.getState().setAudioBlob(blob, 'blob:http://localhost/1');
    useAudioStore.getState().setAudioBlob(null, null);
    expect(useAudioStore.getState().audioBlob).toBeNull();
    expect(useAudioStore.getState().audioUrl).toBeNull();
  });
});

describe('audioStore — setDuration', () => {
  it('stores the duration value', () => {
    useAudioStore.getState().setDuration(12.5);
    expect(useAudioStore.getState().duration).toBe(12.5);
  });
});

describe('audioStore — reset', () => {
  it('returns isRecording to false', () => {
    useAudioStore.getState().setRecordingState(true);
    useAudioStore.getState().reset();
    expect(useAudioStore.getState().isRecording).toBe(false);
  });

  it('returns audioBlob to null', () => {
    const blob = new Blob(['audio'], { type: 'audio/webm' });
    useAudioStore.getState().setAudioBlob(blob, 'blob:http://localhost/1');
    useAudioStore.getState().reset();
    expect(useAudioStore.getState().audioBlob).toBeNull();
  });

  it('returns audioUrl to null', () => {
    useAudioStore.getState().setAudioBlob(new Blob(), 'blob:http://localhost/1');
    useAudioStore.getState().reset();
    expect(useAudioStore.getState().audioUrl).toBeNull();
  });

  it('returns waveformData to an empty array', () => {
    useAudioStore.getState().setWaveformData([0.1, 0.5]);
    useAudioStore.getState().reset();
    expect(useAudioStore.getState().waveformData).toEqual([]);
  });

  it('returns duration to 0', () => {
    useAudioStore.getState().setDuration(30);
    useAudioStore.getState().reset();
    expect(useAudioStore.getState().duration).toBe(0);
  });

  it('resets all fields simultaneously', () => {
    useAudioStore.getState().setRecordingState(true);
    useAudioStore.getState().setWaveformData([0.3, 0.7]);
    useAudioStore.getState().setDuration(15);
    useAudioStore.getState().reset();

    const state = useAudioStore.getState();
    expect(state.isRecording).toBe(false);
    expect(state.audioBlob).toBeNull();
    expect(state.audioUrl).toBeNull();
    expect(state.waveformData).toEqual([]);
    expect(state.duration).toBe(0);
  });
});
