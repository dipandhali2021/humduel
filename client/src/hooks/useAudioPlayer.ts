import { useState, useEffect, useRef, useCallback } from 'react';
import { createAudioContext } from '@/lib/audio';

export interface UseAudioPlayerOptions {
  /** Initial audio source URL (blob: or https:). */
  url?: string;
  /** If true, begin playback as soon as the source is ready. */
  autoPlay?: boolean;
  /** Callback fired when the audio reaches its natural end. */
  onEnd?: () => void;
}

export interface UseAudioPlayerReturn {
  /** Whether the audio element is currently playing. */
  isPlaying: boolean;
  /** Playback position in seconds. */
  currentTime: number;
  /** Total duration in seconds (0 before metadata loads). */
  duration: number;
  /** Playback progress in [0, 1]. Returns 0 when duration is 0. */
  progress: number;
  /**
   * Live AnalyserNode connected to the audio element during playback.
   * Null before the first play() call. Pass to WaveformCanvas for live visuals.
   */
  analyserNode: AnalyserNode | null;
  /** Non-null when audio failed to load or play. */
  error: string | null;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  /** Jump to the given time (seconds). Clamps to [0, duration]. */
  seek: (time: number) => void;
}

export function useAudioPlayer(options: UseAudioPlayerOptions = {}): UseAudioPlayerReturn {
  const { url, autoPlay = false, onEnd } = options;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs so callbacks remain stable and always see current values
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const onEndRef = useRef(onEnd);

  // Keep onEnd ref in sync without recreating effects
  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  // ---------------------------------------------------------------------------
  // Lazily create AudioContext + AnalyserNode and wire the HTMLAudioElement as
  // a MediaElementSourceNode. The spec only allows one source node per element,
  // so we do this once and reuse across play/pause cycles.
  // ---------------------------------------------------------------------------
  const ensureAudioGraph = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || sourceNodeRef.current) return; // Already wired

    try {
      const ctx = createAudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;

      const source = ctx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      audioCtxRef.current = ctx;
      sourceNodeRef.current = source;
      analyserRef.current = analyser;
      setAnalyserNode(analyser);
    } catch (e) {
      // Graceful degradation if Web Audio is unavailable (e.g. JSDOM in tests)
      console.warn('[useAudioPlayer] Could not create audio graph:', e);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Create the HTMLAudioElement once and attach stable event listeners.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onEndRef.current?.();
    };
    const handleError = () => {
      const err = audio.error;
      setError(
        err ? `Audio error ${err.code}: ${err.message}` : 'Unknown audio error',
      );
      setIsPlaying(false);
    };
    const handleCanPlay = () => setError(null);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, []); // Run once — element lives for the lifetime of the hook

  // ---------------------------------------------------------------------------
  // React to URL prop changes: update src and optionally auto-play.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.paused) {
      audio.pause();
      setIsPlaying(false);
    }

    setCurrentTime(0);
    setDuration(0);
    setError(null);

    if (url) {
      audio.src = url;
      audio.load();

      if (autoPlay) {
        audio
          .play()
          .then(() => {
            ensureAudioGraph();
            if (audioCtxRef.current?.state === 'suspended') {
              void audioCtxRef.current.resume();
            }
            setIsPlaying(true);
          })
          .catch((e: Error) => {
            setError(`Playback failed: ${e.message}`);
          });
      }
    } else {
      audio.src = '';
    }
  // ensureAudioGraph is stable; autoPlay and url are the real deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, autoPlay]);

  // ---------------------------------------------------------------------------
  // Full teardown on unmount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.src = '';
      }

      if (sourceNodeRef.current) {
        try { sourceNodeRef.current.disconnect(); } catch { /* ignore */ }
        sourceNodeRef.current = null;
      }
      if (analyserRef.current) {
        try { analyserRef.current.disconnect(); } catch { /* ignore */ }
        analyserRef.current = null;
      }
      if (audioCtxRef.current) {
        void audioCtxRef.current.close();
        audioCtxRef.current = null;
      }

      setAnalyserNode(null);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Public controls
  // ---------------------------------------------------------------------------
  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio?.src) return;

    ensureAudioGraph();

    if (audioCtxRef.current?.state === 'suspended') {
      void audioCtxRef.current.resume();
    }

    audio.play().then(() => {
      setIsPlaying(true);
      setError(null);
    }).catch((e: Error) => {
      setError(`Playback failed: ${e.message}`);
    });
  }, [ensureAudioGraph]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) pause(); else play();
  }, [isPlaying, play, pause]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const clamped = Math.max(0, Math.min(time, audio.duration || 0));
    audio.currentTime = clamped;
    setCurrentTime(clamped);
  }, []);

  const progress = duration > 0 ? currentTime / duration : 0;

  return {
    isPlaying,
    currentTime,
    duration,
    progress,
    analyserNode,
    error,
    play,
    pause,
    toggle,
    seek,
  };
}
