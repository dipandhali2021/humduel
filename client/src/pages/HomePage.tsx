import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import PageContainer from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';

// ── Inline SVG icons ──────────────────────────────────────────────────────────

const MicIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect x="9" y="2" width="6" height="11" rx="3" fill="white" />
    <path
      d="M5 10a7 7 0 0014 0"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <line x1="12" y1="17" x2="12" y2="21" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <line x1="9" y1="21" x2="15" y2="21" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const CalendarIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
    <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const PeopleIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="2" />
    <circle cx="17" cy="8" r="2.5" stroke="currentColor" strokeWidth="2" />
    <path d="M2 19C2 16.2386 5.13401 14 9 14C12.866 14 16 16.2386 16 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M17 13C19.2091 13 21 14.567 21 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const LinkIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MusicNoteSmall = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2" />
    <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2" />
  </svg>
);

// ── Breathing record button ───────────────────────────────────────────────────

const HeroRecordButton = ({ onClick }: { onClick: () => void }) => (
  <>
    <style>{`
      @keyframes hum-hero-breathe {
        0%, 100% { box-shadow: 0 0 20px 4px rgba(124, 58, 237, 0.4); }
        50%       { box-shadow: 0 0 45px 16px rgba(124, 58, 237, 0.7); }
      }
      .hum-hero-btn { animation: hum-hero-breathe 2.6s ease-in-out infinite; }
    `}</style>
    <button
      type="button"
      onClick={onClick}
      aria-label="Tap to start humming"
      className="w-20 h-20 rounded-full bg-primary flex items-center justify-center hum-hero-btn transition-transform duration-100 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/60"
    >
      <MicIcon />
    </button>
  </>
);

// ── How It Works step ─────────────────────────────────────────────────────────

interface StepProps {
  number: number;
  icon: React.ReactNode;
  title: string;
  color: string;
}

const HowItWorksStep = ({ number, icon, title, color }: StepProps) => (
  <div className="flex flex-col items-center gap-2 flex-1">
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center ${color} relative`}
    >
      {icon}
      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-surface-elevated border border-surface-hover flex items-center justify-center font-label text-[10px] font-bold text-on-surface-muted">
        {number}
      </span>
    </div>
    <span className="font-label text-xs text-on-surface-muted text-center leading-tight">
      {title}
    </span>
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <PageContainer className="flex flex-col">
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="flex flex-col items-center text-center pt-8 pb-10 gap-3">
          <h1 className="font-headline text-4xl font-bold leading-tight">
            <span className="bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent">
              HumDuel
            </span>
          </h1>
          <p className="text-on-surface-muted text-lg leading-snug">
            Hum a tune. Challenge friends.
          </p>
        </section>

        {/* ── Record button ─────────────────────────────────────────────────── */}
        <section className="flex flex-col items-center gap-3 pb-10">
          <HeroRecordButton onClick={() => navigate('/record')} />
          <span className="text-on-surface-muted text-sm font-label">
            Tap to Hum
          </span>
        </section>

        {/* ── Action cards ──────────────────────────────────────────────────── */}
        <section className="grid grid-cols-2 gap-3 pb-10" aria-label="Quick actions">
          {/* Daily Challenge */}
          <Card
            onClick={() => navigate('/daily')}
            className="flex flex-col gap-2"
          >
            <span className="w-9 h-9 rounded-full bg-secondary/15 flex items-center justify-center text-secondary">
              <CalendarIcon />
            </span>
            <div>
              <p className="font-headline text-base font-semibold text-white leading-tight">
                Daily Challenge
              </p>
              <p className="text-on-surface-muted text-xs mt-0.5 leading-snug">
                New puzzle every day
              </p>
            </div>
          </Card>

          {/* Challenge a Friend */}
          <Card
            onClick={() => navigate('/record')}
            className="flex flex-col gap-2"
          >
            <span className="w-9 h-9 rounded-full bg-tertiary/15 flex items-center justify-center text-tertiary">
              <PeopleIcon />
            </span>
            <div>
              <p className="font-headline text-base font-semibold text-white leading-tight">
                Challenge a Friend
              </p>
              <p className="text-on-surface-muted text-xs mt-0.5 leading-snug">
                Send a hum challenge
              </p>
            </div>
          </Card>
        </section>

        {/* ── How It Works ─────────────────────────────────────────────────── */}
        <section className="pb-4">
          <h2 className="font-headline text-sm font-semibold text-on-surface-muted uppercase tracking-widest mb-4 text-center">
            How It Works
          </h2>
          <div className="flex items-start gap-2">
            <HowItWorksStep
              number={1}
              icon={<MicIcon />}
              title="Hum a Tune"
              color="bg-primary/20 text-primary"
            />
            {/* Connector line */}
            <div className="flex-none w-6 h-px bg-surface-hover mt-5 self-start" />
            <HowItWorksStep
              number={2}
              icon={<LinkIcon />}
              title="Share the Challenge"
              color="bg-secondary/20 text-secondary"
            />
            {/* Connector line */}
            <div className="flex-none w-6 h-px bg-surface-hover mt-5 self-start" />
            <HowItWorksStep
              number={3}
              icon={<MusicNoteSmall />}
              title="Friends Guess"
              color="bg-tertiary/20 text-tertiary"
            />
          </div>
        </section>
      </PageContainer>
    </>
  );
};

export default HomePage;
