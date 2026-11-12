import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArcadeCabinetFrame } from '../components/ArcadeCabinetFrame';
import { TouchControls } from '../components/TouchControls';
import { GameOverModal } from '../components/GameOverModal';
import { storageService } from '../services/storageService';
import { soundService } from '../services/soundService';

const GRID_SIZE = 22; // 22 x 22 cells

interface Point {
  x: number;
  y: number;
}

export const SnakeGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [previousBest, setPreviousBest] = useState(0);

  // Snake state refs for the loop
  const snakeRef = useRef<Point[]>([
    { x: 10, y: 11 },
    { x: 9, y: 11 },
    { x: 8, y: 11 }
  ]);
  const dirRef = useRef<Point>({ x: 1, y: 0 });
  const nextDirRef = useRef<Point>({ x: 1, y: 0 });
  const foodRef = useRef<Point>({ x: 16, y: 11 });
  const bonusRef = useRef<{ point: Point; expires: number } | null>(null);
  const scoreRef = useRef(0);
  const isPausedRef = useRef(false);
  const isGameOverRef = useRef(false);

  // Load best score on mount
  useEffect(() => {
    const record = storageService.getGameScore('snake');
    setBestScore(record.bestScore);
  }, []);

  const spawnFood = useCallback(() => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1,
        y: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1
      };
      const onSnake = snakeRef.current.some(seg => seg.x === newFood.x && seg.y === newFood.y);
      if (!onSnake) break;
    }
    foodRef.current = newFood;
  }, []);

  const spawnBonus = useCallback(() => {
    if (Math.random() > 0.4) return;
    let newBonus: Point;
    while (true) {
      newBonus = {
        x: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1,
        y: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1
      };
      const onSnake = snakeRef.current.some(seg => seg.x === newBonus.x && seg.y === newBonus.y);
      const onFood = foodRef.current.x === newBonus.x && foodRef.current.y === newBonus.y;
      if (!onSnake && !onFood) break;
    }
    bonusRef.current = { point: newBonus, expires: Date.now() + 8000 };
  }, []);

  const restartGame = useCallback(() => {
    soundService.playClick();
    snakeRef.current = [
      { x: 10, y: 11 },
      { x: 9, y: 11 },
      { x: 8, y: 11 }
    ];
    dirRef.current = { x: 1, y: 0 };
    nextDirRef.current = { x: 1, y: 0 };
    scoreRef.current = 0;
    bonusRef.current = null;
    isPausedRef.current = false;
    isGameOverRef.current = false;
    setScore(0);
    setLevel(1);
    setIsPaused(false);
    setIsGameOver(false);
    setIsNewRecord(false);
    spawnFood();
  }, [spawnFood]);

  const togglePause = useCallback(() => {
    if (isGameOverRef.current) return;
    soundService.playClick();
    const nextPaused = !isPausedRef.current;
    isPausedRef.current = nextPaused;
    setIsPaused(nextPaused);
  }, []);

  const setDirection = useCallback((dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (isPausedRef.current || isGameOverRef.current) return;
    const current = dirRef.current;
    if (dir === 'UP' && current.y === 0) nextDirRef.current = { x: 0, y: -1 };
    if (dir === 'DOWN' && current.y === 0) nextDirRef.current = { x: 0, y: 1 };
    if (dir === 'LEFT' && current.x === 0) nextDirRef.current = { x: -1, y: 0 };
    if (dir === 'RIGHT' && current.x === 0) nextDirRef.current = { x: 1, y: 0 };
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'p' || e.key === 'P') {
        togglePause();
        return;
      }

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        setDirection('UP');
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        setDirection('DOWN');
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        setDirection('LEFT');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        setDirection('RIGHT');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setDirection, togglePause]);

  // Main game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    spawnFood();

    let lastTick = 0;
    let animId: number;

    const tick = (time: number) => {
      animId = requestAnimationFrame(tick);

      const currentLevel = Math.min(10, Math.floor(scoreRef.current / 300) + 1);
      setLevel(currentLevel);
      // Speed scales with level: from 140ms down to 60ms
      const speedMs = Math.max(60, 140 - (currentLevel - 1) * 8);

      if (!isPausedRef.current && !isGameOverRef.current) {
        if (time - lastTick >= speedMs) {
          lastTick = time;

          // Apply buffered direction
          dirRef.current = nextDirRef.current;
          const head = snakeRef.current[0];
          const newHead: Point = {
            x: head.x + dirRef.current.x,
            y: head.y + dirRef.current.y
          };

          // Collision with walls
          if (newHead.x <= 0 || newHead.x >= GRID_SIZE - 1 || newHead.y <= 0 || newHead.y >= GRID_SIZE - 1) {
            handleGameOver();
            return;
          }

          // Collision with self
          if (snakeRef.current.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
            handleGameOver();
            return;
          }

          // Move snake
          snakeRef.current.unshift(newHead);

          // Check food collision
          if (newHead.x === foodRef.current.x && newHead.y === foodRef.current.y) {
            soundService.playScore();
            const pointsGained = 100 * currentLevel;
            scoreRef.current += pointsGained;
            setScore(scoreRef.current);
            spawnFood();
            spawnBonus();
          } else if (
            bonusRef.current &&
            newHead.x === bonusRef.current.point.x &&
            newHead.y === bonusRef.current.point.y
          ) {
            soundService.playPowerup();
            const bonusPoints = 300 * currentLevel;
            scoreRef.current += bonusPoints;
            setScore(scoreRef.current);
            bonusRef.current = null;
          } else {
            snakeRef.current.pop();
          }
        }
      }

      // Check expired bonus
      if (bonusRef.current && Date.now() > bonusRef.current.expires) {
        bonusRef.current = null;
      }

      // Render Frame
      render(ctx, canvas);
    };

    const handleGameOver = () => {
      isGameOverRef.current = true;
      setIsGameOver(true);
      const res = storageService.recordGameScore('snake', scoreRef.current);
      setPreviousBest(res.previousBest);
      setIsNewRecord(res.isNewRecord);
      setBestScore(storageService.getGameScore('snake').bestScore);
    };

    const render = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      const width = canvas.width;
      const height = canvas.height;
      const cellSize = width / GRID_SIZE;

      // Dark Void Canvas
      ctx.fillStyle = '#090b0e';
      ctx.fillRect(0, 0, width, height);

      // Cyber Grid Lines
      ctx.strokeStyle = '#14171f';
      ctx.lineWidth = 1;
      for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(width, i * cellSize);
        ctx.stroke();
      }

      // Boundary Neon Wall
      ctx.strokeStyle = 'rgba(255, 42, 75, 0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(cellSize, cellSize, (GRID_SIZE - 2) * cellSize, (GRID_SIZE - 2) * cellSize);

      // Boundary corner crosshairs
      ctx.fillStyle = '#ff2a4b';
      const c = cellSize;
      const s = (GRID_SIZE - 2) * cellSize;
      ctx.fillRect(c - 2, c - 2, 4, 4);
      ctx.fillRect(c + s - 2, c - 2, 4, 4);
      ctx.fillRect(c - 2, c + s - 2, 4, 4);
      ctx.fillRect(c + s - 2, c + s - 2, 4, 4);

      // Render Food (Apple / Energy Node)
      const food = foodRef.current;
      const fx = food.x * cellSize;
      const fy = food.y * cellSize;
      ctx.fillStyle = '#ffb703';
      ctx.shadowColor = '#ffb703';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(fx + cellSize / 2, fy + cellSize / 2, cellSize * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(fx + cellSize / 2, fy + cellSize / 2, cellSize * 0.15, 0, Math.PI * 2);
      ctx.fill();

      // Render Bonus Gem if active
      if (bonusRef.current) {
        const bx = bonusRef.current.point.x * cellSize;
        const by = bonusRef.current.point.y * cellSize;
        ctx.fillStyle = '#ff2a4b';
        ctx.shadowColor = '#ff2a4b';
        ctx.shadowBlur = 14;
        ctx.fillRect(bx + 2, by + 2, cellSize - 4, cellSize - 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bx + cellSize / 4, by + cellSize / 4, cellSize / 2, cellSize / 2);
      }

      // Render Snake
      const snake = snakeRef.current;
      snake.forEach((seg, index) => {
        const sx = seg.x * cellSize;
        const sy = seg.y * cellSize;

        if (index === 0) {
          // Head
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#ff2a4b';
          ctx.shadowBlur = 16;
          ctx.fillRect(sx + 1, sy + 1, cellSize - 2, cellSize - 2);

          // Eyes
          ctx.fillStyle = '#090b0e';
          ctx.shadowBlur = 0;
          ctx.fillRect(sx + cellSize * 0.65, sy + cellSize * 0.2, 3, 3);
          ctx.fillRect(sx + cellSize * 0.65, sy + cellSize * 0.65, 3, 3);
        } else {
          // Body
          const alpha = Math.max(0.35, 1 - index / snake.length);
          ctx.fillStyle = `rgba(255, 42, 75, ${alpha})`;
          ctx.shadowColor = 'rgba(255, 42, 75, 0.5)';
          ctx.shadowBlur = 8;
          ctx.fillRect(sx + 1.5, sy + 1.5, cellSize - 3, cellSize - 3);
        }
      });
      ctx.shadowBlur = 0;
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [spawnFood, spawnBonus]);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!touchStartRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    touchStartRef.current = null;
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      setDirection(dx > 0 ? 'RIGHT' : 'LEFT');
    } else {
      setDirection(dy > 0 ? 'DOWN' : 'UP');
    }
  };

  return (
    <ArcadeCabinetFrame
      title="SNAKE MATRIX"
      subtitle="PROTOCOL 1997"
      chassisId="SNK-V1 // VECTOR ENGINE"
      score={score}
      bestScore={bestScore}
      scoreUnit="PTS"
      levelOrLivesLabel="SPEED"
      levelOrLivesValue={`LVL ${level}`}
      multiplierOrCombo={`x${level}.0 BOOST`}
      isPaused={isPaused}
      onTogglePause={togglePause}
      onRestart={restartGame}
      controlsHelp={[
        { key: 'WASD / ↑↓←→', label: 'STEER' },
        { key: 'P', label: 'PAUSE' },
        { key: 'R', label: 'RESTART' }
      ]}
      touchControls={
        <TouchControls
          onDirection={setDirection}
          onAction={togglePause}
          actionLabel={isPaused ? 'RESUME' : 'PAUSE'}
        />
      }
    >
      <div className="relative w-full h-full flex items-center justify-center p-1">
        <canvas
          ref={canvasRef}
          width={528}
          height={528}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="w-full h-full max-w-full max-h-full object-contain aspect-square border border-[#ff2a4b]/20 touch-none shadow-[0_0_15px_rgba(255,42,75,0.2)]"
        />

        <GameOverModal
          isOpen={isGameOver}
          score={score}
          scoreUnit="PTS"
          isNewRecord={isNewRecord}
          previousBest={previousBest}
          onPlayAgain={restartGame}
        />
      </div>
    </ArcadeCabinetFrame>
  );
};

export default SnakeGame;

