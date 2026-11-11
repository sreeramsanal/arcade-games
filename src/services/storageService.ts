import { ArcadeStorageData, GameId, GameScoreRecord, DailyChallengeAttempt, ThemeMode } from '../types';

const STORAGE_KEY = 'pixel_arcade_storage_v1';

export const ALL_GAMES: GameId[] = [
  'snake',
  'space-shooter',
  'breakout',
  'pong',
  'memory-match',
  'minesweeper',
  '2048',
  'reaction-test'
];

function createDefaultScores(): Record<GameId, GameScoreRecord> {
  const scores: Partial<Record<GameId, GameScoreRecord>> = {};
  ALL_GAMES.forEach(id => {
    scores[id] = {
      bestScore: 0,
      lastScore: 0,
      gamesPlayed: 0,
      lastPlayed: '',
      history: []
    };
  });
  return scores as Record<GameId, GameScoreRecord>;
}

function getDefaultData(): ArcadeStorageData {
  return {
    version: 1,
    theme: 'dark',
    crtEnabled: false,
    audioMuted: false,
    playerTag: 'PLAYER AAA',
    scores: createDefaultScores(),
    dailyChallenge: {
      lastCompletedDate: null,
      completedDates: [],
      currentStreak: 0,
      bestStreak: 0,
      attempts: {}
    },
    unlockedAchievements: []
  };
}

class StorageService {
  private data: ArcadeStorageData;
  private listeners: Array<(data: ArcadeStorageData) => void> = [];

  constructor() {
    this.data = this.loadFromStorage();
  }

