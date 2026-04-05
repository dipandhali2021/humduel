import { useState } from 'react';
import { WaveformCanvas } from '@/components/audio/WaveformCanvas';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export interface ChallengeCreationFormData {
  songTitle: string;
  songArtist: string;
  creatorAlias?: string;
}

export interface ChallengeCreationFormProps {
  waveformData: number[];
  onSubmit: (data: ChallengeCreationFormData) => void;
  isSubmitting: boolean;
}

/**
 * ChallengeCreationForm
 *
 * Shown after the user finishes recording their hum. Collects the song title,
 * artist, and an optional creator alias so guessers can be scored against the
 * correct answer.
 *
 * - Song title and artist are required.
 * - Creator alias is optional; defaults to "Anonymous" as placeholder text.
 * - Displays a static waveform preview of the recording.
 * - Submit button is disabled while fields are empty or a submission is in
 *   progress.
 */
export function ChallengeCreationForm({
  waveformData,
  onSubmit,
  isSubmitting,
}: ChallengeCreationFormProps) {
  const [songTitle, setSongTitle] = useState('');
  const [songArtist, setSongArtist] = useState('');
  const [creatorAlias, setCreatorAlias] = useState('');
  const [titleError, setTitleError] = useState('');
  const [artistError, setArtistError] = useState('');

  const canSubmit =
    songTitle.trim().length > 0 &&
    songArtist.trim().length > 0 &&
    !isSubmitting;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    let valid = true;

    if (!songTitle.trim()) {
      setTitleError('Song title is required.');
      valid = false;
    } else {
      setTitleError('');
    }

    if (!songArtist.trim()) {
      setArtistError('Artist name is required.');
      valid = false;
    } else {
      setArtistError('');
    }

    if (!valid) return;

    onSubmit({
      songTitle: songTitle.trim(),
      songArtist: songArtist.trim(),
      creatorAlias: creatorAlias.trim() || undefined,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-5 w-full"
      aria-label="Challenge creation form"
    >
      {/* Heading */}
      <div className="text-center">
        <h2 className="font-headline text-2xl font-bold text-white">
          What song did you hum?
        </h2>
        <p className="font-body text-sm text-on-surface-muted mt-1">
          Provide the answer so others can be scored.
        </p>
      </div>

      {/* Waveform preview */}
      <div className="w-full bg-surface-elevated rounded-xl px-4 py-3">
        <WaveformCanvas
          mode="static"
          waveformData={waveformData}
          height={80}
        />
      </div>

      {/* Song title */}
      <Input
        label="Song Title *"
        type="text"
        placeholder="Enter song title"
        value={songTitle}
        onChange={(e) => {
          setSongTitle(e.target.value);
          if (titleError) setTitleError('');
        }}
        error={titleError}
        autoComplete="off"
        autoCapitalize="words"
        spellCheck={false}
        disabled={isSubmitting}
        required
      />

      {/* Artist */}
      <Input
        label="Artist *"
        type="text"
        placeholder="Enter artist name"
        value={songArtist}
        onChange={(e) => {
          setSongArtist(e.target.value);
          if (artistError) setArtistError('');
        }}
        error={artistError}
        autoComplete="off"
        autoCapitalize="words"
        spellCheck={false}
        disabled={isSubmitting}
        required
      />

      {/* Creator alias */}
      <Input
        label="Your Name (optional)"
        type="text"
        placeholder="Anonymous"
        value={creatorAlias}
        onChange={(e) => setCreatorAlias(e.target.value)}
        autoComplete="nickname"
        autoCapitalize="words"
        disabled={isSubmitting}
      />

      {/* Submit */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isSubmitting}
        disabled={!canSubmit}
        className="w-full mt-1"
      >
        {isSubmitting ? 'Creating…' : 'Create Challenge'}
      </Button>
    </form>
  );
}

export default ChallengeCreationForm;
