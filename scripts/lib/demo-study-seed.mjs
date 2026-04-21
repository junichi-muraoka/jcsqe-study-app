/**
 * README / 画面仕様書キャプチャ用のダミー学習データ（個人データを使わない）。
 */
export function getLocalDateKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function buildDemoStudySeed() {
  const key = getLocalDateKey();
  return {
    version: 1,
    totalAnswered: 186,
    totalCorrect: 132,
    chapterStats: {
      1: { answered: 42, correct: 35 },
      2: { answered: 38, correct: 28 },
      3: { answered: 36, correct: 22 },
      4: { answered: 40, correct: 30 },
      5: { answered: 30, correct: 17 },
    },
    weakIds: [3, 7, 15],
    history: [],
    mockHistory: [
      { date: new Date().toISOString(), score: 32, total: 40, pct: 80 },
      { date: new Date(Date.now() - 86400000 * 5).toISOString(), score: 28, total: 40, pct: 70 },
    ],
    dailyActivity: { [key]: 14 },
    bookmarks: [1, 5],
    spacedRepetition: {},
    streak: { lastDate: key, count: 4 },
    xp: 140,
  };
}
