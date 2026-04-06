import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import MobileNav from '@/components/layout/MobileNav';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { OfflineBanner } from '@/components/OfflineBanner';

// ── Lazy-loaded route pages (code-split per route) ───────────────────────────
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const HomePage = lazy(() => import('@/pages/HomePage'));
const RecordingPage = lazy(() => import('@/pages/RecordingPage'));
const ChallengePage = lazy(() => import('@/pages/ChallengePage'));
const ResultPage = lazy(() => import('@/pages/ResultPage'));
const DailyPage = lazy(() => import('@/pages/DailyPage'));
const LeaderboardPage = lazy(() => import('@/pages/LeaderboardPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));

// Routes where the bottom navigation should be hidden
const NAV_HIDDEN_PATHS = ['/', '/app/record'];

const App = () => {
  const location = useLocation();
  const showNav = !NAV_HIDDEN_PATHS.includes(location.pathname);

  return (
    <div className="min-h-screen bg-surface text-white font-body">
      <OfflineBanner />
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/app" element={<HomePage />} />
          <Route path="/app/record" element={<RecordingPage />} />
          <Route path="/app/challenge/:id" element={<ChallengePage />} />
          <Route path="/c/:id" element={<ChallengePage />} />
          <Route path="/app/result/:id" element={<ResultPage />} />
          <Route path="/result/:id" element={<ResultPage />} />
          <Route path="/app/daily" element={<DailyPage />} />
          <Route path="/app/leaderboard" element={<LeaderboardPage />} />
          <Route path="/app/profile" element={<ProfilePage />} />
        </Routes>
      </Suspense>
      {showNav && <MobileNav />}
      <PWAInstallPrompt />
    </div>
  );
};

export default App;
