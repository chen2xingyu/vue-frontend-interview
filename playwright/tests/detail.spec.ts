import { test, expect } from '@playwright/test'

/**
 * 详情页 + 登录态恢复 E2E
 *
 * P9 面试点：为什么"刷新保持登录态"放在 E2E 而不是 Vitest？
 *   —— Vitest 能测 store.restore() 的逻辑分支，
 *      但"刷新后 Pinia + localStorage + HTTP 拦截器协同工作"
 *      这种跨层协同只有 E2E 能真正覆盖
 */

test.describe('详情页导航与登录态恢复', () => {
  test('Dashboard 点击题目标题 → 显示参考解析', async ({ page }) => {
    await page.goto('/')
    // Dashboard 重定向到 /dashboard
    await expect(page).toHaveURL(/\/dashboard/)

    const firstCard = page.locator('.question').first()
    const titleLink = firstCard.locator('a').first()

    // 记录标题文本，断言详情页标题一致
    const titleText = (await titleLink.textContent())?.trim() ?? ''
    await titleLink.click()

    // URL 应该包含 /questions/xxx
    await expect(page).toHaveURL(/\/questions\/\w+/)

    // 标题一致
    await expect(page.getByRole('heading', { level: 1, name: titleText })).toBeVisible()

    // 参考解析区块必现
    await expect(page.getByRole('heading', { level: 2, name: '参考解析' })).toBeVisible()

    // 可能的追问 —— 种子数据 9 题大多有 followups
    await expect(page.getByRole('heading', { level: 2, name: '可能的追问' })).toBeVisible()
  })

  test('详情页前后题导航', async ({ page }) => {
    await page.goto('/questions/v1')
    await expect(page).toHaveURL('/questions/v1')

    // 底部 pager 有两个按钮，第一个是"上一题 ←"，第二个是"下一题 →"
    const pager = page.locator('.pager')

    // 点"下一题"（第二个按钮）
    await pager.locator('button').nth(1).click()
    await expect(page).toHaveURL('/questions/v2')

    // 点"上一题"（第一个按钮）
    await pager.locator('button').nth(0).click()
    await expect(page).toHaveURL('/questions/v1')
  })

  test('登录后刷新 → localStorage token 仍在', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: '登录' }).click()
    await expect(page).toHaveURL(/\/dashboard/)

    // 刷新页面
    await page.reload()

    // 路由守卫 restore() 应该成功（token 刚签发，未过期）
    // 如果失败了 clearToken()，URL 不会变（dashboard 无 requiresAuth），
    // 但 localStorage 里的 feis.token 会被清掉
    await expect(page).toHaveURL(/\/dashboard/)
    const token = await page.evaluate(() => localStorage.getItem('feis.token'))
    expect(token).toBeTruthy()
  })
})
