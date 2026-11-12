import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import viteCompression from 'vite-plugin-compression'
import path from 'node:path'

/**
 * 手动分包策略（P9 面试高频：解释为什么这样拆）
 * vue / router / pinia 是运行时核心，拆成独立 chunk 可被浏览器长期缓存
 * lucide 图标库同样稳定，单独分包避免随业务代码一起重新下载
 */
function manualChunks(id: string): string | void {
  if (id.includes('node_modules')) {
    if (id.includes('vue-router')) return 'router'
    if (id.includes('pinia')) return 'pinia'
    if (id.includes('lucide-vue-next')) return 'icons'
    if (id.includes('web-vitals')) return 'vitals'
    if (id.includes('vue')) return 'vue-vendor'
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isProd = mode === 'production'

  return {
    base: './',
    plugins: [
      vue({
        // 开启 defineModel 语法糖（Vue 3.4+）
        script: { defineModel: true },
      }),

      // ---------- PWA ----------
      // P9 面试点：PWA 三件套 = manifest + service worker + 缓存策略
      //   - precache：构建产物（JS/CSS/HTML）首次访问即离线可用
      //   - runtimeCaching：接口走 NetworkFirst，弱网/断网时回退缓存
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'icon.svg'],
        manifest: {
          name: '前端面试研习社',
          short_name: '面试研习社',
          description: '系统梳理 Vue 3、工程化、性能与架构问题',
          theme_color: '#6366f1',
          background_color: '#f8fafc',
          display: 'standalone',
          start_url: './',
          icons: [
            {
              src: 'icon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          // 预缓存产物
          globPatterns: ['**/*.{js,css,html,svg,woff2}'],
          // 单文件超过 2MB 不进预缓存，避免拖慢安装
          maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
          // 接口缓存策略
          runtimeCaching: [
            {
              urlPattern: /\/api\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'feis-api',
                networkTimeoutSeconds: 3,
                expiration: { maxEntries: 50, maxAgeSeconds: 5 * 60 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
        // 开发环境不启用 SW，避免干扰 HMR
        devOptions: { enabled: false },
      }),

      // ---------- 预压缩：gzip + brotli ----------
      // 构建时生成 .gz / .br，Nginx 开启 gzip_static/brotli_static 直接命中
      viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 1024,
        deleteOriginFile: false,
      }),
      viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 1024,
        deleteOriginFile: false,
      }),
    ],

    // 路径别名（对齐 tsconfig paths）
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@app': path.resolve(__dirname, 'src/app'),
        '@domains': path.resolve(__dirname, 'src/domains'),
        '@shared': path.resolve(__dirname, 'src/shared'),
        '@pages': path.resolve(__dirname, 'src/pages'),
      },
    },

    // CSS 相关
    css: {
      devSourcemap: true,
    },

    // 开发服务器
    server: {
      host: true,
      port: 5173,
      open: false,
      cors: true,
      // API 代理（开发环境走本地 BFF）
      proxy: {
        '/api': {
          // 注意：BFF 的路由本身就带 /api 前缀（app.use('/api/...')），
          // 所以这里**不能** rewrite 掉 /api，否则会 404
          target: env.VITE_PROXY_TARGET || 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },

    // 构建优化
    build: {
      target: 'es2022',
      cssCodeSplit: true,
      sourcemap: !isProd,
      reportCompressedSize: true,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          // 稳定的产物命名策略
          entryFileNames: 'assets/js/[name]-[hash].js',
          chunkFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
          manualChunks,
        },
      },
      minify: 'esbuild',
      esbuild: {
        drop: isProd ? ['console', 'debugger'] : [],
      },
    },

    // 依赖预构建（锁定版本避免频繁重新预构建）
    optimizeDeps: {
      include: ['vue', 'vue-router', 'pinia', 'lucide-vue-next', 'web-vitals', 'zod'],
      exclude: [],
    },

    // 预览服务器
    preview: {
      host: true,
      port: 4173,
    },

    logLevel: 'info',
    clearScreen: true,
  }
})
