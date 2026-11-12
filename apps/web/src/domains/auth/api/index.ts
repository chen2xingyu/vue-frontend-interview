/**
 * 认证领域 - API 层
 * 每个函数对应一个 BFF 接口，响应经过 Zod 校验后才进入应用
 */
import { request } from '@shared/utils/http'
import type { LoginPayload, LoginResult, UserInfo } from '../types'
import { LoginResultSchema, UserSchema } from '../types/schema'

const BASE = '/auth'

/** 登录 —— 换取 token 对 + 用户信息 */
export async function login(payload: LoginPayload): Promise<LoginResult> {
  const raw = await request.post<unknown>(`${BASE}/login`, payload)
  return LoginResultSchema.parse(raw)
}

/** 拉取当前用户 —— 用于刷新页面后恢复登录态 */
export async function fetchMe(): Promise<UserInfo> {
  const raw = await request.get<unknown>(`${BASE}/me`)
  return UserSchema.parse(raw)
}

/** 登出 —— JWT 无状态，这里只是语义确认 */
export function logout(): Promise<void> {
  return request.post<void>(`${BASE}/logout`)
}
