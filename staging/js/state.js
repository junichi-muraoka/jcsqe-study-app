// JCSQE学習アプリ - クイズ状態
(function(global) {
  'use strict';
  const J = global.JCSQE = global.JCSQE || {};
  J.state = { mode: null, chapter: null, questions: [], idx: 0, score: 0, answers: [], timer: null, timeLeft: 0, sessionLimit: null };
  J.comboCount = 0;
})(typeof window !== 'undefined' ? window : globalThis);
