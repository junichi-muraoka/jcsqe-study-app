/**
 * CI 用: 環境変数 FIREBASE_WEB_CONFIG_JSON に Firebase コンソールの
 * Web アプリ設定 JSON（1 行のオブジェクト）を渡すと js/firebase-config.js を上書きする。
 * 未設定または空のときは何もしない（リポジトリ同梱のプレースホルダのまま）。
 */
'use strict';

const fs = require('fs');
const path = require('path');

const raw = process.env.FIREBASE_WEB_CONFIG_JSON;
if (!raw || !String(raw).trim()) {
  process.exit(0);
}

let cfg;
try {
  cfg = JSON.parse(raw);
} catch (e) {
  console.error('FIREBASE_WEB_CONFIG_JSON は有効な JSON である必要があります。', e.message);
  process.exit(1);
}

const out = path.join(__dirname, '..', 'js', 'firebase-config.js');
const content = `// Generated in CI from secret FIREBASE_WEB_CONFIG_JSON — do not commit real keys to git.
(function(global) {
  'use strict';
  const J = global.JCSQE = global.JCSQE || {};
  J.firebaseConfig = ${JSON.stringify(cfg, null, 2)};
  J.isFirebaseConfigured = function isFirebaseConfigured() {
    const c = J.firebaseConfig;
    if (!c.apiKey || !c.authDomain || !c.projectId || !c.appId) return false;
    if (c.apiKey === 'YOUR_API_KEY' || /^your-project/i.test(String(c.projectId || ''))) return false;
    return true;
  };
})(typeof window !== 'undefined' ? window : globalThis);
`;

fs.writeFileSync(out, content, 'utf8');
console.log('Wrote js/firebase-config.js from FIREBASE_WEB_CONFIG_JSON');
