#!/usr/bin/env node
/**
 * docs/10_screen_specification.md 用のスクリーンショットを生成する。
 * 使い方: npm run screenshots:screen-spec
 */
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildDemoStudySeed } from './lib/demo-study-seed.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'docs', 'images', 'screen-spec');
const PORT = 9091;
const BASE = `http://127.0.0.1:${PORT}`;

async function main() {
  const server = spawn('npx', ['http-server', '.', '-p', String(PORT), '-c-1'], {
    cwd: root,
    stdio: 'ignore',
    shell: false,
  });
  await new Promise((r) => setTimeout(r, 1200));

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1360, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  const seed = buildDemoStudySeed();
  await page.addInitScript((json) => {
    localStorage.setItem('jcsqe_study_data', json);
  }, JSON.stringify(seed));

  await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('.hero-title', { timeout: 15000 });
  await page.waitForTimeout(500);

  await page.locator('#tab-home').screenshot({ path: join(outDir, 'screen-home.png') });

  await page.evaluate(() => window.switchTab('tab-stats'));
  await page.waitForSelector('#tab-stats.active', { timeout: 8000 });
  await page.waitForSelector('#dash-rings', { timeout: 8000 });
  await page.waitForTimeout(400);
  await page.locator('#tab-stats').screenshot({ path: join(outDir, 'screen-stats.png') });

  await page.evaluate(() => window.switchTab('tab-glossary'));
  await page.waitForSelector('#tab-glossary.active', { timeout: 5000 });
  await page.waitForSelector('#glossary-list', { timeout: 8000 });
  await page.waitForTimeout(400);
  await page.locator('#tab-glossary').screenshot({ path: join(outDir, 'screen-glossary-list.png') });

  await page.locator('#glossary-mode-btn').click();
  await page.waitForSelector('#glossary-flashcard:not(.hidden)', { timeout: 5000 });
  await page.waitForTimeout(400);
  await page.locator('#tab-glossary').screenshot({ path: join(outDir, 'screen-glossary-flashcard.png') });

  await page.evaluate(() => window.switchTab('tab-settings'));
  await page.waitForSelector('#tab-settings.active', { timeout: 5000 });
  await page.waitForFunction(
    () => {
      const el = document.getElementById('firebase-auth-line');
      return el && !/読み込み中/.test(el.textContent || '');
    },
    { timeout: 15000 }
  );
  await page.waitForTimeout(500);
  await page.locator('#tab-settings').screenshot({ path: join(outDir, 'screen-settings.png') });

  await page.evaluate(() => window.switchTab('tab-home'));
  await page.waitForSelector('#tab-home.active', { timeout: 5000 });
  await page.evaluate(() => window.startDailyChallenge());
  await page.waitForSelector('#quiz.screen.active', { timeout: 10000 });
  await page.waitForTimeout(400);
  await page.locator('#quiz').screenshot({ path: join(outDir, 'screen-quiz-daily.png') });

  const wrongIdx = await page.evaluate(() => {
    const st = window.JCSQE && window.JCSQE.state;
    if (!st || !st.questions || !st.questions[st.idx]) return 0;
    const q = st.questions[st.idx];
    for (let i = 0; i < 4; i++) if (i !== q.answer) return i;
    return 0;
  });
  await page.locator('.choice-btn').nth(wrongIdx).click();
  await page.waitForSelector('#quiz-explanation:not(.hidden)', { timeout: 8000 });
  await page.waitForTimeout(300);
  await page.locator('#quiz').screenshot({ path: join(outDir, 'screen-quiz-explanation.png') });

  // Q1 は既に不正解で解説表示。Q2〜Q5 も不正解にしてから最後の「結果を見る」で結果へ
  for (let step = 0; step < 4; step++) {
    await page.locator('#quiz-next-btn').click();
    await page.waitForSelector('.choice-btn:not(.disabled)', { timeout: 8000 });
    const idx = await page.evaluate(() => {
      const st = window.JCSQE && window.JCSQE.state;
      if (!st || !st.questions || !st.questions[st.idx]) return 0;
      const q = st.questions[st.idx];
      for (let j = 0; j < 4; j++) if (j !== q.answer) return j;
      return 0;
    });
    await page.locator('.choice-btn').nth(idx).click();
    await page.waitForSelector('#quiz-explanation:not(.hidden)', { timeout: 8000 });
    await page.waitForTimeout(200);
  }
  await page.locator('#quiz-next-btn').click();
  await page.waitForSelector('#result.screen.active', { timeout: 10000 });
  await page.waitForTimeout(500);
  await page.locator('#result').screenshot({ path: join(outDir, 'screen-result.png') });

  await page.evaluate(() => window.switchTab('tab-home'));
  await page.waitForSelector('#chapter-list .chapter-item', { timeout: 8000 });
  await page.locator('#chapter-list .chapter-item').first().click();
  await page.waitForSelector('#question-count-modal:not(.hidden)', { timeout: 5000 });
  await page.waitForTimeout(300);
  await page.locator('#question-count-modal .modal-card').screenshot({ path: join(outDir, 'screen-modal-qcount.png') });

  await browser.close();
  server.kill('SIGTERM');
  await new Promise((r) => setTimeout(r, 300));
  // eslint-disable-next-line no-console
  console.log('Wrote PNGs under docs/images/screen-spec/');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
