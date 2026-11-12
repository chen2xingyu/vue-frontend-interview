/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_APP_ENV: 'development' | 'staging' | 'production'
  readonly VITE_USE_MOCK: string
  /** 监控上报地址；留空则只在本地留存不上报 */
  readonly VITE_MONITOR_ENDPOINT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
