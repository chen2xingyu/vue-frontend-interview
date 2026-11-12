<script setup lang="ts">
/**
 * FeisCard —— 容器卡片组件
 * P9 面试点：纯容器组件的最小化设计
 * 只负责视觉（背景、圆角、阴影、内边距），业务内容用插槽注入
 */

defineProps<{
  title?: string
  subtitle?: string
  bordered?: boolean
  hoverable?: boolean
}>()
</script>

<template>
  <article :class="['feis-card', { bordered }, { hoverable }]">
    <header v-if="title || subtitle" class="feis-card__header">
      <h3 v-if="title" class="feis-card__title">{{ title }}</h3>
      <p v-if="subtitle" class="feis-card__subtitle">{{ subtitle }}</p>
    </header>
    <div class="feis-card__body">
      <slot />
    </div>
    <footer v-if="$slots.footer" class="feis-card__footer">
      <slot name="footer" />
    </footer>
  </article>
</template>

<style scoped>
.feis-card {
  background: var(--color-surface);
  border: 1px solid transparent;
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  transition:
    box-shadow var(--transition-fast),
    border-color var(--transition-fast);

  &.bordered {
    border-color: var(--color-border);
  }

  &.hoverable:hover {
    box-shadow: var(--shadow-md);
  }

  &__header {
    margin-bottom: var(--space-3);
  }

  &__title {
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: 600;
  }

  &__subtitle {
    margin: var(--space-1) 0 0;
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  &__body {
    /* flex column 让 slot 里的子元素能撑满 */
  }

  &__footer {
    margin-top: var(--space-4);
    padding-top: var(--space-3);
    border-top: 1px solid var(--color-border);
  }
}
</style>
