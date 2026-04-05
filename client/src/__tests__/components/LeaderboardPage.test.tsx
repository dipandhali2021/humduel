import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { LeaderboardResponse, LeaderboardEntryResponse } from '@/types';

// ---------------------------------------------------------------------------
// Mock @/lib/api
// ---------------------------------------------------------------------------

vi.mock('@/lib/api', () => ({
  getLeaderboard: vi.fn(),
}));

import { getLeaderboard } from '@/lib/api';
import LeaderboardPage from '@/pages/LeaderboardPage';

const mockGetLeaderboard = vi.mocked(getLeaderboard);

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const USER_ID_KEY = 'humduel:userId';

const alice: LeaderboardEntryResponse = {
  rank: 1,
  nickname: 'AliceRocks',
  userId: 'user-alice',
  attemptsUsed: 1,
  timeTakenSeconds: 12,
  completedAt: '2026-04-05T10:00:00Z',
};

const bob: LeaderboardEntryResponse = {
  rank: 2,
  nickname: 'BobTunes',
  userId: 'user-bob',
  attemptsUsed: 2,
  timeTakenSeconds: 45,
  completedAt: '2026-04-05T10:05:00Z',
};

const charlie: LeaderboardEntryResponse = {
  rank: 3,
  nickname: 'CharlieBeats',
  userId: 'user-charlie',
  attemptsUsed: 3,
  timeTakenSeconds: 78,
  completedAt: '2026-04-05T10:10:00Z',
};

const baseLeaderboard: LeaderboardResponse = {
  date: '2026-04-05',
  puzzleNumber: 42,
  entries: [alice, bob, charlie],
};

