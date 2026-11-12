import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useStudyStore } from '@app/stores/study'
import { questions } from '@domains/question'

describe('useStudyStore', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    localStorage.clear()
    const store = useStudyStore()
    // 预加载题库（vitest 环境下走 mock）
    await store.fetchQuestions()
  })

  it('初始 filtered 等于全量（无筛选无搜索）', () => {
    const store = useStudyStore()
    expect(store.filtered.length).toBe(questions.length)
  })

  it('按 category 筛选', () => {
    const store = useStudyStore()
    store.category = '性能优化'
    expect(store.filtered.every((q) => q.category === '性能优化')).toBe(true)
  })

  it('搜索关键词命中 title 或 tags', () => {
    const store = useStudyStore()
    store.query = 'Proxy'
    expect(store.filtered.length).toBeGreaterThan(0)
    const hit = store.filtered.some((q) =>
      `${q.title}${q.summary}${q.tags.join('')}${q.answer}`.toLowerCase().includes('proxy'),
    )
    expect(hit).toBe(true)
  })

  it('切换 category 后 filtered 只留该类别', () => {
    const store = useStudyStore()
    const uniqueCats = [...new Set(questions.map((q) => q.category))]
    for (const cat of uniqueCats) {
      store.category = cat
      expect(store.filtered.every((q) => q.category === cat)).toBe(true)
    }
  })

  it('toggleSaved 切换收藏状态', () => {
    const store = useStudyStore()
    const first = questions[0]!
    store.toggleSaved(first.id)
    expect(store.saved).toContain(first.id)
    store.toggleSaved(first.id)
    expect(store.saved).not.toContain(first.id)
  })

  it('toggleSaved 写入 localStorage', () => {
    const store = useStudyStore()
    const first = questions[0]!
    store.toggleSaved(first.id)
    const raw = localStorage.getItem('feis.saved-questions')
    expect(raw).toBeTruthy()
    expect(JSON.parse(raw!)).toContain(first.id)
  })

  it('progress 计算 done/total', () => {
    const store = useStudyStore()
    const first = questions[0]!
    expect(store.progress.total).toBe(questions.length)
    expect(store.progress.ratio).toBe(0)
    store.markDone(first.id)
    expect(store.progress.done).toBe(1)
    expect(store.progress.ratio).toBe(1 / questions.length)
  })
})
