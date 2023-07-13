import { test, expect } from '@playwright/test';

// test('has title', async ({ page }) => {
//   await page.goto('https://playwright.dev/');

//   // Expect a title "to contain" a substring.
//   await expect(page).toHaveTitle(/Playwright/);
// });

// test('get started link', async ({ page }) => {
//   await page.goto('https://playwright.dev/');

//   // Click the get started link.
//   await page.getByRole('link', { name: 'Get started' }).click();

//   // Expects the URL to contain intro.
//   await expect(page).toHaveURL(/.*intro/);
// });

test('测试环境', async ({ page }) => {
  // 与 playwright.config.ts 一样，测试脚本中也可以访问环境变量
  await page.goto('/');
  const url = await page.url();

  if(process.env.TEST_MODE === 'production') {
    await expect(url).toBe('https://github.com/')
  } else {
    await expect(url).toBe('https://gitee.com/')
  }
});