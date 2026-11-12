<script setup lang="ts">
import { useStudyStore } from '@app/stores'
import { RouterLink } from 'vue-router'

const store = useStudyStore()
</script>

<template>
  <div class="dashboard">
    <section class="hero">
      <h1>把经验，变成清晰的表达。</h1>
      <p>围绕真实业务场景，系统梳理 Vue、工程化、性能与架构问题。</p>
    </section>

    <section class="stats">
      <div class="stat-card">
        <div class="stat-label">精选面试问题</div>
        <div class="stat-value">{{ store.progress.total }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">已掌握</div>
        <div class="stat-value">{{ store.progress.done }} / {{ store.progress.total }}</div>
        <div class="progress-bar">
          <i :style="{ width: (store.progress.ratio * 100).toFixed(1) + '%' }" />
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">稍后复习</div>
        <div class="stat-value">{{ store.saved.length }}</div>
      </div>
    </section>

    <section class="question-list">
      <div class="section-head">
        <h2>今天想攻克哪一题？</h2>
        <span>共 {{ store.filtered.length }} 个问题</span>
      </div>

      <div class="filter-bar">
        <input v-model="store.query" placeholder="搜索问题、技术点或场景…" />
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
      </div>

      <ul class="questions">
        <li
          v-for="q in store.filtered"
          :key="q.id"
          v-memo="[q.id, store.saved.includes(q.id), store.done.includes(q.id)]"
          class="question"
        >
          <div class="q-meta">
            <span class="pill">{{ q.category }}</span>
            <span class="level">{{ q.level }}</span>
          </div>
          <h3>
            <RouterLink :to="{ name: 'question-detail', params: { id: q.id } }">
              {{ q.title }}
            </RouterLink>
          </h3>
          <p>{{ q.summary }}</p>
          <div class="q-tags">
            <span v-for="t in q.tags" :key="t" class="tag">#{{ t }}</span>
          </div>
          <div class="q-actions">
            <button @click="store.toggleSaved(q.id)">
              {{ store.saved.includes(q.id) ? '★ 已收藏' : '☆ 收藏' }}
            </button>
            <button @click="store.markDone(q.id)">
              {{ store.done.includes(q.id) ? '✓ 已掌握' : '标记掌握' }}
            </button>
          </div>
        </li>
      </ul>

      <p v-if="!store.filtered.length" class="empty">没有找到相关问题，试试其他关键词。</p>
    </section>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 960px;
  margin: 0 auto;
  padding: var(--space-8);
}

.hero {
  margin-bottom: var(--space-8);

  h1 {
    font-size: var(--font-size-2xl);
    margin: 0 0 var(--space-2);
  }

  p {
    color: var(--color-text-secondary);
    margin: 0;
  }
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}

.stat-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);

  .stat-label {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  .stat-value {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    margin: var(--space-2) 0;
  }
}

.progress-bar {
  height: 6px;
  background: var(--color-border);
  border-radius: var(--radius-full);
  overflow: hidden;

  i {
    display: block;
    height: 100%;
    background: var(--color-primary);
    border-radius: var(--radius-full);
    transition: width var(--transition-normal);
  }
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: var(--space-4);

  h2 {
    margin: 0;
    font-size: var(--font-size-xl);
  }

  span {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }
}

.filter-bar {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
  flex-wrap: wrap;

  input {
    flex: 1;
    min-width: 200px;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    color: var(--color-text);
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
}

.questions {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: var(--space-4);
}

.question {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  transition: box-shadow var(--transition-fast);

  &:hover {
    box-shadow: var(--shadow-md);
  }

  h3 {
    margin: var(--space-2) 0;

    a {
      color: inherit;
      text-decoration: none;

      &:hover {
        color: var(--color-primary);
      }
    }
  }

  p {
    color: var(--color-text-secondary);
    margin: 0 0 var(--space-3);
  }
}

.q-meta {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

.pill {
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  color: var(--color-primary);
  padding: 2px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.level {
  font-size: var(--font-size-xs);
  color: var(--color-text-disabled);
}

.q-tags {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  margin-bottom: var(--space-3);

  .tag {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
  }
}

.q-actions {
  display: flex;
  gap: var(--space-2);

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
  padding: var(--space-8);
}

@media (max-width: 640px) {
  .stats {
    grid-template-columns: 1fr;
  }
}
</style>
