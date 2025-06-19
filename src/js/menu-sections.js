

import { getIcon } from '@/config/icons-mapping.js'
import menuConfig from '@/config/menu-config.json'
import menuOrderConfig from '@/config/menu-order-config.json'
import { AdaptiveSeparators } from '@/config/adaptive-separators.js'

function transformMenuSection(section) {
  return {
    ...section,
    icon: getIcon(section.icon)
  }
}

function loadMenuSections() {
  try {
    const sections = menuConfig.menuSections.map(transformMenuSection)
    const orderConfig = menuOrderConfig.menuOrder
    if (orderConfig && orderConfig.length > 0) {
      return sortMenuSectionsByOrder(sections, orderConfig)
    }
    return sections
  } catch (error) {
    console.error('Ошибка загрузки конфигурации меню:', error)
    return []
  }
}

function sortMenuSectionsByOrder(sections, order) {
  const sectionMap = new Map()
  sections.forEach(section => {
    if (section.routeName) {
      sectionMap.set(section.routeName, section)
    }
  })
  
  const sortedSections = []
  order.forEach(routeName => {
    if (sectionMap.has(routeName)) {
      sortedSections.push(sectionMap.get(routeName))
      sectionMap.delete(routeName)
    }
  })
  
  sectionMap.forEach(section => {
    sortedSections.push(section)
  })
  
  return sortedSections
}

function generateExportName(routeName) {
  return `${routeName}MenuSection`
}

const sections = loadMenuSections()
const menuSections = {}

sections.forEach(section => {
  if (section.routeName) {
    const exportName = generateExportName(section.routeName)
    menuSections[exportName] = section
  }
})

const extendedConfig = {
  ...menuConfig,
  separators: {
    ...menuConfig.separators,
    byOrderIndex: menuOrderConfig.separators || {}
  },
  separatorSettings: {
    ...menuConfig.separatorSettings,
    useOrderBased: true,
    useCategories: false
  }
}

const separatorManager = new AdaptiveSeparators(extendedConfig)

export const allMenuSections = sections
export { menuSections }

export const AdminPanelMenuSection = menuSections.AdminPanelMenuSection

export const getSeparator = (index) => {
  return separatorManager.getSeparatorAt(index)
}

export const shouldShowSeparator = (index) => {
  return separatorManager.shouldShowSeparator(index)
}