const emptyLeaderboard: LeaderboardResponse = {
  date: '2026-04-05',
  puzzleNumber: 42,
  entries: [],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderPage() {
  return render(
    <MemoryRouter>
      <LeaderboardPage />
    </MemoryRouter>,
  );
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  localStorage.clear();
  mockGetLeaderboard.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------

describe('LeaderboardPage — loading state', () => {
  it('shows a loading skeleton while data is being fetched', () => {
    mockGetLeaderboard.mockReturnValue(new Promise(() => {})); // never resolves
    renderPage();
    // The skeleton uses animate-pulse; presence of it means loading
    const { container } = renderPage();
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('does not show leaderboard entries during loading', () => {
    mockGetLeaderboard.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.queryByText('AliceRocks')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Rendering leaderboard entries
// ---------------------------------------------------------------------------

describe('LeaderboardPage — rendering entries', () => {
  it('renders all leaderboard entries after loading', async () => {
    mockGetLeaderboard.mockResolvedValue(baseLeaderboard);
    renderPage();

    await waitFor(() => expect(screen.getAllByText('AliceRocks').length).toBeGreaterThan(0));
    expect(screen.getAllByText('BobTunes').length).toBeGreaterThan(0);
    expect(screen.getAllByText('CharlieBeats').length).toBeGreaterThan(0);
  });

  it('renders the puzzle number badge', async () => {
    mockGetLeaderboard.mockResolvedValue(baseLeaderboard);
    renderPage();

    await waitFor(() => expect(screen.getByText(/daily #42/i)).toBeInTheDocument());
  });

  it('shows Rankings section heading', async () => {
    mockGetLeaderboard.mockResolvedValue(baseLeaderboard);
    renderPage();

    await waitFor(() => expect(screen.getByText(/rankings/i)).toBeInTheDocument());
  });

  it('shows player count footer note', async () => {
    mockGetLeaderboard.mockResolvedValue(baseLeaderboard);
    renderPage();

    await waitFor(() =>
      expect(screen.getByText(/3 players completed today's puzzle/i)).toBeInTheDocument(),
    );
  });

  it('shows singular "player" for exactly 1 entry', async () => {
    const singleEntry: LeaderboardResponse = {
      ...baseLeaderboard,
      entries: [alice],
    };
    mockGetLeaderboard.mockResolvedValue(singleEntry);
    renderPage();

    await waitFor(() =>
      expect(screen.getByText(/1 player completed today's puzzle/i)).toBeInTheDocument(),
    );
  });

  it('renders the podium section for top 3', async () => {
    mockGetLeaderboard.mockResolvedValue(baseLeaderboard);
    renderPage();

    await waitFor(() =>
      expect(screen.getByRole('region', { name: /top players podium/i })).toBeInTheDocument(),
    );
  });
});

// ---------------------------------------------------------------------------
// Highlighting current user
// ---------------------------------------------------------------------------

describe('LeaderboardPage — current user highlight', () => {
  it('marks the current user row with "(you)" label', async () => {
    localStorage.setItem(USER_ID_KEY, 'user-bob');
    mockGetLeaderboard.mockResolvedValue(baseLeaderboard);
    renderPage();

    await waitFor(() => expect(screen.getByText('(you)')).toBeInTheDocument());
  });

  it('does not show "(you)" label when user is not on the leaderboard', async () => {
    localStorage.setItem(USER_ID_KEY, 'user-outsider');
    mockGetLeaderboard.mockResolvedValue(baseLeaderboard);
    renderPage();

    await waitFor(() =>
      expect(screen.getAllByText('AliceRocks').length).toBeGreaterThan(0),
    );
    expect(screen.queryByText('(you)')).not.toBeInTheDocument();
  });

  it('does not show "(you)" label when no user is logged in', async () => {
    // No userId in localStorage
    mockGetLeaderboard.mockResolvedValue(baseLeaderboard);
    renderPage();

    await waitFor(() =>
      expect(screen.getAllByText('AliceRocks').length).toBeGreaterThan(0),
    );
    expect(screen.queryByText('(you)')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

describe('LeaderboardPage — empty state', () => {
  it('shows empty state message when there are no entries', async () => {
    mockGetLeaderboard.mockResolvedValue(emptyLeaderboard);
    renderPage();

    await waitFor(() =>
      expect(screen.getByText(/no completions yet/i)).toBeInTheDocument(),
    );
  });

  it('does not render the podium when entries are empty', async () => {
    mockGetLeaderboard.mockResolvedValue(emptyLeaderboard);
    renderPage();

    await waitFor(() =>
      expect(screen.getByText(/no completions yet/i)).toBeInTheDocument(),
    );
    expect(screen.queryByRole('region', { name: /top players podium/i })).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

describe('LeaderboardPage — error state', () => {
  it('shows error message when the API call fails', async () => {
    mockGetLeaderboard.mockRejectedValue(new Error('Server unavailable'));
    renderPage();

    await waitFor(() =>
      expect(screen.getByText(/could not load leaderboard/i)).toBeInTheDocument(),
    );
    expect(screen.getByText('Server unavailable')).toBeInTheDocument();
  });

  it('shows a retry button on error', async () => {
    mockGetLeaderboard.mockRejectedValue(new Error('Timeout'));
    renderPage();

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument(),
    );
  });

  it('re-fetches data when retry is clicked', async () => {
    mockGetLeaderboard
      .mockRejectedValueOnce(new Error('Timeout'))
      .mockResolvedValueOnce(baseLeaderboard);

    renderPage();

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    await waitFor(() =>
      expect(screen.getAllByText('AliceRocks').length).toBeGreaterThan(0),
    );
    expect(mockGetLeaderboard).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// Date navigation
// ---------------------------------------------------------------------------

describe('LeaderboardPage — date navigation', () => {
  it('renders the "Previous day" and "Next day" navigation buttons', async () => {
    mockGetLeaderboard.mockResolvedValue(baseLeaderboard);
    renderPage();

    expect(screen.getByRole('button', { name: /previous day/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next day/i })).toBeInTheDocument();
  });

  it('disables the "Next day" button when already on today', async () => {
    mockGetLeaderboard.mockResolvedValue(baseLeaderboard);
    renderPage();

    // The component initialises with today's date, so "next" should be disabled.
    const nextBtn = screen.getByRole('button', { name: /next day/i });
    expect(nextBtn).toBeDisabled();
  });

  it('fetches data for the previous day when "Previous day" is clicked', async () => {
    mockGetLeaderboard.mockResolvedValue(baseLeaderboard);
    renderPage();

    await waitFor(() => expect(mockGetLeaderboard).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: /previous day/i }));

    await waitFor(() => expect(mockGetLeaderboard).toHaveBeenCalledTimes(2));

    // The second call should be for an earlier date (ISO strings are lexicographically ordered)
    const firstCallArg = mockGetLeaderboard.mock.calls[0]?.[0] as string;
    const secondCallArg = mockGetLeaderboard.mock.calls[1]?.[0] as string;
    expect(secondCallArg < firstCallArg).toBe(true);
  });

  it('enables "Next day" after navigating to a past day', async () => {
    mockGetLeaderboard.mockResolvedValue(baseLeaderboard);
    renderPage();

    await waitFor(() => expect(mockGetLeaderboard).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: /previous day/i }));

    await waitFor(() => {
      const nextBtn = screen.getByRole('button', { name: /next day/i });
      expect(nextBtn).not.toBeDisabled();
    });
  });

  it('shows the formatted date in the navigation bar', async () => {
    mockGetLeaderboard.mockResolvedValue(baseLeaderboard);
    renderPage();

    await waitFor(() => expect(mockGetLeaderboard).toHaveBeenCalledTimes(1));

    // Today's date formatted — just verify something date-like is visible
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    // The formatted date for today should appear somewhere in the page
    const today = new Date();
    const year = today.getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });
});
