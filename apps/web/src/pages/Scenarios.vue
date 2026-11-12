<script setup lang="ts">
import { computed } from 'vue'
import { questions } from '@domains/question'

/**
 * 业务场景 —— 把每道题的 scenario 字段抽出来，按 level 分层展示
 *
 * P9 面试点：为什么场景题比原理题难？
 *   —— 原理题可以"背答案"，场景题考察的是"把知识组织成解决路径"的能力
 *   —— 本页面的结构就是帮助你看到：一个场景下要调用哪些原理、怎么落地
 */

/** 按 level 分组（高频 → 核心原理 → 业务场景 → 系统设计 → 综合设计） */
const LEVEL_ORDER = ['高频', '核心原理', '业务场景', '系统设计', '综合设计']

const grouped = computed(() => {
  const map = new Map<string, typeof questions>()
  for (const q of questions) {
    const list = map.get(q.level) ?? []
    list.push(q)
    map.set(q.level, list)
  }
  return LEVEL_ORDER.filter((l) => map.has(l)).map((l) => ({
    level: l,
    items: map.get(l)!,
  }))
})
</script>

<template>
  <div class="scenarios-page">
    <section class="hero">
      <h1>业务场景</h1>
      <p>9 道真实业务问题，看清"问题 → 场景 → 追问"的完整链路。</p>
    </section>

    <section v-for="group in grouped" :key="group.level" class="scenario-group">
      <h2 class="scenario-group__title">
        <span class="scenario-group__bar" />
        {{ group.level }}
        <span class="scenario-group__count">{{ group.items.length }} 题</span>
      </h2>

      <div class="scenario-grid">
        <article v-for="q in group.items" :key="q.id" class="scenario-card">
          <header class="scenario-card__head">
            <h3>{{ q.title }}</h3>
            <span class="scenario-card__cat">{{ q.category }}</span>
          </header>

          <section class="scenario-card__scene">
            <span class="scenario-card__scene-label">🎯 业务场景</span>
            <p>{{ q.scenario }}</p>
          </section>

          <section class="scenario-card__follows">
            <span class="scenario-card__follows-label">🔍 追问</span>
            <ul>
              <li v-for="(f, i) in q.followups" :key="i">{{ f }}</li>
            </ul>
          </section>

          <footer class="scenario-card__tags">
            <span v-for="t in q.tags" :key="t">#{{ t }}</span>
          </footer>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.scenarios-page {
  max-width: 1100px;
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

.scenario-group {
  margin-bottom: var(--space-10);
}

.scenario-group__title {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin: 0 0 var(--space-4);
  font-size: var(--font-size-xl);

  .scenario-group__bar {
    width: 4px;
    height: 20px;
    background: var(--color-primary);
    border-radius: 2px;
  }

  .scenario-group__count {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    font-weight: normal;
  }
}

.scenario-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: var(--space-4);
}

.scenario-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  transition: box-shadow var(--transition-fast);

  &:hover {
    box-shadow: var(--shadow-md);
  }
}

.scenario-card__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-2);

  h3 {
    font-size: var(--font-size-md);
    margin: 0;
    line-height: 1.4;
  }
}

.scenario-card__cat {
  font-size: var(--font-size-xs);
  padding: 2px 10px;
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  color: var(--color-primary);
  border-radius: var(--radius-full);
  white-space: nowrap;
  font-weight: 600;
}

.scenario-card__scene {
  background: color-mix(in srgb, var(--color-primary) 5%, transparent);
  border-radius: var(--radius-md);
  padding: var(--space-3);

  .scenario-card__scene-label {
    display: block;
    font-size: var(--font-size-xs);
    font-weight: 600;
    color: var(--color-primary);
    margin-bottom: var(--space-1);
  }

  p {
    margin: 0;
    font-size: var(--font-size-sm);
    line-height: 1.6;
    color: var(--color-text);
  }
}

.scenario-card__follows {
  .scenario-card__follows-label {
    display: block;
    font-size: var(--font-size-xs);
    font-weight: 600;
    color: var(--color-text-secondary);
    margin-bottom: var(--space-1);
  }

  ul {
    margin: 0;
    padding-left: var(--space-4);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
}

.scenario-card__tags {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  font-size: var(--font-size-xs);
  color: var(--color-text-disabled);
}
</style>
