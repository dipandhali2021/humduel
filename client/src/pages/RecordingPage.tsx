import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import PageContainer from '@/components/layout/PageContainer';
import { AudioRecorder } from '@/components/audio/AudioRecorder';
import { ChallengeCreationForm } from '@/components/challenge/ChallengeCreationForm';
import { ShareButton } from '@/components/challenge/ShareButton';
import { Button } from '@/components/ui/Button';
import { useAudioStore } from '@/stores/audioStore';
import { createChallenge, ApiError } from '@/lib/api';
import type { CreateChallengeResponse } from '@/types';
import type { ChallengeCreationFormData } from '@/components/challenge/ChallengeCreationForm';

// ─── Page state machine ───────────────────────────────────────────────────────

type PagePhase = 'recording' | 'creating' | 'created';

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Inline success icon shown on the "created" screen. */
function SuccessIcon() {
  return (
    <div
      className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mx-auto"
      aria-hidden="true"
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5 13l4 4L19 7"
          stroke="#22C55E"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/** Inline external-link icon used next to the challenge URL. */
function ExternalLinkIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="flex-shrink-0 text-on-surface-muted"
    >
      <path
        d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Main page component ──────────────────────────────────────────────────────

const RecordingPage = () => {
  const navigate = useNavigate();
  const audioStore = useAudioStore();

  const [phase, setPhase] = useState<PagePhase>('recording');
  const [capturedWaveform, setCapturedWaveform] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<CreateChallengeResponse | null>(null);

  // ── Phase: recording ────────────────────────────────────────────────────────

  const handleRecordingComplete = useCallback(
    (_blob: Blob, waveformData: number[]) => {
      setCapturedWaveform(waveformData);
      setPhase('creating');
    },
    [],
  );

  // ── Phase: creating ─────────────────────────────────────────────────────────

  const handleFormSubmit = useCallback(
    async (data: ChallengeCreationFormData) => {
      const blob = audioStore.audioBlob;
      if (!blob) {
        setSubmitError('Recording not found. Please record again.');
        return;
      }

      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const response = await createChallenge({
          audio: blob,
          waveformData: audioStore.waveformData,
          songTitle: data.songTitle,
          songArtist: data.songArtist,
          durationSeconds: audioStore.duration,
          creatorAlias: data.creatorAlias,
        });
        setChallenge(response);
        setPhase('created');
      } catch (err) {
        if (err instanceof ApiError) {
          setSubmitError(`Failed to create challenge: ${err.message}`);
        } else {
          setSubmitError('Something went wrong. Please try again.');
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [audioStore.audioBlob, audioStore.waveformData, audioStore.duration],
  );

  // ── Phase: created — reset and start over ───────────────────────────────────

  const handleCreateAnother = useCallback(() => {
    audioStore.reset();
    setCapturedWaveform([]);
    setChallenge(null);
    setSubmitError(null);
    setPhase('recording');
  }, [audioStore]);

  // ── Header back behaviour changes per phase ─────────────────────────────────

  const handleBack = useCallback(() => {
    if (phase === 'creating') {
      // Go back to re-record without losing the blob
      setPhase('recording');
      return;
    }
    // For 'recording' and 'created' phases go home
    navigate('/');
  }, [phase, navigate]);

  const headerTitle =
    phase === 'recording'
      ? 'New Challenge'
      : phase === 'creating'
      ? 'Set the Answer'
      : 'Challenge Created';

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <Header title={headerTitle} showBack onBack={handleBack} />
      <PageContainer>
        {phase === 'recording' && (
          <div className="pt-8">
            <AudioRecorder onRecordingComplete={handleRecordingComplete} />
          </div>
        )}

        {phase === 'creating' && (
          <div className="pt-6 flex flex-col gap-4">
            <ChallengeCreationForm
              waveformData={capturedWaveform}
              onSubmit={(data) => void handleFormSubmit(data)}
              isSubmitting={isSubmitting}
            />

            {submitError && (
              <div
                role="alert"
                className="w-full bg-surface-elevated border border-error/40 text-error text-sm font-label px-4 py-3 rounded-xl text-center"
              >
                {submitError}
              </div>
            )}
          </div>
        )}

        {phase === 'created' && challenge !== null && (
          <CreatedScreen
            challenge={challenge}
            onCreateAnother={handleCreateAnother}
          />
        )}
      </PageContainer>
    </>
  );
};

// ─── Created screen ───────────────────────────────────────────────────────────

interface CreatedScreenProps {
  challenge: CreateChallengeResponse;
  onCreateAnother: () => void;
}

function CreatedScreen({ challenge, onCreateAnother }: CreatedScreenProps) {
  return (
    <div className="pt-8 flex flex-col gap-6 items-center text-center w-full">
      {/* Success icon */}
      <SuccessIcon />

      {/* Heading */}
      <div className="space-y-1">
        <h2 className="font-headline text-2xl font-bold text-white">
          Challenge Created!
        </h2>
        <p className="font-body text-sm text-on-surface-muted">
          Share the link below so friends can guess your hum.
        </p>
      </div>

      {/* Copyable challenge URL */}
      <ChallengeUrlBlock challengeUrl={challenge.challengeUrl} />

      {/* Share button */}
      <ShareButton
        challengeUrl={challenge.challengeUrl}
        challengeId={challenge.id}
        className="w-full"
      />

      {/* Secondary actions */}
      <div className="flex flex-col gap-3 w-full">
        {/* Deep link to the guessing page */}
        <Link
          to={`/c/${challenge.id}`}
          className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl font-label font-medium text-base border border-primary text-primary hover:bg-primary/10 transition-colors duration-150"
        >
          Try Guessing
        </Link>

        {/* Reset and record again */}
        <Button
          variant="ghost"
          size="md"
          onClick={onCreateAnother}
          className="w-full"
        >
          Create Another
        </Button>
      </div>

      {/* Expiry note */}
      <ExpiryNote expiresAt={challenge.expiresAt} />
    </div>
  );
}

// ─── Challenge URL block ──────────────────────────────────────────────────────

interface ChallengeUrlBlockProps {
  challengeUrl: string;
}

function ChallengeUrlBlock({ challengeUrl }: ChallengeUrlBlockProps) {
  return (
    <div
      className="w-full bg-surface-elevated rounded-xl px-4 py-3 flex items-center gap-2 min-w-0"
      title={challengeUrl}
    >
      <ExternalLinkIcon />
      <span className="font-body text-sm text-on-surface-muted truncate flex-1 text-left">
        {challengeUrl}
      </span>
    </div>
  );
}

// ─── Expiry note ──────────────────────────────────────────────────────────────

interface ExpiryNoteProps {
  expiresAt: string;
}

function ExpiryNote({ expiresAt }: ExpiryNoteProps) {
  const formatted = formatExpiry(expiresAt);
  if (!formatted) return null;

  return (
    <p className="font-label text-xs text-on-surface-muted">
      Expires {formatted}
    </p>
  );
}

/**
 * Format the ISO expiry timestamp into a friendly relative string.
 * Returns null if the date is unparseable.
 */
function formatExpiry(iso: string): string | null {
  try {
    const date = new Date(iso);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return null;
  }
}

export default RecordingPage;
