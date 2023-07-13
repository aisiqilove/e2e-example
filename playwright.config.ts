import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import type { ReporterDescription } from '@playwright/test';
import path from 'path';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

// TEST_MODE 的值决定了加载哪个环境的文件
const modeExt = process.env.TEST_MODE || 'development';

// 先加载入仓的配置文件，再加载本地的配置文件
dotenv.config({ path: '.env' });
dotenv.config({ path: `.env.${modeExt}`, override: true });
dotenv.config({ path: '.env.local', override: true });
dotenv.config({ path: `.env.${modeExt}.local`, override: true });

const ciReporters: ReporterDescription[] = [
  [path.resolve(__dirname, 'ci/ci-log-report.ts')],
  ['html', { open: 'never' }],
  ['json', { outputFile: 'playwright-report/results.json' }],
  ['line'],
];
/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  // 测试目录
  testDir: './tests',
  /* Run tests in files in parallel */
  // 是否并发运行测试
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  // 测试失败用例重试次数
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  // 测试时使用的进程数，进程数越多可以同时执行的测试任务就越多。不设置则尽可能多地开启进程。
  workers: process.env.CI ? 1 : undefined,
  outputDir: 'test-results',
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  // 指定测试结果如何输出
  // reporter: [
  //   // 在命令行中同步打印每条用例的执行结果
  //   ['list'],
  //   // 输出 html 格式的报告，并将报告归档与指定路径
  //   ['html', {
  //     outputFolder: 'playwright-report',
  //   }]
  // ],
  reporter: process.env.CI ? ciReporters :  [
      // 在命令行中同步打印每条用例的执行结果
      ['list'],
      // 输出 html 格式的报告，并将报告归档与指定路径
      ['html', {
        outputFolder: 'playwright-report',
      }]
    ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  // 测试 project 的公共配置，会与与下面 projects 字段中的每个对象的 use 对象合并。

  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    // 测试时各种请求的基础路径
    baseURL: process.env.WEBSITE_URL,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    // 生成测试追踪信息的规则，on-first-retry 意为第一次重试时生成。
    // trace: 'on-first-retry',
    // 非 CI 环境下，第一次失败重试时生成追踪信息。非 CI 环境下，总是生成追踪信息
    trace: process.env.CI ? 'on-first-retry' : 'on',
    // 非 CI 环境下，第一次失败重试时生成视频。非 CI 环境下，总是生成视频
    video: process.env.CI ? 'on-first-retry' : 'on',
  },

  /* Configure projects for major browsers */
  // 定义每个 project，示例中将不同的浏览器测试区分成了不同的项目
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
