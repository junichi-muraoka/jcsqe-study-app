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
 * - よくある誤り: 末尾カンマ、プロパティ間のカンマ漏れ（改行区切り）
 */
function lenientJsonRepair(s) {
  let t = String(s).trim();
  t = t.replace(/,\s*([}\]])/g, '$1');
  t = t.replace(/("(?:[^"\\]|\\.)*")\s*\r?\n(\s*")/g, '$1,\n$2');
  t = t.replace(/("(?:[^"\\]|\\.)*")\s+(")/g, '$1, $2');
  return t;
}

function parseFirebaseWebConfig(input) {
  let s = String(input).trim();
  if (s.charCodeAt(0) === 0xfeff) {
    s = s.slice(1).trim();
  }
  const candidates = [s, lenientJsonRepair(s)];
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start !== -1 && end > start) {
    const slice = s.slice(start, end + 1);
    candidates.push(slice, lenientJsonRepair(slice));
  }
  let lastErr = null;
  for (const c of candidates) {
    try {
      return JSON.parse(c);
    } catch (e) {
      lastErr = e;
    }
  }
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(
      'JSON でも { で始まるオブジェクトでもありません。Firebase の「firebaseConfig」の { から } まで（apiKey / authDomain などが入ったブロック）を貼ってください。'
    );
  }
  const slice = s.slice(start, end + 1);
  try {
    return new Function('return ' + slice)();
  } catch (e2) {
    throw new Error(
      'パースできませんでした。有効な JSON か確認してください（プロパティの区切りはカンマ必須）。例: "appId":"…", "googleOAuthClientId":"….apps.googleusercontent.com"。元のエラー: ' +
        (lastErr && lastErr.message ? lastErr.message : e2.message)
    );
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

const googleOAuthClientId =
  typeof cfg.googleOAuthClientId === 'string'
    ? cfg.googleOAuthClientId.trim()
    : typeof cfg.googleClientId === 'string'
      ? cfg.googleClientId.trim()
      : '';
const firebaseOnly = { ...cfg };
delete firebaseOnly.googleOAuthClientId;
delete firebaseOnly.googleClientId;

const out = path.join(__dirname, '..', 'js', 'firebase-config.js');
const content = `// Generated in CI from secret FIREBASE_WEB_CONFIG_JSON — do not commit real keys to git.
(function(global) {
  'use strict';
  const J = global.JCSQE = global.JCSQE || {};
  J.firebaseConfig = ${JSON.stringify(firebaseOnly, null, 2)};
  J.googleOAuthClientId = ${JSON.stringify(googleOAuthClientId)};
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
