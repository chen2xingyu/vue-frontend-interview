<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="not-found">
    <h1>404</h1>
    <p>页面走丢了～</p>
    <button @click="router.push('/')">回到首页</button>
  </div>
</template>

<style scoped>
.not-found {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  text-align: center;

  h1 {
    font-size: 72px;
    margin: 0;
    background: linear-gradient(135deg, var(--color-primary), var(--color-info));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  p {
    color: var(--color-text-secondary);
    margin: 0;
  }

  button {
    padding: var(--space-2) var(--space-5);
    background: var(--color-primary);
    color: #fff;
    border-radius: var(--radius-md);
    font-weight: 600;
    transition: background var(--transition-fast);

    &:hover {
      background: var(--color-primary-hover);
    }
  }
}
</style>
