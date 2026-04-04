import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button — rendering', () => {
  it('renders its children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('renders a text string passed as children', () => {
    render(<Button>Submit</Button>);
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });
});

describe('Button — variant classes', () => {
  it('applies primary variant classes by default', () => {
    render(<Button>Primary</Button>);
    const btn = screen.getByRole('button');
    // Primary variant uses bg-primary and text-white
    expect(btn.className).toContain('bg-primary');
    expect(btn.className).toContain('text-white');
  });

  it('applies primary variant classes when variant="primary" is explicit', () => {
    render(<Button variant="primary">Primary</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-primary');
  });

  it('applies secondary variant classes when variant="secondary"', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const btn = screen.getByRole('button');
    // Secondary variant uses border and text-primary (not bg-primary fill)
    expect(btn.className).toContain('border');
    expect(btn.className).toContain('text-primary');
  });

  it('applies danger variant classes when variant="danger"', () => {
    render(<Button variant="danger">Delete</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-error');
  });

  it('applies ghost variant classes when variant="ghost"', () => {
    render(<Button variant="ghost">Ghost</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('text-on-surface-muted');
  });
});

describe('Button — click handler', () => {
  it('calls the onClick handler when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not throw when clicked without an onClick prop', () => {
    render(<Button>No handler</Button>);
    expect(() => fireEvent.click(screen.getByRole('button'))).not.toThrow();
  });
});

describe('Button — isLoading', () => {
  it('shows a spinner SVG when isLoading=true', () => {
    render(<Button isLoading>Saving</Button>);
    // The Spinner renders an SVG with aria-hidden="true"
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('does not render a spinner when isLoading is false (default)', () => {
    render(<Button>No spinner</Button>);
    expect(document.querySelector('svg')).not.toBeInTheDocument();
  });

  it('is disabled when isLoading=true', () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is not disabled by default', () => {
    render(<Button>Enabled</Button>);
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('still renders children alongside the spinner', () => {
    render(<Button isLoading>Saving...</Button>);
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });
});

describe('Button — disabled prop', () => {
  it('is disabled when the disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

describe('Button — extra className', () => {
  it('merges a custom className into the button element', () => {
    render(<Button className="my-custom-class">Styled</Button>);
    expect(screen.getByRole('button').className).toContain('my-custom-class');
  });
});
