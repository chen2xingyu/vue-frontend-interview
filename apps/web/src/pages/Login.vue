<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@app/stores'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const username = ref('learner')
const password = ref('test123')
const submitting = ref(false)
const error = ref('')

async function handleLogin() {
  if (!username.value || !password.value) {
    error.value = '请填写用户名和密码'
    return
  }
  submitting.value = true
  error.value = ''
  try {
    await auth.login({ username: username.value, password: password.value })
    const redirect = (route.query.redirect as string) || '/dashboard'
    router.replace(redirect)
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <h1>前端面试研习社</h1>
      <p class="subtitle">登录后继续学习</p>

      <form @submit.prevent="handleLogin">
        <div class="field">
          <label>用户名</label>
          <input v-model="username" type="text" placeholder="learner" autocomplete="username" />
        </div>
        <div class="field">
          <label>密码</label>
          <input
            v-model="password"
            type="password"
            placeholder="test123"
            autocomplete="current-password"
          />
        </div>

        <p v-if="error" class="err">{{ error }}</p>

        <button class="primary" type="submit" :disabled="submitting">
          {{ submitting ? '登录中…' : '登录' }}
        </button>
      </form>

      <p class="tip">
        演示账号：learner / test123（只读）<br />
        admin / admin123（可写）
      </p>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
}

.login-card {
  width: 100%;
  max-width: 380px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  box-shadow: var(--shadow-lg);

  h1 {
    margin: 0 0 var(--space-1);
    font-size: var(--font-size-xl);
    text-align: center;
  }

  .subtitle {
    text-align: center;
    color: var(--color-text-secondary);
    margin: 0 0 var(--space-6);
    font-size: var(--font-size-sm);
  }
}

.field {
  margin-bottom: var(--space-4);

  label {
    display: block;
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin-bottom: var(--space-1);
  }

  input {
    width: 100%;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-bg);
    color: var(--color-text);
    transition: border-color var(--transition-fast);

    &:focus {
      outline: none;
      border-color: var(--color-primary);
    }
  }
}

.err {
  color: var(--color-danger);
  font-size: var(--font-size-sm);
  margin: 0 0 var(--space-3);
}

button.primary {
  width: 100%;
  padding: var(--space-2) var(--space-4);
  background: var(--color-primary);
  color: #fff;
  border-radius: var(--radius-md);
  font-weight: 600;
  transition: background var(--transition-fast);

  &:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.tip {
  margin-top: var(--space-5);
  text-align: center;
  font-size: var(--font-size-xs);
  color: var(--color-text-disabled);
}
</style>
