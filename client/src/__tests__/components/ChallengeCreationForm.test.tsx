import { vi, describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChallengeCreationForm } from '@/components/challenge/ChallengeCreationForm';

// ---------------------------------------------------------------------------
// Mock WaveformCanvas — it uses canvas APIs not available in jsdom
// ---------------------------------------------------------------------------

vi.mock('@/components/audio/WaveformCanvas', () => ({
  WaveformCanvas: ({ mode }: { mode: string }) => (
    <div data-testid="waveform-canvas" data-mode={mode} aria-label="Audio waveform preview" />
  ),
}));

// ---------------------------------------------------------------------------
// Default props helper
// ---------------------------------------------------------------------------

const WAVEFORM_DATA = [0.1, 0.5, 0.8, 0.3, 0.7];

function buildProps(overrides: {
  waveformData?: number[];
  onSubmit?: ReturnType<typeof vi.fn>;
  isSubmitting?: boolean;
} = {}) {
  return {
    waveformData: overrides.waveformData ?? WAVEFORM_DATA,
    onSubmit: overrides.onSubmit ?? vi.fn(),
    isSubmitting: overrides.isSubmitting ?? false,
  };
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('ChallengeCreationForm — rendering', () => {
  it('renders the song title input', () => {
    render(<ChallengeCreationForm {...buildProps()} />);
    expect(screen.getByLabelText(/song title/i)).toBeInTheDocument();
  });

  it('renders the artist input', () => {
    render(<ChallengeCreationForm {...buildProps()} />);
    expect(screen.getByLabelText(/artist/i)).toBeInTheDocument();
  });

  it('renders the creator alias (optional name) input', () => {
    render(<ChallengeCreationForm {...buildProps()} />);
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
  });

  it('renders the waveform preview', () => {
    render(<ChallengeCreationForm {...buildProps()} />);
    expect(screen.getByTestId('waveform-canvas')).toBeInTheDocument();
  });

  it('passes "static" mode to WaveformCanvas', () => {
    render(<ChallengeCreationForm {...buildProps()} />);
    expect(screen.getByTestId('waveform-canvas')).toHaveAttribute('data-mode', 'static');
  });

  it('renders the "Create Challenge" submit button', () => {
    render(<ChallengeCreationForm {...buildProps()} />);
    expect(screen.getByRole('button', { name: /create challenge/i })).toBeInTheDocument();
  });

  it('has the form element with an aria-label', () => {
    render(<ChallengeCreationForm {...buildProps()} />);
    expect(screen.getByRole('form', { name: /challenge creation form/i })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Submit button disabled states
// ---------------------------------------------------------------------------

describe('ChallengeCreationForm — submit button disabled states', () => {
  it('submit button is disabled when both title and artist are empty', () => {
    render(<ChallengeCreationForm {...buildProps()} />);
    expect(screen.getByRole('button', { name: /create challenge/i })).toBeDisabled();
  });

  it('submit button is disabled when only title is filled', () => {
    render(<ChallengeCreationForm {...buildProps()} />);
    fireEvent.change(screen.getByLabelText(/song title/i), { target: { value: 'Imagine' } });
    expect(screen.getByRole('button', { name: /create challenge/i })).toBeDisabled();
  });

  it('submit button is disabled when only artist is filled', () => {
    render(<ChallengeCreationForm {...buildProps()} />);
    fireEvent.change(screen.getByLabelText(/artist/i), { target: { value: 'John Lennon' } });
    expect(screen.getByRole('button', { name: /create challenge/i })).toBeDisabled();
  });

  it('submit button is enabled when both title and artist are filled', () => {
    render(<ChallengeCreationForm {...buildProps()} />);
    fireEvent.change(screen.getByLabelText(/song title/i), { target: { value: 'Imagine' } });
    fireEvent.change(screen.getByLabelText(/artist/i), { target: { value: 'John Lennon' } });
    expect(screen.getByRole('button', { name: /create challenge/i })).not.toBeDisabled();
  });

  it('submit button is disabled when isSubmitting is true', () => {
    render(<ChallengeCreationForm {...buildProps({ isSubmitting: true })} />);
    // Button should be disabled during submission
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
  });

  it('submit button is disabled when fields contain only whitespace', () => {
    render(<ChallengeCreationForm {...buildProps()} />);
    fireEvent.change(screen.getByLabelText(/song title/i), { target: { value: '   ' } });
    fireEvent.change(screen.getByLabelText(/artist/i), { target: { value: '   ' } });
    expect(screen.getByRole('button', { name: /create challenge/i })).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// Loading / submitting state
// ---------------------------------------------------------------------------

describe('ChallengeCreationForm — loading state', () => {
  it('shows loading text "Creating…" in button when isSubmitting', () => {
    render(<ChallengeCreationForm {...buildProps({ isSubmitting: true })} />);
    expect(screen.getByText(/creating/i)).toBeInTheDocument();
  });

  it('disables all inputs when isSubmitting is true', () => {
    render(<ChallengeCreationForm {...buildProps({ isSubmitting: true })} />);
    expect(screen.getByLabelText(/song title/i)).toBeDisabled();
    expect(screen.getByLabelText(/artist/i)).toBeDisabled();
    expect(screen.getByLabelText(/your name/i)).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// Form submission
// ---------------------------------------------------------------------------

describe('ChallengeCreationForm — form submission', () => {
  it('calls onSubmit with songTitle and songArtist on valid submit', () => {
    const onSubmit = vi.fn();
    render(<ChallengeCreationForm {...buildProps({ onSubmit })} />);

    fireEvent.change(screen.getByLabelText(/song title/i), { target: { value: 'Bohemian Rhapsody' } });
    fireEvent.change(screen.getByLabelText(/artist/i), { target: { value: 'Queen' } });
    fireEvent.click(screen.getByRole('button', { name: /create challenge/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ songTitle: 'Bohemian Rhapsody', songArtist: 'Queen' }),
    );
  });

  it('trims whitespace from song title and artist before submitting', () => {
    const onSubmit = vi.fn();
    render(<ChallengeCreationForm {...buildProps({ onSubmit })} />);

    fireEvent.change(screen.getByLabelText(/song title/i), { target: { value: '  Hotel California  ' } });
    fireEvent.change(screen.getByLabelText(/artist/i), { target: { value: '  Eagles  ' } });
    fireEvent.click(screen.getByRole('button', { name: /create challenge/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ songTitle: 'Hotel California', songArtist: 'Eagles' }),
    );
  });

  it('passes creatorAlias when provided', () => {
    const onSubmit = vi.fn();
    render(<ChallengeCreationForm {...buildProps({ onSubmit })} />);

    fireEvent.change(screen.getByLabelText(/song title/i), { target: { value: 'Imagine' } });
    fireEvent.change(screen.getByLabelText(/artist/i), { target: { value: 'John Lennon' } });
    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: 'Dipan' } });
    fireEvent.click(screen.getByRole('button', { name: /create challenge/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ creatorAlias: 'Dipan' }),
    );
  });

  it('passes undefined creatorAlias when alias field is empty', () => {
    const onSubmit = vi.fn();
    render(<ChallengeCreationForm {...buildProps({ onSubmit })} />);

    fireEvent.change(screen.getByLabelText(/song title/i), { target: { value: 'Imagine' } });
    fireEvent.change(screen.getByLabelText(/artist/i), { target: { value: 'John Lennon' } });
    fireEvent.click(screen.getByRole('button', { name: /create challenge/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ creatorAlias: undefined }),
    );
  });

  it('does not call onSubmit when title is missing and shows validation error', async () => {
    const onSubmit = vi.fn();
    render(<ChallengeCreationForm {...buildProps({ onSubmit })} />);

    // Only fill artist
    fireEvent.change(screen.getByLabelText(/artist/i), { target: { value: 'Queen' } });
    // Manually fire submit on form (button is disabled but we can submit form directly)
    const form = screen.getByRole('form');
    fireEvent.submit(form);

    expect(onSubmit).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByText(/song title is required/i)).toBeInTheDocument();
    });
  });

  it('does not call onSubmit when artist is missing and shows validation error', async () => {
    const onSubmit = vi.fn();
    render(<ChallengeCreationForm {...buildProps({ onSubmit })} />);

    fireEvent.change(screen.getByLabelText(/song title/i), { target: { value: 'Imagine' } });
    const form = screen.getByRole('form');
    fireEvent.submit(form);

    expect(onSubmit).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByText(/artist name is required/i)).toBeInTheDocument();
    });
  });

  it('clears title error when user starts typing', async () => {
    render(<ChallengeCreationForm {...buildProps()} />);

    // Trigger validation error first
    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => {
      expect(screen.getByText(/song title is required/i)).toBeInTheDocument();
    });

    // Start typing in title field
    fireEvent.change(screen.getByLabelText(/song title/i), { target: { value: 'H' } });

    await waitFor(() => {
      expect(screen.queryByText(/song title is required/i)).not.toBeInTheDocument();
    });
  });
});
