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

// Экспортируемые секции меню с преобразованными иконками
const sections = loadMenuSections()
const separators = loadMenuSeparators()

// Динамическое создание экспортов секций на основе JSON конфигурации
const sectionExports = {}

// Создаем карту имен экспортов для обратной совместимости
const exportNameMap = {
  1: 'UserMenuSection',
  2: 'SettingsMenuSection', 
  3: 'EmailMenuSection',
  4: 'ChatMenuSection',
  5: 'MapsMenuSection',
  6: 'CalendarMenuSection',
  7: 'KanbanMenuSection',
  8: 'AdminPanelMenuSection',
  9: 'WatermarkedVideoSection',
  10: 'BIMenuSection',
  11: 'ShortcodesMenuSection',
  12: 'EducationAnalyticMenuSection',
  13: 'ExpertSystemSection',
  14: 'AssetsAnalyseMenuSection'
}

// Динамически создаем экспорты
sections.forEach(section => {
  const exportName = exportNameMap[section.id]
  if (exportName) {
    sectionExports[exportName] = section
  }
})

// Экспорт отдельных секций для обратной совместимости
export const UserMenuSection = sectionExports.UserMenuSection
export const SettingsMenuSection = sectionExports.SettingsMenuSection
export const EmailMenuSection = sectionExports.EmailMenuSection
export const ChatMenuSection = sectionExports.ChatMenuSection
export const MapsMenuSection = sectionExports.MapsMenuSection
export const CalendarMenuSection = sectionExports.CalendarMenuSection
export const KanbanMenuSection = sectionExports.KanbanMenuSection
export const AdminPanelMenuSection = sectionExports.AdminPanelMenuSection
export const WatermarkedVideoSection = sectionExports.WatermarkedVideoSection
export const BIMenuSection = sectionExports.BIMenuSection
export const ShortcodesMenuSection = sectionExports.ShortcodesMenuSection
export const EducationAnalyticMenuSection = sectionExports.EducationAnalyticMenuSection
export const ExpertSystemSection = sectionExports.ExpertSystemSection
export const AssetsAnalyseMenuSection = sectionExports.AssetsAnalyseMenuSection

// Экспорт всех секций и сепараторов
export const allMenuSections = sections
export const menuSeparators = separators

/**
 * Функция получения сепаратора по индексу (для обратной совместимости)
 * @param {number} index - индекс секции
 * @returns {string|undefined} - название сепаратора
 */
export const getSeparator = (index) => {
  return separators[index.toString()]
}
