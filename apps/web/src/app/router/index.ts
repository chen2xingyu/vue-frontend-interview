import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@app/stores/auth'

/**
 * 路由元信息扩展
 * P9 面试点：为什么用 meta 驱动菜单和权限，而不是单独维护一份配置？
 *   单一数据源：路由即菜单，减少配置漂移
 *   权限声明靠近路由本身，阅读路由文件就能看清访问控制
 */
declare module 'vue-router' {
  interface RouteMeta {
    /** 显示在菜单/面包屑的标题 */
    title?: string
    /** 菜单图标（组件名，由父级解析） */
    icon?: string
    /** 是否在菜单中隐藏（详情页等） */
    hidden?: boolean
    /** 是否需要登录 */
    requiresAuth?: boolean
    /** 需要的权限点（任一匹配即放行） */
    permissions?: string[]
    /** 排序权重（小在前） */
    order?: number
    /** 是否为一级可导航菜单 */
    nav?: boolean
  }
}

// ---------- 路由定义 ----------
// 每个 feature 可以各自导出 routes，然后在入口汇总（当前集中定义，后续可拆分）
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@pages/Dashboard.vue'),
    meta: { title: '学习总览', icon: 'LayoutDashboard', nav: true, order: 1 },
  },
  {
    path: '/questions',
    name: 'questions',
    component: () => import('@pages/Questions.vue'),
    meta: { title: '面试题库', icon: 'BookOpen', nav: true, order: 2 },
  },
  {
    path: '/questions/:id',
    name: 'question-detail',
    component: () => import('@pages/QuestionDetail.vue'),
    meta: { title: '题目详情', hidden: true },
  },
  {
    path: '/scenarios',
    name: 'scenarios',
    component: () => import('@pages/Scenarios.vue'),
    meta: { title: '业务场景', icon: 'Layers3', nav: true, order: 3 },
  },
  {
    path: '/lab',
    name: 'lab',
    component: () => import('@pages/Lab.vue'),
    meta: { title: '组件实验室', icon: 'Code2', nav: true, order: 4 },
  },
  {
    path: '/roadmap',
    name: 'roadmap',
    component: () => import('@pages/Roadmap.vue'),
    meta: { title: '学习路线', icon: 'Zap', nav: true, order: 5 },
  },
  {
    path: '/performance',
    name: 'performance',
    component: () => import('@pages/Performance.vue'),
    meta: { title: '性能与健康', icon: 'Activity', nav: true, order: 6 },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@pages/Login.vue'),
    meta: { title: '登录', hidden: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@pages/NotFound.vue'),
    meta: { title: '页面未找到', hidden: true },
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, saved) {
    if (saved) return saved
    return { top: 0, behavior: 'smooth' }
  },
})

// ---------- 守卫链 ----------

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // 0. 恢复登录态 —— 刷新页面后 user 在内存里是空的，
  //    必须先拿 token 换回用户信息，否则下面的权限判断会全部误判为"无权限"
  if (!auth.initialized) {
    await auth.restore()
  }

  // 1. 登录重定向（避免登录页上已登录用户还能看到登录表单）
  if (to.name === 'login' && auth.isLoggedIn) {
    return { path: '/dashboard' }
  }

  // 2. 未登录拦截（仅拦截 requiresAuth 的路由）
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // 3. 权限校验（任一命中即放行）
  if (to.meta.permissions?.length) {
    const granted = to.meta.permissions.some((p) => auth.hasPermission(p))
    if (!granted) {
      // 不跳转 403，而是静默重定向到 dashboard，避免用户困惑
      return { path: '/dashboard' }
    }
  }

  return true
})

router.afterEach((to) => {
  if (to.meta?.title) {
    document.title = `${to.meta.title} · ${import.meta.env.VITE_APP_TITLE}`
  }
})

router.onError((err) => {
  // P9 面试点：路由错误边界
  // 主要捕获懒加载 chunk 失败（网络抖动/版本更新）
  console.error('[Router Error]', err)
  const message = err.message || ''
  if (message.includes('Failed to fetch dynamically imported module')) {
    alert('检测到新版本，刷新页面以加载最新内容')
    location.reload()
  }
})

// ---------- 工具：从路由里提菜单 ----------

/** 提取导航菜单（用于侧边栏渲染） */
export function getNavMenu() {
  return routes
    .filter((r) => r.meta?.nav && !r.meta?.hidden)
    .sort((a, b) => (a.meta?.order ?? 99) - (b.meta?.order ?? 99))
    .map((r) => ({
      path: r.path,
      name: r.name as string,
      title: r.meta?.title ?? r.name,
      icon: r.meta?.icon,
    }))
}

/**
 * 路由预取 —— 鼠标悬停/聚焦时提前拉取目标页 chunk
 * P9 面试点：为什么不一次性预取所有路由？
 *   —— 会浪费带宽、抢占首屏关键资源
 *   —— "意图预测 + 按需预取"才是正确策略（hover/focus/viewport 进入）
 */
const prefetched = new Set<string>()

export function prefetchRoute(name: string) {
  if (prefetched.has(name)) return
  const record = router.getRoutes().find((r) => r.name === name)
  const component = record?.components?.default
  if (typeof component === 'function') {
    prefetched.add(name)
    // 触发动态 import，浏览器会把 chunk 提前下载并缓存
    void (component as () => Promise<unknown>)().catch(() => {
      prefetched.delete(name)
    })
  }
}
