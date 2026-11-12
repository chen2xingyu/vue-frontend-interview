<script setup lang="ts">
import { computed } from 'vue'
import { questions } from '@domains/question'
import { useStudyStore } from '@app/stores'

/**
 * 学习路线 —— 按分类聚合，展示进度 + 推荐顺序
 *
 * P9 面试点：学习不是"把题背完"
 *   —— 正确顺序：先把 Vue 3 原理吃透，再看工程化和性能（这些是你每天都在碰的），
 *      然后组件设计/TS 类型，最后 Node.js、安全、架构场景
 *   —— 本页面把这个顺序显式化，每个分类有 P0/P1/P2 优先级标注
 */

const store = useStudyStore()

/** 推荐学习顺序 + 优先级 */
const ROADMAP: {
  category: string
  priority: 'P0' | 'P1' | 'P2'
  desc: string
}[] = [
  {
    category: 'Vue 2→3',
    priority: 'P0',
    desc: '日常开发基石，Proxy 响应式 + 组合式 API + 迁移策略',
  },
  { category: 'TypeScript', priority: 'P0', desc: '类型安全基础设施，泛型/联合类型/运行时校验' },
  { category: '工程化', priority: 'P1', desc: '构建/CI/依赖治理/发布闭环，把代码变成稳定交付' },
  { category: '性能优化', priority: 'P1', desc: '先测量再优化，Web Vitals + 分层排查方法' },
  { category: '组件设计', priority: 'P1', desc: '受控组件 + 插槽扩展 + 类型安全 API' },
  { category: 'Node.js', priority: 'P2', desc: '事件循环 + Worker Threads + 并发控制，BFF 必备' },
  { category: '登录与安全', priority: 'P2', desc: '认证授权边界 + 会话管理 + CSRF/XSS 防御' },
  { category: '架构场景', priority: 'P2', desc: '把前面知识组合成系统设计方案，P9 分水岭' },
]

/** 按 category 聚合进度 */
const roadmapData = computed(() => {
  return ROADMAP.map((r) => {
    const items = questions.filter((q) => q.category === r.category)
    const doneCount = items.filter((q) => store.done.includes(q.id)).length
    return {
      ...r,
      total: items.length,
      done: doneCount,
      ratio: items.length ? doneCount / items.length : 0,
      items,
    }
  })
})

/** 总体进度 */
const overall = computed(() => {
  const total = questions.length
  const done = questions.filter((q) => store.done.includes(q.id)).length
  return { total, done, ratio: total ? done / total : 0 }
})

const PRIORITY_TONE: Record<string, string> = {
  P0: 'tone-good',
  P1: 'tone-warm',
  P2: 'tone-muted',
}
</script>

<template>
  <div class="roadmap-page">
    <section class="overall">
      <div class="overall__label">整体进度</div>
      <div class="overall__bar">
        <div class="overall__fill" :style="{ width: (overall.ratio * 100).toFixed(1) + '%' }" />
      </div>
      <div class="overall__text">
        <strong>{{ overall.done }}</strong>
        <span>/ {{ overall.total }} 题已掌握</span>
      </div>
    </section>

    <section class="roadmap-list">
      <article v-for="item in roadmapData" :key="item.category" class="roadmap-card">
        <header class="roadmap-card__head">
          <div class="roadmap-card__title">
            <h3>{{ item.category }}</h3>
            <span :class="['roadmap-card__priority', PRIORITY_TONE[item.priority]]">
              {{ item.priority }}
            </span>
          </div>
          <span class="roadmap-card__count">{{ item.done }} / {{ item.total }}</span>
        </header>

        <p class="roadmap-card__desc">{{ item.desc }}</p>

        <div class="roadmap-card__progress">
          <div class="roadmap-card__fill" :style="{ width: (item.ratio * 100).toFixed(1) + '%' }" />
        </div>

        <ul v-if="item.items.length" class="roadmap-card__items">
          <li v-for="q in item.items" :key="q.id" :class="{ done: store.done.includes(q.id) }">
            <span class="check">{{ store.done.includes(q.id) ? '✓' : '○' }}</span>
            {{ q.title }}
            <button class="toggle" @click="store.markDone(q.id)">
              {{ store.done.includes(q.id) ? '撤销' : '标记' }}
            </button>
          </li>
        </ul>
      </article>
    </section>
  </div>
</template>

<style scoped>
.roadmap-page {
  max-width: 960px;
  margin: 0 auto;
  padding: var(--space-8);
}

.overall {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  margin-bottom: var(--space-8);
}

.overall__label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-2);
}

.overall__bar {
  height: 10px;
  background: var(--color-border);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: var(--space-2);
}

.overall__fill {
  height: 100%;
  background: linear-gradient(
    90deg,
    var(--color-primary),
    color-mix(in srgb, var(--color-primary) 60%, var(--color-success))
  );
  border-radius: var(--radius-full);
  transition: width var(--transition-normal);
}

.overall__text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);

  strong {
    color: var(--color-text);
    font-size: var(--font-size-lg);
  }
}

.roadmap-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.roadmap-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.roadmap-card__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.roadmap-card__title {
  display: flex;
  align-items: center;
  gap: var(--space-2);

  h3 {
    margin: 0;
    font-size: var(--font-size-lg);
  }
}

.roadmap-card__priority {
  font-size: var(--font-size-xs);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-weight: 600;

  &.tone-good {
    background: color-mix(in srgb, var(--color-success) 15%, transparent);
    color: var(--color-success);
  }

  &.tone-warm {
    background: color-mix(in srgb, var(--color-primary) 15%, transparent);
    color: var(--color-primary);
  }

  &.tone-muted {
    background: var(--color-surface-hover);
    color: var(--color-text-secondary);
  }
}

.roadmap-card__count {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.roadmap-card__desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.6;
}

.roadmap-card__progress {
  height: 4px;
  background: var(--color-border);
  border-radius: 2px;
  overflow: hidden;
}

.roadmap-card__fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 2px;
  transition: width var(--transition-normal);
}

.roadmap-card__items {
  list-style: none;
  margin: var(--space-2) 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);

  li {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    transition: background var(--transition-fast);

    &:hover {
      background: var(--color-surface-hover);
    }

    &.done {
      color: var(--color-text);
    }

    .check {
      width: 16px;
      text-align: center;
      flex-shrink: 0;
      font-size: var(--font-size-xs);
      color: var(--color-text-disabled);

      .done & {
        color: var(--color-success);
      }
    }

    button.toggle {
      margin-left: auto;
      font-size: var(--font-size-xs);
      padding: 1px 8px;
      border-radius: var(--radius-full);
      background: transparent;
      color: var(--color-text-secondary);
      border: 1px solid var(--color-border);
      transition: all var(--transition-fast);

      &:hover {
        color: var(--color-primary);
        border-color: var(--color-primary);
      }
    }
  }
}
</style>
