import { NavLink } from 'react-router-dom';

// ── Inline SVG icons ──────────────────────────────────────────────────────────

const HomeIcon = ({ filled }: { filled: boolean }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {filled ? (
      <>
        <path
          d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ) : (
      <path
        d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )}
  </svg>
);

const CalendarIcon = ({ filled }: { filled: boolean }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect
      x="3"
      y="4"
      width="18"
      height="18"
      rx="3"
      stroke="currentColor"
      strokeWidth="2"
      fill={filled ? 'currentColor' : 'none'}
      fillOpacity={filled ? 0.2 : 0}
    />
    <path
      d="M16 2V6M8 2V6M3 10H21"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    {filled && (
      <>
        <rect x="7" y="14" width="3" height="3" rx="0.5" fill="currentColor" />
        <rect x="14" y="14" width="3" height="3" rx="0.5" fill="currentColor" />
      </>
    )}
  </svg>
);

const TrophyIcon = ({ filled }: { filled: boolean }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M8 21H16M12 17V21M7 3H17V11C17 14.3137 14.7614 17 12 17C9.23858 17 7 14.3137 7 11V3Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={filled ? 'currentColor' : 'none'}
      fillOpacity={filled ? 0.2 : 0}
    />
    <path
      d="M7 6H4C4 6 3 9 5.5 10.5M17 6H20C20 6 21 9 18.5 10.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const UserIcon = ({ filled }: { filled: boolean }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle
      cx="12"
      cy="8"
      r="4"
      stroke="currentColor"
      strokeWidth="2"
      fill={filled ? 'currentColor' : 'none'}
      fillOpacity={filled ? 0.3 : 0}
    />
    <path
      d="M4 20C4 17.0 7.58172 14.5 12 14.5C16.4183 14.5 20 17.0 20 20"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

// ── Nav tab definitions ───────────────────────────────────────────────────────

interface NavTab {
  to: string;
  label: string;
  icon: (filled: boolean) => React.ReactNode;
}

const tabs: NavTab[] = [
  {
    to: '/',
    label: 'Home',
    icon: (filled) => <HomeIcon filled={filled} />,
  },
  {
    to: '/daily',
    label: 'Daily',
    icon: (filled) => <CalendarIcon filled={filled} />,
  },
  {
    to: '/leaderboard',
    label: 'Ranks',
    icon: (filled) => <TrophyIcon filled={filled} />,
  },
  {
    to: '/profile',
    label: 'Profile',
    icon: (filled) => <UserIcon filled={filled} />,
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

const MobileNav = () => {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-surface-elevated/95 backdrop-blur-lg border-t border-surface-hover"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Main navigation"
    >
      <div className="h-16 max-w-[480px] mx-auto flex items-center">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              [
                'flex-1 flex flex-col items-center justify-center gap-0.5 h-full',
                'transition-colors duration-150',
                isActive
                  ? 'text-primary'
                  : 'text-on-surface-muted hover:text-white',
              ].join(' ')
            }
            aria-label={tab.label}
          >
            {({ isActive }) => (
              <>
                {tab.icon(isActive)}
                <span className="font-label text-xs font-medium leading-none">
                  {tab.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default MobileNav;
