// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('JCSQE学習アプリ E2E', () => {
  test('ホーム画面が表示される', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.hero-title')).toContainText('JCSQE初級');
    await expect(page.locator('.nav-card')).toHaveCount(4, { timeout: 5000 });
  });

  test('今日の5問をクリックしてクイズが開始される', async ({ page }) => {
    await page.goto('/');
    await page.getByText('今日の5問').first().click();
    await expect(page.locator('#quiz')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.quiz-question')).toBeVisible();
  });

  test('1問解答すると解説が表示される', async ({ page }) => {
    await page.goto('/');
    await page.getByText('今日の5問').first().click();
    await expect(page.locator('#quiz')).toBeVisible({ timeout: 5000 });
    // 最初の選択肢をクリック
    await page.locator('.choice-btn').first().click();
    await expect(page.locator('#quiz-explanation')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('.exp-summary').first()).toBeVisible();
  });

  test('模擬試験モードでタイマーが表示される', async ({ page }) => {
    await page.goto('/');
    page.once('dialog', dialog => dialog.accept());
    await page.getByText('模擬試験').first().click();
    await expect(page.locator('#quiz')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#quiz-timer')).toBeVisible({ timeout: 3000 });
  });
});
