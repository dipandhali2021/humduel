import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OfflineBanner } from '@/components/OfflineBanner';
import * as useOnlineStatusModule from '@/hooks/useOnlineStatus';

vi.mock('@/hooks/useOnlineStatus');

const mockUseOnlineStatus = vi.mocked(useOnlineStatusModule.useOnlineStatus);

describe('OfflineBanner', () => {
  beforeEach(() => {
    mockUseOnlineStatus.mockReturnValue(true);
  });

  it('renders nothing when online', () => {
    const { container } = render(<OfflineBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the offline alert when offline', () => {
    mockUseOnlineStatus.mockReturnValue(false);
    render(<OfflineBanner />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/You're offline/)).toBeInTheDocument();
  });

  it('has the correct alert role for accessibility', () => {
    mockUseOnlineStatus.mockReturnValue(false);
    render(<OfflineBanner />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
