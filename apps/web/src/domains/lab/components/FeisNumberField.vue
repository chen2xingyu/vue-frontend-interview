<script setup lang="ts">
import type { NumberField } from '../types/schema'
defineProps<{ field: NumberField; modelValue: number | null; error?: string | null }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: number | null): void }>()
function parse(v: string) {
  const n = Number(v)
  emit('update:modelValue', Number.isNaN(n) ? null : n)
}
</script>

<template>
  <div class="ff-field">
    <label v-if="field.label"
      >{{ field.label }}<span v-if="field.required" class="req">*</span></label
    >
    <input
      type="number"
      :value="modelValue ?? ''"
      :disabled="field.disabled"
      :min="field.min"
      :max="field.max"
      :step="field.step"
      class="ff-input"
      :class="{ err: !!error }"
      @input="parse(($event.target as HTMLInputElement).value)"
    />
    <span v-if="error" class="ff-err">{{ error }}</span>
  </div>
</template>

<style scoped>
.ff-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ff-field label {
  font-size: 13px;
  color: var(--color-text-secondary);
}
.req {
  color: var(--color-danger);
  margin-left: 2px;
}
.ff-input {
  padding: 6px 10px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-surface);
  font-size: 14px;
  color: var(--color-text);
}
.ff-input.err {
  border-color: var(--color-danger);
}
.ff-err {
  font-size: 12px;
  color: var(--color-danger);
}
</style>
