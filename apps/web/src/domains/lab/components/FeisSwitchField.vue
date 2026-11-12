<script setup lang="ts">
import type { SwitchField } from '../types/schema'
defineProps<{ field: SwitchField; modelValue: boolean; error?: string | null }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()
</script>

<template>
  <label class="ff-switch">
    <span class="ff-switch-label">{{ field.label }}</span>
    <span
      class="ff-switch-track"
      :class="{ on: !!modelValue }"
      role="switch"
      :aria-checked="!!modelValue"
      @click="emit('update:modelValue', !modelValue)"
    >
      <span class="ff-switch-thumb" />
    </span>
  </label>
</template>

<style scoped>
.ff-switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  color: var(--color-text);
}
.ff-switch-label {
  color: var(--color-text-secondary);
}
.ff-switch-track {
  width: 38px;
  height: 20px;
  background: var(--color-border);
  border-radius: 999px;
  position: relative;
  cursor: pointer;
  transition: background var(--transition-fast);
}
.ff-switch-track.on {
  background: var(--color-primary);
}
.ff-switch-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: #fff;
  border-radius: 50%;
  transition: transform var(--transition-fast);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}
.ff-switch-track.on .ff-switch-thumb {
  transform: translateX(18px);
}
</style>
