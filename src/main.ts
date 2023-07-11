import 'uno.css'
import 'ant-design-vue/dist/antd.less'
import './design/index.less'

// Register icon sprite
import 'virtual:svg-icons-register'

import { createApp } from 'vue'
import App from './App.vue'

import { router, setupRouter } from '/@/router'
import { setupRouterGuard } from './router/guard'
import { setupStore } from './store'
import { setupGlobDirectives } from './directives'

async function bootstrap() {
  const app = createApp(App)

  // Configure store
  // 配置 stor
  setupStore(app)

  // Configure routing
  // 配置路由
  setupRouter(app)

  // router-guard
  // 路由守卫
  setupRouterGuard(router)

  // Register global directive
  // 注册全局指令
  setupGlobDirectives(app)

  app.mount('#app')
}

bootstrap()
