import { apiClient } from '../../../js/api/manager.js'

/**
 * Класс для работы с API анализа поверхности
 */
class PorosityAnalysisAPI {
  constructor() {
    this.baseEndpoint = 'porosity_analysis/analyses/'
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
    try {
      console.log('Creating analysis with data:', data)
      const response = await apiClient.post(this.baseEndpoint, data)
      console.log('Analysis creation response:', response)
      return response
    } catch (error) {
      console.error('Error in createAnalysis:', error)
      // Возвращаем объект с ошибкой в том же формате
      return {
        success: false,
        message: error.message || 'Ошибка при создании анализа',
        data: null
      }
    }
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
    try {
      console.log(`Uploading image for analysis ${analysisId}:`, imageFile.name)
      const formData = new FormData()
      formData.append('image', imageFile)
      const response = await apiClient.post(`${this.baseEndpoint}${analysisId}/upload_image/`, formData)
      console.log(`Upload response for analysis ${analysisId}:`, response)
      return response
    } catch (error) {
      console.error(`Error uploading image for analysis ${analysisId}:`, error)
      // Возвращаем объект с ошибкой в том же формате
      return {
        success: false,
        message: error.message || 'Ошибка при загрузке изображения',
        data: null
      }
    }
  }

  /**
   * Перезапустить анализ
   */
  async restartAnalysis(analysisId) {
    try {
      const response = await apiClient.post(`${this.baseEndpoint}${analysisId}/restart/`)
      return response
    } catch (error) {
      console.error('Error in restartAnalysis:', error)
      // Возвращаем объект с ошибкой в том же формате, что и успешный ответ
      return {
        success: false,
        message: error.message || 'Ошибка при перезапуске анализа',
        data: null
      }
    }
  }

  /**
   * Массовый перезапуск анализов
   */
  async restartMultipleAnalyses(params) {
    try {
      const response = await apiClient.post(`${this.baseEndpoint}restart_multiple/`, params)
      return response
    } catch (error) {
      console.error('Error in restartMultipleAnalyses:', error)
      // Возвращаем объект с ошибкой в том же формате, что и успешный ответ
      return {
        success: false,
        message: error.message || 'Ошибка при массовом перезапуске анализов',
        data: null
      }
    }
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

    console.log(`Creating ${files.length} analyses with scale: ${defaultScale}`)

    const promises = files.map(async (file, index) => {
      try {
        console.log(`Processing file ${index + 1}/${files.length}: ${file.name}`)
        
        const analysisData = {
          name: `Анализ ${file.name.replace(/\.[^/.]+$/, '')}`,
          description: `Автоматически созданный анализ для файла ${file.name}`,
          scale_value: defaultScale,
          pixels_per_micron: null
        }

        const response = await this.createAnalysis(analysisData)
        console.log(`Analysis creation response for ${file.name}:`, response)
        
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
              console.log(`Upload response for ${file.name}:`, uploadResponse)
              
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
              console.error(`Upload error for ${file.name}:`, uploadError)
              return {
                success: false,
                message: `Ошибка загрузки изображения для анализа ${analysisId}: ${uploadError.message || 'Неизвестная ошибка'}`,
                data: response.data
              }
            }
          } else {
            console.warn(`No valid analysis ID for ${file.name}:`, response.data)
            return {
              success: false,
              message: 'Не удалось получить ID анализа',
              data: response.data
            }
          }
        } else {
          console.warn(`Analysis creation failed for ${file.name}:`, response)
          return {
            success: false,
            message: (response && response.message) ? response.message : 'Ошибка создания анализа',
            data: (response && response.data) ? response.data : null
          }
        }
      } catch (error) {
        console.error(`Error creating analysis for ${file.name}:`, error)
        return {
          success: false,
          message: `Ошибка создания анализа для файла ${file.name}: ${error.message || 'Неизвестная ошибка'}`,
          data: null
        }
      }
    })

    try {
      const results = await Promise.all(promises)
      console.log('All analyses creation results:', results)
      
      // Проверяем, что все результаты имеют правильный формат
      const validatedResults = results.map(result => {
        if (result && typeof result === 'object' && result.hasOwnProperty('success')) {
          return result
        } else {
          console.warn('Invalid result format:', result)
          return {
            success: false,
            message: 'Неверный формат результата',
            data: result
          }
        }
      })
      
      console.log('Validated results:', validatedResults)
      
      // Если у нас только один результат, возвращаем его как объект
      if (validatedResults.length === 1) {
        return validatedResults[0]
      }
      
      return validatedResults
    } catch (error) {
      console.error('Error in Promise.all for multiple analyses:', error)
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

  /**
   * Генерировать отчеты по анализу
   */
  async generateReports(analysisId) {
    return await apiClient.get(`${this.baseEndpoint}${analysisId}/generate_report/`)
  }

  /**
   * Получить URL для скачивания отчета
   */
  getReportDownloadUrl(analysisId, reportType) {
    return `${apiClient.baseUrl}${apiClient.apiPath}${this.baseEndpoint}${analysisId}/download_report/?type=${reportType}`
  }

  /**
   * Скачать отчет
   */
  async downloadReport(analysisId, reportType) {
    console.log(`API: Downloading report for analysis ${analysisId}, type: ${reportType}`)
    try {
      const response = await apiClient.downloadFile(`${this.baseEndpoint}${analysisId}/download_report/`, { type: reportType })
      console.log('API: Download response:', response)
      return response
    } catch (error) {
      console.error('API: Download error:', error)
      // Возвращаем объект с ошибкой в том же формате
      return {
        success: false,
        message: error.message || 'Ошибка при скачивании отчета',
        data: null
      }
    }
  }

  // Убран метод getLimits, так как ограничения сняты
}

// Создать и экспортировать синглтон-объект
export const porosityAnalysisAPI = new PorosityAnalysisAPI() 