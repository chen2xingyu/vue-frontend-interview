import { describe, it, expect } from 'vitest'
import { questions } from '../data/questions'
import { parseQuestionList, QuestionSchema, QuestionListSchema } from './schema'

const valid = { ...questions[0]! }

describe('QuestionSchema（Zod 运行时校验）', () => {
  it('合法题目可以通过校验', () => {
    const parsed = QuestionSchema.parse(valid)
    expect(parsed.id).toBe(valid.id)
    expect(parsed.category).toBe(valid.category)
  })

  it('缺少 title 会被拒绝', () => {
    const result = QuestionSchema.safeParse({ ...valid, title: '' })
    expect(result.success).toBe(false)
  })

  it('未知 category 会被拒绝（后端枚举漂移）', () => {
    const result = QuestionSchema.safeParse({ ...valid, category: '不存在的分类' })
    expect(result.success).toBe(false)
  })

  it('followups / tags 类型错误会被拒绝', () => {
    const result = QuestionSchema.safeParse({ ...valid, followups: 'not-an-array' })
    expect(result.success).toBe(false)
  })
})

describe('QuestionListSchema', () => {
  it('9 道种子数据全部通过校验', () => {
    const result = QuestionListSchema.safeParse(questions)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toHaveLength(questions.length)
  })

  it('parseQuestionList 对脏数据返回失败而不是抛异常', () => {
    const result = parseQuestionList([{ id: 'x' }])
    expect(result.success).toBe(false)
  })

  it('parseQuestionList 对非数组输入返回失败', () => {
    expect(parseQuestionList({ data: questions }).success).toBe(false)
  })
})
