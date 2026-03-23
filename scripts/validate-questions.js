#!/usr/bin/env node
/**
 * 問題データ・解説データの整合性チェック
 * questions.js / questions_extra*.js と explanations.js の整合性を検証
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const baseDir = path.join(__dirname, '..');
let hasError = false;

function err(msg) {
  console.error('❌', msg);
  hasError = true;
}

function ok(msg) {
  console.log('✅', msg);
}

// 1. 問題データを読み込み
const context = { CHAPTERS: [], QUESTIONS: [] };
vm.createContext(context);

try {
  const q1 = fs.readFileSync(path.join(baseDir, 'questions.js'), 'utf8');
  const q2 = fs.readFileSync(path.join(baseDir, 'questions_extra1.js'), 'utf8');
  const q3 = fs.readFileSync(path.join(baseDir, 'questions_extra2.js'), 'utf8');
  const q4 = fs.readFileSync(path.join(baseDir, 'questions_extra3.js'), 'utf8');
  const q5 = fs.readFileSync(path.join(baseDir, 'questions_extra4.js'), 'utf8');

  const code = q1
    .replace(/const (CHAPTERS|QUESTIONS) = /g, '$1 = ')
    + '\n' + q2 + '\n' + q3 + '\n' + q4 + '\n' + q5;

  new vm.Script(code).runInContext(context);
} catch (e) {
  err(`問題ファイルの読み込みに失敗: ${e.message}`);
  process.exit(1);
}

const questions = context.QUESTIONS;

// 2. 解説データを読み込み（EXP/EXP2 のエントリ検証用）
let expData = {}; // id -> { d: array }
try {
  const expContext = { EXP: {}, EXP2: {}, EXP3: {}, QUESTIONS: questions };
  vm.createContext(expContext);
  let expCode = fs.readFileSync(path.join(baseDir, 'explanations_exp3.js'), 'utf8')
    + '\n' + fs.readFileSync(path.join(baseDir, 'explanations.js'), 'utf8');
  expCode = expCode.replace(/const (EXP|EXP2|EXP3) = /g, '$1 = ');
  new vm.Script(expCode).runInContext(expContext);
  Object.assign(expData, expContext.EXP, expContext.EXP2, expContext.EXP3);
} catch (e) {
  err(`解説ファイルの読み込みに失敗: ${e.message}`);
  process.exit(1);
}

const questionIds = new Set(questions.map(q => q.id));

// 解説エントリの検証（問題が存在するか、d が4つか）
for (const [idStr, entry] of Object.entries(expData)) {
  const id = parseInt(idStr);
  if (!questionIds.has(id)) {
    err(`解説ID ${id} に対応する問題がありません`);
  }
  if (!Array.isArray(entry.d) || entry.d.length !== 4) {
    err(`解説ID ${id}: d（選択肢別解説）は4つ必要です（現在: ${entry.d?.length ?? 0}）`);
  }
}

// 3. 検証
const seenIds = new Set();

for (const q of questions) {
  // ID重複チェック
  if (seenIds.has(q.id)) {
    err(`問題ID ${q.id} が重複しています`);
  }
  seenIds.add(q.id);

  // 基本解説の存在チェック（問題オブジェクトの explanation フィールド）
  if (!q.explanation || typeof q.explanation !== 'string' || q.explanation.trim() === '') {
    err(`問題ID ${q.id} に explanation がありません`);
  }

  // 選択肢別解説（EXP/EXP2）がある場合、4つ揃っているかは explanations.js 側でチェック

  // chapter 1-5
  if (![1, 2, 3, 4, 5].includes(q.chapter)) {
    err(`問題ID ${q.id}: chapter は 1〜5 である必要があります（現在: ${q.chapter}）`);
  }

  // level L1/L2/L3
  if (!['L1', 'L2', 'L3'].includes(q.level)) {
    err(`問題ID ${q.id}: level は L1/L2/L3 である必要があります（現在: ${q.level}）`);
  }

  // choices が4つ
  if (!Array.isArray(q.choices) || q.choices.length !== 4) {
    err(`問題ID ${q.id}: choices は4つ必要です（現在: ${q.choices?.length ?? 0}）`);
  }

  // answer が 0-3
  if (typeof q.answer !== 'number' || q.answer < 0 || q.answer > 3) {
    err(`問題ID ${q.id}: answer は 0〜3 である必要があります（現在: ${q.answer}）`);
  }
}

ok(`全 ${questions.length} 問の整合性チェック完了`);

if (hasError) {
  process.exit(1);
}

console.log('\n🎉 すべてのチェックに合格しました');
