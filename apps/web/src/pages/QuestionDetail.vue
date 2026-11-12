<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStudyStore } from '@app/stores'

/**
 * 题目详情页 —— /questions/:id
 *
 * P9 面试点：详情页的数据从哪来？
 *   —— 不从 URL 参数直接请求单个接口，而是复用 store 里已加载的列表。
 *      原因：列表页点进来时数据已在内存，零请求、零闪烁；
 *      代价：直接访问 URL（分享链接）时依赖 store 已初始化 ——
 *      所以这里处理了 loading / not-found 两种兜底态。
 */
const route = useRoute()
const router = useRouter()
const store = useStudyStore()

const id = computed(() => String(route.params.id ?? ''))

const question = computed(() => store.questions.find((q) => q.id === id.value) ?? null)
const index = computed(() => store.questions.findIndex((q) => q.id === id.value))

const prev = computed(() => (index.value > 0 ? store.questions[index.value - 1] : null))
const next = computed(() => {
  const i = index.value
  return i >= 0 && i < store.questions.length - 1 ? store.questions[i + 1] : null
})

/** 列表还没加载完，不能立刻判定"题目不存在" */
const pending = computed(() => store.loading && store.questions.length === 0)

function go(target?: { id: string }) {
  if (target) {
    void router.push({ name: 'question-detail', params: { id: target.id } })
  }
}
</script>

<template>
  <div class="detail-page">
    <!-- 加载中 -->
    <div v-if="pending" class="placeholder">正在加载题目…</div>

    <!-- 题目不存在 -->
    <div v-else-if="!question" class="placeholder">
      <p>没有找到这道题。</p>
      <button class="ghost" @click="router.push('/questions')">返回题库</button>
    </div>

    <!-- 正常内容 -->
    <article v-else class="detail">
      <nav class="crumbs">
        <button class="ghost" @click="router.push('/questions')">← 题库</button>
        <span class="crumbs__sep">/</span>
        <span class="crumbs__cat">{{ question.category }}</span>
      </nav>

      <header class="head">
        <h1>{{ question.title }}</h1>
        <div class="head__meta">
          <span class="pill">{{ question.level }}</span>
          <span v-if="store.done.includes(question.id)" class="pill pill--ok">✓ 已掌握</span>
        </div>
      </header>

      <p class="summary">{{ question.summary }}</p>

      <div class="actions">
        <button @click="store.toggleSaved(question.id)">
          {{ store.saved.includes(question.id) ? '★ 已收藏' : '☆ 收藏' }}
        </button>
        <button @click="store.markDone(question.id)">
          {{ store.done.includes(question.id) ? '✓ 已掌握' : '标记掌握' }}
        </button>
      </div>

      <section v-if="question.scenario" class="block block--scene">
        <h2>业务场景</h2>
        <p>{{ question.scenario }}</p>
      </section>

      <section class="block">
        <h2>参考解析</h2>
        <p class="answer">{{ question.answer }}</p>
      </section>

      <section v-if="question.followups.length" class="block">
        <h2>可能的追问</h2>
        <ol class="followups">
          <li v-for="(f, i) in question.followups" :key="i">{{ f }}</li>
        </ol>
      </section>

      <footer class="tags">
        <span v-for="t in question.tags" :key="t">#{{ t }}</span>
      </footer>

      <nav class="pager">
        <button class="ghost" :disabled="!prev" @click="go(prev ?? undefined)">
          ← {{ prev ? prev.title : '已是第一题' }}
        </button>
        <button class="ghost" :disabled="!next" @click="go(next ?? undefined)">
          {{ next ? next.title : '已是最后一题' }} →
        </button>
      </nav>
    </article>
  </div>
</template>

<style scoped>
.detail-page {
  max-width: 820px;
  margin: 0 auto;
  padding: var(--space-8);
}

.placeholder {
  text-align: center;
  padding: var(--space-10);
  color: var(--color-text-secondary);

  p {
    margin-bottom: var(--space-4);
  }
}

.detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.crumbs {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.crumbs__sep {
  color: var(--color-text-disabled);
}

.crumbs__cat {
  color: var(--color-primary);
}

.head h1 {
  margin: 0 0 var(--space-2);
  font-size: var(--font-size-2xl);
  line-height: 1.35;
}

.head__meta {
  display: flex;
  gap: var(--space-2);
}

.pill {
  font-size: var(--font-size-xs);
  padding: 2px 10px;
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  color: var(--color-primary);
  font-weight: 600;
}

.pill--ok {
  background: color-mix(in srgb, var(--color-success) 15%, transparent);
  color: var(--color-success);
}

.summary {
  margin: 0;
  color: var(--color-text-secondary);
  line-height: 1.7;
}

.actions {
  display: flex;
  gap: var(--space-2);

  button {
    padding: var(--space-1) var(--space-4);
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    background: var(--color-surface-hover);
    color: var(--color-text);
    transition: background var(--transition-fast);

    &:hover {
      background: var(--color-border);
    }
  }
}

.block {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);

  h2 {
    margin: 0 0 var(--space-3);
    font-size: var(--font-size-lg);
  }
}

.block--scene {
  border-left: 3px solid var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 4%, var(--color-surface));

  p {
    margin: 0;
    line-height: 1.7;
  }
}

.answer {
  margin: 0;
  line-height: 1.85;
  white-space: pre-wrap;
  color: var(--color-text);
}

.followups {
  margin: 0;
  padding-left: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  color: var(--color-text-secondary);
  line-height: 1.6;
  font-size: var(--font-size-sm);
}

.tags {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  font-size: var(--font-size-xs);
  color: var(--color-text-disabled);
}

.pager {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  margin-top: var(--space-4);

  button {
    max-width: 48%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

button.ghost {
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  transition: all var(--transition-fast);

  &:hover:not(:disabled) {
    color: var(--color-primary);
    border-color: var(--color-primary);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}
</style>
