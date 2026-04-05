import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ShareButton } from '@/components/challenge/ShareButton';

// ---------------------------------------------------------------------------
// Mock share.ts so we control what shareResult returns
// ---------------------------------------------------------------------------

vi.mock('@/lib/share', () => ({
  shareResult: vi.fn(),
}));

import { shareResult } from '@/lib/share';

const mockShareResult = vi.mocked(shareResult);

// ---------------------------------------------------------------------------
// Default props
// ---------------------------------------------------------------------------

const defaultProps = {
  challengeUrl: 'https://humduel.io/challenge/abc123',
  challengeId: 'abc123',
};

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('ShareButton — rendering', () => {
  it('renders "Share Challenge" text initially', () => {
    render(<ShareButton {...defaultProps} />);
    expect(screen.getByText('Share Challenge')).toBeInTheDocument();
  });

  it('renders a button element', () => {
    render(<ShareButton {...defaultProps} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('applies the className prop to the outer container', () => {
    const { container } = render(
      <ShareButton {...defaultProps} className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has an aria-label equal to "Share Challenge" initially', () => {
    render(<ShareButton {...defaultProps} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Share Challenge');
  });

  it('is not disabled by default', () => {
    render(<ShareButton {...defaultProps} />);
    expect(screen.getByRole('button')).not.toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// Share interaction — returns 'copied'
// ---------------------------------------------------------------------------

describe('ShareButton — clipboard copy fallback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockShareResult.mockResolvedValue('copied');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  it('calls shareResult with the challengeUrl when clicked', async () => {
    render(<ShareButton {...defaultProps} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    expect(mockShareResult).toHaveBeenCalledWith(defaultProps.challengeUrl);
  });

  it('shows "Copied!" feedback after clicking when clipboard used', async () => {
    render(<ShareButton {...defaultProps} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });

  it('aria-label updates to "Copied!" after clipboard copy', async () => {
    render(<ShareButton {...defaultProps} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Copied!');
  });

  it('resets to "Share Challenge" after FEEDBACK_DURATION_MS', async () => {
    render(<ShareButton {...defaultProps} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    expect(screen.getByText('Copied!')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2600);
    });

    expect(screen.getByText('Share Challenge')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Share interaction — returns 'shared'
// ---------------------------------------------------------------------------

describe('ShareButton — Web Share API used', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockShareResult.mockResolvedValue('shared');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  it('shows "Shared!" feedback when native share API is used', async () => {
    render(<ShareButton {...defaultProps} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    expect(screen.getByText('Shared!')).toBeInTheDocument();
  });

  it('aria-label updates to "Shared!" after successful share', async () => {
    render(<ShareButton {...defaultProps} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Shared!');
  });

  it('resets to "Share Challenge" text after FEEDBACK_DURATION_MS', async () => {
    render(<ShareButton {...defaultProps} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    expect(screen.getByText('Shared!')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2600);
    });

    expect(screen.getByText('Share Challenge')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

describe('ShareButton — error handling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockShareResult.mockRejectedValue(new Error('User cancelled'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  it('does not crash when shareResult throws (user dismissed share sheet)', async () => {
    render(<ShareButton {...defaultProps} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    // No thrown errors — component renders normally
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('stays on "Share Challenge" label when share is dismissed', async () => {
    render(<ShareButton {...defaultProps} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    // Feedback state should remain 'idle' since catch block runs without setting feedback
    expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
    expect(screen.queryByText('Shared!')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Prevents double-click
// ---------------------------------------------------------------------------

describe('ShareButton — prevents duplicate triggers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Simulate a slow share that resolves after timer advance
    mockShareResult.mockResolvedValue('copied');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  it('disables button immediately during share operation', async () => {
    // Use a promise that we control
    let resolveShare!: (v: 'copied' | 'shared') => void;
    mockShareResult.mockReturnValue(
      new Promise<'copied' | 'shared'>((res) => { resolveShare = res; }),
    );

    render(<ShareButton {...defaultProps} />);

    // Click the button — button becomes disabled while isWorking is true
    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByRole('button')).toBeDisabled();

    // Resolve the share
    await act(async () => {
      resolveShare('copied');
    });
  });

  it('only invokes shareResult once for a single click', async () => {
    render(<ShareButton {...defaultProps} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    expect(mockShareResult).toHaveBeenCalledTimes(1);
  });
});
