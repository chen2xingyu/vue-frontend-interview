/**
 * 认证领域 - 类型定义
 * 与后端 /api/auth 的契约集中在这里，store 和页面都从这里引用
 */

export interface UserInfo {
  id: string
  username: string
  name: string
  email: string
  roles: string[]
  permissions: string[]
}

export interface LoginPayload {
  username: string
  password: string
}

/** 后端签发的一对 token */
export interface AuthTokens {
  accessToken: string
  refreshToken: string
  /** access token 有效期（秒） */
  expiresIn: number
}

export interface LoginResult extends AuthTokens {
  user: UserInfo
}
