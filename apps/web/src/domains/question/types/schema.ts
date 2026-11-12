import { z } from 'zod'

/**
 * Question 运行时 Schema —— 编译期类型擦除后的"最后一道防线"
 *
 * P9 面试点：为什么有了 TypeScript 还要 Zod？
 *   —— TS 类型只在编译期存在，接口返回的 JSON 是 unknown
 *   —— 后端字段漂移 / 脏数据 / 版本不兼容时，TS 完全无法发现
 *   —— 运行时校验把"不可信输入"变成"可信领域对象"，错误尽早暴露在边界
 *
 * 设计原则：
 *   - schema 与 TS 类型保持同源（z.infer 反推类型，避免两处维护）
 *   - 只校验边界（API 响应、localStorage、URL 参数），不要在内部调用链反复校验
 *   - parse 失败要能给出"哪个字段错了"，便于排障
 */

export const CategorySchema = z.enum([
  'Vue 2→3',
  '工程化',
  '性能优化',
  '组件设计',
  'TypeScript',
  'Node.js',
  '登录与安全',
  '架构场景',
])

export const QuestionSchema = z.object({
  id: z.string().min(1),
  category: CategorySchema,
  level: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  answer: z.string().min(1),
  followups: z.array(z.string()),
  scenario: z.string().min(1),
  tags: z.array(z.string()),
})

export const QuestionListSchema = z.array(QuestionSchema)

/** 由 schema 反推 TS 类型 —— 单一数据源，避免类型与校验规则漂移 */
export type QuestionFromSchema = z.infer<typeof QuestionSchema>

/** 安全解析：失败返回 { success, data | error }，不抛异常 */
export function parseQuestionList(input: unknown) {
  return QuestionListSchema.safeParse(input)
}

/** 严格解析：失败抛 ZodError（带字段路径），适合"宁可失败也别渲染脏数据"的场景 */
export function assertQuestionList(input: unknown): QuestionFromSchema[] {
  return QuestionListSchema.parse(input)
}
