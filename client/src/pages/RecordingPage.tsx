import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/Button';
import { RecordButton } from '@/components/audio/RecordButton';
import { Timer } from '@/components/ui/Timer';

// ── Types ─────────────────────────────────────────────────────────────────────

type RecordingState = 'idle' | 'recording' | 'preview';

const MAX_SECONDS = 15;

// ── Waveform placeholders ─────────────────────────────────────────────────────

/** Live waveform: animated pulsing bars */
const LiveWaveform = () => (
  <div
    className="w-full h-20 flex items-center justify-center gap-1"
    aria-label="Live waveform"
    role="img"
  >
    {Array.from({ length: 24 }).map((_, i) => (
      <div
        key={i}
        className="w-1.5 rounded-full bg-primary"
        style={{
          height: `${Math.max(8, Math.random() * 64)}px`,
          animationDelay: `${i * 60}ms`,
          animation: 'waveBar 0.5s ease-in-out infinite alternate',
        }}
      />
    ))}
    <style>{`
      @keyframes waveBar {
        from { transform: scaleY(0.3); opacity: 0.5; }
        to   { transform: scaleY(1);   opacity: 1;   }
      }
    `}</style>
  </div>
);

/** Static preview waveform: fixed random heights */
const PREVIEW_HEIGHTS = [
  14, 28, 44, 52, 60, 48, 36, 56, 64, 40, 32, 52, 44, 28, 20, 36, 48, 56, 40, 28, 36, 20, 14, 8,
];

const PreviewWaveform = () => (
  <div
    className="w-full h-20 flex items-center justify-center gap-1"
    aria-label="Recorded waveform preview"
    role="img"
  >
    {PREVIEW_HEIGHTS.map((h, i) => (
      <div
        key={i}
        className="w-1.5 rounded-full bg-primary/60"
        style={{ height: `${h}px` }}
      />
    ))}
  </div>
);

// ── Play icon ─────────────────────────────────────────────────────────────────

const PlayIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 3L19 12L5 21V3Z" fill="currentColor" />
  </svg>
);

const RetryIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M1 4V10H7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3.51 15a9 9 0 102.13-9.36L1 10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M5 12H19M19 12L12 5M19 12L12 19"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ── Main page ─────────────────────────────────────────────────────────────────

const RecordingPage = () => {
  const navigate = useNavigate();
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start timer when recording begins
  useEffect(() => {
    if (recordingState === 'recording') {
      setElapsed(0);
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => {
          if (prev >= MAX_SECONDS) {
            handleStop();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordingState]);

  const handleStart = () => setRecordingState('recording');

  const handleStop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRecordingState('preview');
  };

  const handleReRecord = () => {
    setElapsed(0);
    setRecordingState('idle');
  };

  const handleContinue = () => navigate('/');

  // ── Idle state ──────────────────────────────────────────────────────────────
  const idleContent = (
    <div className="flex flex-col items-center gap-6 pt-8">
      <div className="flex flex-col items-center gap-2">
        <p className="font-headline text-2xl font-bold text-white text-center">
          Ready to hum?
        </p>
        <p className="text-on-surface-muted text-base text-center leading-snug max-w-xs">
          Tap the button below and hum your melody clearly for 5–15 seconds.
        </p>
      </div>

      {/* Decorative ring behind button */}
      <div className="relative flex items-center justify-center">
        <div className="absolute w-32 h-32 rounded-full border border-primary/20" />
        <div className="absolute w-44 h-44 rounded-full border border-primary/10" />
        <RecordButton state="idle" onStart={handleStart} onStop={handleStop} />
      </div>

      <p className="text-on-surface-muted text-sm font-label">
        Tap to start humming
      </p>
    </div>
  );

  // ── Recording state ─────────────────────────────────────────────────────────
  const recordingContent = (
    <div className="flex flex-col items-center gap-6 pt-8">
      <div className="flex flex-col items-center gap-1">
        <p className="font-headline text-2xl font-bold text-white text-center">
          Humming...
        </p>
        <p className="text-on-surface-muted text-sm text-center">
          Hum clearly for 5–15s
        </p>
      </div>

      {/* Waveform area */}
      <div className="w-full bg-surface-elevated rounded-xl px-4 py-3 border border-surface-hover">
        <LiveWaveform />
      </div>

      {/* Timer */}
      <Timer seconds={elapsed} maxSeconds={MAX_SECONDS} isActive={true} />

      {/* Stop button */}
      <RecordButton state="recording" onStart={handleStart} onStop={handleStop} />

      <p className="text-on-surface-muted text-sm font-label">
        Tap to stop
      </p>
    </div>
  );

  // ── Preview state ───────────────────────────────────────────────────────────
  const previewContent = (
    <div className="flex flex-col items-center gap-6 pt-8">
      <div className="flex flex-col items-center gap-1">
        <p className="font-headline text-2xl font-bold text-white text-center">
          Preview
        </p>
        <p className="text-on-surface-muted text-sm text-center">
          Sounds good? Continue to create your challenge.
        </p>
      </div>

      {/* Waveform preview */}
      <div className="w-full bg-surface-elevated rounded-xl px-4 py-3 border border-surface-hover">
        <PreviewWaveform />
        <div className="flex items-center justify-between mt-2">
          <Timer seconds={elapsed} maxSeconds={MAX_SECONDS} isActive={false} />
          <button
            type="button"
            aria-label="Play preview"
            className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary hover:bg-primary/30 transition-colors duration-150"
          >
            <PlayIcon />
          </button>
        </div>
      </div>

      {/* Action row */}
      <div className="w-full flex gap-3">
        <Button
          variant="secondary"
          size="md"
          onClick={handleReRecord}
          className="flex-1 gap-2"
        >
          <RetryIcon />
          Re-record
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={handleContinue}
          className="flex-1 gap-2"
        >
          Continue
          <ArrowRightIcon />
        </Button>
      </div>

      <p className="text-on-surface-muted text-xs font-label text-center max-w-xs">
        Your hum will be shared with your friends as the challenge audio.
      </p>
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <Header
        title="New Challenge"
        showBack
        onBack={() => navigate('/')}
      />
      <PageContainer>
        {recordingState === 'idle' && idleContent}
        {recordingState === 'recording' && recordingContent}
        {recordingState === 'preview' && previewContent}
      </PageContainer>
    </>
  );
};

export default RecordingPage;
