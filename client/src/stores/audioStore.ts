import { create } from 'zustand';

interface AudioState {
  isRecording: boolean;
  audioBlob: Blob | null;
  audioUrl: string | null;
  waveformData: number[];
  duration: number;
  setRecordingState: (recording: boolean) => void;
  setAudioBlob: (blob: Blob | null, url: string | null) => void;
  setWaveformData: (data: number[]) => void;
  setDuration: (duration: number) => void;
  reset: () => void;
}

const initialState = {
  isRecording: false,
  audioBlob: null,
  audioUrl: null,
  waveformData: [] as number[],
  duration: 0,
};

export const useAudioStore = create<AudioState>((set) => ({
  ...initialState,

  setRecordingState: (recording) =>
    set({ isRecording: recording }),

  setAudioBlob: (blob, url) =>
    set({ audioBlob: blob, audioUrl: url }),

  setWaveformData: (data) =>
    set({ waveformData: data }),

  setDuration: (duration) =>
    set({ duration }),

  reset: () =>
    set({ ...initialState }),
}));
