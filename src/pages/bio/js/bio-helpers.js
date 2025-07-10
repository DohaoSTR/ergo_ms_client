import {
  zoneTypeOptions,
  abundanceOptions,
  SCALES_TYPES,
  SPECTRUM_TYPES,
  SPECTRUM_TYPES_SHORT,
} from '@/pages/bio/js/bio-constants'

/**
 * Форматирование даты в человекочитаемый формат
 * @param {string} dateString - Строка даты в формате ISO
 * @returns {string} Отформатированная дата в формате DD.MM.YYYY
 */
export const formatDate = (dateString) => {
  if (!dateString) return '-'

  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU')
  } catch {
    return dateString
  }
}

/**
 * Переводит тип местности из технического названия в читаемый текст
 * @param {string} type - Тип местности (forest/meadow)
 * @returns {string} Переведенное название местности
 */
export const getZoneTypeTranslation = (type) =>
  zoneTypeOptions.find((opt) => opt.value === type)?.label || type

/**
 * Форматирует значение обилия в читаемую форму
 * @param {string} value - Значение обилия (r, +, 1-5)
 * @returns {string} Форматированное значение обилия
 */
export const getAbundanceLabel = (value) =>
  abundanceOptions.find((opt) => opt.value === value)?.label || value

/**
 * Обработка ошибок API
 * @param {Object|Error} err - Объект ошибки или ответа API с ошибкой
 * @param {string} defaultMessage - Сообщение по умолчанию, если не удалось извлечь ошибку
 * @param {Object} toast - Экземпляр useToast для отображения ошибок (опционально)
 * @returns {string} Сообщение об ошибке
 */
export const handleApiError = (err, defaultMessage = 'Произошла ошибка', toast = null) => {
  let errorMessage = defaultMessage

  if (err?.errors && typeof err.errors === 'object') {
    const firstErrorField = Object.keys(err.errors)[0]
    if (firstErrorField) {
      const fieldError = err.errors[firstErrorField]
      if (typeof fieldError === 'string') {
        errorMessage = fieldError
      } else if (Array.isArray(fieldError) && fieldError.length > 0) {
        errorMessage = fieldError[0]
      }
    }
  } else {
    try {
      if (err.response && err.response.data) {
        // Axios error format
        const data = err.response.data

        if (data.error) {
          errorMessage = data.error
        } else if (data.message) {
          errorMessage = data.message
        } else if (data.detail) {
          errorMessage = data.detail
        } else if (typeof data === 'string') {
          errorMessage = data
        }
      } else if (err.data) {
        // Custom API response with error
        const data = err.data

        if (data.error) {
          errorMessage = data.error
        } else if (data.message) {
          errorMessage = data.message
        } else if (data.detail) {
          errorMessage = data.detail
        } else if (typeof data === 'string') {
          errorMessage = data
        }
      } else if (err.message) {
        // Standard JS Error
        errorMessage = err.message
      } else if (typeof err === 'string') {
        errorMessage = err
      }
    } catch (e) {
      console.error('Ошибка при обработке ошибки API:', e)
    }
  }

  if (toast) {
    toast.error(errorMessage)
  }

  return errorMessage
}

/**
 * Получение человекочитаемого названия элемента анализа по его ключу
 * @param {string} elementKey - Ключ элемента (raunkiaer, ellenberg, и т.д.)
 * @returns {string} Человекочитаемое название элемента
 */
export const getElementTitle = (elementKey) => {
  // Поиск в типах спектров
  const spectrumType = SPECTRUM_TYPES.find((item) => item.value === elementKey)
  if (spectrumType) {
    return spectrumType.label
  }

  // Поиск в типах шкал
  const scaleType = SCALES_TYPES.find((item) => item.value === elementKey)
  if (scaleType) {
    return scaleType.label
  }

  // Если не найдено, вернуть исходный ключ
  return elementKey
}

export const getShortElementTitle = (elementKey) => {
  // Поиск в типах спектров
  const spectrumType = SPECTRUM_TYPES_SHORT.find((item) => item.value === elementKey)
  if (spectrumType) {
    return spectrumType.label
  }

  // Поиск в типах шкал
  const scaleType = SCALES_TYPES.find((item) => item.value === elementKey)
  if (scaleType) {
    return scaleType.label
  }

  // Если не найдено, вернуть исходный ключ
  return elementKey
}
