/**
 * ГЕНЕРАТОР МАРШРУТОВ ИЗ КОНФИГУРАЦИИ МЕНЮ И МАРШРУТОВ
 * 
 * Этот модуль генерирует маршруты Vue Router на основе:
 * - menu-config.json - структура меню (иконки, названия, иерархия, ссылки на маршруты)
 * - routes-config.json - полные конфигурации всех доступных маршрутов
 * 
 * Структура routes-config.json:
 * - coreRoutes - системные маршруты (главная, 404, logout)
 * - authRoutes - маршруты авторизации и BI модуля
 * - routes - основные маршруты приложения
 * 
 * Основные функции:
 * - generateRoutesFromConfig() - генерирует маршруты для Vue Router
 * - generateCoreRoutes() - генерирует системные и auth маршруты
 * - transformMenuSection() - преобразует секцию меню в маршрут
 * - transformSubItem() - преобразует подэлемент меню в дочерний маршрут
 * 
 * Использование:
 * import { generateRoutesFromConfig, generateAllRoutes } from '@/config/routes-generator.js'
 * const routes = generateAllRoutes()
 */

import menuConfig from '@/config/menu-config.json'
import routesConfig from '@/config/routes-config.json'

/**
 * Получает конфигурацию маршрута по имени
 * @param {string} routeName - имя маршрута
 * @returns {Object|null} - конфигурация маршрута или null
 */
function getRouteConfig(routeName) {
  return routesConfig.routes[routeName] || null
}

/**
 * Преобразует строковый путь к компоненту в функцию lazy import
 * @param {string} componentPath - путь к компоненту (например, "@/modules/cms/adp/user/ParentLayout.vue")
 * @returns {Function} - функция для ленивой загрузки компонента
 */
function createLazyImport(componentPath) {
  // Убираем префикс @/ и добавляем ./ для relative import
  const relativePath = componentPath.replace('@/', '../')
  return () => import(/* @vite-ignore */ relativePath)
}

/**
 * Преобразует конфигурацию подраздела в дочерний маршрут Vue Router
 * @param {Object} item - объект подраздела из JSON конфигурации
 * @returns {Object|Array|null} - объект маршрута Vue Router, массив маршрутов или null
 */
function transformSubItem(item) {
  // Пропускаем offcanvas элементы (они не являются реальными маршрутами)
  if (item.isOffcanvas) {
    return null
  }

  // Если это группа без маршрута (только children), возвращаем все дочерние маршруты
  if (!item.routeName && (item.children || item.list)) {
    const childRoutes = []
    
    // Обрабатываем children
    if (item.children && item.children.length > 0) {
      const transformedChildren = item.children
        .map(transformSubItem)
        .filter(child => child !== null)
      childRoutes.push(...transformedChildren)
    }
    
    // Обрабатываем list
    if (item.list && item.list.length > 0) {
      const transformedList = item.list
        .map(transformSubItem)
        .filter(child => child !== null)
      childRoutes.push(...transformedList)
    }
    
    return childRoutes.length > 0 ? childRoutes : null
  }

  // Получаем конфигурацию маршрута по имени
  const routeConfig = getRouteConfig(item.routeName || item.path)
  if (!routeConfig) {
    return null
  }

  const route = {
    path: routeConfig.path,
    name: item.routeName || item.path, // Используем routeName как name для совместимости
    component: createLazyImport(routeConfig.component),
    meta: {
      title: item.name || item.title, // Используем название из меню как заголовок по умолчанию
      ...routeConfig.meta, // Перезаписываем метаданными из конфигурации
    }
  }

  // Добавляем redirect если указан
  if (routeConfig.redirect) {
    // Проверяем, является ли redirect именем маршрута или путем
    if (routeConfig.redirect.startsWith('/')) {
      route.redirect = routeConfig.redirect
    } else {
      route.redirect = { name: routeConfig.redirect }
    }
  }

  // Рекурсивно обрабатываем дочерние элементы
  const childRoutes = []
  
  // Обрабатываем children
  if (item.children && item.children.length > 0) {
    const transformedChildren = item.children
      .map(transformSubItem)
      .filter(child => child !== null)
    
    // Если дочерний элемент вернул массив (группа без маршрута), разворачиваем его
    transformedChildren.forEach(child => {
      if (Array.isArray(child)) {
        childRoutes.push(...child)
      } else {
        childRoutes.push(child)
      }
    })
  }
  
  // Обрабатываем list
  if (item.list && item.list.length > 0) {
    const transformedList = item.list
      .map(transformSubItem)
      .filter(child => child !== null)
      
    // Если дочерний элемент вернул массив (группа без маршрута), разворачиваем его
    transformedList.forEach(child => {
      if (Array.isArray(child)) {
        childRoutes.push(...child)
      } else {
        childRoutes.push(child)
      }
    })
  }

  if (childRoutes.length > 0) {
    route.children = childRoutes
  }

  return route
}

