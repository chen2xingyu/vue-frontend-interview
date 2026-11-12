/**
 * 鉴权中间件
 *
 * P9 面试点：为什么"路由守卫 + 后端校验"两者都不能少？
 *   —— 前端守卫只是体验优化（避免闪一下再跳走），
 *      用户完全可以直接 curl 接口绕过；
 *   —— 真正的权限边界必须在服务端，这是安全底线。
 */
import { verify } from '../utils/jwt.js'
import { userRepo } from '../db/users.js'

/** 必须有合法 token */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? ''
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ code: 40100, message: '未提供认证信息', data: null })
  }

  const token = header.slice(7).trim()
  try {
    const payload = verify(token)
    // refresh token 不能用来访问业务接口
    if (payload.type === 'refresh') {
      return res.status(401).json({ code: 40103, message: 'token 类型错误', data: null })
    }
    req.auth = payload
    next()
  } catch (err) {
    res.status(401).json({ code: 40105, message: err.message, data: null })
  }
}

/**
 * 权限点校验（用在 requireAuth 之后）
 * @param {string} permission 需要的权限点，如 'question:write'
 */
export function requirePermission(permission) {
  return (req, res, next) => {
    const payload = req.auth
    if (!payload) {
      return res.status(401).json({ code: 40100, message: '未认证', data: null })
    }
    // token 里只放 sub/username，权限必须回查用户表 ——
    // 放进 token 会让权限变更无法及时生效（token 有效期内一直享有旧权限）
    const user = userRepo.findById(payload.sub)
    if (!user) {
      return res.status(401).json({ code: 40104, message: '用户不存在', data: null })
    }
    if (user.roles.includes('admin')) return next()
    if (!user.permissions.includes(permission)) {
      return res.status(403).json({ code: 40300, message: '权限不足', data: null })
    }
    next()
  }
}
