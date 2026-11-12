/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

// 测试环境默认走 mock，避免依赖外部 BFF
process.env.VITE_USE_MOCK = process.env.VITE_USE_MOCK ?? 'true'
process.env.VITE_APP_TITLE = process.env.VITE_APP_TITLE ?? '前端面试研习社'
process.env.VITE_APP_ENV = 'test'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@app': path.resolve(__dirname, 'src/app'),
      '@domains': path.resolve(__dirname, 'src/domains'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@pages': path.resolve(__dirname, 'src/pages'),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,vue}'],
      exclude: ['src/**/*.d.ts', 'src/**/*.config.*'],
    },
  },
})
