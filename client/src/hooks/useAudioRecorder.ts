import { useState, useRef, useCallback, useEffect } from 'react';
import type { RecordingState } from '@/types';

export const MAX_DURATION = 15; // seconds
export const MIN_DURATION = 2; // seconds

export interface UseAudioRecorderReturn {
  state: RecordingState;
  audioBlob: Blob | null;
  audioUrl: string | null;
  duration: number;
  analyserNode: AnalyserNode | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  resetRecording: () => void;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [state, setState] = useState<RecordingState>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  // Refs so callbacks always see fresh values without re-creating them
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const rafIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const blobUrlRef = useRef<string | null>(null);

  const stopTimerLoop = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  const startTimerLoop = useCallback(() => {
    startTimeRef.current = performance.now();

    const tick = () => {
      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      setDuration(elapsed);

      if (elapsed >= MAX_DURATION) {
        // Auto-stop — trigger stopRecording via a flag so the closure stays simple
        stopTimerLoop();
        // We fire the MediaRecorder stop directly; stopRecording handles the rest
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state === 'recording'
        ) {
          mediaRecorderRef.current.stop();
        }
        return;
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);
  }, [stopTimerLoop]);

  const teardownAudio = useCallback(() => {
    stopTimerLoop();

    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }

    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      // Close asynchronously; we don't need to await it
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setAnalyserNode(null);
  }, [stopTimerLoop]);

  const startRecording = useCallback(async () => {
    // If already active, do nothing
    if (state === 'recording' || state === 'requesting') return;

    setState('requesting');
    chunksRef.current = [];
    setDuration(0);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      // Permission denied or device unavailable — fall back to idle silently
      setState('idle');
      return;
    }

    // AudioContext at 44.1 kHz
    const audioCtx = new AudioContext({ sampleRate: 44100 });
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;

    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);

    audioContextRef.current = audioCtx;
    analyserRef.current = analyser;
    sourceNodeRef.current = source;
    mediaStreamRef.current = stream;

    // Expose analyser to consumers for live waveform rendering
    setAnalyserNode(analyser);

    // MediaRecorder for capture
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : '';

    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

    recorder.ondataavailable = (event: BlobEvent) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      stopTimerLoop();

      const blob = new Blob(chunksRef.current, {
        type: mimeType || 'audio/webm',
      });

      // Revoke any previous blob URL
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }

      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;

      setAudioBlob(blob);
      setAudioUrl(url);
      setState('preview');

      // Tear down mic and audio graph — keep analyser ref alive momentarily
      // so parent can take a final snapshot before we clear it
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    };

    mediaRecorderRef.current = recorder;
    recorder.start(100); // collect chunks every 100 ms

    setState('recording');
    startTimerLoop();
  }, [state, startTimerLoop, stopTimerLoop]);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'recording'
    ) {
      mediaRecorderRef.current.stop();
    }
    stopTimerLoop();
  }, [stopTimerLoop]);

  const resetRecording = useCallback(() => {
    teardownAudio();

    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;
    }

    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }

    chunksRef.current = [];
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setState('idle');
  }, [teardownAudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimerLoop();
      if (sourceNodeRef.current) sourceNodeRef.current.disconnect();
      if (analyserRef.current) analyserRef.current.disconnect();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current) void audioContextRef.current.close();
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, [stopTimerLoop]);

  return {
    state,
    audioBlob,
    audioUrl,
    duration,
    analyserNode,
    startRecording,
    stopRecording,
    resetRecording,
  };
}
