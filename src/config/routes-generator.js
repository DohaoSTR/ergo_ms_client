/**
 * ГЕНЕРАТОР МАРШРУТОВ ИЗ JSON КОНФИГУРАЦИИ
 * 
 * Данный модуль автоматически генерирует конфигурацию маршрутов Vue Router
 * на основе JSON конфигурации меню. Это обеспечивает единый источник истины
 * для структуры приложения и устраняет дублирование кода.
 * 
 * Функциональность:
 * - Преобразование JSON структуры в массив маршрутов Vue Router
 * - Поддержка вложенных маршрутов (children)
 * - Автоматическое создание ленивой загрузки компонентов
 * - Сохранение метаданных маршрутов (title, requiresAuth и др.)
 * - Обработка redirect для родительских маршрутов
 * - Валидация и обработка ошибок
 * 
 * Использование:
 * import { generateRoutesFromConfig } from '@/config/routes-generator.js'
 * const routes = generateRoutesFromConfig()
 */

import menuConfig from '@/config/menu-config.json'

/**
 * Преобразует строковый путь к компоненту в функцию lazy import
 * @param {string} componentPath - путь к компоненту (например, "@/pages/user/ParentLayout.vue")
 * @returns {Function} - функция для ленивой загрузки компонента
 */
function createLazyImport(componentPath) {
  // Убираем префикс @/ и добавляем ./ для relative import
  const relativePath = componentPath.replace('@/', '../')
  return () => import(/* webpackChunkName: "[request]" */ relativePath)
}

/**
 * Преобразует конфигурацию подраздела в дочерний маршрут Vue Router
 * @param {Object} item - объект подраздела из JSON конфигурации
 * @returns {Object|null} - объект маршрута Vue Router или null
 */
function transformSubItem(item) {
  // Пропускаем offcanvas элементы (они не являются реальными маршрутами)
  if (item.isOffcanvas) {
    return null
  }

  if (!item.route) {
    console.warn(`Подраздел "${item.name}" не содержит конфигурации маршрута`)
    return null
  }

  return {
    path: item.route.path,
    name: item.path, // Используем path как name для совместимости
    component: createLazyImport(item.route.component),
    meta: {
      title: item.name, // Используем название из меню как заголовок по умолчанию
      ...item.route.meta, // Перезаписываем метаданными из конфигурации
    }
  }
}

/**
 * Преобразует секцию меню в маршрут Vue Router
 * @param {Object} section - секция меню из JSON конфигурации
 * @returns {Object|null} - объект маршрута Vue Router или null
 */
function transformMenuSection(section) {
  if (!section.route) {
    console.warn(`Секция "${section.title}" не содержит конфигурации маршрута`)
    return null
  }

  const route = {
    path: section.route.path,
    name: section.routeName,
    component: createLazyImport(section.route.component),
    meta: {
      title: section.title,
      ...section.route.meta,
    }
  }

  // Добавляем redirect если указан
  if (section.route.redirect) {
    route.redirect = { name: section.route.redirect }
  }

  // Обрабатываем дочерние маршруты
  if (section.list && section.list.length > 0) {
    const children = section.list
      .map(transformSubItem)
      .filter(child => child !== null) // Убираем null элементы (offcanvas)

    if (children.length > 0) {
      route.children = children
    }
  }

  return route
}

/**
 * Генерирует массив маршрутов из JSON конфигурации меню
 * @returns {Array} - массив маршрутов для Vue Router
 */
export function generateRoutesFromConfig() {
  try {
    const routes = menuConfig.menuSections
      .map(transformMenuSection)
      .filter(route => route !== null) // Убираем невалидные маршруты

    console.log(`✅ Сгенерировано ${routes.length} маршрутов из JSON конфигурации`)
    return routes
  } catch (error) {
    console.error('❌ Ошибка генерации маршрутов из конфигурации:', error)
    return []
  }
}

/**
 * Генерирует дополнительные служебные маршруты (основные и auth)
 * @returns {Array} - массив служебных маршрутов
 */
export function generateCoreRoutes() {
  return [
    // Основные маршруты
    {
      path: '/',
      redirect: { name: 'Account' },
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/pages/NotFound.vue'),
      meta: {
        title: 'Страница не найдена',
        requiresAuth: true,
      },
    },
    {
      path: '/logout',
      name: 'logout',
      component: () => import('@/components/header/Logout.vue'),
      meta: {
        title: '-',
      }
    },

    // Маршруты аутентификации
    {
      path: '/start-page',
      name: 'StartPage',
      component: () => import('@/pages/auth/StartPage.vue'),
      meta: {
        startRoute: true,
        requiresAuth: false,
      },
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/pages/auth/LoginPage.vue'),
      meta: {
        startRoute: true,
        requiresAuth: false,
      },
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/pages/auth/RegisterPage.vue'),
      meta: {
        startRoute: true,
        requiresAuth: false,
      },
    },
    {
      path: '/verify-email',
      name: 'VerifyEmail',
      component: () => import('@/pages/auth/VerifyEmailPage.vue'),
      meta: {
        startRoute: true,
        requiresAuth: false,
      },
    },
    {
      path: '/forgot-password',
      name: 'ForgotPassword',
      component: () => import('@/pages/auth/ForgotPasswordPage.vue'),
      meta: {
        startRoute: true,
        requiresAuth: false,
      },
    },
    {
      path: '/reset-password',
      name: 'ResetPassword',
      component: () => import('@/pages/auth/ResetPasswordPage.vue'),
      meta: {
        startRoute: true,
        requiresAuth: false,
      },
    },
    {
      path: '/two-steps',
      name: 'TwoSteps',
      component: () => import('@/pages/auth/TwoStepsPage.vue'),
      meta: {
        startRoute: true,
        requiresAuth: false,
      },
    }
  ]
}

/**
 * Генерирует полную конфигурацию маршрутов
 * @returns {Array} - полный массив маршрутов для приложения
 */
export function generateAllRoutes() {
  const coreRoutes = generateCoreRoutes()
  const menuRoutes = generateRoutesFromConfig()
  
  return [
    ...coreRoutes,
    ...menuRoutes
  ]
}

/**
 * Дополнительные служебные функции для работы с маршрутами
 */

/**
 * Получает все названия маршрутов из конфигурации
 * @returns {Array} - массив имен маршрутов
 */
export function getAllRouteNames() {
  const routes = generateRoutesFromConfig()
  const names = []
  
  function extractNames(routeArray) {
    routeArray.forEach(route => {
      if (route.name) names.push(route.name)
      if (route.children) extractNames(route.children)
    })
  }
  
  extractNames(routes)
  return names
}

/**
 * Валидирует конфигурацию маршрутов
 * @returns {Object} - объект с результатами валидации
 */
export function validateRoutesConfig() {
  const errors = []
  const warnings = []
  
  try {
    menuConfig.menuSections.forEach((section, index) => {
      if (!section.route) {
        warnings.push(`Секция ${index + 1} "${section.title}" не содержит конфигурации маршрута`)
        return
      }
      
      if (!section.route.component) {
        errors.push(`Секция "${section.title}" не содержит component`)
      }
      
      if (!section.route.path) {
        errors.push(`Секция "${section.title}" не содержит path`)
      }
      
      // Валидация дочерних маршрутов
      if (section.list) {
        section.list.forEach(item => {
          if (!item.isOffcanvas && item.route && !item.route.component) {
            errors.push(`Подраздел "${item.name}" в секции "${section.title}" не содержит component`)
          }
        })
      }
    })
  } catch (error) {
    errors.push(`Ошибка чтения конфигурации: ${error.message}`)
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
} 