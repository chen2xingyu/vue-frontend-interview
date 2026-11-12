/**
 * Express 路由 —— /api/questions
 * 统一响应格式：{ code, message, data }
 * 统一错误处理：res.status(4xx/5xx).json({ code: 'xxx', message })
 */
import express from 'express'
import { questionRepo } from '../db/questions.js'
import { requireAuth, requirePermission } from '../middleware/auth.js'

const router = express.Router()

// 读接口公开（未登录也能浏览题库）；
// 写接口必须同时通过"已认证"和"有权限点"两道关

// GET /api/questions?category=xxx&keyword=xxx
router.get('/', (req, res) => {
  const { category, keyword } = req.query
  const list = questionRepo.list({
    category: typeof category === 'string' ? category : undefined,
    keyword: typeof keyword === 'string' ? keyword : undefined,
  })
  res.json({ code: 0, message: 'ok', data: list })
})

// GET /api/questions/:id
router.get('/:id', (req, res) => {
  const record = questionRepo.get(req.params.id)
  if (!record) {
    return res.status(404).json({ code: 40401, message: '问题不存在', data: null })
  }
  res.json({ code: 0, message: 'ok', data: record })
})

// POST /api/questions
router.post('/', requireAuth, requirePermission('question:write'), (req, res) => {
  const body = req.body ?? {}
  if (!body.title || !body.category) {
    return res
      .status(400)
      .json({ code: 40001, message: 'title 和 category 为必填字段', data: null })
  }
  const record = questionRepo.create(body)
  res.status(201).json({ code: 0, message: 'created', data: record })
})

// PUT /api/questions/:id
router.put('/:id', requireAuth, requirePermission('question:write'), (req, res) => {
  const updated = questionRepo.update(req.params.id, req.body ?? {})
  if (!updated) {
    return res.status(404).json({ code: 40401, message: '问题不存在', data: null })
  }
  res.json({ code: 0, message: 'updated', data: updated })
})

// DELETE /api/questions/:id
router.delete('/:id', requireAuth, requirePermission('question:delete'), (req, res) => {
  const ok = questionRepo.remove(req.params.id)
  if (!ok) {
    return res.status(404).json({ code: 40401, message: '问题不存在', data: null })
  }
  res.json({ code: 0, message: 'deleted', data: null })
})

export default router
