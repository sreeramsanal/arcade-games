import React from 'react';
import { Link } from 'react-router-dom';
import { soundService } from '../services/soundService';
import { storageService } from '../services/storageService';

interface ArcadeCabinetFrameProps {
  title: string;
  subtitle: string;
  chassisId?: string;
  score: number;
  bestScore: number;
  scoreUnit?: string;
  levelOrLivesLabel?: string;
  levelOrLivesValue?: string | number;
  multiplierOrCombo?: string;
  isPaused: boolean;
  onTogglePause: () => void;
  onRestart: () => void;
  controlsHelp?: Array<{ key: string; label: string }>;
  children: React.ReactNode;
}

export const ArcadeCabinetFrame: React.FC<ArcadeCabinetFrameProps> = ({
  title,
  subtitle,
  chassisId = 'CX-849-REV2 • SECTOR 07',
  score,
  bestScore,
  scoreUnit = 'PTS',
  levelOrLivesLabel = 'SPEED',
  levelOrLivesValue = 'LVL 1',
  multiplierOrCombo,
  isPaused,
  onTogglePause,
  onRestart,
  controlsHelp = [
    { key: '↑ ↓ ← →', label: 'MOVE' },
    { key: 'P', label: 'PAUSE' },
    { key: 'SPACE', label: 'ACTION' }
  ],
  children
}) => {
  const [audioMuted, setAudioMuted] = React.useState(soundService.getMuted());

  const handleToggleAudio = () => {
    const next = soundService.toggleMute();
    setAudioMuted(next);
    if (!next) soundService.playScore();
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Upper Navigation & Match Telemetry Strip */}
      <div className="w-full pt-4 pb-4 max-w-5xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#14171f]/85 dark:bg-[#14171f]/85 light:bg-white backdrop-blur-md border border-white/10 dark:border-white/10 light:border-slate-200 px-4 sm:px-6 py-4 rounded-xl shadow-[0_0_25px_rgba(255,42,75,0.08)]">
          {/* Back Link & Title */}
          <div className="flex items-center gap-4">
            <Link
              to="/"
              onClick={() => soundService.playClick()}
              className="inline-flex items-center gap-1.5 font-mono-cyber text-xs text-[#ff2a4b] hover:text-white transition-colors uppercase tracking-widest px-3 py-1.5 rounded bg-[#1c212d] dark:bg-[#1c212d] light:bg-slate-100 border border-[#ff2a4b]/30 hover:border-[#ff2a4b]"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>BACK TO ARCADE</span>
            </Link>
            <div className="h-4 w-px bg-white/15 hidden sm:block" />
            <div>
              <h1 className="font-headline text-lg sm:text-xl tracking-wider uppercase text-white dark:text-white light:text-slate-900 flex items-center gap-2">
                <span>{title}</span>
                <span className="text-[#ff2a4b] font-headline text-sm font-semibold">// {subtitle}</span>
              </h1>
              <p className="font-mono-cyber text-[10px] text-neutral-400 dark:text-neutral-400 light:text-slate-500 uppercase tracking-wider">
                CHASSIS ID: {chassisId}
              </p>
            </div>
          </div>

          {/* Real-Time HUD Telemetry Modules */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
            {/* Live Score */}
            <div className="flex flex-col px-3.5 py-1.5 bg-[#090b0e] dark:bg-[#090b0e] light:bg-slate-100 border border-white/10 dark:border-white/10 light:border-slate-300 rounded shadow-sm min-w-[90px]">
              <span className="font-mono-cyber text-[10px] text-neutral-400 dark:text-neutral-400 light:text-slate-500 tracking-widest uppercase">
                SCORE
              </span>
              <span className="font-mono-cyber text-lg font-bold text-[#ff2a4b] drop-shadow-[0_0_10px_rgba(255,42,75,0.7)]">
                {score.toLocaleString()} <span className="text-[10px] font-normal text-white/50">{scoreUnit}</span>
              </span>
            </div>

            {/* High Record */}
            <div className="flex flex-col px-3.5 py-1.5 bg-[#090b0e] dark:bg-[#090b0e] light:bg-slate-100 border border-white/10 dark:border-white/10 light:border-slate-300 rounded shadow-sm min-w-[90px]">
              <span className="font-mono-cyber text-[10px] text-neutral-400 dark:text-neutral-400 light:text-slate-500 tracking-widest uppercase">
                RECORD
              </span>
              <span className="font-mono-cyber text-lg font-bold text-white dark:text-white light:text-slate-900">
                {bestScore.toLocaleString()} <span className="text-[10px] font-normal text-white/50">{scoreUnit}</span>
              </span>
            </div>

            {/* Level / Speed */}
            {levelOrLivesValue !== undefined && (
              <div className="flex flex-col px-3 py-1.5 bg-[#090b0e] dark:bg-[#090b0e] light:bg-slate-100 border border-white/10 dark:border-white/10 light:border-slate-300 rounded shadow-sm min-w-[70px]">
                <span className="font-mono-cyber text-[10px] text-neutral-400 dark:text-neutral-400 light:text-slate-500 tracking-widest uppercase">
                  {levelOrLivesLabel}
                </span>
                <span className="font-mono-cyber text-sm font-semibold text-white dark:text-white light:text-slate-900">
                  {levelOrLivesValue}
                </span>
              </div>
            )}

            {/* Multiplier / Combo */}
            {multiplierOrCombo && (
              <div className="flex flex-col px-3 py-1.5 bg-[#1c212d] dark:bg-[#1c212d] light:bg-slate-200 border border-[#ff2a4b]/30 rounded shadow-sm min-w-[70px]">
                <span className="font-mono-cyber text-[10px] text-[#ff2a4b] tracking-widest uppercase">
                  STATUS
                </span>
                <span className="font-mono-cyber text-sm font-bold text-white dark:text-white light:text-slate-900">
                  {multiplierOrCombo}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Central Arcade Cabinet Frame & Glass Rig */}
      <div className="w-full max-w-5xl bg-[#14171f] dark:bg-[#14171f] light:bg-white p-3 sm:p-6 rounded-2xl border border-white/10 dark:border-white/10 light:border-slate-300 shadow-[0_0_35px_rgba(0,0,0,0.85)] relative">
        {/* Cabinet Bezel Top Badges */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#090b0e] dark:bg-[#090b0e] light:bg-slate-100 border-b border-white/10 dark:border-white/10 light:border-slate-300 rounded-t-xl mb-3 text-neutral-400 dark:text-neutral-400 light:text-slate-600 font-mono-cyber text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ff2a4b] shadow-[0_0_8px_rgba(255,42,75,0.9)] animate-pulse" />
            <span className="text-white dark:text-white light:text-slate-900 font-semibold">
              PIXEL ARCADE // HARDWARE CHASSIS
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-[10px]">
            <span>MEM: 64KB ROM</span>
            <span>CYCLE: 4.77 MHz</span>
            <span className="text-[#ff2a4b] font-semibold">NTSC VERIFIED</span>
          </div>
        </div>

        {/* The CRT Bezel Enclosure */}
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-[#090b0e] border border-white/10 dark:border-white/10 light:border-slate-300 rounded-xl overflow-hidden shadow-[inset_0_0_50px_rgba(0,0,0,0.95)] flex items-center justify-center">
          {/* Glass Reflection Highlight */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#ff2a4b]/[0.02] to-white/[0.04] pointer-events-none z-20" />
          <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-white/[0.03] blur-2xl pointer-events-none z-20" />

          {/* Children: Active Canvas / Game Screen */}
          <div className="relative w-full h-full flex items-center justify-center">
            {children}
          </div>

          {/* Pause Modal Overlay */}
          {isPaused && (
            <div className="absolute inset-0 z-30 bg-[#090b0e]/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center select-none">
              <span className="material-symbols-outlined text-5xl text-[#ff2a4b] mb-2 animate-pulse">
                pause_circle
              </span>
              <h2 className="font-headline text-3xl font-bold uppercase text-white drop-shadow-[0_0_15px_rgba(255,42,75,0.7)] tracking-widest mb-1">
                SYSTEM PAUSED
              </h2>
              <p className="font-mono-cyber text-xs text-neutral-400 mb-6">
                PRESS P OR CLICK RESUME TO CONTINUE
              </p>
              <button
                type="button"
                onClick={onTogglePause}
                className="clip-chamfer-btn px-8 py-3 bg-[#ff2a4b] hover:bg-[#e01e37] text-white font-mono-cyber text-xs uppercase tracking-widest font-bold shadow-[0_0_20px_rgba(255,42,75,0.5)] cursor-pointer"
              >
                [ RESUME GAME ]
              </button>
            </div>
          )}
        </div>

        {/* Cabinet Bottom Control & Instructions Deck */}
        <div className="mt-3 bg-[#090b0e] dark:bg-[#090b0e] light:bg-slate-100 border border-white/10 dark:border-white/10 light:border-slate-300 p-3 rounded-xl flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Keyboard Controls Cheatsheet */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 text-neutral-400 dark:text-neutral-400 light:text-slate-600 font-mono-cyber text-[11px]">
            {controlsHelp.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <span className="px-1.5 py-0.5 bg-[#14171f] dark:bg-[#14171f] light:bg-white border border-white/10 dark:border-white/10 light:border-slate-300 rounded text-white dark:text-white light:text-slate-900 font-bold">
                  {item.key}
                </span>
                <span className="uppercase text-[10px] ml-1">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Interactive Cabinet Utility Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {/* Pause/Resume */}
            <button
              type="button"
              onClick={onTogglePause}
              className={`px-3 py-1.5 rounded font-mono-cyber text-[11px] uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer ${
                isPaused
                  ? 'bg-[#ff2a4b] text-white shadow-[0_0_12px_rgba(255,42,75,0.6)] font-bold'
                  : 'bg-[#1c212d] dark:bg-[#1c212d] light:bg-white hover:bg-[#222736] border border-white/10 dark:border-white/10 light:border-slate-300 text-white dark:text-white light:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[15px] text-[#ff2a4b]">
                {isPaused ? 'play_arrow' : 'pause'}
              </span>
              <span>{isPaused ? 'RESUME' : 'PAUSE'}</span>
            </button>

            {/* Restart */}
            <button
              type="button"
              onClick={onRestart}
              className="px-3 py-1.5 bg-[#1c212d] dark:bg-[#1c212d] light:bg-white hover:bg-[#222736] border border-white/10 dark:border-white/10 light:border-slate-300 text-white dark:text-white light:text-slate-900 rounded font-mono-cyber text-[11px] uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px] text-[#ff2a4b]">restart_alt</span>
              <span>RESTART</span>
            </button>

            {/* Audio Toggle */}
            <button
              type="button"
              onClick={handleToggleAudio}
              className="px-3 py-1.5 bg-[#1c212d] dark:bg-[#1c212d] light:bg-white hover:bg-[#222736] border border-white/10 dark:border-white/10 light:border-slate-300 text-white dark:text-white light:text-slate-900 rounded font-mono-cyber text-[11px] uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px] text-[#ff2a4b]">
                {audioMuted ? 'volume_off' : 'volume_up'}
              </span>
              <span>{audioMuted ? 'MUTED' : 'AUDIO'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArcadeCabinetFrame;

