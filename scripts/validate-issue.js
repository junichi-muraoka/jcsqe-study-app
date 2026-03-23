#!/usr/bin/env node
/**
 * Issue 作成時のバリデーション（GitHub Actions validate_issue.yml から実行）
 * テンプレート必須項目が埋まっているかチェック
 *
 * 使用: node scripts/validate-issue.js <title> <body>
 * または環境変数: GITHUB_ISSUE_TITLE, GITHUB_ISSUE_BODY
 */
const title = process.argv[2] || process.env.GITHUB_ISSUE_TITLE || '';
const body = process.argv[3] || process.env.GITHUB_ISSUE_BODY || '';

const EMPTY_PATTERNS = [
  /^<!--.*-->$/gm,
  /^-\s*$/m,
  /^\d+\.\s*$/m,
  /^$/,
];

function isEmptyOrPlaceholder(text) {
  if (!text || typeof text !== 'string') return true;
  const trimmed = text.trim();
  if (trimmed.length < 2) return true;
  if (EMPTY_PATTERNS.some(p => p.test(trimmed))) return true;
  if (/^(なし|未記入|同上|\?|ー|—|-)$/.test(trimmed)) return true;
  return false;
}

function getSection(body, headerKeyword) {
  const regex = new RegExp(`##\\s*[^\\n]*${headerKeyword}[^\\n]*\\n([\\s\\S]*?)(?=##|$)`, 'i');
  const match = body.match(regex);
  return match ? match[1].trim() : '';
}

function countListItems(text) {
  const items = text.match(/^\d+\.\s+.+$/gm) || [];
  return items.filter(i => i.replace(/^\d+\.\s+/, '').trim().length > 0).length;
}

function validateBugReport(body) {
  const errors = [];
  const steps = getSection(body, '再現手順');
  const env = getSection(body, '環境');

  const stepCount = countListItems(steps);
  if (stepCount < 3) {
    errors.push(`再現手順に3ステップ以上記入してください（現在: ${stepCount}）`);
  }

  const hasOS = env && /OS:\s*\S+/.test(env);
  const hasBrowser = env && /ブラウザ:\s*\S+/.test(env);
  if (!hasOS) errors.push('環境にOSを記入してください');
  if (!hasBrowser) errors.push('環境にブラウザを記入してください');

  return errors;
}

function validateQuestionRequest(body) {
  const errors = [];
  const chapter = getSection(body, '対象の章');

  const hasChapter = /第[1-5]章|章\s*[1-5]|[1-5]\s*章/.test(chapter) ||
    (chapter.length > 3 && !isEmptyOrPlaceholder(chapter));

  if (!hasChapter) {
    errors.push('対象の章（第1章〜第5章のいずれか）を指定してください');
  }

  return errors;
}

function validateFeatureRequest(body) {
  const errors = [];
  const proposal = getSection(body, '提案内容');

  if (isEmptyOrPlaceholder(proposal)) {
    errors.push('提案内容を記入してください');
  }

  return errors;
}

function main() {
  const isBug = /\[Bug\]|\[bug\]/i.test(title) || title.toLowerCase().includes('bug');
  const isQuestion = /\[Question\]|\[question\]/i.test(title) || title.toLowerCase().includes('question');
  const isFeature = /\[Feature\]|\[feature\]/i.test(title) || title.toLowerCase().includes('feature');

  let errors = [];

  if (isBug) {
    errors = validateBugReport(body);
  } else if (isQuestion) {
    errors = validateQuestionRequest(body);
  } else if (isFeature) {
    errors = validateFeatureRequest(body);
  } else {
    console.log('ℹ️ テンプレート対象外のためスキップ。タイトルに [Bug] / [Question] / [Feature] を含めてください。');
    process.exit(0);
  }

  if (errors.length > 0) {
    console.error('❌ Issue のバリデーションに失敗しました:\n');
    errors.forEach(e => console.error('  -', e));
    process.exit(1);
  }

  console.log('✅ Issue のバリデーションに合格しました');
}

main();
