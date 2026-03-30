// このファイルを js/d1-sync-config.js にコピーし、デプロイした Worker のベース URL を 1 行だけ設定してください。
// （末尾スラッシュなし。ユーザーが URL を入力する必要はありません）
(function(global) {
  'use strict';
  const J = global.JCSQE = global.JCSQE || {};
  J.d1SyncWorkerBaseUrl = 'https://jcsqe-study-sync.your-subdomain.workers.dev';
})(typeof window !== 'undefined' ? window : globalThis);
