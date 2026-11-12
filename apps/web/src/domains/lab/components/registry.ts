/**
 * 组件注册表 —— Schema 字段类型 → Vue 组件
 *
 * P9 面试点：注册表模式 vs if/switch
 *   新增字段类型时，注册表只需"新增一项"，
 *   if/switch 需要在多个文件里加分支——违反开闭原则
 */
import type { Component } from 'vue'
import type { FormField } from '../types/schema'
import FeisTextField from '../components/FeisTextField.vue'
import FeisNumberField from '../components/FeisNumberField.vue'
import FeisSelectField from '../components/FeisSelectField.vue'
import FeisRadioField from '../components/FeisRadioField.vue'
import FeisCheckboxField from '../components/FeisCheckboxField.vue'
import FeisSwitchField from '../components/FeisSwitchField.vue'

const registry = new Map<FormField['kind'], Component>([
  ['text', FeisTextField],
  ['number', FeisNumberField],
  ['select', FeisSelectField],
  ['radio', FeisRadioField],
  ['checkbox', FeisCheckboxField],
  ['switch', FeisSwitchField],
])

export function registerField(kind: FormField['kind'], component: Component) {
  registry.set(kind, component)
}

export function resolveField(kind: FormField['kind']): Component | undefined {
  return registry.get(kind)
}

export const registeredKinds = (): FormField['kind'][] => Array.from(registry.keys())
