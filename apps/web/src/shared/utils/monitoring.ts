import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals'

/**
 * 前端可观测性 —— Web Vitals 采集 + 运行时错误捕获
 *
 * P9 面试点：为什么前端要自己做可观测性？
 *   1. 线上真实用户指标（RUM）才是性能真相，本地 Lighthouse 只能代表实验室环境
 *   2. 错误边界 + 全局捕获能捞到框架没兜住的异常，缩短 MTTR
 *   3. 数据要能回流：sendBeacon 保证页面卸载时也能上报
 *
 * 设计要点：
 *   - 纯采集层（本文件）与展示层（monitor store）解耦
 *   - 指标统一归一化为 MetricRecord，rating 按官方阈值计算
 *   - 上报用 navigator.sendBeacon 兜底 fetch，避免卸载丢数据
 *   - 采集失败不能影响业务，所有回调内部 try/catch
 */

export type MetricName = 'LCP' | 'CLS' | 'INP' | 'TTFB' | 'FCP'
export type MetricRating = 'good' | 'needs-improvement' | 'poor'

export interface MetricRecord {
  name: MetricName
  value: number
  rating: MetricRating
  /** 采集时间戳 */
  at: number
  /** 指标 ID（web-vitals 提供，用于去重） */
  id: string
}

export interface ErrorRecord {
  message: string
  stack?: string
  source: 'error' | 'unhandledrejection' | 'vue' | 'manual'
  at: number
  /** 出错页面路径 */
  url: string
}

export interface MonitoringOptions {
  /** 指标回调（store 订阅） */
  onMetric?: (m: MetricRecord) => void
  /** 错误回调 */
  onError?: (e: ErrorRecord) => void
  /** 上报地址；为空则只本地留存，不上报 */
  endpoint?: string
  /** 采样率 0-1，默认 1（全量） */
  sampleRate?: number
}

// ---------- 阈值（对齐 web.dev 官方标准） ----------
// LCP 好 < 2.5s，需改进 < 4s
// CLS 好 < 0.1，需改进 < 0.25
// INP 好 < 200ms，需改进 < 500ms
// TTFB 好 < 800ms，需改进 < 1800ms
// FCP 好 < 1.8s，需改进 < 3s
const THRESHOLDS: Record<MetricName, [number, number]> = {
  LCP: [2500, 4000],
  CLS: [0.1, 0.25],
  INP: [200, 500],
  TTFB: [800, 1800],
  FCP: [1800, 3000],
}

export function rateMetric(name: MetricName, value: number): MetricRating {
  const [good, needsImprove] = THRESHOLDS[name]
  if (value <= good) return 'good'
  if (value <= needsImprove) return 'needs-improvement'
  return 'poor'
}

/** 指标格式化（用于 UI 展示） */
export function formatMetric(name: MetricName, value: number): string {
  // CLS 是无量纲分数，保留 3 位；其余是毫秒
  if (name === 'CLS') return value.toFixed(3)
  return `${Math.round(value)} ms`
}

// ---------- 上报 ----------
function report(endpoint: string, payload: unknown) {
  if (!endpoint) return
  try {
    const body = JSON.stringify(payload)
    // 页面卸载场景用 sendBeacon，保证不丢
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' })
      navigator.sendBeacon(endpoint, blob)
    } else {
      void fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {})
    }
  } catch {
    /* 上报失败绝不影响业务 */
  }
}

// ---------- 初始化 ----------
let inited = false

export function initMonitoring(options: MonitoringOptions = {}) {
  // 只在浏览器环境运行（SSR / 测试环境直接跳过）
  if (inited || typeof window === 'undefined') return () => {}
  inited = true

  const { onMetric, onError, endpoint, sampleRate = 1 } = options
  const sampled = Math.random() <= sampleRate

  function handleMetric(metric: Metric) {
    if (!sampled) return
    const name = metric.name as MetricName
    const record: MetricRecord = {
      name,
      value: metric.value,
      rating: rateMetric(name, metric.value),
      at: Date.now(),
      id: metric.id,
    }
    onMetric?.(record)
    report(endpoint ?? '', { type: 'metric', ...record })
  }

  onLCP(handleMetric)
  onCLS(handleMetric)
  onINP(handleMetric)
  onTTFB(handleMetric)
  onFCP(handleMetric)

  function handleError(record: ErrorRecord) {
    onError?.(record)
    report(endpoint ?? '', { type: 'error', ...record })
  }

  const onWindowError = (event: ErrorEvent) => {
    const error: unknown = event.error
    handleError({
      message: event.message,
      stack: error instanceof Error ? error.stack : undefined,
      source: 'error',
      at: Date.now(),
      url: location.pathname,
    })
  }

  const onRejection = (event: PromiseRejectionEvent) => {
    const reason: unknown = event.reason
    handleError({
      message: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
      source: 'unhandledrejection',
      at: Date.now(),
      url: location.pathname,
    })
  }

  window.addEventListener('error', onWindowError)
  window.addEventListener('unhandledrejection', onRejection)

  // 返回清理函数（HMR / 测试场景防泄漏）
  return () => {
    window.removeEventListener('error', onWindowError)
    window.removeEventListener('unhandledrejection', onRejection)
    inited = false
  }
}

/** 手动上报一条错误（Vue errorHandler / 业务 catch 用） */
export function captureError(err: unknown, onError?: (e: ErrorRecord) => void) {
  const record: ErrorRecord = {
    message: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
    source: 'manual',
    at: Date.now(),
    url: typeof location !== 'undefined' ? location.pathname : '',
  }
  onError?.(record)
}
