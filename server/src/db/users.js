/**
 * 用户数据 —— 内存版 Repository
 * 结构上与 questions 保持一致：将来换数据库只改这一层
 *
 * P9 面试点：为什么密码要存哈希而不是明文？
 *   —— 数据库泄露时明文密码直接可用，哈希 + 盐让攻击成本大幅上升
 *   生产环境应该用 bcrypt/argon2（自带盐 + 慢哈希），
 *   这里用 scrypt（node 内置）演示同一思路，不引依赖。
 */
import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto'

/** 把明文密码转成 "salt:hash" 存储格式 */
function hashPassword(plain) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(plain, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

/** 校验明文密码是否匹配存储的 "salt:hash" */
function verifyPassword(plain, stored) {
  const [salt, hash] = String(stored).split(':')
  if (!salt || !hash) return false
  const candidate = scryptSync(plain, salt, 64)
  const expected = Buffer.from(hash, 'hex')
  if (candidate.length !== expected.length) return false
  return timingSafeEqual(candidate, expected)
}

const users = new Map()

function seed(user) {
  users.set(user.id, user)
}

seed({
  id: 'u1',
  username: 'learner',
  passwordHash: hashPassword('test123'),
  name: '学习者',
  email: 'learner@example.com',
  roles: ['learner'],
  permissions: ['question:read'],
})

seed({
  id: 'u2',
  username: 'admin',
  passwordHash: hashPassword('admin123'),
  name: '管理员',
  email: 'admin@example.com',
  roles: ['admin'],
  permissions: ['question:read', 'question:write', 'question:delete'],
})

export const userRepo = {
  /** 按用户名查（登录用） */
  findByUsername(username) {
    for (const u of users.values()) {
      if (u.username === username) return u
    }
    return null
  },

  /** 按 id 查（token 换用户信息用） */
  findById(id) {
    return users.get(id) ?? null
  },

  /** 校验密码 */
  verifyPassword,

  /** 对外输出的安全视图 —— 绝不返回 passwordHash */
  toPublic(user) {
    if (!user) return null
    const { passwordHash: _passwordHash, ...safe } = user
    return safe
  },
}
