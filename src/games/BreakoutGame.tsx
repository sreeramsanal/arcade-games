import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArcadeCabinetFrame } from '../components/ArcadeCabinetFrame';
import { TouchControls } from '../components/TouchControls';
import { GameOverModal } from '../components/GameOverModal';
import { storageService } from '../services/storageService';
import { soundService } from '../services/soundService';

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  points: number;
  alive: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
}

export const BreakoutGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [previousBest, setPreviousBest] = useState(0);
  const [isVictory, setIsVictory] = useState(false);

  const paddleRef = useRef({
    x: 230,
    y: 490,
    width: 80,
    height: 12,
    speed: 8,
    movingLeft: false,
    movingRight: false
  });

  const ballRef = useRef({
    x: 270,
    y: 470,
    vx: 4,
    vy: -4,
    radius: 6,
    stuckToPaddle: true
  });

  const bricksRef = useRef<Brick[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const isPausedRef = useRef(false);
  const isGameOverRef = useRef(false);

  useEffect(() => {
    const record = storageService.getGameScore('breakout');
    setBestScore(record.bestScore);
  }, []);

  const initBricks = useCallback((currentLevel: number) => {
    const bricks: Brick[] = [];
    const rows = 5;
    const cols = 8;
    const brickWidth = 56;
    const brickHeight = 16;
    const startX = 36;
    const startY = 60;
    const padding = 6;

    const rowColors = ['#ff2a4b', '#ff5260', '#ffb703', '#f59e0b', '#00f3ff'];
    const rowPoints = [150, 120, 90, 60, 40];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        bricks.push({
          x: startX + c * (brickWidth + padding),
          y: startY + r * (brickHeight + padding),
          width: brickWidth,
          height: brickHeight,
          color: rowColors[r % rowColors.length],
          points: rowPoints[r % rowPoints.length] * currentLevel,
          alive: true
        });
      }
    }
    bricksRef.current = bricks;
  }, []);

  const restartGame = useCallback(() => {
    soundService.playClick();
    paddleRef.current = {
      x: 230,
      y: 490,
      width: 80,
      height: 12,
      speed: 8,
      movingLeft: false,
      movingRight: false
    };
    ballRef.current = {
      x: 270,
      y: 470,
      vx: 4,
      vy: -4,
      radius: 6,
      stuckToPaddle: true
    };
    particlesRef.current = [];
    scoreRef.current = 0;
    livesRef.current = 3;
    isPausedRef.current = false;
    isGameOverRef.current = false;

    setScore(0);
    setLives(3);
    setLevel(1);
    setIsPaused(false);
    setIsGameOver(false);
    setIsNewRecord(false);
    setIsVictory(false);

    initBricks(1);
  }, [initBricks]);

  const togglePause = useCallback(() => {
    if (isGameOverRef.current) return;
    soundService.playClick();
    const next = !isPausedRef.current;
    isPausedRef.current = next;
    setIsPaused(next);
  }, []);

  const launchBall = useCallback(() => {
    if (ballRef.current.stuckToPaddle) {
      soundService.playBounce();
      ballRef.current.stuckToPaddle = false;
      const angle = (Math.random() * 0.4 - 0.2) + Math.PI * 1.5;
      const speed = 5.5;
      ballRef.current.vx = Math.cos(angle) * speed;
      ballRef.current.vy = Math.sin(angle) * speed;
    }
  }, []);

  const addShatterParticles = (x: number, y: number, color: string) => {
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 3 + 1;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        color,
        life: 0,
        maxLife: 15
      });
    }
  };

  // Keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'p' || e.key === 'P') {
        togglePause();
        return;
      }

      if (e.key === ' ' || e.key === 'Enter') {
        launchBall();
      }

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        paddleRef.current.movingLeft = true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        paddleRef.current.movingRight = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        paddleRef.current.movingLeft = false;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        paddleRef.current.movingRight = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [togglePause, launchBall]);

  // Mouse / Canvas Pointer movement
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    paddleRef.current.x = Math.max(10, Math.min(canvas.width - paddleRef.current.width - 10, mouseX - paddleRef.current.width / 2));
  };

  const handleTouchDirection = useCallback((dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (dir === 'LEFT') {
      paddleRef.current.x = Math.max(10, paddleRef.current.x - 35);
    } else if (dir === 'RIGHT') {
      paddleRef.current.x = Math.min(540 - paddleRef.current.width - 10, paddleRef.current.x + 35);
    } else if (dir === 'UP') {
      launchBall();
    }
  }, [launchBall]);

  // Main game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    initBricks(1);

    let animId: number;

    const tick = () => {
      animId = requestAnimationFrame(tick);

      if (!isPausedRef.current && !isGameOverRef.current) {
        updateGame();
      }

      render(ctx, canvas);
    };

    const updateGame = () => {
      const p = paddleRef.current;
      const b = ballRef.current;

      // Update paddle position via keyboard
      if (p.movingLeft) p.x -= p.speed;
      if (p.movingRight) p.x += p.speed;
      p.x = Math.max(10, Math.min(540 - p.width - 10, p.x));

      // Ball movement
      if (b.stuckToPaddle) {
        b.x = p.x + p.width / 2;
        b.y = p.y - b.radius - 2;
      } else {
        b.x += b.vx;
        b.y += b.vy;

        // Wall collisions
        if (b.x - b.radius <= 10) {
          b.x = 10 + b.radius;
          b.vx = Math.abs(b.vx);
          soundService.playBounce();
        } else if (b.x + b.radius >= 530) {
          b.x = 530 - b.radius;
          b.vx = -Math.abs(b.vx);
          soundService.playBounce();
        }

        if (b.y - b.radius <= 10) {
          b.y = 10 + b.radius;
          b.vy = Math.abs(b.vy);
          soundService.playBounce();
        }

        // Paddle Collision
        if (
          b.y + b.radius >= p.y &&
          b.y - b.radius <= p.y + p.height &&
          b.x >= p.x - b.radius &&
          b.x <= p.x + p.width + b.radius &&
          b.vy > 0
        ) {
          soundService.playBounce();
          // Calculate bounce angle based on strike point
          const hitPos = (b.x - (p.x + p.width / 2)) / (p.width / 2);
          const maxAngle = Math.PI / 3; // 60 degrees
          const angle = hitPos * maxAngle;
          const speed = Math.hypot(b.vx, b.vy);
          b.vx = speed * Math.sin(angle);
          b.vy = -speed * Math.cos(angle);
          b.y = p.y - b.radius - 1;
        }

        // Bottom boundary (Ball lost)
        if (b.y - b.radius > 540) {
          soundService.playGameOver();
          livesRef.current -= 1;
          setLives(livesRef.current);

          if (livesRef.current <= 0) {
            handleGameOver(false);
          } else {
            b.stuckToPaddle = true;
          }
        }

        // Brick Collisions
        let hitAny = false;
        bricksRef.current.forEach(brick => {
          if (!brick.alive) return;

          if (
            b.x + b.radius >= brick.x &&
            b.x - b.radius <= brick.x + brick.width &&
            b.y + b.radius >= brick.y &&
            b.y - b.radius <= brick.y + brick.height
          ) {
            brick.alive = false;
            hitAny = true;
            soundService.playScore();
            addShatterParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color);

            scoreRef.current += brick.points;
            setScore(scoreRef.current);

            // Determine collision edge
            const prevX = b.x - b.vx;
            if (prevX < brick.x || prevX > brick.x + brick.width) {
              b.vx = -b.vx;
            } else {
              b.vy = -b.vy;
            }
          }
        });

        // Check Victory (all bricks destroyed)
        if (hitAny && bricksRef.current.every(br => !br.alive)) {
          soundService.playSuccess();
          setIsVictory(true);
          handleGameOver(true);
        }
      }

      // Update particles
      particlesRef.current.forEach(pt => {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life += 1;
      });
      particlesRef.current = particlesRef.current.filter(pt => pt.life < pt.maxLife);
    };

    const handleGameOver = (won: boolean) => {
      isGameOverRef.current = true;
      setIsGameOver(true);
      const res = storageService.recordGameScore('breakout', scoreRef.current);
      setPreviousBest(res.previousBest);
      setIsNewRecord(res.isNewRecord);
      setBestScore(storageService.getGameScore('breakout').bestScore);
    };

    const render = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      const width = canvas.width;
      const height = canvas.height;

      // Dark Void Canvas
      ctx.fillStyle = '#090b0e';
      ctx.fillRect(0, 0, width, height);

      // Arena Outer Boundary
      ctx.strokeStyle = '#1c212d';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, width - 20, height - 20);

      // Render Bricks
      bricksRef.current.forEach(brick => {
        if (!brick.alive) return;
        ctx.fillStyle = brick.color;
        ctx.shadowColor = brick.color;
        ctx.shadowBlur = 8;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);

        // Highlight line on top edge
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(brick.x, brick.y, brick.width, 2);
      });
      ctx.shadowBlur = 0;

      // Render Particles
      particlesRef.current.forEach(pt => {
        const alpha = Math.max(0, 1 - pt.life / pt.maxLife);
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = alpha;
        ctx.fillRect(pt.x, pt.y, 3, 3);
      });
      ctx.globalAlpha = 1;

      // Render Paddle
      const p = paddleRef.current;
      ctx.fillStyle = '#ffb703';
      ctx.shadowColor = '#ffb703';
      ctx.shadowBlur = 12;
      ctx.fillRect(p.x, p.y, p.width, p.height);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(p.x + p.width * 0.2, p.y + 2, p.width * 0.6, 3);
      ctx.shadowBlur = 0;

      // Render Ball
      const b = ballRef.current;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Launch instruction if stuck
      if (b.stuckToPaddle) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PRESS SPACEBAR / TAP TO LAUNCH', width / 2, height / 2 + 60);
      }
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [initBricks]);

  return (
    <ArcadeCabinetFrame
      title="BREAKOUT 2000"
      subtitle="REFLEX FIREWALL"
      chassisId="PADDLE-REV4 // REBOUND MATRIX"
      score={score}
      bestScore={bestScore}
      scoreUnit="PTS"
      levelOrLivesLabel="LIVES"
      levelOrLivesValue={'❤️'.repeat(Math.max(0, lives))}
      multiplierOrCombo="COMBO 4X"
      isPaused={isPaused}
      onTogglePause={togglePause}
      onRestart={restartGame}
      controlsHelp={[
        { key: '← → / MOUSE', label: 'MOVE PADDLE' },
        { key: 'SPACE', label: 'LAUNCH BALL' },
        { key: 'P', label: 'PAUSE' }
      ]}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={540}
          height={540}
          onPointerMove={handlePointerMove}
          onClick={launchBall}
          className="max-w-full max-h-full aspect-square border border-[#ff2a4b]/20 cursor-ew-resize"
        />

        <GameOverModal
          isOpen={isGameOver}
          score={score}
          scoreUnit="PTS"
          isNewRecord={isNewRecord}
          previousBest={previousBest}
          customTitle={isVictory ? 'STAGE CLEARED!' : 'GAME OVER'}
          onPlayAgain={restartGame}
        />
      </div>

      <TouchControls
        onDirection={handleTouchDirection}
        onAction={launchBall}
        actionLabel="LAUNCH"
        secondaryAction={togglePause}
        secondaryLabel={isPaused ? 'RESUME' : 'PAUSE'}
      />
    </ArcadeCabinetFrame>
  );
};

export default BreakoutGame;

