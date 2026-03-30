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

/**
 * Secret に次のどれでも渡せる:
 * - 1行の JSON: {"apiKey":"...",...}
 * - Firebase コンソールのコピペ: const firebaseConfig = { apiKey: "...", ... };
 */
function parseFirebaseWebConfig(input) {
  let s = String(input).trim();
  if (s.charCodeAt(0) === 0xfeff) {
    s = s.slice(1).trim();
  }
  try {
    return JSON.parse(s);
  } catch (_) {
    const start = s.indexOf('{');
    const end = s.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) {
      throw new Error(
        'JSON でも { で始まるオブジェクトでもありません。Firebase の「firebaseConfig」の { から } まで（apiKey / authDomain などが入ったブロック）を貼ってください。'
      );
    }
    const slice = s.slice(start, end + 1);
    try {
      return JSON.parse(slice);
    } catch (_) {
      try {
        return new Function('return ' + slice)();
      } catch (e2) {
        throw new Error(
          'パースできませんでした。次のどちらかにしてください: (1) { "apiKey":"...", "authDomain":"..." } 形式の JSON 1行 (2) Firebase の firebaseConfig の { ... } ブロック全体。エラー: ' +
            e2.message
        );
      }
    }
  }
}

let cfg;
try {
  cfg = parseFirebaseWebConfig(raw);
} catch (e) {
  console.error('FIREBASE_WEB_CONFIG_JSON:', e.message);
  process.exit(1);
}

if (!cfg || typeof cfg !== 'object' || !cfg.apiKey) {
  console.error('FIREBASE_WEB_CONFIG_JSON: apiKey を含むオブジェクトである必要があります。');
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
