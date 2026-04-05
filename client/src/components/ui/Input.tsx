import { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

/**
 * Input
 *
 * A styled text input matching the HumDuel dark design system.
 *
 * - Background: bg-surface-elevated
 * - Focus ring: primary (violet)
 * - Error state rendered below the input in tertiary (pink) text
 * - Label rendered above in DM Sans muted style
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = '', ...rest }, ref) => {
    // Generate a stable id for label–input association when none is provided
    const inputId = id ?? (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="font-label text-sm text-on-surface-muted"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            'w-full bg-surface-elevated text-white placeholder-on-surface-muted',
            'px-4 py-3 rounded-xl border border-transparent',
            'font-body text-base',
            'outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
            'transition-all duration-150',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error ? 'ring-2 ring-tertiary' : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...rest}
        />
        {error && (
          <p className="font-label text-sm text-tertiary mt-0.5" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
