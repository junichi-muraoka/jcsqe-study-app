const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DATA_VERSION,
  defaultData,
  normalizeStudyData,
  parseImportedStudyData
} = require('../study-data.js');

test('defaultData returns the current schema', () => {
  const data = defaultData();

  assert.equal(data.version, DATA_VERSION);
  assert.deepEqual(data.weakIds, []);
  assert.deepEqual(data.bookmarks, []);
  assert.deepEqual(data.mockHistory, []);
  assert.deepEqual(data.spacedRepetition, {});
  assert.deepEqual(data.streak, { lastDate: null, count: 0 });
});

test('normalizeStudyData migrates legacy fields', () => {
  const normalized = normalizeStudyData({
    totalAnswered: 12,
    totalCorrect: 9,
    weakIds: [1, '2', 2],
    bookmarks: [3, '4'],
    mockExams: [{ date: '2026-03-01T00:00:00.000Z', score: 32, passed: true }],
    streak: 4,
    lastStudyDate: '2026-03-10',
    xp: 30
  });

  assert.equal(normalized.version, DATA_VERSION);
  assert.deepEqual(normalized.weakIds, [1, 2]);
  assert.deepEqual(normalized.bookmarks, [3, 4]);
  assert.deepEqual(normalized.streak, { lastDate: '2026-03-10', count: 4 });
  assert.deepEqual(normalized.mockHistory, [
    { date: '2026-03-01T00:00:00.000Z', score: 32, total: 40, pct: 80 }
  ]);
});

test('normalizeStudyData clamps invalid numeric values', () => {
  const normalized = normalizeStudyData({
    totalAnswered: 5,
    totalCorrect: 99,
    chapterStats: {
      1: { answered: 3, correct: 10 }
    }
  });

  assert.equal(normalized.totalCorrect, 5);
  assert.deepEqual(normalized.chapterStats, {
    1: { answered: 3, correct: 3 }
  });
});

test('parseImportedStudyData rejects unrelated objects', () => {
  const result = parseImportedStudyData({ foo: 1 });
  assert.equal(result.error, '学習データとして認識できる項目が見つかりません。');
});
