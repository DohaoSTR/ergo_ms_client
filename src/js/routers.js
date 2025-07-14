/**
 * КОНФИГУРАЦИЯ МАРШРУТИЗАЦИИ ПРИЛОЖЕНИЯ ERGO MS (JSON-BASED)
 * 
 * Данный файл содержит инициализацию Vue Router с автоматической генерацией
 * маршрутов из JSON конфигурации меню. Это обеспечивает единый источник истины
 * для структуры приложения и устраняет дублирование кода.
 * 
 * Архитектура:
 * - menu-config.json: содержит всю структуру маршрутов
 * - routes-generator.js: генерирует маршруты из JSON конфигурации
 * - routers.js: инициализирует Vue Router с сгенерированными маршрутами
 * 
 * Функциональность:
 * - Автоматическая генерация маршрутов из JSON конфигурации
 * - Сохранение всех существующих функций (guards, метаданные и др.)
 * - Валидация конфигурации при инициализации
 * - Поддержка ленивой загрузки компонентов
 * - Настроена защита маршрутов через beforeEach guard
 * - Интегрирована система управления доступом через GroupsPolitics
 */

import { createRouter, createWebHistory } from 'vue-router'
import { checkToken } from '@/modules/cms/adp/js/auth-index'
import { generateAllRoutes, validateRoutesConfig } from '@/config/routes-generator.js'

// Валидация конфигурации при запуске
const validation = validateRoutesConfig()
if (!validation.isValid) {
  console.error('❌ Обнаружены ошибки в конфигурации маршрутов:', validation.errors)
}
if (validation.warnings.length > 0) {
  console.warn('⚠️ Предупреждения конфигурации маршрутов:', validation.warnings)
}

// Генерация маршрутов из JSON конфигурации
const routes = generateAllRoutes()

routes.forEach((route) => {
  if (!route.meta || !Object.prototype.hasOwnProperty.call(route.meta, 'startRoute')) {
    route.meta = route.meta || {}
    route.meta.startRoute = false
  }
})

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

import { checkAccessToPage, CheckAccessToComponents } from '../modules/cms/adp/admin/js/GroupsPolitics'
async function runCheckToken() {
  const isChecked = await checkToken()
  return isChecked
}

router.beforeEach(async (to, from, next) => {
  try {
    // 1) нужна авторизация?
    if (to.meta.requiresAuth && !(await runCheckToken())) {
      // Очищаем токены при неудачной проверке
      import('./api/manager').then(({ apiClient }) => {
        apiClient.logout()
      })
      return next({ name: 'StartPage' })
    }

    // 2) page / component ACL (выполняем параллельно)
    await Promise.all([
      checkAccessToPage(to.path),
      CheckAccessToComponents(to.path),
    ])

    next()
  } catch (err) {
    console.error('Router guard error:', err)
    // При ошибке также очищаем токены
    import('./api/manager').then(({ apiClient }) => {
      apiClient.logout()
    })
    next({ name: 'StartPage' })
  }
})

export default router;