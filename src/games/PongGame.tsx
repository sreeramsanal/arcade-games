import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArcadeCabinetFrame } from '../components/ArcadeCabinetFrame';
import { TouchControls } from '../components/TouchControls';
import { GameOverModal } from '../components/GameOverModal';
import { storageService } from '../services/storageService';
import { soundService } from '../services/soundService';

export const PongGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [previousBest, setPreviousBest] = useState(0);
  const [isVictory, setIsVictory] = useState(false);

  const playerPaddleRef = useRef({
    x: 24,
    y: 220,
    width: 10,
    height: 70,
    speed: 7,
    movingUp: false,
    movingDown: false
  });

  const aiPaddleRef = useRef({
    x: 506,
    y: 220,
    width: 10,
    height: 70,
    speed: 4.8
  });

  const ballRef = useRef({
    x: 270,
    y: 270,
    vx: 4.5,
    vy: 2.5,
    size: 8,
    speedMultiplier: 1.0
  });

  const playerScoreRef = useRef(0);
  const aiScoreRef = useRef(0);
  const isPausedRef = useRef(false);
  const isGameOverRef = useRef(false);

  useEffect(() => {
    const record = storageService.getGameScore('pong');
    setBestStreak(record.bestScore);
  }, []);

  const resetBall = (directionToPlayer: boolean) => {
    ballRef.current = {
      x: 270,
      y: 270,
      vx: (directionToPlayer ? -1 : 1) * 4.5,
      vy: (Math.random() * 4 - 2),
      size: 8,
      speedMultiplier: 1.0
    };
  };

  const restartGame = useCallback(() => {
    soundService.playClick();
    playerScoreRef.current = 0;
    aiScoreRef.current = 0;
    isPausedRef.current = false;
    isGameOverRef.current = false;

    setPlayerScore(0);
    setAiScore(0);
    setIsPaused(false);
    setIsGameOver(false);
    setIsNewRecord(false);
    setIsVictory(false);

    resetBall(Math.random() > 0.5);
  }, []);

  const togglePause = useCallback(() => {
    if (isGameOverRef.current) return;
    soundService.playClick();
    const next = !isPausedRef.current;
    isPausedRef.current = next;
    setIsPaused(next);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'w', 's'].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === 'p' || e.key === 'P') {
        togglePause();
        return;
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        playerPaddleRef.current.movingUp = true;
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        playerPaddleRef.current.movingDown = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        playerPaddleRef.current.movingUp = false;
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        playerPaddleRef.current.movingDown = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [togglePause]);

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleY = canvas.height / rect.height;
    const mouseY = (e.clientY - rect.top) * scaleY;
    playerPaddleRef.current.y = Math.max(10, Math.min(canvas.height - playerPaddleRef.current.height - 10, mouseY - playerPaddleRef.current.height / 2));
  };

  const handleTouchDirection = useCallback((dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    const p = playerPaddleRef.current;
    if (dir === 'UP') p.y = Math.max(10, p.y - 40);
    if (dir === 'DOWN') p.y = Math.min(540 - p.height - 10, p.y + 40);
  }, []);

  // Main loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    resetBall(true);

    let animId: number;

    const tick = () => {
      animId = requestAnimationFrame(tick);

      if (!isPausedRef.current && !isGameOverRef.current) {
        updateGame();
      }

      render(ctx, canvas);
    };

    const updateGame = () => {
      const p = playerPaddleRef.current;
      const ai = aiPaddleRef.current;
      const b = ballRef.current;

      // Player Movement
      if (p.movingUp) p.y -= p.speed;
      if (p.movingDown) p.y += p.speed;
      p.y = Math.max(10, Math.min(540 - p.height - 10, p.y));

      // AI Movement (tracks ball with smoothing)
      const aiCenter = ai.y + ai.height / 2;
      const targetY = b.y;
      if (Math.abs(aiCenter - targetY) > 8) {
        if (aiCenter < targetY) {
          ai.y += ai.speed;
        } else {
          ai.y -= ai.speed;
        }
      }
      ai.y = Math.max(10, Math.min(540 - ai.height - 10, ai.y));

      // Ball Movement
      b.x += b.vx * b.speedMultiplier;
      b.y += b.vy * b.speedMultiplier;

      // Top / Bottom Wall Collision
      if (b.y <= 10) {
        b.y = 10;
        b.vy = Math.abs(b.vy);
        soundService.playBounce();
      } else if (b.y >= 530) {
        b.y = 530;
        b.vy = -Math.abs(b.vy);
        soundService.playBounce();
      }

      // Player Paddle Collision
      if (
        b.x - b.size / 2 <= p.x + p.width &&
        b.x + b.size / 2 >= p.x &&
        b.y >= p.y - 4 &&
        b.y <= p.y + p.height + 4 &&
        b.vx < 0
      ) {
        soundService.playBounce();
        b.vx = Math.abs(b.vx);
        b.speedMultiplier = Math.min(1.8, b.speedMultiplier + 0.05);

        // Adjust angle
        const hitOffset = (b.y - (p.y + p.height / 2)) / (p.height / 2);
        b.vy = hitOffset * 4.5;
      }

      // AI Paddle Collision
      if (
        b.x + b.size / 2 >= ai.x &&
        b.x - b.size / 2 <= ai.x + ai.width &&
        b.y >= ai.y - 4 &&
        b.y <= ai.y + ai.height + 4 &&
        b.vx > 0
      ) {
        soundService.playBounce();
        b.vx = -Math.abs(b.vx);
        b.speedMultiplier = Math.min(1.8, b.speedMultiplier + 0.05);

        const hitOffset = (b.y - (ai.y + ai.height / 2)) / (ai.height / 2);
        b.vy = hitOffset * 4.5;
      }

      // Score Points
      if (b.x < -10) {
        // AI scores
        soundService.playGameOver();
        aiScoreRef.current += 1;
        setAiScore(aiScoreRef.current);
        resetBall(true);

        if (aiScoreRef.current >= 5) {
          handleGameOver(false);
        }
      } else if (b.x > 550) {
        // Player scores
        soundService.playScore();
        playerScoreRef.current += 1;
        setPlayerScore(playerScoreRef.current);
        resetBall(false);

        if (playerScoreRef.current >= 5) {
          handleGameOver(true);
        }
      }
    };

    const handleGameOver = (won: boolean) => {
      isGameOverRef.current = true;
      setIsGameOver(true);
      setIsVictory(won);

      const scoreToRecord = won ? playerScoreRef.current : 0;
      const res = storageService.recordGameScore('pong', scoreToRecord);
      setPreviousBest(res.previousBest);
      setIsNewRecord(res.isNewRecord);
      setBestStreak(storageService.getGameScore('pong').bestScore);
    };

    const render = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      const width = canvas.width;
      const height = canvas.height;

      // Dark Void Canvas
      ctx.fillStyle = '#090b0e';
      ctx.fillRect(0, 0, width, height);

      // Arena Outer Border
      ctx.strokeStyle = '#1c212d';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, width - 20, height - 20);

      // Center Dashed Dividing Line
      ctx.strokeStyle = '#2c3345';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(width / 2, 10);
      ctx.lineTo(width / 2, height - 10);
      ctx.stroke();
      ctx.setLineDash([]);

      // Scores Display on Court
      ctx.font = 'bold 36px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffb703';
      ctx.fillText(String(playerScoreRef.current).padStart(2, '0'), width / 2 - 60, 70);
      ctx.fillStyle = '#ff2a4b';
      ctx.fillText(String(aiScoreRef.current).padStart(2, '0'), width / 2 + 60, 70);

      // Player Paddle (Left, Cyan/Gold)
      const p = playerPaddleRef.current;
      ctx.fillStyle = '#ffb703';
      ctx.shadowColor = '#ffb703';
      ctx.shadowBlur = 12;
      ctx.fillRect(p.x, p.y, p.width, p.height);

      // AI Paddle (Right, Crimson)
      const ai = aiPaddleRef.current;
      ctx.fillStyle = '#ff2a4b';
      ctx.shadowColor = '#ff2a4b';
      ctx.shadowBlur = 12;
      ctx.fillRect(ai.x, ai.y, ai.width, ai.height);
      ctx.shadowBlur = 0;

      // Ball
      const b = ballRef.current;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 14;
      ctx.fillRect(b.x - b.size / 2, b.y - b.size / 2, b.size, b.size);
      ctx.shadowBlur = 0;

      // Bottom Player Tags
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.fillStyle = '#ffb703';
      ctx.textAlign = 'left';
      ctx.fillText('PILOT [P1]', 24, height - 20);

      ctx.fillStyle = '#ff2a4b';
      ctx.textAlign = 'right';
      ctx.fillText('AI: BUSHIDO', width - 24, height - 20);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <ArcadeCabinetFrame
      title="PONG AI DUEL"
      subtitle="ORIGINAL DIGITAL DUEL"
      chassisId="PONG-CLASSIC // 1972 CHIPS"
      score={playerScore}
      bestScore={bestStreak}
      scoreUnit="WINS"
      levelOrLivesLabel="AI OPPONENT"
      levelOrLivesValue="BUSHIDO"
      multiplierOrCombo="FIRST TO 5"
      isPaused={isPaused}
      onTogglePause={togglePause}
      onRestart={restartGame}
      controlsHelp={[
        { key: 'W/S / MOUSE', label: 'MOVE PADDLE' },
        { key: 'P', label: 'PAUSE' }
      ]}
      touchControls={
        <TouchControls
          onDirection={handleTouchDirection}
          onAction={togglePause}
          actionLabel={isPaused ? 'RESUME' : 'PAUSE'}
        />
      }
    >
      <div className="relative w-full h-full flex items-center justify-center p-1">
        <canvas
          ref={canvasRef}
          width={540}
          height={540}
          onPointerMove={handlePointerMove}
          className="w-full h-full max-w-full max-h-full object-contain aspect-square border border-[#ff2a4b]/20 cursor-ns-resize touch-none shadow-[0_0_15px_rgba(255,42,75,0.2)]"
        />

        <GameOverModal
          isOpen={isGameOver}
          score={playerScore}
          scoreUnit="PTS"
          isNewRecord={isNewRecord}
          previousBest={previousBest}
          customTitle={isVictory ? 'MATCH VICTORY!' : 'MATCH DEFEAT'}
          onPlayAgain={restartGame}
        />
      </div>
    </ArcadeCabinetFrame>
  );
};

export default PongGame;

