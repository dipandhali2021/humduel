interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'active';
  onClick?: () => void;
}

const variantClasses: Record<NonNullable<CardProps['variant']>, string> = {
  default: 'bg-surface-elevated rounded-xl p-4',
  elevated: 'bg-surface-elevated rounded-xl p-4 shadow-lg',
  active: 'bg-surface-elevated rounded-xl p-4 ring-2 ring-primary',
};

const Card = ({ children, className = '', variant = 'default', onClick }: CardProps) => {
  const interactiveClasses = onClick
    ? 'cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all duration-150 active:scale-[0.98]'
    : '';

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={[variantClasses[variant], interactiveClasses, className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
};

export default Card;
