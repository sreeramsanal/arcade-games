export interface DailyChallengePuzzle {
  date: string; // YYYY-MM-DD
  dayNumber: number; // e.g. Day 042 (days since Jan 1, 2025 or similar baseline)
  title: string;
  subtitle: string;
  sequence: number[]; // 8 distinct 2-digit numbers
  memorizeSeconds: number; // 5 seconds
}

// Simple deterministic seeded pseudorandom number generator
function createRng(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getTodayDateString(d: Date = new Date()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getDayNumber(d: Date = new Date()): number {
  // Baseline date: Jan 1, 2025
  const base = new Date('2025-01-01T00:00:00');
  const diffTime = d.getTime() - base.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays + 1);
}

export function getDailyChallengeForDate(dateStr: string): DailyChallengePuzzle {
  const parts = dateStr.split('-').map(Number);
  const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
  const seed = parts[0] * 10000 + parts[1] * 100 + parts[2];
  const rng = createRng(seed);

  // Generate 8 unique 2-digit numbers between 11 and 99
  const numbersSet = new Set<number>();
  while (numbersSet.size < 8) {
    const num = Math.floor(rng() * 89) + 11;
    numbersSet.add(num);
  }
  const sequence = Array.from(numbersSet);

  const dayNum = getDayNumber(dateObj);

  return {
    date: dateStr,
    dayNumber: dayNum,
    title: 'MEMORY RUSH',
    subtitle: '// CLASSIC MATRIX DISCIPLINE',
    sequence,
    memorizeSeconds: 5
  };
}

export function getTimeUntilNextDaySeconds(): { hours: number; minutes: number; seconds: number; formatted: string } {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  const diffMs = Math.max(0, midnight.getTime() - now.getTime());
  
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return { hours, minutes, seconds, formatted };
}

export const dailyChallengeService = {
  getTodayDateString,
  getDayNumber,
  getDailyChallengeForDate,
  getTimeUntilNextChallenge: getTimeUntilNextDaySeconds,
  getTodayChallenge: () => getDailyChallengeForDate(getTodayDateString()),
  isTodayCompleted: () => {
    try {
      const raw = localStorage.getItem('pixel_arcade_storage_v1');
      if (!raw) return false;
      const data = JSON.parse(raw);
      const today = getTodayDateString();
      return !!(data?.dailyChallenge?.attempts?.[today] || data?.dailyChallenge?.completedDates?.includes(today));
    } catch {
      return false;
    }
  },
  getTodayAttempt: () => {
    try {
      const raw = localStorage.getItem('pixel_arcade_storage_v1');
      if (!raw) return null;
      const data = JSON.parse(raw);
      const today = getTodayDateString();
      return data?.dailyChallenge?.attempts?.[today] || null;
    } catch {
      return null;
    }
  }
};

