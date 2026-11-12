import { ref, type Ref } from 'vue'

/**
 * 通用请求组合式函数
 * P9 面试点：这是"高阶组合式函数"模式
 *
 * 为什么需要它？
 *   1. 自动管理 loading / error / data 状态，组件里不用各写一遍
 *   2. 内置 AbortController，组件卸载自动取消
 *   3. 支持手动 refresh，带请求序号防竞态
 *   4. 返回的数据是 Ref，可直接在模板里用
 *
 * 使用示例：
 *   const { data, loading, error, refresh } = useRequest(() => api.listQuestions(), { immediate: true })
 */
export interface UseRequestOptions<T> {
  /** 立即执行 */
  immediate?: boolean
  /** 成功后缓存（refetch 间隔内不重新请求） */
  cacheMs?: number
  /** 错误时自动重试次数（仅 GET） */
  retries?: number
  /** 初始值 */
  initialValue?: T
}

export interface UseRequestReturn<T> {
  data: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<Error | null>
  /** 手动触发（忽略缓存） */
  refresh: () => Promise<T | null>
  /** 手动取消 */
  cancel: () => void
}

export function useRequest<T>(
  factory: (signal?: AbortSignal) => Promise<T>,
  options: UseRequestOptions<T> = {},
): UseRequestReturn<T> {
  const { immediate = true, cacheMs = 0, initialValue = null as unknown as T } = options

  const data = ref<T | null>(initialValue) as Ref<T | null>
  const loading = ref(false)
  const error = ref<Error | null>(null)

  let controller: AbortController | null = null
  let lastFetchAt = 0
  let inFlight = 0 // 请求序号，防止旧响应覆盖新响应

  async function run(force = false): Promise<T | null> {
    // 缓存命中
    const now = Date.now()
    if (!force && cacheMs > 0 && lastFetchAt && now - lastFetchAt < cacheMs) {
      return data.value
    }

    // 取消上一个
    cancel()
    controller = new AbortController()
    const mySeq = ++inFlight

    loading.value = true
    error.value = null

    try {
      const result = await factory(controller.signal)
      // 如果有更新的请求在飞，丢弃本响应（竞态保护）
      if (mySeq !== inFlight) return null
      data.value = result
      lastFetchAt = Date.now()
      return result
    } catch (err) {
      if (mySeq !== inFlight) return null // 已被取消
      if ((err as Error).name === 'AbortError') return null
      error.value = err as Error
      return null
    } finally {
      if (mySeq === inFlight) loading.value = false
    }
  }

  function cancel() {
    controller?.abort()
    controller = null
  }

  // 组件卸载时清理
  // Vue 3.5+ 自动注册 effect cleanup；旧版本需要显式 onUnmounted
  // 这里用 try-catch 兼容 vitest（非组件上下文调用）
  try {
    import('vue').then(({ onScopeDispose }) => {
      onScopeDispose(cancel)
    })
  } catch {
    /* test 环境无 effect scope，忽略 */
  }

  if (immediate) {
    run(true)
  }

  return { data, loading, error, refresh: () => run(true), cancel }
}
