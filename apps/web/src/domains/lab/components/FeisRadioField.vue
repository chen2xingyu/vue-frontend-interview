<script setup lang="ts">
import type { RadioField } from '../types/schema'
defineProps<{ field: RadioField; modelValue: string; error?: string | null }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()
</script>

<template>
  <div class="ff-field">
    <label v-if="field.label"
      >{{ field.label }}<span v-if="field.required" class="req">*</span></label
    >
    <div class="ff-radio-group">
      <label v-for="opt in field.options" :key="opt.value" class="ff-radio">
        <input
          type="radio"
          :name="field.key"
          :value="opt.value"
          :checked="modelValue === opt.value"
          :disabled="field.disabled"
          @change="emit('update:modelValue', opt.value)"
        />
        {{ opt.label }}
      </label>
    </div>
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
.ff-radio-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.ff-radio {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: var(--color-text);
}
.ff-err {
  font-size: 12px;
  color: var(--color-danger);
}
</style>
