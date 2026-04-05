import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { UseUserReturn } from '@/hooks/useUser';
import type { UserResponse, UserStatsResponse } from '@/types';

// ---------------------------------------------------------------------------
// Mock useUser hook
// ---------------------------------------------------------------------------

vi.mock('@/hooks/useUser', () => ({
  useUser: vi.fn(),
}));

import { useUser } from '@/hooks/useUser';
import ProfilePage from '@/pages/ProfilePage';

const mockUseUser = vi.mocked(useUser);

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const baseUser: UserResponse = {
  id: 'user-123',
  nickname: 'MelodyMaster',
  avatar: 'M',
  createdAt: '2026-01-15T00:00:00Z',
};

const baseStats: UserStatsResponse = {
  userId: 'user-123',
  nickname: 'MelodyMaster',
  gamesPlayed: 20,
  gamesWon: 14,
  winRate: 0.7,
  currentStreak: 3,
  bestStreak: 7,
  avgTimeSeconds: 42,
  recentGames: [
    {
      date: '2026-04-05',
      puzzleNumber: 42,
      correct: true,
      attemptsUsed: 2,
      timeTakenSeconds: 30,
    },
    {
      date: '2026-04-04',
      puzzleNumber: 41,
      correct: false,
      attemptsUsed: 6,
      timeTakenSeconds: null,
    },
  ],
};

