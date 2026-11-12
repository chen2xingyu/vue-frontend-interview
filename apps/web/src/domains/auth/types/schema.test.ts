import { describe, it, expect } from 'vitest'
import { LoginResultSchema, TokenPairSchema, UserSchema } from './schema'

const validUser = {
  id: 'u1',
  username: 'learner',
  name: '学习者',
  email: 'learner@example.com',
  roles: ['learner'],
  permissions: ['question:read'],
}

const validLoginResult = {
  accessToken: 'a.b.c',
  refreshToken: 'd.e.f',
  expiresIn: 900,
  user: validUser,
}

describe('UserSchema', () => {
  it('合法用户通过校验', () => {
    const parsed = UserSchema.parse(validUser)
    expect(parsed.username).toBe('learner')
    expect(parsed.permissions).toEqual(['question:read'])
  })

  it('缺少 roles 会被拒绝（后端字段漂移）', () => {
    const { roles: _roles, ...withoutRoles } = validUser
    expect(UserSchema.safeParse(withoutRoles).success).toBe(false)
  })

  it('非法 email 会被拒绝', () => {
    expect(UserSchema.safeParse({ ...validUser, email: 'not-an-email' }).success).toBe(false)
  })
})

describe('LoginResultSchema', () => {
  it('完整登录响应通过校验', () => {
    const parsed = LoginResultSchema.parse(validLoginResult)
    expect(parsed.expiresIn).toBe(900)
    expect(parsed.user.id).toBe('u1')
  })

  it('缺少 accessToken 会被拒绝', () => {
    const { accessToken: _t, ...rest } = validLoginResult
    expect(LoginResultSchema.safeParse(rest).success).toBe(false)
  })

  it('expiresIn 非正数会被拒绝', () => {
    expect(LoginResultSchema.safeParse({ ...validLoginResult, expiresIn: 0 }).success).toBe(false)
  })
})

describe('TokenPairSchema', () => {
  it('续期响应只要求 token 对，不需要 user', () => {
    const result = TokenPairSchema.safeParse({
      accessToken: 'a.b.c',
      refreshToken: 'd.e.f',
      expiresIn: 900,
    })
    expect(result.success).toBe(true)
  })

  it('空字符串 token 会被拒绝', () => {
    expect(
      TokenPairSchema.safeParse({ accessToken: '', refreshToken: 'd.e.f', expiresIn: 900 }).success,
    ).toBe(false)
  })
})
