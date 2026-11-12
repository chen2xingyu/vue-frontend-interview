<script setup lang="ts">
import { RouterView } from 'vue-router'
import ErrorBoundary from '@shared/components/ErrorBoundary.vue'
import { useMonitorStore } from '@app/stores/monitor'

/**
 * App.vue 是"应用布局壳"
 * P9 设计要点：
 *   - 入口组件只负责全局布局（侧边栏、顶栏、主内容区），不承载业务逻辑
 *   - 用 ErrorBoundary 包裹 RouterView，页面级崩溃降级为局部错误提示，
 *     而不是整页白屏（比 global errorHandler 的体验更好）
 */
const monitor = useMonitorStore()

function report(err: Error, info: string) {
  monitor.pushError({
    message: err.message,
    stack: err.stack,
    source: 'vue',
    at: Date.now(),
    url: location.pathname,
  })
  console.error('[ErrorBoundary]', err, info)
}
</script>

<template>
  <div class="app-shell">
    <ErrorBoundary :report="report">
      <RouterView />
    </ErrorBoundary>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
}
</style>
