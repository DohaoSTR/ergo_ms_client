/**
 * КОНФИГУРАЦИЯ СЕКЦИЙ БОКОВОГО МЕНЮ (JSON-BASED)
 * 
 * Данный файл загружает конфигурацию меню из JSON файла и преобразует
 * строковые имена иконок в Vue компоненты. Это обеспечивает гибкую
 * систему управления меню через конфигурационные файлы.
 * 
 * Архитектура:
 * - menu-config.json: содержит всю структуру меню в JSON формате
 * - icons-mapping.js: маппинг строковых имен на компоненты иконок
 * - menu-sections.js: загрузка и преобразование конфигурации
 * 
 * Функциональность:
 * - Загрузка конфигурации меню из JSON файла
 * - Преобразование строковых имен иконок в Vue компоненты
 * - Поддержка сепараторов между секциями меню
 * - Валидация и обработка ошибок загрузки
 * - Динамическое создание именованных экспортов на основе routeName
 * 
 * Используется компонентами MenuList.vue и MenuGroup.vue для динамического
 * построения структуры бокового меню с поддержкой навигации и группировки.
 */

import { getIcon } from '@/config/icons-mapping.js'
import menuConfig from '@/config/menu-config.json'

/**
 * Преобразует секцию меню из JSON формата в объект с Vue компонентами
 * @param {Object} section - секция меню из JSON конфигурации
 * @returns {Object} - секция с подставленными компонентами иконок
 */
function transformMenuSection(section) {
  return {
    ...section,
    icon: getIcon(section.icon)
  }
}

/**
 * Загружает и преобразует все секции меню из JSON конфигурации
 * @returns {Array} - массив секций меню с компонентами иконок
 */
function loadMenuSections() {
  try {
    return menuConfig.menuSections.map(transformMenuSection)
  } catch (error) {
    console.error('Ошибка загрузки конфигурации меню:', error)
    return []
  }
}

/**
 * Получает конфигурацию сепараторов меню
 * @returns {Object} - объект с настройками сепараторов
 */
function loadMenuSeparators() {
  try {
    return menuConfig.separators || {}
  } catch (error) {
    console.error('Ошибка загрузки сепараторов меню:', error)
    return {}
  }
}

/**
 * Генерирует имя экспорта на основе routeName секции
 * @param {string} routeName - имя маршрута из конфигурации
 * @returns {string} - имя для экспорта
 */
function generateExportName(routeName) {
  // Преобразуем routeName в формат экспорта (например: "User" -> "UserMenuSection")
  return `${routeName}MenuSection`
}

// Экспортируемые секции меню с преобразованными иконками
const sections = loadMenuSections()
const separators = loadMenuSeparators()

// Создаем объект с автоматически генерируемыми экспортами секций
const menuSections = {}

// Автоматически создаем экспорты на основе routeName из конфигурации
sections.forEach(section => {
  if (section.routeName) {
    const exportName = generateExportName(section.routeName)
    menuSections[exportName] = section
  }
})

// Основные экспорты
export const allMenuSections = sections
export const menuSeparators = separators

// Объект со всеми секциями меню, доступными по именам экспортов
export { menuSections }

// Динамические именованные экспорты для обратной совместимости
// НЕ ЗАБЫТЬ СДЕЛАТЬ АВТОГЕНЕРАЦИЮ ЭКСПОРТОВ
export const UserMenuSection = menuSections.UserMenuSection
export const SettingsMenuSection = menuSections.SettingsMenuSection
export const EmailMenuSection = menuSections.EmailMenuSection
export const MessengerMenuSection = menuSections.MessengerMenuSection
export const MapsMenuSection = menuSections.MapsMenuSection
export const CalendarMenuSection = menuSections.CalendarMenuSection
export const KanbanMenuSection = menuSections.KanbanMenuSection
export const AdminPanelMenuSection = menuSections.AdminPanelMenuSection
export const WatermarkedVideoMenuSection = menuSections.WatermarkedVideoMenuSection
export const BIMenuSection = menuSections.BIMenuSection
export const ShortcodesMenuSection = menuSections.ShortcodesMenuSection
export const EducationAnalyticModuleMenuSection = menuSections.EducationAnalyticModuleMenuSection
export const ExpertSystemMenuSection = menuSections.ExpertSystemMenuSection
export const AssetsAnalyseMenuSection = menuSections.AssetsAnalyseMenuSection

/**
 * Функция получения секции по имени экспорта
 * @param {string} exportName - имя экспорта (например: "UserMenuSection")
 * @returns {Object|undefined} - секция меню
 */
export const getMenuSection = (exportName) => {
  return menuSections[exportName]
}

/**
 * Функция для получения секции по routeName с автоматической генерацией имени экспорта
 * @param {string} routeName - имя маршрута из конфигурации
 * @returns {Object|undefined} - секция меню
 */
export const getMenuSectionByRoute = (routeName) => {
  const exportName = generateExportName(routeName)
  return menuSections[exportName]
}

/**
 * Функция получения сепаратора по индексу (для обратной совместимости)
 * @param {number} index - индекс секции
 * @returns {string|undefined} - название сепаратора
 */
export const getSeparator = (index) => {
  return separators[index.toString()]
}

/**
 * Функция получения секции по routeName
 * @param {string} routeName - имя маршрута
 * @returns {Object|undefined} - секция меню
 */
export const getSectionByRouteName = (routeName) => {
  return sections.find(section => section.routeName === routeName)
}

/**
 * Функция получения всех доступных имен экспортов
 * @returns {Array<string>} - массив имен экспортов
 */
export const getAvailableExports = () => {
  return Object.keys(menuSections)
}

/**
 * Функция для проверки существования секции по имени экспорта
 * @param {string} exportName - имя экспорта
 * @returns {boolean} - существует ли секция
 */
export const hasMenuSection = (exportName) => {
  return exportName in menuSections
}

/**
 * Функция получения всех routeName из конфигурации
 * @returns {Array<string>} - массив всех routeName
 */
export const getAllRouteNames = () => {
  return sections.map(section => section.routeName).filter(Boolean)
}
