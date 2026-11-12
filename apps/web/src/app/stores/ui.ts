import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * UI 全局状态（主题、侧边栏折叠、全局 loading 等）
 * P9 设计要点：全局 UI 状态集中在顶层 store，业务域内的 UI 状态就地管理
 */
export const useUIStore = defineStore('ui', () => {
  const theme = ref<'light' | 'dark'>('light')
  const sidebarCollapsed = ref(false)
  const globalLoading = ref(false)

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  return {
    theme,
    sidebarCollapsed,
    globalLoading,
    toggleTheme,
    toggleSidebar,
  }
})
