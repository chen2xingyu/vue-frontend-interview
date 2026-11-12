<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue'

/**
 * ErrorBoundary —— 组件级错误边界
 *
 * P9 面试点：Vue 为什么没有 React 那样的 error boundary 内置能力？
 *   —— Vue 提供了 onErrorCaptured 钩子，需要自己包一层组件实现
 *   —— 子组件渲染/生命周期抛错时，拦截并降级渲染，避免整页白屏
 *
 * 设计要点：
 *   - 默认降级 UI，可通过 fallback 插槽自定义
 *   - 捕获后调用 report 回调上报，配合 monitoring 做线上告警
 *   - 「重试」直接重置状态重新渲染子树
 */

const props = defineProps<{
  /** 上报回调（默认 console.error） */
  report?: (err: Error, info: string) => void
}>()

const hasError = ref(false)
const errorMsg = ref('')

onErrorCaptured((err, _instance, info) => {
  hasError.value = true
  errorMsg.value = err instanceof Error ? err.message : String(err)
  if (props.report) props.report(err instanceof Error ? err : new Error(String(err)), info)
  else console.error('[ErrorBoundary]', err, info)
  // 返回 false 阻止继续向上冒泡，避免触发全局错误
  return false
})

function retry() {
  hasError.value = false
  errorMsg.value = ''
}
</script>

<template>
  <div v-if="hasError" class="error-boundary">
    <slot name="fallback" :error="errorMsg" :retry="retry">
      <div class="error-boundary__default">
        <h3>页面出了点问题</h3>
        <p>{{ errorMsg }}</p>
        <button type="button" @click="retry">重试</button>
      </div>
    </slot>
  </div>
  <slot v-else />
</template>

<style scoped>
.error-boundary__default {
  padding: var(--space-8);
  text-align: center;
  color: var(--color-text-secondary);

  h3 {
    color: var(--color-text);
    margin: 0 0 var(--space-2);
  }

  p {
    font-size: var(--font-size-sm);
    margin: 0 0 var(--space-4);
    word-break: break-all;
  }

  button {
    padding: var(--space-2) var(--space-5);
    background: var(--color-primary);
    color: #fff;
    border-radius: var(--radius-md);
    font-weight: 600;
  }
}
</style>
