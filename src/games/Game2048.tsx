import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ArcadeCabinetFrame } from '../components/ArcadeCabinetFrame';
import { TouchControls } from '../components/TouchControls';
import { GameOverModal } from '../components/GameOverModal';
import { storageService } from '../services/storageService';
import { soundService } from '../services/soundService';

type Board = number[][];

export const Game2048: React.FC = () => {
  const [board, setBoard] = useState<Board>([
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ]);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [maxTile, setMaxTile] = useState(2);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [previousBest, setPreviousBest] = useState(0);

  const boardRef = useRef<Board>(board);
  boardRef.current = board;
  const scoreRef = useRef(score);
  scoreRef.current = score;

  useEffect(() => {
    const record = storageService.getGameScore('2048');
    setBestScore(record.bestScore);
    initGame();
  }, []);

  const addRandomTile = (currentBoard: Board): Board => {
    const emptyCells: { r: number; c: number }[] = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (currentBoard[r][c] === 0) {
          emptyCells.push({ r, c });
        }
      }
    }
    if (emptyCells.length === 0) return currentBoard;

    const randCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const val = Math.random() < 0.9 ? 2 : 4;
    const newBoard = currentBoard.map(row => [...row]);
    newBoard[randCell.r][randCell.c] = val;
    return newBoard;
  };

  const initGame = useCallback(() => {
    let b: Board = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ];
    b = addRandomTile(b);
    b = addRandomTile(b);
    setBoard(b);
    setScore(0);
    setMaxTile(2);
    setIsGameOver(false);
    setIsNewRecord(false);
  }, []);

  // Slide & Merge Row logic
  const slideAndMergeRow = (row: number[]): { newRow: number[]; scoreGained: number; changed: boolean } => {
    const filtered = row.filter(val => val !== 0);
    const newRow: number[] = [];
    let scoreGained = 0;
    let i = 0;

    while (i < filtered.length) {
      if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
        const merged = filtered[i] * 2;
        newRow.push(merged);
        scoreGained += merged;
        i += 2;
      } else {
        newRow.push(filtered[i]);
        i++;
      }
    }

    while (newRow.length < 4) {
      newRow.push(0);
    }

    const changed = row.some((val, idx) => val !== newRow[idx]);
    return { newRow, scoreGained, changed };
  };

  const rotateClockwise = (matrix: Board): Board => {
    return matrix[0].map((_, index) => matrix.map(row => row[index]).reverse());
  };

  const rotateCounterClockwise = (matrix: Board): Board => {
    return matrix[0].map((_, index) => matrix.map(row => row[row.length - 1 - index]));
  };

  const move = useCallback((direction: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN') => {
    if (isGameOver) return;

    let current = boardRef.current.map(row => [...row]);
    let rotated = current;
    let totalScoreGained = 0;
    let anyChanged = false;

    if (direction === 'LEFT') {
      for (let r = 0; r < 4; r++) {
        const res = slideAndMergeRow(rotated[r]);
        rotated[r] = res.newRow;
        totalScoreGained += res.scoreGained;
        if (res.changed) anyChanged = true;
      }
    } else if (direction === 'RIGHT') {
      for (let r = 0; r < 4; r++) {
        const reversed = [...rotated[r]].reverse();
        const res = slideAndMergeRow(reversed);
        rotated[r] = res.newRow.reverse();
        totalScoreGained += res.scoreGained;
        if (res.changed) anyChanged = true;
      }
    } else if (direction === 'UP') {
      rotated = rotateCounterClockwise(rotated);
      for (let r = 0; r < 4; r++) {
        const res = slideAndMergeRow(rotated[r]);
        rotated[r] = res.newRow;
        totalScoreGained += res.scoreGained;
        if (res.changed) anyChanged = true;
      }
      rotated = rotateClockwise(rotated);
    } else if (direction === 'DOWN') {
      rotated = rotateClockwise(rotated);
      for (let r = 0; r < 4; r++) {
        const res = slideAndMergeRow(rotated[r]);
        rotated[r] = res.newRow;
        totalScoreGained += res.scoreGained;
        if (res.changed) anyChanged = true;
      }
      rotated = rotateCounterClockwise(rotated);
    }

    if (anyChanged) {
      if (totalScoreGained > 0) {
        soundService.playScore();
      } else {
        soundService.playMove();
      }

      const nextBoard = addRandomTile(rotated);
      const nextScore = scoreRef.current + totalScoreGained;
      setBoard(nextBoard);
      setScore(nextScore);

      // Check max tile
      let highest = 2;
      nextBoard.forEach(row =>
        row.forEach(v => {
          if (v > highest) highest = v;
        })
      );
      setMaxTile(highest);

      // Check Game Over
      checkGameOver(nextBoard, nextScore);
    }
  }, [isGameOver]);

  const checkGameOver = (b: Board, currentScore: number) => {
    // Check if any empty cell exists
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (b[r][c] === 0) return;
        // Check adjacent matches
        if (c < 3 && b[r][c] === b[r][c + 1]) return;
        if (r < 3 && b[r][c] === b[r + 1][c]) return;
      }
    }

    // No moves left!
    setIsGameOver(true);
    const res = storageService.recordGameScore('2048', currentScore);
    setPreviousBest(res.previousBest);
    setIsNewRecord(res.isNewRecord);
    setBestScore(storageService.getGameScore('2048').bestScore);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') move('UP');
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') move('DOWN');
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') move('LEFT');
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') move('RIGHT');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  const getTileStyle = (val: number) => {
    switch (val) {
      case 2:
        return 'bg-[#14171f] text-[#9ba1b0] border border-white/10';
      case 4:
        return 'bg-[#181d28] text-white border border-white/15';
      case 8:
        return 'bg-[#1c212d] text-[#ffb703] border border-[#ffb703]/40 shadow-[0_0_8px_rgba(255,183,3,0.3)]';
      case 16:
        return 'bg-[#1c212d] text-[#ff5260] border border-[#ff5260]/40 shadow-[0_0_10px_rgba(255,82,96,0.35)]';
      case 32:
        return 'bg-[#1c212d] text-[#ff2a4b] border border-[#ff2a4b]/50 shadow-[0_0_12px_rgba(255,42,75,0.4)]';
      case 64:
        return 'bg-[#ff2a4b] text-white shadow-[0_0_16px_rgba(255,42,75,0.7)] font-extrabold';
      case 128:
        return 'bg-[#ffb703] text-black shadow-[0_0_18px_rgba(255,183,3,0.7)] font-extrabold';
      case 256:
        return 'bg-[#ff5260] text-white shadow-[0_0_20px_rgba(255,82,96,0.8)] font-extrabold';
      case 512:
        return 'bg-[#00f3ff] text-black shadow-[0_0_22px_rgba(0,243,255,0.8)] font-extrabold';
      case 1024:
        return 'bg-[#a855f7] text-white shadow-[0_0_24px_rgba(168,85,247,0.85)] font-extrabold';
      case 2048:
        return 'bg-gradient-to-r from-[#ffb703] via-[#ff2a4b] to-[#00f3ff] text-white shadow-[0_0_30px_rgba(255,183,3,1)] font-extrabold animate-pulse';
      default:
        return 'bg-[#090b0e] border border-white/5';
    }
  };

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    touchStartRef.current = null;
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      move(dx > 0 ? 'RIGHT' : 'LEFT');
    } else {
      move(dy > 0 ? 'DOWN' : 'UP');
    }
  };

  return (
    <ArcadeCabinetFrame
      title="2048 SINGULARITY"
      subtitle="BINARY MATRIX"
      chassisId="BIN-CORE // 4x4 OPTIMAL"
      score={score}
      bestScore={bestScore}
      scoreUnit="PTS"
      levelOrLivesLabel="MAX TILE"
      levelOrLivesValue={maxTile}
      multiplierOrCombo="GRID: 4x4"
      isPaused={false}
      onTogglePause={() => {}}
      onRestart={() => {
        soundService.playClick();
        initGame();
      }}
      controlsHelp={[
        { key: 'WASD / ↑↓←→', label: 'SLIDE' },
        { key: 'MERGE', label: 'TARGET: 2048' }
      ]}
      touchControls={<TouchControls onDirection={move} />}
    >
      <div className="relative w-full h-full flex flex-col items-center justify-center p-2 sm:p-3 select-none touch-none">
        {/* 4x4 Board */}
        <div 
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="grid grid-cols-4 gap-2 sm:gap-3 p-2.5 sm:p-3 bg-[#090b0e] border border-white/10 rounded-2xl shadow-inner w-full max-w-[340px] sm:max-w-[400px] aspect-square touch-none"
        >
          {board.map((row, r) =>
            row.map((val, c) => (
              <div
                key={`${r}-${c}`}
                className={`rounded-xl flex items-center justify-center font-mono-cyber font-bold text-base sm:text-2xl transition-all duration-200 aspect-square ${getTileStyle(
                  val
                )}`}
              >
                {val > 0 ? val : ''}
              </div>
            ))
          )}
        </div>

        <GameOverModal
          isOpen={isGameOver}
          score={score}
          scoreUnit="PTS"
          isNewRecord={isNewRecord}
          previousBest={previousBest}
          customTitle={maxTile >= 2048 ? 'SINGULARITY ACHIEVED!' : 'NO MOVES REMAINING'}
          onPlayAgain={initGame}
        />
      </div>
    </ArcadeCabinetFrame>
  );
};

export default Game2048;

