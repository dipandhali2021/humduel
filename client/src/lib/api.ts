import type {
  ChallengeResponse,
  CreateChallengeResponse,
  GuessResponse,
  ChallengeResultResponse,
} from '@/types';

// Trailing slash is intentionally omitted; all paths start with '/'.
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';

// ─── Error handling ───────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Inspect a Response that is NOT ok (status >= 400) and throw an ApiError.
 * Attempts to parse a JSON body shaped `{ error: string; code?: string }`.
 */
async function throwApiError(response: Response): Promise<never> {
  let message = `HTTP ${response.status}`;
  let code = String(response.status);

  try {
    const body = (await response.json()) as { error?: string; code?: string };
    if (body.error) message = body.error;
    if (body.code) code = body.code;
  } catch {
    // Body was not JSON — keep the default message/code.
  }

  throw new ApiError(response.status, code, message);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) await throwApiError(response);
  return response.json() as Promise<T>;
}

// ─── Public API functions ─────────────────────────────────────────────────────

/**
 * Create a new challenge by uploading an audio recording together with its
 * metadata. Uses multipart/form-data so the audio Blob is streamed efficiently.
 */
export async function createChallenge(data: {
  audio: Blob;
  waveformData: number[];
  songTitle: string;
  songArtist: string;
  durationSeconds: number;
  creatorAlias?: string;
}): Promise<CreateChallengeResponse> {
  const form = new FormData();
  form.append('audio', data.audio, 'recording.webm');
  form.append('waveformData', JSON.stringify(data.waveformData));
  form.append('songTitle', data.songTitle);
  form.append('songArtist', data.songArtist);
  form.append('durationSeconds', String(data.durationSeconds));
  if (data.creatorAlias !== undefined) {
    form.append('creatorAlias', data.creatorAlias);
  }

  // Do NOT set Content-Type — the browser must add the boundary for multipart.
  return fetchJson<CreateChallengeResponse>(`${API_BASE}/api/challenges`, {
    method: 'POST',
    body: form,
  });
}

/** Fetch a challenge by ID. The song answer is NOT included in this response. */
export async function getChallenge(id: string): Promise<ChallengeResponse> {
  return fetchJson<ChallengeResponse>(`${API_BASE}/api/challenges/${encodeURIComponent(id)}`);
}

/**
 * Submit a song title guess for a challenge.
 *
 * @param challengeId - The challenge being guessed.
 * @param guess       - The player's guess (song title string).
 * @param sessionId   - Stable per-player session identifier for this challenge.
 */
export async function submitGuess(
  challengeId: string,
  guess: string,
  sessionId: string,
): Promise<GuessResponse> {
  return fetchJson<GuessResponse>(
    `${API_BASE}/api/challenges/${encodeURIComponent(challengeId)}/guess`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guess, sessionId }),
    },
  );
}

/**
 * Retrieve the final result for a completed challenge session.
 * Returns completion status, song reveal, and share text.
 */
export async function getChallengeResult(
  challengeId: string,
  sessionId: string,
): Promise<ChallengeResultResponse> {
  const params = new URLSearchParams({ sessionId });
  return fetchJson<ChallengeResultResponse>(
    `${API_BASE}/api/challenges/${encodeURIComponent(challengeId)}/result?${params.toString()}`,
  );
}

/** Verify that the API server is reachable and healthy. */
export async function healthCheck(): Promise<{ status: string }> {
  return fetchJson<{ status: string }>(`${API_BASE}/health`);
}
