/**
 * 题库领域 - 类型定义
 * 把数据契约集中在 domain 层，store 和组件都从这里引用
 * 未来接入真实 API 时，DTO 可以在此扩展或分离
 */

export type Category =
  | 'Vue 2→3'
  | '工程化'
  | '性能优化'
  | '组件设计'
  | 'TypeScript'
  | 'Node.js'
  | '登录与安全'
  | '架构场景'

export interface Question {
  id: string
  category: Category
  level: string
  title: string
  summary: string
  answer: string
  followups: string[]
  scenario: string
  tags: string[]
}
