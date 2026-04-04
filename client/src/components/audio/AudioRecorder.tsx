import { useEffect, useRef, useState } from 'react';
import { useAudioRecorder, MIN_DURATION, MAX_DURATION } from '@/hooks/useAudioRecorder';
import { useAudioStore } from '@/stores/audioStore';
import { RecordButton } from '@/components/audio/RecordButton';
import { Button } from '@/components/ui/Button';
import { Timer } from '@/components/ui/Timer';

export interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob, waveformData: number[]) => void;
  maxDuration?: number;
}

// Placeholder for WaveformCanvas — will be replaced when the component is built
interface WaveformCanvasPlaceholderProps {
  analyserNode: AnalyserNode | null;
  isActive: boolean;
}

function WaveformCanvas({ analyserNode, isActive }: WaveformCanvasPlaceholderProps) {
  // Placeholder renders a static bar row until the real WaveformCanvas is built
  return (
    <div
      className="flex items-end justify-center gap-0.5 w-full h-16"
      aria-hidden="true"
      data-analyser={analyserNode ? 'connected' : 'disconnected'}
      data-active={isActive}
    >
      {Array.from({ length: 40 }, (_, i) => (
        <div
          key={i}
          className={`w-1 rounded-sm transition-all duration-100 ${
            isActive ? 'bg-primary/80' : 'bg-on-surface-muted/30'
          }`}
          style={{ height: `${isActive ? 20 + Math.sin(i * 0.6) * 16 : 4}px` }}
        />
      ))}
    </div>
  );
}

// Extract a waveform snapshot array (256 values normalised 0–1) from an AnalyserNode
function captureWaveformSnapshot(analyser: AnalyserNode): number[] {
  const bufferLength = analyser.frequencyBinCount; // fftSize / 2 = 1024
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteTimeDomainData(dataArray);

  // Downsample to 256 bars for storage
  const targetLength = 256;
  const step = Math.floor(bufferLength / targetLength);
  const waveform: number[] = [];

  for (let i = 0; i < targetLength; i++) {
    const sample = dataArray[i * step] ?? 128;
    // Normalise from [0, 255] centred at 128 to [0, 1]
    waveform.push(Math.abs((sample - 128) / 128));
  }

  return waveform;
}

type ToastMessage = { text: string; id: number };

export function AudioRecorder({ onRecordingComplete, maxDuration = MAX_DURATION }: AudioRecorderProps) {
  const {
    state,
    audioBlob,
    audioUrl,
    duration,
    analyserNode,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder();

  const store = useAudioStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep a ref to the analyser so we can snapshot on stop even after state updates
  const analyserSnapshotRef = useRef<AnalyserNode | null>(null);

  // Keep snapshot ref fresh whenever analyserNode changes
  useEffect(() => {
    if (analyserNode) {
      analyserSnapshotRef.current = analyserNode;
    }
  }, [analyserNode]);

  // Sync recording state into the store
  useEffect(() => {
    store.setRecordingState(state === 'recording');
    store.setDuration(duration);
  }, [state, duration]); // eslint-disable-line react-hooks/exhaustive-deps

  // When the hook delivers a finished blob, sync it to the store
  useEffect(() => {
    if (audioBlob && audioUrl) {
      store.setAudioBlob(audioBlob, audioUrl);
    }
  }, [audioBlob, audioUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const showToast = (text: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ text, id: Date.now() });
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  };

  // Clean up toast timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const handleStop = () => {
    if (duration < MIN_DURATION) {
      showToast(`Hum for at least ${MIN_DURATION} seconds to submit.`);
      // Still stop the recording so the user sees the short clip and can re-record
    }
    stopRecording();
  };

  const handleContinue = () => {
    if (!audioBlob) return;

    if (duration < MIN_DURATION) {
      showToast(`Recording too short — please hum for at least ${MIN_DURATION} seconds.`);
      return;
    }

    // Extract waveform from analyser snapshot; fall back to empty if unavailable
    const waveformData = analyserSnapshotRef.current
      ? captureWaveformSnapshot(analyserSnapshotRef.current)
      : store.waveformData.length > 0
      ? store.waveformData
      : new Array(256).fill(0);

    store.setWaveformData(waveformData);
    onRecordingComplete(audioBlob, waveformData);
  };

  const handleReRecord = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    analyserSnapshotRef.current = null;
    resetRecording();
    store.reset();
  };

  const togglePlayback = () => {
    const el = audioRef.current;
    if (!el) return;

    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      void el.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto">

      {/* Toast notification */}
      {toast && (
        <div
          key={toast.id}
          role="alert"
          className="w-full bg-surface-elevated border border-warning/40 text-warning text-sm font-label px-4 py-3 rounded-xl text-center animate-fade-in"
        >
          {toast.text}
        </div>
      )}

      {/* Waveform visualisation area */}
      <div className="w-full bg-surface-elevated rounded-xl px-4 py-3">
        <WaveformCanvas
          analyserNode={analyserNode}
          isActive={state === 'recording'}
        />
      </div>

      {/* Timer — shown while recording or in preview */}
      {(state === 'recording' || state === 'preview') && (
        <Timer
          seconds={state === 'recording' ? duration : store.duration}
          maxSeconds={maxDuration}
          isActive={state === 'recording'}
        />
      )}

      {/* Core record / preview controls */}
      {state === 'idle' || state === 'requesting' ? (
        <div className="flex flex-col items-center gap-3">
          <RecordButton
            state="idle"
            onStart={() => void startRecording()}
            onStop={handleStop}
            disabled={state === 'requesting'}
          />
          <p className="text-on-surface-muted text-sm text-center">
            Tap to start recording
          </p>
        </div>
      ) : state === 'recording' ? (
        <div className="flex flex-col items-center gap-3">
          <RecordButton
            state="recording"
            onStart={() => void startRecording()}
            onStop={handleStop}
          />
          <p className="text-on-surface-muted text-sm text-center">
            Hum clearly for 5–15s
          </p>
        </div>
      ) : state === 'preview' ? (
        <div className="flex flex-col items-center gap-4 w-full">
          {/* Hidden audio element for playback */}
          {audioUrl && (
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          )}

          {/* Playback row */}
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={togglePlayback}
              aria-label={isPlaying ? 'Pause playback' : 'Play recording'}
            >
              {isPlaying ? (
                <>
                  <PauseIcon />
                  Pause
                </>
              ) : (
                <>
                  <PlayIcon />
                  Play
                </>
              )}
            </Button>
          </div>

          {/* Re-record / Continue row */}
          <div className="flex items-center gap-3 w-full">
            <Button
              variant="ghost"
              size="md"
              onClick={handleReRecord}
              className="flex-1"
            >
              Re-record
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleContinue}
              className="flex-1"
            >
              Continue
            </Button>
          </div>

          {duration < MIN_DURATION && (
            <p className="text-error text-xs text-center">
              Recording too short — hum for at least {MIN_DURATION} seconds.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

// Inline SVG icons for playback controls
function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}
