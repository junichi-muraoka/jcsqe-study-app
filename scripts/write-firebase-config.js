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
  /** `"k":"v"\n  "k2"` または同一行で `"k":"v" "k2"`（先頭の " はキー用・値用を区別） */
  t = t.replace(/("\s*:\s*"(?:[^"\\]|\\.)*")\s*\r?\n(\s*")/g, '$1,\n$2');
  t = t.replace(/("\s*:\s*"(?:[^"\\]|\\.)*")\s+(")/g, '$1, $2');
  /** `"messagingSenderId": 123\n  "appId"` のような数値値のあと */
  t = t.replace(/("\s*:\s*\d+)\s*\r?\n(\s*")/g, '$1,\n$2');
  t = t.replace(/("\s*:\s*\d+)\s+(")/g, '$1, $2');
  /** `"appId":"…"\n  googleOAuthClientId:` のように JSON キーと JS 風キーが混在 */
  t = t.replace(/("\s*:\s*"(?:[^"\\]|\\.)*")\s*\r?\n(\s*[a-zA-Z_$][\w$]*\s*:)/g, '$1,\n$2');
  t = t.replace(/("\s*:\s*"(?:[^"\\]|\\.)*")\s+([a-zA-Z_$][\w$]*\s*:)/g, '$1, $2');
  t = t.replace(/("\s*:\s*\d+)\s*\r?\n(\s*[a-zA-Z_$][\w$]*\s*:)/g, '$1,\n$2');
  t = t.replace(/("\s*:\s*\d+)\s+([a-zA-Z_$][\w$]*\s*:)/g, '$1, $2');
  return t;
}

/** `apiKey: "x" authDomain:` や `messagingSenderId: 123\n  googleOAuthClientId:` など JS オブジェクトでカンマが抜けている場合 */
function lenientJsCommaBetweenProps(s) {
  let t = String(s);
  let prev;
  do {
    prev = t;
    t = t.replace(/([\w$]+\s*:\s*"(?:[^"\\]|\\.)*")\s+([\w$]+\s*:)/g, '$1, $2');
    t = t.replace(/([\w$]+\s*:\s*\d+)\s+([\w$]+\s*:)/g, '$1, $2');
    t = t.replace(/([\w$]+\s*:\s*\d+)\s*\r?\n(\s*[\w$]+\s*:)/g, '$1,\n$2');
  } while (t !== prev);
  return t;
}

/** GitHub Secret に ```json で囲んで貼った場合 */
function stripMarkdownFence(s) {
  const t = String(s).trim();
  const m = t.match(/^```(?:json)?\s*\r?\n?([\s\S]*?)\r?\n?```\s*$/i);
  return m ? m[1].trim() : t;
}

/** Word 等で入った曲がり引用符を ASCII に */
function normalizeSmartQuotes(s) {
  return String(s)
    .replace(/\u201c|\u201d/g, '"')
    .replace(/\u2018|\u2019/g, "'");
}

/** 行頭の // コメントのみ除去（文字列内の https:// を壊さない） */
function stripLineLeadingComments(s) {
  return String(s).replace(/^\s*\/\/[^\r\n]*/gm, '');
}

/** 先頭の説明文や `variable=` を除き、最初の { … } オブジェクトだけ残す（文字列内の {} は無視） */
function extractFirstBalancedObject(s) {
  const start = s.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let j = start; j < s.length; j++) {
    const c = s[j];
    if (esc) {
      esc = false;
      continue;
    }
    if (inStr) {
      if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') {
      inStr = true;
      continue;
    }
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return s.slice(start, j + 1);
    }
  }
  return null;
}

/** `const firebaseConfig = { ... };` ごとコピーした場合に { ... } だけ抜く */
function extractJsFirebaseConfigObject(s) {
  const re = /(?:const|var|let)\s+firebaseConfig\s*=\s*\{/;
  const m = re.exec(s);
  if (!m) return s;
  let i = m.index + m[0].length - 1;
  let depth = 0;
  for (let j = i; j < s.length; j++) {
    const c = s[j];
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return s.slice(i, j + 1);
    }
  }
  return s;
}

function parseFirebaseWebConfig(input) {
  let s = String(input).trim();
  if (s.charCodeAt(0) === 0xfeff) {
    s = s.slice(1).trim();
  }
  s = stripMarkdownFence(s);
  s = normalizeSmartQuotes(s);
  s = extractJsFirebaseConfigObject(s);
  s = stripLineLeadingComments(s);
  const balanced = extractFirstBalancedObject(s);
  if (balanced) s = balanced.trim();

  const jsComma = lenientJsCommaBetweenProps(s);
  const candidates = [s, lenientJsonRepair(s), jsComma, lenientJsonRepair(jsComma)];
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start !== -1 && end > start) {
    const slice = s.slice(start, end + 1);
    const sliceJs = lenientJsCommaBetweenProps(slice);
    candidates.push(slice, lenientJsonRepair(slice), sliceJs, lenientJsonRepair(sliceJs));
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
  let slice = s.slice(start, end + 1);
  slice = lenientJsCommaBetweenProps(slice);
  slice = lenientJsonRepair(slice);
  try {
    return new Function('return ' + slice)();
  } catch (e2) {
    throw new Error(
      'パースできませんでした。ダブルクォート " で囲んだ標準 JSON を推奨します（キーも必ず " で囲む）。例: {"apiKey":"…","googleOAuthClientId":"….apps.googleusercontent.com"}。JSON: ' +
        (lastErr && lastErr.message ? lastErr.message : '') +
        (e2 && e2.message ? ' / JS式: ' + e2.message : '')
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
