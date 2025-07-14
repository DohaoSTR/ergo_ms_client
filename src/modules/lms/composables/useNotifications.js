import { ref } from 'vue'

// Глобальное состояние для уведомлений
const notifications = ref([])
const confirmDialog = ref({
  show: false,
  title: '',
  message: '',
  confirmText: 'Удалить',
  cancelText: 'Отмена',
  variant: 'danger',
  loading: false,
  onConfirm: null,
  onCancel: null
})

const choiceDialog = ref({
  show: false,
  title: '',
  message: '',
  choices: [],
  loading: false,
  onChoice: null,
  onCancel: null
})

let notificationId = 0

export function useNotifications() {
  
  // Функция для показа уведомления
  function showNotification(message, type = 'success', duration = 3000) {
    const id = ++notificationId
    const notification = {
      id,
      message,
      type,
      duration,
      show: true
    }
    
    notifications.value.push(notification)
    
    // Автоматически удаляем уведомление через duration + 500ms (анимация)
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration + 500)
    }
    
    return id
  }
  
  // Функция для удаления уведомления
  function removeNotification(id) {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }
  
  // Функция для очистки всех уведомлений
  function clearAllNotifications() {
    notifications.value.splice(0, notifications.value.length)
  }
  
  // Быстрые методы для разных типов уведомлений
  function showSuccess(message, duration = 3000) {
    return showNotification(message, 'success', duration)
  }
  
  function showError(message, duration = 5000) {
    return showNotification(message, 'error', duration)
  }
  
  function showWarning(message, duration = 4000) {
    return showNotification(message, 'warning', duration)
  }
  
  function showInfo(message, duration = 3000) {
    return showNotification(message, 'info', duration)
  }
  
  // Функция для показа диалога подтверждения
  function showConfirmDialog(options) {
    return new Promise((resolve) => {
      confirmDialog.value = {
        show: true,
        title: options.title || 'Подтверждение',
        message: options.message || 'Вы уверены?',
        confirmText: options.confirmText || 'Удалить',
        cancelText: options.cancelText || 'Отмена',
        variant: options.variant || 'danger',
        loading: false,
        onConfirm: () => {
          confirmDialog.value.loading = true
          resolve(true)
        },
        onCancel: () => {
          confirmDialog.value.show = false
          resolve(false)
        }
      }
    })
  }
  
  // Функция для закрытия диалога подтверждения
  function closeConfirmDialog() {
    confirmDialog.value.show = false
    confirmDialog.value.loading = false
  }
  
  // Функция для установки состояния загрузки диалога
  function setConfirmLoading(loading) {
    confirmDialog.value.loading = loading
  }
  
  // Функция для показа диалога выбора
  function showChoiceDialog(options) {
    return new Promise((resolve) => {
      choiceDialog.value = {
        show: true,
        title: options.title || 'Выберите действие',
        message: options.message || 'Выберите одно из действий:',
        choices: options.choices || [],
        loading: false,
        onChoice: (choice) => {
          choiceDialog.value.loading = true
          resolve(choice)
        },
        onCancel: () => {
          choiceDialog.value.show = false
          resolve(null)
        }
      }
    })
  }
  
  // Функция для закрытия диалога выбора
  function closeChoiceDialog() {
    choiceDialog.value.show = false
    choiceDialog.value.loading = false
  }
  
  // Функция для установки состояния загрузки диалога выбора
  function setChoiceLoading(loading) {
    choiceDialog.value.loading = loading
  }
  
  return {
    // Состояние
    notifications,
    confirmDialog,
    choiceDialog,
    
    // Методы уведомлений
    showNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    
    // Методы диалога подтверждения
    showConfirmDialog,
    closeConfirmDialog,
    setConfirmLoading,
    
    // Методы диалога выбора
    showChoiceDialog,
    closeChoiceDialog,
    setChoiceLoading
  }
} 