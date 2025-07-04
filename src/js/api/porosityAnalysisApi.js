import { apiClient } from './manager.js'

// Базовый URL для API анализа пористости
const BASE_URL = 'analysis_porosity/api'

/**
 * API клиент для работы с анализами пористости
 */
export const porosityAnalysisApi = {
  /**
   * Получить список анализов пользователя
   */
  async getAnalyses(params = {}) {
    return await apiClient.get(`${BASE_URL}/analyses/`, params)
  },

  /**
   * Создать новый анализ
   * @param {FormData} formData - данные формы с изображением и параметрами
   */
  async createAnalysis(formData) {
    return await apiClient.post(`${BASE_URL}/analyses/`, formData)
  },

  /**
   * Получить детальную информацию об анализе
   * @param {string} analysisId - ID анализа
   */
  async getAnalysisDetail(analysisId) {
    return await apiClient.get(`${BASE_URL}/analyses/${analysisId}/`)
  },

  /**
   * Обновить анализ
   * @param {string} analysisId - ID анализа
   * @param {object} data - данные для обновления
   */
  async updateAnalysis(analysisId, data) {
    return await apiClient.patch(`${BASE_URL}/analyses/${analysisId}/`, data)
  },

  /**
   * Удалить анализ
   * @param {string} analysisId - ID анализа
   */
  async deleteAnalysis(analysisId) {
    return await apiClient.delete(`${BASE_URL}/analyses/${analysisId}/`)
  },

  /**
   * Запустить анализ вручную
   * @param {string} analysisId - ID анализа
   */
  async startAnalysis(analysisId) {
    return await apiClient.post(`${BASE_URL}/analyses/${analysisId}/start_analysis/`)
  },

  /**
   * Получить статус анализа
   * @param {string} analysisId - ID анализа
   */
  async getAnalysisStatus(analysisId) {
    return await apiClient.get(`${BASE_URL}/analyses/${analysisId}/status/`)
  },

  /**
   * Получить результаты анализа
   * @param {string} analysisId - ID анализа
   */
  async getAnalysisResult(analysisId) {
    return await apiClient.get(`${BASE_URL}/analyses/${analysisId}/result/`)
  },

  /**
   * Получить файлы результатов анализа
   * @param {string} analysisId - ID анализа
   */
  async getAnalysisFiles(analysisId) {
    return await apiClient.get(`${BASE_URL}/analyses/${analysisId}/files/`)
  },

  /**
   * Скачать файл результата
   * @param {string} fileUrl - URL файла
   * @param {string} filename - имя файла для сохранения
   */
  async downloadFile(fileUrl, filename) {
    try {
      // Получаем полный URL для скачивания
      const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${apiClient.baseUrl}${fileUrl}`
      
      // Получаем токен из cookies
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1]
      
      const response = await fetch(fullUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const blob = await response.blob()
      
      // Создаем ссылку для скачивания
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Ошибка скачивания файла:', error)
      throw error
    }
  },

  /**
   * Валидация файла изображения
   * @param {File} file - файл для валидации
   * @returns {object} результат валидации
   */
  validateImageFile(file) {
    const maxSize = 10 * 1024 * 1024 // 10 МБ
    const allowedTypes = ['image/jpeg', 'image/png', 'image/bmp', 'image/tiff']
    
    const errors = []
    
    if (!file) {
      errors.push('Файл не выбран')
      return { valid: false, errors }
    }
    
    if (file.size > maxSize) {
      errors.push('Размер файла не должен превышать 10 МБ')
    }
    
    if (!allowedTypes.includes(file.type)) {
      errors.push('Поддерживаются только файлы форматов: JPEG, PNG, BMP, TIFF')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  },

  /**
   * Форматирование размера файла
   * @param {number} bytes - размер в байтах
   * @returns {string} отформатированный размер
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  },

  /**
   * Получить цвет статуса анализа
   * @param {string} status - статус анализа
   * @returns {string} CSS класс цвета
   */
  getStatusColor(status) {
    const statusColors = {
      'pending': 'text-warning',
      'processing': 'text-info', 
      'completed': 'text-success',
      'error': 'text-danger'
    }
    
    return statusColors[status] || 'text-secondary'
  },

  /**
   * Получить иконку статуса анализа
   * @param {string} status - статус анализа
   * @returns {string} CSS класс иконки
   */
  getStatusIcon(status) {
    const statusIcons = {
      'pending': 'fas fa-clock',
      'processing': 'fas fa-spinner fa-spin',
      'completed': 'fas fa-check-circle',
      'error': 'fas fa-exclamation-triangle'
    }
    
    return statusIcons[status] || 'fas fa-question-circle'
  },

  /**
   * Создать пакет анализов из нескольких изображений
   * @param {FormData} formData - данные формы с несколькими изображениями
   */
  async createBatchAnalysis(formData) {
    return await apiClient.post(`${BASE_URL}/analyses/batch_create/`, formData)
  },

  /**
   * Получить общий статус всех анализов пользователя
   */
  async getBatchStatus() {
    return await apiClient.get(`${BASE_URL}/analyses/batch_status/`)
  },

  /**
   * Запустить все ожидающие анализы
   */
  async startAllPending() {
    return await apiClient.post(`${BASE_URL}/analyses/start_all_pending/`)
  },

  /**
   * Удалить все неудачные анализы
   */
  async deleteAllFailed() {
    return await apiClient.post(`${BASE_URL}/analyses/delete_all_failed/`)
  },

  /**
   * Валидация нескольких файлов изображений
   * @param {FileList} files - список файлов для валидации
   * @returns {object} результат валидации
   */
  validateImageFiles(files) {
    const maxSize = 10 * 1024 * 1024 // 10 МБ
    const allowedTypes = ['image/jpeg', 'image/png', 'image/bmp', 'image/tiff']
    const maxFiles = 20
    
    const errors = []
    
    if (!files || files.length === 0) {
      errors.push('Файлы не выбраны')
      return { valid: false, errors }
    }
    
    if (files.length > maxFiles) {
      errors.push(`Максимальное количество файлов: ${maxFiles}`)
    }
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileNumber = i + 1
      
      if (file.size > maxSize) {
        errors.push(`Файл ${fileNumber}: размер не должен превышать 10 МБ`)
      }
      
      if (!allowedTypes.includes(file.type)) {
        errors.push(`Файл ${fileNumber}: поддерживаются только JPEG, PNG, BMP, TIFF`)
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      fileCount: files.length
    }
  },

  /**
   * Подготовка FormData для пакетной загрузки
   * @param {FileList} files - список файлов
   * @param {string} baseTitle - базовое название
   * @param {number} scaleValue - значение шкалы
   * @param {string} description - описание
   * @returns {FormData} подготовленные данные
   */
  prepareBatchFormData(files, baseTitle, scaleValue, description = '') {
    const formData = new FormData()
    
    // Добавляем все файлы
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i])
    }
    
    formData.append('base_title', baseTitle)
    formData.append('scale_value', scaleValue)
    formData.append('description', description)
    
    return formData
  }
} 