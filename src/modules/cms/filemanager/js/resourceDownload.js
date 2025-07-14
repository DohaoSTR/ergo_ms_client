import { apiClient } from '@/js/api/manager'

/**
 * Скачивание ресурса через API
 * @param {Object} resource - Объект ресурса с id и name
 * @param {Function} onSuccess - Callback при успешном скачивании (опционально)
 * @param {Function} onError - Callback при ошибке (опционально)
 * @returns {Promise<boolean>} - Promise с результатом операции
 */
export async function downloadResource(resource, onSuccess = null, onError = null) {
  if (!resource || !resource.id) {
    const errorMsg = 'Ресурс не найден или отсутствует ID'
    console.error(errorMsg)
    if (onError) onError(errorMsg)
    return false
  }

  try {
    // Выполняем GET запрос к API endpoint для скачивания
    const response = await fetch(`${apiClient.baseUrl}lms/resources/${resource.id}/download/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || ''}`
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // Получаем blob из ответа
    const blob = await response.blob()
    
    // Создаем URL для blob и скачиваем файл
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = resource.name || 'download'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    console.log('Ресурс успешно скачан:', resource.name)
    if (onSuccess) onSuccess(resource)
    return true
  } catch (error) {
    console.error('Ошибка при скачивании ресурса:', error)
    
    // Fallback к прямой ссылке на файл если есть
    if (resource.file) {
      try {
        const link = document.createElement('a')
        link.href = resource.file
        link.download = resource.name || 'download'
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        console.log('Использован fallback для скачивания ресурса')
        if (onSuccess) onSuccess(resource)
        return true
      } catch (fallbackError) {
        console.error('Ошибка fallback скачивания:', fallbackError)
        const errorMsg = 'Не удалось скачать ресурс. Попробуйте позже.'
        if (onError) onError(errorMsg)
        return false
      }
    } else {
      const errorMsg = 'Не удалось скачать ресурс. Файл недоступен.'
      if (onError) onError(errorMsg)
      return false
    }
  }
}

/**
 * Получение иконки для типа файла ресурса
 * @param {Object} resource - Объект ресурса
 * @returns {string} - CSS класс для иконки
 */
export function getResourceFileIcon(resource) {
  if (!resource || !resource.file_type) {
    return 'fa-file'
  }

  const fileType = resource.file_type.toLowerCase()
  
  if (fileType.includes('pdf')) {
    return 'fa-file-pdf'
  } else if (fileType.includes('word') || fileType.includes('doc')) {
    return 'fa-file-word'
  } else if (fileType.includes('excel') || fileType.includes('sheet')) {
    return 'fa-file-excel'
  } else if (fileType.includes('powerpoint') || fileType.includes('presentation')) {
    return 'fa-file-powerpoint'
  } else if (fileType.includes('image') || fileType.includes('png') || fileType.includes('jpg') || fileType.includes('jpeg') || fileType.includes('gif')) {
    return 'fa-file-image'
  } else if (fileType.includes('video') || fileType.includes('mp4') || fileType.includes('avi') || fileType.includes('mov')) {
    return 'fa-file-video'
  } else if (fileType.includes('audio') || fileType.includes('mp3') || fileType.includes('wav')) {
    return 'fa-file-audio'
  } else if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('archive')) {
    return 'fa-file-archive'
  } else if (fileType.includes('text') || fileType.includes('txt')) {
    return 'fa-file-alt'
  } else {
    return 'fa-file'
  }
}

/**
 * Форматирование размера файла
 * @param {number} bytes - Размер в байтах
 * @returns {string} - Отформатированный размер
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 Б'
  
  const k = 1024
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
} 