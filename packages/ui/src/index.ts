/**
 * @feis/ui —— 前端面试研习社基础组件库
 * P9 面试点：如何做一个可发布的轻量组件库？
 *   1. Vite lib mode 打包 ESM + d.ts
 *   2. peerDependencies 避免与宿主版本冲突
 *   3. CSS 用 :root 变量继承宿主主题（不硬编码颜色）
 *   4. exports 字段声明完整子路径（支持按需引 style.css）
 */

export { default as FeisButton } from './components/FeisButton.vue'
export { default as FeisInput } from './components/FeisInput.vue'
export { default as FeisCard } from './components/FeisCard.vue'

export type {
  FeisButton as FeisButtonType,
  FeisInput as FeisInputType,
  FeisCard as FeisCardType,
} from './components/index'
