import React from 'react';
import { Link } from 'react-router-dom';
import { soundService } from '../services/soundService';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#090b0e] dark:bg-[#090b0e] light:bg-slate-100 border-t border-white/10 dark:border-white/10 light:border-slate-300 py-10">
      <div className="w-full px-4 sm:px-8 lg:px-12 max-w-[1440px] mx-auto flex flex-col gap-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center md:items-start gap-1">
            <span className="font-headline font-bold text-sm tracking-widest text-white dark:text-white light:text-slate-900 uppercase">
              PIXEL ARCADE • RETRO GAMING • COMPETE • CONQUER
            </span>
            <span className="font-mono-cyber text-xs text-neutral-400 dark:text-neutral-400 light:text-slate-600 uppercase tracking-widest">
              BUILT FOR SPEED // INSTANT 60 FPS RETRO ENGINE
            </span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-6">
            <Link
              to="/"
              onClick={() => soundService.playClick()}
              className="text-neutral-400 dark:text-neutral-400 light:text-slate-600 hover:text-[#ff2a4b] font-body text-xs uppercase tracking-wider transition-colors"
            >
              Cabinet Library
            </Link>
            <Link
              to="/daily-challenge"
              onClick={() => soundService.playClick()}
              className="text-neutral-400 dark:text-neutral-400 light:text-slate-600 hover:text-[#ff2a4b] font-body text-xs uppercase tracking-wider transition-colors"
            >
              Daily Quests
            </Link>
            <Link
              to="/scores"
              onClick={() => soundService.playClick()}
              className="text-neutral-400 dark:text-neutral-400 light:text-slate-600 hover:text-[#ff2a4b] font-body text-xs uppercase tracking-wider transition-colors"
            >
              High Scores & Trophies
            </Link>
          </nav>
        </div>

        <div className="h-[1px] w-full bg-white/10 dark:bg-white/10 light:bg-slate-300" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-neutral-400 dark:text-neutral-400 light:text-slate-600">
          <span className="font-body text-xs text-white/50 dark:text-white/50 light:text-slate-500">
            © 2025 PIXEL ARCADE SYNTHESIS. HIGH-PERFORMANCE ARCADE GAMING. ZERO LAG INSTANT PLAY.
          </span>
          <div className="flex items-center gap-4 font-mono-cyber text-xs tracking-wider">
            <div className="flex items-center gap-2 text-white dark:text-white light:text-slate-900">
              <span className="w-2 h-2 rounded-full bg-[#ff2a4b] animate-pulse shadow-[0_0_8px_#ff2a4b]" />
              <span>COCKPIT: ONLINE</span>
            </div>
            <span className="text-white/20 dark:text-white/20 light:text-slate-400">//</span>
            <span className="text-[#ff2a4b] font-semibold">60 FPS LOCKED</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

