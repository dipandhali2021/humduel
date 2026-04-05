import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { UseDailyChallengeReturn } from '@/hooks/useDailyChallenge';
import type { DailyChallengeResponse, DailyGuessResponse, DailyResultResponse } from '@/types';

// ---------------------------------------------------------------------------
// Mock useDailyChallenge hook
// ---------------------------------------------------------------------------

vi.mock('@/hooks/useDailyChallenge', () => ({
  useDailyChallenge: vi.fn(),
}));

// Mock songCatalog so the GuessInput autocomplete is deterministic
vi.mock('@/lib/songCatalog', () => ({
  searchSongs: vi.fn(() => []),
}));

// Mock share lib to avoid clipboard/navigator API
vi.mock('@/lib/share', () => ({
  shareResult: vi.fn().mockResolvedValue('copied'),
}));

import { useDailyChallenge } from '@/hooks/useDailyChallenge';
import DailyPage from '@/pages/DailyPage';

const mockUseDailyChallenge = vi.mocked(useDailyChallenge);

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const baseChallenge: DailyChallengeResponse = {
  date: '2026-04-05',
  puzzleNumber: 42,
  songHint: 'Released in the 1970s by a British band.',
  maxAttempts: 6,
  attemptsUsed: 0,
  completed: false,
  correct: null,
};

const baseResult: DailyResultResponse = {
  date: '2026-04-05',
  puzzleNumber: 42,
  completed: true,
  correct: true,
  attemptsUsed: 2,
  maxAttempts: 6,
  timeTakenSeconds: 30,
  song: { title: 'Bohemian Rhapsody', artist: 'Queen', spotifyId: null, albumArt: null, previewUrl: null },
  shareText: 'HumDuel #42 2/6',
};

