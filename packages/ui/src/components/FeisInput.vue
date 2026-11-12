<script setup lang="ts">
/**
 * FeisInput —— 受控输入框
 * P9 面试点：v-model 的本质 + 受控 vs 非受控
 *
 * Vue 3.4+ defineModel 语法糖让 v-model = modelValue + update:modelValue
 * 背后仍是 props + emits 的经典受控模式
 */

import { computed } from 'vue'

const modelValue = defineModel<string | number>({ default: '' })

const props = withDefaults(
  defineProps<{
    label?: string
    placeholder?: string
    type?: 'text' | 'number' | 'email' | 'password' | 'search'
    disabled?: boolean
    readonly?: boolean
    required?: boolean
    error?: string
    hint?: string
    /** 显示清除按钮（v-model 有值且非 disabled 时） */
    clearable?: boolean
  }>(),
  {
    type: 'text',
  },
)

const emit = defineEmits<{
  (e: 'focus', event: FocusEvent): void
  (e: 'blur', event: FocusEvent): void
  (e: 'clear'): void
  (e: 'update:modelValue', value: string | number): void
}>()

const showClear = computed(
  () =>
    props.clearable && modelValue.value !== '' && modelValue.value !== undefined && !props.disabled,
)

function handleClear() {
  modelValue.value = ''
  emit('clear')
}
</script>

<template>
  <label v-if="label" class="feis-input__label">
    {{ label }}
    <span v-if="required" class="feis-input__required">*</span>
  </label>

  <div :class="['feis-input', { 'has-error': !!error }, { 'is-disabled': disabled }]">
    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
      :aria-invalid="!!error"
      aria-describedby="hint"
      @focus="emit('focus', $event)"
      @blur="emit('blur', $event)"
    />
    <button
      v-if="showClear"
      type="button"
      class="feis-input__clear"
      aria-label="清除"
      @click="handleClear"
    >
      ×
    </button>
  </div>

  <p v-if="error" class="feis-input__hint is-error" role="alert">{{ error }}</p>
  <p v-else-if="hint" class="feis-input__hint">{{ hint }}</p>
</template>

<style scoped>
.feis-input {
  display: flex;
  align-items: center;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);

  &:focus-within {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent);
  }

  &.has-error {
    border-color: var(--color-danger);

    &:focus-within {
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-danger) 15%, transparent);
    }
  }

  &.is-disabled {
    background: var(--color-surface-hover);
    opacity: 0.6;
  }

  input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    padding: var(--space-2) var(--space-3);
    font-size: var(--font-size-md);
    color: var(--color-text);
  }

  &__label {
    display: block;
    margin-bottom: var(--space-1);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  &__required {
    color: var(--color-danger);
    margin-left: 2px;
  }

  &__clear {
    margin-right: var(--space-2);
    color: var(--color-text-disabled);
    font-size: 18px;
    cursor: pointer;
    line-height: 1;
    border: none;
    background: none;

    &:hover {
      color: var(--color-text-secondary);
    }
  }

  &__hint {
    margin: var(--space-1) 0 0;
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);

    &.is-error {
      color: var(--color-danger);
    }
  }
}
</style>
