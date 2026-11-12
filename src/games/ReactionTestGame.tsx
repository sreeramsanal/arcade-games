import React, { useState, useEffect, useRef, useCallback } from 'react';
import ArcadeCabinetFrame from '../components/ArcadeCabinetFrame';
import GameOverModal from '../components/GameOverModal';
import { storageService } from '../services/storageService';
import { soundService } from '../services/soundService';

type TestState = 'IDLE' | 'WAITING' | 'TRIGGERED' | 'EARLY' | 'ROUND_RESULT';

interface AttemptRecord {
  round: number;
  timeMs: number;
  rating: string;
}

export const ReactionTestGame: React.FC = () => {
  const [testState, setTestState] = useState<TestState>('IDLE');
  const [currentRound, setCurrentRound] = useState<number>(1);
  const totalRounds = 5;
  const [history, setHistory] = useState<AttemptRecord[]>([]);
  const [lastTimeMs, setLastTimeMs] = useState<number | null>(null);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [bestSessionTime, setBestSessionTime] = useState<number>(0);
  const [avgSessionTime, setAvgSessionTime] = useState<number>(0);

  const bestSaved = storageService.getGameScore('reaction-test').bestScore;
  const [allTimeBest, setAllTimeBest] = useState<number>(bestSaved);

  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const getRating = (ms: number): { title: string; color: string } => {
    if (ms < 190) return { title: 'GODLIKE // CYBORG REFLEX', color: '#00f3ff' };
    if (ms < 230) return { title: 'ELITE // PRO ESPORTS', color: '#22c55e' };
    if (ms < 280) return { title: 'SUPERIOR // RAPID TWITCH', color: '#ffb703' };
    if (ms < 350) return { title: 'STANDARD // HUMAN AVERAGE', color: '#94a3b8' };
    return { title: 'LATENCY DETECTED // RECALIBRATE', color: '#ff2a4b' };
  };

  const clearWaitTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearWaitTimer();
    };
  }, []);

  const startWaiting = useCallback(() => {
    setTestState('WAITING');
    soundService.playMove();

    // Random delay between 1.5s and 4.2s
    const delay = 1500 + Math.random() * 2700;

    clearWaitTimer();
    timerRef.current = window.setTimeout(() => {
      setTestState('TRIGGERED');
      startTimeRef.current = performance.now();
      soundService.playPowerup();
    }, delay);
  }, []);

  const handleTriggerClick = useCallback(() => {
    if (isGameOver) return;

    if (testState === 'IDLE') {
      startWaiting();
      return;
    }

    if (testState === 'WAITING') {
      // Too early! False start
      clearWaitTimer();
      setTestState('EARLY');
      soundService.playExplosion();
      return;
    }

    if (testState === 'TRIGGERED') {
      const elapsed = Math.round(performance.now() - startTimeRef.current);
      setLastTimeMs(elapsed);
      soundService.playScore();

      const rating = getRating(elapsed);
      const newRecord: AttemptRecord = {
        round: currentRound,
        timeMs: elapsed,
        rating: rating.title
      };

      const updatedHistory = [...history, newRecord];
      setHistory(updatedHistory);

      if (currentRound >= totalRounds) {
        // Complete trial
        setTestState('ROUND_RESULT');
        const times = updatedHistory.map(h => h.timeMs);
        const best = Math.min(...times);
        const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
        setBestSessionTime(best);
        setAvgSessionTime(avg);

        // Record the best reaction time in storage
        const res = storageService.recordGameScore('reaction-test', best);
        if (res.isNewRecord || allTimeBest === 0) {
          setAllTimeBest(best);
        }

        setTimeout(() => {
          setIsGameOver(true);
        }, 1200);
      } else {
        setTestState('ROUND_RESULT');
      }
      return;
    }

    if (testState === 'EARLY') {
      // Try current round again
      startWaiting();
      return;
    }

    if (testState === 'ROUND_RESULT') {
      setCurrentRound(prev => prev + 1);
      startWaiting();
    }
  }, [testState, currentRound, history, isGameOver, allTimeBest, startWaiting]);

  // Spacebar and Enter trigger
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        handleTriggerClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTriggerClick]);

  const restartAll = () => {
    clearWaitTimer();
    setCurrentRound(1);
    setHistory([]);
    setLastTimeMs(null);
    setBestSessionTime(0);
    setAvgSessionTime(0);
    setIsGameOver(false);
    setTestState('IDLE');
  };

  return (
    <ArcadeCabinetFrame
      title="REACTION TEST"
      subtitle="QUICK // 08"
      chassisId="RT-770-REFLEX • SECTOR 08"
      score={lastTimeMs || 0}
      bestScore={allTimeBest}
      scoreUnit="MS"
      levelOrLivesLabel="ROUNDS"
      levelOrLivesValue={`${Math.min(currentRound, totalRounds)} / ${totalRounds}`}
      multiplierOrCombo="SYNAPSE 1X"
      isPaused={false}
      onTogglePause={() => {}}
      onRestart={restartAll}
      controlsHelp={[
        { key: 'CLICK / SPACE', label: 'REACT' },
        { key: 'ENTER', label: 'TRIGGER' }
      ]}
    >
      <div 
        onClick={handleTriggerClick}
        className="w-full h-full flex flex-col items-center justify-between p-3 sm:p-6 select-none cursor-pointer transition-colors duration-200 touch-manipulation"
        style={{
          backgroundColor:
            testState === 'WAITING' ? 'rgba(255, 42, 75, 0.15)' :
            testState === 'TRIGGERED' ? 'rgba(34, 197, 94, 0.28)' :
            testState === 'EARLY' ? 'rgba(255, 183, 3, 0.15)' :
            'rgba(13, 15, 20, 0.85)'
        }}
      >
        {/* Top Trial Telemetry */}
        <div className="w-full flex items-center justify-between text-xs font-mono border-b border-[var(--border-arcade)] pb-2 sm:pb-3">
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-muted)]">TRIAL PROGRESS:</span>
            <span className="text-[var(--neon-green)] font-bold">ROUND {Math.min(currentRound, totalRounds)} / {totalRounds}</span>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[var(--text-muted)]">ALL-TIME BEST: </span>
              <span className="text-[var(--neon-yellow)] font-bold">{allTimeBest > 0 ? `${allTimeBest} MS` : '--'}</span>
            </div>
          </div>
        </div>

        {/* Center Interactive Sensor Target */}
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-lg px-2 sm:px-4 py-1 sm:py-2">
          {testState === 'IDLE' && (
            <div className="space-y-2 sm:space-y-4 animate-fade-in flex flex-col items-center justify-center">
              <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto rounded-full border-2 border-dashed border-[var(--neon-green)] flex items-center justify-center animate-pulse shadow-[0_0_25px_rgba(34,197,94,0.3)]">
                <span className="material-symbols-outlined text-3xl sm:text-4xl text-[var(--neon-green)]">bolt</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-display font-black text-white tracking-wider">
                SYNAPTIC LATENCY TEST
              </h2>
              <p className="text-xs sm:text-sm font-mono text-[var(--text-muted)] max-w-sm">
                When the sensor arms, wait for the screen to turn <span className="text-[var(--neon-green)] font-bold">NEON GREEN</span>. Click, tap, or press <span className="text-white font-bold">[SPACE]</span> as fast as humanly possible.
              </p>
              <div className="pt-1 sm:pt-2">
                <span className="inline-block px-5 py-2.5 sm:px-6 sm:py-3 bg-[var(--neon-green)] text-black font-display font-bold text-xs sm:text-sm tracking-wider clip-chamfer-btn hover:brightness-110 active:scale-95 transition-all">
                  TAP OR CLICK TO START
                </span>
              </div>
            </div>
          )}

          {testState === 'WAITING' && (
            <div className="space-y-4 animate-pulse">
              <div className="w-28 h-28 mx-auto rounded-full border-4 border-[var(--neon-red)] flex items-center justify-center shadow-[0_0_35px_rgba(255,42,75,0.6)]">
                <span className="material-symbols-outlined text-5xl text-[var(--neon-red)]">lock</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-display font-black text-[var(--neon-red)] tracking-wider">
                WAIT FOR GREEN...
              </h2>
              <p className="text-xs font-mono text-[var(--neon-red)]/80 tracking-widest uppercase">
                DO NOT CLICK EARLY // CHARGING SENSOR
              </p>
            </div>
          )}

          {testState === 'TRIGGERED' && (
            <div className="space-y-4 transform scale-105 transition-transform">
              <div className="w-32 h-32 mx-auto rounded-full bg-[var(--neon-green)] text-black flex items-center justify-center shadow-[0_0_50px_rgba(34,197,94,0.9)] animate-bounce">
                <span className="material-symbols-outlined text-6xl text-black">touch_app</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-display font-black text-white tracking-widest drop-shadow-[0_0_15px_#22c55e]">
                CLICK NOW!
              </h2>
              <p className="text-sm font-mono text-[var(--neon-green)] font-bold tracking-widest">
                [SPACE] OR TOUCH ANYWHERE!
              </p>
            </div>
          )}

          {testState === 'EARLY' && (
            <div className="space-y-4 animate-shake">
              <div className="w-24 h-24 mx-auto rounded-full border-4 border-[var(--neon-yellow)] flex items-center justify-center shadow-[0_0_30px_rgba(255,183,3,0.5)]">
                <span className="material-symbols-outlined text-5xl text-[var(--neon-yellow)]">warning</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-black text-[var(--neon-yellow)] tracking-wider">
                TOO EARLY!
              </h2>
              <p className="text-sm font-mono text-white/80">
                False trigger recorded. Calibrate your impulse control.
              </p>
              <div className="pt-2">
                <span className="inline-block px-5 py-2.5 bg-[var(--neon-yellow)] text-black font-display font-bold text-xs tracking-wider clip-chamfer-btn">
                  CLICK TO RETRY ROUND {currentRound}
                </span>
              </div>
            </div>
          )}

          {testState === 'ROUND_RESULT' && lastTimeMs !== null && (
            <div className="space-y-4">
              <div className="text-6xl sm:text-7xl font-mono font-black text-white tracking-tighter drop-shadow-[0_0_20px_rgba(0,243,255,0.6)]">
                {lastTimeMs} <span className="text-2xl text-[var(--neon-green)]">MS</span>
              </div>
              <div 
                className="inline-block px-4 py-1.5 rounded text-xs font-mono font-bold tracking-widest border border-white/10 uppercase"
                style={{ color: getRating(lastTimeMs).color, borderColor: getRating(lastTimeMs).color }}
              >
                {getRating(lastTimeMs).title}
              </div>
              <p className="text-xs font-mono text-[var(--text-muted)]">
                {currentRound < totalRounds
                  ? `Round ${currentRound} complete. Click to start Round ${currentRound + 1}.`
                  : '5-Round gauntlet finished! Calculating final stats...'}
              </p>
              {currentRound < totalRounds && (
                <div className="pt-2">
                  <span className="inline-block px-6 py-3 bg-[var(--neon-cyan)] text-black font-display font-bold text-xs tracking-wider clip-chamfer-btn">
                    NEXT ROUND ({currentRound + 1}/{totalRounds})
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom History Strip */}
        <div className="w-full flex items-center justify-center gap-2 pt-2 border-t border-[var(--border-arcade)]">
          {Array.from({ length: totalRounds }).map((_, idx) => {
            const item = history[idx];
            return (
              <div 
                key={idx}
                className={`flex-1 max-w-[90px] py-2 px-1 text-center rounded border text-xs font-mono transition-all ${
                  item 
                    ? 'border-[var(--neon-green)]/40 bg-[var(--neon-green)]/10 text-white' 
                    : idx + 1 === currentRound && testState !== 'IDLE'
                    ? 'border-[var(--neon-yellow)] bg-[var(--neon-yellow)]/10 text-[var(--neon-yellow)] animate-pulse'
                    : 'border-white/5 bg-black/40 text-[var(--text-muted)]'
                }`}
              >
                <div className="text-[10px] text-[var(--text-muted)] uppercase">R{idx + 1}</div>
                <div className="font-bold">{item ? `${item.timeMs}ms` : '--'}</div>
              </div>
            );
          })}
        </div>
      </div>

      <GameOverModal
        isOpen={isGameOver}
        score={bestSessionTime}
        scoreUnit="MS"
        isNewRecord={bestSessionTime > 0 && (allTimeBest === 0 || bestSessionTime <= allTimeBest)}
        previousBest={allTimeBest}
        customTitle="SYNAPTIC TRIAL FINISHED"
        onPlayAgain={restartAll}
      />
    </ArcadeCabinetFrame>
  );
};

export default ReactionTestGame;
