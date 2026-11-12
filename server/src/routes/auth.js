/**
 * 认证路由 —— /api/auth
 * 统一响应格式：{ code, message, data }
 *
 * P9 面试点：为什么 access token + refresh token 要分开？
 *   —— access token 有效期短（15min），泄露的窗口小；
 *   —— refresh token 有效期长（7d），但只在换票时使用，暴露面小；
 *   —— 两者职责分离：前者用于"每次请求证明身份"，后者用于"续期"。
 */
import express from 'express'
import { userRepo } from '../db/users.js'
import { sign, verify, ACCESS_TTL, REFRESH_TTL } from '../utils/jwt.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

/** 签发一对 token */
function issueTokens(user) {
  const payload = { sub: user.id, username: user.username }
  return {
    accessToken: sign(payload, ACCESS_TTL),
    refreshToken: sign({ ...payload, type: 'refresh' }, REFRESH_TTL),
    expiresIn: ACCESS_TTL,
  }
}

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body ?? {}

  if (!username || !password) {
    return res.status(400).json({ code: 40001, message: '用户名和密码不能为空', data: null })
  }

  const user = userRepo.findByUsername(String(username))
  // 故意不区分"用户不存在"和"密码错误"，避免账号枚举
  if (!user || !userRepo.verifyPassword(String(password), user.passwordHash)) {
    return res.status(401).json({ code: 40101, message: '用户名或密码错误', data: null })
  }

  const tokens = issueTokens(user)
  res.json({
    code: 0,
    message: 'ok',
    data: { ...tokens, user: userRepo.toPublic(user) },
  })
})

// POST /api/auth/refresh
// 用 refresh token 换新的 access token（refresh token 本身也轮换）
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body ?? {}
  if (!refreshToken) {
    return res.status(400).json({ code: 40001, message: 'refreshToken 不能为空', data: null })
  }

  let payload
  try {
    payload = verify(String(refreshToken))
  } catch (err) {
    return res.status(401).json({ code: 40102, message: err.message, data: null })
  }

  // 防止用 access token 冒充 refresh token
  if (payload.type !== 'refresh') {
    return res.status(401).json({ code: 40103, message: 'token 类型错误', data: null })
  }

  const user = userRepo.findById(payload.sub)
  if (!user) {
    return res.status(401).json({ code: 40104, message: '用户不存在', data: null })
  }

  res.json({ code: 0, message: 'ok', data: issueTokens(user) })
})

// GET /api/auth/me —— 用 access token 换当前用户信息
router.get('/me', requireAuth, (req, res) => {
  const user = userRepo.findById(req.auth.sub)
  if (!user) {
    return res.status(401).json({ code: 40104, message: '用户不存在', data: null })
  }
  res.json({ code: 0, message: 'ok', data: userRepo.toPublic(user) })
})

// POST /api/auth/logout
// JWT 是无状态的，服务端无法"作废"已签发的 token。
// 真实项目需要一个黑名单/版本号机制；这里只做语义上的确认。
router.post('/logout', requireAuth, (_req, res) => {
  res.json({ code: 0, message: 'logged out', data: null })
})

export default router
