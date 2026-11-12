/**
 * JWT 工具 —— 用 node:crypto 手写 HS256
 *
 * P9 面试点：为什么不用 jsonwebtoken 库？
 *   面试常问"JWT 由哪三部分组成"。手写一遍比背答案记得牢：
 *     header.payload.signature，前两段是 base64url(JSON)，第三段是 HMAC-SHA256 签名
 *   生产环境当然应该用成熟库（要处理 alg=none 攻击、kid 轮换、时钟漂移等），
 *   这里手写是为了把机制暴露出来，同时避免引入依赖。
 *
 * 安全要点：
 *   - 签名比对必须用 timingSafeEqual，避免时序攻击
 *   - 必须校验 exp，且用服务端时间而非客户端
 *   - SECRET 必须来自环境变量，绝不能硬编码进仓库（这里给了 dev 兜底值并告警）
 */
import { createHmac, timingSafeEqual } from 'node:crypto'

const SECRET = process.env.JWT_SECRET ?? ''
if (!SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('[JWT] 生产环境必须设置 JWT_SECRET 环境变量')
}
const SIGNING_KEY = SECRET || 'feis-dev-secret-change-me'

/** access token 有效期（秒）—— 短一点才能真实触发 401 续期链路 */
export const ACCESS_TTL = 15 * 60
/** refresh token 有效期（秒）—— 用来换新的 access token */
export const REFRESH_TTL = 7 * 24 * 60 * 60

function b64url(input) {
  return Buffer.from(input).toString('base64url')
}

/**
 * 签发 token
 * @param {object} payload 业务声明（不要放敏感信息，JWT 只是 base64，不是加密）
 * @param {number} ttlSeconds 有效期秒数
 */
export function sign(payload, ttlSeconds) {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'HS256', typ: 'JWT' }
  const body = { ...payload, iat: now, exp: now + ttlSeconds }

  const head = b64url(JSON.stringify(header))
  const data = b64url(JSON.stringify(body))
  const signature = createHmac('sha256', SIGNING_KEY).update(`${head}.${data}`).digest('base64url')

  return `${head}.${data}.${signature}`
}

/**
 * 校验并解出 payload
 * @returns {object} payload
 * @throws {Error} 结构非法 / 签名不匹配 / 已过期
 */
export function verify(token) {
  if (typeof token !== 'string') throw new Error('token 必须是字符串')
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('token 结构非法')

  const [head, data, signature] = parts
  const expected = createHmac('sha256', SIGNING_KEY).update(`${head}.${data}`).digest('base64url')

  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  // 长度不同时 timingSafeEqual 会抛错，必须先比长度
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error('签名校验失败')
  }

  const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'))
  if (typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now()) {
    throw new Error('token 已过期')
  }
  return payload
}
