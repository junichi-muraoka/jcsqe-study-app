// JCSQE学習アプリ - データ永続化モジュール
(function(global) {
  'use strict';
  const J = global.JCSQE = global.JCSQE || {};
  const { STORAGE_KEY, DATA_VERSION, defaultData, normalizeStudyData } = window.StudyData;

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultData();
      const parsed = JSON.parse(raw);
      const normalized = normalizeStudyData(parsed);
      const needsMigration = parsed.version !== DATA_VERSION
        || Array.isArray(parsed.mockExams)
        || typeof parsed.streak !== 'object'
        || !Array.isArray(parsed.mockHistory)
        || typeof parsed.spacedRepetition !== 'object';
      if (needsMigration) saveData(normalized);
      return normalized;
    }
    catch { return defaultData(); }
  }

  function saveData(d) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeStudyData(d)));
  }

  J.loadData = loadData;
  J.saveData = saveData;
})(typeof window !== 'undefined' ? window : globalThis);
