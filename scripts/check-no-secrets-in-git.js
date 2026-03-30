/**
 * 追跡ファイルに「本物っぽい秘密情報」が含まれていないか検査する。
 * CI / ローカルの npm test で実行し、Firebase API キーを誤コミットするのを防ぐ。
 *
 * 本番の Firebase 設定は GitHub Secret FIREBASE_WEB_CONFIG_JSON のみに置くこと。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');

/** 説明文に「AIza」と短い例だけが載る誤検知を減らすため、キー本体らしい長さだけ弾く */
const PATTERNS = [
  {
    name: 'Google / Firebase ブラウザ用 API キー (AIza…)',
    re: /AIza[0-9A-Za-z_-]{30,}/g,
  },
  {
    name: 'GitHub Personal Access Token (ghp_)',
    re: /ghp_[A-Za-z0-9]{30,}/g,
  },
];

const SKIP_NAMES = new Set(['package-lock.json']);

function isProbablyText(rel) {
  return /\.(js|mjs|cjs|html|css|json|md|yml|yaml|toml|txt|svg)$/i.test(rel);
}

function main() {
  let list;
  try {
    list = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
      .trim()
      .split(/\r?\n/)
      .filter(Boolean);
  } catch (e) {
    console.error('check-no-secrets-in-git: git ls-files に失敗しました（git リポジトリ内で実行してください）。');
    process.exit(1);
  }

  const hits = [];

  for (const rel of list) {
    if (SKIP_NAMES.has(path.basename(rel))) continue;
    if (!isProbablyText(rel)) continue;

    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) continue;
    const st = fs.statSync(full);
    if (!st.isFile() || st.size > 1_500_000) continue;

    let content;
    try {
      content = fs.readFileSync(full, 'utf8');
    } catch {
      continue;
    }

    for (const { name, re } of PATTERNS) {
      re.lastIndex = 0;
      if (re.test(content)) {
        hits.push({ file: rel, pattern: name });
        break;
      }
    }
  }

  if (hits.length) {
    console.error('');
    console.error('【失敗】追跡ファイルに秘密情報の疑いがある文字列が含まれています。');
    console.error('Firebase 本番値はリポジトリにコミットせず、GitHub Secret の FIREBASE_WEB_CONFIG_JSON のみに置いてください。');
    console.error('');
    for (const h of hits) {
      console.error(`  • ${h.file}`);
      console.error(`    → ${h.pattern}`);
    }
    console.error('');
    process.exit(1);
  }

  console.log('check-no-secrets-in-git: OK');
}

main();
