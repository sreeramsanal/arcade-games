export type ThemeMode = 'dark' | 'light';

export type GameId = 
  | 'snake'
  | 'space-shooter'
  | 'breakout'
  | 'pong'
  | 'memory-match'
  | 'minesweeper'
  | '2048'
  | 'reaction-test';

export type GameCategory = 'all' | 'classic' | 'action' | 'puzzle' | 'quick';

export interface GameInfo {
  id: GameId;
  title: string;
  subtitle: string;
  description: string;
  category: GameCategory;
  categoryNumber: string;
  categoryTag: string;
  tagColor: string;
  icon: string;
  fpsBadge: string;
  accentColor: string;
  unit: string;
  speedOrDiff: string;
}

export interface GameScoreRecord {
  bestScore: number;
  lastScore: number;
  gamesPlayed: number;
  lastPlayed: string; // ISO date
  history: Array<{
    score: number;
    date: string;
  }>;
}

export interface DailyChallengeAttempt {
  date: string; // YYYY-MM-DD
  score: number; // percentage or points e.g. 1000
  correctCount: number; // e.g. 8
  totalCount: number; // e.g. 8
  timeSeconds: number; // e.g. 3.8
  completed: boolean;
  userSequence?: number[];
}

export interface DailyChallengeData {
  lastCompletedDate: string | null;
  completedDates: string[]; // YYYY-MM-DD strings
  currentStreak: number;
  bestStreak: number;
  attempts: Record<string, DailyChallengeAttempt>; // keyed by date YYYY-MM-DD
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  requiredValue: number;
  currentValue: (data: ArcadeStorageData) => number;
  progressText: (data: ArcadeStorageData) => string;
  isUnlocked: (data: ArcadeStorageData) => boolean;
}

export interface ArcadeStorageData {
  version: number;
  theme: ThemeMode;
  crtEnabled: boolean;
  audioMuted: boolean;
  playerTag: string;
  scores: Record<GameId, GameScoreRecord>;
  dailyChallenge: DailyChallengeData;
  unlockedAchievements: string[];
}

