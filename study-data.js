(function(global) {
  'use strict';

  const STORAGE_KEY = 'jcsqe_study_data';
  const DATA_VERSION = 1;

  function toNonNegativeNumber(value, fallback) {
    const num = Number(value);
    return Number.isFinite(num) && num >= 0 ? num : fallback;
  }

  /** ブラウザのローカル日付を YYYY-MM-DD で返す（ストリーク・ヒートマップ・デイリーと整合） */
  function getLocalDateKey(date) {
    const d = date instanceof Date ? date : new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function buildValidQuestionSet(options) {
    if (!options || !options.validQuestionIds) return null;
    const raw = options.validQuestionIds;
    const arr = Array.isArray(raw) ? raw : Array.from(raw);
    const set = new Set();
    arr.forEach(function(id) {
      const n = typeof id === 'number' ? id : parseInt(id, 10);
      if (Number.isInteger(n) && n > 0) set.add(n);
    });
    return set.size > 0 ? set : null;
  }

  function normalizeIdList(value, validSet) {
    if (!Array.isArray(value)) return [];
    let ids = [...new Set(value
      .map(v => parseInt(v, 10))
      .filter(v => Number.isInteger(v) && v > 0))];
    if (validSet && validSet.size > 0) {
      ids = ids.filter(function(id) { return validSet.has(id); });
    }
    return ids;
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

  function normalizeSpacedRepetition(value, validSet) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const normalized = {};
    Object.keys(value).forEach(key => {
      const qid = parseInt(key, 10);
      if (validSet && validSet.size > 0 && (!Number.isInteger(qid) || !validSet.has(qid))) return;
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

  function normalizeStudyData(raw, options) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return defaultData();

    const validSet = buildValidQuestionSet(options || {});

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
      weakIds: normalizeIdList(raw.weakIds, validSet),
      history: Array.isArray(raw.history) ? raw.history : [],
      mockHistory: normalizeMockHistory(raw.mockHistory, raw.mockExams),
      dailyActivity: normalizeDailyActivity(raw.dailyActivity),
      bookmarks: normalizeIdList(raw.bookmarks, validSet),
      spacedRepetition: normalizeSpacedRepetition(raw.spacedRepetition, validSet),
      streak: {
        lastDate: typeof streak.lastDate === 'string' ? streak.lastDate : null,
        count: toNonNegativeNumber(streak.count, 0)
      },
      xp: toNonNegativeNumber(raw.xp, 0)
    };
  }

  function parseImportedStudyData(raw, options) {
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

    return { data: normalizeStudyData(raw, options) };
  }

  const api = {
    STORAGE_KEY,
    DATA_VERSION,
    defaultData,
    normalizeStudyData,
    parseImportedStudyData,
    getLocalDateKey
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  global.StudyData = api;
})(typeof window !== 'undefined' ? window : globalThis);
