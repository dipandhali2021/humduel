import { useNavigate } from 'react-router-dom';

export interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightElement?: React.ReactNode;
}

const BackArrowIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M19 12H5M5 12L12 19M5 12L12 5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MusicNoteIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M9 18V5l12-2v13"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2" />
    <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const Header = ({ title, showBack, onBack, rightElement }: HeaderProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-4"
      style={{ background: 'transparent' }}
    >
      {/* Max-width container aligned with page content */}
      <div className="w-full max-w-[480px] mx-auto flex items-center">
        {/* Left slot: back button or logo */}
        <div className="flex-1 flex items-center">
          {showBack ? (
            <button
              type="button"
              onClick={handleBack}
              aria-label="Go back"
              className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-muted hover:text-white hover:bg-surface-hover transition-colors duration-150 -ml-2"
            >
              <BackArrowIcon />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-primary">
                <MusicNoteIcon />
              </span>
              <span className="font-headline text-xl font-bold text-white tracking-tight">
                HumDuel
              </span>
            </div>
          )}
        </div>

        {/* Center: page title */}
        {title && (
          <div className="absolute left-1/2 -translate-x-1/2">
            <h1 className="font-headline text-base font-semibold text-white">
              {title}
            </h1>
          </div>
        )}

        {/* Right slot */}
        <div className="flex-1 flex items-center justify-end">
          {rightElement ?? null}
        </div>
      </div>
    </header>
  );
};

export default Header;
