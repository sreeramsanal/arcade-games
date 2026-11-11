import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeroShader } from '../components/HeroShader';
import { GAMES_CATALOG } from '../services/gamesData';
import { storageService } from '../services/storageService';
import { dailyChallengeService } from '../services/dailyChallengeService';
import { soundService } from '../services/soundService';
import { GameCategory } from '../types';

export const ArcadePage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<GameCategory | 'all'>('all');
  const [storageData, setStorageData] = useState(storageService.getData());
  const [dailyCountdown, setDailyCountdown] = useState(dailyChallengeService.getTimeUntilNextChallenge());

  useEffect(() => {
    const unsub = storageService.subscribe(data => {
      setStorageData({ ...data });
    });

    const interval = setInterval(() => {
      setDailyCountdown(dailyChallengeService.getTimeUntilNextChallenge());
    }, 1000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  const todayChallenge = dailyChallengeService.getTodayChallenge();
  const isDailyCompleted = dailyChallengeService.isTodayCompleted();

  const filteredGames = selectedCategory === 'all'
    ? GAMES_CATALOG
    : GAMES_CATALOG.filter(g => g.category === selectedCategory);

  const categories: Array<{ id: GameCategory | 'all'; label: string; count: number }> = [
    { id: 'all', label: 'ALL GAMES', count: GAMES_CATALOG.length },
    { id: 'classic', label: 'CLASSIC', count: GAMES_CATALOG.filter(g => g.category === 'classic').length },
    { id: 'action', label: 'ACTION', count: GAMES_CATALOG.filter(g => g.category === 'action').length },
    { id: 'puzzle', label: 'PUZZLE', count: GAMES_CATALOG.filter(g => g.category === 'puzzle').length },
    { id: 'quick', label: 'QUICK', count: GAMES_CATALOG.filter(g => g.category === 'quick').length }
  ];

  const handlePlayGame = (gameId: string) => {
    soundService.playClick();
    navigate(`/games/${gameId}`);
  };

  const scrollToCabinet = () => {
    soundService.playClick();
    const el = document.getElementById('cabinet-grid');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-void)] text-white pt-20 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[540px] lg:min-h-[620px] flex items-center justify-center border-b border-[var(--border-subtle)] overflow-hidden bg-gradient-to-b from-[#ffffff] via-[#f1f5f9] to-[#f4f6fa] dark:from-[#090b0e] dark:via-[#090b0e] dark:to-[#0d0f14]">
        {/* Dynamic WebGL Shader Background */}
        <HeroShader isLightMode={storageData.theme === 'light'} />

        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#ff2a4b]/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-16 flex flex-col items-center text-center">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/95 dark:bg-[#14171f]/90 border border-[#ff2a4b]/40 rounded-full font-mono text-[11px] uppercase tracking-widest text-[#ff2a4b] mb-6 backdrop-blur-sm shadow-[0_2px_14px_rgba(255,42,75,0.2)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff2a4b] shadow-[0_0_8px_#ff2a4b] animate-ping" />
            COCKPIT ONLINE // INSTANT 60 FPS RETRO ENGINE
          </div>

          {/* Hero Headline */}
          <h1 className="font-display font-black text-4xl sm:text-6xl md:text-7xl lg:text-[76px] tracking-tight text-slate-900 dark:text-white uppercase drop-shadow-[0_2px_20px_rgba(255,42,75,0.35)] dark:drop-shadow-[0_0_28px_rgba(255,42,75,0.65)] leading-tight max-w-4xl">
            READY PLAYER<span className="text-[#ff2a4b] animate-pulse">?</span>
          </h1>

          <p className="mt-4 max-w-2xl text-base sm:text-lg text-[var(--text-muted)] font-normal leading-relaxed">
            Classic games. Daily challenges. Beat your best. <span className="text-slate-900 dark:text-white font-semibold border-b border-[#ff2a4b]/60">Ultra-fast retro arcade</span> with instant load, zero latency &amp; smooth 60 FPS gameplay.
          </p>

          {/* Hero CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={scrollToCabinet}
              className="px-8 py-3.5 bg-[#ff2a4b] text-white font-display font-bold text-sm tracking-wider uppercase clip-chamfer-btn arcade-btn-tactile hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(255,42,75,0.4)]"
            >
              <span className="material-symbols-outlined text-lg">play_arrow</span>
              START PLAYING
            </button>
            <Link
              to="/daily-challenge"
              onClick={() => soundService.playClick()}
              className="px-6 py-3.5 bg-[#1c212d] hover:bg-[#252b3b] text-white border border-white/10 hover:border-[#ffb703]/50 font-display font-bold text-sm tracking-wider uppercase clip-chamfer-btn transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg text-[#ffb703]">emoji_events</span>
              DAILY DRILL
            </Link>
          </div>

          {/* Telemetry Strip */}
          <div className="mt-12 w-full max-w-4xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            <div className="p-3 bg-[#14171f]/80 border border-white/5 rounded backdrop-blur-sm">
              <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">ENGINE STATUS</div>
              <div className="font-mono text-xs font-bold text-[#22c55e] flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-ping" />
                ONLINE (60 FPS)
              </div>
            </div>
            <div className="p-3 bg-[#14171f]/80 border border-white/5 rounded backdrop-blur-sm">
              <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">LATENCY SPEED</div>
              <div className="font-mono text-xs font-bold text-[#00f3ff] mt-0.5">
                0 MS // INSTANT LOAD
              </div>
            </div>
            <div className="p-3 bg-[#14171f]/80 border border-white/5 rounded backdrop-blur-sm">
              <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">DAILY STREAK</div>
              <div className="font-mono text-xs font-bold text-[#ffb703] mt-0.5">
                {storageData.dailyChallenge.currentStreak} DAYS // BEST {storageData.dailyChallenge.bestStreak}
              </div>
            </div>
            <div className="p-3 bg-[#14171f]/80 border border-white/5 rounded backdrop-blur-sm">
              <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">TOTAL RUNS</div>
              <div className="font-mono text-xs font-bold text-white mt-0.5">
                {storageService.getTotalGamesPlayed()} SESSIONS
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Daily Challenge Bento Highlight */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-12">
        <div className="relative p-6 sm:p-8 bg-gradient-to-r from-[#1c212d] via-[#14171f] to-[#0d0f14] border border-[#ffb703]/30 rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          {/* Subtle Cyber Grid Accents */}
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-9xl text-[#ffb703]">psychology</span>
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-[#ffb703]/20 border border-[#ffb703]/50 text-[#ffb703] font-mono text-[10px] font-bold tracking-widest uppercase rounded">
                  TODAY'S SPECIAL // DAY #{todayChallenge.dayNumber}
                </span>
                {isDailyCompleted && (
                  <span className="px-2.5 py-0.5 bg-[#22c55e]/20 border border-[#22c55e]/50 text-[#22c55e] font-mono text-[10px] font-bold tracking-widest uppercase rounded flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">check_circle</span>
                    COMPLETED TODAY
                  </span>
                )}
              </div>
              <h2 className="font-display font-black text-2xl sm:text-3xl text-white tracking-wide">
                MEMORY MATRIX CHALLENGE
              </h2>
              <p className="text-sm font-sans text-[var(--text-muted)]">
                Memorize 8 deterministic cyber numbers generated for today ({todayChallenge.date}). One attempt per calendar day. Lock in your streak!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="p-3 bg-black/40 border border-white/10 rounded font-mono text-center min-w-[150px]">
                <div className="text-[10px] text-[var(--text-muted)] uppercase">RESETS AT MIDNIGHT</div>
                <div className="text-lg font-bold text-[#ffb703] tracking-widest mt-0.5">
                  {dailyCountdown.formatted}
                </div>
              </div>

              <Link
                to="/daily-challenge"
                onClick={() => soundService.playClick()}
                className={`px-6 py-3 font-display font-bold text-xs uppercase tracking-wider clip-chamfer-btn transition-all flex items-center gap-2 ${
                  isDailyCompleted
                    ? 'bg-[#1c212d] text-white border border-white/20 hover:border-white/40'
                    : 'bg-[#ffb703] text-black hover:brightness-110 shadow-[0_0_15px_rgba(255,183,3,0.4)]'
                }`}
              >
                <span className="material-symbols-outlined text-base">
                  {isDailyCompleted ? 'visibility' : 'sports_esports'}
                </span>
                {isDailyCompleted ? 'VIEW TODAY\'S RESULT' : 'ENTER CHALLENGE'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Arcade Games Section */}
      <section id="cabinet-grid" className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-8">
        {/* Section Header & Category Filters */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[var(--border-subtle)]">
          <div>
            <div className="text-xs font-mono text-[#ff2a4b] uppercase tracking-widest">
              SELECT YOUR CABINET // 8 PLAYABLE GAMES
            </div>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight mt-1">
              ARCADE ROSTER
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {categories.map(cat => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    soundService.playClick();
                    setSelectedCategory(cat.id);
                  }}
                  className={`px-3.5 py-1.5 text-xs font-mono tracking-wider uppercase transition-all rounded ${
                    active
                      ? 'bg-[#ff2a4b] text-white font-bold shadow-[0_0_12px_rgba(255,42,75,0.4)]'
                      : 'bg-[#14171f] text-[var(--text-muted)] hover:text-white border border-white/5 hover:border-white/20'
                  }`}
                >
                  {cat.label} ({cat.count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Game Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {filteredGames.map(game => {
            const scoreRecord = storageService.getGameScore(game.id);
            const best = scoreRecord.bestScore;

            return (
              <div
                key={game.id}
                className="group relative bg-[#14171f] border border-white/[0.08] hover:border-[#ff2a4b]/60 rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_36px_rgba(0,0,0,0.8),0_0_24px_rgba(255,42,75,0.2)]"
              >
                {/* Top Banner with Accent Tag */}
                <div className="p-5 pb-3">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span 
                      className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded border"
                      style={{ 
                        color: game.tagColor, 
                        borderColor: `${game.tagColor}40`,
                        backgroundColor: `${game.tagColor}15`
                      }}
                    >
                      {game.categoryTag}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">
                      {game.fpsBadge}
                    </span>
                  </div>

                  {/* Icon & Title */}
                  <div className="flex items-center gap-3 mt-2">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${game.accentColor}20`, color: game.accentColor }}
                    >
                      <span className="material-symbols-outlined text-2xl">
                        {game.icon}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-display font-black text-xl text-white group-hover:text-[#ff2a4b] transition-colors tracking-wide">
                        {game.title}
                      </h3>
                      <div className="text-[11px] font-mono text-[var(--text-muted)]">
                        {game.speedOrDiff}
                      </div>
                    </div>
                  </div>

                  {/* Description Hook */}
                  <p className="mt-4 text-xs font-sans text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                    {game.subtitle}
                  </p>
                </div>

                {/* Bottom Stats & Play Action */}
                <div className="p-5 pt-3 border-t border-white/[0.06] bg-black/25">
                  <div className="flex items-center justify-between mb-3 text-xs font-mono">
                    <span className="text-[var(--text-muted)]">RECORD:</span>
                    <span className="font-bold text-white group-hover:text-[#ffb703] transition-colors">
                      {best > 0 ? `${best.toLocaleString()} ${game.unit}` : '--'}
                    </span>
                  </div>

                  <button
                    onClick={() => handlePlayGame(game.id)}
                    className="w-full py-2.5 bg-[#1c212d] group-hover:bg-[#ff2a4b] text-white font-display font-bold text-xs uppercase tracking-wider clip-chamfer-btn transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">play_arrow</span>
                    PLAY NOW
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Arcade Core Manifesto / Bento Feature Matrix */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-16 border-t border-[var(--border-subtle)] mt-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-[#14171f] border border-white/5 rounded-xl">
            <span className="material-symbols-outlined text-3xl text-[#22c55e] mb-3">bolt</span>
            <h3 className="font-display font-bold text-lg text-white mb-2">BLAZING-FAST PERFORMANCE</h3>
            <p className="text-xs font-sans text-[var(--text-muted)] leading-relaxed">
              Pure client execution running at silky 60 FPS. Zero loading spinners, zero latency delays, and instant response time on every tap and keystroke.
            </p>
          </div>

          <div className="p-6 bg-[#14171f] border border-white/5 rounded-xl">
            <span className="material-symbols-outlined text-3xl text-[#ff2a4b] mb-3">audio_file</span>
            <h3 className="font-display font-bold text-lg text-white mb-2">SYNTHESIS SOUND FX</h3>
            <p className="text-xs font-sans text-[var(--text-muted)] leading-relaxed">
              Zero external audio file bloat. All arcade laser chimes, paddle bounces, and coin-op fanfare are generated on-the-fly via Web Audio API oscillators.
            </p>
          </div>

          <div className="p-6 bg-[#14171f] border border-white/5 rounded-xl">
            <span className="material-symbols-outlined text-3xl text-[#ffb703] mb-3">military_tech</span>
            <h3 className="font-display font-bold text-lg text-white mb-2">ARCADE HALL OF FAME</h3>
            <p className="text-xs font-sans text-[var(--text-muted)] leading-relaxed">
              Review personal high scores, trophy unlocks, and play history on the Scores dashboard. Export your raw statistics as JSON at any time.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ArcadePage;

