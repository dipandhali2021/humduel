import { create } from 'zustand';
import type { Challenge } from '@/types';

export interface GameState {
  /** The challenge currently being played. Null until a challenge is loaded. */
  currentChallenge: Challenge | null;
  /**
   * Song title strings submitted by the player (most recent last).
   * Each entry represents one guess attempt.
   */
  guesses: string[];
  /** True once the round ends (correct answer or max attempts reached). */
  isComplete: boolean;
  /** True if the player guessed correctly. Meaningful only when isComplete. */
  isCorrect: boolean;
  /** Epoch ms when the player first interacted with the challenge. */
  startTime: number | null;
  /** Total elapsed ms from startTime to completion. 0 while in progress. */
  elapsedMs: number;

  // ---- Actions -------------------------------------------------------

  /** Load (or replace) the active challenge and reset all transient state. */
  setChallenge: (challenge: Challenge) => void;
  /** Record a new guess attempt. */
  addGuess: (songTitle: string) => void;
  /** Mark the round as finished with the outcome and elapsed time. */
  setComplete: (correct: boolean, elapsedMs: number) => void;
  /** Reset to the initial blank state (e.g. when navigating away). */
  reset: () => void;
}

const initialState = {
  currentChallenge: null,
  guesses: [] as string[],
  isComplete: false,
  isCorrect: false,
  startTime: null,
  elapsedMs: 0,
} satisfies Omit<GameState, 'setChallenge' | 'addGuess' | 'setComplete' | 'reset'>;

export const useGameStore = create<GameState>((set) => ({
  ...initialState,

  setChallenge: (challenge) =>
    set({
      currentChallenge: challenge,
      guesses: [],
      isComplete: false,
      isCorrect: false,
      startTime: Date.now(),
      elapsedMs: 0,
    }),

  addGuess: (songTitle) =>
    set((state) => ({
      guesses: [...state.guesses, songTitle],
    })),

  setComplete: (correct, elapsedMs) =>
    set({ isComplete: true, isCorrect: correct, elapsedMs }),

  reset: () => set({ ...initialState }),
}));
