<script setup lang="ts">
import { useStudyStore } from '@app/stores'
import { RouterLink } from 'vue-router'

/**
 * 面试题库 —— 比 Dashboard 更聚焦：去掉 Hero/stats，直接按分类 + 层级浏览
 *
 * P9 面试点：同一套 store 服务多个视图
 *   —— Dashboard 看进度全景，Questions 做精准筛选，Roadmap 按路线推进
 *   —— 三个页面都操作同一份 store，收藏/标记状态在它们之间自动同步
 */
const store = useStudyStore()
</script>

<template>
  <div class="questions-page">
    <section class="filter-bar">
      <div class="search-wrap">
        <input v-model="store.query" placeholder="搜索关键词、技术点…" />
      </div>
      <div class="categories">
        <button
          v-for="c in store.categories"
          :key="c"
          :class="{ active: store.category === c }"
          @click="store.category = c"
        >
          {{ c }}
        </button>
      </div>
    </section>

    <p v-if="store.category !== '全部'" class="filter-hint">
      当前分类 <strong>{{ store.category }}</strong> · 共 {{ store.filtered.length }} 题
    </p>

    <ul class="q-grid">
      <li
        v-for="q in store.filtered"
        :key="q.id"
        v-memo="[q.id, store.saved.includes(q.id), store.done.includes(q.id)]"
        class="q-card"
      >
        <div class="q-card__head">
          <span class="q-card__pill">{{ q.category }}</span>
          <span class="q-card__level">{{ q.level }}</span>
          <span v-if="store.done.includes(q.id)" class="q-card__tag q-card__tag--done"
            >✓ 已掌握</span
          >
        </div>

        <h3 class="q-card__title">
          <RouterLink :to="{ name: 'question-detail', params: { id: q.id } }">
            {{ q.title }}
          </RouterLink>
        </h3>
        <p class="q-card__summary">{{ q.summary }}</p>

        <div class="q-card__tags">
          <span v-for="t in q.tags" :key="t" class="q-card__tag">#{{ t }}</span>
        </div>

        <div class="q-card__followups">
          <span class="q-card__follow-label">追问</span>
          <span v-for="(f, i) in q.followups" :key="i" class="q-card__follow">{{ f }}</span>
        </div>

        <div class="q-card__actions">
          <button @click="store.toggleSaved(q.id)">
            {{ store.saved.includes(q.id) ? '★ 已收藏' : '☆ 收藏' }}
          </button>
          <button @click="store.markDone(q.id)">
            {{ store.done.includes(q.id) ? '✓ 已掌握' : '标记掌握' }}
          </button>
        </div>
      </li>
    </ul>

    <p v-if="!store.filtered.length" class="empty">没有匹配的问题。</p>
  </div>
</template>

<style scoped>
.questions-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--space-8);
}

.filter-bar {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-2);
}

.search-wrap input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: var(--font-size-md);
}

.categories {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;

  button {
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-full);
    font-size: var(--font-size-sm);
    background: var(--color-surface);
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border);
    transition: all var(--transition-fast);

    &.active {
      background: var(--color-primary);
      color: #fff;
      border-color: var(--color-primary);
    }
  }
}

.filter-hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: var(--space-3) 0 var(--space-6);
}

.q-grid {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: var(--space-4);
}

.q-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  transition:
    box-shadow var(--transition-fast),
    border-color var(--transition-fast);

  &:hover {
    box-shadow: var(--shadow-md);
    border-color: color-mix(in srgb, var(--color-primary) 30%, var(--color-border));
  }
}

.q-card__head {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  flex-wrap: wrap;
}

.q-card__pill {
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  color: var(--color-primary);
  padding: 2px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.q-card__level {
  font-size: var(--font-size-xs);
  color: var(--color-text-disabled);
}

.q-card__title {
  font-size: var(--font-size-lg);
  margin: var(--space-1) 0;
  line-height: 1.4;

  a {
    color: inherit;
    text-decoration: none;

    &:hover {
      color: var(--color-primary);
    }
  }
}

.q-card__summary {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  margin: 0;
  line-height: 1.6;
}

.q-card__tags {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;

  .q-card__tag {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
  }

  .q-card__tag--done {
    color: var(--color-success);
    font-weight: 600;
  }
}

.q-card__followups {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: var(--font-size-sm);
  padding: var(--space-2) var(--space-3);
  background: var(--color-surface-hover);
  border-radius: var(--radius-md);
  border-left: 2px solid var(--color-primary);

  .q-card__follow-label {
    font-size: var(--font-size-xs);
    color: var(--color-primary);
    font-weight: 600;
    margin-bottom: 2px;
  }

  .q-card__follow {
    color: var(--color-text-secondary);
  }
}

.q-card__actions {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-1);

  button {
    padding: var(--space-1) var(--space-3);
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

.empty {
  text-align: center;
  color: var(--color-text-secondary);
  padding: var(--space-10);
}
</style>
