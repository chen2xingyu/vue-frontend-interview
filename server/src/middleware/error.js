/**
 * 全局错误处理中间件
 * Express 里错误处理必须是 4 参数 (err, req, res, next)
 */
export function errorHandler(err, _req, res, _next) {
  // 已知业务错误（带 code）
  if (err?.code) {
    return res.status(err.status ?? 400).json({
      code: err.code,
      message: err.message ?? '请求失败',
      data: null,
    })
  }

  // 未知错误 —— 生产环境不要把堆栈暴露给客户端
  console.error('[BFF Unhandled]', err)
  res.status(500).json({ code: 50000, message: '服务内部错误', data: null })
}

/** 404 兜底 */
export function notFound(_req, res) {
  res.status(404).json({ code: 40400, message: '接口不存在', data: null })
}

/** 请求日志中间件（简易版） */
export function requestLogger(req, _res, next) {
  const start = Date.now()
  _res.on('finish', () => {
    const dur = Date.now() - start
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${_res.statusCode} (${dur}ms)`,
    )
  })
  next()
}
