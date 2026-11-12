import { describe, it, expect } from 'vitest'
import { safeJsonParse, debounce, throttle, capitalize, uid } from '@shared/utils'

describe('safeJsonParse', () => {
  it('正常解析有效 JSON', () => {
    expect(safeJsonParse('{"a":1}', {})).toEqual({ a: 1 })
  })

  it('无效 JSON 返回 fallback', () => {
    expect(safeJsonParse('not-json', 'fallback')).toBe('fallback')
  })

  it('null/undefined 返回 fallback', () => {
    expect(safeJsonParse(null, [])).toEqual([])
    expect(safeJsonParse(undefined, 0)).toBe(0)
    expect(safeJsonParse('', 'x')).toBe('x')
  })
})

describe('debounce', () => {
  it('多次快速调用只执行最后一次', async () => {
    let count = 0
    const fn = debounce(() => count++, 10)
    fn()
    fn()
    fn()
    // 等待 debounce 结束
    await new Promise((r) => setTimeout(r, 30))
    expect(count).toBe(1)
  })
})

describe('throttle', () => {
  it('节流期间只执行一次', async () => {
    let count = 0
    const fn = throttle(() => count++, 100)
    fn()
    fn()
    fn()
    expect(count).toBe(1)
  })
})

describe('capitalize', () => {
  it('首字母大写', () => {
    expect(capitalize('hello')).toBe('Hello')
  })
  it('空字符串不崩', () => {
    expect(capitalize('')).toBe('')
  })
})

describe('uid', () => {
  it('带前缀', () => {
    const id = uid('q')
    expect(id.startsWith('q-')).toBe(true)
  })
  it('不带前缀使用默认', () => {
    const id = uid()
    expect(id.startsWith('id-')).toBe(true)
  })
  it('连续调用不重复（幂等性弱检验）', () => {
    const a = uid()
    const b = uid()
    expect(a).not.toBe(b)
  })
})
