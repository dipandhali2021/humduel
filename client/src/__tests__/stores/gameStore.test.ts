import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '@/stores/gameStore';
import type { Challenge } from '@/types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockChallenge: Challenge = {
  id: 'challenge-1',
  creatorName: 'Alice',
  audioUrl: 'https://example.com/audio.webm',
  waveformData: [0.1, 0.5, 0.9],
  songAnswer: {
    id: 'song-42',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
  },
  createdAt: '2026-04-04T10:00:00.000Z',
  expiresAt: '2026-04-05T10:00:00.000Z',
};

// Reset the store before every test to ensure full isolation.
beforeEach(() => {
  useGameStore.getState().reset();
});

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('gameStore — initial state', () => {
  it('has currentChallenge set to null', () => {
    expect(useGameStore.getState().currentChallenge).toBeNull();
  });

  it('has guesses as an empty array', () => {
    expect(useGameStore.getState().guesses).toEqual([]);
  });

  it('has isComplete set to false', () => {
    expect(useGameStore.getState().isComplete).toBe(false);
  });

  it('has isCorrect set to false', () => {
    expect(useGameStore.getState().isCorrect).toBe(false);
  });

  it('has startTime set to null', () => {
    expect(useGameStore.getState().startTime).toBeNull();
  });

  it('has elapsedMs set to 0', () => {
    expect(useGameStore.getState().elapsedMs).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// setChallenge
// ---------------------------------------------------------------------------

describe('gameStore — setChallenge', () => {
  it('stores the challenge in currentChallenge', () => {
    useGameStore.getState().setChallenge(mockChallenge);
    expect(useGameStore.getState().currentChallenge).toEqual(mockChallenge);
  });

  it('resets guesses to an empty array', () => {
    useGameStore.getState().addGuess('Wrong Song');
    useGameStore.getState().setChallenge(mockChallenge);
    expect(useGameStore.getState().guesses).toEqual([]);
  });

  it('resets isComplete to false', () => {
    useGameStore.getState().setComplete(true, 5000);
    useGameStore.getState().setChallenge(mockChallenge);
    expect(useGameStore.getState().isComplete).toBe(false);
  });

  it('resets isCorrect to false', () => {
    useGameStore.getState().setComplete(true, 5000);
    useGameStore.getState().setChallenge(mockChallenge);
    expect(useGameStore.getState().isCorrect).toBe(false);
  });

  it('records a startTime (non-null number)', () => {
    useGameStore.getState().setChallenge(mockChallenge);
    const { startTime } = useGameStore.getState();
    expect(startTime).not.toBeNull();
    expect(typeof startTime).toBe('number');
  });

  it('resets elapsedMs to 0', () => {
    useGameStore.getState().setComplete(false, 8000);
    useGameStore.getState().setChallenge(mockChallenge);
    expect(useGameStore.getState().elapsedMs).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// addGuess
// ---------------------------------------------------------------------------

describe('gameStore — addGuess', () => {
  it('appends a single guess to the guesses array', () => {
    useGameStore.getState().addGuess('Stairway to Heaven');
    expect(useGameStore.getState().guesses).toEqual(['Stairway to Heaven']);
  });

  it('appends multiple guesses in submission order', () => {
    useGameStore.getState().addGuess('First Guess');
    useGameStore.getState().addGuess('Second Guess');
    useGameStore.getState().addGuess('Third Guess');
    expect(useGameStore.getState().guesses).toEqual([
      'First Guess',
      'Second Guess',
      'Third Guess',
    ]);
  });

  it('does not mutate the previous guesses array reference (immutable update)', () => {
    useGameStore.getState().addGuess('First Guess');
    const ref1 = useGameStore.getState().guesses;

    useGameStore.getState().addGuess('Second Guess');
    const ref2 = useGameStore.getState().guesses;

    expect(ref1).not.toBe(ref2);
    expect(ref1).toHaveLength(1);
    expect(ref2).toHaveLength(2);
  });

  it('does not affect other state fields', () => {
    useGameStore.getState().addGuess('Some Song');
    expect(useGameStore.getState().isComplete).toBe(false);
    expect(useGameStore.getState().currentChallenge).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// setComplete
// ---------------------------------------------------------------------------

describe('gameStore — setComplete', () => {
  it('sets isComplete to true', () => {
    useGameStore.getState().setComplete(true, 3000);
    expect(useGameStore.getState().isComplete).toBe(true);
  });

  it('sets isCorrect to true when correct is true', () => {
    useGameStore.getState().setComplete(true, 3000);
    expect(useGameStore.getState().isCorrect).toBe(true);
  });

  it('sets isCorrect to false when correct is false', () => {
    useGameStore.getState().setComplete(false, 3000);
    expect(useGameStore.getState().isCorrect).toBe(false);
  });

  it('records the provided elapsedMs', () => {
    useGameStore.getState().setComplete(true, 7500);
    expect(useGameStore.getState().elapsedMs).toBe(7500);
  });

  it('does not clear existing guesses', () => {
    useGameStore.getState().addGuess('My Guess');
    useGameStore.getState().setComplete(true, 2000);
    expect(useGameStore.getState().guesses).toEqual(['My Guess']);
  });

  it('does not clear currentChallenge', () => {
    useGameStore.getState().setChallenge(mockChallenge);
    useGameStore.getState().setComplete(false, 12000);
    expect(useGameStore.getState().currentChallenge).toEqual(mockChallenge);
  });
});

// ---------------------------------------------------------------------------
// reset
// ---------------------------------------------------------------------------

describe('gameStore — reset', () => {
  it('clears currentChallenge back to null', () => {
    useGameStore.getState().setChallenge(mockChallenge);
    useGameStore.getState().reset();
    expect(useGameStore.getState().currentChallenge).toBeNull();
  });

  it('clears guesses back to an empty array', () => {
    useGameStore.getState().addGuess('Song A');
    useGameStore.getState().addGuess('Song B');
    useGameStore.getState().reset();
    expect(useGameStore.getState().guesses).toEqual([]);
  });

  it('sets isComplete back to false', () => {
    useGameStore.getState().setComplete(true, 4000);
    useGameStore.getState().reset();
    expect(useGameStore.getState().isComplete).toBe(false);
  });

  it('sets isCorrect back to false', () => {
    useGameStore.getState().setComplete(true, 4000);
    useGameStore.getState().reset();
    expect(useGameStore.getState().isCorrect).toBe(false);
  });

  it('sets startTime back to null', () => {
    useGameStore.getState().setChallenge(mockChallenge);
    useGameStore.getState().reset();
    expect(useGameStore.getState().startTime).toBeNull();
  });

  it('sets elapsedMs back to 0', () => {
    useGameStore.getState().setComplete(true, 9999);
    useGameStore.getState().reset();
    expect(useGameStore.getState().elapsedMs).toBe(0);
  });

  it('resets all fields simultaneously', () => {
    useGameStore.getState().setChallenge(mockChallenge);
    useGameStore.getState().addGuess('Guess 1');
    useGameStore.getState().setComplete(true, 6000);
    useGameStore.getState().reset();

    const state = useGameStore.getState();
    expect(state.currentChallenge).toBeNull();
    expect(state.guesses).toEqual([]);
    expect(state.isComplete).toBe(false);
    expect(state.isCorrect).toBe(false);
    expect(state.startTime).toBeNull();
    expect(state.elapsedMs).toBe(0);
  });
});
