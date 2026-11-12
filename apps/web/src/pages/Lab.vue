<script setup lang="ts">
import { ref } from 'vue'
import DynamicForm from '@domains/lab/components/DynamicForm.vue'
import type { FormSchema } from '@domains/lab/types/schema'
import VirtualList from '@shared/components/VirtualList.vue'

/**
 * 组件实验室
 * 这里集中展示两类"数据规模/配置复杂度"较高的组件：
 *   1. Schema 驱动动态表单 —— 配置即 UI，新增字段类型只需注册组件
 *   2. 虚拟列表 —— 10000 行数据只渲染视口内的 DOM
 */

// ---------- 动态表单 ----------
const formSchema: FormSchema = {
  version: 1,
  id: 'question-publish',
  title: '发布一道面试题',
  fields: [
    {
      kind: 'text',
      key: 'title',
      label: '题目标题',
      required: true,
      placeholder: '例如：Vue 3 响应式系统为什么用 Proxy？',
      maxLength: 80,
    },
    {
      kind: 'select',
      key: 'category',
      label: '所属分类',
      required: true,
      options: [
        { label: 'Vue 2→3', value: 'vue' },
        { label: '工程化', value: 'engineering' },
        { label: '性能优化', value: 'performance' },
        { label: '架构场景', value: 'architecture' },
      ],
    },
    {
      kind: 'radio',
      key: 'level',
      label: '难度',
      options: [
        { label: '高频', value: 'high-frequency' },
        { label: '核心原理', value: 'principle' },
        { label: '系统设计', value: 'system' },
      ],
      value: 'high-frequency',
    },
    {
      kind: 'number',
      key: 'expectedMinutes',
      label: '预计作答时长（分钟）',
      min: 1,
      max: 60,
      step: 5,
      value: 10,
    },
    { kind: 'switch', key: 'scheduled', label: '定时发布' },
    {
      kind: 'text',
      key: 'publishAt',
      label: '定时发布时间',
      placeholder: '2026-11-12 10:00',
      // 字段联动：只有打开"定时发布"才出现
      visibleWhen: { field: 'scheduled', equals: true },
    },
    {
      kind: 'checkbox',
      key: 'agree',
      label: '我确认内容符合社区规范',
      required: true,
    },
  ],
}

const submitted = ref<Record<string, unknown> | null>(null)

function onSubmit(values: Record<string, unknown>) {
  submitted.value = values
}

// ---------- 虚拟列表 ----------
const ROW_COUNT = 10000

const rows = Array.from({ length: ROW_COUNT }, (_, i) => ({
  id: i + 1,
  label: `虚拟行 ${i + 1} —— 只有视口附近的行会被渲染成真实 DOM`,
}))
</script>

<template>
  <div class="lab">
    <section class="hero">
      <h1>组件实验室</h1>
      <p>用真实可交互的示例，验证「配置驱动」与「按需渲染」两类设计。</p>
    </section>

    <section class="block">
      <div class="block-head">
        <h2>Schema 驱动动态表单</h2>
        <span>7 个字段 / 6 种类型 / 条件显隐</span>
      </div>
      <DynamicForm :schema="formSchema" @submit="onSubmit" />
      <pre v-if="submitted" class="result">{{ JSON.stringify(submitted, null, 2) }}</pre>
    </section>

    <section class="block">
      <div class="block-head">
        <h2>虚拟列表</h2>
        <span>{{ ROW_COUNT }} 行数据，DOM 数量恒定</span>
      </div>
      <div class="virtual-demo">
        <VirtualList :items="rows" :item-height="40" :height="320" :item-key="(item) => item.id">
          <template #default="{ item, index }">
            <div class="vrow">
              <span class="vrow__index">#{{ index + 1 }}</span>
              <span class="vrow__label">{{ item.label }}</span>
            </div>
          </template>
        </VirtualList>
      </div>
    </section>
  </div>
</template>

<style scoped>
.lab {
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

.block {
  margin-bottom: var(--space-10);
}

.block-head {
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

.result {
  margin-top: var(--space-4);
  padding: var(--space-4);
  background: var(--color-surface-hover);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  overflow-x: auto;
}

.virtual-demo {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--color-surface);
}

.vrow {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: 100%;
  padding: 0 var(--space-4);
  border-bottom: 1px solid var(--color-border);
  font-size: var(--font-size-sm);
}

.vrow__index {
  width: 64px;
  color: var(--color-text-disabled);
  font-variant-numeric: tabular-nums;
}

.vrow__label {
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
