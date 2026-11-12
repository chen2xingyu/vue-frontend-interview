<script setup lang="ts">
import type { TextField } from '../types/schema'
defineProps<{ field: TextField; modelValue: string | number | null; error?: string | null }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()
</script>

<template>
  <div class="ff-field">
    <label v-if="field.label"
      >{{ field.label }}<span v-if="field.required" class="req">*</span></label
    >
    <input
      type="text"
      :value="modelValue ?? ''"
      :placeholder="field.placeholder"
      :disabled="field.disabled"
      :maxlength="field.maxLength"
      class="ff-input"
      :class="{ err: !!error }"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
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
