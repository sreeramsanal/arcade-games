import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ArcadeCabinetFrame } from '../components/ArcadeCabinetFrame';
import { GameOverModal } from '../components/GameOverModal';
import { storageService } from '../services/storageService';
import { soundService } from '../services/soundService';

const ROWS = 9;
const COLS = 9;
const TOTAL_MINES = 10;

interface Cell {
  r: number;
  c: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
}

export const MinesweeperGame: React.FC = () => {
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [minesLeft, setMinesLeft] = useState(TOTAL_MINES);
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [bestTime, setBestTime] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [previousBest, setPreviousBest] = useState(0);
  const [flagMode, setFlagMode] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const timerRef = useRef<number | null>(null);

  const initEmptyGrid = useCallback(() => {
    const newGrid: Cell[][] = [];
    for (let r = 0; r < ROWS; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < COLS; c++) {
        row.push({
          r,
          c,
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          neighborMines: 0
        });
      }
      newGrid.push(row);
    }
    setGrid(newGrid);
    setMinesLeft(TOTAL_MINES);
    setTimeSeconds(0);
    setIsGameOver(false);
    setIsWon(false);
    setIsNewRecord(false);
    setGameStarted(false);
  }, []);

  useEffect(() => {
    const record = storageService.getGameScore('minesweeper');
    setBestTime(record.bestScore);
    initEmptyGrid();
  }, [initEmptyGrid]);

  // Timer
  useEffect(() => {
    if (!gameStarted || isGameOver) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = window.setInterval(() => {
      setTimeSeconds(t => t + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameStarted, isGameOver]);

  const placeMines = (startR: number, startC: number, baseGrid: Cell[][]) => {
    let placed = 0;
    while (placed < TOTAL_MINES) {
      const r = Math.floor(Math.random() * ROWS);
      const c = Math.floor(Math.random() * COLS);
      // Don't place on or directly around start cell to guarantee safe opening
      if (Math.abs(r - startR) <= 1 && Math.abs(c - startC) <= 1) continue;
      if (!baseGrid[r][c].isMine) {
        baseGrid[r][c].isMine = true;
        placed++;
      }
    }

    // Calculate neighbor numbers
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (baseGrid[r][c].isMine) continue;
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && baseGrid[nr][nc].isMine) {
              count++;
            }
          }
        }
        baseGrid[r][c].neighborMines = count;
      }
    }
  };

  const revealCell = (r: number, c: number, activeGrid: Cell[][]) => {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
    const cell = activeGrid[r][c];
    if (cell.isRevealed || cell.isFlagged) return;

    cell.isRevealed = true;

    if (cell.neighborMines === 0 && !cell.isMine) {
      // Flood fill reveal neighbors
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          revealCell(r + dr, c + dc, activeGrid);
        }
      }
    }
  };

  const handleCellClick = (r: number, c: number) => {
    if (isGameOver) return;

    const cell = grid[r][c];
    if (cell.isRevealed) return;

    if (flagMode) {
      toggleFlag(r, c);
      return;
    }

    if (cell.isFlagged) return;

    soundService.playClick();
    const newGrid = grid.map(row => row.map(cell => ({ ...cell })));

    if (!gameStarted) {
      setGameStarted(true);
      placeMines(r, c, newGrid);
    }

    if (newGrid[r][c].isMine) {
      // Detonation!
      soundService.playExplosion();
      // Reveal all mines
      newGrid.forEach(row =>
        row.forEach(cl => {
          if (cl.isMine) cl.isRevealed = true;
        })
      );
      setGrid(newGrid);
      setIsGameOver(true);
      setIsWon(false);
      return;
    }

    revealCell(r, c, newGrid);
    setGrid(newGrid);

    // Check Victory
    let unrevealedSafe = 0;
    newGrid.forEach(row =>
      row.forEach(cl => {
        if (!cl.isMine && !cl.isRevealed) unrevealedSafe++;
      })
    );

    if (unrevealedSafe === 0) {
      soundService.playSuccess();
      setIsGameOver(true);
      setIsWon(true);
      const res = storageService.recordGameScore('minesweeper', timeSeconds);
      setPreviousBest(res.previousBest);
      setIsNewRecord(res.isNewRecord);
      setBestTime(storageService.getGameScore('minesweeper').bestScore);
    }
  };

  const toggleFlag = (r: number, c: number, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (isGameOver) return;
    const cell = grid[r][c];
    if (cell.isRevealed) return;

    soundService.playClick();
    const nextFlag = !cell.isFlagged;
    setGrid(prev =>
      prev.map((row, ri) =>
        row.map((cl, ci) => (ri === r && ci === c ? { ...cl, isFlagged: nextFlag } : cl))
      )
    );
    setMinesLeft(m => (nextFlag ? m - 1 : m + 1));
  };

  const getNumberColor = (num: number) => {
    switch (num) {
      case 1: return '#38bdf8'; // Blue
      case 2: return '#22c55e'; // Green
      case 3: return '#ff2a4b'; // Red
      case 4: return '#a855f7'; // Purple
      case 5: return '#f59e0b'; // Amber
      default: return '#ffb703';
    }
  };

  return (
    <ArcadeCabinetFrame
      title="MINESWEEPER PRO"
      subtitle="TACTICAL DEDUCTION"
      chassisId="MINE-SWP // 9x9 SECTOR"
      score={timeSeconds}
      bestScore={bestTime}
      scoreUnit="SEC"
      levelOrLivesLabel="MINES"
      levelOrLivesValue={minesLeft}
      multiplierOrCombo="SAFE: 100%"
      isPaused={false}
      onTogglePause={() => {}}
      onRestart={() => {
        soundService.playClick();
        initEmptyGrid();
      }}
      controlsHelp={[
        { key: 'CLICK', label: 'REVEAL' },
        { key: 'RIGHT-CLICK', label: 'FLAG 🚩' }
      ]}
    >
      <div className="relative w-full h-full flex flex-col items-center justify-center p-3 select-none">
        {/* Top Flag Mode Toggle Bar */}
        <div className="flex items-center justify-between w-full max-w-sm mb-2 px-1 text-neutral-300 font-mono-cyber text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#ff2a4b] font-bold">MINES: {minesLeft}</span>
            <span>•</span>
            <span className="text-[#ffb703] font-bold">TIME: {timeSeconds}s</span>
          </div>

          <button
            type="button"
            onClick={() => {
              soundService.playClick();
              setFlagMode(!flagMode);
            }}
            className={`px-3 py-1 rounded text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              flagMode
                ? 'bg-[#ff2a4b] text-white shadow-[0_0_10px_rgba(255,42,75,0.6)]'
                : 'bg-[#1c212d] text-neutral-300 border border-white/10'
            }`}
          >
            <span>🚩</span>
            <span>{flagMode ? 'FLAG MODE ON' : 'REVEAL MODE'}</span>
          </button>
        </div>

        {/* 9x9 Mine Grid */}
        <div className="grid grid-cols-9 gap-1 p-2 bg-[#090b0e] border border-white/10 rounded-xl shadow-inner w-full max-w-sm sm:max-w-md aspect-square">
          {grid.map((row, r) =>
            row.map((cell, c) => {
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  onClick={() => handleCellClick(r, c)}
                  onContextMenu={(e) => toggleFlag(r, c, e)}
                  className={`rounded flex items-center justify-center font-mono-cyber text-xs sm:text-sm font-bold transition-all cursor-pointer aspect-square ${
                    cell.isRevealed
                      ? cell.isMine
                        ? 'bg-[#ff2a4b] text-white shadow-[0_0_12px_rgba(255,42,75,0.8)]'
                        : 'bg-[#14171f] border border-white/5 text-white'
                      : 'bg-[#1c212d] hover:bg-[#252b3b] border border-white/10 active:scale-95 shadow-sm'
                  }`}
                  aria-label={`Row ${r} Col ${c}`}
                >
                  {cell.isRevealed ? (
                    cell.isMine ? (
                      '💣'
                    ) : cell.neighborMines > 0 ? (
                      <span style={{ color: getNumberColor(cell.neighborMines) }}>
                        {cell.neighborMines}
                      </span>
                    ) : null
                  ) : cell.isFlagged ? (
                    '🚩'
                  ) : null}
                </button>
              );
            })
          )}
        </div>

        <GameOverModal
          isOpen={isGameOver}
          score={timeSeconds}
          scoreUnit="SEC"
          isNewRecord={isNewRecord}
          previousBest={previousBest}
          customTitle={isWon ? 'PERIMETER CLEARED!' : 'CHARGE DETONATED'}
          onPlayAgain={initEmptyGrid}
        />
      </div>
    </ArcadeCabinetFrame>
  );
};

export default MinesweeperGame;

