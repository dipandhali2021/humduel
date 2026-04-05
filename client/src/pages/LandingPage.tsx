import { useNavigate } from 'react-router-dom';

// ── Inline SVG icons ──────────────────────────────────────────────────────────

const MicIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="9" y="2" width="6" height="11" rx="3" fill="currentColor" />
    <path d="M5 10a7 7 0 0014 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="9" y1="21" x2="15" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const WaveformIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <line x1="4" y1="8" x2="4" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="8" y1="5" x2="8" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="16" y1="7" x2="16" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="20" y1="9" x2="20" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const PeopleIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="2" />
    <circle cx="17" cy="8" r="2.5" stroke="currentColor" strokeWidth="2" />
    <path d="M2 19C2 16.2386 5.13401 14 9 14C12.866 14 16 16.2386 16 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M17 13C19.2091 13 21 14.567 21 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
    <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <rect x="7" y="14" width="3" height="3" rx="0.5" fill="currentColor" />
    <rect x="14" y="14" width="3" height="3" rx="0.5" fill="currentColor" />
  </svg>
);

const TrophyIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M8 21H16M12 17V21M7 3H17V11C17 14.3137 14.7614 17 12 17C9.23858 17 7 14.3137 7 11V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 6H4C4 6 3 9 5.5 10.5M17 6H20C20 6 21 9 18.5 10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const LinkIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MusicNoteIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2" />
    <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ── Feature card ──────────────────────────────────────────────────────────────

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const FeatureCard = ({ icon, title, description, color }: FeatureProps) => (
  <div className="bg-surface-elevated rounded-xl p-4 flex flex-col gap-3">
    <span className={`w-11 h-11 rounded-full flex items-center justify-center ${color}`}>
      {icon}
    </span>
    <div>
      <h3 className="font-headline text-base font-semibold text-white">{title}</h3>
      <p className="text-on-surface-muted text-sm mt-1 leading-snug">{description}</p>
    </div>
  </div>
);

// ── How It Works step ─────────────────────────────────────────────────────────