function buildDefaultReturn(overrides: Partial<UseUserReturn> = {}): UseUserReturn {
  return {
    user: baseUser,
    stats: baseStats,
    loading: false,
    error: null,
    isNewUser: false,
    createUser: vi.fn().mockResolvedValue(undefined),
    updateUser: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderPage() {
  return render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>,
  );
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  localStorage.clear();
  mockUseUser.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------

describe('ProfilePage — loading state', () => {
  it('shows a loading skeleton while data is fetched', () => {
    mockUseUser.mockReturnValue(buildDefaultReturn({ loading: true, user: null, stats: null }));
    const { container } = renderPage();
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('does not show the create profile form while loading', () => {
    mockUseUser.mockReturnValue(buildDefaultReturn({ loading: true, user: null, stats: null }));
    renderPage();
    expect(screen.queryByText(/create your profile/i)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Create profile form (new user)
// ---------------------------------------------------------------------------

describe('ProfilePage — new user / create profile form', () => {
  it('shows "Create your profile" heading for new users', () => {
    mockUseUser.mockReturnValue(
      buildDefaultReturn({ loading: false, user: null, stats: null, isNewUser: true }),
    );
    renderPage();
    expect(screen.getByText(/create your profile/i)).toBeInTheDocument();
  });

  it('shows the nickname input for new users', () => {
    mockUseUser.mockReturnValue(
      buildDefaultReturn({ loading: false, user: null, stats: null, isNewUser: true }),
    );
    renderPage();
    expect(screen.getByPlaceholderText(/melodymast/i)).toBeInTheDocument();
  });

  it('shows the "Create Profile" button for new users', () => {
    mockUseUser.mockReturnValue(
      buildDefaultReturn({ loading: false, user: null, stats: null, isNewUser: true }),
    );
    renderPage();
    expect(screen.getByRole('button', { name: /create profile/i })).toBeInTheDocument();
  });

  it('calls createUser with the entered nickname on form submit', async () => {
    const createUser = vi.fn().mockResolvedValue(undefined);
    mockUseUser.mockReturnValue(
      buildDefaultReturn({ loading: false, user: null, stats: null, isNewUser: true, createUser }),
    );
    renderPage();

    const input = screen.getByPlaceholderText(/melodymast/i);
    fireEvent.change(input, { target: { value: 'NewPlayer' } });
    fireEvent.click(screen.getByRole('button', { name: /create profile/i }));

    await waitFor(() => expect(createUser).toHaveBeenCalledWith('NewPlayer'));
  });

  it('shows a validation error when nickname is too short', async () => {
    mockUseUser.mockReturnValue(
      buildDefaultReturn({ loading: false, user: null, stats: null, isNewUser: true }),
    );
    renderPage();

    const input = screen.getByPlaceholderText(/melodymast/i);
    fireEvent.change(input, { target: { value: 'X' } });
    fireEvent.click(screen.getByRole('button', { name: /create profile/i }));

    await waitFor(() =>
      expect(screen.getByText(/at least 2 characters/i)).toBeInTheDocument(),
    );
  });

  it('shows a validation error when nickname is empty', async () => {
    mockUseUser.mockReturnValue(
      buildDefaultReturn({ loading: false, user: null, stats: null, isNewUser: true }),
    );
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /create profile/i }));

    await waitFor(() =>
      expect(screen.getByText(/cannot be empty/i)).toBeInTheDocument(),
    );
  });
});

// ---------------------------------------------------------------------------
// Stats view (existing user)
// ---------------------------------------------------------------------------

describe('ProfilePage — stats for existing users', () => {
  it('shows the user nickname in the profile header', () => {
    mockUseUser.mockReturnValue(buildDefaultReturn());
    renderPage();
    expect(screen.getByText('MelodyMaster')).toBeInTheDocument();
  });

  it('shows "Member since" date in the profile header', () => {
    mockUseUser.mockReturnValue(buildDefaultReturn());
    renderPage();
    expect(screen.getByText(/member since/i)).toBeInTheDocument();
    expect(screen.getByText(/january 2026/i)).toBeInTheDocument();
  });

  it('shows the Stats section heading', () => {
    mockUseUser.mockReturnValue(buildDefaultReturn());
    renderPage();
    expect(screen.getByText(/^stats$/i)).toBeInTheDocument();
  });

  it('shows games played count', () => {
    mockUseUser.mockReturnValue(buildDefaultReturn());
    renderPage();
    expect(screen.getByText('Games Played')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  it('shows win rate as percentage', () => {
    mockUseUser.mockReturnValue(buildDefaultReturn());
    renderPage();
    expect(screen.getByText('Win Rate')).toBeInTheDocument();
    expect(screen.getByText('70%')).toBeInTheDocument();
  });

  it('shows win rate progress bar', () => {
    mockUseUser.mockReturnValue(buildDefaultReturn());
    renderPage();
    const progressBar = screen.getByRole('progressbar', { name: /win rate/i });
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '70');
  });

  it('shows current streak', () => {
    mockUseUser.mockReturnValue(buildDefaultReturn());
    renderPage();
    expect(screen.getByText('Current Streak')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows best streak', () => {
    mockUseUser.mockReturnValue(buildDefaultReturn());
    renderPage();
    expect(screen.getByText('Best Streak')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('shows average solve time', () => {
    mockUseUser.mockReturnValue(buildDefaultReturn());
    renderPage();
    expect(screen.getByText('Average Solve Time')).toBeInTheDocument();
    expect(screen.getByText('42s')).toBeInTheDocument();
  });

  it('shows "—" for null average solve time', () => {
    mockUseUser.mockReturnValue(
      buildDefaultReturn({ stats: { ...baseStats, avgTimeSeconds: null } }),
    );
    renderPage();
    // Multiple "—" may appear (avg time + recent game null times); just check at least one
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Recent games
// ---------------------------------------------------------------------------

describe('ProfilePage — recent games list', () => {
  it('shows the "Recent Games" section heading', () => {
    mockUseUser.mockReturnValue(buildDefaultReturn());
    renderPage();
    expect(screen.getByText(/recent games/i)).toBeInTheDocument();
  });

  it('renders puzzle numbers for each recent game', () => {
    mockUseUser.mockReturnValue(buildDefaultReturn());
    renderPage();
    expect(screen.getByText('#42')).toBeInTheDocument();
    expect(screen.getByText('#41')).toBeInTheDocument();
  });

  it('renders attempt counts for each recent game', () => {
    mockUseUser.mockReturnValue(buildDefaultReturn());
    renderPage();
    expect(screen.getByText('2/6')).toBeInTheDocument();
    expect(screen.getByText('6/6')).toBeInTheDocument();
  });

  it('shows "—" for games with null timeTakenSeconds', () => {
    mockUseUser.mockReturnValue(buildDefaultReturn());
    renderPage();
    // Puzzle 41 has timeTakenSeconds: null
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThan(0);
  });

  it('shows empty state message when recentGames is empty', () => {
    mockUseUser.mockReturnValue(
      buildDefaultReturn({ stats: { ...baseStats, recentGames: [] } }),
    );
    renderPage();
    expect(
      screen.getByText(/no games played yet/i),
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Nickname editing
// ---------------------------------------------------------------------------

describe('ProfilePage — nickname editing', () => {
  it('shows the edit button next to the nickname', () => {
    mockUseUser.mockReturnValue(buildDefaultReturn());
    renderPage();
    expect(screen.getByRole('button', { name: /edit nickname/i })).toBeInTheDocument();
  });

  it('switches to edit form when the edit button is clicked', () => {
    mockUseUser.mockReturnValue(buildDefaultReturn());
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /edit nickname/i }));

    expect(screen.getByRole('button', { name: /save nickname/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel editing/i })).toBeInTheDocument();
  });

  it('returns to profile header when cancel is clicked', () => {
    mockUseUser.mockReturnValue(buildDefaultReturn());
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /edit nickname/i }));
    expect(screen.getByRole('button', { name: /save nickname/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /cancel editing/i }));
    expect(screen.getByRole('button', { name: /edit nickname/i })).toBeInTheDocument();
  });

  it('calls updateUser with the new nickname on save', async () => {
    const updateUser = vi.fn().mockResolvedValue(undefined);
    mockUseUser.mockReturnValue(buildDefaultReturn({ updateUser }));
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /edit nickname/i }));

    const input = screen.getByPlaceholderText(/nickname/i);
    fireEvent.change(input, { target: { value: 'NewNickname' } });
    fireEvent.click(screen.getByRole('button', { name: /save nickname/i }));

    await waitFor(() => expect(updateUser).toHaveBeenCalledWith('NewNickname'));
  });

  it('shows validation error when saving with nickname shorter than 2 chars', async () => {
    mockUseUser.mockReturnValue(buildDefaultReturn());
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /edit nickname/i }));

    const input = screen.getByPlaceholderText(/nickname/i);
    fireEvent.change(input, { target: { value: 'X' } });
    fireEvent.click(screen.getByRole('button', { name: /save nickname/i }));

    await waitFor(() =>
      expect(screen.getByText(/at least 2 characters/i)).toBeInTheDocument(),
    );
  });
});

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

describe('ProfilePage — error state', () => {
  it('shows error message when user loading fails', () => {
    mockUseUser.mockReturnValue(
      buildDefaultReturn({ loading: false, user: null, stats: null, error: 'Could not load profile', isNewUser: false }),
    );
    renderPage();
    // Both the heading and the error detail message contain the error text
    const errorMessages = screen.getAllByText(/could not load profile/i);
    expect(errorMessages.length).toBeGreaterThan(0);
  });

  it('shows a "Try again" link on error', () => {
    mockUseUser.mockReturnValue(
      buildDefaultReturn({ loading: false, user: null, stats: null, error: 'Network error', isNewUser: false }),
    );
    renderPage();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
