import type { App } from 'vue'
import { useStudyStore } from '@app/stores/study'
import { useMonitorStore } from '@app/stores/monitor'
import { useAuthStore } from '@app/stores/auth'
import { initMonitoring } from '@shared/utils/monitoring'
import { AUTH_EXPIRED_EVENT } from '@shared/utils/http'
import { router } from '@app/router'

/**
 * 全局 Provider 注册函数
 * P9 设计要点：这是应用启动后的副作用汇聚点
 *   —— 启动时拉取全局数据（题库、用户信息、配置）
 *   —— 初始化可观测性（Web Vitals / 错误捕获）
 *   —— 注册全局指令 / 插件 / 错误边界
 *
 * main.ts 里只写一行 registerProviders，保持入口文件干净
 */
export function registerProviders(app: App) {
  // 启动时预加载题库（不阻塞首屏渲染，store 内部处理 loading）
  const studyStore = useStudyStore()
  void studyStore.fetchQuestions()

  // 初始化可观测性：指标与错误回流到 monitor store
  const monitor = useMonitorStore()
  initMonitoring({
    onMetric: (m) => monitor.pushMetric(m),
    onError: (e) => monitor.pushError(e),
    // 生产环境可配置 VITE_MONITOR_ENDPOINT 上报到服务端
    endpoint: import.meta.env.VITE_MONITOR_ENDPOINT ?? undefined,
    sampleRate: 1,
  })

  // Vue 全局错误处理 —— 兜住组件渲染之外的异常
  app.config.errorHandler = (err) => {
    monitor.pushError({
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      source: 'vue',
      at: Date.now(),
      url: location.pathname,
    })
  }

  /**
   * 认证失效兜底
   * P9 面试点：为什么用事件而不是在 http.ts 里直接 import router？
   *   —— 依赖方向问题：shared/utils 是被所有人依赖的底层，
   *      让它反过来依赖 app/router 会造成循环依赖，也会让 http 层无法独立测试
   *   —— 事件把"发生了 401"和"该跳去哪"解耦
   */
  window.addEventListener(AUTH_EXPIRED_EVENT, () => {
    const auth = useAuthStore()
    auth.logout()
    const current = router.currentRoute.value
    if (current.name !== 'login') {
      void router.replace({ name: 'login', query: { redirect: current.fullPath } })
    }
  })
}
