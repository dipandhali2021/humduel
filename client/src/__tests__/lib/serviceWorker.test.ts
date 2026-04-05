import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { registerServiceWorker } from '@/lib/serviceWorker';

describe('registerServiceWorker', () => {
  let originalSW: ServiceWorkerContainer;
  let registerMock: ReturnType<typeof vi.fn>;
  let addEventListenerSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    registerMock = vi.fn().mockResolvedValue({
      addEventListener: vi.fn(),
    });
    addEventListenerSpy = vi.fn();

    // Save original
    originalSW = navigator.serviceWorker;

    // Mock serviceWorker
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        register: registerMock,
        controller: null,
      },
      writable: true,
      configurable: true,
    });

    // Spy on window.addEventListener
    vi.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
      addEventListenerSpy(event, handler);
      if (event === 'load') {
        (handler as EventListener)(new Event('load'));
      }
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: originalSW,
      writable: true,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  it('registers the service worker on load', async () => {
    registerServiceWorker();

    // Wait for the async registration
    await vi.waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith('/sw.js', { scope: '/' });
    });
  });

  it('adds a load event listener to window', () => {
    registerServiceWorker();
    expect(addEventListenerSpy).toHaveBeenCalledWith('load', expect.any(Function));
  });

  it('does nothing when serviceWorker is not supported', () => {
    // Restore any previous mocks
    vi.restoreAllMocks();
    
    // Remove serviceWorker property entirely
    const nav = navigator as unknown as Record<string, unknown>;
    const originalSW = nav.serviceWorker;
    delete nav.serviceWorker;

    // Create a fresh spy for this test
    const localAddEventListenerSpy = vi.fn();
    vi.spyOn(window, 'addEventListener').mockImplementation((...args) => {
      localAddEventListenerSpy(args[0]);
      return window;
    });

    registerServiceWorker();
    expect(localAddEventListenerSpy).not.toHaveBeenCalled();
    
    // Restore
    nav.serviceWorker = originalSW;
  });

  it('handles registration failure gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    registerMock.mockRejectedValue(new Error('Registration failed'));

    registerServiceWorker();

    await vi.waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Service worker registration failed:',
        expect.any(Error)
      );
    });
  });
});