  private loadFromStorage(): ArcadeStorageData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return getDefaultData();

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || parsed.version !== 1) {
        return getDefaultData();
      }

      // Merge with default data in case new fields were added
      const defaults = getDefaultData();
      return {
        ...defaults,
        ...parsed,
        scores: {
          ...defaults.scores,
          ...(parsed.scores || {})
        },
        dailyChallenge: {
          ...defaults.dailyChallenge,
          ...(parsed.dailyChallenge || {})
        }
      };
    } catch (e) {
      console.warn('Failed to load arcade local storage data, using defaults', e);
      return getDefaultData();
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Failed to save arcade data to localStorage', e);
    }
    this.notify();
  }

  public subscribe(listener: (data: ArcadeStorageData) => void): () => void {
    this.listeners.push(listener);
    listener(this.data);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l(this.data));
  }

  public getData(): ArcadeStorageData {
    return this.data;
  }

  public getTheme(): ThemeMode {
    return this.data.theme;
  }

  public setTheme(theme: ThemeMode) {
    this.data.theme = theme;
    this.saveToStorage();
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }

  public getCrtEnabled(): boolean {
    return this.data.crtEnabled;
  }

  public setCrtEnabled(enabled: boolean) {
    this.data.crtEnabled = enabled;
    this.saveToStorage();
  }

  public toggleCrt(): boolean {
    const next = !this.data.crtEnabled;
    this.setCrtEnabled(next);
    return next;
  }

  public getPlayerTag(): string {
    return this.data.playerTag || 'PLAYER AAA';
  }

  public setPlayerTag(tag: string) {
    this.data.playerTag = tag.trim().slice(0, 12).toUpperCase() || 'PLAYER AAA';
    this.saveToStorage();
  }

  public getGameScore(gameId: GameId): GameScoreRecord {
    return this.data.scores[gameId] || {
      bestScore: 0,
      lastScore: 0,
      gamesPlayed: 0,
      lastPlayed: '',
      history: []
    };
  }

  public recordGameScore(gameId: GameId, score: number): { isNewRecord: boolean; previousBest: number } {
    const current = this.getGameScore(gameId);
    const previousBest = current.bestScore;
    
    // For reaction test, a lower ms time is better (if score > 0)
    let isNewRecord = false;
    if (gameId === 'reaction-test') {
      isNewRecord = previousBest === 0 || (score > 0 && score < previousBest);
    } else {
      isNewRecord = score > previousBest;
    }

    const newBest = isNewRecord ? score : (previousBest === 0 ? score : previousBest);

    const history = [
      { score, date: new Date().toISOString() },
      ...(current.history || [])
    ].slice(0, 20);

    this.data.scores[gameId] = {
      bestScore: newBest,
      lastScore: score,
      gamesPlayed: current.gamesPlayed + 1,
      lastPlayed: new Date().toISOString(),
      history
    };

    this.checkAchievements();
    this.saveToStorage();

    return { isNewRecord, previousBest };
  }

  public recordDailyChallengeAttempt(attempt: DailyChallengeAttempt) {
    const today = attempt.date;
    const currentStreak = this.calculateNewStreak(today);
    const newCompletedDates = Array.from(new Set([...this.data.dailyChallenge.completedDates, today])).sort();
    const bestStreak = Math.max(this.data.dailyChallenge.bestStreak, currentStreak);

    this.data.dailyChallenge = {
      lastCompletedDate: today,
      completedDates: newCompletedDates,
      currentStreak,
      bestStreak,
      attempts: {
        ...this.data.dailyChallenge.attempts,
        [today]: attempt
      }
    };

    this.checkAchievements();
    this.saveToStorage();
  }

  private calculateNewStreak(todayDateStr: string): number {
    const completed = new Set(this.data.dailyChallenge.completedDates);
    completed.add(todayDateStr);

    let streak = 0;
    const current = new Date(todayDateStr + 'T12:00:00'); // Use noon to avoid DST/tz issues

    while (true) {
      const yyyy = current.getFullYear();
      const mm = String(current.getMonth() + 1).padStart(2, '0');
      const dd = String(current.getDate()).padStart(2, '0');
      const key = `${yyyy}-${mm}-${dd}`;

      if (completed.has(key)) {
        streak++;
        // Move back 1 day
        current.setDate(current.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  public getTotalGamesPlayed(): number {
    return Object.values(this.data.scores).reduce((sum, g) => sum + g.gamesPlayed, 0);
  }

  public getTotalRecordsBroken(): number {
    return Object.values(this.data.scores).filter(g => g.bestScore > 0).length;
  }

  public getTotalXP(): number {
    let xp = 0;
    // XP from games played
    xp += this.getTotalGamesPlayed() * 50;
    // XP from daily challenges
    xp += (this.data.dailyChallenge.completedDates?.length || 0) * 250;
    // XP from personal bests
    Object.values(this.data.scores).forEach(s => {
      if (s.bestScore > 0) xp += 100;
    });
    return xp;
  }

  public getPlayerLevel(): { 
    level: number; 
    currentXP: number; 
    xpForNextLevel: number; 
    progressPercent: number;
    xpInLevel: number;
    xpNeededForNext: number;
    title: string;
  } {
    const xp = this.getTotalXP();
    const XP_PER_LEVEL = 1000;
    const level = Math.floor(xp / XP_PER_LEVEL) + 1;
    const currentXP = xp % XP_PER_LEVEL;
    const xpForNextLevel = XP_PER_LEVEL;
    const progressPercent = Math.min(100, Math.round((currentXP / xpForNextLevel) * 100));

    let title = 'ROOKIE OPERATOR';
    if (level === 2) title = 'CIRCUIT RUNNER';
    else if (level === 3) title = 'NEON SPECIALIST';
    else if (level === 4) title = 'ARCADE VETERAN';
    else if (level >= 5) title = 'LEGENDARY GRANDMASTER';

    return { 
      level, 
      currentXP, 
      xpForNextLevel, 
      progressPercent,
      xpInLevel: currentXP,
      xpNeededForNext: xpForNextLevel,
      title
    };
  }

  public checkAchievements(): string[] {
    const newlyUnlocked: string[] = [];
    const unlocked = new Set(this.data.unlockedAchievements || []);

    const testAndUnlock = (id: string, condition: boolean) => {
      if (condition && !unlocked.has(id)) {
        unlocked.add(id);
        newlyUnlocked.push(id);
      }
    };

    // First Coin
    testAndUnlock('FIRST_COIN', this.getTotalGamesPlayed() >= 1);
    // Snake Master
    testAndUnlock('SNAKE_MASTER', (this.data.scores.snake?.bestScore || 0) >= 1000);
    // Speed Demon
    testAndUnlock('SPEED_DEMON', (this.data.scores['reaction-test']?.bestScore || 9999) <= 250 && (this.data.scores['reaction-test']?.bestScore || 0) > 0);
    // Arcade Regular
    testAndUnlock('ARCADE_REGULAR', this.getTotalGamesPlayed() >= 10);
    // Centurion
    testAndUnlock('CENTURION', this.getTotalGamesPlayed() >= 50);
    // Space Ace
    testAndUnlock('SPACE_ACE', (this.data.scores['space-shooter']?.bestScore || 0) >= 2000);
    // Brick Breaker
    testAndUnlock('BRICK_BREAKER', (this.data.scores.breakout?.bestScore || 0) >= 1000);
    // Pong Champion
    testAndUnlock('PONG_CHAMP', (this.data.scores.pong?.bestScore || 0) >= 5);
    // Perfect Memory
    testAndUnlock('PERFECT_MEMORY', (this.data.scores['memory-match']?.bestScore || 9999) <= 45 && (this.data.scores['memory-match']?.bestScore || 0) > 0);
    // Minesweeper Defuser
    testAndUnlock('MINESWEEPER_DEFUSER', (this.data.scores.minesweeper?.bestScore || 0) > 0);
    // 2048 Singularity
    testAndUnlock('SINGULARITY_2048', (this.data.scores['2048']?.bestScore || 0) >= 1024);
    // 7 Day Streak
    testAndUnlock('7_DAY_STREAK', (this.data.dailyChallenge.bestStreak || 0) >= 7);

    this.data.unlockedAchievements = Array.from(unlocked);
    return newlyUnlocked;
  }

  public resetAllData() {
    this.data = getDefaultData();
    this.saveToStorage();
  }

  public clearAllData() {
    this.resetAllData();
  }

  public exportData(): string {
    return JSON.stringify(this.data, null, 2);
  }

  public exportJSON() {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(this.data, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `pixel-arcade-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
}

export const storageService = new StorageService();

