#!/usr/bin/env node
/**
 * issues/*.md を GitHub Issue に同期するスクリプト
 *
 * 使い方: npm run bug:sync
 * 前提: gh CLI がインストール済みで gh auth status が通ること
 *
 * 動作:
 * - issues/bug-*.md を走査
 * - issues/.synced.json で既に起票済みか確認
 * - 未起票なら gh issue create で作成し、.synced.json を更新
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const ISSUES_DIR = path.join(ROOT, 'issues');
const SYNCED_FILE = path.join(ISSUES_DIR, '.synced.json');

function getSynced() {
  try {
    const data = fs.readFileSync(SYNCED_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

function setSynced(data) {
  fs.writeFileSync(SYNCED_FILE, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function extractTitle(content) {
  const firstLine = content.split('\n')[0] || '';
  return firstLine.replace(/^#+\s*/, '').trim();
}

function getBugFiles() {
  if (!fs.existsSync(ISSUES_DIR)) return [];
  return fs.readdirSync(ISSUES_DIR)
    .filter((f) => f.startsWith('bug-') && f.endsWith('.md'))
    .sort();
}

function createIssue(title, bodyPath) {
  // 相対パスを使用（日本語パス対策）。cwd はプロジェクトルート
  const relPath = path.relative(ROOT, bodyPath).split(path.sep).join('/');
  // Windows で日本語タイトルを正しく渡すため shell 経由で実行
  const cmd = `gh issue create --title ${JSON.stringify(title)} --body-file ${JSON.stringify(relPath)} --label bug`;
  const output = String(execSync(cmd, { encoding: 'utf8', cwd: ROOT, shell: true })).trim();
  // 出力例: https://github.com/owner/repo/issues/123
  const match = output.match(/\/issues\/(\d+)/);
  const number = match ? parseInt(match[1], 10) : null;
  if (number == null) {
    throw new Error(`gh の出力を解析できません: ${output.slice(0, 100)}...`);
  }
  return { number, url: output };
}

function main() {
  const synced = getSynced();
  const files = getBugFiles();

  if (files.length === 0) {
    console.log('issues/bug-*.md がありません。');
    return;
  }

  let created = 0;
  for (const file of files) {
    const filePath = path.join(ISSUES_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const title = extractTitle(content);

    if (synced[file]) {
      console.log(`[skip] ${file} → #${synced[file]} 済み`);
      continue;
    }

    try {
      const { number, url } = createIssue(title, filePath);
      synced[file] = number;
      setSynced(synced);
      console.log(`[created] ${file} → #${number} ${url}`);
      created++;
    } catch (err) {
      console.error(`[error] ${file}:`, err.message);
      process.exitCode = 1;
    }
  }

  if (created > 0) {
    console.log(`\n${created} 件の Issue を作成しました。`);
  }
}

main();
