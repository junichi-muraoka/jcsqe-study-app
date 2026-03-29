// JCSQE学習アプリ - データ永続化モジュール
(function(global) {
  'use strict';
  const J = global.JCSQE = global.JCSQE || {};
  const { STORAGE_KEY, DATA_VERSION, defaultData, normalizeStudyData } = window.StudyData;

  function catalogNormalizeOptions() {
    if (typeof QUESTIONS !== 'undefined' && Array.isArray(QUESTIONS)) {
      return { validQuestionIds: QUESTIONS.map(function(q) { return q.id; }) };
    }
    return undefined;
  }

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultData();
      const parsed = JSON.parse(raw);
      const opts = catalogNormalizeOptions();
      const normalized = normalizeStudyData(parsed, opts);
      const needsMigration = parsed.version !== DATA_VERSION
        || Array.isArray(parsed.mockExams)
        || typeof parsed.streak !== 'object'
        || !Array.isArray(parsed.mockHistory)
        || typeof parsed.spacedRepetition !== 'object';
      const needsCatalogSave = opts && JSON.stringify(normalizeStudyData(parsed)) !== JSON.stringify(normalized);
      if (needsMigration || needsCatalogSave) saveData(normalized);
      return normalized;
    }
    catch { return defaultData(); }
  }

  function saveData(d) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeStudyData(d, catalogNormalizeOptions())));
  }

  J.loadData = loadData;
  J.saveData = saveData;
})(typeof window !== 'undefined' ? window : globalThis);
