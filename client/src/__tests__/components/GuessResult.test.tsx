import { vi, describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GuessResult } from '@/components/challenge/GuessResult';
import type { ChallengeResultResponse } from '@/types';

// ---------------------------------------------------------------------------
// Mock WaveformCanvas — it relies on canvas APIs unavailable in jsdom
// ---------------------------------------------------------------------------

vi.mock('@/components/audio/WaveformCanvas', () => ({
  WaveformCanvas: () => <div data-testid="waveform-canvas" />,
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const correctResult: ChallengeResultResponse = {
  challengeId: 'challenge-1',
  completed: true,
  correct: true,
  attemptsUsed: 3,
  maxAttempts: 6,
  timeTakenSeconds: 45,
  song: {
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    spotifyId: null,
    albumArt: null,
    previewUrl: null,
  },
  shareText: '🎵 HumDuel\n\nI guessed it in 3/6 attempts!\n🟥🟥🟩\n\nhumduel.io/challenge/challenge-1',
  waveformData: [0.1, 0.5, 0.8],
  creatorAlias: 'SomeCreator',
  completionCount: 10,
  guessCount: 20,
};

const incorrectResult: ChallengeResultResponse = {
  challengeId: 'challenge-2',
  completed: true,
  correct: false,
  attemptsUsed: 6,
  maxAttempts: 6,
  timeTakenSeconds: null,
  song: {
    title: 'Hotel California',
    artist: 'Eagles',
    spotifyId: null,
    albumArt: null,
    previewUrl: null,
  },
  shareText: null,
  waveformData: [],
  creatorAlias: null,
  completionCount: 5,
  guessCount: 50,
};

const nullSongResult: ChallengeResultResponse = {
  challengeId: 'challenge-3',
  completed: false,
  correct: null,
  attemptsUsed: null,
  maxAttempts: 6,
  timeTakenSeconds: null,
  song: null,
  shareText: null,
  waveformData: [],
  creatorAlias: null,
  completionCount: 0,
  guessCount: 0,
};

// ---------------------------------------------------------------------------
// Correct guess rendering
// ---------------------------------------------------------------------------

describe('GuessResult — correct guess', () => {
  it('shows "Correct!" heading for a correct guess', () => {
    render(<GuessResult result={correctResult} onShare={vi.fn()} onCreateChallenge={vi.fn()} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Correct!');
  });

  it('shows the celebration emoji for a correct guess', () => {
    render(<GuessResult result={correctResult} onShare={vi.fn()} onCreateChallenge={vi.fn()} />);
    expect(screen.getByText('🎉')).toBeInTheDocument();
  });

  it('shows "Create Your Own" button text for a correct guess', () => {
    render(<GuessResult result={correctResult} onShare={vi.fn()} onCreateChallenge={vi.fn()} />);
    expect(screen.getByRole('button', { name: /create your own/i })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Incorrect guess rendering
// ---------------------------------------------------------------------------

describe('GuessResult — incorrect guess', () => {
  it('shows "Not this time" heading for an incorrect guess', () => {
    render(<GuessResult result={incorrectResult} onShare={vi.fn()} onCreateChallenge={vi.fn()} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Not this time');
  });

  it('shows the sad emoji for an incorrect guess', () => {
    render(<GuessResult result={incorrectResult} onShare={vi.fn()} onCreateChallenge={vi.fn()} />);
    expect(screen.getByText('😔')).toBeInTheDocument();
  });

  it('shows "The answer was:" hint for incorrect guess when song is present', () => {
    render(<GuessResult result={incorrectResult} onShare={vi.fn()} onCreateChallenge={vi.fn()} />);
    expect(screen.getByText(/the answer was/i)).toBeInTheDocument();
  });

  it('shows "Try Creating One" button text for an incorrect guess', () => {
    render(<GuessResult result={incorrectResult} onShare={vi.fn()} onCreateChallenge={vi.fn()} />);
    // The button carries aria-label="Create your own humming challenge" always;
    // verify the visible inner text matches the incorrect-guess variant.
    expect(screen.getByText('Try Creating One')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Song info card
// ---------------------------------------------------------------------------

describe('GuessResult — song info display', () => {
  it('displays the song title when song is present', () => {
    render(<GuessResult result={correctResult} onShare={vi.fn()} onCreateChallenge={vi.fn()} />);
    expect(screen.getByText('Bohemian Rhapsody')).toBeInTheDocument();
  });

  it('displays the artist name when song is present', () => {
    render(<GuessResult result={correctResult} onShare={vi.fn()} onCreateChallenge={vi.fn()} />);
    expect(screen.getByText('Queen')).toBeInTheDocument();
  });

  it('displays the song title for incorrect result', () => {
    render(<GuessResult result={incorrectResult} onShare={vi.fn()} onCreateChallenge={vi.fn()} />);
    expect(screen.getByText('Hotel California')).toBeInTheDocument();
  });

  it('displays the artist name for incorrect result', () => {
    render(<GuessResult result={incorrectResult} onShare={vi.fn()} onCreateChallenge={vi.fn()} />);
    expect(screen.getByText('Eagles')).toBeInTheDocument();
  });

  it('does not render song title when song is null', () => {
    render(<GuessResult result={nullSongResult} onShare={vi.fn()} onCreateChallenge={vi.fn()} />);
    expect(screen.queryByText('Bohemian Rhapsody')).not.toBeInTheDocument();
    expect(screen.queryByText('Hotel California')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Wordle-style emoji squares
// ---------------------------------------------------------------------------

describe('GuessResult — Wordle-style emoji squares', () => {
  it('renders green square (🟩) for the correct attempt', () => {
    // correctResult: 3 attempts used, correct → 🟥🟥🟩
    render(<GuessResult result={correctResult} onShare={vi.fn()} onCreateChallenge={vi.fn()} />);
    const greenSquares = screen.getAllByRole('img', { name: /correct guess/i });
    expect(greenSquares.length).toBe(1);
  });

  it('renders red squares (🟥) for wrong attempts', () => {
    render(<GuessResult result={correctResult} onShare={vi.fn()} onCreateChallenge={vi.fn()} />);
    const redSquares = screen.getAllByRole('img', { name: /wrong guess/i });
    expect(redSquares.length).toBe(2);
  });

  it('renders only red squares for a failed attempt (6/6 wrong)', () => {
    render(<GuessResult result={incorrectResult} onShare={vi.fn()} onCreateChallenge={vi.fn()} />);
    const redSquares = screen.getAllByRole('img', { name: /wrong guess/i });
    expect(redSquares.length).toBe(6);
    expect(screen.queryByRole('img', { name: /correct guess/i })).not.toBeInTheDocument();
  });

  it('renders no squares when attemptsUsed is null', () => {
    render(<GuessResult result={nullSongResult} onShare={vi.fn()} onCreateChallenge={vi.fn()} />);
    expect(screen.queryByRole('img', { name: /correct guess/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /wrong guess/i })).not.toBeInTheDocument();
  });

  it('squares container has accessible label for correct result', () => {
    render(<GuessResult result={correctResult} onShare={vi.fn()} onCreateChallenge={vi.fn()} />);
    expect(screen.getByLabelText(/guessed correctly in 3 attempts/i)).toBeInTheDocument();
  });

  it('squares container has accessible label for incorrect result', () => {
    render(<GuessResult result={incorrectResult} onShare={vi.fn()} onCreateChallenge={vi.fn()} />);
    expect(screen.getByLabelText(/did not guess correctly after 6 attempts/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Statistics
// ---------------------------------------------------------------------------

describe('GuessResult — statistics display', () => {
  it('shows time taken for a correct guess', () => {
    render(<GuessResult result={correctResult} onShare={vi.fn()} onCreateChallenge={vi.fn()} />);
    expect(screen.getByText('Time taken')).toBeInTheDocument();
    expect(screen.getByText('45s')).toBeInTheDocument();
  });

  it('does not show time taken for an incorrect guess', () => {
    render(<GuessResult result={incorrectResult} onShare={vi.fn()} onCreateChallenge={vi.fn()} />);
    expect(screen.queryByText('Time taken')).not.toBeInTheDocument();
  });

  it('shows attempt count for correct result', () => {
    render(<GuessResult result={correctResult} onShare={vi.fn()} onCreateChallenge={vi.fn()} />);
    expect(screen.getByText('Attempts')).toBeInTheDocument();
    expect(screen.getByText('3/6')).toBeInTheDocument();
  });

  it('shows attempt count for incorrect result', () => {
    render(<GuessResult result={incorrectResult} onShare={vi.fn()} onCreateChallenge={vi.fn()} />);
    expect(screen.getByText('Attempts')).toBeInTheDocument();
    expect(screen.getByText('6/6')).toBeInTheDocument();
  });

  it('shows total guesses (community stats)', () => {
    render(<GuessResult result={correctResult} onShare={vi.fn()} onCreateChallenge={vi.fn()} />);
    expect(screen.getByText('Total guesses')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  it('shows players who got it right (community stats)', () => {
    render(<GuessResult result={correctResult} onShare={vi.fn()} onCreateChallenge={vi.fn()} />);
    expect(screen.getByText(/players who got it right/i)).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Action buttons
// ---------------------------------------------------------------------------

describe('GuessResult — action buttons', () => {
  it('renders "Share Result" button', () => {
    render(<GuessResult result={correctResult} onShare={vi.fn()} onCreateChallenge={vi.fn()} />);
    expect(screen.getByRole('button', { name: /share your result/i })).toBeInTheDocument();
  });

  it('renders the create challenge CTA button', () => {
    render(<GuessResult result={correctResult} onShare={vi.fn()} onCreateChallenge={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: /create your own humming challenge/i }),
    ).toBeInTheDocument();
  });

  it('calls onShare when "Share Result" button is clicked', async () => {
    const onShare = vi.fn().mockResolvedValue(undefined);
    render(<GuessResult result={correctResult} onShare={onShare} onCreateChallenge={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /share your result/i }));

    await waitFor(() => {
      expect(onShare).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onCreateChallenge when CTA button is clicked', () => {
    const onCreateChallenge = vi.fn();
    render(
      <GuessResult
        result={correctResult}
        onShare={vi.fn()}
        onCreateChallenge={onCreateChallenge}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', { name: /create your own humming challenge/i }),
    );

    expect(onCreateChallenge).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Toast notification
// ---------------------------------------------------------------------------

describe('GuessResult — toast notification', () => {
  it('shows "Copied to clipboard!" toast after sharing', async () => {
    const onShare = vi.fn().mockResolvedValue(undefined);
    render(<GuessResult result={correctResult} onShare={onShare} onCreateChallenge={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /share your result/i }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Copied to clipboard!');
    });
  });

  it('shows an error toast when share fails', async () => {
    const onShare = vi.fn().mockRejectedValue(new Error('Share failed'));
    render(<GuessResult result={correctResult} onShare={onShare} onCreateChallenge={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /share your result/i }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/could not share/i);
    });
  });
});

// ---------------------------------------------------------------------------
// Waveform canvas
// ---------------------------------------------------------------------------

describe('GuessResult — waveform canvas', () => {
  it('shows waveform canvas for a correct result with waveform data', () => {
    render(<GuessResult result={correctResult} onShare={vi.fn()} onCreateChallenge={vi.fn()} />);
    expect(screen.getByTestId('waveform-canvas')).toBeInTheDocument();
  });

  it('does not show waveform canvas for an incorrect result', () => {
    // incorrectResult has correct: false, so waveform should not be shown
    render(<GuessResult result={incorrectResult} onShare={vi.fn()} onCreateChallenge={vi.fn()} />);
    expect(screen.queryByTestId('waveform-canvas')).not.toBeInTheDocument();
  });
});
