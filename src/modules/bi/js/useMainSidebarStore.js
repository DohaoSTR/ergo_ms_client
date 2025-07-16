import { ref, computed, onMounted, onUnmounted } from 'vue'

// Состояние основного сайдбара
const leftPadding = ref('280px')

// Функция для получения текущего состояния сайдбара из DOM
function getCurrentSidebarState() {
  if (typeof window === 'undefined') return '280px'
  
  // Ищем элемент с классом layout-page и получаем его padding-left
  const layoutPage = document.querySelector('.layout-page')
  if (layoutPage) {
    const computedStyle = window.getComputedStyle(layoutPage)
    return computedStyle.paddingLeft || '280px'
  }
  
  return '280px'
}

// Функция для обновления состояния
function updateSidebarState() {
  leftPadding.value = getCurrentSidebarState()
}

// Вычисляемое свойство для определения ширины сайдбара
export const sidebarWidth = computed(() => {
  // Извлекаем числовое значение из padding (например, "280px" -> 280)
  const paddingValue = parseInt(leftPadding.value)
  return paddingValue || 260
})

// Вычисляемое свойство для определения, свернут ли сайдбар
export const isSidebarCollapsed = computed(() => {
  return sidebarWidth.value <= 120 // Если ширина меньше или равна 120px, считаем свернутым
})

// Функция для инициализации отслеживания
export function initializeSidebarTracking() {
  if (typeof window === 'undefined') return
  
  // Обновляем состояние при загрузке
  updateSidebarState()
  
  // Создаем observer для отслеживания изменений в DOM
  const observer = new MutationObserver(() => {
    updateSidebarState()
  })
  
  // Наблюдаем за изменениями в layout-page
  const layoutPage = document.querySelector('.layout-page')
  if (layoutPage) {
    observer.observe(layoutPage, {
      attributes: true,
      attributeFilter: ['style']
    })
  }
  
  // Возвращаем функцию для очистки
  return () => {
    observer.disconnect()
  }
}

// Экспортируем состояние
export { leftPadding } 