import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import * as usePWAInstallModule from '@/hooks/usePWAInstall';

vi.mock('@/hooks/usePWAInstall');

const mockUsePWAInstall = vi.mocked(usePWAInstallModule.usePWAInstall);

describe('PWAInstallPrompt', () => {
  const defaultMock = {
    canInstall: false,
    isInstalled: false,
    install: vi.fn().mockResolvedValue(true),
    dismiss: vi.fn(),
  };

  beforeEach(() => {
    mockUsePWAInstall.mockReturnValue({ ...defaultMock });
  });

  it('renders nothing when canInstall is false', () => {
    const { container } = render(<PWAInstallPrompt />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the install prompt when canInstall is true', () => {
    mockUsePWAInstall.mockReturnValue({ ...defaultMock, canInstall: true });
    render(<PWAInstallPrompt />);
    expect(screen.getByText('Install HumDuel')).toBeInTheDocument();
    expect(screen.getByText('Add to your home screen for the best experience')).toBeInTheDocument();
  });

  it('has an accessible banner role', () => {
    mockUsePWAInstall.mockReturnValue({ ...defaultMock, canInstall: true });
    render(<PWAInstallPrompt />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('calls install when the Install button is clicked', () => {
    const install = vi.fn().mockResolvedValue(true);
    mockUsePWAInstall.mockReturnValue({ ...defaultMock, canInstall: true, install });
    render(<PWAInstallPrompt />);
    fireEvent.click(screen.getByText('Install'));
    expect(install).toHaveBeenCalledTimes(1);
  });

  it('calls dismiss when the Not now button is clicked', () => {
    const dismiss = vi.fn();
    mockUsePWAInstall.mockReturnValue({ ...defaultMock, canInstall: true, dismiss });
    render(<PWAInstallPrompt />);
    fireEvent.click(screen.getByText('Not now'));
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it('calls dismiss when the X button is clicked', () => {
    const dismiss = vi.fn();
    mockUsePWAInstall.mockReturnValue({ ...defaultMock, canInstall: true, dismiss });
    render(<PWAInstallPrompt />);
    fireEvent.click(screen.getByLabelText('Dismiss install prompt'));
    expect(dismiss).toHaveBeenCalledTimes(1);
  });
});
