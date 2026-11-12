/**
 * 认证领域 - Zod 运行时校验
 *
 * P9 面试点：登录响应为什么必须校验？
 *   —— 登录是"信任的起点"，如果 user.roles 结构漂移（后端改成 role 单数），
 *      前端会静默算出 hasPermission() === false，表现为"登录成功但处处没权限"，
 *      排查成本极高。边界上直接抛错，把问题暴露在最短路径上。
 */
import { z } from 'zod'

export const UserSchema = z.object({
  id: z.string().min(1),
  username: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
})

export const LoginResultSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresIn: z.number().positive(),
  user: UserSchema,
})

export const TokenPairSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresIn: z.number().positive(),
})
