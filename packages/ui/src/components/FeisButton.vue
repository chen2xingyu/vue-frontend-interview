<script setup lang="ts">
/**
 * FeisButton —— 基础按钮组件
 * P9 面试点：组件 API 设计原则
 *
 * 1. 受控与非受控：Button 本身是"声明式"的，没有 value，事件用 emits('click')
 * 2. v-model 不适用 Button，但需要 disabled / loading 两个交互态
 * 3. size / variant 走 props，不走 className 字符串（类型安全 + 主题系统好接入）
 * 4. forwardProps 透传原生 button 属性（type/form/autofocus/aria-*）
 * 5. $slots.default 就是 children，不单独提供 icon prop（插槽更灵活）
 */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
type Size = 'sm' | 'md' | 'lg'

defineProps<{
  variant?: Variant
  size?: Size
  disabled?: boolean
  loading?: boolean
  block?: boolean
  /** 原生 button type */
  type?: 'button' | 'submit' | 'reset'
}>()

defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

// 透传所有剩余属性给 <button>
const attrs = defineAttrs()
</script>

<template>
  <button
    :class="[
      'feis-btn',
      `feis-btn--${variant ?? 'primary'}`,
      `feis-btn--${size ?? 'md'}`,
      { 'feis-btn--block': block },
      { 'is-disabled': disabled || loading },
    ]"
    :disabled="disabled || loading"
    :type="type ?? 'button'"
    v-bind="attrs"
    @click="(e) => !disabled && !loading && $emit('click', e)"
  >
    <span v-if="loading" class="feis-btn__spinner" aria-hidden="true" />
    <span class="feis-btn__content">
      <slot />
    </span>
  </button>
</template>

<style scoped>
/* P9 面试点：为什么用 CSS 变量 + BEM 命名？
 * —— 主题切换只改变量值，不改组件结构
 * —— BEM 避免命名冲突，scoped 进一步隔离
 */
.feis-btn {
  --bg: var(--feis-btn-primary-bg, var(--color-primary));
  --fg: var(--feis-btn-primary-fg, #fff);
  --border: var(--feis-btn-primary-border, transparent);
  --hover: var(--feis-btn-primary-hover, var(--color-primary-hover));

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-md);
  font-weight: 600;
  line-height: 1.5;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--fg);
  cursor: pointer;
  transition:
    background var(--transition-fast),
    border-color var(--transition-fast),
    transform 0.05s ease,
    opacity var(--transition-fast);
  user-select: none;

  &:hover:not(.is-disabled) {
    background: var(--hover);
  }

  &:active:not(.is-disabled) {
    transform: translateY(1px);
  }

  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  /* --- Variants --- */
  &--primary {
    --bg: var(--color-primary);
    --fg: #fff;
    --border: transparent;
    --hover: var(--color-primary-hover);
  }
  &--secondary {
    --bg: var(--color-surface);
    --fg: var(--color-text);
    --border: var(--color-border);
    --hover: var(--color-surface-hover);
  }
  &--ghost {
    --bg: transparent;
    --fg: var(--color-primary);
    --border: transparent;
    --hover: color-mix(in srgb, var(--color-primary) 10%, transparent);
  }
  &--danger {
    --bg: var(--color-danger);
    --fg: #fff;
    --border: transparent;
    --hover: color-mix(in srgb, var(--color-danger) 80%, black);
  }
  &--success {
    --bg: var(--color-success);
    --fg: #fff;
    --border: transparent;
    --hover: color-mix(in srgb, var(--color-success) 80%, black);
  }

  /* --- Sizes --- */
  &--sm {
    padding: 4px 10px;
    font-size: var(--font-size-sm);
    border-radius: var(--radius-sm);
  }
  &--lg {
    padding: 10px 24px;
    font-size: var(--font-size-lg);
    border-radius: var(--radius-lg);
  }

  &--block {
    width: 100%;
  }

  /* --- Loading spinner --- */
  &__spinner {
    width: 14px;
    height: 14px;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: feis-btn-spin 0.6s linear infinite;
  }
}

@keyframes feis-btn-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
