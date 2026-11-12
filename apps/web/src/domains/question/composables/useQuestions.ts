import { computed, type ComputedRef } from 'vue'
import { useRequest } from '@shared/composables/useRequest'
import { listQuestions, type ListQuestionsParams } from '../api'
import type { Question } from '../types'

/**
 * 题库列表 composable
 * 业务层只管"怎么拿数据、怎么派生计算"
 * HTTP 细节都在 useRequest 里
 */
export function useQuestions(params?: ComputedRef<ListQuestionsParams | undefined>) {
  const { data, loading, error, refresh } = useRequest<Question[]>(
    async () => {
      const p = params?.value
      // 用 env 的 mock 开关决定走 API 还是返回内置 mock
      if (import.meta.env.VITE_USE_MOCK === 'true') {
        const { questions } = await import('../data/questions')
        if (!p) return questions
        return questions.filter((q) => {
          const matchCat = !p.category || q.category === p.category
          const matchKw =
            !p.keyword || `${q.title}${q.summary}`.toLowerCase().includes(p.keyword.toLowerCase())
          return matchCat && matchKw
        })
      }
      return listQuestions(p)
    },
    { immediate: true },
  )

  const categories = computed(() => {
    if (!data.value) return [] as string[]
    return Array.from(new Set(data.value.map((q) => q.category)))
  })

  return { questions: data, loading, error, categories, refresh }
}
