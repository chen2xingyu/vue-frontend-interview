<script setup lang="ts" generic="T">
import { computed, ref } from 'vue'

/**
 * VirtualList —— 固定高度虚拟滚动
 *
 * P9 面试点：虚拟列表的核心原理
 *   只渲染"视口内 + 缓冲区"的 DOM，用占位高度撑开滚动条。
 *   DOM 数量从 O(n) 降到 O(视口/行高)，万级数据也能 60fps 滚动。
 *
 * 源码级细节（面试常问"高度不固定怎么办"）：
 *   本实现假设行高固定（最常见场景）；
 *   不定高需要用"测量 + 前缀和 + 二分查找"定位起始索引，
 *   复杂度会从 O(1) 升到 O(log n)，且要处理测量时机（图片加载后高度变化）。
 *
 * 为什么用 translateY 而不是 padding-top？
 *    transform 走合成层，不触发重排（reflow），滚动更顺滑。
 */

const props = withDefaults(
  defineProps<{
    /** 数据源 */
    items: T[]
    /** 单行高度（px），必须固定 */
    itemHeight: number
    /** 视口高度（px） */
    height: number
    /** 上下缓冲区行数，滚动时减少空白闪烁 */
    buffer?: number
    /** 唯一键提取函数 */
    itemKey?: (item: T, index: number) => string | number
  }>(),
  { buffer: 4, itemKey: undefined },
)

const viewport = ref<HTMLElement | null>(null)
const scrollTop = ref(0)

/** 可视区能容纳的行数 */
const visibleCount = computed(() => Math.ceil(props.height / props.itemHeight))

/** 起始索引（减去缓冲区，且不小于 0） */
const startIndex = computed(() =>
  Math.max(0, Math.floor(scrollTop.value / props.itemHeight) - props.buffer),
)

/** 结束索引（加上缓冲区，且不超过总数） */
const endIndex = computed(() =>
  Math.min(props.items.length, startIndex.value + visibleCount.value + props.buffer * 2),
)

/** 当前要渲染的切片 */
const visibleItems = computed(() => props.items.slice(startIndex.value, endIndex.value))

/** 内层容器总高度（撑开滚动条） */
const totalHeight = computed(() => props.items.length * props.itemHeight)

/** 偏移量（让可视切片对齐到正确位置） */
const offsetY = computed(() => startIndex.value * props.itemHeight)

function onScroll(e: Event) {
  scrollTop.value = (e.target as HTMLElement).scrollTop
}

function keyOf(item: T, i: number): string | number {
  return props.itemKey ? props.itemKey(item, startIndex.value + i) : startIndex.value + i
}
</script>

<template>
  <div ref="viewport" class="virtual-list" :style="{ height: `${height}px` }" @scroll="onScroll">
    <div class="virtual-list__phantom" :style="{ height: `${totalHeight}px` }">
      <div class="virtual-list__window" :style="{ transform: `translateY(${offsetY}px)` }">
        <div
          v-for="(item, i) in visibleItems"
          :key="keyOf(item, i)"
          class="virtual-list__row"
          :style="{ height: `${itemHeight}px` }"
        >
          <slot :item="item" :index="startIndex + i" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.virtual-list {
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  /* 滚动性能优化提示浏览器：这个区域会频繁滚动 */
  will-change: scroll-position;
}

.virtual-list__phantom {
  position: relative;
}

.virtual-list__window {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  /* 使用 transform 而非 top，避免触发布局重排 */
  will-change: transform;
}

.virtual-list__row {
  box-sizing: border-box;
}
</style>