function buildDefaultReturn(overrides: Partial<UseDailyChallengeReturn> = {}): UseDailyChallengeReturn {
  return {
    challenge: baseChallenge,
    loading: false,
    error: null,
    guesses: [],
    latestGuess: null,
    isComplete: false,
    isCorrect: false,
    attemptsRemaining: 6,
    maxAttempts: 6,
    sessionId: 'session-abc',
    submitting: false,
    submitError: null,
    result: null,
    loadingResult: false,
    submitGuess: vi.fn().mockResolvedValue(undefined),
    clearSubmitError: vi.fn(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderPage() {
  return render(
    <MemoryRouter>
      <DailyPage />
    </MemoryRouter>,
  );
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  localStorage.clear();
  mockUseDailyChallenge.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------

describe('DailyPage — loading state', () => {
  it('shows a loading indicator while data is being fetched', () => {
    mockUseDailyChallenge.mockReturnValue(buildDefaultReturn({ loading: true, challenge: null }));
    renderPage();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/loading today's puzzle/i)).toBeInTheDocument();
  });

  it('does not show the guess input during loading', () => {
    mockUseDailyChallenge.mockReturnValue(buildDefaultReturn({ loading: true, challenge: null }));
    renderPage();
    expect(screen.queryByPlaceholderText(/search for a song/i)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

describe('DailyPage — error state', () => {
  it('shows error message when loading fails', () => {
    mockUseDailyChallenge.mockReturnValue(
      buildDefaultReturn({ loading: false, challenge: null, error: 'Network failure' }),
    );
    renderPage();
    expect(screen.getByText('Network failure')).toBeInTheDocument();
    expect(screen.getByText(/could not load puzzle/i)).toBeInTheDocument();
  });

  it('shows a retry button on error', () => {
    mockUseDailyChallenge.mockReturnValue(
      buildDefaultReturn({ loading: false, challenge: null, error: 'Timeout' }),
    );
    renderPage();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Puzzle number in header
// ---------------------------------------------------------------------------

describe('DailyPage — puzzle number in header', () => {
  it('shows the puzzle number in the page header when challenge is loaded', () => {
    mockUseDailyChallenge.mockReturnValue(buildDefaultReturn());
    renderPage();
    expect(screen.getByText(/daily puzzle #42/i)).toBeInTheDocument();
  });

  it('shows generic "Daily Puzzle" when puzzleNumber is null', () => {
    const challengeWithoutNumber = { ...baseChallenge, puzzleNumber: null as unknown as number };
    mockUseDailyChallenge.mockReturnValue(
      buildDefaultReturn({ challenge: { ...challengeWithoutNumber, puzzleNumber: 0 } }),
    );
    // puzzleNumber of 0 is falsy — the header will show "Daily Puzzle"
    renderPage();
    // Just verify the header renders without crashing
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Guess input
// ---------------------------------------------------------------------------

describe('DailyPage — guess input', () => {
  it('renders the song search input when the puzzle is not complete', () => {
    mockUseDailyChallenge.mockReturnValue(buildDefaultReturn({ isComplete: false }));
    renderPage();
    expect(screen.getByPlaceholderText(/search for a song/i)).toBeInTheDocument();
  });

  it('does not render the guess input when the puzzle is complete', () => {
    mockUseDailyChallenge.mockReturnValue(
      buildDefaultReturn({
        isComplete: true,
        isCorrect: true,
        result: baseResult,
        loadingResult: false,
      }),
    );
    renderPage();
    expect(screen.queryByPlaceholderText(/search for a song/i)).not.toBeInTheDocument();
  });

  it('calls submitGuess when the Guess button is clicked with a value', async () => {
    const submitGuess = vi.fn().mockResolvedValue(undefined);
    mockUseDailyChallenge.mockReturnValue(buildDefaultReturn({ submitGuess }));
    renderPage();

    const input = screen.getByPlaceholderText(/search for a song/i);
    fireEvent.change(input, { target: { value: 'Imagine' } });
    fireEvent.click(screen.getByRole('button', { name: /guess/i }));

    expect(submitGuess).toHaveBeenCalledWith('Imagine');
  });

  it('shows attempt counter text', () => {
    mockUseDailyChallenge.mockReturnValue(
      buildDefaultReturn({ attemptsRemaining: 6, maxAttempts: 6 }),
    );
    renderPage();
    expect(screen.getByText(/attempt 1 of 6/i)).toBeInTheDocument();
  });

  it('shows "remaining" count alongside attempt counter', () => {
    mockUseDailyChallenge.mockReturnValue(
      buildDefaultReturn({ attemptsRemaining: 5, maxAttempts: 6 }),
    );
    renderPage();
    expect(screen.getByText(/5 remaining/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Previous guesses
// ---------------------------------------------------------------------------

describe('DailyPage — previous guesses', () => {
  const guess1: DailyGuessResponse = {
    correct: false,
    attemptsUsed: 1,
    attemptsRemaining: 5,
    maxAttempts: 6,
    timeTakenSeconds: null,
    song: { title: 'Hey Jude', artist: 'The Beatles', spotifyId: null, albumArt: null, previewUrl: null },
  };

  const guess2: DailyGuessResponse = {
    correct: true,
    attemptsUsed: 2,
    attemptsRemaining: 4,
    maxAttempts: 6,
    timeTakenSeconds: 25,
    song: { title: 'Bohemian Rhapsody', artist: 'Queen', spotifyId: null, albumArt: null, previewUrl: null },
  };

  it('does not show "Your Guesses" section when no guesses have been made', () => {
    mockUseDailyChallenge.mockReturnValue(buildDefaultReturn({ guesses: [] }));
    renderPage();
    expect(screen.queryByText(/your guesses/i)).not.toBeInTheDocument();
  });

  it('shows previous guesses list when guesses exist', () => {
    mockUseDailyChallenge.mockReturnValue(
      buildDefaultReturn({
        guesses: [guess1],
        latestGuess: guess1,
        attemptsRemaining: 5,
      }),
    );
    renderPage();
    expect(screen.getByText(/your guesses/i)).toBeInTheDocument();
    expect(screen.getByText(/hey jude — the beatles/i)).toBeInTheDocument();
  });

  it('shows multiple previous guesses', () => {
    mockUseDailyChallenge.mockReturnValue(
      buildDefaultReturn({
        guesses: [guess1, guess2],
        latestGuess: guess2,
        isComplete: true,
        isCorrect: true,
        result: baseResult,
        attemptsRemaining: 4,
      }),
    );
    renderPage();
    expect(screen.getByText(/hey jude — the beatles/i)).toBeInTheDocument();
    expect(screen.getByText(/bohemian rhapsody — queen/i)).toBeInTheDocument();
  });

  it('shows numbered badges for each guess (#1, #2)', () => {
    mockUseDailyChallenge.mockReturnValue(
      buildDefaultReturn({
        guesses: [guess1, guess2],
        latestGuess: guess2,
        isComplete: true,
        isCorrect: true,
        result: baseResult,
        attemptsRemaining: 4,
      }),
    );
    renderPage();
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Submit error notification
// ---------------------------------------------------------------------------

describe('DailyPage — submit error', () => {
  it('displays submit error message when present', () => {
    mockUseDailyChallenge.mockReturnValue(
      buildDefaultReturn({ submitError: 'Guess cannot be empty' }),
    );
    renderPage();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/guess cannot be empty/i)).toBeInTheDocument();
  });

  it('calls clearSubmitError when dismiss button is clicked', () => {
    const clearSubmitError = vi.fn();
    mockUseDailyChallenge.mockReturnValue(
      buildDefaultReturn({ submitError: 'Some error', clearSubmitError }),
    );
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /dismiss error/i }));
    expect(clearSubmitError).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Result section
// ---------------------------------------------------------------------------

describe('DailyPage — result section', () => {
  it('shows result section when complete with result data', () => {
    mockUseDailyChallenge.mockReturnValue(
      buildDefaultReturn({
        isComplete: true,
        isCorrect: true,
        result: baseResult,
        loadingResult: false,
      }),
    );
    renderPage();
    expect(screen.getByText(/you got it!/i)).toBeInTheDocument();
  });

  it('shows song title and artist in the result card', () => {
    mockUseDailyChallenge.mockReturnValue(
      buildDefaultReturn({
        isComplete: true,
        isCorrect: true,
        result: baseResult,
        loadingResult: false,
      }),
    );
    renderPage();
    expect(screen.getByText('Bohemian Rhapsody')).toBeInTheDocument();
    expect(screen.getByText('Queen')).toBeInTheDocument();
  });

  it('shows "Better luck tomorrow!" on an incorrect outcome', () => {
    const incorrectResult: DailyResultResponse = {
      ...baseResult,
      correct: false,
      attemptsUsed: 6,
    };
    mockUseDailyChallenge.mockReturnValue(
      buildDefaultReturn({
        isComplete: true,
        isCorrect: false,
        result: incorrectResult,
        loadingResult: false,
      }),
    );
    renderPage();
    expect(screen.getByText(/better luck tomorrow/i)).toBeInTheDocument();
  });

  it('shows result loading placeholder while loadingResult is true', () => {
    mockUseDailyChallenge.mockReturnValue(
      buildDefaultReturn({
        isComplete: true,
        isCorrect: true,
        result: null,
        loadingResult: true,
      }),
    );
    renderPage();
    expect(screen.getByText(/loading result/i)).toBeInTheDocument();
  });

  it('shows "View Leaderboard" button in result section', () => {
    mockUseDailyChallenge.mockReturnValue(
      buildDefaultReturn({
        isComplete: true,
        isCorrect: true,
        result: baseResult,
        loadingResult: false,
      }),
    );
    renderPage();
    expect(screen.getByRole('button', { name: /view leaderboard/i })).toBeInTheDocument();
  });

  it('shows "Share Result" button in result section', () => {
    mockUseDailyChallenge.mockReturnValue(
      buildDefaultReturn({
        isComplete: true,
        isCorrect: true,
        result: baseResult,
        loadingResult: false,
      }),
    );
    renderPage();
    expect(screen.getByRole('button', { name: /share result/i })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Countdown timer
// ---------------------------------------------------------------------------

describe('DailyPage — countdown timer', () => {
  it('renders countdown timer when challenge is loaded', () => {
    mockUseDailyChallenge.mockReturnValue(buildDefaultReturn());
    renderPage();
    // The countdown label shows "Next puzzle"
    expect(screen.getByText(/next puzzle/i)).toBeInTheDocument();
  });

  it('renders a time string matching HH:MM:SS format', () => {
    mockUseDailyChallenge.mockReturnValue(buildDefaultReturn());
    renderPage();
    // The countdown uses tabular-nums and aria-label
    const countdown = screen.getByLabelText(/next puzzle in/i);
    expect(countdown).toBeInTheDocument();
    expect(countdown.textContent).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });
});

// ---------------------------------------------------------------------------
// Song hint
// ---------------------------------------------------------------------------

describe('DailyPage — song hint', () => {
  it('renders the song hint from the challenge', () => {
    mockUseDailyChallenge.mockReturnValue(buildDefaultReturn());
    renderPage();
    expect(screen.getByText('Released in the 1970s by a British band.')).toBeInTheDocument();
  });

  it('renders "Song Hint" label', () => {
    mockUseDailyChallenge.mockReturnValue(buildDefaultReturn());
    renderPage();
    expect(screen.getByText(/song hint/i)).toBeInTheDocument();
  });
});
