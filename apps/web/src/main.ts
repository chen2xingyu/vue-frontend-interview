import { createApp } from 'vue'
import App from './App.vue'
import { router } from '@app/router'
import { createPinia } from '@app/stores'
import { registerProviders } from '@app/providers'
import '@shared/styles/index.css'

function bootstrap() {
  const app = createApp(App)

  // 注册 Pinia
  app.use(createPinia())

  // 注册路由
  app.use(router)

  // 注册全局 Provider（主题、i18n 等，预留扩展点）
  registerProviders(app)

  app.mount('#app')
}

void bootstrap()
