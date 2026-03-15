(function(global) {
  'use strict';

  const STORAGE_KEY = 'jcsqe_study_data';
  const DATA_VERSION = 1;

  function toNonNegativeNumber(value, fallback) {
    const num = Number(value);
    return Number.isFinite(num) && num >= 0 ? num : fallback;
  }

  function normalizeIdList(value) {
    if (!Array.isArray(value)) return [];
    return [...new Set(value
      .map(v => parseInt(v, 10))
      .filter(v => Number.isInteger(v) && v > 0))];
  }

  function normalizeChapterStats(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const normalized = {};
    Object.keys(value).forEach(key => {
      const entry = value[key];
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return;
      const answered = toNonNegativeNumber(entry.answered, 0);
      const correct = Math.min(toNonNegativeNumber(entry.correct, 0), answered);
      normalized[key] = { answered, correct };
    });
    return normalized;
  }

  function normalizeDailyActivity(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const normalized = {};
    Object.keys(value).forEach(key => {
      normalized[key] = toNonNegativeNumber(value[key], 0);
    });
    return normalized;
  }

  function normalizeMockHistory(value, legacyMockExams) {
    const source = Array.isArray(value) ? value : Array.isArray(legacyMockExams) ? legacyMockExams : [];
    return source.map(entry => {
      const score = toNonNegativeNumber(entry && entry.score, 0);
      const total = toNonNegativeNumber(entry && entry.total, 40) || 40;
      const pct = entry && entry.pct !== undefined
        ? toNonNegativeNumber(entry.pct, total > 0 ? Math.round(score / total * 100) : 0)
        : (total > 0 ? Math.round(score / total * 100) : 0);
      return {
        date: entry && typeof entry.date === 'string' ? entry.date : new Date(0).toISOString(),
        score,
        total,
        pct
      };
    });
  }

  function normalizeSpacedRepetition(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const normalized = {};
    Object.keys(value).forEach(key => {
      const entry = value[key];
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return;
      normalized[key] = {
        interval: Math.max(1, Math.round(toNonNegativeNumber(entry.interval, 1))),
        ease: Math.min(Math.max(Number(entry.ease) || 2.5, 1.3), 3.0),
        nextReview: toNonNegativeNumber(entry.nextReview, Date.now())
      };
    });
    return normalized;
  }

  function defaultData() {
    return {
      version: DATA_VERSION,
      totalAnswered: 0,
      totalCorrect: 0,
      chapterStats: {},
      weakIds: [],
      history: [],
      mockHistory: [],
      dailyActivity: {},
      bookmarks: [],
      spacedRepetition: {},
      streak: { lastDate: null, count: 0 },
      xp: 0
    };
  }

  function normalizeStudyData(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return defaultData();

    const totalAnswered = toNonNegativeNumber(raw.totalAnswered, 0);
    const totalCorrect = Math.min(toNonNegativeNumber(raw.totalCorrect, 0), totalAnswered);
    const streak = raw.streak && typeof raw.streak === 'object' && !Array.isArray(raw.streak)
      ? raw.streak
      : {
          lastDate: typeof raw.lastStudyDate === 'string' ? raw.lastStudyDate : null,
          count: toNonNegativeNumber(raw.streak, 0)
        };

    return {
      version: DATA_VERSION,
      totalAnswered,
      totalCorrect,
      chapterStats: normalizeChapterStats(raw.chapterStats),
      weakIds: normalizeIdList(raw.weakIds),
      history: Array.isArray(raw.history) ? raw.history : [],
      mockHistory: normalizeMockHistory(raw.mockHistory, raw.mockExams),
      dailyActivity: normalizeDailyActivity(raw.dailyActivity),
      bookmarks: normalizeIdList(raw.bookmarks),
      spacedRepetition: normalizeSpacedRepetition(raw.spacedRepetition),
      streak: {
        lastDate: typeof streak.lastDate === 'string' ? streak.lastDate : null,
        count: toNonNegativeNumber(streak.count, 0)
      },
      xp: toNonNegativeNumber(raw.xp, 0)
    };
  }

  function parseImportedStudyData(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return { error: 'JSONの形式が不正です。学習データのオブジェクトを指定してください。' };
    }

    const recognizedKeys = [
      'totalAnswered', 'totalCorrect', 'chapterStats', 'weakIds', 'bookmarks',
      'dailyActivity', 'mockHistory', 'mockExams', 'streak', 'lastStudyDate',
      'spacedRepetition', 'xp', 'history'
    ];
    const hasKnownKey = recognizedKeys.some(key => Object.prototype.hasOwnProperty.call(raw, key));
    if (!hasKnownKey) {
      return { error: '学習データとして認識できる項目が見つかりません。' };
    }

    return { data: normalizeStudyData(raw) };
  }

  const api = {
    STORAGE_KEY,
    DATA_VERSION,
    defaultData,
    normalizeStudyData,
    parseImportedStudyData
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  global.StudyData = api;
})(typeof window !== 'undefined' ? window : globalThis);
