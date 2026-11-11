import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ArcadePage from './pages/ArcadePage';
import GamePage from './pages/GamePage';
import DailyChallengePage from './pages/DailyChallengePage';
import ScoresPage from './pages/ScoresPage';
import { storageService } from './services/storageService';

export const App: React.FC = () => {
  useEffect(() => {
    // Initialize theme class on root html element
    const theme = storageService.getTheme();
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen bg-[var(--bg-void)] text-white relative selection:bg-[#ff2a4b] selection:text-white">
        {/* Global Header Navigation */}
        <Header />

        {/* Main Content Area */}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<ArcadePage />} />
            <Route path="/games/:gameId" element={<GamePage />} />
            <Route path="/daily-challenge" element={<DailyChallengePage />} />
            <Route path="/scores" element={<ScoresPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Global Footer */}
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;

