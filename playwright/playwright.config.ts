import { defineConfig, devices } from '@playwright/test'

// P9 面试点：为什么把 Playwright 放在根目录而非 apps/web 里？
//   —— E2E 覆盖前端 + BFF + 部署，是系统级测试，不属于单一应用
//   —— 本地运行时同时启动两个服务，模拟真实部署链路

const WEB_URL = process.env.WEB_URL ?? 'http://localhost:5173'
const API_URL = process.env.API_URL ?? 'http://localhost:3000'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 15_000,
  use: {
    baseURL: WEB_URL,
    apiBaseURL: API_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // 本地运行时自动启动服务
  webServer: [
    {
      // 直接用子包脚本，绕开根目录 script 解析歧义
      command: 'pnpm -C ../server dev',
      port: 3000,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: 'pnpm -C ../apps/web dev',
      port: 5173,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
})
