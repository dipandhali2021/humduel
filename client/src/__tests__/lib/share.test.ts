import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateShareText, shareResult } from '@/lib/share';

// ---------------------------------------------------------------------------
// generateShareText
// ---------------------------------------------------------------------------

describe('generateShareText', () => {
  it('contains the HumDuel header', () => {
    const text = generateShareText({
      correct: true,
      attemptsUsed: 3,
      maxAttempts: 6,
      challengeId: 'abc123',
      guessResults: [false, false, true],
    });
    expect(text).toContain('🎵 HumDuel');
  });

  it('generates correct text for a successful guess (3/6)', () => {
    const text = generateShareText({
      correct: true,
      attemptsUsed: 3,
      maxAttempts: 6,
      challengeId: 'abc123',
      guessResults: [false, false, true],
    });
    expect(text).toContain('I guessed it in 3/6 attempts!');
  });

  it('generates correct text for a first-try guess (1/6)', () => {
    const text = generateShareText({
      correct: true,
      attemptsUsed: 1,
      maxAttempts: 6,
      challengeId: 'abc123',
      guessResults: [true],
    });
    expect(text).toContain('I guessed it in 1/6 attempts!');
  });

  it('generates correct text for a failed guess (all wrong)', () => {
    const text = generateShareText({
      correct: false,
      attemptsUsed: 6,
      maxAttempts: 6,
      challengeId: 'abc123',
      guessResults: [false, false, false, false, false, false],
    });
    expect(text).toContain("I couldn't guess this one!");
  });

  it('contains green square (🟩) for correct guess result', () => {
    const text = generateShareText({
      correct: true,
      attemptsUsed: 1,
      maxAttempts: 6,
      challengeId: 'abc123',
      guessResults: [true],
    });
    expect(text).toContain('🟩');
  });

  it('contains red square (🟥) for incorrect guess results', () => {
    const text = generateShareText({
      correct: false,
      attemptsUsed: 3,
      maxAttempts: 6,
      challengeId: 'abc123',
      guessResults: [false, false, false],
    });
    expect(text).toContain('🟥');
  });

  it('renders correct emoji squares for mixed results (🟥🟥🟩)', () => {
    const text = generateShareText({
      correct: true,
      attemptsUsed: 3,
      maxAttempts: 6,
      challengeId: 'abc123',
      guessResults: [false, false, true],
    });
    expect(text).toContain('🟥🟥🟩');
  });

  it('renders all red squares for failed attempt', () => {
    const text = generateShareText({
      correct: false,
      attemptsUsed: 6,
      maxAttempts: 6,
      challengeId: 'abc123',
      guessResults: [false, false, false, false, false, false],
    });
    expect(text).toContain('🟥🟥🟥🟥🟥🟥');
  });

  it('renders single green square for first-try success', () => {
    const text = generateShareText({
      correct: true,
      attemptsUsed: 1,
      maxAttempts: 6,
      challengeId: 'challenge-id-here',
      guessResults: [true],
    });
    // Exactly one green, no red
    expect(text).toContain('🟩');
    expect(text).not.toContain('🟥');
  });

  it('contains the challenge URL', () => {
    const text = generateShareText({
      correct: true,
      attemptsUsed: 2,
      maxAttempts: 6,
      challengeId: 'test-id-456',
      guessResults: [false, true],
    });
    expect(text).toContain('test-id-456');
    expect(text).toContain('https://humduel.vercel.app/c/test-id-456');
  });

  it('contains the full challenge URL with site base', () => {
    const text = generateShareText({
      correct: false,
      attemptsUsed: 2,
      maxAttempts: 6,
      challengeId: 'xyz-789',
      guessResults: [false, false],
    });
    expect(text).toContain('https://humduel.vercel.app/c/xyz-789');
  });

  it('respects maxAttempts in the attempt count line', () => {
    const text = generateShareText({
      correct: true,
      attemptsUsed: 4,
      maxAttempts: 8,
      challengeId: 'abc',
      guessResults: [false, false, false, true],
    });
    expect(text).toContain('4/8');
  });

  it('does not include the success line when the guess was wrong', () => {
    const text = generateShareText({
      correct: false,
      attemptsUsed: 6,
      maxAttempts: 6,
      challengeId: 'abc',
      guessResults: [false, false, false, false, false, false],
    });
    expect(text).not.toContain('I guessed it in');
  });
});

// ---------------------------------------------------------------------------
// shareResult
// ---------------------------------------------------------------------------

describe('shareResult — Web Share API available', () => {
  beforeEach(() => {
    // Provide navigator.share and navigator.canShare
    Object.defineProperty(navigator, 'share', {
      value: vi.fn().mockResolvedValue(undefined),
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, 'canShare', {
      value: vi.fn().mockReturnValue(true),
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls navigator.share with the provided text', async () => {
    await shareResult('Test share text');
    expect(navigator.share).toHaveBeenCalledWith({ text: 'Test share text' });
  });

  it('returns "shared" when Web Share API is used', async () => {
    const result = await shareResult('Some text');
    expect(result).toBe('shared');
  });
});

describe('shareResult — Web Share API not available (clipboard fallback)', () => {
  beforeEach(() => {
    // Remove navigator.share so the clipboard path is taken
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    // Mock clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('falls back to navigator.clipboard.writeText', async () => {
    await shareResult('Fallback text');
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Fallback text');
  });

  it('returns "copied" when clipboard fallback is used', async () => {
    const result = await shareResult('Clipboard text');
    expect(result).toBe('copied');
  });
});

describe('shareResult — canShare returns false (clipboard fallback)', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'share', {
      value: vi.fn(),
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, 'canShare', {
      value: vi.fn().mockReturnValue(false),
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses clipboard when canShare returns false', async () => {
    const result = await shareResult('Some text');
    expect(result).toBe('copied');
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Some text');
  });
});
