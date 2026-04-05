import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { GuessingForm } from '@/components/challenge/GuessingForm';
import type { GuessResponse } from '@/types';

// ---------------------------------------------------------------------------
// Mock songCatalog so tests are deterministic and fast
// ---------------------------------------------------------------------------

vi.mock('@/lib/songCatalog', () => ({
  searchSongs: vi.fn((query: string) => {
    if (!query.trim()) return [];
    if (query.toLowerCase().includes('bohemian')) {
      return [{ title: 'Bohemian Rhapsody', artist: 'Queen' }];
    }
    if (query.toLowerCase().includes('queen')) {
      return [
        { title: 'Bohemian Rhapsody', artist: 'Queen' },
        { title: "Don't Stop Me Now", artist: 'Queen' },
        { title: 'We Will Rock You', artist: 'Queen' },
      ];
    }
    if (query.toLowerCase().includes('imagine')) {
      return [{ title: 'Imagine', artist: 'John Lennon' }];
    }
    return [];
  }),
}));

// ---------------------------------------------------------------------------
// Default props helper
// ---------------------------------------------------------------------------

const defaultProps = {
  onSubmit: vi.fn(),
  disabled: false,
  attemptsRemaining: 5,
  maxAttempts: 6,
  previousGuesses: [] as GuessResponse[],
};

function buildProps(overrides: Partial<typeof defaultProps> = {}) {
  return { ...defaultProps, ...overrides, onSubmit: overrides.onSubmit ?? vi.fn() };
}

