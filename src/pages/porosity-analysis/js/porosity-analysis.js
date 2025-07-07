import { apiClient } from '../../../js/api/manager.js'

/**
 * Класс для работы с API анализа поверхности
 */
class PorosityAnalysisAPI {
  constructor() {
    this.baseEndpoint = 'analysis_porosity/analyses/'
  }

  /**
   * Получить список всех анализов
   */
  async getAnalyses(params = {}) {
    return await apiClient.get(this.baseEndpoint, params)
  }

  /**
   * Получить анализ по ID
   */
  async getAnalysis(id) {
    return await apiClient.get(`${this.baseEndpoint}${id}/`)
  }

  /**
   * Создать новый анализ
   */
  async createAnalysis(data) {
    const response = await apiClient.post(this.baseEndpoint, data)
    return response
  }

  /**
   * Обновить анализ
   */
  async updateAnalysis(id, data) {
    return await apiClient.put(`${this.baseEndpoint}${id}/`, data)
  }

  /**
   * Удалить анализ
   */
  async deleteAnalysis(id) {
    const response = await apiClient.delete(`${this.baseEndpoint}${id}/`)
    return response
  }

  /**
   * Загрузить изображение для анализа
   */
  async uploadImage(analysisId, imageFile) {
    const formData = new FormData()
    formData.append('image', imageFile)
    const response = await apiClient.post(`${this.baseEndpoint}${analysisId}/upload_image/`, formData)
    return response
  }

  /**
   * Перезапустить анализ
   */
  async restartAnalysis(analysisId) {
    return await apiClient.post(`${this.baseEndpoint}${analysisId}/restart/`)
  }

  /**
   * Получить статус анализа
   */
  async getAnalysisStatus(analysisId) {
    return await apiClient.get(`${this.baseEndpoint}${analysisId}/status/`)
  }

  /**
   * Получить результаты анализа
   */
  async getAnalysisResults(analysisId) {
    return await apiClient.get(`${this.baseEndpoint}${analysisId}/results/`)
  }

  /**
   * Получить краткое описание анализа
   */
  async getAnalysisSummary(analysisId) {
    return await apiClient.get(`${this.baseEndpoint}${analysisId}/summary/`)
  }

  /**
   * Получить список файлов результатов для скачивания
   */
  async getDownloadResults(analysisId) {
    return await apiClient.downloadFile(`${this.baseEndpoint}${analysisId}/download_results/`)
  }

  /**
   * Скачать конкретный файл результатов
   */
  async downloadFile(analysisId, filePath) {
    const params = { file: filePath }
    return await apiClient.downloadFile(`${this.baseEndpoint}${analysisId}/download_file/`, params)
  }

  /**
   * Получить ожидающие анализы
   */
  async getPendingAnalyses() {
    return await apiClient.get(`${this.baseEndpoint}pending/`)
  }

  /**
   * Получить обрабатываемые анализы
   */
  async getProcessingAnalyses() {
    return await apiClient.get(`${this.baseEndpoint}processing/`)
  }

  /**
   * Получить завершенные анализы
   */
  async getCompletedAnalyses() {
    return await apiClient.get(`${this.baseEndpoint}completed/`)
  }

  /**
   * Получить анализы с ошибками
   */
  async getFailedAnalyses() {
    return await apiClient.get(`${this.baseEndpoint}failed/`)
  }

  /**
   * Получить статистику анализов
   */
  async getStatistics() {
    return await apiClient.get(`${this.baseEndpoint}statistics/`)
  }

  /**
   * Создать несколько анализов для множественных файлов
   */
  async createMultipleAnalyses(files, defaultScale = 100.0) {
    if (!Array.isArray(files) || files.length === 0) {
      return []
    }

    const promises = files.map(async (file) => {
      try {
        const analysisData = {
          name: `Анализ ${file.name.replace(/\.[^/.]+$/, '')}`,
          description: `Автоматически созданный анализ для файла ${file.name}`,
          scale_value: defaultScale,
          pixels_per_micron: null
        }

        const response = await this.createAnalysis(analysisData)
        
        if (response && response.success) {
          // Получаем ID анализа из ответа
          let analysisId = null
          
          if (response.data && typeof response.data === 'object') {
            analysisId = response.data.id
          } else if (typeof response.data === 'number') {
            analysisId = response.data
          }
          
          if (analysisId && typeof analysisId === 'number') {
            try {
              // Загружаем изображение для созданного анализа
              const uploadResponse = await this.uploadImage(analysisId, file)
              if (uploadResponse && uploadResponse.success) {
                return {
                  success: true,
                  message: 'Анализ создан и изображение загружено успешно',
                  data: response.data
                }
              } else {
                return {
                  success: false,
                  message: `Ошибка загрузки изображения для анализа ${analysisId}`,
                  data: response.data
                }
              }
            } catch (uploadError) {
              return {
                success: false,
                message: `Ошибка загрузки изображения для анализа ${analysisId}: ${uploadError.message || 'Неизвестная ошибка'}`,
                data: response.data
              }
            }
          } else {
            return {
              success: false,
              message: 'Не удалось получить ID анализа',
              data: response.data
            }
          }
        } else {
          return {
            success: false,
            message: response?.message || 'Ошибка создания анализа',
            data: response?.data
          }
        }
      } catch (error) {
        return {
          success: false,
          message: `Ошибка создания анализа для файла ${file.name}: ${error.message || 'Неизвестная ошибка'}`,
          data: null
        }
      }
    })

    try {
      return await Promise.all(promises)
    } catch (error) {
      return [{
        success: false,
        message: `Ошибка при создании анализов: ${error.message || 'Неизвестная ошибка'}`,
        data: null
      }]
    }
  }

  /**
   * Получить URL для скачивания файла
   */
  getDownloadUrl(analysisId, filePath) {
    return `${apiClient.baseUrl}${apiClient.apiPath}${this.baseEndpoint}${analysisId}/download_file/?file=${encodeURIComponent(filePath)}`
  }

  /**
   * Получить URL исходного изображения
   */
  getImageUrl(imageUuid) {
    return `${apiClient.baseUrl}media/porosity_analysis/initial_photo/${imageUuid}.png`
  }
}

// Создать и экспортировать синглтон-объект
export const porosityAnalysisAPI = new PorosityAnalysisAPI() 