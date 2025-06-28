/**
 * ГЕНЕРАТОР МАРШРУТОВ ИЗ JSON КОНФИГУРАЦИИ
 * 
 * Данный модуль автоматически генерирует конфигурацию маршрутов Vue Router
 * на основе JSON конфигураций меню и основных маршрутов. Это обеспечивает 
 * единый источник истины для структуры приложения и устраняет дублирование кода.
 * 
 * Архитектура:
 * - menu-config.json: содержит структуру меню и основных маршрутов
 * - core-routes-config.json: содержит служебные маршруты (auth, 404, etc.)
 * - routes-generator.js: преобразует JSON в объекты Vue Router
 * 
 * Функциональность:
 * - Преобразование JSON структуры в массив маршрутов Vue Router
 * - Поддержка вложенных маршрутов (children)
 * - Автоматическое создание ленивой загрузки компонентов
 * - Сохранение метаданных маршрутов (title, requiresAuth и др.)
 * - Обработка redirect для родительских маршрутов
 * - Генерация служебных маршрутов из JSON конфигурации
 * - Разделение на основные маршруты и маршруты аутентификации
 * - Валидация и обработка ошибок
 * 
 * Использование:
 * import { generateRoutesFromConfig, generateCoreRoutes } from '@/config/routes-generator.js'
 * const menuRoutes = generateRoutesFromConfig()
 * const coreRoutes = generateCoreRoutes()
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
  return () => import(/* @vite-ignore */ relativePath)
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

  // Если это группа без маршрута (только children), возвращаем все дочерние маршруты
  if (!item.route && (item.children || item.list)) {
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

  if (!item.route) {
    return null
  }

  const route = {
    path: item.route.path,
    name: item.path || item.routeName, // Используем path или routeName как name для совместимости
    component: createLazyImport(item.route.component),
    meta: {
      title: item.name || item.title, // Используем название из меню как заголовок по умолчанию
      ...item.route.meta, // Перезаписываем метаданными из конфигурации
    }
  }

  // Добавляем redirect если указан
  if (item.route.redirect) {
    // Проверяем, является ли redirect именем маршрута или путем
    if (item.route.redirect.startsWith('/')) {
      route.redirect = item.route.redirect
    } else {
      route.redirect = { name: item.route.redirect }
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
  if (!section.route) {
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
    // Проверяем, является ли redirect именем маршрута или путем
    if (section.route.redirect.startsWith('/')) {
      route.redirect = section.route.redirect
    } else {
      route.redirect = { name: section.route.redirect }
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
 * Генерирует массив маршрутов из JSON конфигурации меню
 * @returns {Array} - массив маршрутов для Vue Router
 */
export function generateRoutesFromConfig() {
  try {
    const routes = menuConfig.menuSections
      .map(transformMenuSection)
      .filter(route => route !== null) // Убираем невалидные маршруты
    
    return routes
  } catch (error) {
    return []
  }
}

import coreRoutesConfig from '@/config/core-routes-config.json'

/**
 * Преобразует строковый путь компонента в динамический импорт
 * @param {string} componentPath - путь к компоненту (например: "@/pages/NotFound.vue")
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
    return coreRoutesConfig.coreRoutes.map(transformRoute)
  } catch (error) {
    return []
  }
}

/**
 * Загружает и преобразует маршруты аутентификации из JSON конфигурации
 * @returns {Array} - массив маршрутов аутентификации
 */
function loadAuthRoutes() {
  try {
    return coreRoutesConfig.authRoutes.map(transformRoute)
  } catch (error) {
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
      const separatorById = menuConfig.separators[section.id.toString()]
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
    hasSeparatorAt: (index) => separators.hasOwnProperty(index)
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