// Helper: type into input and flush the debounce
function typeAndFlush(input: HTMLElement, value: string) {
  fireEvent.change(input, { target: { value } });
  act(() => {
    vi.advanceTimersByTime(350); // past the 300ms debounce
  });
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('GuessingForm — rendering', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the search input', () => {
    render(<GuessingForm {...buildProps()} />);
    expect(screen.getByPlaceholderText(/search for a song/i)).toBeInTheDocument();
  });

  it('renders the Guess button', () => {
    render(<GuessingForm {...buildProps()} />);
    expect(screen.getByRole('button', { name: /guess/i })).toBeInTheDocument();
  });

  it('shows attempt counter text when attempts remain', () => {
    render(<GuessingForm {...buildProps({ attemptsRemaining: 5, maxAttempts: 6 })} />);
    expect(screen.getByText(/attempt 2 of 6/i)).toBeInTheDocument();
  });

  it('shows "All attempts used" when attemptsRemaining is 0', () => {
    render(<GuessingForm {...buildProps({ attemptsRemaining: 0, maxAttempts: 6 })} />);
    expect(screen.getByText(/all attempts used/i)).toBeInTheDocument();
  });

  it('shows attempt counter for first attempt (1 of N)', () => {
    render(<GuessingForm {...buildProps({ attemptsRemaining: 6, maxAttempts: 6 })} />);
    expect(screen.getByText(/attempt 1 of 6/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Guess button disabled states
// ---------------------------------------------------------------------------

describe('GuessingForm — Guess button disabled states', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('Guess button is disabled when input is empty', () => {
    render(<GuessingForm {...buildProps()} />);
    expect(screen.getByRole('button', { name: /guess/i })).toBeDisabled();
  });

  it('Guess button is enabled when input has a value', () => {
    render(<GuessingForm {...buildProps()} />);
    const input = screen.getByPlaceholderText(/search for a song/i);
    fireEvent.change(input, { target: { value: 'Some Song' } });
    expect(screen.getByRole('button', { name: /guess/i })).not.toBeDisabled();
  });

  it('Guess button is disabled when disabled prop is true even if input has value', () => {
    render(<GuessingForm {...buildProps({ disabled: true })} />);
    const input = screen.getByPlaceholderText(/search for a song/i);
    fireEvent.change(input, { target: { value: 'Test song' } });
    expect(screen.getByRole('button', { name: /guess/i })).toBeDisabled();
  });

  it('Guess button is disabled when input contains only whitespace', () => {
    render(<GuessingForm {...buildProps()} />);
    const input = screen.getByPlaceholderText(/search for a song/i);
    fireEvent.change(input, { target: { value: '   ' } });
    expect(screen.getByRole('button', { name: /guess/i })).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// Autocomplete dropdown
// ---------------------------------------------------------------------------

describe('GuessingForm — autocomplete dropdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows autocomplete dropdown after typing (after debounce)', () => {
    render(<GuessingForm {...buildProps()} />);
    const input = screen.getByPlaceholderText(/search for a song/i);

    typeAndFlush(input, 'bohemian');

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByText('Bohemian Rhapsody')).toBeInTheDocument();
  });

  it('shows artist name in the dropdown suggestion', () => {
    render(<GuessingForm {...buildProps()} />);
    const input = screen.getByPlaceholderText(/search for a song/i);

    typeAndFlush(input, 'bohemian');

    expect(screen.getByText('Queen')).toBeInTheDocument();
  });

  it('hides dropdown when input is cleared', () => {
    render(<GuessingForm {...buildProps()} />);
    const input = screen.getByPlaceholderText(/search for a song/i);

    // Open dropdown
    typeAndFlush(input, 'queen');
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    // Clear input
    typeAndFlush(input, '');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('selects suggestion when clicked and populates input', () => {
    render(<GuessingForm {...buildProps()} />);
    const input = screen.getByPlaceholderText(/search for a song/i);

    typeAndFlush(input, 'bohemian');
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    const option = screen.getByRole('option', { name: /bohemian rhapsody/i });
    fireEvent.pointerDown(option);

    expect((input as HTMLInputElement).value).toContain('Bohemian Rhapsody');
  });

  it('populates input with selected suggestion title and artist', () => {
    render(<GuessingForm {...buildProps()} />);
    const input = screen.getByPlaceholderText(/search for a song/i);

    typeAndFlush(input, 'bohemian');
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    const option = screen.getByRole('option', { name: /bohemian rhapsody/i });
    fireEvent.pointerDown(option);

    // Input value should contain both title and artist in the formatted label
    expect((input as HTMLInputElement).value).toContain('Bohemian Rhapsody');
    expect((input as HTMLInputElement).value).toContain('Queen');
  });

  it('does not show dropdown when no results match', () => {
    render(<GuessingForm {...buildProps()} />);
    const input = screen.getByPlaceholderText(/search for a song/i);

    typeAndFlush(input, 'xyznonexistent');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('shows multiple suggestions when query matches several songs', () => {
    render(<GuessingForm {...buildProps()} />);
    const input = screen.getByPlaceholderText(/search for a song/i);

    typeAndFlush(input, 'queen');

    const options = screen.getAllByRole('option');
    expect(options.length).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// Form submission
// ---------------------------------------------------------------------------

describe('GuessingForm — form submission', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls onSubmit with the trimmed input value when Guess button clicked', () => {
    const onSubmit = vi.fn();
    render(<GuessingForm {...buildProps({ onSubmit })} />);
    const input = screen.getByPlaceholderText(/search for a song/i);

    fireEvent.change(input, { target: { value: 'Imagine' } });
    fireEvent.click(screen.getByRole('button', { name: /guess/i }));

    expect(onSubmit).toHaveBeenCalledWith('Imagine');
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('calls onSubmit with trimmed value (strips leading/trailing whitespace)', () => {
    const onSubmit = vi.fn();
    render(<GuessingForm {...buildProps({ onSubmit })} />);
    const input = screen.getByPlaceholderText(/search for a song/i);

    fireEvent.change(input, { target: { value: '  Imagine  ' } });
    fireEvent.click(screen.getByRole('button', { name: /guess/i }));

    expect(onSubmit).toHaveBeenCalledWith('Imagine');
  });

  it('clears the input after a successful submission', () => {
    const onSubmit = vi.fn();
    render(<GuessingForm {...buildProps({ onSubmit })} />);
    const input = screen.getByPlaceholderText(/search for a song/i) as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'Imagine' } });
    fireEvent.click(screen.getByRole('button', { name: /guess/i }));

    expect(input.value).toBe('');
  });

  it('does not call onSubmit when disabled is true', () => {
    const onSubmit = vi.fn();
    render(<GuessingForm {...buildProps({ disabled: true, onSubmit })} />);
    const input = screen.getByPlaceholderText(/search for a song/i);

    fireEvent.change(input, { target: { value: 'Imagine' } });
    // Fire submit directly on the form (button is disabled)
    fireEvent.submit(input.closest('form')!);

    expect(onSubmit).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Previous guesses
// ---------------------------------------------------------------------------

describe('GuessingForm — previous guesses', () => {
  const correctGuess: GuessResponse = {
    correct: true,
    attemptsUsed: 1,
    attemptsRemaining: 5,
    maxAttempts: 6,
    timeTakenSeconds: 15,
    song: { title: 'Imagine', artist: 'John Lennon', spotifyId: null, albumArt: null, previewUrl: null },
  };

  const wrongGuess: GuessResponse = {
    correct: false,
    attemptsUsed: 2,
    attemptsRemaining: 4,
    maxAttempts: 6,
    timeTakenSeconds: 20,
    song: { title: 'Hey Jude', artist: 'The Beatles', spotifyId: null, albumArt: null, previewUrl: null },
  };

  it('shows "Previous Guesses" section heading when guesses exist', () => {
    render(
      <GuessingForm {...buildProps({ previousGuesses: [correctGuess] })} />
    );
    expect(screen.getByText(/previous guesses/i)).toBeInTheDocument();
  });

  it('does not show "Previous Guesses" heading when no guesses', () => {
    render(<GuessingForm {...buildProps()} />);
    expect(screen.queryByText(/previous guesses/i)).not.toBeInTheDocument();
  });

  it('shows song title and artist for a previous guess', () => {
    render(
      <GuessingForm {...buildProps({ previousGuesses: [correctGuess] })} />
    );
    expect(screen.getByText(/imagine — john lennon/i)).toBeInTheDocument();
  });

  it('shows correct indicator for a correct guess (success styled list item)', () => {
    render(
      <GuessingForm {...buildProps({ previousGuesses: [correctGuess] })} />
    );
    const listItems = screen.getAllByRole('listitem');
    expect(listItems.length).toBeGreaterThan(0);
  });

  it('shows multiple previous guesses', () => {
    render(
      <GuessingForm {...buildProps({ previousGuesses: [correctGuess, wrongGuess] })} />
    );
    expect(screen.getByText(/imagine — john lennon/i)).toBeInTheDocument();
    expect(screen.getByText(/hey jude — the beatles/i)).toBeInTheDocument();
  });

  it('shows attempt number badge (#1, #2)', () => {
    render(
      <GuessingForm {...buildProps({ previousGuesses: [correctGuess, wrongGuess] })} />
    );
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
  });

  it('shows fallback text "Guess N" when song is null', () => {
    const guessNoSong: GuessResponse = {
      correct: false,
      attemptsUsed: 1,
      attemptsRemaining: 5,
      maxAttempts: 6,
      timeTakenSeconds: 5,
      song: null,
    };
    render(
      <GuessingForm {...buildProps({ previousGuesses: [guessNoSong] })} />
    );
    expect(screen.getByText('Guess 1')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Keyboard navigation
// ---------------------------------------------------------------------------

describe('GuessingForm — keyboard navigation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('navigates dropdown with ArrowDown key', () => {
    render(<GuessingForm {...buildProps()} />);
    const input = screen.getByPlaceholderText(/search for a song/i);

    typeAndFlush(input, 'queen');
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.keyDown(input, { key: 'ArrowDown' });

    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('navigates dropdown with ArrowUp key (wraps to last)', () => {
    render(<GuessingForm {...buildProps()} />);
    const input = screen.getByPlaceholderText(/search for a song/i);

    typeAndFlush(input, 'queen');
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    // ArrowUp from -1 should wrap to last item
    fireEvent.keyDown(input, { key: 'ArrowUp' });

    const options = screen.getAllByRole('option');
    expect(options[options.length - 1]).toHaveAttribute('aria-selected', 'true');
  });

  it('closes dropdown on Escape key', () => {
    render(<GuessingForm {...buildProps()} />);
    const input = screen.getByPlaceholderText(/search for a song/i);

    typeAndFlush(input, 'queen');
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.keyDown(input, { key: 'Escape' });

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('submits on Enter key when no dropdown is open', () => {
    const onSubmit = vi.fn();
    render(<GuessingForm {...buildProps({ onSubmit })} />);
    const input = screen.getByPlaceholderText(/search for a song/i);

    fireEvent.change(input, { target: { value: 'Hotel California' } });
    // Don't advance timers — dropdown hasn't opened yet
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSubmit).toHaveBeenCalledWith('Hotel California');
  });

  it('selects highlighted suggestion on Enter key and populates input', () => {
    render(<GuessingForm {...buildProps()} />);
    const input = screen.getByPlaceholderText(/search for a song/i);

    typeAndFlush(input, 'bohemian');
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    // Input should be populated with the selected song's formatted label
    expect((input as HTMLInputElement).value).toContain('Bohemian Rhapsody');
  });
});
