export interface RecordButtonProps {
  state: 'idle' | 'recording';
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}

// Inline mic SVG — no external icon library dependency
const MicIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect x="9" y="2" width="6" height="11" rx="3" fill="white" />
    <path
      d="M5 10a7 7 0 0014 0"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line
      x1="12"
      y1="17"
      x2="12"
      y2="21"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line
      x1="9"
      y1="21"
      x2="15"
      y2="21"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

// Inline stop-square SVG
const StopIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect x="5" y="5" width="14" height="14" rx="2" fill="white" />
  </svg>
);

/*
  The button is 80 px in diameter but sits inside a 96 px touch target wrapper.
  The breathing glow and recording pulse are driven by Tailwind's built-in
  animate-pulse plus a custom keyframes definition injected via a <style> tag
  so we don't need to modify tailwind.config.ts.
*/
export function RecordButton({
  state,
  onStart,
  onStop,
  disabled = false,
}: RecordButtonProps) {
  const isRecording = state === 'recording';

  const handleClick = () => {
    if (disabled) return;
    if (isRecording) {
      onStop();
    } else {
      onStart();
    }
  };

  return (
    <>
      {/* Breathing glow keyframes injected once — minimal, no CSS module needed */}
      <style>{`
        @keyframes hum-breathe {
          0%, 100% { box-shadow: 0 0 20px 4px rgba(124, 58, 237, 0.45); }
          50%       { box-shadow: 0 0 40px 12px rgba(124, 58, 237, 0.75); }
        }
        @keyframes hum-record-glow {
          0%, 100% { box-shadow: 0 0 20px 4px rgba(239, 68, 68, 0.5); }
          50%       { box-shadow: 0 0 40px 14px rgba(239, 68, 68, 0.8); }
        }
        .hum-btn-idle     { animation: hum-breathe 2.4s ease-in-out infinite; }
        .hum-btn-recording { animation: hum-record-glow 1s ease-in-out infinite; }
      `}</style>

      {/* 96 px touch target wrapper */}
      <div className="flex items-center justify-center w-24 h-24">
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          className={[
            // Base shape — 80 px circle
            'w-20 h-20 rounded-full flex items-center justify-center',
            'transition-colors duration-200',
            'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            isRecording
              ? 'bg-error hum-btn-recording focus-visible:ring-error'
              : 'bg-primary hum-btn-idle focus-visible:ring-primary',
          ].join(' ')}
        >
          {isRecording ? <StopIcon /> : <MicIcon />}
        </button>
      </div>
    </>
  );
}