/**
 * Преобразует секцию меню в маршрут Vue Router
 * @param {Object} section - секция меню из JSON конфигурации
 * @returns {Object|null} - объект маршрута Vue Router или null
 */
function transformMenuSection(section) {
  // Получаем конфигурацию маршрута по имени
  const routeConfig = getRouteConfig(section.routeName)
  if (!routeConfig) {
    return null
  }

  const route = {
    path: routeConfig.path,
    name: section.routeName,
    component: createLazyImport(routeConfig.component),
    meta: {
      title: section.title,
      ...routeConfig.meta,
    }
  }

  // Добавляем redirect если указан
  if (routeConfig.redirect) {
    // Проверяем, является ли redirect именем маршрута или путем
    if (routeConfig.redirect.startsWith('/')) {
      route.redirect = routeConfig.redirect
    } else {
      route.redirect = { name: routeConfig.redirect }
    }
  }

  // Обрабатываем дочерние маршруты из list и children
  const childRoutes = []
  
  // Обрабатываем children
  if (section.children && section.children.length > 0) {
    const transformedChildren = section.children
      .map(transformSubItem)
      .filter(child => child !== null)
      
    // Если дочерний элемент вернул массив (группа без маршрута), разворачиваем его
    transformedChildren.forEach(child => {
      if (Array.isArray(child)) {
        childRoutes.push(...child)
      } else {
        childRoutes.push(child)
      }
    })
  }
  
  // Обрабатываем list
  if (section.list && section.list.length > 0) {
    const transformedList = section.list
      .map(transformSubItem)
      .filter(child => child !== null)
      
    // Если дочерний элемент вернул массив (группа без маршрута), разворачиваем его
    transformedList.forEach(child => {
      if (Array.isArray(child)) {
        childRoutes.push(...child)
      } else {
        childRoutes.push(child)
      }
    })
  }

  if (childRoutes.length > 0) {
    route.children = childRoutes
  }

  return route
}

/**
 * Генерирует массив маршрутов из JSON конфигурации меню и маршрутов
 * @returns {Array} - массив маршрутов для Vue Router
 */
export function generateRoutesFromConfig() {
  try {
    const routes = menuConfig.menuSections
      .map(transformMenuSection)
      .filter(route => route !== null) // Убираем невалидные маршруты
    
    return routes
  } catch {
    return []
  }
}

// coreRoutes и authRoutes теперь находятся в routes-config.json

/**
 * Преобразует строковый путь компонента в динамический импорт
 * @param {string} componentPath - путь к компоненту (например: "@/modules/NotFound.vue")
 * @returns {Function} - функция динамического импорта
 */
function transformComponentPath(componentPath) {
  // Убираем префикс @/ и добавляем ./ для relative import (аналогично createLazyImport)
  const relativePath = componentPath.replace('@/', '../')
  return () => import(/* @vite-ignore */ relativePath)
}

/**
 * Преобразует маршрут из JSON формата в объект Vue Router
 * @param {Object} route - маршрут из JSON конфигурации
 * @returns {Object} - маршрут с компонентом как функцией динамического импорта
 */
function transformRoute(route) {
  const transformedRoute = { ...route }
  
  // Преобразуем строковый путь компонента в динамический импорт
  if (route.component && typeof route.component === 'string') {
    transformedRoute.component = transformComponentPath(route.component)
  }
  
  return transformedRoute
}

/**
 * Загружает и преобразует основные маршруты из JSON конфигурации
 * @returns {Array} - массив основных маршрутов
 */
function loadCoreRoutes() {
  try {
    return routesConfig.coreRoutes.map(transformRoute)
  } catch {
    return []
  }
}

/**
 * Загружает и преобразует маршруты аутентификации из JSON конфигурации
 * @returns {Array} - массив маршрутов аутентификации
 */
function loadAuthRoutes() {
  try {
    return routesConfig.authRoutes.map(transformRoute)
  } catch {
    return []
  }
}

/**
 * Генерирует дополнительные служебные маршруты (основные и auth) из JSON конфигурации
 * @returns {Array} - массив служебных маршрутов
 */
export function generateCoreRoutes() {
  const coreRoutes = loadCoreRoutes()
  const authRoutes = loadAuthRoutes()
  
  return [...coreRoutes, ...authRoutes]
}

/**
 * Получает только основные маршруты (без auth)
 * @returns {Array} - массив основных маршрутов
 */
