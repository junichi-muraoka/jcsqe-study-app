#!/usr/bin/env node
/**
 * README 用の実スクリーンショットを生成する（ローカル http-server + Playwright）。
 * 使い方: node scripts/capture-readme-screenshots.mjs
 * 前提: npm install 済み、npx playwright install chromium 済み
 */
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'docs', 'images', 'readme');
const PORT = 9090;
const BASE = `http://127.0.0.1:${PORT}`;

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const seed = {
  version: 1,
  totalAnswered: 186,
  totalCorrect: 132,
  chapterStats: {
    1: { answered: 42, correct: 35 },
    2: { answered: 38, correct: 28 },
    3: { answered: 36, correct: 22 },
    4: { answered: 40, correct: 30 },
    5: { answered: 30, correct: 17 },
  },
  weakIds: [3, 7, 15],
  history: [],
  mockHistory: [
    { date: new Date().toISOString(), score: 32, total: 40, pct: 80 },
    { date: new Date(Date.now() - 86400000 * 5).toISOString(), score: 28, total: 40, pct: 70 },
  ],
  dailyActivity: { [todayKey()]: 14 },
  bookmarks: [1, 5],
  spacedRepetition: {},
  streak: { lastDate: todayKey(), count: 4 },
  xp: 140,
};

async function main() {
  const server = spawn('npx', ['http-server', '.', '-p', String(PORT), '-c-1'], {
    cwd: root,
    stdio: 'ignore',
    shell: false,
  });
  await new Promise((r) => setTimeout(r, 1200));

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1360, height: 820 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  await page.addInitScript((json) => {
    localStorage.setItem('jcsqe_study_data', json);
  }, JSON.stringify(seed));

  await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('.hero-title', { timeout: 15000 });
  await page.waitForTimeout(400);

  await page.locator('#tab-home').screenshot({ path: join(outDir, 'screenshot-home.png') });

  await page.getByTestId('nav-daily').evaluate((el) => el.click());
  await page.waitForSelector('#quiz.screen.active', { timeout: 10000 });
  await page.locator('.choice-btn').first().click();
  await page.waitForSelector('#quiz-explanation:not(.hidden)', { timeout: 8000 });
  await page.waitForTimeout(300);
  await page.locator('#quiz').screenshot({ path: join(outDir, 'screenshot-quiz-explanation.png') });

  await page.evaluate(() => {
    if (typeof window.switchTab === 'function') window.switchTab('tab-stats');
  });
  await page.waitForSelector('#tab-stats.active, #tab-stats.screen.active', { timeout: 5000 }).catch(() => {});
  await page.waitForSelector('#dash-rings', { timeout: 8000 });
  await page.waitForTimeout(400);
  await page.locator('#tab-stats').screenshot({ path: join(outDir, 'screenshot-stats.png') });

  await page.evaluate(() => {
    if (typeof window.switchTab === 'function') window.switchTab('tab-home');
  });
  await page.waitForSelector('#tab-home.active', { timeout: 5000 });
  await page.waitForTimeout(300);
  page.once('dialog', (d) => d.accept());
  await page.getByTestId('nav-mock').evaluate((el) => el.click());
  await page.waitForSelector('#quiz-timer', { timeout: 10000 });
  await page.waitForTimeout(500);
  await page.locator('#quiz').screenshot({ path: join(outDir, 'screenshot-mock-exam.png') });

  await browser.close();
  server.kill('SIGTERM');
  await new Promise((r) => setTimeout(r, 300));
  // eslint-disable-next-line no-console
  console.log('Wrote PNGs under docs/images/readme/');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
