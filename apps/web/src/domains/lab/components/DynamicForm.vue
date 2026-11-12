<script setup lang="ts">
/**
 * Schema 驱动的动态表单组件
 *
 * P9 面试点：动态表单的核心技术点
 *
 * 1. v-model + computed 双向绑定：
 *    子组件 emit('update:modelValue') → 父组件 @update:modelValue 接收
 *    父组件用 setValue() 更新全局 formData，再用 computed 传递给子组件
 *
 * 2. 动态组件：
 *    v-if="resolveField(field.kind)" 避免未知 kind 崩掉
 *    :is="resolveField(field.kind)" 渲染注册表里的组件
 *
 * 3. 字段联动（visibleWhen）：
 *    computed 根据 formData 实时计算是否隐藏
 *    —— 这正是依赖图简化版（单向、无环）
 *
 * 4. 统一提交：
 *    submit 时遍历 fields 收集值 + 校验
 *    校验失败的字段就地显示错误信息
 */

import { reactive, type Component } from 'vue'
import type { FormField, FormSchema } from '../types/schema'
import { resolveField } from './registry'

const props = defineProps<{
  schema: FormSchema
}>()

const emit = defineEmits<{
  (e: 'submit', values: Record<string, unknown>): void
}>()

// --- formData：所有字段值扁平存一个对象 ---
const initialState: Record<string, unknown> = {}
for (const f of props.schema.fields) {
  initialState[f.key] = f.value ?? defaultFor(f.kind)
}
const formData = reactive<Record<string, unknown>>(initialState)

function defaultFor(kind: FormField['kind']): unknown {
  switch (kind) {
    case 'checkbox':
    case 'switch':
      return false
    case 'number':
      return 0
    default:
      return ''
  }
}

function setValue(key: string, value: unknown) {
  formData[key] = value
}

// --- 字段可见性 ---
function isFieldVisible(field: FormField): boolean {
  if (field.hidden) return false
  if (!field.visibleWhen) return true
  return formData[field.visibleWhen.field] === field.visibleWhen.equals
}

// --- 校验 ---
const errors = reactive<Record<string, string | null>>({})

function validateField(field: FormField): string | null {
  if (field.required && !formData[field.key]) return '必填'
  if (field.validate) return field.validate(formData[field.key])
  return null
}

function handleSubmit() {
  let hasError = false
  for (const f of props.schema.fields) {
    errors[f.key] = validateField(f)
    if (errors[f.key]) hasError = true
  }
  if (hasError) return
  emit('submit', { ...formData })
}
</script>

<template>
  <form class="dynamic-form" @submit.prevent="handleSubmit">
    <h3 class="dynamic-form__title">{{ schema.title }}</h3>

    <div class="dynamic-form__fields">
      <template v-for="field in schema.fields" :key="field.key">
        <template v-if="isFieldVisible(field)">
          <component
            :is="(resolveField(field.kind) as Component) ?? null"
            v-if="resolveField(field.kind)"
            :model-value="formData[field.key]"
            :field="field"
            :error="errors[field.key]"
            @update:model-value="(v: unknown) => setValue(field.key, v)"
          />
          <p v-else class="unknown-field">⚠ 未注册的字段类型: {{ field.kind }}</p>
        </template>
      </template>
    </div>

    <button type="submit" class="dynamic-form__submit">提交</button>
  </form>
</template>

<style scoped>
.dynamic-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-6);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.dynamic-form__title {
  margin: 0;
  font-size: var(--font-size-lg);
}

.dynamic-form__fields {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.dynamic-form__submit {
  align-self: flex-start;
  padding: var(--space-2) var(--space-6);
  background: var(--color-primary);
  color: #fff;
  border-radius: var(--radius-md);
  font-weight: 600;
}

.unknown-field {
  color: var(--color-warning);
  font-size: var(--font-size-sm);
}
</style>
