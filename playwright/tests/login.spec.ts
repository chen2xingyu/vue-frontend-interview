import { test, expect } from '@playwright/test'

/**
 * 登录流程 E2E
 *
 * P9 面试点：为什么登录用例不测很多边界条件？
 *   —— E2E 只测"核心路径 + 一个坏路径 + 一个校验路径"
 *   —— 空提交 / 格式错误 留给 Vitest，E2E 太重
 *   —— 真实错误路径只测"密码错 → 显示中文错误"这一条
 */

test.describe('登录流程', () => {
  test('正确凭证 → 跳 /dashboard', async ({ page }) => {
    await page.goto('/login')
    // Login.vue 默认值就是 learner / test123，直接点提交
    await page.getByRole('button', { name: '登录' }).click()
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('错误密码 → 显示中文错误', async ({ page }) => {
    await page.goto('/login')
    // password placeholder 是 test123，username placeholder 是 learner
    await page.getByPlaceholder('test123').fill('wrongpass')
    await page.getByRole('button', { name: '登录' }).click()
    // 后端统一返回 401，HTTP 层 normalizeError 会取 body.message
    await expect(page.getByText(/用户名或密码错误/)).toBeVisible()
    // 仍留在登录页
    await expect(page).toHaveURL(/\/login/)
  })

  test('空提交 → 显示必填提示', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('learner').fill('')
    await page.getByPlaceholder('test123').fill('')
    await page.getByRole('button', { name: '登录' }).click()
    await expect(page.getByText('请填写用户名和密码')).toBeVisible()
  })
})
