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
import { buildDemoStudySeed } from './lib/demo-study-seed.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'docs', 'images', 'readme');
const PORT = 9090;
const BASE = `http://127.0.0.1:${PORT}`;

const seed = buildDemoStudySeed();

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