export function getCoreRoutes() {
  return loadCoreRoutes()
}

/**
 * Получает только маршруты аутентификации
 * @returns {Array} - массив маршрутов аутентификации
 */
export function getAuthRoutes() {
  return loadAuthRoutes()
}

/**
 * Получает маршрут по имени из конфигурации
 * @param {string} routeName - имя маршрута
 * @returns {Object|undefined} - найденный маршрут
 */
export function getCoreRouteByName(routeName) {
  const allRoutes = generateCoreRoutes()
  return allRoutes.find(route => route.name === routeName)
}

/**
 * Получает все имена маршрутов из конфигурации
 * @returns {Array<string>} - массив имен маршрутов
 */
export function getAllCoreRouteNames() {
  const allRoutes = generateCoreRoutes()
  return allRoutes.map(route => route.name).filter(Boolean)
}

/**
 * Проверяет, является ли маршрут маршрутом аутентификации
 * @param {string} routeName - имя маршрута
 * @returns {boolean} - является ли маршрут auth маршрутом
 */
export function isAuthRoute(routeName) {
  const authRoutes = loadAuthRoutes()
  return authRoutes.some(route => route.name === routeName)
}

/**
 * Получает все имена маршрутов, которые уже созданы из меню
 * @param {Array} routes - массив маршрутов
 * @returns {Set} - набор имен маршрутов
 */
function getCreatedRouteNames(routes) {
  const names = new Set()
  
  function extractNames(routeArray) {
    routeArray.forEach(route => {
      if (route.name) names.add(route.name)
      if (route.children) extractNames(route.children)
    })
  }
  
  extractNames(routes)
  return names
}

/**
 * Создает отдельный маршрут из конфигурации
 * @param {string} routeName - имя маршрута
 * @param {Object} routeConfig - конфигурация маршрута
 * @returns {Object} - объект маршрута Vue Router
 */
function createStandaloneRoute(routeName, routeConfig) {
  const route = {
    path: routeConfig.path,
    name: routeName,
    component: createLazyImport(routeConfig.component),
    meta: {
      ...routeConfig.meta,
    }
  }

  // Добавляем redirect если указан
  if (routeConfig.redirect) {
    // Проверяем, является ли redirect именем маршрута или путем
    if (routeConfig.redirect.startsWith('/')) {
      route.redirect = routeConfig.redirect
    } else {
      route.redirect = { name: routeConfig.redirect }
    }
  }

  return route
}

/**
 * Генерирует недостающие маршруты (которые есть в routes-config.json, но не в меню)
 * @param {Set} createdRouteNames - набор уже созданных имен маршрутов
 * @returns {Array} - массив недостающих маршрутов
 */
function generateMissingRoutes(createdRouteNames) {
  const missingRoutes = []
  
  // Проходим по всем маршрутам в routes-config.json
  Object.entries(routesConfig.routes).forEach(([routeName, routeConfig]) => {
    // Если маршрут не был создан через меню, создаем его отдельно
    if (!createdRouteNames.has(routeName)) {
      try {
        const route = createStandaloneRoute(routeName, routeConfig)
        missingRoutes.push(route)
      } catch (error) {
        console.warn(`Не удалось создать маршрут ${routeName}:`, error)
      }
    }
  })
  
  return missingRoutes
}

/**
 * Генерирует полную конфигурацию маршрутов
 * @returns {Array} - полный массив маршрутов для приложения
 */
export function generateAllRoutes() {
  const coreRoutes = generateCoreRoutes()
  const menuRoutes = generateRoutesFromConfig()
  
  // Получаем имена уже созданных маршрутов
  const createdRouteNames = getCreatedRouteNames([...coreRoutes, ...menuRoutes])
  
  // Создаем недостающие маршруты из routes-config.json
  const missingRoutes = generateMissingRoutes(createdRouteNames)
  
  return [
    ...coreRoutes,
    ...menuRoutes,
    ...missingRoutes
  ]
}

/**
 * ФУНКЦИИ ДЛЯ РАБОТЫ С АДАПТИВНЫМИ SEPARATORS
 */

/**
 * Генерирует адаптивные separators на основе текущих элементов меню
 * @returns {Object} - объект с позициями separators
 */
