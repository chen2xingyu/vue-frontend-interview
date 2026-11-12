<script setup lang="ts">
import type { CheckboxField } from '../types/schema'
defineProps<{ field: CheckboxField; modelValue: boolean; error?: string | null }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()
</script>

<template>
  <label class="ff-checkbox">
    <input
      type="checkbox"
      :checked="!!modelValue"
      :disabled="field.disabled"
      @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />
    {{ field.label }}<span v-if="field.required" class="req">*</span>
  </label>
</template>

<style scoped>
.ff-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--color-text);
}
.req {
  color: var(--color-danger);
}
</style>
