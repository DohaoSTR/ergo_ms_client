// Общие утилитарные функции для LMS модуля

export function useUtils() {
  // Форматирование дат
  function formatDate(date, options = {}) {
    if (!date) return ''
    
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    }
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date
      return dateObj.toLocaleDateString('ru-RU', defaultOptions)
    } catch (error) {
      console.error('Ошибка форматирования даты:', error)
      return ''
    }
  }

  function formatDateTime(date, options = {}) {
    if (!date) return ''
    
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...options
    }
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date
      return dateObj.toLocaleDateString('ru-RU', defaultOptions)
    } catch (error) {
      console.error('Ошибка форматирования даты и времени:', error)
      return ''
    }
  }

  function formatRelativeTime(date) {
    if (!date) return ''
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date
      const now = new Date()
      const diffMs = now - dateObj
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      
      if (diffDays === 0) return 'Сегодня'
      if (diffDays === 1) return 'Вчера'
      if (diffDays < 7) return `${diffDays} дней назад`
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} недель назад`
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} месяцев назад`
      return `${Math.floor(diffDays / 365)} лет назад`
    } catch (error) {
      console.error('Ошибка форматирования относительного времени:', error)
      return ''
    }
  }

  // Работа с изображениями
  function getImageUrl(imagePath, fallback = null) {
    if (!imagePath) return fallback
    
    // Если это полный URL
    if (imagePath.startsWith('http')) {
      return imagePath
    }
    
    // Если это относительный путь
    if (imagePath.startsWith('/')) {
      return `${window.location.origin}${imagePath}`
    }
    
    return fallback
  }

  function getAvatarUrl(user, size = 40) {
    if (user?.avatar) {
      return getImageUrl(user.avatar)
    }
    
    // Генерируем аватар с инициалами
    const initials = getUserInitials(user)
    return `https://ui-avatars.com/api/?name=${initials}&size=${size}&background=6366f1&color=ffffff`
  }

  function getUserInitials(user) {
    if (!user) return '??'
    
    const firstName = user.first_name || ''
    const lastName = user.last_name || ''
    
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase()
    }
    
    if (user.username) {
      return user.username.slice(0, 2).toUpperCase()
    }
    
    return '??'
  }

  // Работа с текстом
  function truncateText(text, maxLength = 100, suffix = '...') {
    if (!text || text.length <= maxLength) return text
    return text.slice(0, maxLength) + suffix
  }

  function capitalizeFirst(text) {
    if (!text) return ''
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
  }

  function pluralize(count, words) {
    // words = ['предмет', 'предмета', 'предметов']
    if (count % 10 === 1 && count % 100 !== 11) {
      return words[0]
    } else if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
      return words[1]
    } else {
      return words[2]
    }
  }

  // Валидация
  function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  function validateRequired(value, fieldName = 'Поле') {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} обязательно для заполнения`
    }
    return null
  }

  function validateMinLength(value, minLength, fieldName = 'Поле') {
    if (value && value.length < minLength) {
      return `${fieldName} должно содержать минимум ${minLength} символов`
    }
    return null
  }

  function validateMaxLength(value, maxLength, fieldName = 'Поле') {
    if (value && value.length > maxLength) {
      return `${fieldName} не может содержать более ${maxLength} символов`
    }
    return null
  }

  // Работа с прогрессом
  function getProgressColor(progress) {
    if (progress < 30) return 'danger'
    if (progress < 70) return 'warning'
    return 'success'
  }

  function getProgressText(progress) {
    if (progress === 0) return 'Не начат'
    if (progress < 100) return `${progress}% завершено`
    return 'Завершен'
  }

  // Генерация уникальных ID
  function generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Фильтрация и поиск
  function createSearchFilter(searchQuery, fields = ['name', 'title', 'description']) {
    if (!searchQuery) return () => true
    
    const query = searchQuery.toLowerCase().trim()
    return (item) => {
      return fields.some(field => {
        const value = getNestedValue(item, field)
        return value && value.toString().toLowerCase().includes(query)
      })
    }
  }

  function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  // Сортировка
  function createSorter(field, direction = 'asc') {
    return (a, b) => {
      const aVal = getNestedValue(a, field)
      const bVal = getNestedValue(b, field)
      
      if (aVal === bVal) return 0
      
      const comparison = aVal > bVal ? 1 : -1
      return direction === 'asc' ? comparison : -comparison
    }
  }

  // Дебаунс
  function debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  return {
    // Форматирование
    formatDate,
    formatDateTime,
    formatRelativeTime,
    
    // Изображения
    getImageUrl,
    getAvatarUrl,
    getUserInitials,
    
    // Текст
    truncateText,
    capitalizeFirst,
    pluralize,
    
    // Валидация
    validateEmail,
    validateRequired,
    validateMinLength,
    validateMaxLength,
    
    // Прогресс
    getProgressColor,
    getProgressText,
    
    // Утилиты
    generateId,
    createSearchFilter,
    createSorter,
    debounce,
    getNestedValue
  }
}

// Константы для типов уроков
export const LESSON_TYPES = {
  V: { label: 'Видео', icon: 'Play' },
  C: { label: 'Конференция', icon: 'Video' },
  L: { label: 'Лекция', icon: 'BookOpen' },
  A: { label: 'Задание', icon: 'FileCheck' },
  Q: { label: 'Тест', icon: 'HelpCircle' },
  F: { label: 'Форум', icon: 'MessageSquare' },
  FILE: { label: 'Файл', icon: 'File' },
  URL: { label: 'Ссылка', icon: 'ExternalLink' }
}

// Константы для статусов
export const STATUS_BADGES = {
  active: { class: 'bg-primary', text: 'Активный' },
  completed: { class: 'bg-success', text: 'Завершен' },
  suspended: { class: 'bg-warning', text: 'Приостановлен' },
  cancelled: { class: 'bg-danger', text: 'Отменен' },
  draft: { class: 'bg-secondary', text: 'Черновик' }
} 