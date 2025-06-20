import { useNotifications } from '@/pages/lms/composables/useNotifications'

// Экспортируем функции для использования в любом месте приложения
export const {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showConfirmDialog,
  closeConfirmDialog,
  showChoiceDialog,
  closeChoiceDialog
} = useNotifications()

// Вспомогательные функции для частых случаев
export function confirmDelete(itemName, itemType = 'элемент') {
  return showConfirmDialog({
    title: `Удаление ${itemType}`,
    message: `Вы уверены, что хотите удалить ${itemType} "${itemName}"?`,
    confirmText: 'Удалить',
    variant: 'danger'
  })
}

export function confirmAction(title, message, confirmText = 'Подтвердить') {
  return showConfirmDialog({
    title,
    message,
    confirmText,
    variant: 'primary'
  })
}

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