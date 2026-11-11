import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArcadeCabinetFrame } from '../components/ArcadeCabinetFrame';
import { TouchControls } from '../components/TouchControls';
import { GameOverModal } from '../components/GameOverModal';
import { storageService } from '../services/storageService';
import { soundService } from '../services/soundService';

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  color: string;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isEnemy: boolean;
}

interface Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  speed: number;
  type: 'drone' | 'scout' | 'titan';
  scoreValue: number;
  lastShot: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

export const SpaceShooterGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [previousBest, setPreviousBest] = useState(0);

  // Mutable game loop references
  const playerRef = useRef({
    x: 270,
    y: 460,
    width: 32,
    height: 36,
    speed: 6,
    movingLeft: false,
    movingRight: false,
    movingUp: false,
    movingDown: false,
    isFiring: false,
    lastFired: 0,
    invulnerableUntil: 0
  });

  const starsRef = useRef<Star[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const waveRef = useRef(1);
  const isPausedRef = useRef(false);
  const isGameOverRef = useRef(false);

  useEffect(() => {
    const record = storageService.getGameScore('space-shooter');
    setBestScore(record.bestScore);

    // Initialize starfield
    const stars: Star[] = [];
    for (let i = 0; i < 60; i++) {
      stars.push({
        x: Math.random() * 540,
        y: Math.random() * 540,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 2 + 0.5,
        color: Math.random() > 0.3 ? '#ffffff' : '#ff2a4b'
      });
    }
    starsRef.current = stars;
  }, []);

  const spawnEnemyWave = useCallback((currentWave: number) => {
    const enemies: Enemy[] = [];
    const count = 4 + currentWave * 2;
    for (let i = 0; i < count; i++) {
      const typeRand = Math.random();
      const type: 'drone' | 'scout' | 'titan' =
        typeRand > 0.8 && currentWave > 1 ? 'titan' : typeRand > 0.4 ? 'scout' : 'drone';

      const width = type === 'titan' ? 44 : type === 'scout' ? 28 : 22;
      const height = type === 'titan' ? 36 : type === 'scout' ? 24 : 20;
      const hp = type === 'titan' ? 4 : type === 'scout' ? 2 : 1;
      const speed = type === 'titan' ? 0.8 : type === 'scout' ? 1.5 : 1.2;

      enemies.push({
        x: (i % 6) * 80 + 30,
        y: -Math.floor(i / 6) * 50 - 40,
        width,
        height,
        hp,
        maxHp: hp,
        speed,
        type,
        scoreValue: type === 'titan' ? 300 : type === 'scout' ? 150 : 80,
        lastShot: Date.now() + Math.random() * 2000
      });
    }
    enemiesRef.current = enemies;
  }, []);

  const restartGame = useCallback(() => {
    soundService.playClick();
    playerRef.current = {
      x: 270,
      y: 460,
      width: 32,
      height: 36,
      speed: 6,
      movingLeft: false,
      movingRight: false,
      movingUp: false,
      movingDown: false,
      isFiring: false,
      lastFired: 0,
      invulnerableUntil: 0
    };
    projectilesRef.current = [];
    particlesRef.current = [];
    scoreRef.current = 0;
    livesRef.current = 3;
    waveRef.current = 1;
    isPausedRef.current = false;
    isGameOverRef.current = false;

    setScore(0);
    setLives(3);
    setWave(1);
    setIsPaused(false);
    setIsGameOver(false);
    setIsNewRecord(false);

    spawnEnemyWave(1);
  }, [spawnEnemyWave]);

  const togglePause = useCallback(() => {
    if (isGameOverRef.current) return;
    soundService.playClick();
    const next = !isPausedRef.current;
    isPausedRef.current = next;
    setIsPaused(next);
  }, []);

  const addExplosion = (x: number, y: number, color: string, count = 12) => {
    soundService.playExplosion();
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 4 + 1;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 0,
        maxLife: Math.floor(Math.random() * 18 + 10),
        color
      });
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'p' || e.key === 'P') {
        togglePause();
        return;
      }

      const p = playerRef.current;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') p.movingLeft = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') p.movingRight = true;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') p.movingUp = true;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') p.movingDown = true;
      if (e.key === ' ' || e.key === 'Enter') p.isFiring = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const p = playerRef.current;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') p.movingLeft = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') p.movingRight = false;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') p.movingUp = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') p.movingDown = false;
      if (e.key === ' ' || e.key === 'Enter') p.isFiring = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [togglePause]);

  // Touch Direction Helpers
  const handleTouchDirection = useCallback((dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    const p = playerRef.current;
    if (dir === 'LEFT') p.x = Math.max(20, p.x - 30);
    if (dir === 'RIGHT') p.x = Math.min(500, p.x + 30);
    if (dir === 'UP') p.y = Math.max(100, p.y - 30);
    if (dir === 'DOWN') p.y = Math.min(480, p.y + 30);
  }, []);

  const handleTouchFire = useCallback(() => {
    const now = Date.now();
    const p = playerRef.current;
    if (now - p.lastFired > 180) {
      p.lastFired = now;
      soundService.playLaser();
      projectilesRef.current.push({
        x: p.x - 8,
        y: p.y - 10,
        vx: 0,
        vy: -9,
        isEnemy: false
      });
      projectilesRef.current.push({
        x: p.x + 8,
        y: p.y - 10,
        vx: 0,
        vy: -9,
        isEnemy: false
      });
    }
  }, []);

  // Main game tick
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    spawnEnemyWave(1);

    let animId: number;

    const tick = () => {
      animId = requestAnimationFrame(tick);

      if (!isPausedRef.current && !isGameOverRef.current) {
        updateGame();
      }

      render(ctx, canvas);
    };

    const updateGame = () => {
      const now = Date.now();
      const p = playerRef.current;

      // Player Movement
      if (p.movingLeft) p.x -= p.speed;
      if (p.movingRight) p.x += p.speed;
      if (p.movingUp) p.y -= p.speed;
      if (p.movingDown) p.y += p.speed;

      // Bounds check
      p.x = Math.max(20, Math.min(520, p.x));
      p.y = Math.max(100, Math.min(500, p.y));

      // Player Fire
      if (p.isFiring && now - p.lastFired > 180) {
        p.lastFired = now;
        soundService.playLaser();
        projectilesRef.current.push({
          x: p.x - 8,
          y: p.y - 10,
          vx: 0,
          vy: -9,
          isEnemy: false
        });
        projectilesRef.current.push({
          x: p.x + 8,
          y: p.y - 10,
          vx: 0,
          vy: -9,
          isEnemy: false
        });
      }

      // Update Starfield
      starsRef.current.forEach(star => {
        star.y += star.speed;
        if (star.y > 540) {
          star.y = 0;
          star.x = Math.random() * 540;
        }
      });

      // Update Projectiles
      projectilesRef.current.forEach(proj => {
        proj.x += proj.vx;
        proj.y += proj.vy;
      });
      projectilesRef.current = projectilesRef.current.filter(
        proj => proj.y > -20 && proj.y < 560
      );

      // Update Enemies
      enemiesRef.current.forEach(enemy => {
        enemy.y += enemy.speed;

        // Enemy AI firing
        if (enemy.y > 40 && enemy.y < 380 && now - enemy.lastShot > 2400) {
          enemy.lastShot = now;
          projectilesRef.current.push({
            x: enemy.x + enemy.width / 2,
            y: enemy.y + enemy.height,
            vx: (Math.random() - 0.5) * 1.5,
            vy: 4.5,
            isEnemy: true
          });
        }
      });

      // Check wave clear
      if (enemiesRef.current.length === 0) {
        waveRef.current += 1;
        setWave(waveRef.current);
        soundService.playSuccess();
        spawnEnemyWave(waveRef.current);
      }

      // Projectile vs Enemy collisions
      projectilesRef.current.forEach((proj, pIdx) => {
        if (proj.isEnemy) return;

        enemiesRef.current.forEach((enemy, eIdx) => {
          if (
            proj.x >= enemy.x &&
            proj.x <= enemy.x + enemy.width &&
            proj.y >= enemy.y &&
            proj.y <= enemy.y + enemy.height
          ) {
            // Hit enemy
            enemy.hp -= 1;
            proj.y = -999; // mark for removal

            if (enemy.hp <= 0) {
              addExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ffb703', 14);
              scoreRef.current += enemy.scoreValue;
              setScore(scoreRef.current);
              enemiesRef.current.splice(eIdx, 1);
            } else {
              soundService.playBounce();
              addExplosion(proj.x, proj.y, '#ffffff', 4);
            }
          }
        });
      });

      // Enemy / Projectile vs Player collision
      const isInvulnerable = now < p.invulnerableUntil;
      if (!isInvulnerable) {
        // Check enemy projectiles
        projectilesRef.current.forEach(proj => {
          if (!proj.isEnemy) return;
          const dist = Math.hypot(proj.x - p.x, proj.y - p.y);
          if (dist < 18) {
            proj.y = 999;
            hitPlayer();
          }
        });

        // Check enemy ship collision
        enemiesRef.current.forEach((enemy, eIdx) => {
          const dist = Math.hypot(enemy.x + enemy.width / 2 - p.x, enemy.y + enemy.height / 2 - p.y);
          if (dist < 26) {
            enemiesRef.current.splice(eIdx, 1);
            addExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ff2a4b', 16);
            hitPlayer();
          }
        });
      }

      // Check enemies that reached bottom
      enemiesRef.current = enemiesRef.current.filter(enemy => {
        if (enemy.y > 540) {
          hitPlayer();
          return false;
        }
        return true;
      });

      // Update Particles
      particlesRef.current.forEach(pt => {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life += 1;
      });
      particlesRef.current = particlesRef.current.filter(pt => pt.life < pt.maxLife);
    };

    const hitPlayer = () => {
      const p = playerRef.current;
      addExplosion(p.x, p.y, '#ff2a4b', 20);
      livesRef.current -= 1;
      setLives(livesRef.current);

      if (livesRef.current <= 0) {
        handleGameOver();
      } else {
        p.invulnerableUntil = Date.now() + 2000;
        soundService.playGameOver();
      }
    };

    const handleGameOver = () => {
      isGameOverRef.current = true;
      setIsGameOver(true);
      const res = storageService.recordGameScore('space-shooter', scoreRef.current);
      setPreviousBest(res.previousBest);
      setIsNewRecord(res.isNewRecord);
      setBestScore(storageService.getGameScore('space-shooter').bestScore);
    };

    const render = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      const width = canvas.width;
      const height = canvas.height;

      // Deep Void Space
      ctx.fillStyle = '#090b0e';
      ctx.fillRect(0, 0, width, height);

      // Starfield
      starsRef.current.forEach(star => {
        ctx.fillStyle = star.color;
        ctx.fillRect(star.x, star.y, star.size, star.size);
      });

      // Render Enemies
      enemiesRef.current.forEach(enemy => {
        ctx.save();
        ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);

        if (enemy.type === 'titan') {
          // Boss Titan Ship
          ctx.fillStyle = '#ff2a4b';
          ctx.shadowColor = '#ff2a4b';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.moveTo(0, 16);
          ctx.lineTo(-20, -14);
          ctx.lineTo(20, -14);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#ffb703';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Core Eye
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, -2, 5, 0, Math.PI * 2);
          ctx.fill();
        } else if (enemy.type === 'scout') {
          // Scout Ship
          ctx.fillStyle = '#ff5260';
          ctx.shadowColor = '#ff5260';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(0, 12);
          ctx.lineTo(-14, -10);
          ctx.lineTo(0, -4);
          ctx.lineTo(14, -10);
          ctx.closePath();
          ctx.fill();
        } else {
          // Drone Invader
          ctx.fillStyle = '#ffb703';
          ctx.shadowColor = '#ffb703';
          ctx.shadowBlur = 6;
          ctx.fillRect(-10, -8, 20, 16);
          ctx.fillStyle = '#090b0e';
          ctx.fillRect(-5, -2, 3, 4);
          ctx.fillRect(2, -2, 3, 4);
        }
        ctx.restore();
      });

      // Render Projectiles
      projectilesRef.current.forEach(proj => {
        ctx.save();
        if (proj.isEnemy) {
          ctx.fillStyle = '#ff2a4b';
          ctx.shadowColor = '#ff2a4b';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, 3.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#00f3ff';
          ctx.shadowBlur = 10;
          ctx.fillRect(proj.x - 1.5, proj.y - 8, 3, 14);
        }
        ctx.restore();
      });

      // Render Particles
      particlesRef.current.forEach(pt => {
        const alpha = Math.max(0, 1 - pt.life / pt.maxLife);
        ctx.fillStyle = pt.color;
        ctx.globalAlpha = alpha;
        ctx.fillRect(pt.x, pt.y, 2.5, 2.5);
      });
      ctx.globalAlpha = 1;

      // Render Player Ship
      const p = playerRef.current;
      const isInvulnerable = Date.now() < p.invulnerableUntil;
      const blink = isInvulnerable && Math.floor(Date.now() / 100) % 2 === 0;

      if (!blink) {
        ctx.save();
        ctx.translate(p.x, p.y);

        // Jet Engine Exhaust Flame
        ctx.fillStyle = '#ffb703';
        ctx.shadowColor = '#ffb703';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(-6, 14);
        ctx.lineTo(0, 22 + Math.random() * 6);
        ctx.lineTo(6, 14);
        ctx.closePath();
        ctx.fill();

        // Player Wings
        ctx.fillStyle = '#ffb703';
        ctx.shadowColor = '#ffb703';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(16, 12);
        ctx.lineTo(0, 6);
        ctx.lineTo(-16, 12);
        ctx.closePath();
        ctx.fill();

        // Ship Cockpit Core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(0, -14);
        ctx.lineTo(6, 4);
        ctx.lineTo(-6, 4);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [spawnEnemyWave]);

  return (
    <ArcadeCabinetFrame
      title="SPACE SHOOTER"
      subtitle="VECTOR 84"
      chassisId="SHMUP-TITAN // SHIELDED"
      score={score}
      bestScore={bestScore}
      scoreUnit="PTS"
      levelOrLivesLabel="LIVES"
      levelOrLivesValue={'❤️'.repeat(Math.max(0, lives))}
      multiplierOrCombo={`WAVE ${wave}`}
      isPaused={isPaused}
      onTogglePause={togglePause}
      onRestart={restartGame}
      controlsHelp={[
        { key: 'A/D / ←→', label: 'MOVE' },
        { key: 'SPACE', label: 'FIRE' },
        { key: 'P', label: 'PAUSE' }
      ]}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={540}
          height={540}
          className="max-w-full max-h-full aspect-square border border-[#ff2a4b]/20"
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

      <TouchControls
        onDirection={handleTouchDirection}
        onAction={handleTouchFire}
        actionLabel="FIRE"
        secondaryAction={togglePause}
        secondaryLabel={isPaused ? 'RESUME' : 'PAUSE'}
      />
    </ArcadeCabinetFrame>
  );
};

export default SpaceShooterGame;

