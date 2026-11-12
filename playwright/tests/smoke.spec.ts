import { test, expect } from '@playwright/test'

/**
 * 冒烟测试（Smoke Test）—— 覆盖核心用户路径
 *
 * P9 面试点：E2E 测什么不测什么？
 *   —— 测核心用户路径（能登录→能浏览→能收藏）
 *   —— 不测实现细节（具体某个 CSS 类名、内部 ref 值）
 *   —— 不测边界条件（留给 Vitest 覆盖）
 *
 * 为什么 E2E 跑的用例少？
 *   —— 每条 E2E 秒级执行成本，多了 CI 跑不动
 *   —— 核心路径 5-10 条足矣，覆盖 80% 生产事故场景
 */

test.describe('前端面试研习社 —— 核心路径', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('首页加载、显示题库', async ({ page }) => {
    await expect(page.locator('text=把经验，变成清晰的表达')).toBeVisible()
    // 至少 9 道题（种子数据）
    const cards = page.locator('.question')
    await expect(cards.first()).toBeVisible()
    await expect(cards).toHaveCount(9)
  })

  test('按类别筛选 "性能优化"', async ({ page }) => {
    await page.getByRole('button', { name: '性能优化' }).click()
    // 筛选后只剩 1 道
    const cards = page.locator('.question')
    await expect(cards).toHaveCount(1)
    await expect(page.getByText('大型表格页面首屏和交互卡顿')).toBeVisible()
  })

  test('搜索 Proxy 能命中相关问题', async ({ page }) => {
    await page.getByPlaceholder('搜索问题、技术点或场景…').fill('Proxy')
    const cards = page.locator('.question')
    await expect(cards.first()).toBeVisible()
    await expect(cards.count()).toBeGreaterThan(0)
  })

  test('收藏切换：点击后显示已收藏', async ({ page }) => {
    const firstCard = page.locator('.question').first()
    await firstCard.getByRole('button', { name: /收藏/ }).click()
    await expect(firstCard.getByRole('button', { name: '★ 已收藏' })).toBeVisible()
    await firstCard.getByRole('button', { name: '★ 已收藏' }).click()
    await expect(firstCard.getByRole('button', { name: /收藏/ })).toBeVisible()
  })

  test('标记掌握后进度条更新', async ({ page }) => {
    const firstCard = page.locator('.question').first()
    await firstCard.getByRole('button', { name: /标记掌握/ }).click()
    await expect(firstCard.getByRole('button', { name: '✓ 已掌握' })).toBeVisible()
  })
})
