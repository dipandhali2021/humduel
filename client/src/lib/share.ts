const SITE_BASE = 'humduel.io';

// ─── Share text generation ────────────────────────────────────────────────────

/**
 * Build a Wordle-style share text for a completed challenge.
 *
 * Successful example (3 of 6):
 *   🎵 HumDuel
 *
 *   I guessed it in 3/6 attempts!
 *   🟥🟥🟩
 *
 *   humduel.io/challenge/abc123
 *
 * Failed example:
 *   🎵 HumDuel
 *
 *   I couldn't guess this one! 😅
 *   🟥🟥🟥🟥🟥🟥
 *
 *   humduel.io/challenge/abc123
 */
export function generateShareText(params: {
  correct: boolean;
  attemptsUsed: number;
  maxAttempts: number;
  challengeId: string;
  /** One entry per attempt: true = correct guess, false = wrong guess. */
  guessResults: boolean[];
}): string {
  const { correct, attemptsUsed, maxAttempts, challengeId, guessResults } = params;

  const squares = guessResults.map((hit) => (hit ? '🟩' : '🟥')).join('');
  const challengeUrl = `${SITE_BASE}/challenge/${challengeId}`;

  const resultLine = correct
    ? `I guessed it in ${attemptsUsed}/${maxAttempts} attempts!`
    : `I couldn't guess this one! 😅`;

  return `🎵 HumDuel\n\n${resultLine}\n${squares}\n\n${challengeUrl}`;
}

// ─── Web Share / clipboard fallback ──────────────────────────────────────────

/**
 * Share `text` via the Web Share API when available, or copy it to the
 * clipboard as a fallback.
 *
 * @returns `'shared'` when the native share sheet was used, `'copied'` when
 *          the text was written to the clipboard instead.
 */
export async function shareResult(text: string): Promise<'shared' | 'copied'> {
  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    navigator.canShare?.({ text })
  ) {
    await navigator.share({ text });
    return 'shared';
  }

  await navigator.clipboard.writeText(text);
  return 'copied';
}
