import React from 'react';
import { soundService } from '../services/soundService';

interface TouchControlsProps {
  onDirection?: (dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => void;
  onAction?: () => void;
  actionLabel?: string;
  secondaryAction?: () => void;
  secondaryLabel?: string;
  className?: string;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onDirection,
  onAction,
  actionLabel = 'ACTION',
  secondaryAction,
  secondaryLabel = 'SECONDARY',
  className = ''
}) => {
  const handleDir = (dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT', e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    soundService.playMove();
    if (onDirection) onDirection(dir);
  };

  const handleAct = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    soundService.playClick();
    if (onAction) onAction();
  };

  const handleSec = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    soundService.playClick();
    if (secondaryAction) secondaryAction();
  };

  return (
    <div className={`p-3 bg-[#0d0f14] dark:bg-[#0d0f14] light:bg-slate-100 border border-white/10 dark:border-white/10 light:border-slate-300 rounded-xl flex md:hidden flex-col items-center justify-center gap-2 select-none touch-none ${className}`}>
      <div className="flex items-center gap-1.5 font-mono-cyber text-[10px] text-neutral-400 dark:text-neutral-400 light:text-slate-500 uppercase tracking-widest">
        <span className="w-1.5 h-1.5 rounded-full bg-[#ff2a4b] animate-pulse" />
        <span>ARCADE CONTROL DECK // TOUCH EMULATION</span>
      </div>

      <div className="flex items-center justify-around w-full max-w-sm px-2 py-1">
        {/* Virtual D-Pad */}
        {onDirection && (
          <div className="relative w-32 h-32 bg-[#090b0e] dark:bg-[#090b0e] light:bg-slate-200 border border-white/10 dark:border-white/10 light:border-slate-300 rounded-full p-2 flex items-center justify-center touch-none">
            {/* UP */}
            <button
              type="button"
              onTouchStart={(e) => handleDir('UP', e)}
              onClick={(e) => handleDir('UP', e)}
              className="absolute top-1 left-1/2 -translate-x-1/2 w-10 h-10 bg-[#1c212d] dark:bg-[#1c212d] light:bg-white active:bg-[#ff2a4b] active:text-white rounded-lg flex items-center justify-center text-[#ff2a4b] shadow active:scale-95 transition-transform touch-manipulation cursor-pointer"
              aria-label="Up"
            >
              <span className="material-symbols-outlined text-xl">arrow_drop_up</span>
            </button>
            {/* DOWN */}
            <button
              type="button"
              onTouchStart={(e) => handleDir('DOWN', e)}
              onClick={(e) => handleDir('DOWN', e)}
              className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-10 bg-[#1c212d] dark:bg-[#1c212d] light:bg-white active:bg-[#ff2a4b] active:text-white rounded-lg flex items-center justify-center text-[#ff2a4b] shadow active:scale-95 transition-transform touch-manipulation cursor-pointer"
              aria-label="Down"
            >
              <span className="material-symbols-outlined text-xl">arrow_drop_down</span>
            </button>
            {/* LEFT */}
            <button
              type="button"
              onTouchStart={(e) => handleDir('LEFT', e)}
              onClick={(e) => handleDir('LEFT', e)}
              className="absolute left-1 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#1c212d] dark:bg-[#1c212d] light:bg-white active:bg-[#ff2a4b] active:text-white rounded-lg flex items-center justify-center text-[#ff2a4b] shadow active:scale-95 transition-transform touch-manipulation cursor-pointer"
              aria-label="Left"
            >
              <span className="material-symbols-outlined text-xl">arrow_left</span>
            </button>
            {/* RIGHT */}
            <button
              type="button"
              onTouchStart={(e) => handleDir('RIGHT', e)}
              onClick={(e) => handleDir('RIGHT', e)}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#1c212d] dark:bg-[#1c212d] light:bg-white active:bg-[#ff2a4b] active:text-white rounded-lg flex items-center justify-center text-[#ff2a4b] shadow active:scale-95 transition-transform touch-manipulation cursor-pointer"
              aria-label="Right"
            >
              <span className="material-symbols-outlined text-xl">arrow_right</span>
            </button>
            <div className="w-6 h-6 rounded-full bg-white/10 dark:bg-white/10 light:bg-slate-300" />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {secondaryAction && (
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onTouchStart={handleSec}
                onClick={handleSec}
                className="w-12 h-12 rounded-full bg-[#1c212d] dark:bg-[#1c212d] light:bg-slate-200 border border-white/20 active:bg-neutral-600 text-white font-mono-cyber text-xs shadow-md active:scale-95 flex items-center justify-center font-bold touch-manipulation cursor-pointer"
              >
                SEC
              </button>
              <span className="font-mono-cyber text-[9px] text-neutral-400 uppercase">
                {secondaryLabel}
              </span>
            </div>
          )}

          {onAction && (
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onTouchStart={handleAct}
                onClick={handleAct}
                className="w-16 h-16 rounded-full bg-[#ff2a4b] active:bg-[#e01e37] text-white font-mono-cyber text-xs shadow-[0_0_20px_rgba(255,42,75,0.7)] active:scale-95 flex items-center justify-center font-bold uppercase tracking-wider touch-manipulation cursor-pointer"
              >
                ACT
              </button>
              <span className="font-mono-cyber text-[10px] text-[#ff2a4b] font-bold uppercase">
                {actionLabel}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

