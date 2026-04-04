interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

const PageContainer = ({ children, className = '', noPadding = false }: PageContainerProps) => {
  return (
    <div
      className={[
        'min-h-screen bg-surface',
        noPadding ? '' : 'px-4 pt-16 pb-24',
        'mx-auto max-w-[480px]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
};

export default PageContainer;
