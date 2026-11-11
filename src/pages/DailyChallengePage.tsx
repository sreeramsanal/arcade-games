import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { dailyChallengeService } from '../services/dailyChallengeService';
import { storageService } from '../services/storageService';
import { soundService } from '../services/soundService';
import { DailyChallengeAttempt } from '../types';

type DailyPhase = 'INTRO' | 'MEMORIZE' | 'RECALL' | 'RESULT';

export const DailyChallengePage: React.FC = () => {
  const [phase, setPhase] = useState<DailyPhase>('INTRO');
  const [puzzle, setPuzzle] = useState(dailyChallengeService.getTodayChallenge());
  const [storageData, setStorageData] = useState(storageService.getData());
  const [countdown, setCountdown] = useState(dailyChallengeService.getTimeUntilNextChallenge());
  
  // Memorize phase state
  const [memorizeTimer, setMemorizeTimer] = useState<number>(5);
  
  // Recall phase state
  const [userInputs, setUserInputs] = useState<string[]>(Array(8).fill(''));
  const [activeSlot, setActiveSlot] = useState<number>(0);
  
  // Result state
  const [attemptResult, setAttemptResult] = useState<DailyChallengeAttempt | null>(null);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);

  // Load storage and initial completion state
  useEffect(() => {
    const unsub = storageService.subscribe(data => {
      setStorageData({ ...data });
    });

    const interval = setInterval(() => {
      setCountdown(dailyChallengeService.getTimeUntilNextChallenge());
    }, 1000);

    const today = dailyChallengeService.getTodayDateString();
    const existing = storageService.getData().dailyChallenge.attempts[today];
    if (existing) {
      setAttemptResult(existing);
      setPhase('RESULT');
    }

    return () => {
      unsub();
      clearInterval(interval);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Handle Memorization Countdown
  useEffect(() => {
    if (phase === 'MEMORIZE') {
      setMemorizeTimer(puzzle.memorizeSeconds);
      timerRef.current = window.setInterval(() => {
        setMemorizeTimer(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            soundService.playPowerup();
            setPhase('RECALL');
            return 0;
          }
          soundService.playMove();
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [phase, puzzle.memorizeSeconds]);

  const handleStartDrill = () => {
    soundService.playClick();
    setUserInputs(Array(8).fill(''));
    setActiveSlot(0);
    setPhase('MEMORIZE');
  };

  const handleKeypadPress = (val: string) => {
    soundService.playClick();
    if (activeSlot >= 8) return;

    const currentVal = userInputs[activeSlot];
    if (currentVal.length < 2) {
      const newVal = currentVal + val;
      const updated = [...userInputs];
      updated[activeSlot] = newVal;
      setUserInputs(updated);

      if (newVal.length === 2 && activeSlot < 7) {
        setActiveSlot(activeSlot + 1);
      }
    }
  };

  const handleBackspace = () => {
    soundService.playClick();
    const updated = [...userInputs];
    if (updated[activeSlot].length > 0) {
      updated[activeSlot] = updated[activeSlot].slice(0, -1);
    } else if (activeSlot > 0) {
      setActiveSlot(activeSlot - 1);
      updated[activeSlot - 1] = updated[activeSlot - 1].slice(0, -1);
    }
    setUserInputs(updated);
  };

  const handleClearSlot = () => {
    soundService.playClick();
    const updated = [...userInputs];
    updated[activeSlot] = '';
    setUserInputs(updated);
  };

  const handleSubmitAnswers = useCallback(() => {
    let correctCount = 0;
    const finalInputs = userInputs.map(Number);
    finalInputs.forEach((num, idx) => {
      if (num === puzzle.sequence[idx]) {
        correctCount++;
      }
    });

    const score = correctCount * 125; // 0 to 1000 pts
    const completed = true;
    const date = puzzle.date;

    const newAttempt: DailyChallengeAttempt = {
      date,
      completed,
      score,
      timeSeconds: 5,
      totalCount: 8,
      correctCount,
      userSequence: finalInputs
    };

    storageService.recordDailyChallengeAttempt(newAttempt);
    setAttemptResult(newAttempt);
    setPhase('RESULT');

    if (correctCount >= 6) {
      soundService.playSuccess();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ffb703', '#ff2a4b', '#00f3ff']
        });
      } catch (e) {
        console.error(e);
      }
    } else {
      soundService.playGameOver();
    }
  }, [userInputs, puzzle]);

  // Physical keyboard support for keypad
  useEffect(() => {
    if (phase !== 'RECALL') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleKeypadPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'ArrowRight' && activeSlot < 7) {
        e.preventDefault();
        setActiveSlot(activeSlot + 1);
      } else if (e.key === 'ArrowLeft' && activeSlot > 0) {
        e.preventDefault();
        setActiveSlot(activeSlot - 1);
      } else if (e.key === 'Enter') {
        const allFilled = userInputs.every(v => v.length === 2);
        if (allFilled) {
          e.preventDefault();
          handleSubmitAnswers();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, activeSlot, userInputs, handleSubmitAnswers]);

  const handleShareResult = () => {
    soundService.playClick();
    if (!attemptResult) return;

    const dateStr = puzzle.date;
    const accuracy = Math.round((attemptResult.correctCount / 8) * 100);
    const streak = storageData.dailyChallenge.currentStreak;
    const squares = attemptResult.userSequence ? attemptResult.userSequence.map((num: number, i: number) => (num === puzzle.sequence[i] ? '🟩' : '🟥')).join('') : '🟩🟩🟩';

    const text = `🕹️ PIXEL ARCADE // DAILY DRILL #${puzzle.dayNumber}\n📅 Date: ${dateStr}\n🧠 Score: ${attemptResult.score} PTS (${accuracy}% Accuracy)\n${squares}\n🔥 Streak: ${streak} Days\nPlay free at: ${window.location.origin}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2500);
      });
    }
  };

  // Generate 30-day activity array
  const last30Days = Array.from({ length: 30 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - idx));
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const isCompleted = storageData.dailyChallenge.completedDates.includes(dateStr);
    const isToday = dateStr === puzzle.date;
    return { dateStr, isCompleted, isToday, dayNum: d.getDate() };
  });

  return (
    <div className="min-h-screen bg-[var(--bg-void)] text-white pt-24 pb-16 overflow-x-hidden">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
        {/* Navigation Breadcrumb Bar */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
            <Link to="/" onClick={() => soundService.playClick()} className="hover:text-white transition-colors">
              ARCADE
            </Link>
            <span>/</span>
            <span className="text-[#ffb703] font-bold">DAILY CHALLENGE</span>
            <span>/</span>
            <span className="text-white font-bold">DAY #{puzzle.dayNumber}</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
            <span>RESETS IN:</span>
            <span className="text-[#ffb703] font-bold">{countdown.formatted}</span>
          </div>
        </div>

        {/* Challenge Header & Streak HUD */}
        <div className="relative p-6 sm:p-8 bg-[#14171f] border border-[#ffb703]/30 rounded-2xl mb-8 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 bg-[#ffb703]/20 border border-[#ffb703]/50 text-[#ffb703] font-mono text-[10px] font-bold tracking-widest uppercase rounded">
                  SYNAPSE CALIBRATION // 24-HOUR ROTATION
                </span>
                <span className="text-xs font-mono text-[var(--text-muted)]">
                  {puzzle.date}
                </span>
              </div>
              <h1 className="font-display font-black text-3xl sm:text-4xl text-white tracking-wide">
                MEMORY MATRIX DRILL
              </h1>
              <p className="mt-1 text-sm font-sans text-[var(--text-muted)]">
                A deterministic daily cognitive reflex puzzle generated identically for all players today.
              </p>
            </div>

            {/* Streak Counters */}
            <div className="flex items-center gap-3">
              <div className="p-3 bg-black/40 border border-white/10 rounded-xl text-center min-w-[100px]">
                <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">CURRENT</div>
                <div className="text-2xl font-mono font-black text-[#ffb703] flex items-center justify-center gap-1">
                  <span>🔥</span>
                  <span>{storageData.dailyChallenge.currentStreak}</span>
                </div>
                <div className="text-[9px] font-mono text-[var(--text-muted)]">DAYS</div>
              </div>

              <div className="p-3 bg-black/40 border border-white/10 rounded-xl text-center min-w-[100px]">
                <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">BEST RECORD</div>
                <div className="text-2xl font-mono font-black text-[#22c55e]">
                  {storageData.dailyChallenge.bestStreak}
                </div>
                <div className="text-[9px] font-mono text-[var(--text-muted)]">DAYS</div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Challenge Arena */}
        <div className="bg-[#14171f] border border-white/[0.08] rounded-2xl p-6 sm:p-10 mb-8 flex flex-col items-center justify-center text-center min-h-[440px]">
          {/* Phase 1: INTRO / INSTRUCTIONS */}
          {phase === 'INTRO' && (
            <div className="max-w-md space-y-6 animate-fade-in">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-[#ffb703]/10 border border-[#ffb703]/40 flex items-center justify-center text-[#ffb703]">
                <span className="material-symbols-outlined text-4xl">psychology</span>
              </div>

              <h2 className="font-display font-black text-2xl sm:text-3xl text-white">
                MISSION BRIEFING
              </h2>

              <ul className="text-left text-xs sm:text-sm font-mono space-y-3 text-[var(--text-muted)] bg-black/30 p-5 rounded-xl border border-white/5">
                <li className="flex items-start gap-2">
                  <span className="text-[#ffb703] font-bold">01.</span>
                  <span>You will have <strong className="text-white">5 seconds</strong> to observe 8 cyber numbers.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#ffb703] font-bold">02.</span>
                  <span>When the screen locks, recall and enter each number in sequence order.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#ffb703] font-bold">03.</span>
                  <span>Only <strong className="text-white">one attempt per calendar day</strong> is allowed.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#ffb703] font-bold">04.</span>
                  <span>Instant score tracking &amp; streak updates with zero load delay.</span>
                </li>
              </ul>

              <button
                onClick={handleStartDrill}
                className="w-full py-4 bg-[#ffb703] hover:brightness-110 text-black font-display font-black text-sm uppercase tracking-widest clip-chamfer-btn transition-all shadow-[0_0_20px_rgba(255,183,3,0.4)] cursor-pointer"
              >
                INITIALIZE DRILL NOW
              </button>
            </div>
          )}

          {/* Phase 2: MEMORIZE (5s Countdown) */}
          {phase === 'MEMORIZE' && (
            <div className="w-full max-w-2xl space-y-8 animate-fade-in">
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-[#ff2a4b] animate-pulse">
                  MEMORIZING SEQUENCE // DISAPPEARS IN:
                </span>
                <div className="text-6xl sm:text-7xl font-mono font-black text-white drop-shadow-[0_0_20px_rgba(255,42,75,0.7)]">
                  {memorizeTimer}s
                </div>
                {/* Progress bar */}
                <div className="w-48 h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/10 mt-1">
                  <div 
                    className="h-full bg-[#ff2a4b] transition-all duration-1000 ease-linear"
                    style={{ width: `${(memorizeTimer / puzzle.memorizeSeconds) * 100}%` }}
                  />
                </div>
              </div>

              {/* 8 Numbers Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 sm:gap-3">
                {puzzle.sequence.map((num: number, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 sm:p-4 bg-black/50 border-2 border-[#ffb703]/80 rounded-xl flex flex-col items-center justify-center shadow-[0_0_15px_rgba(255,183,3,0.3)] animate-pulse"
                  >
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">#{idx + 1}</span>
                    <span className="text-2xl sm:text-3xl font-mono font-black text-white mt-1">{num}</span>
                  </div>
                ))}
              </div>

              <p className="text-xs font-mono text-[var(--text-muted)]">
                Observe the sequence carefully. Do not refresh or exit.
              </p>
            </div>
          )}

          {/* Phase 3: RECALL (Input Numbers) */}
          {phase === 'RECALL' && (
            <div className="w-full max-w-xl space-y-6 animate-fade-in">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-[#00f3ff]">
                  RECALL SEQUENCE // ENTER 8 TWO-DIGIT NUMBERS
                </span>
                <h3 className="font-display font-bold text-xl sm:text-2xl text-white mt-1">
                  ENTER NUMBERS IN ORDER
                </h3>
              </div>

              {/* 8 Slot Boxes */}
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {userInputs.map((val, idx) => {
                  const isActive = activeSlot === idx;
                  const isFilled = val.length === 2;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        soundService.playClick();
                        setActiveSlot(idx);
                      }}
                      className={`p-2 sm:p-3 rounded-xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer ${
                        isActive
                          ? 'border-[#00f3ff] bg-[#00f3ff]/15 shadow-[0_0_15px_rgba(0,243,255,0.4)] scale-105'
                          : isFilled
                          ? 'border-[#22c55e]/60 bg-black/40 text-white'
                          : 'border-white/10 bg-black/30 text-[var(--text-muted)]'
                      }`}
                    >
                      <span className="text-[9px] font-mono text-[var(--text-muted)]">#{idx + 1}</span>
                      <span className="text-xl sm:text-2xl font-mono font-black tracking-widest min-h-[32px] flex items-center">
                        {val || (isActive ? '_' : '--')}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Virtual Cyber Numeric Keypad */}
              <div className="max-w-xs mx-auto p-4 bg-black/40 border border-white/10 rounded-2xl">
                <div className="grid grid-cols-3 gap-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
                    <button
                      key={d}
                      onClick={() => handleKeypadPress(d)}
                      className="p-3 bg-[#1c212d] hover:bg-[#ff2a4b] hover:text-white text-white font-mono font-bold text-lg rounded-lg border border-white/10 transition-colors active:scale-95"
                    >
                      {d}
                    </button>
                  ))}
                  <button
                    onClick={handleBackspace}
                    className="p-3 bg-[#1c212d] hover:bg-white/20 text-[var(--neon-yellow)] font-mono font-bold text-sm rounded-lg border border-white/10 flex items-center justify-center"
                    title="Backspace"
                  >
                    <span className="material-symbols-outlined text-lg">backspace</span>
                  </button>
                  <button
                    onClick={() => handleKeypadPress('0')}
                    className="p-3 bg-[#1c212d] hover:bg-[#ff2a4b] hover:text-white text-white font-mono font-bold text-lg rounded-lg border border-white/10 transition-colors active:scale-95"
                  >
                    0
                  </button>
                  <button
                    onClick={handleClearSlot}
                    className="p-3 bg-[#1c212d] hover:bg-white/20 text-[#ff2a4b] font-mono font-bold text-xs rounded-lg border border-white/10 flex items-center justify-center uppercase"
                    title="Clear Slot"
                  >
                    CLR
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-center gap-4">
                <button
                  disabled={!userInputs.every(v => v.length === 2)}
                  onClick={handleSubmitAnswers}
                  className="px-8 py-3.5 bg-[#22c55e] hover:brightness-110 disabled:opacity-40 disabled:pointer-events-none text-black font-display font-bold text-xs uppercase tracking-wider clip-chamfer-btn transition-all cursor-pointer shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                >
                  CONFIRM & LOCK ANSWERS
                </button>
              </div>
            </div>
          )}

          {/* Phase 4: RESULT / TODAY COMPLETED */}
          {phase === 'RESULT' && attemptResult && (
            <div className="w-full max-w-xl space-y-6 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#22c55e]/20 border border-[#22c55e]/40 rounded-full font-mono text-xs uppercase text-[#22c55e]">
                <span className="material-symbols-outlined text-sm">verified</span>
                DRILL COMPLETE FOR {puzzle.date}
              </div>

              <div className="space-y-1">
                <div className="text-5xl sm:text-6xl font-mono font-black text-white">
                  {attemptResult.score} <span className="text-xl text-[#ffb703]">PTS</span>
                </div>
                <div className="text-sm font-mono text-[var(--text-muted)]">
                  ACCURACY: <span className="text-white font-bold">{Math.round((attemptResult.correctCount / 8) * 100)}%</span> ({attemptResult.correctCount} / 8 Correct)
                </div>
              </div>

              {/* Side-by-side Answer Comparison Grid */}
              <div className="p-4 bg-black/40 border border-white/10 rounded-xl space-y-2">
                <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase text-left">
                  SEQUENCE VALIDATION // YOUR INPUT VS ACTUAL
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {puzzle.sequence.map((actualNum: number, idx: number) => {
                    const userVal = attemptResult.userSequence ? attemptResult.userSequence[idx] : null;
                    const isMatch = userVal === actualNum;
                    return (
                      <div
                        key={idx}
                        className={`p-2 rounded border text-center font-mono ${
                          isMatch
                            ? 'border-[#22c55e]/60 bg-[#22c55e]/10 text-white'
                            : 'border-[#ff2a4b]/60 bg-[#ff2a4b]/10 text-white'
                        }`}
                      >
                        <div className="text-[9px] text-[var(--text-muted)]">#{idx + 1}</div>
                        <div className="text-sm font-bold">{userVal ?? '--'}</div>
                        <div className="text-[9px] text-[var(--text-muted)] mt-0.5">
                          {isMatch ? '✓' : `[${actualNum}]`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Share & Next Drill Countdown */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={handleShareResult}
                  className="w-full sm:w-auto px-6 py-3 bg-[#1c212d] hover:bg-white/10 border border-white/20 text-white font-display font-bold text-xs uppercase tracking-wider clip-chamfer-btn transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">
                    {copiedShare ? 'done' : 'share'}
                  </span>
                  {copiedShare ? 'COPIED TO CLIPBOARD!' : 'SHARE RESULT'}
                </button>

                <div className="text-xs font-mono text-[var(--text-muted)]">
                  Next challenge unlocks in: <strong className="text-[#ffb703]">{countdown.formatted}</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 30-Day Activity Heatmap & Streak Calendar */}
        <div className="p-6 bg-[#14171f] border border-white/5 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/5">
            <div>
              <h3 className="font-display font-bold text-lg text-white">30-DAY DRILL LOG</h3>
              <p className="text-xs font-sans text-[var(--text-muted)]">
                Your past 30 days of daily drill activity and peak mental performance.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono text-[var(--text-muted)]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#22c55e]" />
                Completed
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-white/10" />
                Inactive
              </span>
            </div>
          </div>

          {/* 30-Day Grid */}
          <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-15 gap-2 pt-2">
            {last30Days.map(item => (
              <div
                key={item.dateStr}
                title={`${item.dateStr}: ${item.isCompleted ? 'Completed' : 'No attempt'}`}
                className={`h-10 rounded-lg border flex flex-col items-center justify-center font-mono text-[10px] transition-all ${
                  item.isCompleted
                    ? 'bg-[#22c55e]/20 border-[#22c55e]/70 text-[#22c55e] font-bold shadow-[0_0_8px_rgba(34,197,94,0.3)]'
                    : item.isToday
                    ? 'bg-[#ffb703]/20 border-[#ffb703] text-[#ffb703] font-bold animate-pulse'
                    : 'bg-black/30 border-white/5 text-[var(--text-muted)]'
                }`}
              >
                <span>{item.dayNum}</span>
                {item.isCompleted && <span className="text-[8px] leading-none">✓</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyChallengePage;
