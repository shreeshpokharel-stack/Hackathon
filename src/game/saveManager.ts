import type { SaveData } from './types';

const SAVE_KEY = 'echoes_of_tomorrow_save_v1';

export const SaveManager = {
  load(): SaveData {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) return JSON.parse(raw) as SaveData;
    } catch {
      // Ignore storage errors in restricted contexts
    }
    return { unlockedLevel: 1, totalScore: 0, levels: {} };
  },

  save(data: SaveData): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch {
      // Ignore storage errors
    }
  },

  recordLevelWin(levelNum: 1 | 2 | 3, score: number, frags: number, butterfly: boolean): void {
    const data = this.load();
    data.unlockedLevel = Math.max(data.unlockedLevel, Math.min(3, levelNum + 1));
    const prev = data.levels[levelNum] || { bestScore: 0, frags: 0, butterfly: false };
    data.levels[levelNum] = {
      bestScore: Math.max(prev.bestScore, score),
      frags: Math.max(prev.frags, frags),
      butterfly: prev.butterfly || butterfly
    };
    data.totalScore = Object.values(data.levels).reduce((acc, l) => acc + l.bestScore, 0);
    this.save(data);
  },

  clear(): void {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      // Ignore
    }
  }
};
