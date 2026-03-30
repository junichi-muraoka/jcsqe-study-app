// Worker のベース URL（運用者がデプロイ後に 1 回だけ設定。空なら D1 同期は無効）
(function(global) {
  'use strict';
  const J = global.JCSQE = global.JCSQE || {};
  J.d1SyncWorkerBaseUrl = '';
})(typeof window !== 'undefined' ? window : globalThis);
