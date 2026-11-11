import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { soundService } from '../services/soundService';
import { storageService } from '../services/storageService';

interface GameOverModalProps {
  isOpen: boolean;
  score: number;
  scoreUnit?: string;
  isNewRecord: boolean;
  previousBest: number;
  customTitle?: string;
  onPlayAgain: () => void;
}

const CHAR_SET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  score,
  scoreUnit = 'PTS',
  isNewRecord,
  previousBest,
  customTitle,
  onPlayAgain
}) => {
  const [initials, setInitials] = useState<string[]>(['P', 'L', 'R']);

  useEffect(() => {
    if (isOpen) {
      if (isNewRecord && score > 0) {
        soundService.playSuccess();
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ff2a4b', '#ffb703', '#ffffff', '#00f3ff']
          });
        } catch {}
      } else {
        soundService.playGameOver();
      }

      // Pre-fill initials from saved player tag if available
      const savedTag = storageService.getPlayerTag();
      if (savedTag && savedTag.length >= 3) {
        setInitials([savedTag[0], savedTag[1], savedTag[2]]);
      }
    }
  }, [isOpen, isNewRecord, score]);

  if (!isOpen) return null;

  const cycleLetter = (index: number, delta: number) => {
    soundService.playClick();
    const curr = initials[index];
    let pos = CHAR_SET.indexOf(curr);
    if (pos === -1) pos = 0;
    pos = (pos + delta + CHAR_SET.length) % CHAR_SET.length;
    const next = [...initials];
    next[index] = CHAR_SET[pos];
    setInitials(next);
    storageService.setPlayerTag(next.join(''));
  };

  const delta = score - previousBest;

  return (
    <div className="absolute inset-0 z-40 bg-[#090b0e]/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-[#14171f] dark:bg-[#14171f] light:bg-white border border-white/10 dark:border-white/10 light:border-slate-300 rounded-xl p-6 sm:p-8 shadow-[0_0_40px_rgba(255,42,75,0.35)] flex flex-col items-center text-center relative overflow-hidden">
        {/* Neon Corner Accents */}
        <div className="absolute top-0 left-0 w-8 h-8 bg-gradient-to-br from-[#ff2a4b] to-transparent opacity-80" />
        <div className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-tl from-[#e01e37] to-transparent opacity-80" />

        {/* New Record Confetti Banner */}
        {isNewRecord && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#1c212d] dark:bg-[#1c212d] light:bg-amber-50 border border-[#ff2a4b]/40 text-[#ff2a4b] font-mono-cyber text-[11px] uppercase tracking-widest shadow-[0_0_10px_rgba(255,42,75,0.2)] mb-2 animate-bounce">
            <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
            <span>NEW HIGH RECORD REGISTERED!</span>
            <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
          </div>
        )}

        {/* Modal Title */}
        <h2 className="font-headline text-3xl sm:text-4xl tracking-widest uppercase text-[#ff2a4b] drop-shadow-[0_0_20px_rgba(255,42,75,0.85)] leading-none my-1 font-bold">
          {customTitle || 'GAME OVER'}
        </h2>
        <span className="font-mono-cyber text-[10px] text-neutral-400 dark:text-neutral-400 light:text-slate-500 tracking-widest uppercase mb-4">
          SECTOR TERMINATED // DATA SYNCED
        </span>

        {/* Final Score Showcase Box */}
        <div className="w-full bg-[#090b0e] dark:bg-[#090b0e] light:bg-slate-100 border border-white/10 dark:border-white/10 light:border-slate-300 p-4 rounded-lg shadow-inner mb-4 flex flex-col items-center">
          <span className="font-mono-cyber text-[10px] text-neutral-400 dark:text-neutral-400 light:text-slate-500 uppercase tracking-wider">
            FINAL SCORE
          </span>
          <div className="font-mono-cyber text-3xl sm:text-4xl font-bold text-[#ff2a4b] drop-shadow-[0_0_12px_rgba(255,42,75,0.7)] my-1">
            {score.toLocaleString()}{' '}
            <span className="font-headline text-sm text-white dark:text-white light:text-slate-900 font-semibold">
              {scoreUnit}
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono-cyber text-[11px] text-neutral-400 dark:text-neutral-400 light:text-slate-600 tracking-wider uppercase">
            <span>PREVIOUS RECORD: {previousBest.toLocaleString()} {scoreUnit}</span>
            {delta > 0 && (
              <span className="text-[#22c55e] font-bold">
                (+{delta.toLocaleString()} DELTA)
              </span>
            )}
          </div>
        </div>

        {/* Initials Picker */}
        <div className="w-full mb-6 flex flex-col items-center">
          <span className="font-mono-cyber text-[10px] text-white dark:text-white light:text-slate-700 uppercase tracking-widest mb-2 font-semibold">
            PLAYER CALLSIGN INITIALS:
          </span>
          <div className="flex items-center justify-center gap-3">
            {initials.map((char, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => cycleLetter(idx, 1)}
                  className="w-8 h-6 bg-[#1c212d] dark:bg-[#1c212d] light:bg-slate-200 hover:bg-[#222736] text-[#ff2a4b] border border-white/10 rounded flex items-center justify-center cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_drop_up</span>
                </button>
                <div className="w-12 h-14 bg-[#090b0e] dark:bg-[#090b0e] light:bg-white border border-[#ff2a4b]/50 rounded flex items-center justify-center font-mono-cyber text-2xl font-bold text-white dark:text-white light:text-slate-900 drop-shadow-[0_0_10px_rgba(255,42,75,0.6)] select-none shadow-[inset_0_0_8px_rgba(255,42,75,0.2)]">
                  {char}
                </div>
                <button
                  type="button"
                  onClick={() => cycleLetter(idx, -1)}
                  className="w-8 h-6 bg-[#1c212d] dark:bg-[#1c212d] light:bg-slate-200 hover:bg-[#222736] text-[#ff2a4b] border border-white/10 rounded flex items-center justify-center cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_drop_down</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <button
            type="button"
            onClick={() => {
              soundService.playClick();
              onPlayAgain();
            }}
            className="clip-chamfer-btn w-full sm:flex-1 py-3 px-4 bg-[#ff2a4b] hover:bg-[#e01e37] active:bg-[#c0152b] text-white font-mono-cyber text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(255,42,75,0.5)] transition-all flex items-center justify-center gap-2 font-bold cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">replay</span>
            <span>PLAY AGAIN</span>
          </button>
          <Link
            to="/"
            onClick={() => soundService.playClick()}
            className="clip-chamfer-btn w-full sm:w-auto py-3 px-6 bg-[#1c212d] dark:bg-[#1c212d] light:bg-slate-100 border border-white/20 hover:border-[#ff2a4b] text-white dark:text-white light:text-slate-900 hover:text-[#ff2a4b] font-mono-cyber text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 font-semibold"
          >
            <span className="material-symbols-outlined text-[18px]">grid_view</span>
            <span>ARCADE</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GameOverModal;

