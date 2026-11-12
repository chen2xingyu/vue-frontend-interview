<script setup lang="ts">
import { computed } from 'vue'
import { useMonitorStore } from '@app/stores'
import { formatMetric, type MetricName } from '@shared/utils/monitoring'

/**
 * 性能与健康面板
 * P9 面试点：把可观测性做得"可见"，是资深工程师和普通工程师的差距
 *   —— 指标阈值、评级、错误列表一目了然
 *   —— 支持手动触发一条错误，验证采集链路是否真的通了
 */

const monitor = useMonitorStore()

const ratingLabel = {
  good: '良好',
  'needs-improvement': '需改进',
  poor: '较差',
} as const

const scoreTone = computed(() => {
  if (monitor.score >= 90) return 'good'
  if (monitor.score >= 60) return 'needs-improvement'
  return 'poor'
})

const metricDesc: Record<MetricName, string> = {
  LCP: '最大内容绘制 —— 首屏主要内容的加载完成时间',
  INP: '交互到下次绘制 —— 用户操作的响应延迟',
  CLS: '累积布局偏移 —— 页面元素的稳定性',
  TTFB: '首字节时间 —— 服务端响应速度',
  FCP: '首次内容绘制 —— 首个内容出现的时刻',
}

function triggerDemoError() {
  // 手动产生一条错误，验证 ErrorBoundary / 全局捕获链路
  try {
    throw new Error('这是一条用于验证监控链路的演示错误')
  } catch (e) {
    monitor.pushError({
      message: (e as Error).message,
      stack: (e as Error).stack,
      source: 'manual',
      at: Date.now(),
      url: location.pathname,
    })
  }
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('zh-CN')
}
</script>

<template>
  <div class="perf-page">
    <header class="perf-head">
      <h1>性能与健康</h1>
      <p>基于真实用户指标（RUM）的实时观测面板。</p>
    </header>

    <section class="score-card" :class="`tone-${scoreTone}`">
      <div class="score-value">{{ monitor.score || '—' }}</div>
      <div class="score-meta">
        <div class="score-title">综合评分</div>
        <div class="score-sub">
          已采集 {{ monitor.metricList.length }} 项核心指标 · 当前错误 {{ monitor.errorCount }} 条
        </div>
      </div>
      <button type="button" class="demo-btn" @click="triggerDemoError">触发演示错误</button>
    </section>

    <section class="metrics">
      <article
        v-for="m in monitor.metricList"
        :key="m.name"
        class="metric-card"
        :class="`rating-${m.rating}`"
      >
        <div class="metric-top">
          <span class="metric-name">{{ m.name }}</span>
          <span class="metric-badge">{{ ratingLabel[m.rating] }}</span>
        </div>
        <div class="metric-value">{{ formatMetric(m.name, m.value) }}</div>
        <p class="metric-desc">{{ metricDesc[m.name] }}</p>
      </article>

      <p v-if="!monitor.metricList.length" class="empty">
        指标采集中，稍后刷新或与页面交互后即可看到数据。
      </p>
    </section>

    <section class="errors">
      <div class="errors-head">
        <h2>运行时错误（最近 {{ monitor.errorCount }} 条）</h2>
        <button v-if="monitor.errorCount" type="button" @click="monitor.clearErrors()">清空</button>
      </div>
      <ul v-if="monitor.errors.length" class="error-list">
        <li v-for="(e, i) in monitor.errors" :key="`${e.at}-${i}`" class="error-item">
          <div class="error-row">
            <span class="error-source">{{ e.source }}</span>
            <span class="error-time">{{ formatTime(e.at) }}</span>
          </div>
          <p class="error-msg">{{ e.message }}</p>
          <p v-if="e.url" class="error-url">{{ e.url }}</p>
        </li>
      </ul>
      <p v-else class="empty">暂无错误，运行状态良好。</p>
    </section>
  </div>
</template>

<style scoped>
.perf-page {
  max-width: 960px;
  margin: 0 auto;
  padding: var(--space-8);
}

.perf-head {
  margin-bottom: var(--space-6);

  h1 {
    margin: 0 0 var(--space-2);
    font-size: var(--font-size-2xl);
  }

  p {
    margin: 0;
    color: var(--color-text-secondary);
  }
}

.score-card {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  margin-bottom: var(--space-6);

  &.tone-good {
    border-color: color-mix(in srgb, var(--color-success) 50%, transparent);
  }
  &.tone-needs-improvement {
    border-color: color-mix(in srgb, var(--color-warning) 50%, transparent);
  }
  &.tone-poor {
    border-color: color-mix(in srgb, var(--color-danger) 50%, transparent);
  }
}

.score-value {
  font-size: 56px;
  font-weight: 800;
  line-height: 1;
  min-width: 90px;
  text-align: center;
}

.tone-good .score-value {
  color: var(--color-success);
}
.tone-needs-improvement .score-value {
  color: var(--color-warning);
}
.tone-poor .score-value {
  color: var(--color-danger);
}

.score-meta {
  flex: 1;
}

.score-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
}

.score-sub {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-top: var(--space-1);
}

.demo-btn {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-surface-hover);
  color: var(--color-text);
  font-size: var(--font-size-sm);

  &:hover {
    background: var(--color-border);
  }
}

.metrics {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}

.metric-card {
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  background: var(--color-surface);

  &.rating-good {
    border-left: 4px solid var(--color-success);
  }
  &.rating-needs-improvement {
    border-left: 4px solid var(--color-warning);
  }
  &.rating-poor {
    border-left: 4px solid var(--color-danger);
  }
}

.metric-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metric-name {
  font-weight: 700;
  letter-spacing: 0.03em;
}

.metric-badge {
  font-size: var(--font-size-xs);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: var(--color-surface-hover);
  color: var(--color-text-secondary);
}

.rating-good .metric-badge {
  background: color-mix(in srgb, var(--color-success) 15%, transparent);
  color: var(--color-success);
}
.rating-needs-improvement .metric-badge {
  background: color-mix(in srgb, var(--color-warning) 15%, transparent);
  color: var(--color-warning);
}
.rating-poor .metric-badge {
  background: color-mix(in srgb, var(--color-danger) 15%, transparent);
  color: var(--color-danger);
}

.metric-value {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  margin: var(--space-2) 0;
}

.metric-desc {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.errors-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);

  h2 {
    margin: 0;
    font-size: var(--font-size-lg);
  }

  button {
    font-size: var(--font-size-sm);
    color: var(--color-primary);
  }
}

.error-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: var(--space-2);
}

.error-item {
  padding: var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
}

.error-row {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-xs);
  color: var(--color-text-disabled);
  margin-bottom: var(--space-1);
}

.error-source {
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.error-msg {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-danger);
  word-break: break-all;
}

.error-url {
  margin: var(--space-1) 0 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-disabled);
}

.empty {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  padding: var(--space-4) 0;
}

@media (max-width: 640px) {
  .score-card {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