interface StepProps {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const HowItWorksStep = ({ number, icon, title, description, color }: StepProps) => (
  <div className="flex flex-col items-center text-center gap-3 flex-1">
    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${color} relative`}>
      {icon}
      <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center font-label text-xs font-bold text-white">
        {number}
      </span>
    </div>
    <div>
      <p className="font-headline text-sm font-semibold text-white">{title}</p>
      <p className="text-on-surface-muted text-xs mt-1 leading-snug">{description}</p>
    </div>
  </div>
);

// ── Stat item ─────────────────────────────────────────────────────────────────

interface StatProps {
  value: string;
  label: string;
}

const StatItem = ({ value, label }: StatProps) => (
  <div className="flex flex-col items-center gap-1">
    <span className="font-headline text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
      {value}
    </span>
    <span className="text-on-surface-muted text-xs font-label">{label}</span>
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface">
      {/* ── Header bar ─────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-lg border-b border-surface-hover/50">
        <div className="max-w-3xl mx-auto h-14 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="text-primary">
              <MusicNoteIcon />
            </span>
            <span className="font-headline text-xl font-bold text-white tracking-tight">
              HumDuel
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/app')}
            className="btn-primary text-sm py-2 px-4"
          >
            Play Now
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-14">
        {/* ── Hero section ───────────────────────────────────────────────── */}
        <section className="flex flex-col items-center text-center pt-16 pb-14 gap-5" aria-label="Hero">
          <h1 className="font-headline text-5xl sm:text-6xl font-bold leading-tight">
            <span className="bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent">
              HumDuel
            </span>
          </h1>
          <p className="text-on-surface-muted text-xl sm:text-2xl leading-snug max-w-md">
            Hum a tune, challenge your friends
          </p>
          <p className="text-on-surface-muted/70 text-base leading-relaxed max-w-sm">
            The social melody guessing game. Record a hum, share it, and see if your friends can name that tune.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full max-w-xs sm:max-w-md">
            <button
              type="button"
              onClick={() => navigate('/app')}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              Play Now
              <ArrowRightIcon />
            </button>
            <button
              type="button"
              onClick={() => navigate('/app/record')}
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
            >
              Challenge a Friend
            </button>
          </div>
        </section>

        {/* ── Feature highlights ─────────────────────────────────────────── */}
        <section className="pb-14" aria-label="Features">
          <h2 className="font-headline text-sm font-semibold text-on-surface-muted uppercase tracking-widest mb-6 text-center">
            Features
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <FeatureCard
              icon={<MicIcon />}
              title="Record Hums"
              description="Capture your melody with one tap"
              color="bg-primary/20 text-primary"
            />
            <FeatureCard
              icon={<WaveformIcon />}
              title="Waveform Cards"
              description="Beautiful visual cards for sharing"
              color="bg-secondary/20 text-secondary"
            />
            <FeatureCard
              icon={<PeopleIcon />}
              title="Challenge Friends"
              description="Send hum challenges via link"
              color="bg-tertiary/20 text-tertiary"
            />
            <FeatureCard
              icon={<CalendarIcon />}
              title="Daily Puzzles"
              description="A new challenge every day"
              color="bg-warning/20 text-warning"
            />
            <FeatureCard
              icon={<TrophyIcon />}
              title="Leaderboards"
              description="Compete for top rankings"
              color="bg-success/20 text-success"
            />
          </div>
        </section>

        {/* ── How to Play ────────────────────────────────────────────────── */}
        <section className="pb-14" aria-label="How to Play">
          <h2 className="font-headline text-sm font-semibold text-on-surface-muted uppercase tracking-widest mb-8 text-center">
            How to Play
          </h2>
          <div className="flex items-start gap-2 sm:gap-4">
            <HowItWorksStep
              number={1}
              icon={<MicIcon />}
              title="Hum a Tune"
              description="Record yourself humming any song"
              color="bg-primary/20 text-primary"
            />
            <div className="flex-none w-6 h-px bg-surface-hover mt-7 self-start" />
            <HowItWorksStep
              number={2}
              icon={<LinkIcon />}
              title="Share the Link"
              description="Send the challenge to friends"
              color="bg-secondary/20 text-secondary"
            />
            <div className="flex-none w-6 h-px bg-surface-hover mt-7 self-start" />
            <HowItWorksStep
              number={3}
              icon={<MusicNoteIcon />}
              title="Guess the Song"
              description="Friends listen and guess the melody"
              color="bg-tertiary/20 text-tertiary"
            />
          </div>
        </section>

        {/* ── Stats section ──────────────────────────────────────────────── */}
        <section className="pb-14" aria-label="Platform stats">
          <div className="bg-surface-elevated rounded-xl p-6">
            <h2 className="font-headline text-sm font-semibold text-on-surface-muted uppercase tracking-widest mb-6 text-center">
              Community
            </h2>
            <div className="flex justify-around">
              <StatItem value="10K+" label="Games Played" />
              <StatItem value="5K+" label="Challenges Sent" />
              <StatItem value="2K+" label="Players" />
            </div>
          </div>
        </section>

        {/* ── Bottom CTA ─────────────────────────────────────────────────── */}
        <section className="pb-20 flex flex-col items-center text-center gap-4" aria-label="Get started">
          <h2 className="font-headline text-2xl font-bold text-white">
            Ready to play?
          </h2>
          <p className="text-on-surface-muted text-base max-w-sm">
            Start humming your favorite songs and challenge friends to guess the melody.
          </p>
          <button
            type="button"
            onClick={() => navigate('/app')}
            className="btn-primary flex items-center gap-2"
          >
            Get Started
            <ArrowRightIcon />
          </button>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-surface-hover/50 py-6">
        <div className="max-w-3xl mx-auto px-4 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-primary">
              <MusicNoteIcon />
            </span>
            <span className="font-headline text-base font-bold text-white">HumDuel</span>
          </div>
          <p className="text-on-surface-muted text-xs">
            The social melody guessing game
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
