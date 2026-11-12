import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ErrorRecord, MetricRecord } from '@shared/utils/monitoring'

/**
 * 监控数据 store
 * P9 设计要点：
 *   - 采集层（monitoring.ts）只管测量，store 只管状态与派生
 *   - 指标按 name 去重（同一指标 web-vitals 可能多次上报，保留最新）
 *   - 只保留最近 50 条错误，避免内存无限增长
 */
export const useMonitorStore = defineStore('monitor', () => {
  const metrics = ref<Record<string, MetricRecord>>({})
  const errors = ref<ErrorRecord[]>([])
  const MAX_ERRORS = 50

  function pushMetric(m: MetricRecord) {
    // 同一指标保留最新一次（web-vitals 会多次上报 CLS/INP 的累积值）
    metrics.value = { ...metrics.value, [m.name]: m }
  }

  function pushError(e: ErrorRecord) {
    errors.value = [e, ...errors.value].slice(0, MAX_ERRORS)
  }

  /** 性能总分（按 good=100 / needs-improvement=60 / poor=30 加权平均） */
  const score = computed(() => {
    const list = Object.values(metrics.value)
    if (!list.length) return 0
    const weight = { good: 100, 'needs-improvement': 60, poor: 30 } as const
    const sum = list.reduce((acc, m) => acc + weight[m.rating], 0)
    return Math.round(sum / list.length)
  })

  /** 按指标名排序后的列表（UI 稳定渲染顺序） */
  const metricList = computed(() => {
    const order: string[] = ['LCP', 'INP', 'CLS', 'TTFB', 'FCP']
    return order.map((name) => metrics.value[name]).filter((m): m is MetricRecord => Boolean(m))
  })

  const errorCount = computed(() => errors.value.length)

  function clearErrors() {
    errors.value = []
  }

  return { metrics, errors, metricList, score, errorCount, pushMetric, pushError, clearErrors }
})
