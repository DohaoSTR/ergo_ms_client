// Базовый модуль уведомлений без циклических зависимостей
// Простые функции для показа уведомлений

let notificationContainer = null

// Создание контейнера для уведомлений
function createNotificationContainer() {
  if (notificationContainer) return notificationContainer
  
  notificationContainer = document.createElement('div')
  notificationContainer.id = 'notifications-container'
  notificationContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 400px;
  `
  document.body.appendChild(notificationContainer)
  return notificationContainer
}

// Базовая функция для показа уведомления
function showNotification(message, type = 'info', duration = 5000) {
  const container = createNotificationContainer()
  
  const notification = document.createElement('div')
  notification.style.cssText = `
    padding: 12px 16px;
    border-radius: 6px;
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateX(100%);
    transition: transform 0.3s ease;
    cursor: pointer;
  `
  
  // Цвета для разных типов
  const colors = {
    success: '#28a745',
    error: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8'
  }
  
  notification.style.backgroundColor = colors[type] || colors.info
  notification.textContent = message
  
  // Добавляем в контейнер
  container.appendChild(notification)
  
  // Анимация появления
  setTimeout(() => {
    notification.style.transform = 'translateX(0)'
  }, 10)
  
  // Удаление при клике
  notification.addEventListener('click', () => removeNotification(notification))
  
  // Автоудаление
  if (duration > 0) {
    setTimeout(() => removeNotification(notification), duration)
  }
  
  return notification
}

function removeNotification(notification) {
  if (!notification || !notification.parentNode) return
  
  notification.style.transform = 'translateX(100%)'
  notification.style.opacity = '0'
  
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification)
    }
  }, 300)
}

// Экспортируемые функции
export function showSuccess(message, duration = 5000) {
  return showNotification(message, 'success', duration)
}

export function showError(message, duration = 8000) {
  return showNotification(message, 'error', duration)
}

export function showWarning(message, duration = 6000) {
  return showNotification(message, 'warning', duration)
}

export function showInfo(message, duration = 5000) {
  return showNotification(message, 'info', duration)
}

// Функция подтверждения
export function confirmDelete(title, message) {
  return new Promise((resolve) => {
    const result = confirm(`${title}\n\n${message}`)
    resolve(result)
  })
}

export function confirmAction(title, message) {
  return new Promise((resolve) => {
    const result = confirm(`${title}\n\n${message}`)
    resolve(result)
  })
}

// Обработка ошибок API
export async function handleApiError(error, defaultMessage = 'Произошла ошибка') {
  const errorMessage = error.response?.data?.error ||
                       error.response?.data?.message || 
                       error.response?.data?.detail ||
                       (typeof error.response?.data === 'object' ? 
                        Object.values(error.response.data).flat().join(', ') : 
                        defaultMessage)
  
  showError(errorMessage)
}

export function showValidationError(message = 'Проверьте правильность заполнения полей') {
  showWarning(message)
}

export function showSaveSuccess(itemType = 'данные') {
  showSuccess(`${itemType} успешно сохранены!`)
}

export function showDeleteSuccess(itemType = 'элемент') {
  showSuccess(`${itemType} успешно удален!`)
}

// Диалоги подтверждения (упрощенные)
export function showConfirmDialog({ title, message, confirmText = 'Подтвердить' }) {
  return new Promise((resolve) => {
    const result = confirm(`${title}\n\n${message}`)
    resolve(result)
  })
}

export function closeConfirmDialog() {
  // Для совместимости
}

export function showChoiceDialog(options) {
  return new Promise((resolve) => {
    const choice = confirm(options.message || 'Выберите действие')
    resolve(choice)
  })
}

export function closeChoiceDialog() {
  // Для совместимости
} 