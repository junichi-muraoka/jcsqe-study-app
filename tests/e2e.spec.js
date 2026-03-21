// @ts-check
const { test, expect } = require('@playwright/test');

/** 学習メニューの nav-card をクリック（data-testid で確実に特定） */
async function clickNavCard(page, testId) {
  const card = page.getByTestId(testId);
  await card.scrollIntoViewIfNeeded();
  // Playwright の click が効かない場合、evaluate で DOM クリックをシミュレート
  await card.evaluate((el) => el.click());
}

test.describe('JCSQE学習アプリ E2E', () => {
  test('ホーム画面が表示される', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await expect(page.locator('.hero-title')).toContainText('JCSQE初級');
    await expect(page.locator('.nav-card')).toHaveCount(4, { timeout: 5000 });
  });

  test('今日の5問をクリックしてクイズが開始される', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await clickNavCard(page, 'nav-daily');
    await expect(page.locator('#quiz')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.quiz-question')).toBeVisible();
  });

  test('1問解答すると解説が表示される', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await clickNavCard(page, 'nav-daily');
    await expect(page.locator('#quiz')).toBeVisible({ timeout: 5000 });
    await page.locator('.choice-btn').first().click();
    await expect(page.locator('#quiz-explanation')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('.exp-summary').first()).toBeVisible();
  });

  test('模擬試験モードでタイマーが表示される', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    page.once('dialog', dialog => dialog.accept());
    await clickNavCard(page, 'nav-mock');
    await expect(page.locator('#quiz')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#quiz-timer')).toBeVisible({ timeout: 3000 });
  });
});
