import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { GAMES_CATALOG } from '../services/gamesData';
import { storageService } from '../services/storageService';
import { soundService } from '../services/soundService';

// Game component imports
import SnakeGame from '../games/SnakeGame';
import SpaceShooterGame from '../games/SpaceShooterGame';
import BreakoutGame from '../games/BreakoutGame';
import PongGame from '../games/PongGame';
import MemoryMatchGame from '../games/MemoryMatchGame';
import MinesweeperGame from '../games/MinesweeperGame';
import Game2048 from '../games/Game2048';
import ReactionTestGame from '../games/ReactionTestGame';

export const GamePage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();

  const game = GAMES_CATALOG.find(g => g.id === gameId);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [gameId]);

  if (!game) {
    return (
      <div className="min-h-screen bg-[var(--bg-void)] text-white pt-28 pb-16 px-4 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#ff2a4b] flex items-center justify-center mb-6 text-[#ff2a4b] animate-pulse">
          <span className="material-symbols-outlined text-4xl">warning</span>
        </div>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-wider mb-2">
          CABINET NOT FOUND
        </h1>
        <p className="text-sm font-mono text-[var(--text-muted)] max-w-md mb-8">
          The requested game cabinet ID "{gameId}" does not exist in the arcade roster.
        </p>
        <Link
          to="/"
          onClick={() => soundService.playClick()}
          className="px-6 py-3 bg-[#ff2a4b] text-white font-display font-bold text-xs uppercase tracking-wider clip-chamfer-btn hover:brightness-110 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          RETURN TO ARCADE
        </Link>
      </div>
    );
  }

  const scoreRecord = storageService.getGameScore(game.id);

  const renderGameComponent = () => {
    switch (game.id) {
      case 'snake':
        return <SnakeGame />;
      case 'space-shooter':
        return <SpaceShooterGame />;
      case 'breakout':
        return <BreakoutGame />;
      case 'pong':
        return <PongGame />;
      case 'memory-match':
        return <MemoryMatchGame />;
      case 'minesweeper':
        return <MinesweeperGame />;
      case '2048':
        return <Game2048 />;
      case 'reaction-test':
        return <ReactionTestGame />;
      default:
        return <div>Cabinet unavailable</div>;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-void)] text-white pt-24 pb-16 overflow-x-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
        {/* Navigation Breadcrumb Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
            <Link
              to="/"
              onClick={() => soundService.playClick()}
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              ARCADE
            </Link>
            <span>/</span>
            <span className="text-[#ff2a4b] font-bold">{game.categoryTag}</span>
            <span>/</span>
            <span className="text-white font-bold">{game.title}</span>
          </div>

          {/* Quick Cabinet Jumper */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase hidden md:inline">
              SWITCH CABINET:
            </label>
            <select
              value={game.id}
              onChange={(e) => {
                soundService.playClick();
                navigate(`/games/${e.target.value}`);
              }}
              className="bg-[#14171f] text-white border border-white/10 rounded px-2.5 py-1 text-xs font-mono focus:border-[#ff2a4b] outline-none cursor-pointer"
            >
              {GAMES_CATALOG.map(g => (
                <option key={g.id} value={g.id}>
                  {g.title} ({g.fpsBadge})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Playable Game Cabinet Frame */}
        <div className="w-full flex justify-center mb-12">
          {renderGameComponent()}
        </div>

        {/* Cabinet Manual, Tips & Personal History Bento */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Overview */}
          <div className="p-6 bg-[#14171f] border border-white/5 rounded-xl space-y-4">
            <div className="flex items-center gap-3">
              <span 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${game.accentColor}20`, color: game.accentColor }}
              >
                <span className="material-symbols-outlined text-2xl">{game.icon}</span>
              </span>
              <div>
                <h3 className="font-display font-black text-xl text-white">{game.title}</h3>
                <div className="text-[11px] font-mono text-[var(--text-muted)]">{game.categoryTag}</div>
              </div>
            </div>
            <p className="text-xs font-sans text-[var(--text-muted)] leading-relaxed">
              {game.description}
            </p>
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs font-mono">
              <span className="text-[var(--text-muted)]">TELEMETRY:</span>
              <span className="text-[var(--neon-green)] font-bold">{game.speedOrDiff}</span>
            </div>
          </div>

          {/* Control Schemes */}
          <div className="p-6 bg-[#14171f] border border-white/5 rounded-xl space-y-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-xl text-[#00f3ff]">keyboard</span>
              <h3 className="font-display font-bold text-base text-white uppercase">INPUT CONTROLS</h3>
            </div>
            <ul className="text-xs font-mono space-y-2 text-[var(--text-muted)]">
              <li className="flex items-center justify-between">
                <span>PRIMARY MOVEMENT</span>
                <span className="text-white font-bold bg-black/40 px-2 py-0.5 rounded border border-white/10">ARROWS / WASD</span>
              </li>
              <li className="flex items-center justify-between">
                <span>ACTION / SHOOT</span>
                <span className="text-white font-bold bg-black/40 px-2 py-0.5 rounded border border-white/10">SPACE / CLICK</span>
              </li>
              <li className="flex items-center justify-between">
                <span>MOBILE / TABLET</span>
                <span className="text-white font-bold bg-black/40 px-2 py-0.5 rounded border border-white/10">TOUCHPAD / D-PAD</span>
              </li>
              <li className="flex items-center justify-between">
                <span>AUDIO SYNTHESIS</span>
                <span className="text-[#ffb703] font-bold">WEB AUDIO API</span>
              </li>
            </ul>
          </div>

          {/* Personal Record & Session History */}
          <div className="p-6 bg-[#14171f] border border-white/5 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xl text-[#ffb703]">leaderboard</span>
                <h3 className="font-display font-bold text-base text-white uppercase">YOUR RECORD</h3>
              </div>
              <span className="text-xs font-mono text-[var(--neon-green)] font-bold">
                {scoreRecord.bestScore > 0 ? `${scoreRecord.bestScore.toLocaleString()} ${game.unit}` : '--'}
              </span>
            </div>

            <div className="text-xs font-mono space-y-2">
              <div className="flex items-center justify-between text-[var(--text-muted)]">
                <span>SESSIONS PLAYED:</span>
                <span className="text-white font-bold">{scoreRecord.gamesPlayed}</span>
              </div>
              <div className="flex items-center justify-between text-[var(--text-muted)]">
                <span>LAST SCORE:</span>
                <span className="text-white font-bold">
                  {scoreRecord.lastScore > 0 ? `${scoreRecord.lastScore.toLocaleString()} ${game.unit}` : '--'}
                </span>
              </div>
            </div>

            {/* Recent Attempts */}
            <div className="pt-2 border-t border-white/5">
              <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase mb-2">RECENT ATTEMPTS</div>
              {scoreRecord.history && scoreRecord.history.length > 0 ? (
                <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                  {scoreRecord.history.slice(0, 4).map((h, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px] font-mono bg-black/30 px-2 py-1 rounded">
                      <span className="text-[var(--text-muted)]">
                        {new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="font-bold text-[#ffb703]">{h.score} {game.unit}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs font-mono text-[var(--text-muted)] italic">
                  No sessions recorded yet. Play to log your first run!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamePage;

