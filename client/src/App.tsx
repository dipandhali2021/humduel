import { Routes, Route, useLocation } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import RecordingPage from '@/pages/RecordingPage';
import ChallengePage from '@/pages/ChallengePage';
import ResultPage from '@/pages/ResultPage';
import DailyPage from '@/pages/DailyPage';
import LeaderboardPage from '@/pages/LeaderboardPage';
import ProfilePage from '@/pages/ProfilePage';
import MobileNav from '@/components/layout/MobileNav';

// Routes where the bottom navigation should be hidden
const NAV_HIDDEN_PATHS = ['/record'];

const App = () => {
  const location = useLocation();
  const showNav = !NAV_HIDDEN_PATHS.includes(location.pathname);

  return (
    <div className="min-h-screen bg-surface text-white font-body">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/record" element={<RecordingPage />} />
        <Route path="/challenge/:id" element={<ChallengePage />} />
        <Route path="/result/:id" element={<ResultPage />} />
        <Route path="/daily" element={<DailyPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
      {showNav && <MobileNav />}
    </div>
  );
};

export default App;
