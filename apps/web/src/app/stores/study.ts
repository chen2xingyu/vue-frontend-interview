import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { questions as mockQuestions, type Category, type Question } from '@domains/question'
import { listQuestions } from '@domains/question/api'

/**
 * 学习进度 store
 * P9 设计要点：
 *   - 数据源在 store 层统一：启动时拉取一次 questions，后续本地过滤
 *   - VITE_USE_MOCK=true 走内置 mock，false 走真实 BFF
 *   - 持久化只存 ID（saved/done），列表数据从 API/mock 拉取
 *   - 副作用（HTTP 请求、localStorage 写入）集中在 store action
 */

const STORAGE_KEYS = {
  saved: 'feis.saved-questions',
  done: 'feis.done-questions',
} as const

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export const useStudyStore = defineStore('study', () => {
  // ---------- State ----------
  /** 题库列表（来自 API 或 mock） */
  const questions = ref<Question[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const category = ref<Category | '全部'>('全部')
  const query = ref('')

  const saved = ref<string[]>(loadFromStorage(STORAGE_KEYS.saved, []))
  const done = ref<string[]>(loadFromStorage(STORAGE_KEYS.done, []))

  // ---------- Getters ----------
  const categories = computed(() => {
    return ['全部', ...new Set(questions.value.map((q) => q.category))] as const
  })

  const filtered = computed(() => {
    const kw = query.value.trim().toLowerCase()
    return questions.value.filter((q) => {
      const matchCategory = category.value === '全部' || q.category === category.value
      if (!matchCategory) return false
      if (!kw) return true
      const haystack = `${q.title}${q.summary}${q.tags.join('')}${q.answer}`.toLowerCase()
      return haystack.includes(kw)
    })
  })

  const progress = computed(() => ({
    done: done.value.length,
    total: questions.value.length,
    ratio: questions.value.length ? done.value.length / questions.value.length : 0,
  }))

  // ---------- Actions ----------
  async function fetchQuestions() {
    loading.value = true
    error.value = null
    try {
      if (import.meta.env.VITE_USE_MOCK === 'true') {
        // mock 模式直接用内置数据
        questions.value = mockQuestions as Question[]
      } else {
        // 走真实 API
        questions.value = await listQuestions()
      }
    } catch (e) {
      error.value = (e as Error).message
      // 失败回退到 mock，保证 UI 不空白
      questions.value = mockQuestions as Question[]
    } finally {
      loading.value = false
    }
  }

  function _persist(key: string, value: string[]) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* quota / 隐私模式，静默降级 */
    }
  }

  function toggleSaved(id: string) {
    const next = saved.value.includes(id)
      ? saved.value.filter((x) => x !== id)
      : [...saved.value, id]
    saved.value = next
    _persist(STORAGE_KEYS.saved, next)
  }

  function markDone(id: string) {
    const next = done.value.includes(id) ? done.value.filter((x) => x !== id) : [...done.value, id]
    done.value = next
    _persist(STORAGE_KEYS.done, next)
  }

  return {
    // state
    questions,
    loading,
    error,
    category,
    query,
    saved,
    done,
    // getters
    categories,
    filtered,
    progress,
    // actions
    fetchQuestions,
    toggleSaved,
    markDone,
  }
})
