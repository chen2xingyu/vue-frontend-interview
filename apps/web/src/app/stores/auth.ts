import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getToken, setTokens, clearToken } from '@shared/utils/http'
import { fetchMe, login as loginApi } from '@domains/auth/api'
import type { LoginPayload, UserInfo } from '@domains/auth/types'

/**
 * Auth Store — 认证域
 *
 * P9 设计要点：
 *   - 认证是全局跨域能力，放顶层 store
 *   - 权限不做本地硬编码：登录后由后端返回 roles/permissions
 *   - 路由守卫只"拦截体验"，真正的权限在后端接口校验（server/src/middleware/auth.js）
 *
 * 状态分两处存放，这是刻意设计：
 *   token   → localStorage（刷新页面仍在，供 http 拦截器同步读取）
 *   user    → 内存（刷新后由 restore() 重新拉取，避免本地缓存的权限过期）
 */
export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(getToken())
  const user = ref<UserInfo | null>(null)
  const loading = ref(false)
  /** restore() 是否已跑过一次 —— 路由守卫等它完成再判断权限 */
  const initialized = ref(false)

  const isLoggedIn = computed(() => !!token.value)

  /** 判断是否有某权限 */
  function hasPermission(perm: string): boolean {
    if (!user.value) return false
    if (user.value.roles.includes('admin')) return true
    return user.value.permissions.includes(perm)
  }

  /**
   * 登录（P9 面试点：为什么登录逻辑拆成"获取 token"和"拉用户信息"两步？）
   *   —— token 只负责"我是谁"，用户信息负责"我能做什么"
   *   —— 这里后端一次返回两者，减少一次往返；但语义上仍是两件事，
   *      所以 restore() 单独保留了"只有 token、没有 user"的恢复路径
   */
  async function login(credentials: LoginPayload) {
    loading.value = true
    try {
      const result = await loginApi(credentials)
      setTokens(result)
      token.value = result.accessToken
      user.value = result.user
      initialized.value = true
      return true
    } finally {
      loading.value = false
    }
  }

  /**
   * 恢复登录态 —— 刷新页面后 token 还在 localStorage，但 user 在内存里丢了
   * 用 /auth/me 回填；如果 token 已过期，401 会触发 http 层续期，
   * 续期也失败才真正清理。
   */
  async function restore() {
    if (initialized.value) return
    if (!token.value) {
      initialized.value = true
      return
    }
    try {
      user.value = await fetchMe()
    } catch {
      clearToken()
      token.value = null
      user.value = null
    } finally {
      initialized.value = true
    }
  }

  /**
   * 登出 —— JWT 是无状态的，服务端无法作废已签发的 token，
   * 所以客户端清理就是全部动作（真实项目需要 token 黑名单或版本号机制）
   */
  function logout() {
    token.value = null
    user.value = null
    clearToken()
  }

  return { token, user, loading, initialized, isLoggedIn, hasPermission, login, restore, logout }
})

export type { UserInfo }