export function generateAdaptiveSeparators() {
  const separators = {}
  const menuSections = menuConfig.menuSections
  
  // Обрабатываем каждый раздел и ищем места для separators
  for (let i = 0; i < menuSections.length; i++) {
    const section = menuSections[i]
    
    // Проверяем, есть ли separator для данной позиции в конфигурации
    if (menuConfig.separators) {
      // Ищем separator по индексу в массиве
      const separatorByIndex = Object.keys(menuConfig.separators).find(key => {
        return parseInt(key) === i
      })
      
      if (separatorByIndex) {
        separators[i] = menuConfig.separators[separatorByIndex]
        continue
      }
      
      // Ищем separator по id элемента
      const separatorById = menuConfig.separators[section.id?.toString()]
      if (separatorById) {
        separators[i] = separatorById
        continue
      }
      
      // Ищем separator по имени роута
      const separatorByRoute = Object.keys(menuConfig.separators).find(key => {
        return key === section.routeName
      })
      
      if (separatorByRoute) {
        separators[i] = menuConfig.separators[separatorByRoute]
      }
    }
  }
  
  return separators
}

/**
 * Получает позицию separator для указанного индекса
 * @param {number} index - индекс элемента меню
 * @returns {string|null} - название separator или null
 */
export function getSeparatorByIndex(index) {
  const separators = generateAdaptiveSeparators()
  return separators[index] || null
}

/**
 * Проверяет, должен ли отображаться separator перед указанным элементом
 * @param {number} index - индекс элемента меню
 * @returns {boolean} - должен ли отображаться separator
 */
export function shouldShowSeparator(index) {
  return getSeparatorByIndex(index) !== null
}

/**
 * Получает структуру меню с информацией о separators
 * @returns {Object} - объект с массивом элементов меню и информацией о separators
 */
export function getMenuWithSeparators() {
  const menuSections = menuConfig.menuSections
  const separators = generateAdaptiveSeparators()
  
  return {
    sections: menuSections,
    separators: separators,
    getSeparatorAt: (index) => separators[index] || null,
    hasSeparatorAt: (index) => Object.prototype.hasOwnProperty.call(separators, index)
  }
}

/**
 * Обновляет конфигурацию separators новыми значениями
 * @param {Object} newSeparators - новая конфигурация separators
 * @returns {Object} - обновленная конфигурация меню
 */
export function updateSeparatorsConfig(newSeparators) {
  // Примечание: эта функция возвращает обновленную конфигурацию
  // Для применения изменений нужно сохранить файл menu-config.json
  return {
    ...menuConfig,
    separators: newSeparators
  }
}

/**
 * ДОПОЛНИТЕЛЬНЫЕ СЛУЖЕБНЫЕ ФУНКЦИИ ДЛЯ РАБОТЫ С МАРШРУТАМИ И КОНФИГУРАЦИЕЙ
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
 * Получает все доступные маршруты из routes-config.json
 * @returns {Object} - объект со всеми маршрутами
 */
export function getAllAvailableRoutes() {
  return routesConfig.routes
}

/**
 * Получает конфигурацию маршрута по имени
 * @param {string} routeName - имя маршрута
 * @returns {Object|null} - конфигурация маршрута или null
 */
export function getRouteConfigByName(routeName) {
  return getRouteConfig(routeName)
}

/**
 * Получает информацию о всех созданных маршрутах для отладки
 * @returns {Object} - объект с информацией о маршрутах
 */
export function getRoutesDebugInfo() {
  const coreRoutes = generateCoreRoutes()
  const menuRoutes = generateRoutesFromConfig()
  const createdRouteNames = getCreatedRouteNames([...coreRoutes, ...menuRoutes])
  const missingRoutes = generateMissingRoutes(createdRouteNames)
  
  return {
    totalRoutes: coreRoutes.length + menuRoutes.length + missingRoutes.length,
    coreRoutesCount: coreRoutes.length,
    menuRoutesCount: menuRoutes.length,
    missingRoutesCount: missingRoutes.length,
    coreRouteNames: coreRoutes.map(r => r.name).filter(Boolean),
    menuRouteNames: Array.from(createdRouteNames).filter(name => 
      !coreRoutes.some(r => r.name === name)
    ),
    missingRouteNames: missingRoutes.map(r => r.name).filter(Boolean),
    allAvailableRoutes: Object.keys(routesConfig.routes)
  }
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
      const routeConfig = getRouteConfig(section.routeName)
      if (!routeConfig) {
        warnings.push(`Секция ${index + 1} "${section.title}" не содержит конфигурации маршрута`)
        return
      }
      
      if (!routeConfig.component) {
        errors.push(`Секция "${section.title}" не содержит component`)
      }
      
      if (!routeConfig.path) {
        errors.push(`Секция "${section.title}" не содержит path`)
      }
      
      // Валидация дочерних маршрутов
      if (section.list) {
        section.list.forEach(item => {
          const itemConfig = getRouteConfig(item.routeName || item.path)
          if (!item.isOffcanvas && !itemConfig) {
            errors.push(`Подраздел "${item.name}" в секции "${section.title}" не найден в конфигурации маршрутов`)
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