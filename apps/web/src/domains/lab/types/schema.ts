/**
 * 表单 Schema 类型定义
 *
 * P9 面试点：为什么用 discriminated union 表达表单字段类型？
 *   每个 field 都有 kind（判别字段），TypeScript 会根据它自动收窄 value 类型
 *   —— 这正是"schema 驱动表单"的类型安全基础
 *
 * 为什么需要 version 字段？
 *   配置会演进（新增字段 / 类型变更），version 让前端知道用哪个渲染策略
 *   后续需要 schema 迁移工具时，按 version 逐版转换即可
 */

export interface FieldBase {
  key: string
  label: string
  required?: boolean
  disabled?: boolean
  hidden?: boolean
  /** 校验器（运行时执行） */
  validate?: (value: unknown) => string | null
  /** 显示条件：依赖其他字段值 */
  visibleWhen?: { field: string; equals: unknown }
}

export interface TextField extends FieldBase {
  kind: 'text'
  value?: string
  placeholder?: string
  maxLength?: number
}

export interface NumberField extends FieldBase {
  kind: 'number'
  value?: number
  min?: number
  max?: number
  step?: number
}

export interface SelectField extends FieldBase {
  kind: 'select'
  value?: string
  options: { label: string; value: string }[]
  multiple?: boolean
}

export interface RadioField extends FieldBase {
  kind: 'radio'
  value?: string
  options: { label: string; value: string }[]
}

export interface CheckboxField extends FieldBase {
  kind: 'checkbox'
  value?: boolean
}

export interface SwitchField extends FieldBase {
  kind: 'switch'
  value?: boolean
}

export type FormField =
  TextField | NumberField | SelectField | RadioField | CheckboxField | SwitchField

export interface FormSchema {
  /** Schema 版本 —— 演进支持 */
  version: 1
  id: string
  title: string
  fields: FormField[]
  /** 提交后处理器（受限 DSL，不可执行任意脚本） */
  submit?: {
    endpoint?: string
    method?: 'POST' | 'PUT'
  }
}

/** Schema 运行时校验（P9 面试点：编译期类型会被擦除！
 *  所以运行时必须再校验一次——这就是 Zod/schema 库存在的意义） */
export function validateSchema(schema: FormSchema): string[] {
  const errors: string[] = []
  if (!schema.version) errors.push('schema.version 必填')
  if (!schema.id) errors.push('schema.id 必填')
  if (!Array.isArray(schema.fields) || schema.fields.length === 0) {
    errors.push('schema.fields 至少一个字段')
  } else {
    const keys = new Set<string>()
    for (const f of schema.fields) {
      const base = f as FieldBase
      if (!base.key) errors.push('字段缺少 key')
      else if (keys.has(base.key)) errors.push(`重复 key: ${base.key}`)
      keys.add(base.key)
      if (!f.kind) errors.push(`字段 ${base.key} 缺少 kind`)
    }
  }
  return errors
}
