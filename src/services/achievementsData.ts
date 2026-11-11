import { Achievement, ArcadeStorageData } from '../types';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'FIRST_COIN',
    title: 'FIRST COIN',
    description: 'Play your first arcade game on any cabinet machine.',
    icon: 'toll',
    category: 'GENERAL',
    requiredValue: 1,
    currentValue: (data: ArcadeStorageData) => 
      Object.values(data.scores).reduce((sum, g) => sum + g.gamesPlayed, 0),
    progressText: (data: ArcadeStorageData) => {
      const played = Object.values(data.scores).reduce((sum, g) => sum + g.gamesPlayed, 0);
      return played >= 1 ? 'AWARDED: DAY 1' : '0 / 1 GAMES PLAYED';
    },
    isUnlocked: (data: ArcadeStorageData) => data.unlockedAchievements.includes('FIRST_COIN')
  },
  {
    id: 'SNAKE_MASTER',
    title: 'SNAKE MASTER',
    description: 'Achieve a score of 1,000+ PTS in Snake Matrix.',
    icon: 'all_inclusive',
    category: 'SNAKE',
    requiredValue: 1000,
    currentValue: (data: ArcadeStorageData) => data.scores.snake?.bestScore || 0,
    progressText: (data: ArcadeStorageData) => {
      const best = data.scores.snake?.bestScore || 0;
      return best >= 1000 ? `BEST RUN: ${best.toLocaleString()} PTS` : `${best.toLocaleString()} / 1,000 PTS`;
    },
    isUnlocked: (data: ArcadeStorageData) => data.unlockedAchievements.includes('SNAKE_MASTER')
  },
  {
    id: 'SPEED_DEMON',
    title: 'SPEED DEMON',
    description: 'Register a reaction time sub-250ms on synaptic test.',
    icon: 'speed',
    category: 'REACTION',
    requiredValue: 250,
    currentValue: (data: ArcadeStorageData) => data.scores['reaction-test']?.bestScore || 0,
    progressText: (data: ArcadeStorageData) => {
      const best = data.scores['reaction-test']?.bestScore || 0;
      return best > 0 && best <= 250 ? `RECORD: ${best} MS` : (best > 0 ? `CURRENT: ${best} MS (TARGET: < 250 MS)` : 'UNRANKED');
    },
    isUnlocked: (data: ArcadeStorageData) => data.unlockedAchievements.includes('SPEED_DEMON')
  },
  {
    id: 'ARCADE_REGULAR',
    title: 'ARCADE REGULAR',
    description: 'Log over 10 lifetime sessions in the arcade network.',
    icon: 'sports_esports',
    category: 'GENERAL',
    requiredValue: 10,
    currentValue: (data: ArcadeStorageData) => 
      Object.values(data.scores).reduce((sum, g) => sum + g.gamesPlayed, 0),
    progressText: (data: ArcadeStorageData) => {
      const total = Object.values(data.scores).reduce((sum, g) => sum + g.gamesPlayed, 0);
      return total >= 10 ? `STATUS: ${total} COMPLETED` : `${total} / 10 SESSIONS`;
    },
    isUnlocked: (data: ArcadeStorageData) => data.unlockedAchievements.includes('ARCADE_REGULAR')
  },
  {
    id: 'SPACE_ACE',
    title: 'SPACE ACE',
    description: 'Score 2,000+ points on Space Shooter invaders.',
    icon: 'rocket_launch',
    category: 'ACTION',
    requiredValue: 2000,
    currentValue: (data: ArcadeStorageData) => data.scores['space-shooter']?.bestScore || 0,
    progressText: (data: ArcadeStorageData) => {
      const best = data.scores['space-shooter']?.bestScore || 0;
      return best >= 2000 ? `BEST RUN: ${best.toLocaleString()} PTS` : `${best.toLocaleString()} / 2,000 PTS`;
    },
    isUnlocked: (data: ArcadeStorageData) => data.unlockedAchievements.includes('SPACE_ACE')
  },
  {
    id: 'BRICK_BREAKER',
    title: 'BRICK BREAKER',
    description: 'Score 1,000+ points in Breakout 2000.',
    icon: 'grid_view',
    category: 'ACTION',
    requiredValue: 1000,
    currentValue: (data: ArcadeStorageData) => data.scores.breakout?.bestScore || 0,
    progressText: (data: ArcadeStorageData) => {
      const best = data.scores.breakout?.bestScore || 0;
      return best >= 1000 ? `BEST RUN: ${best.toLocaleString()} PTS` : `${best.toLocaleString()} / 1,000 PTS`;
    },
    isUnlocked: (data: ArcadeStorageData) => data.unlockedAchievements.includes('BRICK_BREAKER')
  },
  {
    id: 'PONG_CHAMP',
    title: 'PONG CHAMPION',
    description: 'Defeat the Bushido AI in a paddle duel.',
    icon: 'sports_tennis',
    category: 'QUICK',
    requiredValue: 5,
    currentValue: (data: ArcadeStorageData) => data.scores.pong?.bestScore || 0,
    progressText: (data: ArcadeStorageData) => {
      const best = data.scores.pong?.bestScore || 0;
      return best >= 5 ? `VICTORIES: ${best} WINS` : `${best} / 5 PTS`;
    },
    isUnlocked: (data: ArcadeStorageData) => data.unlockedAchievements.includes('PONG_CHAMP')
  },
  {
    id: 'PERFECT_MEMORY',
    title: 'PERFECT MEMORY',
    description: 'Complete Memory Match in under 45 seconds.',
    icon: 'psychology',
    category: 'PUZZLE',
    requiredValue: 45,
    currentValue: (data: ArcadeStorageData) => data.scores['memory-match']?.bestScore || 0,
    progressText: (data: ArcadeStorageData) => {
      const best = data.scores['memory-match']?.bestScore || 0;
      return best > 0 && best <= 45 ? `BEST TIME: ${best} SEC` : (best > 0 ? `CURRENT: ${best} SEC (TARGET: < 45 SEC)` : 'UNRANKED');
    },
    isUnlocked: (data: ArcadeStorageData) => data.unlockedAchievements.includes('PERFECT_MEMORY')
  },
  {
    id: 'MINESWEEPER_DEFUSER',
    title: 'MINE DEFUSER',
    description: 'Clear a tactical cyber minefield safely.',
    icon: 'flag',
    category: 'PUZZLE',
    requiredValue: 1,
    currentValue: (data: ArcadeStorageData) => data.scores.minesweeper?.bestScore || 0,
    progressText: (data: ArcadeStorageData) => {
      const best = data.scores.minesweeper?.bestScore || 0;
      return best > 0 ? `DEFUSED IN: ${best} SEC` : 'NO CLEARED FIELDS';
    },
    isUnlocked: (data: ArcadeStorageData) => data.unlockedAchievements.includes('MINESWEEPER_DEFUSER')
  },
  {
    id: 'SINGULARITY_2048',
    title: '2048 SINGULARITY',
    description: 'Merge cyber matrix tiles to reach 1024 or higher.',
    icon: 'shapes',
    category: 'PUZZLE',
    requiredValue: 1024,
    currentValue: (data: ArcadeStorageData) => data.scores['2048']?.bestScore || 0,
    progressText: (data: ArcadeStorageData) => {
      const best = data.scores['2048']?.bestScore || 0;
      return best >= 1024 ? `MAX REACHED: ${best} PTS` : `${best} / 1024 PTS`;
    },
    isUnlocked: (data: ArcadeStorageData) => data.unlockedAchievements.includes('SINGULARITY_2048')
  },
  {
    id: '7_DAY_STREAK',
    title: '7 DAY STREAK',
    description: 'Execute consecutive daily quests for seven cycles.',
    icon: 'local_fire_department',
    category: 'QUESTS',
    requiredValue: 7,
    currentValue: (data: ArcadeStorageData) => data.dailyChallenge?.bestStreak || 0,
    progressText: (data: ArcadeStorageData) => {
      const streak = data.dailyChallenge?.bestStreak || 0;
      return streak >= 7 ? `ACTIVE RECORD: ${streak} DAYS` : `${streak} / 7 DAYS`;
    },
    isUnlocked: (data: ArcadeStorageData) => data.unlockedAchievements.includes('7_DAY_STREAK')
  },
  {
    id: 'CENTURION',
    title: 'CENTURION',
    description: 'Surpass 50 individual sessions across any arcade unit.',
    icon: 'lock',
    category: 'GENERAL',
    requiredValue: 50,
    currentValue: (data: ArcadeStorageData) => 
      Object.values(data.scores).reduce((sum, g) => sum + g.gamesPlayed, 0),
    progressText: (data: ArcadeStorageData) => {
      const total = Object.values(data.scores).reduce((sum, g) => sum + g.gamesPlayed, 0);
      return total >= 50 ? `COMPLETED: ${total} RUNS` : `${total} / 50 RUNS`;
    },
    isUnlocked: (data: ArcadeStorageData) => data.unlockedAchievements.includes('CENTURION')
  }
];

