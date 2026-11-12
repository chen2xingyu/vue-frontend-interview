import { describe, it, expect } from 'vitest'
import { captureError, formatMetric, rateMetric, type ErrorRecord } from './monitoring'

describe('rateMetric（Web Vitals 官方阈值）', () => {
  it('LCP 边界：2.5s 为 good，4s 内为 needs-improvement，超过为 poor', () => {
    expect(rateMetric('LCP', 2500)).toBe('good')
    expect(rateMetric('LCP', 2501)).toBe('needs-improvement')
    expect(rateMetric('LCP', 4000)).toBe('needs-improvement')
    expect(rateMetric('LCP', 4001)).toBe('poor')
  })

  it('CLS 边界：0.1 / 0.25', () => {
    expect(rateMetric('CLS', 0.1)).toBe('good')
    expect(rateMetric('CLS', 0.2)).toBe('needs-improvement')
    expect(rateMetric('CLS', 0.3)).toBe('poor')
  })

  it('INP 边界：200ms / 500ms', () => {
    expect(rateMetric('INP', 120)).toBe('good')
    expect(rateMetric('INP', 300)).toBe('needs-improvement')
    expect(rateMetric('INP', 600)).toBe('poor')
  })
})

describe('formatMetric', () => {
  it('CLS 保留 3 位小数且不带单位', () => {
    expect(formatMetric('CLS', 0.12345)).toBe('0.123')
  })

  it('其余指标四舍五入为毫秒', () => {
    expect(formatMetric('LCP', 2499.6)).toBe('2500 ms')
  })
})

describe('captureError', () => {
  it('从 Error 实例中提取 message 与 stack', () => {
    const records: ErrorRecord[] = []
    const err = new Error('boom')
    captureError(err, (r) => records.push(r))

    expect(records).toHaveLength(1)
    expect(records[0]!.message).toBe('boom')
    expect(records[0]!.source).toBe('manual')
    expect(records[0]!.stack).toBe(err.stack)
  })

  it('非 Error 值会被转成字符串', () => {
    const records: ErrorRecord[] = []
    captureError({ code: 500 }, (r) => records.push(r))
    expect(records[0]!.message).toBe('[object Object]')
  })
})
