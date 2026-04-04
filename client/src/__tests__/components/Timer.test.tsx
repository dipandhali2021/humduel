import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Timer } from '@/components/ui/Timer';

describe('Timer — formatted time display', () => {
  it('displays the current time in m:ss format', () => {
    render(<Timer seconds={8} maxSeconds={15} isActive={true} />);
    // The main text node renders "0:08"
    expect(screen.getByText('0:08')).toBeInTheDocument();
  });

  it('displays the max time in m:ss format with a leading "/" separator', () => {
    render(<Timer seconds={8} maxSeconds={15} isActive={true} />);
    // The <span> renders "/ 0:15"
    expect(screen.getByText('/ 0:15')).toBeInTheDocument();
  });

  it('displays "0:00" when seconds is 0 and maxSeconds is 15', () => {
    render(<Timer seconds={0} maxSeconds={15} isActive={false} />);
    expect(screen.getByText('0:00')).toBeInTheDocument();
  });

  it('displays "1:05" for 65 seconds', () => {
    render(<Timer seconds={65} maxSeconds={120} isActive={true} />);
    expect(screen.getByText('1:05')).toBeInTheDocument();
  });

  it('displays "2:00" for 120 seconds', () => {
    render(<Timer seconds={120} maxSeconds={120} isActive={true} />);
    expect(screen.getByText('2:00')).toBeInTheDocument();
  });

  it('provides an accessible aria-label containing both formatted times', () => {
    render(<Timer seconds={8} maxSeconds={15} isActive={true} />);
    expect(
      screen.getByLabelText(/recording time: 0:08 of 0:15/i)
    ).toBeInTheDocument();
  });

  it('has aria-live="polite" on the timer container', () => {
    render(<Timer seconds={5} maxSeconds={30} isActive={true} />);
    const container = document.querySelector('[aria-live="polite"]');
    expect(container).toHaveAttribute('aria-live', 'polite');
  });
});

describe('Timer — warning color when approaching max time', () => {
  it('applies warning color class when seconds > 80% of maxSeconds', () => {
    // 13 / 15 ≈ 86.7% > 80%
    render(<Timer seconds={13} maxSeconds={15} isActive={true} />);
    const container = document.querySelector('[aria-live="polite"]');
    expect(container).toHaveClass('text-warning');
  });

  it('applies warning color when seconds equals maxSeconds', () => {
    render(<Timer seconds={15} maxSeconds={15} isActive={true} />);
    const container = document.querySelector('[aria-live="polite"]');
    expect(container).toHaveClass('text-warning');
  });

  it('does not apply warning color when seconds is exactly at 80% of maxSeconds', () => {
    // 12 / 15 = 80% — not strictly greater than 80%, so no warning
    render(<Timer seconds={12} maxSeconds={15} isActive={true} />);
    const container = document.querySelector('[aria-live="polite"]');
    expect(container).not.toHaveClass('text-warning');
    expect(container).toHaveClass('text-on-surface');
  });

  it('does not apply warning color class when well below the threshold', () => {
    render(<Timer seconds={3} maxSeconds={15} isActive={true} />);
    const container = document.querySelector('[aria-live="polite"]');
    expect(container).not.toHaveClass('text-warning');
    expect(container).toHaveClass('text-on-surface');
  });
});

describe('Timer — active / inactive opacity', () => {
  it('has full opacity class when isActive=true', () => {
    render(<Timer seconds={5} maxSeconds={15} isActive={true} />);
    const container = document.querySelector('[aria-live="polite"]');
    expect(container).toHaveClass('opacity-100');
  });

  it('has reduced opacity class when isActive=false', () => {
    render(<Timer seconds={5} maxSeconds={15} isActive={false} />);
    const container = document.querySelector('[aria-live="polite"]');
    expect(container).toHaveClass('opacity-50');
  });
});
