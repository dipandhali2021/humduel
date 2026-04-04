import { Routes, Route } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import RecordingPage from '@/pages/RecordingPage';
import ChallengePage from '@/pages/ChallengePage';
import ResultPage from '@/pages/ResultPage';
import DailyPage from '@/pages/DailyPage';
import LeaderboardPage from '@/pages/LeaderboardPage';
import ProfilePage from '@/pages/ProfilePage';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/record" element={<RecordingPage />} />
      <Route path="/challenge/:id" element={<ChallengePage />} />
      <Route path="/result/:id" element={<ResultPage />} />
      <Route path="/daily" element={<DailyPage />} />
      <Route path="/leaderboard" element={<LeaderboardPage />} />
      <Route path="/profile" element={<ProfilePage />} />
    </Routes>
  );
};

export default App;
