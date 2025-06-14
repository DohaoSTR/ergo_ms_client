import { apiClient }    from '@/js/api/manager'
import { endpoints }    from '@/js/api/endpoints'

export default {
  /* GET список реальных колонок итоговой таблицы датасета */
  getColumns (datasetId) {
    return apiClient.get(endpoints.bi.ChartsColumns(datasetId))
  },

  /* Получить данные (строки) итоговой таблицы датасета */
  getRows(datasetId) {
    // Используй правильный endpoint, который возвращает массив данных
    // Например: /api/bi_analysis/dataset/600/data
    return apiClient.get(endpoints.bi.ChartsRows(datasetId))
  }
}