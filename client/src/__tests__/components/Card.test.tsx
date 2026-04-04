import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Card from '@/components/ui/Card';

describe('Card — rendering children', () => {
  it('renders text children', () => {
    render(<Card>Hello Card</Card>);
    expect(screen.getByText('Hello Card')).toBeInTheDocument();
  });

  it('renders nested element children', () => {
    render(
      <Card>
        <span data-testid="inner">Inner content</span>
      </Card>
    );
    expect(screen.getByTestId('inner')).toBeInTheDocument();
  });
});

describe('Card — variants', () => {
  it('applies default variant classes when no variant prop is given', () => {
    render(<Card>Default</Card>);
    const card = screen.getByText('Default');
    // default variant: bg-surface-elevated rounded-xl p-4
    expect(card.className).toContain('bg-surface-elevated');
    expect(card.className).toContain('rounded-xl');
  });

  it('applies elevated variant classes when variant="elevated"', () => {
    render(<Card variant="elevated">Elevated</Card>);
    const card = screen.getByText('Elevated');
    // elevated variant adds shadow-lg
    expect(card.className).toContain('shadow-lg');
    expect(card.className).toContain('bg-surface-elevated');
  });

  it('applies active variant classes when variant="active"', () => {
    render(<Card variant="active">Active</Card>);
    const card = screen.getByText('Active');
    // active variant adds ring-2 ring-primary
    expect(card.className).toContain('ring-2');
    expect(card.className).toContain('ring-primary');
  });
});

describe('Card — onClick / clickable behaviour', () => {
  it('calls the onClick handler when clicked', () => {
    const onClick = vi.fn();
    render(<Card onClick={onClick}>Clickable</Card>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders with role="button" when onClick is provided', () => {
    render(<Card onClick={vi.fn()}>Clickable</Card>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('does not render with role="button" when onClick is omitted', () => {
    render(<Card>Static</Card>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('is focusable (tabIndex=0) when onClick is provided', () => {
    render(<Card onClick={vi.fn()}>Focusable</Card>);
    expect(screen.getByRole('button')).toHaveAttribute('tabIndex', '0');
  });

  it('is not focusable (no tabIndex) when onClick is omitted', () => {
    render(<Card>Not focusable</Card>);
    const div = screen.getByText('Not focusable');
    expect(div).not.toHaveAttribute('tabIndex');
  });
});

describe('Card — keyboard support', () => {
  it('calls onClick when Enter key is pressed', () => {
    const onClick = vi.fn();
    render(<Card onClick={onClick}>Keyboard Enter</Card>);
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('calls onClick when Space key is pressed', () => {
    const onClick = vi.fn();
    render(<Card onClick={onClick}>Keyboard Space</Card>);
    fireEvent.keyDown(screen.getByRole('button'), { key: ' ' });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick for other keys', () => {
    const onClick = vi.fn();
    render(<Card onClick={onClick}>Other key</Card>);
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Tab' });
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Escape' });
    expect(onClick).not.toHaveBeenCalled();
  });

  it('does not attach a keyDown handler when onClick is not provided', () => {
    render(<Card>No handler</Card>);
    const div = screen.getByText('No handler');
    // Firing keyDown should not throw and the element should not have interactive role
    expect(() =>
      fireEvent.keyDown(div, { key: 'Enter' })
    ).not.toThrow();
  });
});

describe('Card — extra className', () => {
  it('merges a custom className', () => {
    render(<Card className="my-extra-class">Styled</Card>);
    expect(screen.getByText('Styled').className).toContain('my-extra-class');
  });
});
