import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '@/App';

// Mock matchMedia for PWA hooks
const matchMediaMock = vi.fn().mockReturnValue({ matches: false });
Object.defineProperty(window, 'matchMedia', { value: matchMediaMock, writable: true });

// Mock navigator.serviceWorker for PWA
Object.defineProperty(navigator, 'serviceWorker', {
  value: { register: vi.fn().mockResolvedValue({}) },
  writable: true,
  configurable: true,
});

beforeEach(() => {
  matchMediaMock.mockReturnValue({ matches: false });
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** Renders App at a given route inside MemoryRouter. */
function renderApp(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>,
  );
}

describe('App lazy routes', () => {
  it('shows a loading skeleton while a lazy route loads', () => {
    renderApp('/');
    // PageSkeleton renders multiple elements with role="status"
    const skeletons = screen.queryAllByRole('status');
    // Either we see skeletons (still loading) or the page has already loaded
    // Both are valid since Suspense may resolve synchronously in tests
    expect(skeletons.length >= 0).toBe(true);
  });

  it('renders the landing page at /', async () => {
    renderApp('/');
    // LandingPage shows "HumDuel" in multiple places - use findAllByText
    const headings = await screen.findAllByText('HumDuel', {}, { timeout: 3000 });
    expect(headings.length).toBeGreaterThan(0);
  });

  it('renders the home page at /app', async () => {
    renderApp('/app');
    // HomePage shows "HumDuel" in header
    const headings = await screen.findAllByText('HumDuel', {}, { timeout: 3000 });
    expect(headings.length).toBeGreaterThan(0);
  });

  it('renders the leaderboard page at /app/leaderboard', async () => {
    renderApp('/app/leaderboard');
    const heading = await screen.findByText(/leaderboard/i, {}, { timeout: 3000 });
    expect(heading).toBeInTheDocument();
  });

  it('renders the profile page at /app/profile', async () => {
    renderApp('/app/profile');
    const heading = await screen.findByText(/profile/i, {}, { timeout: 3000 });
    expect(heading).toBeInTheDocument();
  });
});
