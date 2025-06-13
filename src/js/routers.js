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
import { checkToken } from '@/js/api/services/auth-index'
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

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    runCheckToken()
      .then((isChecked) => {
        if (isChecked === false) {
          next({ name: 'StartPage' })
        } else {
          next(true)
        }
      })
      .catch((error) => {
        console.error('Ошибка проверки токена:', error)
        next({ name: 'StartPage' })
      })
  } else {
    next()
  }
})

async function runCheckToken() {
  const isChecked = await checkToken()
  return isChecked
}
import { checkAccessToPage, CheckAccessToComponents } from './GroupsPolitics'
export default router
router.beforeEach((to, from, next) => {
    checkAccessToPage(to.path)
    next()
    CheckAccessToComponents(to.path)
})
