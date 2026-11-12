import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ArcadeCabinetFrame } from '../components/ArcadeCabinetFrame';
import { GameOverModal } from '../components/GameOverModal';
import { storageService } from '../services/storageService';
import { soundService } from '../services/soundService';

interface CardItem {
  id: number;
  symbol: string;
  name: string;
  color: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const SYMBOLS = [
  { symbol: '⚡', name: 'ENERGY', color: '#ff2a4b' },
  { symbol: '⚔', name: 'BLADE', color: '#ffb703' },
  { symbol: '✦', name: 'STAR', color: '#00f3ff' },
  { symbol: '👾', name: 'INVADER', color: '#a855f7' },
  { symbol: '🕹', name: 'JOYSTICK', color: '#22c55e' },
  { symbol: '🚀', name: 'ROCKET', color: '#f59e0b' },
  { symbol: '💎', name: 'CRYSTAL', color: '#38bdf8' },
  { symbol: '👑', name: 'CROWN', color: '#fbbf24' }
];

export const MemoryMatchGame: React.FC = () => {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [bestTime, setBestTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [previousBest, setPreviousBest] = useState(0);

  const timerRef = useRef<number | null>(null);

  const initDeck = useCallback(() => {
    const deck: CardItem[] = [];
    let id = 0;
    SYMBOLS.forEach(item => {
      // 2 of each symbol
      deck.push({ id: id++, ...item, isFlipped: false, isMatched: false });
      deck.push({ id: id++, ...item, isFlipped: false, isMatched: false });
    });
    // Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    setCards(deck);
    setSelectedCards([]);
    setMoves(0);
    setMatches(0);
    setTimeSeconds(0);
    setIsGameOver(false);
    setIsNewRecord(false);
  }, []);

  useEffect(() => {
    const record = storageService.getGameScore('memory-match');
    setBestTime(record.bestScore);
    initDeck();
  }, [initDeck]);

  // Timer loop
  useEffect(() => {
    if (isPaused || isGameOver) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = window.setInterval(() => {
      setTimeSeconds(t => t + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, isGameOver]);

  const handleCardClick = (cardId: number) => {
    if (isPaused || isGameOver || selectedCards.length >= 2) return;
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    soundService.playClick();
    const newCards = cards.map(c => (c.id === cardId ? { ...c, isFlipped: true } : c));
    setCards(newCards);

    const newSelected = [...selectedCards, cardId];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      setMoves(m => m + 1);
      const first = newCards.find(c => c.id === newSelected[0]);
      const second = newCards.find(c => c.id === newSelected[1]);

      if (first && second && first.symbol === second.symbol) {
        // Match!
        soundService.playScore();
        setTimeout(() => {
          setCards(prev =>
            prev.map(c =>
              c.id === first.id || c.id === second.id ? { ...c, isMatched: true } : c
            )
          );
          setSelectedCards([]);
          setMatches(m => {
            const nextMatches = m + 1;
            if (nextMatches >= SYMBOLS.length) {
              handleGameComplete(timeSeconds);
            }
            return nextMatches;
          });
        }, 400);
      } else {
        // Mismatch
        setTimeout(() => {
          soundService.playBounce();
          setCards(prev =>
            prev.map(c =>
              c.id === newSelected[0] || c.id === newSelected[1]
                ? { ...c, isFlipped: false }
                : c
            )
          );
          setSelectedCards([]);
        }, 900);
      }
    }
  };

  const handleGameComplete = (totalTime: number) => {
    soundService.playSuccess();
    setIsGameOver(true);
    // In Memory Match, lower time is better
    const res = storageService.recordGameScore('memory-match', totalTime);
    setPreviousBest(res.previousBest);
    setIsNewRecord(res.isNewRecord);
    setBestTime(storageService.getGameScore('memory-match').bestScore);
  };

  const togglePause = () => {
    if (isGameOver) return;
    soundService.playClick();
    setIsPaused(p => !p);
  };

  const syncRate = moves > 0 ? Math.round((matches / moves) * 100) : 100;

  return (
    <ArcadeCabinetFrame
      title="MEMORY MATCH"
      subtitle="NEURAL PAIR DISCIPLINE"
      chassisId="MEM-SYNAPSE // 4x4 MATRIX"
      score={timeSeconds}
      bestScore={bestTime}
      scoreUnit="SEC"
      levelOrLivesLabel="MOVES"
      levelOrLivesValue={`${moves} TRIES`}
      multiplierOrCombo={`SYNC ${syncRate}%`}
      isPaused={isPaused}
      onTogglePause={togglePause}
      onRestart={() => {
        soundService.playClick();
        initDeck();
      }}
      controlsHelp={[
        { key: 'CLICK / TAP', label: 'FLIP CARD' },
        { key: 'P', label: 'PAUSE' },
        { key: 'MATCH ALL', label: 'WIN' }
      ]}
    >
      <div className="relative w-full h-full flex flex-col items-center justify-center p-2 sm:p-3 select-none">
        {/* Memory Grid 4x4 */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full max-w-[340px] sm:max-w-md aspect-square">
          {cards.map(card => {
            const showFace = card.isFlipped || card.isMatched;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => handleCardClick(card.id)}
                disabled={card.isMatched || card.isFlipped}
                className={`relative rounded-xl flex flex-col items-center justify-center transition-all duration-300 cursor-pointer aspect-square ${
                  card.isMatched
                    ? 'bg-[#1c212d] border border-emerald-500/50 shadow-[0_0_12px_rgba(34,197,94,0.3)]'
                    : showFace
                    ? 'bg-[#1c212d] border border-[#ff2a4b] shadow-[0_0_14px_rgba(255,42,75,0.4)] scale-105'
                    : 'bg-[#10131a] border border-white/10 hover:border-white/30 hover:bg-[#161a24]'
                }`}
                aria-label={`Memory card ${card.id}`}
              >
                {showFace ? (
                  <div className="flex flex-col items-center justify-center">
                    <span
                      className="text-xl sm:text-3xl filter drop-shadow-[0_0_8px_currentColor]"
                      style={{ color: card.color }}
                    >
                      {card.symbol}
                    </span>
                    <span className="font-mono-cyber text-[8px] sm:text-[9px] text-neutral-400 uppercase mt-0.5 truncate max-w-full px-1">
                      {card.name}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-neutral-600">
                    <span className="font-mono-cyber text-xs sm:text-sm">◆</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer info in game frame */}
        <div className="mt-2 sm:mt-3 flex items-center justify-between w-full max-w-[340px] sm:max-w-md text-neutral-400 font-mono-cyber text-[10px] sm:text-[11px] px-1">
          <span>MATCHES: {matches} / {SYMBOLS.length}</span>
          <span className="text-[#ffb703]">TIME: {timeSeconds}s</span>
        </div>

        <GameOverModal
          isOpen={isGameOver}
          score={timeSeconds}
          scoreUnit="SEC"
          isNewRecord={isNewRecord}
          previousBest={previousBest}
          customTitle="NEURAL MATRIX VERIFIED!"
          onPlayAgain={initDeck}
        />
      </div>
    </ArcadeCabinetFrame>
  );
};

export default MemoryMatchGame;

