/**
 * BFF 入口
 * P9 面试点：BFF 和传统后端的差异？
 *   BFF 不做重业务逻辑，核心职责是：
 *   —— 聚合多个微服务接口，减少前端请求数
 *   —— 裁剪字段，只给前端需要的
 *   —— 鉴权/限流/日志等横切关注点
 *   —— Mock 和真实接口切换
 */
import express from 'express'
import cors from 'cors'
import questionsRouter from './routes/questions.js'
import authRouter from './routes/auth.js'
import { errorHandler, notFound, requestLogger } from './middleware/error.js'

const app = express()
const PORT = process.env.PORT || 3000

// ---------- 中间件 ----------
app.use(cors())
app.use(express.json({ limit: '1mb' }))
app.use(requestLogger)

// ---------- 路由 ----------
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    ts: Date.now(),
    uptime: process.uptime(),
  })
})

app.use('/api/auth', authRouter)
app.use('/api/questions', questionsRouter)

// ---------- 兜底 ----------
app.use(notFound)
app.use(errorHandler)

// 优雅关闭
const shutdown = () => {
  console.log('[BFF] Graceful shutting down…')
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

app.listen(PORT, () => {
  console.log(`[BFF] http://localhost:${PORT}`)
  console.log(`[BFF] Seed questions loaded`)
})
