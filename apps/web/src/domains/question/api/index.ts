/**
 * 题库领域 — API 层
 * 职责：每个函数对应一个后端接口，带完整 TS 类型
 *
 * P9 面试点：为什么 API 层要做运行时校验？
 *   TS 类型在编译期被擦除，接口返回的 JSON 是 unknown。
 *   在"边界"用 Zod 校验，把不可信输入转成可信的领域对象；
 *   校验失败抛错，由上层（store/composable）统一降级处理。
 */
import { request } from '@shared/utils/http'
import type { Question } from '../types'
import { QuestionListSchema, QuestionSchema } from '../types/schema'

const BASE = '/questions'

export interface ListQuestionsParams {
  category?: string
  keyword?: string
}

/** 列表（带筛选）—— 响应经过运行时校验 */
export async function listQuestions(params?: ListQuestionsParams): Promise<Question[]> {
  const raw = await request.get<unknown>(BASE, { params })
  return QuestionListSchema.parse(raw)
}

/** 单个 */
export async function getQuestion(id: string): Promise<Question> {
  const raw = await request.get<unknown>(`${BASE}/${id}`)
  return QuestionSchema.parse(raw)
}

/** 创建 */
export async function createQuestion(payload: Omit<Question, 'id'>): Promise<Question> {
  const raw = await request.post<unknown>(BASE, payload)
  return QuestionSchema.parse(raw)
}

/** 更新 */
export async function updateQuestion(id: string, payload: Partial<Question>): Promise<Question> {
  const raw = await request.put<unknown>(`${BASE}/${id}`, payload)
  return QuestionSchema.parse(raw)
}

/** 删除 */
export function deleteQuestion(id: string): Promise<void> {
  return request.delete<void>(`${BASE}/${id}`)
}
