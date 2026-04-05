import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Skeleton, { PageSkeleton } from '@/components/ui/Skeleton';

describe('Skeleton', () => {
  it('renders with default classes', () => {
    render(<Skeleton />);
    const el = screen.getByRole('status');
    expect(el).toBeInTheDocument();
    expect(el.className).toContain('animate-pulse');
    expect(el.className).toContain('rounded-xl');
    expect(el.className).toContain('bg-surface-elevated');
  });

  it('has aria-label for accessibility', () => {
    render(<Skeleton />);
    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
  });

  it('merges custom className', () => {
    render(<Skeleton className="h-8 w-32" />);
    const el = screen.getByRole('status');
    expect(el.className).toContain('h-8');
    expect(el.className).toContain('w-32');
  });

  it('applies inline width and height styles', () => {
    render(<Skeleton width="200px" height="40px" />);
    const el = screen.getByRole('status');
    expect(el.style.width).toBe('200px');
    expect(el.style.height).toBe('40px');
  });
});

describe('PageSkeleton', () => {
  it('renders the full-page skeleton layout', () => {
    render(<PageSkeleton />);
    // Should have multiple skeleton blocks (Loading indicators)
    const skeletons = screen.getAllByRole('status');
    expect(skeletons.length).toBeGreaterThanOrEqual(5);
  });

  it('has the page container structure with correct layout classes', () => {
    const { container } = render(<PageSkeleton />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain('min-h-screen');
    expect(wrapper.className).toContain('bg-surface');
    expect(wrapper.className).toContain('max-w-[480px]');
  });
});
