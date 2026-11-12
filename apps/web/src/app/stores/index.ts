import { createPinia as setupPinia } from 'pinia'
import { useAuthStore } from './auth'
import { useMonitorStore } from './monitor'
import { useStudyStore } from './study'
import { useUIStore } from './ui'

export { useAuthStore, useMonitorStore, useStudyStore, useUIStore }

/**
 * 创建 Pinia 实例
 * P9 预留扩展点：后续可在这里注册持久化、logger、devtools 插件
 */
export function createPinia() {
  return setupPinia()
}
