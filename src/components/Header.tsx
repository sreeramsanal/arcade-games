import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { soundService } from '../services/soundService';
import { ArcadeStorageData } from '../types';

export const Header: React.FC = () => {
  const location = useLocation();
  const [data, setData] = useState<ArcadeStorageData>(storageService.getData());
  const [isAudioMuted, setIsAudioMuted] = useState(soundService.getMuted());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    return storageService.subscribe(updated => {
      setData({ ...updated });
    });
  }, []);

  const handleToggleAudio = () => {
    const nextMuted = soundService.toggleMute();
    setIsAudioMuted(nextMuted);
    if (!nextMuted) {
      soundService.playScore();
    }
  };

  const handleToggleTheme = () => {
    soundService.playClick();
    const nextTheme = data.theme === 'dark' ? 'light' : 'dark';
    storageService.setTheme(nextTheme);
  };

  const { level } = storageService.getPlayerLevel();
  const totalGames = storageService.getTotalGamesPlayed();
  const credits = Math.max(1, 10 + Math.floor(totalGames * 1.5));

  const navLinks = [
    { path: '/', label: 'ARCADE' },
    { path: '/daily-challenge', label: 'DAILY CHALLENGE' },
    { path: '/scores', label: 'MY SCORES' }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 bg-[#0d0f14]/90 dark:bg-[#0d0f14]/90 light:bg-[#f8fafc]/95 backdrop-blur-md border-b border-white/[0.08] dark:border-white/[0.08] light:border-slate-900/10 shadow-[0_4px_30px_rgba(255,42,75,0.07)]">
      <div className="h-20 w-full px-4 sm:px-8 lg:px-12 max-w-[1440px] mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/"
            onClick={() => soundService.playClick()}
            className="flex items-center gap-2.5 uppercase tracking-wider text-white dark:text-white light:text-slate-900 group"
          >
            <span className="material-symbols-outlined text-[#ff2a4b] text-2xl drop-shadow-[0_0_10px_rgba(255,42,75,0.8)] group-hover:scale-110 transition-transform">
              sports_esports
            </span>
            <span className="font-headline tracking-widest font-bold text-lg text-white dark:text-white light:text-slate-900">
              PIXEL<span className="text-[#ff2a4b] font-extrabold ml-1">ARCADE</span>
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden xl:flex items-center gap-2">
          {navLinks.map(link => {
            const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => soundService.playClick()}
                className={`px-4 py-2 uppercase tracking-wider transition-all font-headline text-xs font-semibold ${
                  isActive
                    ? 'bg-[#1c212d] dark:bg-[#1c212d] light:bg-white text-white dark:text-white light:text-[#e11d48] border border-[#ff2a4b]/50 shadow-[0_0_12px_rgba(255,42,75,0.25)]'
                    : 'text-neutral-400 dark:text-neutral-400 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-900 hover:bg-[#14171f] dark:hover:bg-[#14171f] light:hover:bg-slate-200/60 border border-transparent'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Controls Cluster */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Audio Toggle Button */}
          <button
            type="button"
            onClick={handleToggleAudio}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 border border-white/10 dark:border-white/10 light:border-slate-900/15 bg-[#14171f] dark:bg-[#14171f] light:bg-white text-neutral-300 dark:text-neutral-300 light:text-slate-700 hover:border-[#ff2a4b]/50 transition-colors font-mono-cyber text-[11px] uppercase tracking-wider cursor-pointer ${
              isAudioMuted ? 'opacity-60' : ''
            }`}
            title={isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            <span className="material-symbols-outlined text-[15px] text-[#ff2a4b]">
              {isAudioMuted ? 'volume_off' : 'volume_up'}
            </span>
            <span className="hidden md:inline">{isAudioMuted ? 'MUTED' : 'AUDIO'}</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={handleToggleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1.5 border border-white/10 dark:border-white/10 light:border-slate-900/15 bg-[#14171f] dark:bg-[#14171f] light:bg-white text-neutral-300 dark:text-neutral-300 light:text-slate-700 hover:border-[#ff2a4b]/50 transition-colors font-mono-cyber text-[11px] uppercase tracking-wider cursor-pointer"
            title={`Switch to ${data.theme === 'dark' ? 'Light' : 'Dark'} Theme`}
          >
            <span className="material-symbols-outlined text-[15px] text-[#ffb703]">
              {data.theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
            <span className="hidden lg:inline">{data.theme === 'dark' ? 'LIGHT' : 'DARK'}</span>
          </button>

          {/* Level & Credits Badge */}
          <div className="hidden sm:flex items-center px-3 py-1.5 border border-[#ff2a4b]/30 bg-[#14171f] dark:bg-[#14171f] light:bg-white text-[#ff2a4b] font-mono-cyber text-[11px] tracking-wider shadow-[0_0_12px_rgba(255,42,75,0.15)]">
            <span className="text-white dark:text-white light:text-slate-900 font-semibold">[ LVL {String(level).padStart(2, '0')}</span>
            <span className="mx-1 text-white/30 dark:text-white/30 light:text-slate-400">•</span>
            <span className="text-[#ff2a4b] font-bold">{credits} CREDITS ]</span>
          </div>

          {/* Player Profile Link */}
          <Link
            to="/scores"
            onClick={() => soundService.playClick()}
            className="w-8 h-8 bg-[#1c212d] dark:bg-[#1c212d] light:bg-slate-100 border border-white/15 dark:border-white/15 light:border-slate-300 flex items-center justify-center text-white dark:text-white light:text-slate-900 hover:border-[#ff2a4b] transition-colors shadow-[0_0_10px_rgba(255,42,75,0.2)]"
            title="View My Scores & Profile"
          >
            <span className="material-symbols-outlined text-[18px]">person</span>
          </Link>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden w-8 h-8 flex items-center justify-center text-white dark:text-white light:text-slate-900 border border-white/10"
            aria-label="Toggle navigation menu"
          >
            <span className="material-symbols-outlined text-xl">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Decorative Neon Beam Line */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#ff2a4b]/70 to-transparent opacity-80 shadow-[0_0_12px_rgba(255,42,75,0.8)]" />

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-[#0d0f14] dark:bg-[#0d0f14] light:bg-white border-b border-white/10 dark:border-white/10 light:border-slate-200 px-4 py-4 flex flex-col gap-2">
          {navLinks.map(link => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => {
                  soundService.playClick();
                  setMobileMenuOpen(false);
                }}
                className={`px-4 py-2.5 uppercase tracking-wider font-headline text-sm font-semibold flex items-center justify-between ${
                  isActive
                    ? 'bg-[#1c212d] dark:bg-[#1c212d] light:bg-slate-100 text-[#ff2a4b] border-l-4 border-[#ff2a4b]'
                    : 'text-neutral-300 dark:text-neutral-300 light:text-slate-700 hover:bg-[#14171f]'
                }`}
              >
                <span>{link.label}</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            );
          })}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono-cyber text-neutral-400">
            <span>LVL {String(level).padStart(2, '0')} PILOT</span>
            <span className="text-[#ff2a4b] font-bold">{credits} CREDITS AVAILABLE</span>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;

