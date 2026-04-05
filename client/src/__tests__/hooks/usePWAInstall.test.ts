import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

describe('usePWAInstall', () => {
  let matchMediaMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    matchMediaMock = vi.fn().mockReturnValue({ matches: false });
    Object.defineProperty(window, 'matchMedia', { value: matchMediaMock, writable: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initially reports canInstall as false', () => {
    const { result } = renderHook(() => usePWAInstall());
    expect(result.current.canInstall).toBe(false);
    expect(result.current.isInstalled).toBe(false);
  });

  it('detects standalone mode as installed', () => {
    matchMediaMock.mockReturnValue({ matches: true });
    const { result } = renderHook(() => usePWAInstall());
    expect(result.current.isInstalled).toBe(true);
    expect(result.current.canInstall).toBe(false);
  });

  it('captures beforeinstallprompt and enables canInstall', () => {
    const { result } = renderHook(() => usePWAInstall());

    act(() => {
      const event = new Event('beforeinstallprompt');
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
      window.dispatchEvent(event);
    });

    expect(result.current.canInstall).toBe(true);
  });

  it('calls prompt and resolves accepted on install()', async () => {
    const { result } = renderHook(() => usePWAInstall());

    const promptMock = vi.fn().mockResolvedValue(undefined);
    const userChoiceMock = Promise.resolve({ outcome: 'accepted' as const });

    act(() => {
      const event = new Event('beforeinstallprompt');
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
      Object.defineProperty(event, 'prompt', { value: promptMock });
      Object.defineProperty(event, 'userChoice', { value: userChoiceMock });
      window.dispatchEvent(event);
    });

    let accepted: boolean | undefined;
    await act(async () => {
      accepted = await result.current.install();
    });

    expect(promptMock).toHaveBeenCalled();
    expect(accepted).toBe(true);
    expect(result.current.canInstall).toBe(false);
  });

  it('returns false when install() is called with dismissed outcome', async () => {
    const { result } = renderHook(() => usePWAInstall());

    const promptMock = vi.fn().mockResolvedValue(undefined);
    const userChoiceMock = Promise.resolve({ outcome: 'dismissed' as const });

    act(() => {
      const event = new Event('beforeinstallprompt');
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
      Object.defineProperty(event, 'prompt', { value: promptMock });
      Object.defineProperty(event, 'userChoice', { value: userChoiceMock });
      window.dispatchEvent(event);
    });

    let accepted: boolean | undefined;
    await act(async () => {
      accepted = await result.current.install();
    });

    expect(accepted).toBe(false);
  });

  it('returns false when install() is called without a deferred prompt', async () => {
    const { result } = renderHook(() => usePWAInstall());

    let accepted: boolean | undefined;
    await act(async () => {
      accepted = await result.current.install();
    });

    expect(accepted).toBe(false);
  });

  it('clears the prompt on dismiss()', () => {
    const { result } = renderHook(() => usePWAInstall());

    act(() => {
      const event = new Event('beforeinstallprompt');
      Object.defineProperty(event, 'preventDefault', { value: vi.fn() });
      window.dispatchEvent(event);
    });

    expect(result.current.canInstall).toBe(true);

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.canInstall).toBe(false);
  });

  it('sets isInstalled when appinstalled fires', () => {
    const { result } = renderHook(() => usePWAInstall());

    act(() => {
      window.dispatchEvent(new Event('appinstalled'));
    });

    expect(result.current.isInstalled).toBe(true);
    expect(result.current.canInstall).toBe(false);
  });

  it('cleans up event listeners on unmount', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => usePWAInstall());

    const addedListeners = addSpy.mock.calls.map((c) => c[0]);
    expect(addedListeners).toContain('beforeinstallprompt');
    expect(addedListeners).toContain('appinstalled');

    unmount();

    const removedListeners = removeSpy.mock.calls.map((c) => c[0]);
    expect(removedListeners).toContain('beforeinstallprompt');
    expect(removedListeners).toContain('appinstalled');
  });
});
